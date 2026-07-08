"use client";

// ============================================================
// catalogo-productos.tsx — Buscador + rejilla de productos del POS.
//
// QUÉ: la columna izquierda del punto de venta. Muestra el buscador
//   rápido y las tarjetas de productos; al hacer clic se agregan
//   al carrito.
// POR QUÉ: separado del carrito porque son responsabilidades
//   distintas — este componente solo "ofrece" productos; no sabe
//   nada de totales ni de cobros.
// DETALLE CLAVE: el stock que muestra cada tarjeta es el stock real
//   MENOS lo que ya está en el carrito (prop `enCarrito`), para que
//   el cajero no pueda vender más unidades de las que hay.
// ============================================================

import * as React from "react";
import { Search, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatoMoneda, cn } from "@/lib/utils";
import type { Producto } from "@/types";

interface Props {
  productos: Producto[];
  cargando: boolean;
  /** Devuelve cuántas unidades de ese producto ya están en el carrito */
  enCarrito: (productoId: string) => number;
  onAgregar: (producto: Producto) => void;
}

export function CatalogoProductos({ productos, cargando, enCarrito, onAgregar }: Props) {
  // La búsqueda vive DENTRO del catálogo: nadie más la necesita,
  // así evitamos "subir" estado a la página sin motivo.
  const [busqueda, setBusqueda] = React.useState("");

  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    return !q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
  });

  if (cargando) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador rápido por nombre o código */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto por nombre o código..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Rejilla de tarjetas: 2 columnas en móvil, 3 en escritorio */}
      <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {productosFiltrados.map((p) => {
          // Stock disponible = stock real - lo que ya está en el carrito
          const disponible = p.stock - enCarrito(p.id);
          const agotado = disponible <= 0;
          return (
            // Tarjeta visual: la FOTO (WebP comprimido) ayuda al cajero a
            // identificar el producto de un vistazo, sin leer el nombre.
            <button
              key={p.id}
              onClick={() => onAgregar(p)}
              disabled={agotado}
              className={cn(
                "flex flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-colors",
                agotado ? "opacity-50" : "hover:border-blue-400 hover:bg-blue-50"
              )}
            >
              {/* Zona de imagen con ALTURA FIJA: la cuadrícula queda alineada
                  aunque unos productos tengan foto y otros no (icono de respaldo). */}
              {p.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- dataURL local (WebP comprimido)
                <img
                  src={p.fotoUrl}
                  alt={p.nombre}
                  className="h-20 w-full border-b object-cover"
                />
              ) : (
                <div className="flex h-20 w-full items-center justify-center border-b bg-muted/40">
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between p-2.5">
                <p className="line-clamp-2 text-sm font-medium">{p.nombre}</p>
                <div className="mt-2 flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-blue-700">
                    {formatoMoneda(p.precioVenta)}
                  </span>
                  <Badge variant={agotado ? "destructive" : "secondary"} className="text-[10px]">
                    {agotado ? "Agotado" : `Stock: ${disponible}`}
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
        {productosFiltrados.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            Sin resultados para &quot;{busqueda}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
