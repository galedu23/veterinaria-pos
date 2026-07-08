"use client";

// ============================================================
// tabla-vacunas.tsx — Tabla global de vacunas (presentacional).
//
// QUÉ: todas las vacunas aplicadas en la clínica, con paciente,
//   fechas y el semáforo de estado (vencida/próxima/al día).
// POR QUÉ reutiliza <EstadoVacuna> del expediente: el criterio del
//   semáforo (30 días) debe ser EL MISMO en toda la app; si el
//   umbral cambia, se corrige en un solo componente.
// ============================================================

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EstadoVacuna } from "@/components/expediente/vacunas-mascota";
import { formatoFecha } from "@/lib/utils";
import type { Vacuna } from "@/types";

/** Vacuna enriquecida con el nombre del paciente (getVacunasGlobal) */
export type VacunaGlobal = Vacuna & { nombreMascota: string };

interface Props {
  vacunas: VacunaGlobal[];
  cargando: boolean;
}

export function TablaVacunas({ vacunas, cargando }: Props) {
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
            <TableHead>Vacuna</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead className="hidden md:table-cell">Aplicada</TableHead>
            <TableHead className="hidden sm:table-cell">Próxima dosis</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacunas.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay vacunas con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
          {vacunas.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.nombre}</TableCell>
              <TableCell>
                <Link href={`/mascotas/${v.mascotaId}`} className="text-blue-700 hover:underline">
                  {v.nombreMascota}
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">{formatoFecha(v.fechaAplicacion)}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {v.proximaDosis ? formatoFecha(v.proximaDosis) : "—"}
              </TableCell>
              <TableCell>
                <EstadoVacuna proximaDosis={v.proximaDosis} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
