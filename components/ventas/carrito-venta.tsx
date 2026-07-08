"use client";

// ============================================================
// carrito-venta.tsx — Carrito del punto de venta.
//
// QUÉ: la columna derecha del POS: selección de cliente, líneas
//   con cantidades +/−, total en vivo y el botón "Cobrar".
// POR QUÉ: recibe el carrito ya creado por el hook useCarrito desde
//   la página (no crea el suyo propio) para que la página pueda
//   limpiarlo tras cobrar. Es el patrón de "estado elevado":
//   el estado vive en el padre, los hijos lo usan.
// CÓMO SE CONECTA A SUPABASE: no directamente. Emite onCobrar() y
//   la página llama a registrarVenta() del servicio.
// ============================================================

import { ShoppingCart, Trash2, Minus, Plus, Loader2, CircleCheck, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectNativo } from "@/components/compartidos/select-nativo";
import { formatoMoneda } from "@/lib/utils";
import type { useCarrito } from "@/hooks/use-carrito";
import type { Cliente, Producto, MetodoPago, TipoDescuento } from "@/types";

interface Props {
  /** El objeto que devuelve useCarrito() en la página (estado elevado) */
  carrito: ReturnType<typeof useCarrito>;
  clientes: Cliente[];
  productos: Producto[];
  clienteId: string;
  onClienteChange: (id: string) => void;
  /** Método de pago elegido (alimenta el corte de caja) */
  metodoPago: MetodoPago;
  onMetodoPagoChange: (metodo: MetodoPago) => void;
  /** Descuento: tipo ("" = sin descuento), valor capturado y monto YA calculado
      por la página. El carrito solo lo PINTA — el cálculo vive en un solo lugar. */
  tipoDescuento: TipoDescuento | "";
  valorDescuento: string;
  onDescuentoChange: (tipo: TipoDescuento | "", valor: string) => void;
  montoDescuento: number;
  totalFinal: number;
  error: string;
  cobrando: boolean;
  onCobrar: () => void;
}

export function CarritoVenta({
  carrito, clientes, productos, clienteId, onClienteChange,
  metodoPago, onMetodoPagoChange,
  tipoDescuento, valorDescuento, onDescuentoChange, montoDescuento, totalFinal,
  error, cobrando, onCobrar,
}: Props) {
  /**
   * incrementar: sube la cantidad de una línea validando contra el
   * stock REAL del producto, para no vender de más.
   */
  const incrementar = (productoId: string, cantidadActual: number) => {
    const producto = productos.find((p) => p.id === productoId);
    if (producto && cantidadActual < producto.stock) {
      carrito.cambiarCantidad(productoId, cantidadActual + 1);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" /> Carrito
          {carrito.items.length > 0 && <Badge>{carrito.items.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Cliente de la venta: opcional, por defecto "Público general" */}
        <SelectNativo value={clienteId} onChange={(e) => onClienteChange(e.target.value)}>
          <option value="">Público general</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
          ))}
        </SelectNativo>

        {/* Líneas del carrito */}
        {carrito.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Toca un producto para agregarlo
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {carrito.items.map((item) => (
              <div key={item.productoId} className="flex items-center gap-2 rounded-md border p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.nombreProducto}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatoMoneda(item.precioUnitario)} c/u
                  </p>
                </div>
                {/* Controles de cantidad */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => incrementar(item.productoId, item.cantidad)}>
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

        {/* Método de pago: se guarda en la venta y alimenta el corte de caja */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Método de pago</p>
          <SelectNativo
            value={metodoPago}
            onChange={(e) => onMetodoPagoChange(e.target.value as MetodoPago)}
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </SelectNativo>
        </div>

        {/* Descuento: función estándar de caja registradora.
            El cajero elige % o $ y captura el valor; el monto lo calcula
            la página (con topes) y aquí solo se muestra. */}
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Percent className="h-3 w-3" /> Descuento
          </p>
          <div className="flex gap-2">
            <SelectNativo
              className="w-32"
              value={tipoDescuento}
              onChange={(e) => onDescuentoChange(e.target.value as TipoDescuento | "", valorDescuento)}
            >
              <option value="">Sin descuento</option>
              <option value="porcentaje">Porcentaje %</option>
              <option value="monto">Cantidad $</option>
            </SelectNativo>
            {tipoDescuento && (
              <Input
                type="number"
                min="0"
                step={tipoDescuento === "porcentaje" ? "1" : "0.01"}
                placeholder={tipoDescuento === "porcentaje" ? "10" : "50.00"}
                value={valorDescuento}
                onChange={(e) => onDescuentoChange(tipoDescuento, e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Totales: subtotal -> descuento -> total a cobrar */}
        <div className="border-t pt-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatoMoneda(carrito.total)}</span>
          </div>
          {montoDescuento > 0 && (
            <div className="mb-1 flex items-center justify-between text-sm text-green-700">
              <span>Descuento</span>
              <span>-{formatoMoneda(montoDescuento)}</span>
            </div>
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total a cobrar</span>
            <span className="text-2xl font-bold">{formatoMoneda(totalFinal)}</span>
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
            disabled={carrito.items.length === 0 || cobrando}
            onClick={onCobrar}
          >
            {cobrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleCheck />}
            Cobrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
