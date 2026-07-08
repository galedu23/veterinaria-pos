"use client";

// ============================================================
// visor-documento.tsx — VISOR de documentos médicos (Dialog grande).
//
// QUÉ: muestra el documento DENTRO de la app, sin descargas ni
//   pestañas nuevas:
//   - IMÁGENES: un <img> a tamaño completo (con scroll si es alta).
//   - PDFs: un <iframe> con el visor de PDF nativo del navegador
//     (Chrome/Edge/Firefox traen uno integrado con zoom y páginas).
// DETALLE TÉCNICO CLAVE: los navegadores BLOQUEAN cargar URLs
//   "data:" directamente por seguridad; por eso convertimos el
//   dataURL a un Blob y generamos una URL "blob:" temporal, que sí
//   se permite. La URL se libera al cerrar (evita fugas de memoria).
// CON SUPABASE STORAGE: este rodeo desaparece — el iframe/img usará
//   directamente la URL firmada (createSignedUrl) del bucket privado.
// ============================================================

import * as React from "react";
import { ExternalLink, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatoFecha } from "@/lib/utils";
import type { DocumentoMedico } from "@/types";

interface Props {
  /** null = visor cerrado */
  documento: DocumentoMedico | null;
  onCerrar: () => void;
}

export function VisorDocumento({ documento, onCerrar }: Props) {
  // URL "blob:" temporal que el iframe/img sí puede cargar
  const [urlBlob, setUrlBlob] = React.useState<string | null>(null);

  // Al abrir un documento: dataURL -> Blob -> ObjectURL.
  // El "cleanup" del efecto libera la URL cuando se cierra o cambia.
  React.useEffect(() => {
    if (!documento) {
      setUrlBlob(null);
      return;
    }
    let urlCreada: string | null = null;
    (async () => {
      const respuesta = await fetch(documento.dataUrl); // decodifica el base64
      const blob = await respuesta.blob();
      urlCreada = URL.createObjectURL(blob);
      setUrlBlob(urlCreada);
    })();
    return () => {
      // Liberar memoria: la URL blob deja de existir al cerrar el visor
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [documento]);

  /** abrirEnPestana: alternativa para pantallas chicas o para imprimir */
  const abrirEnPestana = () => {
    if (urlBlob) window.open(urlBlob, "_blank");
  };

  return (
    <Dialog open={!!documento} onOpenChange={(abierto) => !abierto && onCerrar()}>
      {/* Modal GRANDE: el documento necesita espacio para leerse */}
      <DialogContent className="flex h-[88vh] max-h-[88vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {documento?.tipo === "pdf" ? (
              <FileText className="h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <ImageIcon className="h-5 w-5 shrink-0 text-blue-600" />
            )}
            <span className="truncate">{documento?.nombre}</span>
          </DialogTitle>
          <DialogDescription>
            {documento && (
              <>Subido el {formatoFecha(documento.fecha)} · {documento.tamanoKB.toLocaleString()} KB</>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Área del documento: ocupa todo el alto restante del modal */}
        <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30">
          {!urlBlob ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documento?.tipo === "pdf" ? (
            // Visor de PDF nativo del navegador (zoom, páginas, búsqueda)
            <iframe
              src={urlBlob}
              title={documento.nombre}
              className="h-full w-full"
            />
          ) : (
            // Imagen centrada; object-contain la ajusta sin deformarla
            <div className="flex min-h-full items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob local */}
              <img
                src={urlBlob}
                alt={documento?.nombre ?? "Documento"}
                className="max-h-full max-w-full rounded object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={abrirEnPestana} disabled={!urlBlob}>
            <ExternalLink /> Abrir en pestaña
          </Button>
          <Button className="flex-1" onClick={onCerrar}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
