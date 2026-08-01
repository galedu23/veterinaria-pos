"use client";

// ============================================================
// hooks/use-captura-imagen.ts — Elegir imagen: CÁMARA o ARCHIVO.
//
// QUÉ: administra dos <input type="file"> ocultos —uno que abre
//   directamente la cámara y otro que abre la galería/explorador— y
//   entrega el archivo elegido a quien lo use.
// POR QUÉ dos inputs y no uno: un input con accept="image/*" a secas
//   abre en el celular un menú intermedio ("¿Cámara o Galería?"). Con
//   el atributo `capture` el sistema abre la cámara DE INMEDIATO, que
//   es lo que se necesita en el mostrador: un toque y la foto está.
//   Se conservan los dos caminos porque a veces la foto ya existe.
// NOTA DE ESCRITORIO: en una computadora el navegador IGNORA `capture`
//   y ambos botones abren el explorador de archivos. No estorba, pero
//   por eso el botón de cámara se rotula "Tomar foto" y no "Cámara".
// CÓMO SE USA:
//   const captura = useCapturaImagen(procesarArchivo);
//   <input ref={captura.refCamara} ... />  (ver los uploaders)
//   <Button onClick={captura.abrirCamara}>Tomar foto</Button>
// ============================================================

import * as React from "react";

export function useCapturaImagen(onArchivo: (archivo: File) => void) {
  // Un ref por cada input oculto: los botones visibles los "disparan"
  const refCamara = React.useRef<HTMLInputElement>(null);
  const refGaleria = React.useRef<HTMLInputElement>(null);

  /**
   * manejarCambio: se ejecuta cuando el usuario toma la foto o elige
   * un archivo. Limpia el valor del input para que volver a elegir
   * LA MISMA imagen dispare el evento otra vez (si no, el navegador
   * considera que no hubo cambio y no avisa).
   */
  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (archivo) onArchivo(archivo);
  };

  return {
    refCamara,
    refGaleria,
    manejarCambio,
    /** Abre la cámara del dispositivo (en celular, la trasera) */
    abrirCamara: () => refCamara.current?.click(),
    /** Abre la galería del celular o el explorador de la computadora */
    abrirGaleria: () => refGaleria.current?.click(),
  };
}
