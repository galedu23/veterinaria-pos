"use client";

// ============================================================
// app/(dashboard)/servicios/page.tsx — CATÁLOGO DE SERVICIOS.
//
// QUÉ: administra los servicios de la clínica (Baño, Corte de uñas,
//   Profilaxis, Rayos X...). Este catálogo alimenta el select
//   "Tipo de servicio" del Alta de Consulta Clínica.
// PARA QUÉ: que el administrador agregue/renombre servicios SIN
//   tocar el código (antes eran una lista fija en el formulario).
// RELACIÓN EN SUPABASE: tabla `servicios`; `consultas.tipo_servicio`
//   guarda el nombre como texto — el borrado se protege verificando
//   que ninguna consulta use el servicio (regla en el servicio mock,
//   futura validación o FK en la BD).
// ============================================================

import * as React from "react";
import { HeartPulse, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablaServicios } from "@/components/servicios/tabla-servicios";
import { FormularioServicio } from "@/components/servicios/formulario-servicio";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { getServicios, eliminarServicio } from "@/services/db";
import type { Servicio } from "@/types";

export default function PaginaServicios() {
  // ---- Estado de datos ----
  const [servicios, setServicios] = React.useState<Servicio[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado de interfaz ----
  const [busqueda, setBusqueda] = React.useState("");
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [servicioEnEdicion, setServicioEnEdicion] = React.useState<Servicio | null>(null);
  const [servicioAEliminar, setServicioAEliminar] = React.useState<Servicio | null>(null);
  const [errorEliminar, setErrorEliminar] = React.useState("");

  /** cargarServicios: trae el catálogo completo del servicio mock */
  const cargarServicios = React.useCallback(async () => {
    setCargando(true);
    setServicios(await getServicios());
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  // Filtro en memoria por nombre o descripción
  const serviciosFiltrados = servicios.filter((s) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nombre.toLowerCase().includes(q) ||
      (s.descripcion ?? "").toLowerCase().includes(q)
    );
  });

  /** abrirCrear / abrirEditar: el mismo modal en sus dos modos */
  const abrirCrear = () => {
    setServicioEnEdicion(null);
    setModalAbierto(true);
  };
  const abrirEditar = (s: Servicio) => {
    setServicioEnEdicion(s);
    setModalAbierto(true);
  };

  /**
   * confirmarEliminar: el servicio mock rechaza borrar servicios ya
   * usados en consultas (protege el historial); mostramos ese error.
   */
  const confirmarEliminar = async () => {
    if (!servicioAEliminar) return;
    try {
      await eliminarServicio(servicioAEliminar.id);
      setServicioAEliminar(null);
      setErrorEliminar("");
      await cargarServicios();
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <HeartPulse className="h-6 w-6 text-rose-600" /> Servicios
        </h2>
        <Button onClick={abrirCrear}>
          <Plus /> Nuevo Servicio
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Este catálogo alimenta el campo &quot;Tipo de servicio&quot; del alta de consultas.
      </p>

      {/* Buscador del catálogo */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar servicio..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <TablaServicios
        servicios={serviciosFiltrados}
        cargando={cargando}
        onEditar={abrirEditar}
        onEliminar={(s) => {
          setErrorEliminar("");
          setServicioAEliminar(s);
        }}
      />

      <FormularioServicio
        abierto={modalAbierto}
        servicio={servicioEnEdicion}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={cargarServicios}
      />

      <DialogConfirmacion
        abierto={!!servicioAEliminar}
        titulo="¿Eliminar servicio?"
        mensaje={
          <>
            Se eliminará <strong>{servicioAEliminar?.nombre}</strong> del catálogo.
            {errorEliminar && (
              <span className="mt-2 block rounded-md bg-red-50 px-2 py-1 text-red-600">
                {errorEliminar}
              </span>
            )}
          </>
        }
        onConfirmar={confirmarEliminar}
        onCancelar={() => setServicioAEliminar(null)}
      />
    </div>
  );
}
