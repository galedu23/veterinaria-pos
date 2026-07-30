"use client";

// ============================================================
// panel-lista.tsx — Panel de PENDIENTES del tablero (genérico).
//
// QUÉ: una tarjeta con título y una lista corta de cosas que
//   requieren acción (citas de la semana, vacunas por vencer,
//   productos por resurtir).
// POR QUÉ genérico: el tablero lo usa TRES veces con datos distintos.
//   Una sola implementación = un solo lugar donde ajustar el diseño.
// POR QUÉ estas listas y no más números: un conteo ("3 alertas") dice
//   que hay un problema; la lista dice A QUIÉN hay que llamar. El
//   tablero debe permitir actuar, no solo mirar.
// ============================================================

import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Un renglón de la lista. `urgencia` decide el color del valor. */
export interface ItemPanel {
  id: string;
  titulo: string;
  subtitulo: string;
  /** Texto de la derecha ("En 3 días", "quedan 2") */
  valor: string;
  urgencia?: "alta" | "media" | "baja";
  /** Si se pasa, el renglón navega al detalle */
  href?: string;
}

/** Color del valor según urgencia (rojo = atender ya) */
const COLOR_URGENCIA = {
  alta: "text-red-600",
  media: "text-amber-600",
  baja: "text-muted-foreground",
} as const;

interface Props {
  titulo: string;
  icono: React.ComponentType<{ className?: string }>;
  items: ItemPanel[];
  /** Mensaje cuando no hay pendientes (buena noticia, no error) */
  textoVacio: string;
  /** Enlace del encabezado para ver el módulo completo */
  hrefVerTodo?: string;
  /** Cuántos renglones mostrar antes de cortar (default 5) */
  maximo?: number;
}

export function PanelLista({
  titulo, icono: Icono, items, textoVacio, hrefVerTodo, maximo = 5,
}: Props) {
  const visibles = items.slice(0, maximo);
  const restantes = items.length - visibles.length;

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card shadow-sm">
      {/* Encabezado con el conteo total y acceso al módulo */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Icono className="h-4 w-4 text-muted-foreground" />
        <h3 className="flex-1 text-sm font-semibold">{titulo}</h3>
        {items.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {items.length}
          </span>
        )}
      </div>

      <div className="flex-1 divide-y">
        {visibles.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {textoVacio}
          </p>
        ) : (
          visibles.map((item) => {
            const renglon = (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.subtitulo}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${COLOR_URGENCIA[item.urgencia ?? "baja"]}`}>
                  {item.valor}
                </span>
                {item.href && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} className="block transition-colors hover:bg-accent">
                {renglon}
              </Link>
            ) : (
              <div key={item.id}>{renglon}</div>
            );
          })
        )}
      </div>

      {/* Pie: cuántos quedan fuera y enlace al módulo completo */}
      {(restantes > 0 || hrefVerTodo) && (
        <div className="border-t px-4 py-2 text-xs">
          {restantes > 0 && (
            <span className="text-muted-foreground">y {restantes} más · </span>
          )}
          {hrefVerTodo && (
            <Link href={hrefVerTodo} className="font-medium text-blue-700 hover:underline">
              Ver todo
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
