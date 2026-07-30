"use client";

// ============================================================
// generar-documento.tsx — DOCUMENTOS LEGALES del expediente.
//
// QUÉ: sección del expediente que lista los formatos legales
//   disponibles (eutanasia, certificado de salud, estética…).
//   Al elegir uno se abre un modal donde el veterinario:
//     1. elige quién firma,
//     2. llena los dos campos libres del formato, y
//     3. ve la VISTA PREVIA con los datos del paciente ya sustituidos
//   antes de imprimir o guardar como PDF.
// PARA QUÉ la vista previa: un documento legal no se imprime a ciegas;
//   el médico debe leer exactamente lo que va a firmar.
// CÓMO SE CONECTA A SUPABASE: lee `plantillas_documento`, `veterinarios`
//   y la configuración de la clínica. La impresión ocurre en el
//   navegador (lib/documentos-legales.ts), no en el servidor.
// ============================================================

import * as React from "react";
import { FileSignature, Printer, Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function GenerarDocumento({
  mascota, nombreEspecie, nombreRaza, dueno, pesoActual,
}: Props) {
  // ---- Catálogos que necesita el generador ----
  const [plantillas, setPlantillas] = React.useState<PlantillaDocumento[]>([]);
  const [veterinarios, setVeterinarios] = React.useState<Veterinario[]>([]);
  const [config, setConfig] = React.useState<ConfiguracionClinica | null>(null);
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado del modal de generación ----
  const [plantillaElegida, setPlantillaElegida] = React.useState<PlantillaDocumento | null>(null);
  const [veterinarioId, setVeterinarioId] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [observaciones, setObservaciones] = React.useState("");

  // Carga inicial: formatos, médicos activos y datos de la clínica
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

  /** abrirGenerador: prepara el modal con el formato elegido */
  const abrirGenerador = (plantilla: PlantillaDocumento) => {
    setPlantillaElegida(plantilla);
    setMotivo("");
    setObservaciones("");
  };

  /**
   * datos: arma el paquete de información del paciente que sustituirá
   * los marcadores. Se recalcula al cambiar médico o campos libres.
   */
  const datos: DatosDocumento = React.useMemo(() => {
    const vet = veterinarios.find((v) => v.id === veterinarioId);
    return {
      mascota: mascota.nombre,
      especie: nombreEspecie,
      raza: nombreRaza,
      sexo: mascota.sexo === "macho" ? "Macho" : "Hembra",
      edad: calcularEdad(mascota.fechaNacimiento),
      peso: pesoActual !== undefined ? `${pesoActual} kg` : "",
      color: mascota.color ?? "",
      dueno: dueno ? `${dueno.nombre} ${dueno.apellidos}` : "",
      telefonoDueno: dueno?.telefono ?? "",
      veterinario: vet?.nombre ?? "",
      cedula: vet?.cedulaProfesional ?? "",
      especialidad: vet?.especialidad ?? "",
      motivo,
      observaciones,
    };
  }, [
    veterinarios, veterinarioId, mascota, nombreEspecie, nombreRaza,
    dueno, pesoActual, motivo, observaciones,
  ]);

  /** imprimir: manda el documento ya relleno al diálogo de impresión */
  const imprimir = () => {
    if (plantillaElegida) imprimirDocumento(plantillaElegida, datos, config);
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
        // Un botón por formato disponible
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

      {/* ---------- Modal: llenar campos + vista previa ---------- */}
      <Dialog
        open={!!plantillaElegida}
        onOpenChange={(abierto) => !abierto && setPlantillaElegida(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{plantillaElegida?.nombre}</DialogTitle>
            <DialogDescription>
              Revisa el documento antes de imprimirlo. Los datos del paciente se
              llenan solos; los campos vacíos salen como línea para llenar a mano.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Médico que firma (solo si el formato lleva su firma) */}
            {plantillaElegida?.requiereFirmaVeterinario && (
              <div className="space-y-1">
                <Label htmlFor="vetFirma">Médico que firma</Label>
                <SelectNativo id="vetFirma" value={veterinarioId}
                  onChange={(e) => setVeterinarioId(e.target.value)}>
                  {veterinarios.length === 0 && <option value="">Sin veterinarios registrados</option>}
                  {veterinarios.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre} — Céd. {v.cedulaProfesional}
                    </option>
                  ))}
                </SelectNativo>
              </div>
            )}

            {/* Los dos campos libres del formato */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="motivoDoc">Motivo / procedimiento / hallazgos</Label>
                <textarea id="motivoDoc" rows={3} value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Se sustituye en {{MOTIVO}}"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="obsDoc">Observaciones / indicaciones</Label>
                <textarea id="obsDoc" rows={3} value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Se sustituye en {{OBSERVACIONES}}"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>

            {/* VISTA PREVIA: el texto real que se imprimirá.
                whitespace-pre-wrap conserva los saltos de línea. */}
            {plantillaElegida && (
              <div className="space-y-1">
                <Label>Vista previa</Label>
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border bg-white p-4 text-xs leading-relaxed text-slate-800">
                  {rellenarPlantilla(plantillaElegida.contenido, datos, config)}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1"
                onClick={() => setPlantillaElegida(null)}>
                Cerrar
              </Button>
              <Button className="flex-1" onClick={imprimir}>
                <Printer /> Imprimir / PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
