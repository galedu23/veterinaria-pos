"use client";

// ============================================================
// app/(dashboard)/categorias/page.tsx — Catálogo de CATEGORÍAS.
//
// QUÉ: gestiona las categorías de producto (Alimento, Medicamento...).
//   Reutiliza <CatalogoSimple>: esta página solo inyecta las funciones
//   del servicio y el contador de productos por categoría.
// CÓMO SE CONECTA A SUPABASE: crearCategoria/eliminarCategoria; el
//   servicio impide borrar categorías con productos asignados.
// ============================================================

import * as React from "react";
import { Tags } from "lucide-react";
import { CatalogoSimple } from "@/components/catalogos/catalogo-simple";
import { getCategorias, getProductos, crearCategoria, eliminarCategoria } from "@/services/db";
import type { Categoria, Producto } from "@/types";

export default function PaginaCategorias() {
  const [categorias, setCategorias] = React.useState<Categoria[]>([]);
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [cargando, setCargando] = React.useState(true);

  /** cargarDatos: categorías + productos (para el contador por categoría) */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [cats, prods] = await Promise.all([getCategorias(), getProductos()]);
    setCategorias(cats);
    setProductos(prods);
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Tags className="h-6 w-6 text-orange-600" /> Categorías de Productos
      </h2>

      <div className="max-w-lg">
        <CatalogoSimple
          titulo="Categorías"
          icono={<Tags className="h-4 w-4 text-orange-600" />}
          items={categorias}
          cargando={cargando}
          placeholder="Nueva categoría (ej. Juguetes)"
          detalle={(c) => {
            const n = productos.filter((p) => p.categoriaId === c.id).length;
            return `${n} producto${n === 1 ? "" : "s"}`;
          }}
          onAgregar={async (nombre) => {
            await crearCategoria(nombre);
            await cargarDatos();
          }}
          onEliminar={async (item) => {
            await eliminarCategoria(item.id); // falla si tiene productos
            await cargarDatos();
          }}
        />
      </div>
    </div>
  );
}
