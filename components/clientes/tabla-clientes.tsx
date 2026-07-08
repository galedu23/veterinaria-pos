"use client";

// ============================================================
// tabla-clientes.tsx — Tabla de clientes (presentacional).
//
// QUÉ: lista de dueños con teléfono, email y acciones.
//   El nombre es un enlace al perfil del cliente (/clientes/[id])
//   donde se ven sus mascotas.
// POR QUÉ: mismo patrón que TablaProductos — componente "tonto"
//   que solo pinta y emite callbacks, para poder rediseñarlo
//   sin tocar la lógica de la página.
// ============================================================

import Link from "next/link";
import { Pencil, Trash2, Loader2, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Cliente } from "@/types";

interface Props {
  clientes: Cliente[];
  /** Mapa clienteId -> número de mascotas (para el badge de la fila) */
  conteoMascotas: Record<string, number>;
  cargando: boolean;
  puedeEliminar: boolean;
  onEditar: (cliente: Cliente) => void;
  onEliminar: (cliente: Cliente) => void;
}

export function TablaClientes({
  clientes, conteoMascotas, cargando, puedeEliminar, onEditar, onEliminar,
}: Props) {
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
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="text-center">Mascotas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay clientes que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          )}
          {clientes.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                {/* Enlace al perfil: ahí se ven sus mascotas y datos completos */}
                <Link href={`/clientes/${c.id}`} className="font-medium text-blue-700 hover:underline">
                  {c.nombre} {c.apellidos}
                </Link>
              </TableCell>
              <TableCell>{c.telefono}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {c.email ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="gap-1">
                  <PawPrint className="h-3 w-3" /> {conteoMascotas[c.id] ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEditar(c)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {puedeEliminar && (
                    <Button variant="ghost" size="icon" onClick={() => onEliminar(c)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
