"use client";

// ============================================================
// documentos-mascota.tsx — DOCUMENTOS MÉDICOS del expediente.
//
// QUÉ: sección para subir y consultar archivos ligados a la mascota:
//   resultados de laboratorio, radiografías, recetas externas...
//   Acepta PDFs e imágenes:
//   - Las IMÁGENES se comprimen a WebP (lib/comprimir-imagen.ts) con
//     lado máximo 1200px y calidad 0.7 — más grandes que un avatar
//     porque un análisis de laboratorio debe seguir siendo LEGIBLE.
//   - Los PDFs se guardan tal cual (comprimirlos requeriría backend).
// POR QUÉ todo queda ligado a mascotaId: el documento pertenece al
//   expediente; así al abrir cualquier mascota se ven SOLO los suyos.
// CÓMO SE CONECTA A SUPABASE STORAGE: ver subirDocumento() en
//   services/db.ts — bucket PRIVADO "documentos" con URLs firmadas,
//   porque los resultados médicos son información sensible.
// ============================================================

import * as React from "react";
import { FolderOpen, Upload, FileText, Image as ImageIcon, Trash2, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { VisorDocumento } from "@/components/expediente/visor-documento";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import { formatoFecha } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getDocumentosDeMascota, subirDocumento, eliminarDocumento } from "@/services/db";
import type { DocumentoMedico } from "@/types";

/** Límite para PDFs en el mock (viven en memoria); Storage real permite más */
const PDF_MAX_MB = 5;

interface Props {
  mascotaId: string;
}

export function DocumentosMascota({ mascotaId }: Props) {
  const { usuario } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [documentos, setDocumentos] = React.useState<DocumentoMedico[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [subiendo, setSubiendo] = React.useState(false);
  const [error, setError] = React.useState("");
  const [docAEliminar, setDocAEliminar] = React.useState<DocumentoMedico | null>(null);
  // Documento abierto en el VISOR embebido (null = visor cerrado)
  const [docAbierto, setDocAbierto] = React.useState<DocumentoMedico | null>(null);

  /** cargarDocumentos: trae los archivos de ESTA mascota */
  const cargarDocumentos = React.useCallback(async () => {
    setCargando(true);
    setDocumentos(await getDocumentosDeMascota(mascotaId));
    setCargando(false);
  }, [mascotaId]);

  React.useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  /**
   * archivoADataUrl: convierte un archivo a base64 SIN comprimir.
   * Se usa solo para PDFs (las imágenes pasan por comprimirImagen).
   */
  const archivoADataUrl = (archivo: File): Promise<string> =>
    new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result as string);
      lector.onerror = () => rechazar(new Error("No se pudo leer el archivo."));
      lector.readAsDataURL(archivo);
    });

  /**
   * manejarSeleccion: decide el tratamiento según el tipo de archivo.
   * Imagen -> comprimir a WebP legible. PDF -> validar peso y guardar.
   * Cualquier otro tipo se rechaza con mensaje claro.
   */
  const manejarSeleccion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite re-elegir el mismo archivo
    if (!archivo || !usuario) return;

    setError("");
    setSubiendo(true);
    try {
      let dataUrl: string;
      let tipo: DocumentoMedico["tipo"];
      let tamanoKB: number;

      if (archivo.type.startsWith("image/")) {
        // Compresión con parámetros de DOCUMENTO (no de avatar):
        // 1200px y calidad 0.7 mantienen legibles los números de un análisis
        const foto = await comprimirImagen(archivo, { ladoMaximoPx: 1200, calidad: 0.7 });
        dataUrl = foto.dataUrl;
        tipo = "imagen";
        tamanoKB = foto.kbFinal;
      } else if (archivo.type === "application/pdf") {
        // Los PDFs no se pueden comprimir con canvas (no son píxeles);
        // solo limitamos el peso para no saturar la memoria del mock.
        if (archivo.size > PDF_MAX_MB * 1024 * 1024) {
          throw new Error(`El PDF supera ${PDF_MAX_MB} MB. Reduce el archivo e intenta de nuevo.`);
        }
        dataUrl = await archivoADataUrl(archivo);
        tipo = "pdf";
        tamanoKB = Math.round(archivo.size / 1024);
      } else {
        throw new Error("Solo se aceptan imágenes o PDF.");
      }

      await subirDocumento({
        mascotaId,
        // El nombre original del archivo sin la extensión como título visible
        nombre: archivo.name.replace(/\.[^.]+$/, ""),
        tipo,
        dataUrl,
        tamanoKB,
        subidoPorId: usuario.id,
      });
      await cargarDocumentos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el documento");
    } finally {
      setSubiendo(false);
    }
  };

  // NOTA: la lógica de "abrir en pestaña" que vivía aquí se movió al
  // VisorDocumento — ahora el clic abre el visor EMBEBIDO (sin salir
  // de la app) y desde ahí se puede saltar a pestaña si se necesita.

  /** confirmarEliminar: borra el documento tras la confirmación */
  const confirmarEliminar = async () => {
    if (!docAEliminar) return;
    await eliminarDocumento(docAEliminar.id);
    setDocAEliminar(null);
    await cargarDocumentos();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <FolderOpen className="h-5 w-5 text-amber-600" /> Documentos médicos
        </h3>
        <Button size="sm" disabled={subiendo} onClick={() => inputRef.current?.click()}>
          {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload />}
          Subir documento
        </Button>
      </div>

      {/* Input oculto: solo imágenes y PDF */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={manejarSeleccion}
        className="hidden"
      />

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Lista de documentos */}
      {cargando ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : documentos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Sin documentos. Sube análisis de laboratorio, radiografías o recetas externas.
        </p>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            // Toda la zona de información es clickeable: abre el visor
            // embebido (el usuario ve el análisis SIN salir de la app)
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setDocAbierto(doc)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-80"
              >
                {/* Icono según el tipo de archivo */}
                {doc.tipo === "pdf" ? (
                  <FileText className="h-5 w-5 shrink-0 text-red-600" />
                ) : (
                  <ImageIcon className="h-5 w-5 shrink-0 text-blue-600" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{doc.nombre}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatoFecha(doc.fecha)} · {doc.tamanoKB.toLocaleString()} KB
                  </span>
                </span>
              </button>

              <Badge variant="secondary" className="uppercase">{doc.tipo}</Badge>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setDocAbierto(doc)} aria-label="Ver documento">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDocAEliminar(doc)} aria-label="Eliminar">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visor embebido de PDFs e imágenes */}
      <VisorDocumento documento={docAbierto} onCerrar={() => setDocAbierto(null)} />

      {/* Confirmación de borrado (componente compartido) */}
      <DialogConfirmacion
        abierto={!!docAEliminar}
        titulo="¿Eliminar documento?"
        mensaje={<>Se eliminará <strong>{docAEliminar?.nombre}</strong> del expediente.</>}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setDocAEliminar(null)}
      />
    </section>
  );
}
