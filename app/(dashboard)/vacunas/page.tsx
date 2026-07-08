"use client";

// ============================================================
// app/(dashboard)/vacunas/page.tsx — CONTROL GLOBAL de vacunación.
//
// QUÉ: panel para que el equipo detecte refuerzos vencidos o por
//   vencer y llame a los dueños. Incluye un filtro rápido
//   "Solo próximas/vencidas" que es el uso principal de esta vista.
// POR QUÉ el filtro por defecto está ACTIVADO: lo que la clínica
//   necesita a diario son las alertas, no el histórico completo.
// CÓMO SE CONECTA A SUPABASE: getVacunasGlobal(); a futuro puede
//   agregarse un recordatorio automático (email/WhatsApp) con un
//   cron de Supabase Edge Functions leyendo las mismas fechas.
// ============================================================

import * as React from "react";
import { Syringe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TablaVacunas, type VacunaGlobal } from "@/components/vacunas/tabla-vacunas";
import { diasHasta } from "@/lib/utils";
import { getVacunasGlobal } from "@/services/db";

export default function PaginaVacunas() {
  const [vacunas, setVacunas] = React.useState<VacunaGlobal[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");
  // Filtro principal: mostrar solo las que requieren acción (≤30 días o vencidas)
  const [soloAlertas, setSoloAlertas] = React.useState(true);

  React.useEffect(() => {
    getVacunasGlobal().then((v) => {
      setVacunas(v);
      setCargando(false);
    });
  }, []);

  // Aplicamos ambos filtros: alertas + texto de búsqueda
  const vacunasFiltradas = vacunas.filter((v) => {
    if (soloAlertas) {
      // Sin próxima dosis no genera alerta; con ella, solo si vence en ≤30 días
      if (!v.proximaDosis || diasHasta(v.proximaDosis) > 30) return false;
    }
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      v.nombre.toLowerCase().includes(q) ||
      v.nombreMascota.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Syringe className="h-6 w-6 text-purple-600" /> Control de Vacunas
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vacuna o paciente..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        {/* Alterna entre "solo alertas" (uso diario) y el histórico completo */}
        <Button
          variant={soloAlertas ? "default" : "outline"}
          size="sm"
          onClick={() => setSoloAlertas(!soloAlertas)}
        >
          {soloAlertas ? "Viendo: próximas y vencidas" : "Viendo: todas"}
        </Button>
      </div>

      <TablaVacunas vacunas={vacunasFiltradas} cargando={cargando} />

      <p className="text-xs text-muted-foreground">
        Las vacunas se registran desde el expediente de cada mascota. Este panel sirve
        para detectar refuerzos pendientes y contactar a los dueños.
      </p>
    </div>
  );
}
