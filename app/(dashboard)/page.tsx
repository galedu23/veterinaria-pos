"use client";

// ============================================================
// app/(dashboard)/page.tsx — DASHBOARD principal.
// Recrea las tarjetas de métricas del sistema anterior con sus
// colores (amarillo, gris, azul, verde, rojo) y agrega una
// tarjeta de alertas de vacunas próximas a vencer.
// Los datos vienen de services/db.ts (mock).
// TODO: Al conectar Supabase, getDashboardStats() hará los COUNT reales.
// ============================================================

import * as React from "react";
import Link from "next/link";
import {
  Users, UserRound, PawPrint, Stethoscope, Package, Syringe,
  ArrowRightCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDashboardStats } from "@/services/db";
import type { DashboardStats } from "@/types";

// Configuración de cada tarjeta: color de fondo, icono y destino.
// Los colores replican la referencia: amarillo, gris, azul, verde, rojo.
const TARJETAS = [
  { clave: "usuarios", titulo: "Usuarios Registrados", color: "bg-yellow-500", icono: UserRound, href: "/usuarios" },
  { clave: "clientes", titulo: "Clientes Registrados", color: "bg-gray-500", icono: Users, href: "/clientes" },
  { clave: "mascotas", titulo: "Mascotas Registradas", color: "bg-blue-600", icono: PawPrint, href: "/mascotas" },
  { clave: "consultas", titulo: "Consultas Registradas", color: "bg-green-600", icono: Stethoscope, href: "/consultas" },
  { clave: "productos", titulo: "Productos Registrados", color: "bg-red-600", icono: Package, href: "/productos" },
] as const;

/**
 * TarjetaMetrica: tarjeta de color con el número grande, título,
 * icono de fondo y pie "Más información" (como el sistema anterior).
 */
function TarjetaMetrica({
  titulo, valor, color, icono: Icono, href,
}: {
  titulo: string;
  valor: number;
  color: string;
  icono: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg text-white shadow-md", color)}>
      {/* Icono decorativo semitransparente al fondo */}
      <Icono className="absolute right-3 top-3 h-16 w-16 opacity-25" />
      <div className="p-4 pb-2">
        <p className="text-3xl font-bold">{valor}</p>
        <p className="mt-1 text-sm font-medium">{titulo}</p>
      </div>
      {/* Pie con enlace al módulo correspondiente */}
      <Link
        href={href}
        className="mt-2 flex items-center justify-center gap-1.5 bg-black/15 py-1.5 text-sm font-medium transition-colors hover:bg-black/25"
      >
        Más información <ArrowRightCircle className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function PaginaDashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);

  // Cargamos las métricas al montar la vista
  React.useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  // Indicador de carga mientras llegan las métricas
  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
        Bienvenidos al Sistema
      </h2>

      {/* Rejilla de tarjetas de métricas (responsive: 1/2/3 columnas) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TARJETAS.map((t) => (
          <TarjetaMetrica
            key={t.clave}
            titulo={t.titulo}
            valor={stats[t.clave]}
            color={t.color}
            icono={t.icono}
            href={t.href}
          />
        ))}

        {/* Tarjeta extra: alertas de vacunas próximas (30 días) */}
        <TarjetaMetrica
          titulo="Vacunas próximas (30 días)"
          valor={stats.vacunasProximas}
          color="bg-purple-600"
          icono={Syringe}
          href="/vacunas"
        />
      </div>
    </div>
  );
}
