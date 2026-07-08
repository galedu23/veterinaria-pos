"use client";

// ============================================================
// app/(dashboard)/mascotas/page.tsx — Página de MASCOTAS.
//
// QUÉ: listado con el BUSCADOR INTELIGENTE cruzado. El texto que
//   escribes se busca a la vez en: nombre de mascota + nombre del
//   dueño + raza + especie. Ejemplos:
//     "lobo"          -> los dos Lobos
//     "lobo garcía"   -> solo el Lobo de María García
//     "lobo criollo"  -> solo el Lobo criollo
// POR QUÉ con debounce: espera 300 ms tras la última tecla antes de
//   consultar, para no disparar una búsqueda por cada letra (con
//   Supabase eso serían peticiones de red innecesarias).
// CÓMO SE CONECTA A SUPABASE: buscarMascotasAvanzado se convertirá
//   en una vista o RPC con joins (mascotas + clientes + razas).
// ============================================================

import * as React from "react";
import { PawPrint, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablaMascotas, type MascotaEnriquecida } from "@/components/mascotas/tabla-mascotas";
import { FormularioMascota } from "@/components/mascotas/formulario-mascota";
import {
  buscarMascotasAvanzado, getClientes, getEspecies, getRazas,
} from "@/services/db";
import type { Cliente, Especie, Raza } from "@/types";

export default function PaginaMascotas() {
  // ---- Estado de datos ----
  const [mascotas, setMascotas] = React.useState<MascotaEnriquecida[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [especies, setEspecies] = React.useState<Especie[]>([]);
  const [razas, setRazas] = React.useState<Raza[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado de interfaz ----
  const [busqueda, setBusqueda] = React.useState("");
  const [panelAbierto, setPanelAbierto] = React.useState(false);
  const [mascotaEnEdicion, setMascotaEnEdicion] = React.useState<MascotaEnriquecida | null>(null);

  /**
   * buscar: llama al buscador inteligente del servicio.
   * Con texto vacío devuelve TODAS las mascotas enriquecidas.
   */
  const buscar = React.useCallback(async (texto: string) => {
    setCargando(true);
    setMascotas(await buscarMascotasAvanzado(texto));
    setCargando(false);
  }, []);

  // Carga inicial: catálogos (una sola vez) + todas las mascotas
  React.useEffect(() => {
    (async () => {
      const [clis, esp, raz] = await Promise.all([getClientes(), getEspecies(), getRazas()]);
      setClientes(clis);
      setEspecies(esp);
      setRazas(raz);
      await buscar("");
    })();
  }, [buscar]);

  // Debounce del buscador: 300 ms después de la última tecla
  React.useEffect(() => {
    const temporizador = setTimeout(() => buscar(busqueda), 300);
    return () => clearTimeout(temporizador); // cancela si sigue tecleando
  }, [busqueda, buscar]);

  const abrirCrear = () => {
    setMascotaEnEdicion(null);
    setPanelAbierto(true);
  };
  const abrirEditar = (m: MascotaEnriquecida) => {
    setMascotaEnEdicion(m);
    setPanelAbierto(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <PawPrint className="h-6 w-6 text-blue-600" /> Mascotas
        </h2>
        <Button onClick={abrirCrear}>
          <Plus /> Registrar Mascota
        </Button>
      </div>

      {/* Buscador inteligente cruzado */}
      <div className="space-y-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder='Buscar cruzando datos: "lobo garcía", "lobo criollo"...'
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: combina nombre + dueño + raza para distinguir mascotas con el mismo nombre.
        </p>
      </div>

      <TablaMascotas
        mascotas={mascotas}
        cargando={cargando}
        onEditar={abrirEditar}
      />

      <FormularioMascota
        abierto={panelAbierto}
        mascota={mascotaEnEdicion}
        clientes={clientes}
        especies={especies}
        razas={razas}
        onCerrar={() => setPanelAbierto(false)}
        onGuardado={() => buscar(busqueda)}
      />
    </div>
  );
}
