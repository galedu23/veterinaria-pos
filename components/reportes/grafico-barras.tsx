"use client";

// ============================================================
// grafico-barras.tsx — Gráfico de barras VERTICAL (solo Tailwind).
//
// QUÉ: barras proporcionales al valor, una por punto (ej. ventas
//   por día del mes). Sin librerías: cada barra es un <div> cuya
//   altura es el % de su valor respecto al máximo.
// DECISIONES DE VISUALIZACIÓN (por qué se ve así):
//   - UNA serie -> UN solo tono (el azul del sistema); el color no
//     codifica identidad, así que no se necesita leyenda ni paleta.
//   - Puntas redondeadas SOLO arriba, barras ancladas a la línea base.
//   - Tooltip al pasar el mouse (etiqueta + valor exacto) en lugar de
//     un número encima de CADA barra: menos ruido visual.
//   - Etiquetas del eje X selectivas (cada N) para que no se encimen.
// CÓMO SE ALIMENTA: recibe los datos ya calculados por el servicio;
//   este componente solo PINTA (reutilizable para cualquier serie).
// ============================================================

import { formatoMoneda } from "@/lib/utils";

interface PuntoBarra {
  etiqueta: string; // ej. "5" (día del mes)
  valor: number;
}

interface Props {
  titulo: string;
  datos: PuntoBarra[];
  /** Cada cuántas barras se muestra la etiqueta del eje X (default 5) */
  cadaCuantasEtiquetas?: number;
}

export function GraficoBarras({ titulo, datos, cadaCuantasEtiquetas = 5 }: Props) {
  // El máximo define la escala: la barra más alta ocupa el 100% del alto
  const maximo = Math.max(...datos.map((d) => d.valor), 1); // mín. 1 evita dividir entre 0

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold">{titulo}</p>

      {/* Área de barras: items-end ancla todas a la línea base */}
      <div className="flex h-40 items-end gap-0.5">
        {datos.map((d) => (
          // group habilita el tooltip de SU barra al pasar el mouse
          <div key={d.etiqueta} className="group relative flex h-full flex-1 flex-col justify-end">
            {/* Tooltip flotante: etiqueta + valor exacto */}
            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
              Día {d.etiqueta}: {formatoMoneda(d.valor)}
            </div>
            <div
              className={
                d.valor > 0
                  ? "rounded-t bg-blue-600 transition-colors group-hover:bg-blue-500"
                  : "rounded-t bg-muted" // día sin ventas: barra fantasma mínima
              }
              style={{ height: d.valor > 0 ? `${(d.valor / maximo) * 100}%` : "2px" }}
            />
          </div>
        ))}
      </div>

      {/* Eje X: etiquetas selectivas (la 1, cada N y la última) */}
      <div className="mt-1 flex gap-0.5 text-[10px] text-muted-foreground">
        {datos.map((d, i) => (
          <div key={d.etiqueta} className="flex-1 text-center">
            {(i === 0 || (i + 1) % cadaCuantasEtiquetas === 0 || i === datos.length - 1)
              ? d.etiqueta
              : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
