"use client";

// ============================================================
// tabla-mascotas.tsx — Tabla de mascotas (presentacional).
//
// QUÉ: lista las mascotas mostrando SIEMPRE el dueño y la raza
//   junto al nombre. Esto es clave: como muchos animales se llaman
//   igual ("Lobo"), el empleado distingue por dueño/raza sin abrir
//   cada registro.
// POR QUÉ recibe mascotas "enriquecidas": el servicio ya les agregó
//   nombreDueno/nombreRaza/nombreEspecie (buscarMascotasAvanzado),
//   así la tabla no tiene que cruzar catálogos.
// ============================================================

import Link from "next/link";
import { Pencil, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Mascota } from "@/types";

/** Mascota con los datos cruzados que devuelve buscarMascotasAvanzado */
export type MascotaEnriquecida = Mascota & {
  nombreDueno: string;
  nombreRaza: string;
  nombreEspecie: string;
};

interface Props {
  mascotas: MascotaEnriquecida[];
  cargando: boolean;
  onEditar: (mascota: MascotaEnriquecida) => void;
}

export function TablaMascotas({ mascotas, cargando, onEditar }: Props) {
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
            <TableHead>Mascota</TableHead>
            <TableHead>Dueño</TableHead>
            <TableHead className="hidden md:table-cell">Especie / Raza</TableHead>
            <TableHead className="hidden sm:table-cell">Sexo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mascotas.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Sin resultados. Prueba buscar por nombre, dueño o raza.
              </TableCell>
            </TableRow>
          )}
          {mascotas.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                {/* El nombre lleva al expediente clínico completo */}
                <Link href={`/mascotas/${m.id}`} className="font-medium text-blue-700 hover:underline">
                  {m.nombre}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{m.nombreDueno}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary">{m.nombreEspecie}</Badge>{" "}
                <span className="text-sm text-muted-foreground">{m.nombreRaza}</span>
              </TableCell>
              <TableCell className="hidden text-sm capitalize sm:table-cell">{m.sexo}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {/* Acceso directo al expediente */}
                  <Button asChild variant="ghost" size="icon" aria-label="Expediente">
                    <Link href={`/mascotas/${m.id}`}><FileText className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEditar(m)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
