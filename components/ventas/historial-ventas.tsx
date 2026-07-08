"use client";

// ============================================================
// historial-ventas.tsx — HISTORIAL de tickets del día (Drawer).
//
// QUÉ: panel lateral (Sheet) con los tickets de HOY. Por cada uno:
//   folio, cliente, método de pago, total y estado. Acciones:
//   - REIMPRIMIR: reabre el ticket en el modal de TicketVenta
//     (avisa a la página con onReimprimir; así se reutiliza el
//     mismo componente de ticket, no hay dos versiones).
//   - CANCELAR (botón rojo protegido): SOLO administrador, con
//     doble confirmación. Al cancelar, cancelarVenta() DEVUELVE
//     el stock de cada línea al inventario y marca el ticket como
//     "cancelado" (no se borra: queda para auditoría y el folio
//     no desaparece de la numeración).
// POR QUÉ carga sus propios datos: el historial cambia con cada
//   venta; al abrirse consulta getVentasDelDia() y siempre está
//   fresco sin que la página tenga que avisarle.
// TODO Supabase: getVentasDelDia -> select por fecha = hoy;
//   cancelarVenta -> RPC transaccional (stock + estado juntos).
// ============================================================

import * as React from "react";
import { History, Printer, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { formatoMoneda } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getVentasDelDia, cancelarVenta } from "@/services/db";
import type { Venta, Cliente } from "@/types";

interface Props {
  abierto: boolean;
  /** Clientes ya cargados por la página (para mostrar nombres, no ids) */
  clientes: Cliente[];
  onCerrar: () => void;
  /** La página reabre el modal TicketVenta con esta venta (reimpresión) */
  onReimprimir: (venta: Venta) => void;
  /** Tras cancelar, la página refresca su catálogo (el stock cambió) */
  onVentaCancelada: () => void;
}

export function HistorialVentas({ abierto, clientes, onCerrar, onReimprimir, onVentaCancelada }: Props) {
  const { usuario } = useAuth();
  const [ventas, setVentas] = React.useState<Venta[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [ventaACancelar, setVentaACancelar] = React.useState<Venta | null>(null);
  const [error, setError] = React.useState("");

  // Cada apertura recarga el listado (pudo haber ventas nuevas)
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    setCargando(true);
    getVentasDelDia().then((v) => {
      setVentas(v);
      setCargando(false);
    });
  }, [abierto]);

  // PROTECCIÓN: cancelar tickets es exclusivo del administrador.
  // El cajero (recepción) puede ver y reimprimir, pero no cancelar.
  const puedeCancelar = tienePermiso(usuario, ["administrador"]);

  /** nombreCliente: traduce el id al nombre visible */
  const nombreCliente = (id?: string) => {
    if (!id) return "Público general";
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellidos}` : "Público general";
  };

  /** confirmarCancelacion: ejecuta la cancelación y refresca todo */
  const confirmarCancelacion = async () => {
    if (!ventaACancelar) return;
    setError("");
    try {
      await cancelarVenta(ventaACancelar.id); // devuelve stock + marca cancelada
      setVentaACancelar(null);
      setVentas(await getVentasDelDia()); // refresca el listado del drawer
      onVentaCancelada();                 // la página refresca su stock visible
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
      setVentaACancelar(null);
    }
  };

  return (
    <>
      <Sheet open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" /> Tickets del día
            </SheetTitle>
            <SheetDescription>
              Reimprime cualquier ticket o cancélalo (solo administrador).
            </SheetDescription>
          </SheetHeader>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* Listado de tickets */}
          <div className="flex-1 space-y-2 overflow-y-auto py-2">
            {cargando ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : ventas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay ventas registradas hoy.
              </p>
            ) : (
              ventas.map((v) => {
                const cancelada = v.estado === "cancelada";
                return (
                  <div
                    key={v.id}
                    className={`rounded-lg border p-3 shadow-sm ${cancelada ? "bg-muted/50 opacity-70" : "bg-card"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{v.folio}</span>
                      {cancelada ? (
                        <Badge variant="destructive">Cancelado</Badge>
                      ) : (
                        <Badge variant="success">Completado</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {nombreCliente(v.clienteId)} · <span className="capitalize">{v.metodoPago}</span>
                      {" · "}{v.items.reduce((s, i) => s + i.cantidad, 0)} artículo(s)
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-lg font-bold ${cancelada ? "line-through" : ""}`}>
                        {formatoMoneda(v.total)}
                      </span>
                      <div className="flex gap-1">
                        {/* Reimpresión: reabre el mismo modal de ticket */}
                        <Button variant="outline" size="sm" onClick={() => onReimprimir(v)}>
                          <Printer /> Reimprimir
                        </Button>
                        {/* Botón rojo protegido: solo admin y solo tickets vivos */}
                        {puedeCancelar && !cancelada && (
                          <Button variant="destructive" size="sm" onClick={() => setVentaACancelar(v)}>
                            <Ban /> Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Doble confirmación antes de cancelar (acción irreversible) */}
      <DialogConfirmacion
        abierto={!!ventaACancelar}
        titulo="¿Cancelar este ticket?"
        mensaje={
          <>Se cancelará el ticket <strong>{ventaACancelar?.folio}</strong> por{" "}
          <strong>{formatoMoneda(ventaACancelar?.total ?? 0)}</strong>.
          El stock de los productos regresará al inventario.</>
        }
        textoConfirmar="Cancelar venta"
        onConfirmar={confirmarCancelacion}
        onCancelar={() => setVentaACancelar(null)}
      />
    </>
  );
}
