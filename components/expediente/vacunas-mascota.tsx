"use client";

// ============================================================
// vacunas-mascota.tsx — Vacunas de la mascota: lista + registro.
//
// QUÉ: dos piezas en un archivo (van siempre juntas):
//   1. ListaVacunas: historial con ALERTAS de próxima dosis
//      (rojo = vencida, amarillo = vence en ≤30 días, verde = al día)
//   2. FormularioVacuna: modal para registrar una aplicación.
// POR QUÉ las alertas se calculan al renderizar: diasHasta() compara
//   contra "hoy", así el semáforo siempre está actualizado sin jobs.
// CÓMO SE CONECTA A SUPABASE: crearVacuna() del servicio; las alertas
//   del dashboard salen de getVacunasProximas().
// ============================================================

import * as React from "react";
import { Loader2, Syringe, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatoFecha, diasHasta } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { crearVacuna } from "@/services/db";
import type { Vacuna } from "@/types";

// ------------------------------------------------------------
// 1) LISTA con semáforo de próximas dosis
// ------------------------------------------------------------

/**
 * EstadoVacuna: badge de alerta según los días restantes a la próxima dosis.
 * Se EXPORTA porque también lo usa el listado global /vacunas (mismo semáforo
 * en las dos vistas = criterio clínico consistente).
 */
export function EstadoVacuna({ proximaDosis }: { proximaDosis?: string }) {
  if (!proximaDosis) return <Badge variant="secondary">Dosis única</Badge>;

  const dias = diasHasta(proximaDosis);
  if (dias < 0) return <Badge variant="destructive">Vencida hace {-dias} días</Badge>;
  if (dias <= 30) return <Badge variant="warning">Refuerzo en {dias} días</Badge>;
  return <Badge variant="success">Al día</Badge>;
}

export function ListaVacunas({ vacunas }: { vacunas: Vacuna[] }) {
  if (vacunas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sin vacunas registradas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {vacunas.map((v) => (
        <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Syringe className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium">{v.nombre}</p>
              <p className="text-xs text-muted-foreground">
                Aplicada: {formatoFecha(v.fechaAplicacion)}
                {v.proximaDosis && ` · Próxima: ${formatoFecha(v.proximaDosis)}`}
                {v.lote && ` · Lote ${v.lote}`}
              </p>
            </div>
          </div>
          <EstadoVacuna proximaDosis={v.proximaDosis} />
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// 2) FORMULARIO de registro de aplicación
// ------------------------------------------------------------

interface PropsFormulario {
  abierto: boolean;
  mascotaId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function FormularioVacuna({ abierto, mascotaId, onCerrar, onGuardado }: PropsFormulario) {
  const { usuario } = useAuth();

  const [nombre, setNombre] = React.useState("");
  // Por defecto la fecha de aplicación es HOY (caso más común)
  const [fechaAplicacion, setFechaAplicacion] = React.useState("");
  const [proximaDosis, setProximaDosis] = React.useState("");
  const [lote, setLote] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (abierto) {
      setNombre("");
      setFechaAplicacion(new Date().toISOString().slice(0, 10));
      setProximaDosis("");
      setLote("");
      setError("");
    }
  }, [abierto]);

  /** guardar: registra la aplicación con su próxima dosis opcional */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre de la vacuna es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      await crearVacuna({
        mascotaId,
        nombre: nombre.trim(),
        fechaAplicacion,
        proximaDosis: proximaDosis || undefined,
        lote: lote.trim() || undefined,
        veterinarioId: usuario?.id ?? "",
      });
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
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-purple-600" /> Registrar Vacuna
          </DialogTitle>
          <DialogDescription>
            Si capturas la próxima dosis, el sistema generará la alerta automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombreVacuna">Vacuna *</Label>
            <Input id="nombreVacuna" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Rabia, Séxtuple, Triple Felina..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fechaAplicacion">Fecha de aplicación</Label>
              <Input id="fechaAplicacion" type="date" value={fechaAplicacion}
                onChange={(e) => setFechaAplicacion(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proximaDosis">Próxima dosis</Label>
              <Input id="proximaDosis" type="date" value={proximaDosis}
                onChange={(e) => setProximaDosis(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lote">Lote</Label>
            <Input id="lote" value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Opcional" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
