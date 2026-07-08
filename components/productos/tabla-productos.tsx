"use client";

// ============================================================
// tabla-productos.tsx — Tabla del inventario (componente aislado).
//
// QUÉ: renderiza la tabla de productos con badges de stock y los
//   botones de editar/eliminar de cada fila.
// POR QUÉ: es un componente "tonto" (presentacional): NO carga datos
//   ni guarda nada, solo recibe props y avisa al padre con callbacks
//   (onEditar / onEliminar). Así, si mañana cambias el diseño de la
//   tabla, tocas SOLO este archivo sin riesgo de romper la lógica.
// CÓMO SE CONECTA A SUPABASE: no se conecta. Los datos le llegan por
//   props desde page.tsx, que es quien habla con services/db.ts.
// ============================================================

import { Pencil, Trash2, TriangleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatoMoneda } from "@/lib/utils";
import type { Producto, Categoria } from "@/types";

interface Props {
  productos: Producto[];
  categorias: Categoria[];
  cargando: boolean;
  /** true si el usuario puede eliminar (solo administrador) */
  puedeEliminar: boolean;
  onEditar: (producto: Producto) => void;
  onEliminar: (producto: Producto) => void;
}

export function TablaProductos({
  productos, categorias, cargando, puedeEliminar, onEditar, onEliminar,
}: Props) {
  /** nombreCategoria: traduce el id de categoría a su nombre visible */
  const nombreCategoria = (id: string) =>
    categorias.find((c) => c.id === id)?.nombre ?? "—";

  // Mientras llegan los datos mostramos un spinner centrado
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
            <TableHead>Código</TableHead>
            <TableHead>Producto</TableHead>
            {/* La categoría se oculta en móvil para que la tabla quepa */}
            <TableHead className="hidden md:table-cell">Categoría</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay productos que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          )}
          {productos.map((p) => {
            // Regla de negocio: stock en o por debajo del mínimo = alerta roja
            const stockBajo = p.stock <= p.stockMinimo;
            return (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {/* Miniatura de la foto comprimida (si el producto tiene) */}
                    {p.fotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- dataURL local
                      <img
                        src={p.fotoUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded object-cover"
                      />
                    )}
                    {p.nombre}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">{nombreCategoria(p.categoriaId)}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatoMoneda(p.precioVenta)}</TableCell>
                <TableCell className="text-center">
                  {stockBajo ? (
                    <Badge variant="destructive" className="gap-1">
                      <TriangleAlert className="h-3 w-3" /> {p.stock}
                    </Badge>
                  ) : (
                    <Badge variant="success">{p.stock}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEditar(p)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {puedeEliminar && (
                      <Button variant="ghost" size="icon" onClick={() => onEliminar(p)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
