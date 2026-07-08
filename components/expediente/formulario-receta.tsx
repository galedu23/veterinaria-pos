"use client";

// ============================================================
// formulario-receta.tsx — Modal de NUEVA RECETA MÉDICA.
//
// QUÉ: crea una receta con MÚLTIPLES medicamentos. Cada medicamento
//   tiene nombre, dosis, frecuencia, duración e indicaciones.
//   El botón "+ Agregar medicamento" añade filas dinámicamente.
// POR QUÉ un array en el estado: los medicamentos son una lista de
//   longitud variable; el estado es `MedicamentoRecetado[]` y cada
//   fila edita su índice. Es el patrón estándar de "field arrays".
// CÓMO SE CONECTA A SUPABASE: crearReceta() guarda los medicamentos
//   como jsonb dentro de la receta (siempre se leen juntos).
// ============================================================

import * as React from "react";
import { Loader2, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { crearReceta } from "@/services/db";
import type { MedicamentoRecetado } from "@/types";

/** Una fila vacía de medicamento para inicializar/agregar */
const MEDICAMENTO_VACIO: MedicamentoRecetado = {
  nombre: "", dosis: "", frecuencia: "", duracion: "", indicaciones: "",
};

interface Props {
  abierto: boolean;
  mascotaId: string;
  /**
   * VINCULACIÓN ESTRICTA: la receta SIEMPRE nace de una consulta.
   * Este id llega del alta de consulta recién guardada (flujo
   * automático) o del botón "Receta" de una consulta del historial.
   * EN SUPABASE: se guarda en la columna consulta_id (FK NOT NULL).
   */
  consultaId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function FormularioReceta({ abierto, mascotaId, consultaId, onCerrar, onGuardado }: Props) {
  const { usuario } = useAuth();

  // Lista dinámica de medicamentos: empieza con una fila
  const [medicamentos, setMedicamentos] = React.useState<MedicamentoRecetado[]>([MEDICAMENTO_VACIO]);
  const [observaciones, setObservaciones] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Reiniciar el formulario cada vez que se abre
  React.useEffect(() => {
    if (abierto) {
      setMedicamentos([{ ...MEDICAMENTO_VACIO }]);
      setObservaciones("");
      setError("");
    }
  }, [abierto]);

  /**
   * actualizarMedicamento: edita UN campo de UNA fila.
   * Se copia el array (map) porque React necesita una referencia nueva
   * para detectar el cambio y re-renderizar.
   */
  const actualizarMedicamento = (
    indice: number,
    campo: keyof MedicamentoRecetado,
    valor: string
  ) => {
    setMedicamentos((lista) =>
      lista.map((m, i) => (i === indice ? { ...m, [campo]: valor } : m))
    );
  };

  /** agregarFila: añade un medicamento vacío al final */
  const agregarFila = () => setMedicamentos((lista) => [...lista, { ...MEDICAMENTO_VACIO }]);

  /** quitarFila: elimina una fila (siempre debe quedar al menos una) */
  const quitarFila = (indice: number) =>
    setMedicamentos((lista) =>
      lista.length > 1 ? lista.filter((_, i) => i !== indice) : lista
    );

  /** guardar: valida que cada medicamento esté completo y registra la receta */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Todos los medicamentos deben tener al menos nombre, dosis y frecuencia
    const incompleto = medicamentos.some(
      (m) => !m.nombre.trim() || !m.dosis.trim() || !m.frecuencia.trim()
    );
    if (incompleto) {
      setError("Cada medicamento necesita nombre, dosis y frecuencia.");
      return;
    }

    setGuardando(true);
    try {
      await crearReceta({
        mascotaId,
        consultaId, // FK obligatoria: la consulta que justifica esta receta
        veterinarioId: usuario?.id ?? "",
        fecha: new Date().toISOString().slice(0, 10),
        medicamentos: medicamentos.map((m) => ({
          ...m,
          nombre: m.nombre.trim(),
          indicaciones: m.indicaciones?.trim() || undefined,
        })),
        observaciones: observaciones.trim() || undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Nueva Receta Médica
          </DialogTitle>
          <DialogDescription>
            Prescribe: {usuario?.nombre} · {new Date().toLocaleDateString("es-MX")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4">
          {/* -------- Filas dinámicas de medicamentos -------- */}
          {medicamentos.map((med, i) => (
            <div key={i} className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Medicamento {i + 1}</p>
                {medicamentos.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => quitarFila(i)} aria-label="Quitar medicamento">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nombre *</Label>
                  <Input value={med.nombre} placeholder="Amoxicilina"
                    onChange={(e) => actualizarMedicamento(i, "nombre", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Dosis *</Label>
                  <Input value={med.dosis} placeholder="50 mg"
                    onChange={(e) => actualizarMedicamento(i, "dosis", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Frecuencia *</Label>
                  <Input value={med.frecuencia} placeholder="cada 12 horas"
                    onChange={(e) => actualizarMedicamento(i, "frecuencia", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Duración</Label>
                  <Input value={med.duracion} placeholder="10 días"
                    onChange={(e) => actualizarMedicamento(i, "duracion", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Indicaciones</Label>
                <Input value={med.indicaciones ?? ""} placeholder="Con alimento"
                  onChange={(e) => actualizarMedicamento(i, "indicaciones", e.target.value)} />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={agregarFila}>
            <Plus /> Agregar medicamento
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="observaciones">Observaciones generales</Label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Mantener hidratación; volver si hay fiebre..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar receta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
