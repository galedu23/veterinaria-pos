"use client";

// ============================================================
// app/(dashboard)/razas/page.tsx — Catálogo de ESPECIES y RAZAS.
//
// QUÉ: dos tarjetas lado a lado. La izquierda gestiona especies;
//   la derecha gestiona las razas DE LA ESPECIE SELECCIONADA
//   (mismo patrón de select dependiente que el formulario de mascotas).
// POR QUÉ ambas usan <CatalogoSimple>: son listas de nombres; solo
//   cambian las funciones del servicio que se les inyectan.
// CÓMO SE CONECTA A SUPABASE: crearEspecie/crearRaza/eliminarRaza;
//   eliminarRaza falla si hay mascotas con esa raza (FK RESTRICT).
// ============================================================

import * as React from "react";
import { Dog, PawPrint, Tags } from "lucide-react";
import { CatalogoSimple } from "@/components/catalogos/catalogo-simple";
import { SelectNativo } from "@/components/compartidos/select-nativo";
import { Label } from "@/components/ui/label";
import {
  getEspecies, getRazas, getMascotas, crearEspecie, crearRaza, eliminarRaza,
} from "@/services/db";
import type { Especie, Raza, Mascota } from "@/types";

export default function PaginaRazas() {
  const [especies, setEspecies] = React.useState<Especie[]>([]);
  const [razas, setRazas] = React.useState<Raza[]>([]);
  const [mascotas, setMascotas] = React.useState<Mascota[]>([]);
  const [cargando, setCargando] = React.useState(true);
  // Especie activa: sus razas son las que se listan a la derecha
  const [especieId, setEspecieId] = React.useState("");

  /** cargarDatos: catálogos + mascotas (para contar cuántas usan cada raza) */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [esp, raz, masc] = await Promise.all([getEspecies(), getRazas(), getMascotas()]);
    setEspecies(esp);
    setRazas(raz);
    setMascotas(masc);
    // Seleccionamos la primera especie si aún no hay una activa
    setEspecieId((actual) => actual || (esp[0]?.id ?? ""));
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Razas visibles = las de la especie seleccionada
  const razasDeEspecie = razas.filter((r) => r.especieId === especieId);

  /** cuantasMascotas: cuenta las mascotas registradas con una raza */
  const cuantasMascotas = (razaId: string) =>
    mascotas.filter((m) => m.razaId === razaId).length;

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Dog className="h-6 w-6 text-blue-600" /> Especies y Razas
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* -------- Especies -------- */}
        <CatalogoSimple
          titulo="Especies"
          icono={<PawPrint className="h-4 w-4 text-blue-600" />}
          items={especies}
          cargando={cargando}
          placeholder="Nueva especie (ej. Conejo)"
          detalle={(e) => {
            const n = razas.filter((r) => r.especieId === e.id).length;
            return `${n} raza${n === 1 ? "" : "s"}`;
          }}
          onAgregar={async (nombre) => {
            await crearEspecie(nombre);
            await cargarDatos();
          }}
          // Sin onEliminar: borrar una especie arrastraría razas y mascotas;
          // se deja para cuando haya reasignación de registros.
        />

        {/* -------- Razas de la especie seleccionada -------- */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="filtroEspecie">Razas de la especie:</Label>
            <SelectNativo id="filtroEspecie" value={especieId}
              onChange={(e) => setEspecieId(e.target.value)}>
              {especies.map((esp) => (
                <option key={esp.id} value={esp.id}>{esp.nombre}</option>
              ))}
            </SelectNativo>
          </div>

          <CatalogoSimple
            titulo={`Razas (${razasDeEspecie.length})`}
            icono={<Tags className="h-4 w-4 text-green-600" />}
            items={razasDeEspecie}
            cargando={cargando}
            placeholder="Nueva raza para esta especie"
            detalle={(r) => {
              const n = cuantasMascotas(r.id);
              return n > 0 ? `${n} mascota${n === 1 ? "" : "s"} registrada${n === 1 ? "" : "s"}` : null;
            }}
            onAgregar={async (nombre) => {
              await crearRaza(especieId, nombre);
              await cargarDatos();
            }}
            onEliminar={async (item) => {
              await eliminarRaza(item.id); // el servicio valida que no tenga mascotas
              await cargarDatos();
            }}
          />
        </div>
      </div>
    </div>
  );
}
