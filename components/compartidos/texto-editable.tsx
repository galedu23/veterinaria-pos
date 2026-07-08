"use client";

// ============================================================
// texto-editable.tsx — Texto con EDICIÓN IN-PLACE (reutilizable).
//
// QUÉ: muestra un texto normal; al hacer CLIC se convierte en un
//   input editable ahí mismo. Al presionar Enter o salir del campo
//   (blur) se guarda; con Escape se cancela sin guardar.
// POR QUÉ este patrón: editar "en el lugar" evita abrir otro
//   formulario para corregir una dosis — el documento se siente
//   vivo, como editar en Word.
// CÓMO SE CONECTA A LA BD: no se conecta. Emite onGuardar(nuevoValor)
//   y quien lo usa (el editor de recetas) decide cómo persistirlo.
// ============================================================

import * as React from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  valor: string;
  /** Se llama SOLO si el texto cambió; puede ser async (guardar en BD) */
  onGuardar: (nuevoValor: string) => void | Promise<void>;
  /** Texto tenue si el valor está vacío */
  placeholder?: string;
  /** true = usa <textarea> (observaciones largas) en vez de <input> */
  multilinea?: boolean;
  className?: string;
}

export function TextoEditable({ valor, onGuardar, placeholder = "—", multilinea = false, className }: Props) {
  const [editando, setEditando] = React.useState(false);
  // borrador: copia local mientras se edita (no toca el valor real
  // hasta confirmar — permite cancelar con Escape sin efectos)
  const [borrador, setBorrador] = React.useState(valor);

  /** empezarEdicion: entra al modo edición con el valor actual */
  const empezarEdicion = () => {
    setBorrador(valor);
    setEditando(true);
  };

  /** confirmar: guarda SOLO si hubo cambio real (evita escrituras inútiles) */
  const confirmar = async () => {
    setEditando(false);
    const limpio = borrador.trim();
    if (limpio !== valor) {
      await onGuardar(limpio);
    }
  };

  /** manejarTeclas: Enter guarda (sin Shift en multilínea), Escape cancela */
  const manejarTeclas = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !(multilinea && e.shiftKey)) {
      e.preventDefault();
      confirmar();
    }
    if (e.key === "Escape") {
      setEditando(false); // descarta el borrador
    }
  };

  // ---- Modo edición: input/textarea con autofoco ----
  if (editando) {
    const clasesCampo =
      "w-full rounded border border-blue-400 bg-blue-50/50 px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
    return multilinea ? (
      <textarea
        autoFocus
        rows={2}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={manejarTeclas}
        className={cn(clasesCampo, className)}
      />
    ) : (
      <input
        autoFocus
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={manejarTeclas}
        className={cn(clasesCampo, className)}
      />
    );
  }

  // ---- Modo lectura: texto clickeable con lapicito al pasar el mouse ----
  return (
    <button
      type="button"
      onClick={empezarEdicion}
      title="Clic para editar"
      className={cn(
        "group inline-flex max-w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm transition-colors hover:bg-blue-50",
        !valor && "italic text-muted-foreground",
        className
      )}
    >
      <span className="min-w-0 whitespace-pre-wrap break-words">{valor || placeholder}</span>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
