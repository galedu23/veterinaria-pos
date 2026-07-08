import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn: combina clases de Tailwind de forma segura (utilidad estándar de shadcn/ui).
 * Evita conflictos cuando un componente recibe clases que se pisan entre sí.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatoMoneda: da formato de moneda (MXN) a un número para tickets y precios.
 */
export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

/**
 * formatoFecha: convierte una fecha ISO a formato legible en español.
 */
export function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * diasHasta: calcula los días que faltan hasta una fecha (para alertas de vacunas).
 * Devuelve negativo si la fecha ya pasó.
 */
export function diasHasta(iso: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(iso);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
