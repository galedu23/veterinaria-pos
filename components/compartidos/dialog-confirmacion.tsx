"use client";

// ============================================================
// dialog-confirmacion.tsx — Diálogo de confirmación REUTILIZABLE.
//
// QUÉ: muestra "¿Estás seguro?" antes de una acción destructiva.
// POR QUÉ: eliminar productos, clientes o mascotas necesita la misma
//   confirmación; en vez de copiar el mismo Dialog en cada módulo,
//   se centraliza aquí y cada vista solo le pasa título y mensaje.
// CÓMO SE USA:
//   <DialogConfirmacion
//     abierto={!!productoAEliminar}
//     titulo="¿Eliminar producto?"
//     mensaje={<>Se eliminará <b>{nombre}</b>.</>}
//     onConfirmar={miFuncionDeBorrado}
//     onCancelar={() => setProductoAEliminar(null)}
//   />
// ============================================================

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  abierto: boolean;
  titulo: string;
  /** Acepta JSX para poder resaltar el nombre del registro en negritas */
  mensaje: React.ReactNode;
  textoConfirmar?: string;
  onConfirmar: () => Promise<void> | void;
  onCancelar: () => void;
}

export function DialogConfirmacion({
  abierto, titulo, mensaje, textoConfirmar = "Eliminar", onConfirmar, onCancelar,
}: Props) {
  // Estado local de "procesando" para deshabilitar el botón mientras
  // se ejecuta la acción (evita dobles clics que borrarían dos veces).
  const [procesando, setProcesando] = React.useState(false);

  /** confirmar: ejecuta la acción y maneja el estado de carga */
  const confirmar = async () => {
    setProcesando(true);
    try {
      await onConfirmar();
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCancelar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription asChild>
            <div>{mensaje}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={procesando}>
            {procesando && <Loader2 className="h-4 w-4 animate-spin" />}
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
