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
import { Loader2, PawPrint } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatoFecha } from "@/lib/utils";
import type { Consulta } from "@/types";

/**
 * Consulta enriquecida con los datos del paciente (viene del servicio).
 * Incluye FOTO y DUEÑO porque en un listado de decenas de consultas el
 * nombre solo no basta: la foto identifica al animal de un vistazo y el
 * dueño desambigua cuando varias mascotas se llaman igual ("Lobo").
 */
export type ConsultaGlobal = Consulta & {
  nombreMascota: string;
  fotoMascota?: string;
  nombreDueno: string;
};

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
                {/* Foto + nombre + dueño: identificación rápida del paciente.
                    Todo el bloque enlaza a su expediente completo. */}
                <Link href={`/mascotas/${c.mascotaId}`} className="flex items-center gap-2 group">
                  {c.fotoMascota ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dataURL local (WebP)
                    <img
                      src={c.fotoMascota}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full border object-cover"
                    />
                  ) : (
                    // Sin foto: marcador con la huella, para no romper la alineación
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <PawPrint className="h-4 w-4 text-blue-600" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-blue-700 group-hover:underline">
                      {c.nombreMascota}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.nombreDueno}
                    </span>
                  </span>
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
