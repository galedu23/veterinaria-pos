"use client";

// ============================================================
// catalogo-simple.tsx — Gestor GENÉRICO de catálogos.
//
// QUÉ: una tarjeta con: lista de elementos {id, nombre}, un input
//   para agregar y botón de eliminar por fila (opcional).
// POR QUÉ genérico: Especies, Razas y Categorías son exactamente
//   la misma interfaz (lista de nombres); escribirla 3 veces sería
//   triplicar el mantenimiento. La página le inyecta las funciones
//   del servicio (onAgregar/onEliminar) según el catálogo.
// DETALLE: los errores del servicio (ej. "no se puede eliminar,
//   tiene registros ligados") se capturan y muestran aquí mismo.
// ============================================================

import * as React from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item {
  id: string;
  nombre: string;
}

interface Props {
  titulo: string;
  icono?: React.ReactNode;
  items: Item[];
  cargando: boolean;
  placeholder: string;
  /** Texto pequeño bajo cada fila, ej. cuántos registros la usan */
  detalle?: (item: Item) => string | null;
  onAgregar: (nombre: string) => Promise<void>;
  /** Si no se pasa, las filas no muestran botón de eliminar */
  onEliminar?: (item: Item) => Promise<void>;
}

export function CatalogoSimple({
  titulo, icono, items, cargando, placeholder, detalle, onAgregar, onEliminar,
}: Props) {
  const [nombreNuevo, setNombreNuevo] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  /** agregar: valida no-vacío y no-duplicado antes de llamar al servicio */
  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    // Evitamos duplicados por nombre (insensible a mayúsculas)
    if (items.some((i) => i.nombre.toLowerCase() === nombre.toLowerCase())) {
      setError(`"${nombre}" ya existe en ${titulo.toLowerCase()}.`);
      return;
    }
    setGuardando(true);
    try {
      await onAgregar(nombre);
      setNombreNuevo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setGuardando(false);
    }
  };

  /** eliminar: delega al servicio y muestra su error de regla de negocio si lo hay */
  const eliminar = async (item: Item) => {
    setError("");
    try {
      await onEliminar?.(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icono} {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Formulario de alta rápida */}
        <form onSubmit={agregar} className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={guardando} aria-label="Agregar">
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus />}
          </Button>
        </form>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {/* Lista de elementos */}
        {cargando ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {items.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Catálogo vacío.</p>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                <div>
                  <p className="text-sm font-medium">{item.nombre}</p>
                  {detalle && detalle(item) && (
                    <p className="text-xs text-muted-foreground">{detalle(item)}</p>
                  )}
                </div>
                {onEliminar && (
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => eliminar(item)} aria-label={`Eliminar ${item.nombre}`}>
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
