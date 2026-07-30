"use client";

// ============================================================
// editor-plantilla.tsx — Editor de DOCUMENTOS LEGALES (Sheet ancho).
//
// QUÉ: permite redactar el texto de un formato legal (consentimiento,
//   certificado…) con marcadores como {{MASCOTA}} que se sustituyen
//   con los datos reales al generarlo.
// PARA QUÉ: que la clínica ajuste la redacción de sus documentos SIN
//   programar. Puede corregir una cláusula, cambiar el fundamento legal
//   o crear formatos nuevos desde cero.
// DETALLE DE USABILIDAD: los marcadores disponibles se muestran como
//   botones; al hacer clic se INSERTAN EN LA POSICIÓN DEL CURSOR, así
//   quien redacta no tiene que memorizarlos ni escribirlos bien.
// CÓMO SE GUARDA EN SUPABASE: tabla `plantillas_documento` (el texto
//   viaja tal cual en una columna de tipo text).
// ============================================================

import * as React from "react";
import { Loader2, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { MARCADORES } from "@/lib/documentos-legales";
import { crearPlantilla, actualizarPlantilla } from "@/services/db";
import type { PlantillaDocumento } from "@/types";

interface Props {
  abierto: boolean;
  /** null = formato nuevo; con plantilla = edición */
  plantilla: PlantillaDocumento | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function EditorPlantilla({ abierto, plantilla, onCerrar, onGuardado }: Props) {
  // Referencia al textarea: la necesitamos para insertar marcadores
  // justo donde está el cursor (y no al final del texto).
  const areaRef = React.useRef<HTMLTextAreaElement>(null);

  const [nombre, setNombre] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [fundamento, setFundamento] = React.useState("");
  const [contenido, setContenido] = React.useState("");
  const [firmaVet, setFirmaVet] = React.useState(true);
  const [firmaProp, setFirmaProp] = React.useState(true);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Al abrir: precargar el formato o dejar el editor en blanco
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    setNombre(plantilla?.nombre ?? "");
    setDescripcion(plantilla?.descripcion ?? "");
    setFundamento(plantilla?.fundamentoLegal ?? "");
    setContenido(plantilla?.contenido ?? "");
    setFirmaVet(plantilla?.requiereFirmaVeterinario ?? true);
    setFirmaProp(plantilla?.requiereFirmaPropietario ?? true);
  }, [abierto, plantilla]);

  /**
   * insertarMarcador: mete la etiqueta donde está el cursor.
   * Si no hay cursor (el usuario no ha tocado el área), la agrega al final.
   * Después devuelve el foco para poder seguir escribiendo de corrido.
   */
  const insertarMarcador = (etiqueta: string) => {
    const area = areaRef.current;
    if (!area) {
      setContenido((texto) => texto + etiqueta);
      return;
    }
    const inicio = area.selectionStart;
    const fin = area.selectionEnd;
    const nuevoTexto = contenido.slice(0, inicio) + etiqueta + contenido.slice(fin);
    setContenido(nuevoTexto);
    // Reposicionamos el cursor DESPUÉS del marcador insertado.
    // setTimeout(0) espera a que React repinte el textarea.
    setTimeout(() => {
      area.focus();
      const posicion = inicio + etiqueta.length;
      area.setSelectionRange(posicion, posicion);
    }, 0);
  };

  /** guardar: valida lo mínimo y crea o actualiza el formato */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre del documento es obligatorio.");
      return;
    }
    if (!contenido.trim()) {
      setError("El contenido del documento no puede estar vacío.");
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      fundamentoLegal: fundamento.trim() || undefined,
      contenido,
      requiereFirmaVeterinario: firmaVet,
      requiereFirmaPropietario: firmaProp,
      activo: plantilla?.activo ?? true,
    };

    setGuardando(true);
    try {
      if (plantilla) {
        await actualizarPlantilla(plantilla.id, datos);
      } else {
        await crearPlantilla(datos);
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Sheet open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      {/* Sheet ANCHO: redactar un documento legal necesita espacio */}
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-indigo-600" />
            {plantilla ? "Editar formato" : "Nuevo formato"}
          </SheetTitle>
          <SheetDescription>
            Redacta el documento y usa los marcadores para los datos que cambian
            en cada paciente.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={guardar} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombrePlantilla">Nombre del documento *</Label>
            <Input id="nombrePlantilla" value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Consentimiento Informado para Eutanasia" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="descPlantilla">Descripción</Label>
              <Input id="descPlantilla" value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Para qué se usa este formato" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fundamento">Fundamento legal</Label>
              <Input id="fundamento" value={fundamento}
                onChange={(e) => setFundamento(e.target.value)}
                placeholder="NOM-033-SAG/ZOO-2014" />
            </div>
          </div>

          {/* Bloques de firma que se imprimirán al pie del documento */}
          <div className="flex flex-wrap gap-4 rounded-md border bg-muted/30 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={firmaVet}
                onChange={(e) => setFirmaVet(e.target.checked)} className="h-4 w-4" />
              Imprimir firma del veterinario (con cédula)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={firmaProp}
                onChange={(e) => setFirmaProp(e.target.checked)} className="h-4 w-4" />
              Imprimir firma del propietario
            </label>
          </div>

          {/* Marcadores disponibles: clic = insertar en el cursor */}
          <div className="space-y-1.5">
            <Label>Marcadores disponibles (clic para insertar)</Label>
            <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-2">
              {MARCADORES.map((m) => (
                <button
                  key={m.etiqueta}
                  type="button"
                  title={m.descripcion}
                  onClick={() => insertarMarcador(m.etiqueta)}
                  className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[11px] text-indigo-800 transition-colors hover:bg-indigo-200"
                >
                  {m.etiqueta}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Los marcadores sin dato se imprimen como una línea en blanco
              (__________) para llenarse a mano.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contenidoPlantilla">Contenido del documento *</Label>
            <textarea
              id="contenidoPlantilla"
              ref={areaRef}
              rows={18}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Redacta aquí el documento. Los saltos de línea se respetan al imprimir."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {plantilla ? "Guardar cambios" : "Crear formato"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
