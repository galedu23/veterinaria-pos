"use client";

// ============================================================
// recordatorios-portal.tsx — AVISOS del portal del cliente.
//
// QUÉ: la lista de "lo que viene" para todas sus mascotas: vacunas por
//   vencer y citas agendadas, ordenadas de lo más urgente a lo más
//   lejano.
// PARA QUÉ va HASTA ARRIBA: es la razón principal por la que un dueño
//   abre el enlace ("¿cuándo le toca la vacuna a Lobo?"). Si tiene que
//   buscarla, el portal falló.
// LENGUAJE: nada de tecnicismos ni fechas ISO — se escribe como se lo
//   diría una recepcionista ("Vence en 5 días", "Venció hace 3 días").
// ============================================================

import { Syringe, CalendarCheck, CircleCheck } from "lucide-react";
import { formatoFecha } from "@/lib/utils";
import type { RecordatorioPortal } from "@/types";

/**
 * textoTiempo: traduce los días restantes a una frase natural.
 * POR QUÉ: "faltan -3 días" no lo entiende nadie; "Venció hace 3 días" sí.
 */
function textoTiempo(dias: number): string {
  if (dias < 0) {
    const vencidos = Math.abs(dias);
    return `Venció hace ${vencidos} ${vencidos === 1 ? "día" : "días"}`;
  }
  if (dias === 0) return "¡Es hoy!";
  if (dias === 1) return "Es mañana";
  return `En ${dias} días`;
}

/** Colores del aviso según qué tan urgente sea */
const ESTILOS = {
  vencido: "border-red-300 bg-red-50 text-red-900",
  proximo: "border-amber-300 bg-amber-50 text-amber-900",
  programado: "border-blue-200 bg-blue-50 text-blue-900",
} as const;

interface Props {
  recordatorios: RecordatorioPortal[];
}

export function RecordatoriosPortal({ recordatorios }: Props) {
  // Sin pendientes: mensaje tranquilizador en vez de una lista vacía
  if (recordatorios.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <CircleCheck className="h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p className="font-semibold text-green-900">Todo al día</p>
          <p className="text-sm text-green-800">
            No tienes vacunas ni citas pendientes por ahora.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold">Próximos pendientes</h2>
      {recordatorios.map((r, i) => (
        <div
          key={`${r.tipo}-${r.nombreMascota}-${i}`}
          className={`flex items-center gap-3 rounded-xl border p-3 ${ESTILOS[r.urgencia]}`}
        >
          {/* Icono según el tipo de pendiente */}
          {r.tipo === "vacuna" ? (
            <Syringe className="h-5 w-5 shrink-0" />
          ) : (
            <CalendarCheck className="h-5 w-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {r.descripcion} · {r.nombreMascota}
            </p>
            <p className="text-xs opacity-80">{formatoFecha(r.fecha)}</p>
          </div>
          <span className="shrink-0 text-sm font-bold">{textoTiempo(r.diasRestantes)}</span>
        </div>
      ))}
    </div>
  );
}
