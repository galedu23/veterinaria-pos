"use client";

// ============================================================
// image-uploader.tsx — Subidor de imágenes GENÉRICO y reutilizable.
//
// QUÉ: recuadro de vista previa + botón "Elegir imagen". Al
//   seleccionar un archivo lo comprime (Canvas -> WebP, vía
//   lib/comprimir-imagen.ts) y entrega el resultado al padre.
// POR QUÉ es "controlado" (no guarda nada por sí mismo): cada módulo
//   decide QUÉ hacer con la imagen — el formulario de producto la
//   mete en su estado y la guarda junto con el resto de campos.
//   Eso lo hace reutilizable en cualquier formulario futuro.
// DIFERENCIA con PetPhotoUploader: aquel es un flujo completo con
//   modal y guardado propio (avatar del expediente); este es una
//   pieza de formulario. Ambos comparten la MISMA compresión.
// CÓMO SE CONECTA A STORAGE: el padre recibe `foto.blob` listo para
//   supabase.storage.upload() y `foto.dataUrl` para el mock/preview.
// ============================================================

import * as React from "react";
import { ImagePlus, Loader2, CircleCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comprimirImagen, type FotoComprimida, type OpcionesCompresion } from "@/lib/comprimir-imagen";

interface Props {
  /** Imagen ya guardada o recién comprimida (dataURL o URL); "" = sin imagen */
  imagenActual?: string;
  /** Texto alternativo de accesibilidad para la vista previa */
  alt: string;
  /** Entrega la imagen comprimida al padre (dataUrl + blob + pesos) */
  onImagenLista: (foto: FotoComprimida) => void;
  /** Permite quitar la imagen actual (el padre limpia su estado) */
  onQuitar?: () => void;
  /** Ajustes de compresión por módulo (default: 400px, calidad 0.6) */
  opciones?: OpcionesCompresion;
}

export function ImageUploader({ imagenActual, alt, onImagenLista, onQuitar, opciones }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = React.useState(false);
  const [error, setError] = React.useState("");
  // Guardamos los pesos de la última compresión para mostrar el ahorro
  const [ahorro, setAhorro] = React.useState<{ original: number; final: number } | null>(null);

  /** manejarSeleccion: comprime el archivo elegido y avisa al padre */
  const manejarSeleccion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    setError("");
    setAhorro(null);

    // Doble validación (el accept del input ya filtra, pero no es infalible)
    if (!archivo.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen.");
      return;
    }

    setProcesando(true);
    try {
      const foto = await comprimirImagen(archivo, opciones);
      setAhorro({ original: foto.kbOriginal, final: foto.kbFinal });
      onImagenLista(foto); // el padre decide dónde guardarla
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la imagen");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {/* Vista previa cuadrada (o marcador de posición punteado) */}
        <div className="relative h-20 w-20 shrink-0">
          {imagenActual ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- dataURL local */}
              <img
                src={imagenActual}
                alt={alt}
                className="h-20 w-20 rounded-md border object-cover"
              />
              {/* Botón para quitar la imagen (si el padre lo permite) */}
              {onQuitar && (
                <button
                  type="button"
                  onClick={onQuitar}
                  aria-label="Quitar imagen"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={procesando}
            onClick={() => inputRef.current?.click()}
          >
            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus />}
            {imagenActual ? "Cambiar imagen" : "Elegir imagen"}
          </Button>

          {/* Evidencia del ahorro tras comprimir */}
          {ahorro && (
            <p className="flex items-center gap-1 text-xs text-green-700">
              <CircleCheck className="h-3 w-3" />
              {ahorro.original.toLocaleString()} KB → {ahorro.final.toLocaleString()} KB (WebP)
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Input real oculto: en celular ofrece cámara o galería */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={manejarSeleccion}
        className="hidden"
      />
    </div>
  );
}
