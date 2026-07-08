"use client";

// ============================================================
// barras-horizontales.tsx — Lista clasificada con barras (ranking).
//
// QUÉ: filas con etiqueta + barra proporcional + valor. Se usa dos
//   veces en reportes: Top 5 de productos e ingresos por método de
//   pago — por eso es genérico.
// POR QUÉ barras HORIZONTALES para rankings: las etiquetas largas
//   ("Croquetas Premium Perro 20kg") caben completas a la izquierda,
//   cosa imposible en barras verticales.
// DECISIÓN DE COLOR: un solo tono (azul del sistema); la identidad
//   la dan las etiquetas de texto, no el color -> no hace falta
//   leyenda ni paleta categórica.
// ============================================================

import { formatoMoneda } from "@/lib/utils";

interface FilaBarra {
  etiqueta: string;
  valor: number;
  /** Texto secundario opcional, ej. "12 piezas" */
  detalle?: string;
}

interface Props {
  titulo: string;
  datos: FilaBarra[];
  /** Cómo mostrar el valor (default: moneda) */
  formatoValor?: (valor: number) => string;
  /** Mensaje cuando no hay datos */
  textoVacio?: string;
}

export function BarrasHorizontales({
  titulo, datos, formatoValor = formatoMoneda, textoVacio = "Sin datos este mes.",
}: Props) {
  // La barra más larga (el #1 del ranking) ocupa el 100% del ancho
  const maximo = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold">{titulo}</p>

      {datos.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{textoVacio}</p>
      ) : (
        <div className="space-y-3">
          {datos.map((d) => (
            <div key={d.etiqueta}>
              {/* Etiqueta y valor SIEMPRE en texto (no dependen de la barra) */}
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{d.etiqueta}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatoValor(d.valor)}
                  {d.detalle && <span className="ml-1 text-xs">({d.detalle})</span>}
                </span>
              </div>
              {/* Riel gris + barra proporcional con punta redondeada */}
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${(d.valor / maximo) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
