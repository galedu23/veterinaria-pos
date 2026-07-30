"use client";

// ============================================================
// tarjeta-kpi.tsx — Tarjeta de INDICADOR del tablero.
//
// QUÉ: número grande + etiqueta + un dato de apoyo, con un icono de
//   color que identifica el tema (dinero, clínica, alertas…).
// POR QUÉ este diseño y no bloques de color completos: un bloque
//   sólido gigante compite con el resto del tablero y cansa la vista.
//   Tarjeta blanca + acento de color = se lee el NÚMERO primero, que
//   es lo que importa, y el color sigue guiando por tema.
// REGLA DE VISUALIZACIÓN: cuando el dato es UNA cifra, el número
//   grande se lee más rápido que cualquier gráfico.
// ============================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Paleta por tema: fondo del icono y color del acento superior */
const COLORES = {
  azul: { icono: "bg-blue-100 text-blue-700", barra: "bg-blue-600" },
  verde: { icono: "bg-green-100 text-green-700", barra: "bg-green-600" },
  morado: { icono: "bg-purple-100 text-purple-700", barra: "bg-purple-600" },
  ambar: { icono: "bg-amber-100 text-amber-700", barra: "bg-amber-500" },
  rojo: { icono: "bg-red-100 text-red-700", barra: "bg-red-600" },
  gris: { icono: "bg-slate-100 text-slate-700", barra: "bg-slate-500" },
} as const;

interface Props {
  titulo: string;
  /** Valor ya formateado ("$1,250.00", "3", "12 kg") */
  valor: string;
  /** Línea de apoyo debajo del número ("2 tickets", "vs ayer") */
  subtitulo?: string;
  icono: React.ComponentType<{ className?: string }>;
  color: keyof typeof COLORES;
  /** Si se pasa, toda la tarjeta se vuelve un enlace a ese módulo */
  href?: string;
}

export function TarjetaKpi({ titulo, valor, subtitulo, icono: Icono, color, href }: Props) {
  const estilo = COLORES[color];

  const contenido = (
    <div className="relative h-full overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Franja de color: identifica el tema sin invadir la tarjeta */}
      <div className={`absolute inset-x-0 top-0 h-1 ${estilo.barra}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {titulo}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{valor}</p>
          {subtitulo && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${estilo.icono}`}>
          <Icono className="h-5 w-5" />
        </div>
      </div>

      {/* La flecha solo aparece si la tarjeta lleva a algún lado */}
      {href && (
        <span className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-700">
          Ver detalle <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  return href ? <Link href={href} className="block h-full">{contenido}</Link> : contenido;
}
