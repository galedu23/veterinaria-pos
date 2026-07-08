"use client";

// ============================================================
// app/(dashboard)/consultas/page.tsx — LISTADO GLOBAL de consultas.
//
// QUÉ: todas las consultas de la clínica, con búsqueda por paciente,
//   motivo o diagnóstico. Para CAPTURAR una consulta se navega al
//   expediente de la mascota (ahí está el contexto clínico completo).
// POR QUÉ no hay botón "nueva consulta" aquí: una consulta sin
//   paciente seleccionado no tiene sentido; el flujo correcto es
//   buscar la mascota -> abrir expediente -> registrar.
// CÓMO SE CONECTA A SUPABASE: getConsultasGlobal() con join a
//   mascotas; el nombre del veterinario sale de getUsuarios().
// ============================================================

import * as React from "react";
import { Stethoscope, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TablaConsultas, type ConsultaGlobal } from "@/components/consultas/tabla-consultas";
import { getConsultasGlobal } from "@/services/db";
import { getUsuarios } from "@/services/auth";

export default function PaginaConsultas() {
  const [consultas, setConsultas] = React.useState<ConsultaGlobal[]>([]);
  // Mapa id -> nombre para mostrar quién atendió cada consulta
  const [nombresVeterinarios, setNombresVeterinarios] = React.useState<Record<string, string>>({});
  const [cargando, setCargando] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");

  // Carga inicial: consultas + usuarios (para resolver nombres) en paralelo
  React.useEffect(() => {
    (async () => {
      const [cons, usuarios] = await Promise.all([getConsultasGlobal(), getUsuarios()]);
      setConsultas(cons);
      const mapa: Record<string, string> = {};
      for (const u of usuarios) mapa[u.id] = u.nombre;
      setNombresVeterinarios(mapa);
      setCargando(false);
    })();
  }, []);

  // Filtro en memoria por paciente, motivo o diagnóstico
  const consultasFiltradas = consultas.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombreMascota.toLowerCase().includes(q) ||
      c.motivo.toLowerCase().includes(q) ||
      c.diagnostico.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Stethoscope className="h-6 w-6 text-green-600" /> Consultas
      </h2>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente, motivo o diagnóstico..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <TablaConsultas
        consultas={consultasFiltradas}
        nombresVeterinarios={nombresVeterinarios}
        cargando={cargando}
      />

      <p className="text-xs text-muted-foreground">
        Para registrar una consulta nueva, abre el expediente de la mascota desde el
        listado de Mascotas o el buscador global (Ctrl+K).
      </p>
    </div>
  );
}
