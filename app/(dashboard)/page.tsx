"use client";

// ============================================================
// app/(dashboard)/page.tsx — TABLERO PRINCIPAL.
//
// QUÉ muestra, de arriba hacia abajo (por orden de importancia):
//   1. Saludo y fecha — contexto de quién y cuándo.
//   2. KPIs del día: dinero, actividad clínica, citas y alertas.
//   3. Tendencia de ventas de la semana + servicios más dados del mes.
//   4. Pendientes accionables: citas próximas, vacunas por vencer y
//      productos por resurtir — con nombre y enlace, para poder ACTUAR.
//   5. Totales del sistema, al final: son contexto, no decisiones.
//
// POR QUÉ este orden: un tablero debe responder "¿qué tengo que hacer
//   hoy?", no "¿cuántos registros hay?". Los conteos históricos, que
//   antes ocupaban toda la pantalla, ahora van discretos al pie.
//
// ROLES: el dinero (ventas) solo lo ven administrador y recepción,
//   que son quienes operan la caja.
//
// CÓMO SE ALIMENTA: una sola llamada a getResumenDashboard(); los
//   gráficos se REUTILIZAN del módulo de reportes.
// ============================================================

import * as React from "react";
import Link from "next/link";
import {
  Wallet, Stethoscope, CalendarCheck, TriangleAlert, Loader2,
  Syringe, PackageSearch, Users, PawPrint, FileText, Package,
} from "lucide-react";
import { TarjetaKpi } from "@/components/dashboard/tarjeta-kpi";
import { PanelLista, type ItemPanel } from "@/components/dashboard/panel-lista";
import { GraficoBarras } from "@/components/reportes/grafico-barras";
import { BarrasHorizontales } from "@/components/reportes/barras-horizontales";
import { formatoMoneda, formatoFecha } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getResumenDashboard } from "@/services/db";

/** Tipo del resumen tal como lo entrega el servicio */
type Resumen = Awaited<ReturnType<typeof getResumenDashboard>>;

/** saludo: cambia según la hora, para que el tablero se sienta vivo */
function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * textoDias: traduce los días restantes a lenguaje natural.
 * Se usa en las listas de pendientes ("Hoy", "En 3 d", "Hace 5 d").
 */
function textoDias(dias: number): string {
  if (dias < 0) return `Hace ${Math.abs(dias)} d`;
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} d`;
}

export default function PaginaDashboard() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = React.useState<Resumen | null>(null);

  React.useEffect(() => {
    getResumenDashboard().then(setResumen);
  }, []);

  // Solo quienes operan la caja ven los importes
  const veDinero = tienePermiso(usuario, ["administrador", "recepcion"]);

  if (!resumen) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Se traducen los datos crudos a renglones de panel ---
  const itemsCitas: ItemPanel[] = resumen.proximasCitas.map((c, i) => ({
    id: `cita-${i}`,
    titulo: c.mascota,
    subtitulo: `${c.dueno} · ${formatoFecha(c.fecha)}`,
    valor: textoDias(c.dias),
    urgencia: c.dias <= 1 ? "alta" : c.dias <= 3 ? "media" : "baja",
    href: `/mascotas/${c.mascotaId}`,
  }));

  const itemsVacunas: ItemPanel[] = resumen.vacunasPendientes.map((v, i) => ({
    id: `vac-${i}`,
    titulo: `${v.vacuna} · ${v.mascota}`,
    subtitulo: formatoFecha(v.fecha),
    valor: v.dias < 0 ? "Vencida" : textoDias(v.dias),
    urgencia: v.dias < 0 ? "alta" : v.dias <= 15 ? "media" : "baja",
    href: `/mascotas/${v.mascotaId}`,
  }));

  const itemsStock: ItemPanel[] = resumen.stockBajo.map((p, i) => ({
    id: `stock-${i}`,
    titulo: p.nombre,
    subtitulo: `Mínimo: ${p.minimo} piezas`,
    valor: p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`,
    urgencia: p.stock === 0 ? "alta" : "media",
    href: "/productos",
  }));

  return (
    <div className="space-y-5">
      {/* ---------- 1. Saludo y fecha ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {saludo()}, {usuario?.nombre?.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground">
            Esto es lo que necesita tu atención hoy.
          </p>
        </div>
        <p className="text-sm capitalize text-muted-foreground">
          {new Date().toLocaleDateString("es-MX", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>

      {/* ---------- 2. KPIs del día ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {veDinero && (
          <TarjetaKpi
            titulo="Ventas de hoy"
            valor={formatoMoneda(resumen.kpis.ventasHoy)}
            subtitulo={`${resumen.kpis.ticketsHoy} ticket${resumen.kpis.ticketsHoy === 1 ? "" : "s"}`}
            icono={Wallet}
            color="verde"
            href="/ventas"
          />
        )}
        <TarjetaKpi
          titulo="Consultas de hoy"
          valor={String(resumen.kpis.consultasHoy)}
          subtitulo="Atenciones registradas"
          icono={Stethoscope}
          color="azul"
          href="/consultas"
        />
        <TarjetaKpi
          titulo="Citas esta semana"
          valor={String(resumen.kpis.citasSemana)}
          subtitulo="Próximos 7 días"
          icono={CalendarCheck}
          color="morado"
        />
        <TarjetaKpi
          titulo="Requieren atención"
          valor={String(resumen.kpis.alertas)}
          subtitulo="Vacunas y stock bajo"
          icono={TriangleAlert}
          color={resumen.kpis.alertas > 0 ? "rojo" : "gris"}
        />
      </div>

      {/* ---------- 3. Gráficos: tendencia y mezcla de servicios ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {veDinero && (
          <div className="lg:col-span-2">
            <GraficoBarras
              titulo="Ventas de los últimos 7 días"
              datos={resumen.ventasSemana}
              cadaCuantasEtiquetas={1} /* con 7 barras caben todas las etiquetas */
            />
          </div>
        )}
        <div className={veDinero ? "" : "lg:col-span-3"}>
          <BarrasHorizontales
            titulo="Servicios más dados este mes"
            datos={resumen.porServicio}
            formatoValor={(v) => `${v} ${v === 1 ? "vez" : "veces"}`}
            textoVacio="Aún no hay consultas este mes."
          />
        </div>
      </div>

      {/* ---------- 4. Pendientes accionables ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelLista
          titulo="Próximas citas"
          icono={CalendarCheck}
          items={itemsCitas}
          textoVacio="Sin citas agendadas esta semana."
          hrefVerTodo="/consultas"
        />
        <PanelLista
          titulo="Vacunas por aplicar"
          icono={Syringe}
          items={itemsVacunas}
          textoVacio="Todas las vacunas al día."
          hrefVerTodo="/vacunas"
        />
        <PanelLista
          titulo="Productos por resurtir"
          icono={PackageSearch}
          items={itemsStock}
          textoVacio="Inventario en niveles correctos."
          hrefVerTodo="/productos"
        />
      </div>

      {/* ---------- 5. Totales del sistema (contexto, al final) ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { etiqueta: "Clientes", valor: resumen.totales.clientes, icono: Users, href: "/clientes" },
          { etiqueta: "Mascotas", valor: resumen.totales.mascotas, icono: PawPrint, href: "/mascotas" },
          { etiqueta: "Consultas", valor: resumen.totales.consultas, icono: FileText, href: "/consultas" },
          { etiqueta: "Productos", valor: resumen.totales.productos, icono: Package, href: "/productos" },
        ].map((t) => (
          <Link
            key={t.etiqueta}
            href={t.href}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent"
          >
            <t.icono className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none tabular-nums">{t.valor}</p>
              <p className="text-xs text-muted-foreground">{t.etiqueta}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
