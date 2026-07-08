"use client";

// ============================================================
// tabla-servicios.tsx — Tabla del catálogo de servicios.
//
// QUÉ: lista los servicios de la clínica (Baño, Rayos X, Cirugía...)
//   con precio y acciones de editar/eliminar.
// PARA QUÉ sirve: estos nombres alimentan el select "Tipo de
//   servicio" del Alta de Consulta — el catálogo lo administra el
//   admin sin tocar código.
// PATRÓN: presentacional (no carga datos); la página /servicios le
//   pasa todo por props, igual que TablaProductos y TablaClientes.
// ============================================================

import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatoMoneda } from "@/lib/utils";
import type { Servicio } from "@/types";

interface Props {
  servicios: Servicio[];
  cargando: boolean;
  onEditar: (servicio: Servicio) => void;
  onEliminar: (servicio: Servicio) => void;
}

export function TablaServicios({ servicios, cargando, onEditar, onEliminar }: Props) {
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
            <TableHead>Servicio</TableHead>
            <TableHead className="hidden md:table-cell">Descripción</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                Sin servicios en el catálogo.
              </TableCell>
            </TableRow>
          )}
          {servicios.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.nombre}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {s.descripcion ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {s.precio !== undefined ? formatoMoneda(s.precio) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEditar(s)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEliminar(s)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4 text-red-600" />
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
