"use client";

// ============================================================
// ticket-venta.tsx — Ticket interno de la venta (Dialog).
//
// QUÉ: modal que aparece tras cobrar, con estética de impresora
//   térmica: folio, fecha, quién atendió, cliente, líneas y total.
// POR QUÉ: es solo presentación; recibir la venta ya registrada
//   como prop lo hace trivial de probar y de rediseñar.
// FUTURO: el botón "Imprimir" usa window.print() como simulación.
//   TODO: para impresión real de tickets se agrega una hoja de
//   estilos @media print o una librería de PDF (jsPDF/react-pdf).
// ============================================================

import { CircleCheck, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatoMoneda, formatoFecha } from "@/lib/utils";
import type { Venta, ConfiguracionClinica } from "@/types";

interface Props {
  /** null = no hay ticket que mostrar (dialog cerrado) */
  venta: Venta | null;
  nombreAtendio: string;
  nombreCliente: string;
  /** Datos de la clínica capturados en /configuracion (encabezado y pie) */
  config: ConfiguracionClinica | null;
  onCerrar: () => void;
}

export function TicketVenta({ venta, nombreAtendio, nombreCliente, config, onCerrar }: Props) {
  return (
    <Dialog open={!!venta} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheck className="h-5 w-5 text-green-600" /> Venta registrada
          </DialogTitle>
          <DialogDescription>Ticket interno (sin valor fiscal)</DialogDescription>
        </DialogHeader>

        {venta && (
          // Fuente monoespaciada + bordes punteados = estética de ticket
          <div className="rounded-md border border-dashed bg-muted/30 p-4 font-mono text-xs">
            {/* Encabezado con los datos configurables de la clínica.
                Si hay logo (WebP de /configuracion) sustituye al icono. */}
            <div className="mb-2 text-center">
              {config?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- logo WebP local
                <img src={config.logoUrl} alt="Logo" className="mx-auto mb-1 h-12 w-12 object-contain" />
              )}
              <p className="flex items-center justify-center gap-1 text-sm font-bold">
                {!config?.logoUrl && <PawPrint className="h-4 w-4" />} {config?.nombre || "VetGram"}
              </p>
              {config?.direccion && <p>{config.direccion}</p>}
              {config?.telefono && <p>Tel: {config.telefono}</p>}
              <p className="mt-1">Ticket: {venta.folio}</p>
              <p>{formatoFecha(venta.fecha)} · Atendió: {nombreAtendio}</p>
              <p>Cliente: {nombreCliente}</p>
              <p className="capitalize">Pago: {venta.metodoPago}</p>
            </div>
            <div className="border-t border-dashed py-2">
              {venta.items.map((i) => (
                <div key={i.productoId} className="flex justify-between gap-2">
                  <span className="truncate">{i.cantidad} x {i.nombreProducto}</span>
                  <span className="shrink-0">{formatoMoneda(i.cantidad * i.precioUnitario)}</span>
                </div>
              ))}
            </div>
            {/* Desglose: si hubo descuento se muestran las tres líneas;
                sin descuento solo el TOTAL (tickets más limpios) */}
            {venta.descuento > 0 && (
              <>
                <div className="flex justify-between border-t border-dashed pt-2">
                  <span>Subtotal</span>
                  <span>{formatoMoneda(venta.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento</span>
                  <span>-{formatoMoneda(venta.descuento)}</span>
                </div>
              </>
            )}
            <div className={`flex justify-between pt-2 text-sm font-bold ${venta.descuento > 0 ? "" : "border-t border-dashed"}`}>
              <span>TOTAL</span>
              <span>{formatoMoneda(venta.total)}</span>
            </div>
            {/* Mensaje de despedida configurable desde /configuracion */}
            <p className="mt-2 text-center">{config?.mensajeDespedida || "¡Gracias por su compra!"}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button className="flex-1" onClick={onCerrar}>
            Nueva venta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
