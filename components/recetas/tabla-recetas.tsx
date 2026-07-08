"use client";

// ============================================================
// tabla-recetas.tsx — Tabla global de recetas (presentacional).
//
// QUÉ: todas las recetas emitidas, con paciente, dueño, resumen de
//   medicamentos y el botón Imprimir/PDF por fila.
// POR QUÉ reutiliza lib/imprimir-receta.ts: el documento impreso
//   debe ser IDÉNTICO se imprima desde donde se imprima.
// ============================================================

import Link from "next/link";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatoFecha } from "@/lib/utils";
import { imprimirReceta } from "@/lib/imprimir-receta";
import type { Receta } from "@/types";

/** Receta enriquecida con paciente y dueño (viene de getRecetasGlobal) */
export type RecetaGlobal = Receta & { nombreMascota: string; nombreDueno: string };

interface Props {
  recetas: RecetaGlobal[];
  cargando: boolean;
}

export function TablaRecetas({ recetas, cargando }: Props) {
  if (cargando) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead className="hidden md:table-cell">Dueño</TableHead>
            <TableHead>Medicamentos</TableHead>
            <TableHead className="text-right">Imprimir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recetas.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay recetas que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          )}
          {recetas.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{formatoFecha(r.fecha)}</TableCell>
              <TableCell>
                <Link href={`/mascotas/${r.mascotaId}`} className="font-medium text-blue-700 hover:underline">
                  {r.nombreMascota}
                </Link>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{r.nombreDueno}</TableCell>
              <TableCell>
                {/* Resumen: cantidad + primer medicamento (los detalles, en el expediente) */}
                <Badge variant="secondary" className="mr-1">{r.medicamentos.length}</Badge>
                <span className="text-sm text-muted-foreground">
                  {r.medicamentos[0]?.nombre}
                  {r.medicamentos.length > 1 && ` +${r.medicamentos.length - 1} más`}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => imprimirReceta(r, r.nombreMascota, r.nombreDueno)}
                  aria-label="Imprimir receta"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
