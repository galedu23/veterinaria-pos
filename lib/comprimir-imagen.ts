// ============================================================
// lib/comprimir-imagen.ts — Compresión de imágenes COMPARTIDA.
//
// QUÉ: convierte cualquier imagen (JPG/PNG de varios MB) en un WebP
//   de pocos KB usando el API nativo de Canvas, TODO en el navegador.
// POR QUÉ vive en lib/: la usan el PetPhotoUploader (mascotas), el
//   ImageUploader genérico (productos) y los documentos médicos.
//   Una sola implementación = un solo lugar donde ajustar calidad.
// CÓMO SE CONECTA A STORAGE: esta función NO sube nada; devuelve el
//   resultado (`blob` binario + `dataUrl` para vista previa) y cada
//   módulo decide dónde guardarlo. Con Supabase se sube el `blob`.
// ============================================================

/** Opciones ajustables por cada uso (avatar chico vs foto de producto) */
export interface OpcionesCompresion {
  /** Lado máximo en píxeles del resultado (default 400) */
  ladoMaximoPx?: number;
  /** Calidad WebP de 0 a 1 (default 0.6 = punto dulce calidad/peso) */
  calidad?: number;
}

/** Resultado de la compresión, listo para previsualizar y subir */
export interface FotoComprimida {
  dataUrl: string;   // imagen final en base64 (para <img> y para el mock)
  blob: Blob;        // imagen final binaria (para Supabase Storage)
  kbOriginal: number;
  kbFinal: number;
  formato: string;   // "image/webp" (o "image/jpeg" si no hay soporte WebP)
}

/**
 * comprimirImagen: el corazón de la optimización de fotos.
 * Redimensiona + baja calidad + convierte a WebP. La foto original
 * NUNCA viaja por la red: todo pasa en la memoria del navegador.
 */
export async function comprimirImagen(
  archivo: File,
  opciones: OpcionesCompresion = {}
): Promise<FotoComprimida> {
  // Valores por defecto si quien llama no especifica opciones
  const ladoMaximo = opciones.ladoMaximoPx ?? 400;
  const calidad = opciones.calidad ?? 0.6;

  // ---- PASO 1: cargar el archivo como imagen en memoria ----

  // createObjectURL crea una URL temporal (blob:...) que apunta al
  // archivo local SIN leerlo completo como base64.
  // POR QUÉ así y no FileReader: más rápido y menos RAM con fotos grandes.
  const urlTemporal = URL.createObjectURL(archivo);

  // <img> "invisible": solo lo usamos para que el navegador decodifique
  const imagen = new Image();

  // onload/onerror envueltos en Promise para poder usar await
  await new Promise<void>((resolver, rechazar) => {
    imagen.onload = () => resolver();
    imagen.onerror = () => rechazar(new Error("No se pudo leer la imagen. ¿El archivo está dañado?"));
    imagen.src = urlTemporal; // dispara la carga
  });

  // ---- PASO 2: calcular el nuevo tamaño (redimensionar) ----

  // Math.min(1, ...) evita AGRANDAR fotos ya pequeñas (solo inventaría
  // píxeles borrosos). Ej: 4000x3000 con lado máx 400 -> escala 0.1 -> 400x300.
  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const anchoFinal = Math.round(imagen.width * escala);
  const altoFinal = Math.round(imagen.height * escala);

  // ---- PASO 3: dibujar la foto reducida en un canvas ----

  // El canvas es un lienzo en memoria: al dibujar la foto grande en un
  // lienzo chico, el navegador hace el redimensionado con suavizado.
  const lienzo = document.createElement("canvas");
  lienzo.width = anchoFinal;
  lienzo.height = altoFinal;

  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("Tu navegador no soporta canvas.");

  contexto.imageSmoothingQuality = "high"; // mejor algoritmo de reducción
  contexto.drawImage(imagen, 0, 0, anchoFinal, altoFinal); // aquí ocurre la reducción

  // Liberar la URL temporal evita fugas de memoria con muchas fotos seguidas
  URL.revokeObjectURL(urlTemporal);

  // ---- PASO 4: exportar el lienzo como WebP comprimido ----

  // toBlob codifica el lienzo al formato pedido. WebP comprime ~30%
  // mejor que JPEG a la misma calidad visual: por eso es el formato
  // obligatorio. Envuelto en Promise porque toBlob usa callback.
  let blob = await new Promise<Blob | null>((resolver) =>
    lienzo.toBlob(resolver, "image/webp", calidad)
  );

  // PLAN B (Safari viejo): si el navegador no codifica WebP, devuelve
  // null o un PNG gigante -> usamos JPEG que funciona en todos lados.
  if (!blob || blob.type !== "image/webp") {
    blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/jpeg", calidad)
    );
  }
  if (!blob) throw new Error("No se pudo comprimir la imagen.");

  // ---- PASO 5: dataURL para vista previa y almacenamiento mock ----

  // FileReader convierte el Blob binario a texto base64. Con Supabase
  // Storage se subirá el `blob` y el dataURL quedará SOLO como preview.
  const dataUrl = await new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result as string);
    lector.onerror = () => rechazar(new Error("No se pudo generar la vista previa."));
    lector.readAsDataURL(blob!);
  });

  return {
    dataUrl,
    blob,
    kbOriginal: Math.round(archivo.size / 1024),
    kbFinal: Math.round(blob.size / 1024),
    formato: blob.type,
  };
}
