"use client";

// ============================================================
// app/(dashboard)/productos/page.tsx — Página de INVENTARIO.
//
// QUÉ: orquesta el módulo de productos. Su ÚNICA responsabilidad es:
//   1. Cargar los datos del servicio (productos + categorías)
//   2. Mantener el estado de la vista (búsqueda, panel abierto, etc.)
//   3. Coordinar a los componentes hijos:
//      - TablaProductos (components/productos/tabla-productos.tsx)
//      - FormularioProducto (components/productos/formulario-producto.tsx)
//      - DialogConfirmacion (components/compartidos/)
// POR QUÉ así: patrón "contenedor/presentacional". La página conoce
//   los datos; los hijos solo pintan. Para cambiar el diseño de la
//   tabla o del formulario NO se toca este archivo.
// CÓMO SE CONECTA A SUPABASE: a través de services/db.ts únicamente.
// ============================================================

import * as React from "react";
import { Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablaProductos } from "@/components/productos/tabla-productos";
import { FormularioProducto } from "@/components/productos/formulario-producto";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getProductos, getCategorias, eliminarProducto } from "@/services/db";
import type { Producto, Categoria } from "@/types";

export default function PaginaProductos() {
  const { usuario } = useAuth();

  // ---- Estado de datos (lo que viene del servicio) ----
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [categorias, setCategorias] = React.useState<Categoria[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado de la interfaz (lo que el usuario manipula) ----
  const [busqueda, setBusqueda] = React.useState("");
  const [panelAbierto, setPanelAbierto] = React.useState(false);
  // null = crear nuevo; con producto = editar ese producto
  const [productoEnEdicion, setProductoEnEdicion] = React.useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = React.useState<Producto | null>(null);

  /**
   * cargarDatos: pide productos y categorías al servicio en paralelo.
   * Promise.all lanza ambas peticiones a la vez (más rápido que en serie).
   */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [prods, cats] = await Promise.all([getProductos(), getCategorias()]);
    setProductos(prods);
    setCategorias(cats);
    setCargando(false);
  }, []);

  // Carga inicial al montar la página
  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtro en memoria: código, nombre o categoría.
  // POR QUÉ en memoria: con pocos cientos de productos es instantáneo.
  // Con Supabase y miles de registros, esto se cambiaría por un
  // .ilike("nombre", `%${busqueda}%`) en el servidor.
  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const categoria = categorias.find((c) => c.id === p.categoriaId)?.nombre ?? "";
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      categoria.toLowerCase().includes(q)
    );
  });

  /** abrirCrear: abre el panel en modo "producto nuevo" */
  const abrirCrear = () => {
    setProductoEnEdicion(null);
    setPanelAbierto(true);
  };

  /** abrirEditar: abre el panel precargado con el producto elegido */
  const abrirEditar = (p: Producto) => {
    setProductoEnEdicion(p);
    setPanelAbierto(true);
  };

  /** confirmarEliminar: borra el producto y refresca la tabla */
  const confirmarEliminar = async () => {
    if (!productoAEliminar) return;
    await eliminarProducto(productoAEliminar.id);
    setProductoAEliminar(null);
    await cargarDatos();
  };

  return (
    <div className="space-y-4">
      {/* Encabezado con la acción principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Package className="h-6 w-6 text-red-600" /> Productos
        </h2>
        <Button onClick={abrirCrear}>
          <Plus /> Agregar Producto
        </Button>
      </div>

      {/* Buscador de la tabla */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, código o categoría..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla (componente presentacional aislado) */}
      <TablaProductos
        productos={productosFiltrados}
        categorias={categorias}
        cargando={cargando}
        puedeEliminar={tienePermiso(usuario, ["administrador"])}
        onEditar={abrirEditar}
        onEliminar={setProductoAEliminar}
      />

      {/* Panel lateral de crear/editar (componente aislado) */}
      <FormularioProducto
        abierto={panelAbierto}
        producto={productoEnEdicion}
        categorias={categorias}
        onCerrar={() => setPanelAbierto(false)}
        onGuardado={cargarDatos}
      />

      {/* Confirmación de borrado (componente compartido) */}
      <DialogConfirmacion
        abierto={!!productoAEliminar}
        titulo="¿Eliminar producto?"
        mensaje={
          <>Se eliminará <strong>{productoAEliminar?.nombre}</strong> del inventario.
          Esta acción no se puede deshacer.</>
        }
        onConfirmar={confirmarEliminar}
        onCancelar={() => setProductoAEliminar(null)}
      />
    </div>
  );
}
