"use client";

// ============================================================
// tabla-consultas.tsx — Tabla global de consultas (presentacional).
//
// QUÉ: lista todas las consultas de la clínica con fecha, paciente
//   (enlace al expediente), motivo, diagnóstico y veterinario.
// POR QUÉ existe además del historial por mascota: recepción y el
//   admin necesitan ver "qué se atendió hoy" sin entrar expediente
//   por expediente.
// ============================================================

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatoFecha } from "@/lib/utils";
import type { Consulta } from "@/types";

/** Consulta enriquecida con el nombre del paciente (viene del servicio) */
export type ConsultaGlobal = Consulta & { nombreMascota: string };

interface Props {
  consultas: ConsultaGlobal[];
  /** Mapa veterinarioId -> nombre, resuelto por la página con getUsuarios() */
  nombresVeterinarios: Record<string, string>;
  cargando: boolean;
}

export function TablaConsultas({ consultas, nombresVeterinarios, cargando }: Props) {
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
            <TableHead>Motivo</TableHead>
            <TableHead className="hidden md:table-cell">Diagnóstico</TableHead>
            <TableHead className="hidden lg:table-cell">Atendió</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consultas.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay consultas que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          )}
          {consultas.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="whitespace-nowrap">{formatoFecha(c.fecha)}</TableCell>
              <TableCell>
                {/* El paciente enlaza a su expediente completo */}
                <Link href={`/mascotas/${c.mascotaId}`} className="font-medium text-blue-700 hover:underline">
                  {c.nombreMascota}
                </Link>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{c.motivo}</TableCell>
              <TableCell className="hidden max-w-[240px] truncate md:table-cell">{c.diagnostico}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {nombresVeterinarios[c.veterinarioId] ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
