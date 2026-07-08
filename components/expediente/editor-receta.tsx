"use client";

// ============================================================
// editor-receta.tsx — EDITOR de recetas con vista de DOCUMENTO.
//
// QUÉ: modal grande que muestra la receta como un recetario médico
//   profesional: membrete con logo y datos de la clínica, fecha,
//   datos del paciente y del médico, tabla de medicamentos y firma.
//   TODOS los campos clínicos usan <TextoEditable>: clic sobre una
//   dosis -> se edita ahí mismo -> se guarda al instante (in-place).
// POR QUÉ guardado automático por campo: corregir "50 mg" a "75 mg"
//   no debería requerir botón "Guardar" — cada cambio se persiste al
//   confirmar el campo, y el indicador "Guardado ✓" da la evidencia.
// CÓMO SE CONECTA A SUPABASE: cada edición llama actualizarReceta()
//   del servicio (update del jsonb de medicamentos). El membrete usa
//   getConfiguracionClinica() (tabla `configuracion` a futuro).
// ============================================================

import * as React from "react";
import { Printer, Loader2, CircleCheck, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { TextoEditable } from "@/components/compartidos/texto-editable";
import { formatoFecha } from "@/lib/utils";
import { imprimirReceta } from "@/lib/imprimir-receta";
import { actualizarReceta } from "@/services/db";
import { getConfiguracionClinica } from "@/services/config";
import { getUsuarios } from "@/services/auth";
import type { Receta, MedicamentoRecetado, ConfiguracionClinica } from "@/types";

interface Props {
  /** null = editor cerrado */
  receta: Receta | null;
  nombreMascota: string;
  nombreEspecie: string;
  nombreRaza: string;
  nombreDueno: string;
  onCerrar: () => void;
  /** Se llama al cerrar SI hubo cambios, para que el expediente recargue */
  onActualizada: () => void;
}

export function EditorReceta({
  receta, nombreMascota, nombreEspecie, nombreRaza, nombreDueno, onCerrar, onActualizada,
}: Props) {
  // Copia LOCAL de la receta: las ediciones se aplican aquí primero
  // (respuesta visual inmediata) y luego se persisten en el servicio.
  const [recetaLocal, setRecetaLocal] = React.useState<Receta | null>(null);
  const [config, setConfig] = React.useState<ConfiguracionClinica | null>(null);
  const [nombreMedico, setNombreMedico] = React.useState("—");
  // Indicador de guardado: "inactivo" | "guardando" | "guardado"
  const [estadoGuardado, setEstadoGuardado] = React.useState<"inactivo" | "guardando" | "guardado">("inactivo");
  const huboCambios = React.useRef(false);

  // Al abrir: clonar la receta, cargar membrete y resolver el médico
  React.useEffect(() => {
    if (!receta) return;
    setRecetaLocal(structuredClone(receta)); // clon profundo: no mutar la prop
    setEstadoGuardado("inactivo");
    huboCambios.current = false;
    getConfiguracionClinica().then(setConfig);
    getUsuarios().then((usuarios) => {
      setNombreMedico(usuarios.find((u) => u.id === receta.veterinarioId)?.nombre ?? "—");
    });
  }, [receta]);

  /**
   * persistir: guarda la receta local en el servicio y maneja el
   * indicador. Es EL ÚNICO punto de escritura del editor.
   */
  const persistir = async (nueva: Receta) => {
    setRecetaLocal(nueva);        // 1) la UI responde de inmediato
    setEstadoGuardado("guardando");
    await actualizarReceta(nueva.id, {
      medicamentos: nueva.medicamentos,
      observaciones: nueva.observaciones,
    });                           // 2) se persiste en el "backend"
    huboCambios.current = true;
    setEstadoGuardado("guardado");
  };

  /** editarMedicamento: cambia UN campo de UNA fila y persiste */
  const editarMedicamento = (indice: number, campo: keyof MedicamentoRecetado, valor: string) => {
    if (!recetaLocal) return;
    const medicamentos = recetaLocal.medicamentos.map((m, i) =>
      i === indice ? { ...m, [campo]: valor } : m
    );
    return persistir({ ...recetaLocal, medicamentos });
  };

  /** editarObservaciones: campo largo al pie de la receta */
  const editarObservaciones = (valor: string) => {
    if (!recetaLocal) return;
    return persistir({ ...recetaLocal, observaciones: valor || undefined });
  };

  /** cerrar: avisa al expediente solo si de verdad se editó algo */
  const cerrar = () => {
    if (huboCambios.current) onActualizada();
    onCerrar();
  };

  return (
    <Dialog open={!!receta} onOpenChange={(abierto) => !abierto && cerrar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>Receta médica</span>
            {/* Indicador de guardado en vivo */}
            {estadoGuardado === "guardando" && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
              </span>
            )}
            {estadoGuardado === "guardado" && (
              <span className="flex items-center gap-1 text-xs font-normal text-green-700">
                <CircleCheck className="h-3 w-3" /> Guardado
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Haz clic sobre cualquier dosis, frecuencia u observación para editarla ahí mismo.
          </DialogDescription>
        </DialogHeader>

        {recetaLocal && (
          // ---------- LA HOJA: réplica visual de un recetario ----------
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {/* Membrete: logo (si existe) + datos de la clínica */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                {config?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo WebP local
                  <img src={config.logoUrl} alt="Logo" className="h-12 w-12 rounded object-contain" />
                ) : (
                  <PawPrint className="h-10 w-10 text-blue-600" />
                )}
                <div>
                  <p className="text-lg font-bold leading-tight">{config?.nombre || "VetGram"}</p>
                  {config?.direccion && <p className="text-xs text-muted-foreground">{config.direccion}</p>}
                  {config?.telefono && <p className="text-xs text-muted-foreground">Tel: {config.telefono}</p>}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-semibold uppercase tracking-wide">Receta Médica</p>
                <p>{formatoFecha(recetaLocal.fecha)}</p>
              </div>
            </div>

            {/* Datos del paciente y del médico */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b py-3 text-sm">
              <p><span className="font-semibold">Paciente:</span> {nombreMascota}</p>
              <p><span className="font-semibold">Propietario:</span> {nombreDueno}</p>
              <p><span className="font-semibold">Especie / Raza:</span> {nombreEspecie} · {nombreRaza}</p>
              <p><span className="font-semibold">Médico:</span> {nombreMedico}</p>
            </div>

            {/* Medicamentos: CADA celda es editable con un clic */}
            <div className="py-3">
              <p className="mb-2 text-sm font-semibold">Rx</p>
              <div className="space-y-3">
                {recetaLocal.medicamentos.map((med, i) => (
                  <div key={i} className="rounded-md border-l-4 border-blue-600 bg-slate-50 p-3">
                    {/* Nombre del medicamento (editable, en negritas) */}
                    <TextoEditable
                      valor={med.nombre}
                      onGuardar={(v) => editarMedicamento(i, "nombre", v)}
                      className="font-semibold"
                    />
                    {/* Dosis / frecuencia / duración en una línea editable por partes */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-slate-700">
                      <TextoEditable valor={med.dosis} placeholder="dosis"
                        onGuardar={(v) => editarMedicamento(i, "dosis", v)} />
                      <span>·</span>
                      <TextoEditable valor={med.frecuencia} placeholder="frecuencia"
                        onGuardar={(v) => editarMedicamento(i, "frecuencia", v)} />
                      <span>·</span>
                      <TextoEditable valor={med.duracion} placeholder="duración"
                        onGuardar={(v) => editarMedicamento(i, "duracion", v)} />
                    </div>
                    {/* Indicaciones (editable, opcional) */}
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">Indicaciones: </span>
                      <TextoEditable valor={med.indicaciones ?? ""} placeholder="agregar indicaciones"
                        onGuardar={(v) => editarMedicamento(i, "indicaciones", v)} className="text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones generales (editable multilínea) */}
            <div className="border-t py-3 text-sm">
              <span className="font-semibold">Observaciones: </span>
              <TextoEditable
                multilinea
                valor={recetaLocal.observaciones ?? ""}
                placeholder="agregar observaciones"
                onGuardar={editarObservaciones}
              />
            </div>

            {/* Área de firma (como en el documento impreso) */}
            <div className="mt-10 text-center text-xs text-muted-foreground">
              <div className="mx-auto w-52 border-t border-slate-400 pt-1">
                Firma del Médico Veterinario
              </div>
            </div>
          </div>
        )}

        {/* Acciones: imprimir usa SIEMPRE la versión ya guardada */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => recetaLocal && imprimirReceta(recetaLocal, nombreMascota, nombreDueno)}
          >
            <Printer /> Imprimir / PDF
          </Button>
          <Button className="flex-1" onClick={cerrar}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
