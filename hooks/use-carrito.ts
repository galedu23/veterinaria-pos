"use client";

// ============================================================
// hooks/use-carrito.ts — Lógica de carrito COMPARTIDA.
// La usan el Punto de Venta (app/ventas) y las Compras a
// proveedor (app/compras) para no duplicar código: agregar,
// quitar, cambiar cantidades y calcular el total.
// ============================================================

import * as React from "react";
import type { LineaItem, Producto } from "@/types";

export function useCarrito() {
  const [items, setItems] = React.useState<LineaItem[]>([]);

  /**
   * agregar: mete un producto al carrito. Si ya existe, suma cantidad.
   * `precioUnitario` permite usar precio de venta (POS) o de compra (proveedor).
   */
  const agregar = React.useCallback((producto: Producto, precioUnitario: number, cantidad = 1) => {
    setItems((previos) => {
      const existente = previos.find((i) => i.productoId === producto.id);
      if (existente) {
        return previos.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [
        ...previos,
        { productoId: producto.id, nombreProducto: producto.nombre, cantidad, precioUnitario },
      ];
    });
  }, []);

  /** cambiarCantidad: fija la cantidad de una línea (mínimo 1) */
  const cambiarCantidad = React.useCallback((productoId: string, cantidad: number) => {
    setItems((previos) =>
      previos.map((i) =>
        i.productoId === productoId ? { ...i, cantidad: Math.max(1, cantidad) } : i
      )
    );
  }, []);

  /** quitar: elimina una línea completa del carrito */
  const quitar = React.useCallback((productoId: string) => {
    setItems((previos) => previos.filter((i) => i.productoId !== productoId));
  }, []);

  /** limpiar: vacía el carrito (después de cobrar o registrar la compra) */
  const limpiar = React.useCallback(() => setItems([]), []);

  // Total calculado en cada render (suma de cantidad * precio)
  const total = items.reduce((suma, i) => suma + i.cantidad * i.precioUnitario, 0);

  return { items, agregar, cambiarCantidad, quitar, limpiar, total };
}
