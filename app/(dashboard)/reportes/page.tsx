"use client";

// ============================================================
// app/(dashboard)/reportes/page.tsx — PANEL DE REPORTES MENSUALES.
//
// QUÉ: dashboard de ventas del mes con:
//   - Tarjetas: total del mes (+% vs anterior), tickets y promedio
//   - Gráfico de barras: ventas por día del mes
//   - Top 5 de productos más vendidos (por importe)
//   - Desglose de ingresos por método de pago
// POR QUÉ solo administrador: los ingresos del negocio son
//   información gerencial, no operativa.
// CÓMO SE CONECTA A SUPABASE: TODA la matemática vive en
//   getReporteMensual() (services/db.ts); esta página y sus
//   componentes solo pintan lo que el servicio entrega.
// ============================================================

import * as React from "react";
import { BarChart3, ShieldAlert, Loader2 } from "lucide-react";
import { TarjetaResumen } from "@/components/reportes/tarjeta-resumen";
import { GraficoBarras } from "@/components/reportes/grafico-barras";
import { BarrasHorizontales } from "@/components/reportes/barras-horizontales";
import { formatoMoneda } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getReporteMensual } from "@/services/db";

/** Tipo del reporte tal como lo entrega el servicio */
type Reporte = Awaited<ReturnType<typeof getReporteMensual>>;

/** nombreDelMes: "2026-07" -> "julio de 2026" (título legible) */
function nombreDelMes(mesIso: string): string {
  const [anio, mes] = mesIso.split("-").map(Number);
  return new Date(anio, mes - 1, 1).toLocaleDateString("es-MX", {
    month: "long", year: "numeric",
  });
}

export default function PaginaReportes() {
  const { usuario } = useAuth();
  const [reporte, setReporte] = React.useState<Reporte | null>(null);

  React.useEffect(() => {
    getReporteMensual().then(setReporte);
  }, []);

  // Defensa en profundidad: el sidebar oculta el enlace, pero la
  // página vuelve a validar por si teclean la URL directamente.
  if (!tienePermiso(usuario, ["administrador"])) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Solo el administrador puede ver los reportes de ventas.
        </p>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="h-6 w-6 text-blue-600" /> Reportes de Ventas
        </h2>
        <p className="text-sm capitalize text-muted-foreground">
          {nombreDelMes(reporte.mesActual)}
        </p>
      </div>

      {/* Tarjetas de resumen del mes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaResumen
          titulo="Ventas del mes"
          valor={formatoMoneda(reporte.totalMesActual)}
          variacion={reporte.variacionPorcentaje}
          notaComparativa="vs mes anterior"
        />
        <TarjetaResumen
          titulo="Mes anterior"
          valor={formatoMoneda(reporte.totalMesAnterior)}
        />
        <TarjetaResumen
          titulo="Días con ventas"
          valor={String(reporte.ventasPorDia.filter((d) => d.total > 0).length)}
        />
      </div>

      {/* Ventas por día del mes (una serie -> un solo tono, con tooltip) */}
      <GraficoBarras
        titulo="Ventas por día del mes"
        datos={reporte.ventasPorDia.map((d) => ({ etiqueta: String(d.dia), valor: d.total }))}
      />

      {/* Rankings lado a lado en escritorio */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarrasHorizontales
          titulo="Top 5 productos del mes"
          datos={reporte.topProductos.map((p) => ({
            etiqueta: p.nombre,
            valor: p.importe,
            detalle: `${p.cantidad} pza${p.cantidad === 1 ? "" : "s"}`,
          }))}
          textoVacio="Aún no hay ventas este mes."
        />
        <BarrasHorizontales
          titulo="Ingresos por método de pago"
          datos={[
            { etiqueta: "Efectivo", valor: reporte.porMetodo.efectivo },
            { etiqueta: "Tarjeta", valor: reporte.porMetodo.tarjeta },
            { etiqueta: "Transferencia", valor: reporte.porMetodo.transferencia },
          ]}
        />
      </div>
    </div>
  );
}
