"use client";

// ============================================================
// app/(dashboard)/consultas/page.tsx — LISTADO GLOBAL de consultas.
//
// QUÉ: todas las consultas de la clínica con la FOTO del paciente,
//   búsqueda por paciente/dueño/motivo/diagnóstico, y alta de una
//   consulta nueva sin salir de aquí.
//
// FLUJO DE ALTA (3 pasos encadenados):
//   1. SelectorPaciente  -> ¿a qué mascota se atiende?
//   2. FormularioConsultaCompleta -> se captura la consulta
//   3. FormularioReceta  -> se abre solo, ligado a esa consulta
//   POR QUÉ el paso 1: una consulta SIEMPRE pertenece a un paciente.
//   Antes solo se podía dar de alta desde el expediente (donde el
//   paciente ya se conoce); el selector conserva esa regla y además
//   permite empezar desde este listado.
//
// ROLES: capturar consultas es acto clínico -> solo administrador y
//   veterinario ven el botón de alta.
// CÓMO SE CONECTA A SUPABASE: getConsultasGlobal() con join a mascotas
//   y clientes; el nombre del veterinario sale de getUsuarios().
// ============================================================

import * as React from "react";
import { Stethoscope, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TablaConsultas, type ConsultaGlobal } from "@/components/consultas/tabla-consultas";
import { SelectorPaciente } from "@/components/consultas/selector-paciente";
import { FormularioConsultaCompleta } from "@/components/consultas/formulario-consulta-completa";
import { FormularioReceta } from "@/components/expediente/formulario-receta";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getConsultasGlobal } from "@/services/db";
import { getUsuarios } from "@/services/auth";
import type { Consulta, Mascota } from "@/types";

export default function PaginaConsultas() {
  const { usuario } = useAuth();

  // ---- Estado de datos ----
  const [consultas, setConsultas] = React.useState<ConsultaGlobal[]>([]);
  // Mapa id -> nombre para mostrar quién atendió cada consulta
  const [nombresVeterinarios, setNombresVeterinarios] = React.useState<Record<string, string>>({});
  const [cargando, setCargando] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");

  // ---- Estado del alta encadenada ----
  const [selectorAbierto, setSelectorAbierto] = React.useState(false);
  // Paciente elegido en el paso 1 (null = formulario de consulta cerrado)
  const [pacienteElegido, setPacienteElegido] = React.useState<Mascota | null>(null);
  // Consulta recién creada (null = modal de receta cerrado)
  const [consultaParaReceta, setConsultaParaReceta] = React.useState<Consulta | null>(null);

  /** cargarDatos: consultas + usuarios (para resolver los nombres) */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [cons, usuarios] = await Promise.all([getConsultasGlobal(), getUsuarios()]);
    setConsultas(cons);
    const mapa: Record<string, string> = {};
    for (const u of usuarios) mapa[u.id] = u.nombre;
    setNombresVeterinarios(mapa);
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtro en memoria: incluye al DUEÑO para distinguir mascotas homónimas
  const consultasFiltradas = consultas.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombreMascota.toLowerCase().includes(q) ||
      c.nombreDueno.toLowerCase().includes(q) ||
      c.motivo.toLowerCase().includes(q) ||
      c.diagnostico.toLowerCase().includes(q)
    );
  });

  // Capturar consultas es un acto clínico: recepción no lo hace
  const puedeCapturar = tienePermiso(usuario, ["administrador", "veterinario"]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Stethoscope className="h-6 w-6 text-green-600" /> Consultas
        </h2>
        {puedeCapturar && (
          <Button onClick={() => setSelectorAbierto(true)}>
            <Plus /> Nueva consulta
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente, dueño, motivo o diagnóstico..."
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

      {/* ---------- Paso 1: elegir paciente ---------- */}
      <SelectorPaciente
        abierto={selectorAbierto}
        onCerrar={() => setSelectorAbierto(false)}
        onSeleccionar={(mascota) => {
          setSelectorAbierto(false);
          setPacienteElegido(mascota); // abre el formulario del paso 2
        }}
      />

      {/* ---------- Paso 2: capturar la consulta ---------- */}
      <FormularioConsultaCompleta
        abierto={!!pacienteElegido}
        mascotaId={pacienteElegido?.id ?? ""}
        onCerrar={() => setPacienteElegido(null)}
        onGuardado={(consultaCreada) => {
          cargarDatos();                     // refresca el listado
          setConsultaParaReceta(consultaCreada); // paso 3: receta ligada
        }}
      />

      {/* ---------- Paso 3: receta ligada a la consulta creada ---------- */}
      <FormularioReceta
        abierto={!!consultaParaReceta}
        mascotaId={consultaParaReceta?.mascotaId ?? ""}
        consultaId={consultaParaReceta?.id ?? ""}
        onCerrar={() => setConsultaParaReceta(null)}
        onGuardado={cargarDatos}
      />
    </div>
  );
}
