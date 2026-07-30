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
 * calcularEdad: convierte una fecha de nacimiento en edad legible
 * ("3 años 2 meses" o "5 meses" en cachorros).
 * PARA QUÉ: los documentos legales y certificados piden la edad del
 * paciente, no su fecha de nacimiento.
 */
export function calcularEdad(fechaNacimiento?: string): string {
  if (!fechaNacimiento) return "";
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  // Si aún no llega el día del mes, ese mes no se cumplió
  if (hoy.getDate() < nacimiento.getDate()) meses--;
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  if (anios < 0) return ""; // fecha futura: dato inválido

  // En cachorros los meses son lo relevante; en adultos, los años
  if (anios === 0) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const textoAnios = `${anios} ${anios === 1 ? "año" : "años"}`;
  return meses > 0 ? `${textoAnios} ${meses} ${meses === 1 ? "mes" : "meses"}` : textoAnios;
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
