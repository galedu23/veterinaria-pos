"use client";

// ============================================================
// app/(dashboard)/clientes/page.tsx — Página de CLIENTES.
//
// QUÉ: orquesta el módulo de clientes: carga datos, filtra por
//   el buscador y coordina TablaClientes + FormularioCliente +
//   DialogConfirmacion.
// POR QUÉ: mismo patrón contenedor/presentacional que Productos,
//   para que todos los módulos se mantengan igual y sea fácil
//   ubicarse en cualquiera de ellos.
// CÓMO SE CONECTA A SUPABASE: vía services/db.ts. El conteo de
//   mascotas por cliente hoy se calcula en memoria; en Supabase
//   será un select con count: mascotas(count).
// ============================================================

import * as React from "react";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablaClientes } from "@/components/clientes/tabla-clientes";
import { FormularioCliente } from "@/components/clientes/formulario-cliente";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getClientes, getMascotas, eliminarCliente } from "@/services/db";
import type { Cliente } from "@/types";

export default function PaginaClientes() {
  const { usuario } = useAuth();

  // ---- Estado de datos ----
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  // Mapa clienteId -> cuántas mascotas tiene (para el badge de la tabla)
  const [conteoMascotas, setConteoMascotas] = React.useState<Record<string, number>>({});
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado de interfaz ----
  const [busqueda, setBusqueda] = React.useState("");
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [clienteEnEdicion, setClienteEnEdicion] = React.useState<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = React.useState<Cliente | null>(null);
  const [errorEliminar, setErrorEliminar] = React.useState("");

  /** cargarDatos: clientes + mascotas para calcular el conteo por dueño */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [clis, mascotas] = await Promise.all([getClientes(), getMascotas()]);
    setClientes(clis);
    // Reducimos las mascotas a un mapa { clienteId: cantidad }
    const conteo: Record<string, number> = {};
    for (const m of mascotas) conteo[m.clienteId] = (conteo[m.clienteId] ?? 0) + 1;
    setConteoMascotas(conteo);
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtro por nombre completo, teléfono o email
  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      `${c.nombre} ${c.apellidos}`.toLowerCase().includes(q) ||
      c.telefono.includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  /** abrirCrear / abrirEditar: controlan el modal en sus dos modos */
  const abrirCrear = () => {
    setClienteEnEdicion(null);
    setModalAbierto(true);
  };
  const abrirEditar = (c: Cliente) => {
    setClienteEnEdicion(c);
    setModalAbierto(true);
  };

  /**
   * confirmarEliminar: el servicio rechaza borrar clientes con mascotas
   * (regla de negocio); capturamos ese error y lo mostramos.
   */
  const confirmarEliminar = async () => {
    if (!clienteAEliminar) return;
    try {
      await eliminarCliente(clienteAEliminar.id);
      setClienteAEliminar(null);
      setErrorEliminar("");
      await cargarDatos();
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="h-6 w-6 text-gray-600" /> Clientes
        </h2>
        <Button onClick={abrirCrear}>
          <Plus /> Nuevo Cliente
        </Button>
      </div>

      {/* Buscador del listado */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          className="pl-8"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <TablaClientes
        clientes={clientesFiltrados}
        conteoMascotas={conteoMascotas}
        cargando={cargando}
        puedeEliminar={tienePermiso(usuario, ["administrador"])}
        onEditar={abrirEditar}
        onEliminar={(c) => {
          setErrorEliminar("");
          setClienteAEliminar(c);
        }}
      />

      <FormularioCliente
        abierto={modalAbierto}
        cliente={clienteEnEdicion}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={cargarDatos}
      />

      <DialogConfirmacion
        abierto={!!clienteAEliminar}
        titulo="¿Eliminar cliente?"
        mensaje={
          <>
            Se eliminará <strong>{clienteAEliminar?.nombre} {clienteAEliminar?.apellidos}</strong>.
            {errorEliminar && (
              <span className="mt-2 block rounded-md bg-red-50 px-2 py-1 text-red-600">
                {errorEliminar}
              </span>
            )}
          </>
        }
        onConfirmar={confirmarEliminar}
        onCancelar={() => setClienteAEliminar(null)}
      />
    </div>
  );
}
