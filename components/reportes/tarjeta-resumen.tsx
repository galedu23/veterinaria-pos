"use client";

// ============================================================
// tarjeta-resumen.tsx — Tarjeta de métrica ("stat tile").
//
// QUÉ: número grande + título + comparativa opcional vs el periodo
//   anterior (▲ +5% en verde / ▼ -3% en rojo / "—" sin base).
// POR QUÉ un número y no un gráfico: cuando el dato es UNA cifra
//   (total del mes), el número grande se lee más rápido que
//   cualquier gráfico. Regla de visualización: la forma sigue
//   al trabajo del dato.
// ============================================================

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  titulo: string;
  /** El valor ya formateado (ej. "$4,450.00" o "12 tickets") */
  valor: string;
  /** % de variación vs el periodo anterior; null = sin base de comparación */
  variacion?: number | null;
  /** Texto de apoyo bajo la variación, ej. "vs mes anterior" */
  notaComparativa?: string;
}

export function TarjetaResumen({ titulo, valor, variacion, notaComparativa }: Props) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {titulo}
        </p>
        <p className="mt-1 text-3xl font-bold">{valor}</p>

        {/* Comparativa: verde al subir, rojo al bajar, gris sin base.
            El icono acompaña al color para que el sentido no dependa
            SOLO del color (accesibilidad para daltonismo). */}
        {variacion !== undefined && (
          <p className="mt-1 flex items-center gap-1 text-sm">
            {variacion === null ? (
              <span className="text-muted-foreground">— sin datos del periodo anterior</span>
            ) : variacion >= 0 ? (
              <span className="flex items-center gap-1 font-medium text-green-700">
                <TrendingUp className="h-4 w-4" /> +{variacion}%
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-red-600">
                <TrendingDown className="h-4 w-4" /> {variacion}%
              </span>
            )}
            {variacion !== null && notaComparativa && (
              <span className="text-muted-foreground">{notaComparativa}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
