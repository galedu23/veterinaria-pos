"use client";

// ============================================================
// app/(dashboard)/recetas/page.tsx — LISTADO GLOBAL de recetas.
//
// QUÉ: todas las recetas de la clínica con búsqueda e impresión
//   directa. Para EMITIR una receta se va al expediente (igual que
//   las consultas: la receta necesita el contexto del paciente).
// CÓMO SE CONECTA A SUPABASE: getRecetasGlobal() con joins a
//   mascotas y clientes.
// ============================================================

import * as React from "react";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TablaRecetas, type RecetaGlobal } from "@/components/recetas/tabla-recetas";
import { getRecetasGlobal } from "@/services/db";

export default function PaginaRecetas() {
  const [recetas, setRecetas] = React.useState<RecetaGlobal[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");

  // Carga inicial del listado completo
  React.useEffect(() => {
    getRecetasGlobal().then((r) => {
      setRecetas(r);
      setCargando(false);
    });
  }, []);

  // Filtro por paciente, dueño o nombre de algún medicamento recetado
  const recetasFiltradas = recetas.filter((r) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      r.nombreMascota.toLowerCase().includes(q) ||
      r.nombreDueno.toLowerCase().includes(q) ||
      r.medicamentos.some((m) => m.nombre.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <FileText className="h-6 w-6 text-blue-600" /> Recetas Médicas
      </h2>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente, dueño o medicamento..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <TablaRecetas recetas={recetasFiltradas} cargando={cargando} />

      <p className="text-xs text-muted-foreground">
        Las recetas se emiten desde el expediente de la mascota, donde está su historial clínico.
      </p>
    </div>
  );
}
