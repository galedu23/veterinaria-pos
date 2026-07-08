"use client";

// ============================================================
// historial-consultas.tsx — Línea de tiempo del expediente.
//
// QUÉ: muestra las consultas de la mascota ordenadas de la más
//   reciente a la más antigua, con sus signos vitales (peso y
//   temperatura) como badges.
// POR QUÉ formato de "línea de tiempo" y no tabla: cada consulta
//   tiene textos largos (diagnóstico, notas) que en una tabla se
//   truncarían; las tarjetas apiladas se leen mejor en móvil.
// ============================================================

import { Weight, Thermometer, CalendarDays, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatoFecha } from "@/lib/utils";
import type { Consulta } from "@/types";

interface Props {
  consultas: Consulta[];
  /**
   * Emite la consulta para crear una receta LIGADA a ella (consulta_id).
   * Si no se pasa (rol recepción), el botón no aparece.
   */
  onNuevaReceta?: (consulta: Consulta) => void;
}

export function HistorialConsultas({ consultas, onNuevaReceta }: Props) {
  if (consultas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sin consultas registradas. Usa &quot;Nueva consulta&quot; para iniciar el historial.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {consultas.map((c) => (
        <div key={c.id} className="rounded-lg border bg-card p-4 shadow-sm">
          {/* Encabezado: fecha + tipo de servicio + signos vitales.
              A la derecha, el botón "Receta" crea una receta LIGADA
              a ESTA consulta (vinculación estricta consulta_id). */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="h-3 w-3" /> {formatoFecha(c.fecha)}
            </Badge>
            {c.tipoServicio && <Badge variant="secondary">{c.tipoServicio}</Badge>}
            {onNuevaReceta && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-7"
                onClick={() => onNuevaReceta(c)}
              >
                <FileText /> Receta
              </Button>
            )}
            {c.pesoKg !== undefined && (
              <Badge variant="secondary" className="gap-1">
                <Weight className="h-3 w-3" /> {c.pesoKg} kg
              </Badge>
            )}
            {c.temperaturaC !== undefined && (
              // Regla clínica simple: >39.2 °C en perros/gatos = fiebre
              <Badge variant={c.temperaturaC > 39.2 ? "destructive" : "secondary"} className="gap-1">
                <Thermometer className="h-3 w-3" /> {c.temperaturaC} °C
              </Badge>
            )}
          </div>

          {/* Cuerpo clínico de la consulta */}
          <div className="mt-2 space-y-1 text-sm">
            <p><span className="font-semibold">Motivo:</span> {c.motivo}</p>
            <p><span className="font-semibold">Diagnóstico:</span> {c.diagnostico}</p>
            {c.tratamiento && (
              <p><span className="font-semibold">Tratamiento:</span> {c.tratamiento}</p>
            )}
            {c.progreso && (
              <p><span className="font-semibold">Progreso:</span> {c.progreso}</p>
            )}
            {c.notas && (
              <p className="text-muted-foreground"><span className="font-semibold">Notas:</span> {c.notas}</p>
            )}
            {c.proximaConsulta && (
              <p className="text-blue-700">
                <span className="font-semibold">Próxima consulta:</span> {formatoFecha(c.proximaConsulta)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
