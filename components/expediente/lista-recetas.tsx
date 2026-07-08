"use client";

// ============================================================
// lista-recetas.tsx — Recetas de la mascota + exportar/imprimir.
//
// QUÉ: lista las recetas con sus medicamentos y un botón
//   "Imprimir / PDF" por receta.
// POR QUÉ la impresión NO vive aquí: la función imprimirReceta() está
//   en lib/imprimir-receta.ts porque también la usa el listado global
//   /recetas. Un solo lugar para cambiar el formato del documento.
// ============================================================

import { Printer, CalendarDays, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatoFecha } from "@/lib/utils";
import { imprimirReceta as imprimir } from "@/lib/imprimir-receta";
import type { Receta } from "@/types";

interface Props {
  recetas: Receta[];
  nombreMascota: string;
  nombreDueno: string;
  /** Abre la receta en el editor profesional (clic en la tarjeta) */
  onVer?: (receta: Receta) => void;
}

export function ListaRecetas({ recetas, nombreMascota, nombreDueno, onVer }: Props) {
  /** imprimirReceta: delega en la utilidad compartida con los datos del paciente */
  const imprimirReceta = (receta: Receta) => imprimir(receta, nombreMascota, nombreDueno);

  if (recetas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sin recetas emitidas para esta mascota.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recetas.map((r) => (
        // La tarjeta completa es clickeable: abre el EDITOR profesional.
        // El botón de imprimir detiene la propagación para no abrir el
        // editor cuando solo se quiere imprimir.
        <div
          key={r.id}
          onClick={() => onVer?.(r)}
          className={`rounded-lg border bg-card p-4 shadow-sm transition-colors ${onVer ? "cursor-pointer hover:border-blue-400" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="h-3 w-3" /> {formatoFecha(r.fecha)}
            </Badge>
            <div className="flex items-center gap-2">
              {onVer && (
                <span className="text-xs font-medium text-blue-700">Clic para ver/editar</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // no abrir el editor al imprimir
                  imprimirReceta(r);
                }}
              >
                <Printer /> Imprimir / PDF
              </Button>
            </div>
          </div>

          {/* Medicamentos de la receta */}
          <div className="mt-3 space-y-2">
            {r.medicamentos.map((m, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-muted/40 p-2 text-sm">
                <Pill className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium">
                    {m.nombre} — {m.dosis}, {m.frecuencia}
                    {m.duracion && `, por ${m.duracion}`}
                  </p>
                  {m.indicaciones && (
                    <p className="text-xs text-muted-foreground">{m.indicaciones}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {r.observaciones && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold">Observaciones:</span> {r.observaciones}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
