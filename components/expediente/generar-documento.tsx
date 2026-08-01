"use client";

// ============================================================
// generar-documento.tsx — DOCUMENTOS LEGALES del expediente.
//
// QUÉ: sección del expediente que lista los formatos disponibles
//   (eutanasia, certificado sanitario, estética…). Al elegir uno se
//   abre un modal donde:
//     1. Todos los datos llegan YA LLENOS desde el expediente.
//     2. CUALQUIERA de ellos se puede corregir antes de imprimir,
//        empezando por la FECHA.
//     3. Se ve la vista previa exacta del documento.
//
// POR QUÉ todo es editable: el sistema anterior imprimía la fecha del
//   servidor sin poder cambiarla, y la clínica a veces necesita expedir
//   con otra fecha (reimpresión, documento que se llenó en papel otro
//   día, corrección de un dato del dueño). Aquí el registro solo
//   PRELLENA; la última palabra la tiene quien firma.
//
// ORGANIZACIÓN DEL FORMULARIO: arriba lo que se cambia a diario
//   (fecha, médico, motivo, observaciones); los datos del paciente y
//   del propietario van en una sección desplegable, porque casi
//   siempre están bien y solo estorbarían.
//
// CÓMO SE CONECTA A SUPABASE: lee `plantillas_documento`, `veterinarios`
//   y la configuración. La impresión ocurre en el navegador.
// ============================================================

import * as React from "react";
import {
  FileSignature, Printer, Loader2, Scale, ChevronDown, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { SelectNativo } from "@/components/compartidos/select-nativo";
import { calcularEdad } from "@/lib/utils";
import {
  imprimirDocumento, rellenarPlantilla, type DatosDocumento,
} from "@/lib/documentos-legales";
import { getPlantillas, getVeterinarios } from "@/services/db";
import { getConfiguracionClinica } from "@/services/config";
import type {
  Mascota, Cliente, PlantillaDocumento, Veterinario, ConfiguracionClinica,
} from "@/types";

interface Props {
  mascota: Mascota;
  nombreEspecie: string;
  nombreRaza: string;
  dueno: Cliente | null;
  /** Peso de la consulta más reciente, para llenar {{PESO}} */
  pesoActual?: number;
}

/** Campo de texto corto reutilizado en las rejillas del formulario */
function Campo({
  etiqueta, valor, onCambio, placeholder,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
      <Input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function GenerarDocumento({
  mascota, nombreEspecie, nombreRaza, dueno, pesoActual,
}: Props) {
  // ---- Catálogos ----
  const [plantillas, setPlantillas] = React.useState<PlantillaDocumento[]>([]);
  const [veterinarios, setVeterinarios] = React.useState<Veterinario[]>([]);
  const [config, setConfig] = React.useState<ConfiguracionClinica | null>(null);
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado del modal ----
  const [plantillaElegida, setPlantillaElegida] = React.useState<PlantillaDocumento | null>(null);
  const [veterinarioId, setVeterinarioId] = React.useState("");
  // TODOS los datos del documento, editables
  const [datos, setDatos] = React.useState<DatosDocumento | null>(null);
  // La sección de paciente/propietario arranca cerrada (suele estar bien)
  const [datosAbiertos, setDatosAbiertos] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [pls, vets, cfg] = await Promise.all([
        getPlantillas(), getVeterinarios(), getConfiguracionClinica(),
      ]);
      setPlantillas(pls.filter((p) => p.activo));
      const activos = vets.filter((v) => v.activo);
      setVeterinarios(activos);
      setVeterinarioId(activos[0]?.id ?? "");
      setConfig(cfg);
      setCargando(false);
    })();
  }, []);

  /**
   * abrirGenerador: prepara el modal PRELLENANDO todo con los datos del
   * expediente. A partir de aquí el usuario puede corregir lo que sea.
   */
  const abrirGenerador = (plantilla: PlantillaDocumento) => {
    const vet = veterinarios.find((v) => v.id === veterinarioId);
    setDatos({
      // Por defecto hoy, pero es un campo de fecha que se puede cambiar
      fecha: new Date().toISOString().slice(0, 10),
      lugar: config?.ciudad ?? "",
      mascota: mascota.nombre,
      especie: nombreEspecie,
      raza: nombreRaza,
      sexo: mascota.sexo === "macho" ? "Macho" : "Hembra",
      edad: calcularEdad(mascota.fechaNacimiento),
      peso: pesoActual !== undefined ? `${pesoActual} kg` : "",
      color: mascota.color ?? "",
      dueno: dueno ? `${dueno.nombre} ${dueno.apellidos}` : "",
      telefonoDueno: dueno?.telefono ?? "",
      direccionDueno: dueno?.direccion ?? "",
      colonia: "",
      localidad: "",
      municipio: "",
      origen: "",
      destino: "",
      veterinario: vet?.nombre ?? "",
      cedula: vet?.cedulaProfesional ?? "",
      especialidad: vet?.especialidad ?? "",
      motivo: "",
      observaciones: "",
    });
    setDatosAbiertos(false);
    setPlantillaElegida(plantilla);
  };

  /** editar: cambia UN campo del documento */
  const editar = (campo: keyof DatosDocumento, valor: string) =>
    setDatos((d) => (d ? { ...d, [campo]: valor } : d));

  /**
   * cambiarVeterinario: al elegir otro médico se actualizan su nombre,
   * cédula y especialidad dentro del documento.
   */
  const cambiarVeterinario = (id: string) => {
    setVeterinarioId(id);
    const vet = veterinarios.find((v) => v.id === id);
    setDatos((d) =>
      d ? {
        ...d,
        veterinario: vet?.nombre ?? "",
        cedula: vet?.cedulaProfesional ?? "",
        especialidad: vet?.especialidad ?? "",
      } : d
    );
  };

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Scale className="h-5 w-5 text-indigo-600" /> Documentos legales
      </h3>

      {cargando ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : plantillas.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay formatos configurados. El administrador puede crearlos en
          Formatos legales.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {plantillas.map((p) => (
            <button
              key={p.id}
              onClick={() => abrirGenerador(p)}
              className="flex items-start gap-2 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50"
            >
              <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{p.nombre}</span>
                {p.fundamentoLegal && (
                  <span className="block text-xs text-muted-foreground">{p.fundamentoLegal}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ---------- Modal: editar datos + vista previa ---------- */}
      <Dialog
        open={!!plantillaElegida}
        onOpenChange={(abierto) => !abierto && setPlantillaElegida(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{plantillaElegida?.nombre}</DialogTitle>
            <DialogDescription>
              Los datos llegan llenos del expediente. Corrige lo que necesites
              —incluida la fecha— y revisa la vista previa antes de imprimir.
            </DialogDescription>
          </DialogHeader>

          {datos && plantillaElegida && (
            <div className="space-y-4">
              {/* ===== Lo que se ajusta en cada documento ===== */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="fechaDoc" className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" /> Fecha del documento
                  </Label>
                  <Input id="fechaDoc" type="date" value={datos.fecha}
                    onChange={(e) => editar("fecha", e.target.value)} />
                </div>
                <Campo etiqueta="Lugar" valor={datos.lugar}
                  onCambio={(v) => editar("lugar", v)}
                  placeholder="Tuxtla Gutiérrez, Chiapas" />
                {plantillaElegida.requiereFirmaVeterinario && (
                  <div className="space-y-1">
                    <Label htmlFor="vetFirma" className="text-xs text-muted-foreground">
                      Médico que firma
                    </Label>
                    <SelectNativo id="vetFirma" value={veterinarioId}
                      onChange={(e) => cambiarVeterinario(e.target.value)}>
                      {veterinarios.length === 0 && (
                        <option value="">Sin veterinarios registrados</option>
                      )}
                      {veterinarios.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre} — Céd. {v.cedulaProfesional}
                        </option>
                      ))}
                    </SelectNativo>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="motivoDoc" className="text-xs text-muted-foreground">
                    Motivo / servicio / diagnóstico
                  </Label>
                  <textarea id="motivoDoc" rows={2} value={datos.motivo}
                    onChange={(e) => editar("motivo", e.target.value)}
                    placeholder="Se imprime en {{MOTIVO}}"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="obsDoc" className="text-xs text-muted-foreground">
                    Observaciones / indicaciones
                  </Label>
                  <textarea id="obsDoc" rows={2} value={datos.observaciones}
                    onChange={(e) => editar("observaciones", e.target.value)}
                    placeholder="Se imprime en {{OBSERVACIONES}}"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>

              {/* ===== Datos prellenados: se abren solo si hay que corregir ===== */}
              <div className="rounded-lg border">
                <button
                  type="button"
                  onClick={() => setDatosAbiertos(!datosAbiertos)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
                >
                  <span className="flex-1">
                    Datos del paciente y del propietario
                    <span className="ml-2 font-normal text-muted-foreground">
                      (llenados desde el expediente)
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${datosAbiertos ? "rotate-180" : ""}`} />
                </button>

                {datosAbiertos && (
                  <div className="space-y-3 border-t p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Paciente
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Campo etiqueta="Nombre" valor={datos.mascota} onCambio={(v) => editar("mascota", v)} />
                      <Campo etiqueta="Especie" valor={datos.especie} onCambio={(v) => editar("especie", v)} />
                      <Campo etiqueta="Raza" valor={datos.raza} onCambio={(v) => editar("raza", v)} />
                      <Campo etiqueta="Sexo" valor={datos.sexo} onCambio={(v) => editar("sexo", v)} />
                      <Campo etiqueta="Edad" valor={datos.edad} onCambio={(v) => editar("edad", v)} />
                      <Campo etiqueta="Color" valor={datos.color} onCambio={(v) => editar("color", v)} />
                      <Campo etiqueta="Peso" valor={datos.peso} onCambio={(v) => editar("peso", v)} />
                    </div>

                    <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Propietario
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Campo etiqueta="Nombre" valor={datos.dueno} onCambio={(v) => editar("dueno", v)} />
                      <Campo etiqueta="Celular" valor={datos.telefonoDueno} onCambio={(v) => editar("telefonoDueno", v)} />
                      <Campo etiqueta="Calle y número" valor={datos.direccionDueno} onCambio={(v) => editar("direccionDueno", v)} />
                      <Campo etiqueta="Colonia" valor={datos.colonia} onCambio={(v) => editar("colonia", v)} />
                      <Campo etiqueta="Localidad" valor={datos.localidad} onCambio={(v) => editar("localidad", v)} />
                      <Campo etiqueta="Municipio" valor={datos.municipio} onCambio={(v) => editar("municipio", v)} />
                    </div>

                    <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Traslado (solo certificados de viaje)
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Campo etiqueta="Dirección de origen" valor={datos.origen} onCambio={(v) => editar("origen", v)} />
                      <Campo etiqueta="Dirección destino" valor={datos.destino} onCambio={(v) => editar("destino", v)} />
                    </div>
                  </div>
                )}
              </div>

              {/* ===== Vista previa: el texto exacto que se imprimirá ===== */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vista previa</Label>
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border bg-white p-4 text-xs leading-relaxed text-slate-800">
                  {rellenarPlantilla(plantillaElegida.contenido, datos, config)}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1"
                  onClick={() => setPlantillaElegida(null)}>
                  Cerrar
                </Button>
                <Button className="flex-1"
                  onClick={() => imprimirDocumento(plantillaElegida, datos, config)}>
                  <Printer /> Imprimir / PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
