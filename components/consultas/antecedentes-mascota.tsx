"use client";

// ============================================================
// antecedentes-mascota.tsx — ANTECEDENTES del paciente (Dialog).
//
// QUÉ: botón "Antecedentes" + modal con la información BASE de la
//   mascota: enfermedades previas, dónde vive, otras mascotas,
//   vacunas/desparasitaciones previas, prevención de parásitos y
//   alergias a medicamentos (los campos del sistema anterior).
// PARA QUÉ sirve: es el contexto que el veterinario lee ANTES de
//   explorar; NO cambia en cada visita (a diferencia de la consulta).
// CÓMO SE GUARDA EN SUPABASE: tabla `antecedentes` con
//   unique(mascota_id); guardarAntecedentes() hace upsert — el
//   formulario no distingue entre crear y editar.
// ============================================================

import * as React from "react";
import { ClipboardList, Loader2, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { getAntecedentesDeMascota, guardarAntecedentes } from "@/services/db";
import { formatoFecha } from "@/lib/utils";

/** Los 6 campos del formulario, en el orden del sistema anterior.
 *  Definirlos como catálogo evita repetir 6 veces el mismo JSX. */
const CAMPOS_ANTECEDENTES = [
  { clave: "enfermedadesPrevias", etiqueta: "Enfermedades previas", placeholder: "Cirugías, padecimientos crónicos..." },
  { clave: "lugarVive", etiqueta: "Lugar en el que vive", placeholder: "Casa, departamento, patio, zona rural..." },
  { clave: "otrasMascotas", etiqueta: "Otras mascotas", placeholder: "¿Convive con otros animales?" },
  { clave: "vacunasDesparasitaciones", etiqueta: "Vacunas y desparasitaciones", placeholder: "Historial previo a esta clínica" },
  { clave: "prevencionParasitos", etiqueta: "Prevención del gusano del corazón y ectoparásitos", placeholder: "Pipetas, collares, preventivos..." },
  { clave: "alergias", etiqueta: "Alergias a algún medicamento", placeholder: "Reacciones conocidas" },
] as const;

/** El estado del formulario: un string por cada campo del catálogo */
type CamposFormulario = Record<(typeof CAMPOS_ANTECEDENTES)[number]["clave"], string>;

const FORMULARIO_VACIO: CamposFormulario = {
  enfermedadesPrevias: "", lugarVive: "", otrasMascotas: "",
  vacunasDesparasitaciones: "", prevencionParasitos: "", alergias: "",
};

interface Props {
  mascotaId: string;
  nombreMascota: string;
}

export function AntecedentesMascota({ mascotaId, nombreMascota }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [campos, setCampos] = React.useState<CamposFormulario>(FORMULARIO_VACIO);
  const [actualizadoEn, setActualizadoEn] = React.useState<string | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [guardado, setGuardado] = React.useState(false);

  // Al abrir el modal cargamos la ficha existente (si la hay)
  React.useEffect(() => {
    if (!abierto) return;
    setGuardado(false);
    setCargando(true);
    getAntecedentesDeMascota(mascotaId).then((ficha) => {
      if (ficha) {
        setCampos({
          enfermedadesPrevias: ficha.enfermedadesPrevias ?? "",
          lugarVive: ficha.lugarVive ?? "",
          otrasMascotas: ficha.otrasMascotas ?? "",
          vacunasDesparasitaciones: ficha.vacunasDesparasitaciones ?? "",
          prevencionParasitos: ficha.prevencionParasitos ?? "",
          alergias: ficha.alergias ?? "",
        });
        setActualizadoEn(ficha.actualizadoEn);
      } else {
        setCampos(FORMULARIO_VACIO);
        setActualizadoEn(null);
      }
      setCargando(false);
    });
  }, [abierto, mascotaId]);

  /** actualizarCampo: helper único para los 6 textareas */
  const actualizarCampo = (clave: keyof CamposFormulario, valor: string) => {
    setCampos((c) => ({ ...c, [clave]: valor }));
    setGuardado(false);
  };

  /** guardar: upsert de la ficha completa (los vacíos van como undefined) */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const ficha = await guardarAntecedentes(mascotaId, {
      enfermedadesPrevias: campos.enfermedadesPrevias.trim() || undefined,
      lugarVive: campos.lugarVive.trim() || undefined,
      otrasMascotas: campos.otrasMascotas.trim() || undefined,
      vacunasDesparasitaciones: campos.vacunasDesparasitaciones.trim() || undefined,
      prevencionParasitos: campos.prevencionParasitos.trim() || undefined,
      alergias: campos.alergias.trim() || undefined,
    });
    setActualizadoEn(ficha.actualizadoEn);
    setGuardando(false);
    setGuardado(true);
  };

  return (
    <>
      {/* Botón que vive en la ficha del expediente */}
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <ClipboardList /> Antecedentes
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Antecedentes de {nombreMascota}
            </DialogTitle>
            <DialogDescription>
              Información base del paciente (no cambia en cada consulta).
              {actualizadoEn && <> Última actualización: {formatoFecha(actualizadoEn)}.</>}
            </DialogDescription>
          </DialogHeader>

          {cargando ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={guardar} className="space-y-3">
              {/* Los 6 campos se generan desde el catálogo: agregar un
                  campo nuevo = agregar una línea en CAMPOS_ANTECEDENTES */}
              {CAMPOS_ANTECEDENTES.map(({ clave, etiqueta, placeholder }) => (
                <div key={clave} className="space-y-1">
                  <Label htmlFor={clave} className="text-xs uppercase tracking-wide text-muted-foreground">
                    {etiqueta}
                  </Label>
                  <textarea
                    id={clave}
                    rows={2}
                    value={campos[clave]}
                    onChange={(e) => actualizarCampo(clave, e.target.value)}
                    placeholder={placeholder}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-1">
                {guardado && (
                  <span className="flex items-center gap-1 text-sm text-green-700">
                    <CircleCheck className="h-4 w-4" /> Guardado
                  </span>
                )}
                <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
                  Cerrar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar antecedentes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
