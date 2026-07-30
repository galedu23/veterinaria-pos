"use client";

// ============================================================
// app/(dashboard)/formatos/page.tsx — FORMATOS LEGALES.
//
// QUÉ: catálogo de los documentos legales que emite la clínica
//   (consentimiento de eutanasia, certificado de salud, etc.).
//   Desde aquí se redactan y editan; se GENERAN desde el expediente
//   de cada mascota, donde ya se conocen los datos del paciente.
// PARA QUÉ: que la redacción de un documento con valor legal se pueda
//   corregir sin depender de un programador.
// CÓMO SE CONECTA A SUPABASE: services/db.ts -> `plantillas_documento`.
// ============================================================

import * as React from "react";
import { FileSignature, Plus, Pencil, Trash2, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EditorPlantilla } from "@/components/formatos/editor-plantilla";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getPlantillas, eliminarPlantilla } from "@/services/db";
import type { PlantillaDocumento } from "@/types";

export default function PaginaFormatos() {
  const { usuario } = useAuth();

  const [plantillas, setPlantillas] = React.useState<PlantillaDocumento[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [editorAbierto, setEditorAbierto] = React.useState(false);
  const [enEdicion, setEnEdicion] = React.useState<PlantillaDocumento | null>(null);
  const [aEliminar, setAEliminar] = React.useState<PlantillaDocumento | null>(null);

  /** cargarPlantillas: trae el catálogo de formatos */
  const cargarPlantillas = React.useCallback(async () => {
    setCargando(true);
    setPlantillas(await getPlantillas());
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarPlantillas();
  }, [cargarPlantillas]);

  /** confirmarEliminar: quita el formato del catálogo */
  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    await eliminarPlantilla(aEliminar.id);
    setAEliminar(null);
    await cargarPlantillas();
  };

  // Los documentos legales solo los edita el administrador
  if (!tienePermiso(usuario, ["administrador"])) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <TriangleAlert className="h-10 w-10 text-red-500" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Solo el administrador puede modificar los formatos legales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileSignature className="h-6 w-6 text-indigo-600" /> Formatos legales
        </h2>
        <Button onClick={() => { setEnEdicion(null); setEditorAbierto(true); }}>
          <Plus /> Nuevo formato
        </Button>
      </div>

      {/* Aviso responsable: los formatos base deben validarse antes de usarse */}
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Los formatos incluidos son <strong>redacciones base</strong> conforme a la
          normativa mexicana. Antes de usarlos con clientes reales, deben ser
          revisados y validados por el Médico Veterinario responsable y, de
          preferencia, por un asesor legal: algunos requisitos varían por estado.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Estos documentos se generan desde el expediente de cada mascota, en la
        sección &quot;Documentos legales&quot;.
      </p>

      {cargando ? (
        <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead className="hidden md:table-cell">Fundamento legal</TableHead>
                <TableHead className="text-center">Firmas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plantillas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Sin formatos en el catálogo.
                  </TableCell>
                </TableRow>
              )}
              {plantillas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="text-xs text-muted-foreground">{p.descripcion}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {p.fundamentoLegal ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {p.requiereFirmaVeterinario && <Badge variant="secondary">Veterinario</Badge>}
                      {p.requiereFirmaPropietario && <Badge variant="secondary">Propietario</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Editar"
                        onClick={() => { setEnEdicion(p); setEditorAbierto(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Eliminar"
                        onClick={() => setAEliminar(p)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditorPlantilla
        abierto={editorAbierto}
        plantilla={enEdicion}
        onCerrar={() => setEditorAbierto(false)}
        onGuardado={cargarPlantillas}
      />

      <DialogConfirmacion
        abierto={!!aEliminar}
        titulo="¿Eliminar formato?"
        mensaje={
          <>Se eliminará <strong>{aEliminar?.nombre}</strong> del catálogo.
          Los documentos ya impresos no se ven afectados.</>
        }
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
