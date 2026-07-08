"use client";

// ============================================================
// formulario-cliente.tsx — Modal (Dialog) de Crear/Editar cliente.
//
// QUÉ: formulario con los datos del dueño: nombre, apellidos,
//   teléfono, email y dirección. Modo crear (cliente=null) o editar.
// POR QUÉ Dialog y no Sheet: el formulario de cliente es corto
//   (5 campos), un modal centrado se lee mejor; el Sheet lo
//   reservamos para formularios largos como el de productos.
// CÓMO SE CONECTA A SUPABASE: llama a crearCliente/actualizarCliente
//   de services/db.ts; al conectar la BD real este archivo no cambia.
// ============================================================

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { crearCliente, actualizarCliente } from "@/services/db";
import type { Cliente } from "@/types";

interface Campos {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
}

const CAMPOS_VACIOS: Campos = { nombre: "", apellidos: "", telefono: "", email: "", direccion: "" };

interface Props {
  abierto: boolean;
  /** null = crear nuevo; con cliente = editar */
  cliente: Cliente | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function FormularioCliente({ abierto, cliente, onCerrar, onGuardado }: Props) {
  const [campos, setCampos] = React.useState<Campos>(CAMPOS_VACIOS);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Al abrir: precargar datos si es edición, o limpiar si es nuevo
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    setCampos(
      cliente
        ? {
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            telefono: cliente.telefono,
            email: cliente.email ?? "",
            direccion: cliente.direccion ?? "",
          }
        : CAMPOS_VACIOS
    );
  }, [abierto, cliente]);

  const actualizarCampo = (campo: keyof Campos, valor: string) =>
    setCampos((c) => ({ ...c, [campo]: valor }));

  /** guardar: valida lo mínimo indispensable y llama al servicio */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const datos = {
      nombre: campos.nombre.trim(),
      apellidos: campos.apellidos.trim(),
      telefono: campos.telefono.trim(),
      email: campos.email.trim() || undefined,
      direccion: campos.direccion.trim() || undefined,
    };

    // Nombre y teléfono son lo mínimo para poder contactar al dueño
    if (!datos.nombre || !datos.telefono) {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      if (cliente) {
        await actualizarCliente(cliente.id, datos);
      } else {
        await crearCliente(datos);
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            Datos de contacto del dueño de las mascotas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={campos.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)} placeholder="María" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" value={campos.apellidos}
                onChange={(e) => actualizarCampo("apellidos", e.target.value)} placeholder="García López" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" type="tel" value={campos.telefono}
                onChange={(e) => actualizarCampo("telefono", e.target.value)} placeholder="555-101-2020" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={campos.email}
                onChange={(e) => actualizarCampo("email", e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" value={campos.direccion}
              onChange={(e) => actualizarCampo("direccion", e.target.value)} placeholder="Opcional" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {cliente ? "Guardar cambios" : "Registrar cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
