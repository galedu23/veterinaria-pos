"use client";

// ============================================================
// panel-pago.tsx — Sección de COBRO del carrito (visual).
//
// QUÉ muestra:
//   1. El método de pago (efectivo / tarjeta / transferencia / mixto)
//   2. Si es MIXTO: un monto por cada forma, con aviso de cuánto falta
//   3. "Paga con": el efectivo que entrega el cliente, con botones
//      rápidos de los billetes comunes en México
//   4. El CAMBIO a devolver, en grande y en verde
// POR QUÉ los botones de billetes: en el mostrador el cajero teclea
//   con una mano; un toque en "$500" es más rápido y evita errores
//   de dedo que escribir el monto.
// NO CALCULA NADA: toda la aritmética vive en hooks/use-pago.ts.
//   Este componente solo pinta y avisa de los cambios.
// ============================================================

import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/compartidos/select-nativo";
import { formatoMoneda } from "@/lib/utils";
import type { usePago } from "@/hooks/use-pago";
import type { MetodoPago } from "@/types";

/** Billetes de uso común en México: un toque llena el campo */
const BILLETES = [50, 100, 200, 500, 1000];

interface Props {
  /** El objeto que devuelve usePago() en la página (estado elevado) */
  pago: ReturnType<typeof usePago>;
  totalACobrar: number;
}

export function PanelPago({ pago, totalACobrar }: Props) {
  // Hay que preguntar "¿con cuánto paga?" solo si parte del cobro
  // es en efectivo (una tarjeta nunca genera cambio).
  const hayEfectivo = pago.desglose.efectivo > 0;

  return (
    <div className="space-y-3 border-t pt-3">
      {/* ---------- Método de pago ---------- */}
      <div className="space-y-1">
        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Wallet className="h-3 w-3" /> Método de pago
        </p>
        <SelectNativo
          value={pago.metodo}
          onChange={(e) => pago.setMetodo(e.target.value as MetodoPago)}
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="mixto">Mixto (combinar formas)</option>
        </SelectNativo>
      </div>

      {/* ---------- Montos por forma (solo en pago mixto) ---------- */}
      {pago.metodo === "mixto" && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Banknote className="h-3 w-3" /> Efectivo
              </span>
              <Input type="number" min="0" step="0.01" placeholder="0.00"
                value={pago.montoEfectivo}
                onChange={(e) => pago.setMontoEfectivo(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" /> Tarjeta
              </span>
              <Input type="number" min="0" step="0.01" placeholder="0.00"
                value={pago.montoTarjeta}
                onChange={(e) => pago.setMontoTarjeta(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Landmark className="h-3 w-3" /> Transferencia
              </span>
              <Input type="number" min="0" step="0.01" placeholder="0.00"
                value={pago.montoTransferencia}
                onChange={(e) => pago.setMontoTransferencia(e.target.value)} />
            </label>
          </div>

          {/* Semáforo: cuánto falta por cubrir entre las tres formas */}
          {pago.faltante > 0 ? (
            <p className="text-xs font-medium text-amber-700">
              Faltan {formatoMoneda(pago.faltante)} por asignar.
            </p>
          ) : (
            <p className="text-xs font-medium text-green-700">
              Total cubierto ✓
            </p>
          )}
        </div>
      )}

      {/* ---------- Efectivo recibido y CAMBIO ---------- */}
      {hayEfectivo && (
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Paga con (efectivo) — déjalo vacío si paga justo
            </p>
            <Input
              type="number" min="0" step="0.01"
              placeholder={pago.desglose.efectivo.toFixed(2)}
              value={pago.efectivoRecibido}
              onChange={(e) => pago.setEfectivoRecibido(e.target.value)}
            />
          </div>

          {/* Botones rápidos de billetes + "Justo" */}
          <div className="flex flex-wrap gap-1">
            {BILLETES.map((billete) => (
              <Button
                key={billete}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => pago.setEfectivoRecibido(String(billete))}
              >
                ${billete}
              </Button>
            ))}
            <Button
              type="button" variant="outline" size="sm" className="h-7 px-2 text-xs"
              onClick={() => pago.setEfectivoRecibido(pago.desglose.efectivo.toFixed(2))}
            >
              Justo
            </Button>
          </div>

          {/* EL CAMBIO: lo más importante para el cajero, por eso grande */}
          {pago.efectivoRecibidoNumero > 0 && pago.cambio >= 0 && (
            <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
              <span className="text-sm font-medium text-green-800">Cambio</span>
              <span className="text-2xl font-bold text-green-700">
                {formatoMoneda(pago.cambio)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error de cobro (falta dinero o el efectivo no alcanza) */}
      {pago.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{pago.error}</p>
      )}
    </div>
  );
}
