"use client";

// ============================================================
// app/(dashboard)/mascotas/[id]/page.tsx — EXPEDIENTE CLÍNICO.
//
// QUÉ: el perfil completo de la mascota, destino del Buscador Global
//   y del listado de mascotas. Reúne en una sola vista:
//   - Ficha de identidad (especie, raza, sexo, dueño con enlace)
//   - Historial de consultas (HistorialConsultas)
//   - Recetas médicas (ListaRecetas, con Imprimir/PDF)
//   - Vacunas con alertas de refuerzo (ListaVacunas)
//   y los 3 modales para agregar registros SIN salir de la página.
// POR QUÉ esta página solo ORQUESTA: cada sección es un componente
//   aislado en components/expediente/; aquí solo se cargan datos y
//   se abren/cierran los modales.
// CÓMO SE CONECTA A SUPABASE: todas las lecturas vienen de
//   services/db.ts; en Supabase serán selects filtrados por
//   mascota_id (con RLS por clínica cuando haya multiusuario).
// ============================================================

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Stethoscope, FileText, Syringe, Plus, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PetPhotoUploader } from "@/components/mascotas/pet-photo-uploader";
import { HistorialConsultas } from "@/components/expediente/historial-consultas";
import { FormularioConsultaCompleta } from "@/components/consultas/formulario-consulta-completa";
import { AntecedentesMascota } from "@/components/consultas/antecedentes-mascota";
import { TablaAnamnesis } from "@/components/consultas/tabla-anamnesis";
import { ListaRecetas } from "@/components/expediente/lista-recetas";
import { FormularioReceta } from "@/components/expediente/formulario-receta";
import { EditorReceta } from "@/components/expediente/editor-receta";
import { ListaVacunas, FormularioVacuna } from "@/components/expediente/vacunas-mascota";
import { DocumentosMascota } from "@/components/expediente/documentos-mascota";
import { formatoFecha } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import {
  getMascotaPorId, getClientePorId, getEspecies, getRazas,
  getConsultasDeMascota, getRecetasDeMascota, getVacunasDeMascota,
} from "@/services/db";
import type { Mascota, Cliente, Consulta, Receta, Vacuna } from "@/types";

export default function PaginaExpediente() {
  const params = useParams<{ id: string }>();
  const { usuario } = useAuth();

  // ---- Datos del expediente ----
  const [mascota, setMascota] = React.useState<Mascota | null>(null);
  const [dueno, setDueno] = React.useState<Cliente | null>(null);
  const [nombreEspecie, setNombreEspecie] = React.useState("—");
  const [nombreRaza, setNombreRaza] = React.useState("—");
  const [consultas, setConsultas] = React.useState<Consulta[]>([]);
  const [recetas, setRecetas] = React.useState<Receta[]>([]);
  const [vacunas, setVacunas] = React.useState<Vacuna[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // ---- Modales (uno por tipo de registro clínico) ----
  const [modalConsulta, setModalConsulta] = React.useState(false);
  // VINCULACIÓN ESTRICTA consulta -> receta: la receta solo se abre
  // CON una consulta de origen (null = modal de receta cerrado).
  // Se llena de dos formas: automáticamente al guardar una consulta
  // nueva, o con el botón "Receta" de una consulta del historial.
  const [consultaParaReceta, setConsultaParaReceta] = React.useState<Consulta | null>(null);
  const [modalVacuna, setModalVacuna] = React.useState(false);
  // Receta abierta en el editor profesional (null = editor cerrado)
  const [recetaAbierta, setRecetaAbierta] = React.useState<Receta | null>(null);
  // Vista del historial: "tarjetas" (detalle) o "anamnesis" (tabla resumen)
  const [vistaConsultas, setVistaConsultas] = React.useState<"tarjetas" | "anamnesis">("tarjetas");

  /**
   * cargarExpediente: trae TODO el expediente en paralelo.
   * Se reutiliza como callback onGuardado de los 3 modales para
   * refrescar la vista tras cada registro nuevo.
   */
  const cargarExpediente = React.useCallback(async () => {
    setCargando(true);
    const m = await getMascotaPorId(params.id);
    if (!m) {
      setMascota(null);
      setCargando(false);
      return;
    }
    // Con la mascota en mano pedimos el resto en paralelo
    const [cli, esp, raz, cons, rec, vac] = await Promise.all([
      getClientePorId(m.clienteId),
      getEspecies(),
      getRazas(),
      getConsultasDeMascota(m.id),
      getRecetasDeMascota(m.id),
      getVacunasDeMascota(m.id),
    ]);
    setMascota(m);
    setDueno(cli ?? null);
    setNombreEspecie(esp.find((e) => e.id === m.especieId)?.nombre ?? "—");
    setNombreRaza(raz.find((r) => r.id === m.razaId)?.nombre ?? "—");
    setConsultas(cons);
    setRecetas(rec);
    setVacunas(vac);
    setCargando(false);
  }, [params.id]);

  React.useEffect(() => {
    cargarExpediente();
  }, [cargarExpediente]);

  // Regla de roles: recepción NO captura actos clínicos
  const puedeRegistrarClinico = tienePermiso(usuario, ["administrador", "veterinario"]);

  if (cargando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mascota) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Mascota no encontrada.</p>
        <Button asChild variant="outline">
          <Link href="/mascotas"><ArrowLeft /> Volver a mascotas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/mascotas"><ArrowLeft /> Mascotas</Link>
      </Button>

      {/* ---------- Ficha de identidad ---------- */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          {/* Foto de perfil con compresión WebP en el navegador.
              Componente aislado: components/mascotas/pet-photo-uploader.tsx */}
          <PetPhotoUploader
            mascotaId={mascota.id}
            fotoActual={mascota.fotoUrl}
            nombreMascota={mascota.nombre}
            onFotoGuardada={cargarExpediente}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold">{mascota.nombre}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{nombreEspecie}</Badge>
              <Badge variant="outline">{nombreRaza}</Badge>
              <span className="capitalize text-muted-foreground">{mascota.sexo}</span>
              {mascota.fechaNacimiento && (
                <span className="text-muted-foreground">
                  Nac. {formatoFecha(mascota.fechaNacimiento)}
                </span>
              )}
              {mascota.color && <span className="text-muted-foreground">· {mascota.color}</span>}
            </div>
            {dueno && (
              <Link
                href={`/clientes/${dueno.id}`}
                className="mt-1 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
              >
                <User className="h-3.5 w-3.5" /> {dueno.nombre} {dueno.apellidos} · {dueno.telefono}
              </Link>
            )}
          </div>
          {/* Antecedentes: información base del paciente (Dialog propio) */}
          {puedeRegistrarClinico && (
            <AntecedentesMascota mascotaId={mascota.id} nombreMascota={mascota.nombre} />
          )}
        </CardContent>
      </Card>

      {/* ---------- Consultas ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Stethoscope className="h-5 w-5 text-green-600" /> Historial de consultas
          </h3>
          <div className="flex items-center gap-2">
            {/* Alternador de vista: tarjetas con detalle o tabla de anamnesis */}
            <div className="flex rounded-md border p-0.5">
              <Button
                variant={vistaConsultas === "tarjetas" ? "secondary" : "ghost"}
                size="sm"
                className="h-7"
                onClick={() => setVistaConsultas("tarjetas")}
              >
                Tarjetas
              </Button>
              <Button
                variant={vistaConsultas === "anamnesis" ? "secondary" : "ghost"}
                size="sm"
                className="h-7"
                onClick={() => setVistaConsultas("anamnesis")}
              >
                Anamnesis
              </Button>
            </div>
            {puedeRegistrarClinico && (
              <Button size="sm" onClick={() => setModalConsulta(true)}>
                <Plus /> Nueva consulta
              </Button>
            )}
          </div>
        </div>
        {/* La misma información en dos formatos: detalle o evolución comparable */}
        {vistaConsultas === "tarjetas" ? (
          <HistorialConsultas
            consultas={consultas}
            // El botón "Receta" por consulta solo para roles clínicos
            onNuevaReceta={puedeRegistrarClinico ? setConsultaParaReceta : undefined}
          />
        ) : (
          <TablaAnamnesis consultas={consultas} />
        )}
      </section>

      {/* ---------- Recetas ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-blue-600" /> Recetas médicas
          </h3>
          {/* Ya NO hay botón "Nueva receta" suelto: la receta nace de una
              consulta (al guardarla se abre sola, o con el botón "Receta"
              de cada consulta del historial). Vinculación estricta. */}
          {puedeRegistrarClinico && (
            <p className="text-xs text-muted-foreground">
              Las recetas se emiten desde una consulta (botón &quot;Receta&quot; del historial).
            </p>
          )}
        </div>
        <ListaRecetas
          recetas={recetas}
          nombreMascota={mascota.nombre}
          nombreDueno={dueno ? `${dueno.nombre} ${dueno.apellidos}` : "—"}
          onVer={setRecetaAbierta}
        />
      </section>

      {/* ---------- Vacunas ---------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Syringe className="h-5 w-5 text-purple-600" /> Vacunas
          </h3>
          {puedeRegistrarClinico && (
            <Button size="sm" onClick={() => setModalVacuna(true)}>
              <Plus /> Registrar vacuna
            </Button>
          )}
        </div>
        <ListaVacunas vacunas={vacunas} />
      </section>

      {/* ---------- Documentos médicos (PDFs y fotos de laboratorio) ----------
          Componente autosuficiente: carga y gestiona sus propios archivos
          ligados a esta mascota. */}
      <DocumentosMascota mascotaId={mascota.id} />

      {/* ---------- Modales de captura (no recargan la página) ----------
          La consulta usa el formulario clínico COMPLETO (Sheet ancho con
          signos vitales y revisión por sistemas). */}
      <FormularioConsultaCompleta
        abierto={modalConsulta}
        mascotaId={mascota.id}
        onCerrar={() => setModalConsulta(false)}
        onGuardado={(consultaCreada) => {
          // FLUJO ENCADENADO: al guardar la consulta se refresca el
          // expediente Y se abre automáticamente el modal de receta
          // ligado al id de la consulta recién creada (consulta_id).
          cargarExpediente();
          setConsultaParaReceta(consultaCreada);
        }}
      />
      {/* La receta SIEMPRE llega con su consulta de origen */}
      <FormularioReceta
        abierto={!!consultaParaReceta}
        mascotaId={mascota.id}
        consultaId={consultaParaReceta?.id ?? ""}
        onCerrar={() => setConsultaParaReceta(null)}
        onGuardado={cargarExpediente}
      />
      <FormularioVacuna
        abierto={modalVacuna}
        mascotaId={mascota.id}
        onCerrar={() => setModalVacuna(false)}
        onGuardado={cargarExpediente}
      />

      {/* Editor profesional de recetas: vista de documento con
          edición in-place; al cerrar (si hubo cambios) recarga */}
      <EditorReceta
        receta={recetaAbierta}
        nombreMascota={mascota.nombre}
        nombreEspecie={nombreEspecie}
        nombreRaza={nombreRaza}
        nombreDueno={dueno ? `${dueno.nombre} ${dueno.apellidos}` : "—"}
        onCerrar={() => setRecetaAbierta(null)}
        onActualizada={cargarExpediente}
      />
    </div>
  );
}
