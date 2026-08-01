"use client";

// ============================================================
// pet-photo-uploader.tsx — FOTO DE PERFIL con compresión extrema.
//
// QUÉ: avatar circular de la mascota con un botón de cámara. Al
//   elegir una imagen (cámara del celular o archivo de la PC):
//   1. Se COMPRIME en el navegador con el API nativo de Canvas
//      (redimensiona + baja calidad + convierte a WebP).
//   2. Se muestra una VISTA PREVIA con el peso original vs final.
//   3. Al confirmar, se "sube" vía services/db.ts (mock por ahora).
//
// POR QUÉ comprimir en el FRONTEND: una foto de celular pesa
//   3–8 MB; la foto de perfil solo necesita ~10–30 KB. Comprimir
//   antes de subir ahorra ~99% de espacio en el Storage y hace la
//   subida casi instantánea incluso con mala señal.
//
// AISLAMIENTO: este componente es autónomo. El expediente solo le
//   pasa mascotaId + fotoActual + un callback onFotoGuardada. Para
//   cambiar tamaños, calidad o diseño, se toca SOLO este archivo.
// ============================================================

import * as React from "react";
import { Camera, PawPrint, Loader2, CircleCheck, ImageIcon } from "lucide-react";
import { useCapturaImagen } from "@/hooks/use-captura-imagen";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { subirFotoMascota } from "@/services/db";
// La compresión Canvas->WebP vive en lib/comprimir-imagen.ts porque
// también la usan el ImageUploader de productos y los documentos
// médicos: UNA sola implementación para toda la app.
import { comprimirImagen, type FotoComprimida } from "@/lib/comprimir-imagen";

// ------------------------------------------------------------
// COMPONENTE VISUAL
// ------------------------------------------------------------

interface Props {
  mascotaId: string;
  /** Foto actual guardada (dataURL en mock; URL pública con Supabase) */
  fotoActual?: string;
  nombreMascota: string;
  /** Aviso al padre (expediente) para refrescar tras guardar */
  onFotoGuardada: () => void;
}

export function PetPhotoUploader({ mascotaId, fotoActual, nombreMascota, onFotoGuardada }: Props) {
  // Estado del flujo: resultado de la compresión -> abre el modal de vista previa
  const [resultado, setResultado] = React.useState<FotoComprimida | null>(null);
  const [procesando, setProcesando] = React.useState(false); // comprimiendo
  const [guardando, setGuardando] = React.useState(false);   // subiendo (mock)
  const [error, setError] = React.useState("");

  /**
   * procesarArchivo: recibe la foto (de la cámara o de la galería),
   * la comprime de inmediato y abre la vista previa con el resultado.
   */
  const procesarArchivo = async (archivo: File) => {
    setError("");

    // Solo aceptamos imágenes (el accept del input ya filtra, pero
    // en la PC se puede forzar cualquier archivo: doble validación).
    if (!archivo.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen.");
      return;
    }

    setProcesando(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      setResultado(comprimida); // abre el modal de vista previa
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la imagen");
    } finally {
      setProcesando(false);
    }
  };

  // Cámara y galería: dos caminos para la misma foto (ver el hook)
  const captura = useCapturaImagen(procesarArchivo);

  /** guardarFoto: confirma la vista previa y sube la imagen comprimida */
  const guardarFoto = async () => {
    if (!resultado) return;
    setGuardando(true);
    setError("");
    try {
      // MOCK: guarda el dataURL en memoria.
      // TODO Supabase Storage: cambiar a subirFotoMascota(mascotaId, resultado.blob)
      // cuando el servicio reciba el binario (ver comentario en services/db.ts).
      await subirFotoMascota(mascotaId, resultado.dataUrl);
      setResultado(null);   // cierra la vista previa
      onFotoGuardada();     // el expediente recarga y muestra la foto nueva
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la foto");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {/* ---------- Avatar circular + botón de cámara ---------- */}
      <div className="relative h-20 w-20 shrink-0">
        {fotoActual ? (
          // eslint-disable-next-line @next/next/no-img-element -- dataURL local; next/image no aplica
          <img
            src={fotoActual}
            alt={`Foto de ${nombreMascota}`}
            className="h-20 w-20 rounded-full border-2 border-blue-200 object-cover"
          />
        ) : (
          // Sin foto: el mismo icono de siempre como marcador de posición
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <PawPrint className="h-9 w-9 text-blue-600" />
          </div>
        )}

        {/* DOS botones flotantes sobre el avatar, uno por cada camino:
            - Derecha (azul): abre la CÁMARA directo — un toque y listo.
            - Izquierda (blanco): abre la galería o el explorador.
            Van en esquinas opuestas para que el dedo no se equivoque. */}
        <button
          type="button"
          onClick={captura.abrirCamara}
          disabled={procesando}
          aria-label="Tomar foto con la cámara"
          title="Tomar foto"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={captura.abrirGaleria}
          disabled={procesando}
          aria-label="Elegir foto de la galería"
          title="Elegir de la galería"
          className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full border bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        {/* Los dos inputs reales, ocultos. El primero lleva `capture`,
            que hace que el celular abra la cámara SIN menú intermedio. */}
        <input
          ref={captura.refCamara}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={captura.manejarCambio}
          className="hidden"
        />
        <input
          ref={captura.refGaleria}
          type="file"
          accept="image/*"
          onChange={captura.manejarCambio}
          className="hidden"
        />
      </div>

      {/* Error fuera del modal (ej. archivo que no es imagen) */}
      {error && !resultado && (
        <p className="mt-1 max-w-[200px] text-xs text-red-600">{error}</p>
      )}

      {/* ---------- Modal de VISTA PREVIA de la foto comprimida ---------- */}
      <Dialog open={!!resultado} onOpenChange={(abierto) => !abierto && setResultado(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Vista previa de la foto</DialogTitle>
            <DialogDescription>
              Así se verá el perfil de {nombreMascota}.
            </DialogDescription>
          </DialogHeader>

          {resultado && (
            <div className="space-y-3">
              {/* La imagen que se ve AQUÍ ya es la comprimida: lo que ves
                  es exactamente lo que se subirá, sin sorpresas. */}
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa de dataURL local */}
                <img
                  src={resultado.dataUrl}
                  alt="Vista previa comprimida"
                  className="h-40 w-40 rounded-full border object-cover"
                />
              </div>

              {/* Evidencia del ahorro: peso original vs comprimido */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">
                  {resultado.kbOriginal.toLocaleString()} KB
                </span>
                <span>→</span>
                <span className="flex items-center gap-1 font-semibold text-green-700">
                  <CircleCheck className="h-4 w-4" />
                  {resultado.kbFinal.toLocaleString()} KB
                  <span className="font-normal text-muted-foreground">
                    ({resultado.formato === "image/webp" ? "WebP" : "JPEG"},
                    -{Math.max(0, Math.round((1 - resultado.kbFinal / Math.max(1, resultado.kbOriginal)) * 100))}%)
                  </span>
                </span>
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setResultado(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={guardarFoto} disabled={guardando}>
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar foto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
