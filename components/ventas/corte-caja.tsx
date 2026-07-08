"use client";

// ============================================================
// corte-caja.tsx — Modal del CORTE DEL DÍA (Reporte Z).
//
// QUÉ: al abrirse calcula en vivo las ventas de HOY: total vendido,
//   número de tickets y desglose por método de pago. El botón
//   "Cerrar Caja" congela esos números como corte oficial del día
//   (solo se permite UN corte por día).
// POR QUÉ el desglose por método importa: al cerrar, el efectivo
//   contado en el cajón debe coincidir con el renglón "Efectivo";
//   tarjeta y transferencia se cotejan contra la terminal/banco.
// CÓMO SE CONECTA A SUPABASE: getCorteDelDia será un select con
//   sum()/count() agrupado por metodo_pago; registrarCorteCaja un
//   insert en `cortes_caja` con unique(fecha).
// ============================================================

import * as React from "react";
import { Calculator, Loader2, Lock, CircleCheck, Banknote, CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatoMoneda, formatoFecha } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getCorteDelDia, registrarCorteCaja } from "@/services/db";
import type { MetodoPago } from "@/types";

/** Apariencia de cada método de pago en el desglose */
const METODOS: Array<{ clave: MetodoPago; etiqueta: string; Icono: typeof Banknote }> = [
  { clave: "efectivo", etiqueta: "Efectivo", Icono: Banknote },
  { clave: "tarjeta", etiqueta: "Tarjeta", Icono: CreditCard },
  { clave: "transferencia", etiqueta: "Transferencia", Icono: Landmark },
];

/** El tipo que devuelve getCorteDelDia (resumen en vivo) */
type ResumenCorte = Awaited<ReturnType<typeof getCorteDelDia>>;

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export function CorteCaja({ abierto, onCerrar }: Props) {
  const { usuario } = useAuth();
  const [resumen, setResumen] = React.useState<ResumenCorte | null>(null);
  const [cerrando, setCerrando] = React.useState(false);
  const [cerradaAhora, setCerradaAhora] = React.useState(false); // feedback tras cerrar
  const [error, setError] = React.useState("");

  // Cada vez que se abre el modal recalculamos el resumen del día
  // (pudo haber ventas nuevas desde la última vez).
  React.useEffect(() => {
    if (!abierto) return;
    setResumen(null);
    setCerradaAhora(false);
    setError("");
    getCorteDelDia().then(setResumen);
  }, [abierto]);

  /** cerrarCaja: registra el corte oficial y bloquea nuevos cierres hoy */
  const cerrarCaja = async () => {
    if (!usuario) return;
    setCerrando(true);
    setError("");
    try {
      await registrarCorteCaja(usuario.id);
      setCerradaAhora(true);
      // Refrescamos para que el estado "yaCerrada" se refleje
      setResumen(await getCorteDelDia());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar la caja");
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" /> Corte del Día
          </DialogTitle>
          <DialogDescription>
            {resumen ? formatoFecha(resumen.fecha) : "Calculando..."} · Reporte Z
          </DialogDescription>
        </DialogHeader>

        {!resumen ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total del día en grande */}
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total vendido hoy
              </p>
              <p className="text-3xl font-bold">{formatoMoneda(resumen.totalVendido)}</p>
              <Badge variant="secondary" className="mt-1">
                {resumen.numeroTickets} ticket{resumen.numeroTickets === 1 ? "" : "s"}
              </Badge>
            </div>

            {/* Desglose por método de pago */}
            <div className="space-y-2">
              {METODOS.map(({ clave, etiqueta, Icono }) => (
                <div key={clave} className="flex items-center justify-between rounded-md border p-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <Icono className="h-4 w-4 text-muted-foreground" /> {etiqueta}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatoMoneda(resumen.porMetodo[clave])}
                  </span>
                </div>
              ))}
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {/* Estado de la caja / botón de cierre */}
            {resumen.yaCerrada ? (
              <p className="flex items-center justify-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                <CircleCheck className="h-4 w-4" />
                {cerradaAhora ? "Caja cerrada correctamente." : "La caja de hoy ya fue cerrada."}
              </p>
            ) : (
              <Button className="w-full" size="lg" onClick={cerrarCaja} disabled={cerrando}>
                {cerrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock />}
                Cerrar Caja
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
