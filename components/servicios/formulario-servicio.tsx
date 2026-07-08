"use client";

// ============================================================
// formulario-servicio.tsx — Modal de Crear/Editar servicio.
//
// QUÉ: formulario corto (nombre, precio, descripción) en Dialog.
//   servicio=null -> crear; con servicio -> editar precargado.
// POR QUÉ el precio es opcional: hay servicios cuyo costo se define
//   caso por caso (ej. cirugías); dejarlo vacío es válido.
// CÓMO SE GUARDA EN SUPABASE: tabla `servicios` (insert/update).
//   Las consultas guardan el NOMBRE del servicio (texto), por lo que
//   renombrar un servicio NO altera el historial ya capturado.
// ============================================================

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { crearServicio, actualizarServicio } from "@/services/db";
import type { Servicio } from "@/types";

interface Props {
  abierto: boolean;
  /** null = crear nuevo; con servicio = editar */
  servicio: Servicio | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function FormularioServicio({ abierto, servicio, onCerrar, onGuardado }: Props) {
  const [nombre, setNombre] = React.useState("");
  const [precio, setPrecio] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Al abrir: precargar (editar) o limpiar (crear)
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    setNombre(servicio?.nombre ?? "");
    setPrecio(servicio?.precio !== undefined ? String(servicio.precio) : "");
    setDescripcion(servicio?.descripcion ?? "");
  }, [abierto, servicio]);

  /** guardar: valida el nombre y llama al servicio en el modo correcto */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre del servicio es obligatorio.");
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      precio: precio ? Number(precio) : undefined,
      descripcion: descripcion.trim() || undefined,
    };

    setGuardando(true);
    try {
      if (servicio) {
        await actualizarServicio(servicio.id, datos);
      } else {
        await crearServicio(datos);
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
          <DialogTitle>{servicio ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          <DialogDescription>
            Los servicios aparecen en el select &quot;Tipo de servicio&quot; de las consultas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombreServicio">Nombre *</Label>
            <Input id="nombreServicio" value={nombre}
              onChange={(e) => setNombre(e.target.value)} placeholder="Rayos X" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="precioServicio">Precio (opcional)</Label>
            <Input id="precioServicio" type="number" min="0" step="0.01" value={precio}
              onChange={(e) => setPrecio(e.target.value)} placeholder="600.00" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descServicio">Descripción</Label>
            <Input id="descServicio" value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional, ej. 'precio base según procedimiento'" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {servicio ? "Guardar cambios" : "Agregar servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
