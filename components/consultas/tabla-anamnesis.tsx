"use client";

// ============================================================
// tabla-anamnesis.tsx — ANAMNESIS: resumen tabular del historial.
//
// QUÉ: tabla compacta con las consultas pasadas de la mascota,
//   una fila por visita con las columnas médicas del sistema
//   anterior: Fecha, Peso, FC, CC, FR, DX, TX y Progreso.
// PARA QUÉ sirve: el veterinario compara la EVOLUCIÓN de un
//   vistazo (¿subió de peso?, ¿bajó la FC?) sin abrir cada
//   consulta — complementa a las tarjetas detalladas, no las
//   sustituye (el expediente permite alternar entre ambas vistas).
// CÓMO SE ALIMENTA: recibe las consultas ya cargadas por el
//   expediente (componente presentacional). FC y FR viven dentro
//   del jsonb `exploracion`; CC y Progreso son columnas directas.
// ============================================================

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatoFecha } from "@/lib/utils";
import type { Consulta } from "@/types";

interface Props {
  consultas: Consulta[];
}

/**
 * BadgeCondicionCorporal: pinta la CC (escala 1-9) con semáforo:
 * 4-6 es rango saludable (verde); fuera de eso merece atención.
 */
function BadgeCondicionCorporal({ cc }: { cc?: number }) {
  if (cc === undefined) return <span className="text-muted-foreground">—</span>;
  const saludable = cc >= 4 && cc <= 6;
  return (
    <Badge variant={saludable ? "success" : "warning"} title="Condición corporal (1-9)">
      {cc}/9
    </Badge>
  );
}

export function TablaAnamnesis({ consultas }: Props) {
  if (consultas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sin consultas registradas para generar la anamnesis.
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-center">Peso</TableHead>
            <TableHead className="text-center">FC</TableHead>
            <TableHead className="text-center">CC</TableHead>
            <TableHead className="text-center">FR</TableHead>
            <TableHead>DX (presuntivo)</TableHead>
            <TableHead className="hidden md:table-cell">TX (tratamiento)</TableHead>
            <TableHead className="hidden lg:table-cell">Progreso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consultas.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="whitespace-nowrap">{formatoFecha(c.fecha)}</TableCell>
              <TableCell className="whitespace-nowrap text-center">
                {c.pesoKg !== undefined ? `${c.pesoKg} kg` : "—"}
              </TableCell>
              {/* FC y FR salen de la exploración física (jsonb) */}
              <TableCell className="whitespace-nowrap text-center">
                {c.exploracion?.fc ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <BadgeCondicionCorporal cc={c.condicionCorporal} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-center">
                {c.exploracion?.fr ?? "—"}
              </TableCell>
              <TableCell className="max-w-[180px] truncate" title={c.diagnostico}>
                {c.diagnostico}
              </TableCell>
              <TableCell className="hidden max-w-[180px] truncate md:table-cell" title={c.tratamiento}>
                {c.tratamiento ?? "—"}
              </TableCell>
              <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell" title={c.progreso}>
                {c.progreso ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
