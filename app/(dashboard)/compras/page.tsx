"use client";

// ============================================================
// app/(dashboard)/compras/page.tsx — COMPRAS A PROVEEDORES.
// Interfaz similar al POS pero para INGRESAR stock:
//   Izquierda: buscador y lista de productos (usa precio de COMPRA)
//   Derecha:   carrito de compra + nombre del proveedor
// Al registrar, registrarCompra() AUMENTA el stock del inventario.
// Abajo se muestra el historial de compras registradas.
// ============================================================

import * as React from "react";
import {
  ShoppingCart, Search, Truck, Trash2, Minus, Plus, Loader2, CircleCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatoMoneda, formatoFecha } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCarrito } from "@/hooks/use-carrito";
import { getProductos, getCompras, registrarCompra } from "@/services/db";
import type { Producto, Compra } from "@/types";

export default function PaginaCompras() {
  const { usuario } = useAuth();
  const carrito = useCarrito();

  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [compras, setCompras] = React.useState<Compra[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");
  const [proveedor, setProveedor] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");
  const [exito, setExito] = React.useState(""); // mensaje de compra registrada

  /** cargarDatos: inventario actual + historial de compras */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [prods, hist] = await Promise.all([getProductos(), getCompras()]);
    setProductos(prods);
    setCompras(hist);
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtro del catálogo por nombre o código
  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    return !q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
  });

  /** registrar: guarda la compra, AUMENTA stock y refresca el historial */
  const registrar = async () => {
    if (!usuario || carrito.items.length === 0) return;
    setError("");
    setExito("");

    // El proveedor es obligatorio para poder rastrear la entrada
    if (!proveedor.trim()) {
      setError("Escribe el nombre del proveedor.");
      return;
    }

    setGuardando(true);
    try {
      const compra = await registrarCompra({
        proveedor: proveedor.trim(),
        usuarioId: usuario.id,
        fecha: new Date().toISOString().slice(0, 10),
        items: carrito.items,
        total: carrito.total,
      });
      setExito(`Compra ${compra.folio} registrada. El stock fue actualizado.`);
      carrito.limpiar();
      setProveedor("");
      await cargarDatos(); // refresca stock e historial
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar la compra");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <ShoppingCart className="h-6 w-6 text-orange-600" /> Compras a Proveedores
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* ------------- Columna izquierda: productos a ingresar ------------- */}
        <div className="space-y-3 lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto para ingresar stock..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {cargando ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {productosFiltrados.map((p) => (
                // Fila de producto: muestra precio de COMPRA y stock actual
                <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Costo: {formatoMoneda(p.precioCompra)} · Stock actual: {p.stock}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => carrito.agregar(p, p.precioCompra)} // precio de COMPRA
                  >
                    <Plus /> Agregar
                  </Button>
                </div>
              ))}
              {productosFiltrados.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin resultados para &quot;{busqueda}&quot;
                </p>
              )}
            </div>
          )}
        </div>

        {/* ------------- Columna derecha: carrito de compra ------------- */}
        <Card className="h-fit lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" /> Orden de compra
              {carrito.items.length > 0 && <Badge>{carrito.items.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Input
                id="proveedor"
                placeholder="Ej. Distribuidora VetMex"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
              />
            </div>

            {carrito.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Agrega productos para ingresar stock
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {carrito.items.map((item) => (
                  <div key={item.productoId} className="flex items-center gap-2 rounded-md border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.nombreProducto}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatoMoneda(item.precioUnitario)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => carrito.quitar(item.productoId)} aria-label="Quitar">
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {exito && (
              <p className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                <CircleCheck className="h-4 w-4 shrink-0" /> {exito}
              </p>
            )}

            <div className="border-t pt-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de la compra</span>
                <span className="text-2xl font-bold">{formatoMoneda(carrito.total)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={carrito.items.length === 0 || guardando}
                onClick={registrar}
              >
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck />}
                Registrar compra
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------- Historial de compras ------------- */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Historial de compras</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="hidden text-center md:table-cell">Artículos</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compras.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  Aún no hay compras registradas.
                </TableCell>
              </TableRow>
            )}
            {compras.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.folio}</TableCell>
                <TableCell>{formatoFecha(c.fecha)}</TableCell>
                <TableCell>{c.proveedor}</TableCell>
                <TableCell className="hidden text-center md:table-cell">
                  {c.items.reduce((s, i) => s + i.cantidad, 0)}
                </TableCell>
                <TableCell className="text-right font-medium">{formatoMoneda(c.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
