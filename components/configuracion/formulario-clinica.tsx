"use client";

// ============================================================
// formulario-clinica.tsx — Formulario de datos de la clínica.
//
// QUÉ: captura Nombre, Dirección, Teléfono y Mensaje de despedida.
//   Estos datos los lee el TICKET DE VENTA al imprimirse.
// POR QUÉ incluye una VISTA PREVIA en vivo del ticket: el admin ve
//   exactamente cómo quedará impreso mientras escribe, sin tener
//   que hacer una venta de prueba para verificarlo.
// CÓMO SE CONECTA A SUPABASE: usa services/config.ts; al migrar,
//   solo ese servicio cambia (tabla `configuracion` de una fila).
// ============================================================

import * as React from "react";
import { Loader2, CircleCheck, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/compartidos/image-uploader";
import { getConfiguracionClinica, guardarConfiguracionClinica } from "@/services/config";
import type { ConfiguracionClinica } from "@/types";

export function FormularioClinica() {
  const [config, setConfig] = React.useState<ConfiguracionClinica | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [guardado, setGuardado] = React.useState(false); // feedback "✓ Guardado"

  // Al montar, cargamos la configuración actual (o los defaults)
  React.useEffect(() => {
    getConfiguracionClinica().then(setConfig);
  }, []);

  /** actualizarCampo: helper genérico para los 4 inputs */
  const actualizarCampo = (campo: keyof ConfiguracionClinica, valor: string) => {
    setConfig((c) => (c ? { ...c, [campo]: valor } : c));
    setGuardado(false); // si edita después de guardar, se apaga el "✓"
  };

  /** guardar: persiste la configuración y muestra confirmación */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setGuardando(true);
    await guardarConfiguracionClinica({
      ...config,
      nombre: config.nombre.trim() || "VetGram", // el ticket siempre necesita un nombre
    });
    setGuardando(false);
    setGuardado(true);
  };

  if (!config) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* -------- Formulario -------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos de la clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardar} className="space-y-4">
            {/* Logotipo: REUTILIZA el ImageUploader genérico (misma
                compresión Canvas -> WebP de mascotas y productos).
                300px basta: en tickets y recetas se imprime pequeño.
                TODO Supabase Storage: subir foto.blob al bucket "fotos"
                como `clinica/logo.webp` (upsert) y guardar la URL pública. */}
            <div className="space-y-1.5">
              <Label>Logotipo de la clínica</Label>
              <ImageUploader
                imagenActual={config.logoUrl}
                alt="Logotipo de la clínica"
                opciones={{ ladoMaximoPx: 300, calidad: 0.8 }}
                onImagenLista={(foto) => actualizarCampo("logoUrl", foto.dataUrl)}
                onQuitar={() => actualizarCampo("logoUrl", "")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nombreClinica">Nombre de la clínica *</Label>
              <Input id="nombreClinica" value={config.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                placeholder="Veterinaria VetGram" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={config.direccion}
                onChange={(e) => actualizarCampo("direccion", e.target.value)}
                placeholder="Av. Principal 123, Col. Centro" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefonoClinica">Teléfono</Label>
              <Input id="telefonoClinica" type="tel" value={config.telefono}
                onChange={(e) => actualizarCampo("telefono", e.target.value)}
                placeholder="555-000-0000" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mensaje">Mensaje de despedida del ticket</Label>
              <Input id="mensaje" value={config.mensajeDespedida}
                onChange={(e) => actualizarCampo("mensajeDespedida", e.target.value)}
                placeholder="¡Gracias por su compra!" />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={guardando}>
                {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar configuración
              </Button>
              {guardado && (
                <span className="flex items-center gap-1 text-sm text-green-700">
                  <CircleCheck className="h-4 w-4" /> Guardado
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* -------- Vista previa EN VIVO del ticket -------- */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vista previa del ticket</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Réplica del encabezado/pie reales del TicketVenta:
              lo que se escribe a la izquierda aparece aquí al instante */}
          <div className="mx-auto max-w-[260px] rounded-md border border-dashed bg-muted/30 p-4 font-mono text-xs">
            <div className="mb-2 text-center">
              {/* El logo aparece arriba del nombre, como saldrá impreso */}
              {config.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- logo WebP local
                <img src={config.logoUrl} alt="Logo" className="mx-auto mb-1 h-12 w-12 object-contain" />
              )}
              <p className="flex items-center justify-center gap-1 text-sm font-bold">
                {!config.logoUrl && <PawPrint className="h-4 w-4" />} {config.nombre || "VetGram"}
              </p>
              {config.direccion && <p>{config.direccion}</p>}
              {config.telefono && <p>Tel: {config.telefono}</p>}
              <p className="mt-1">Ticket: V-0000</p>
            </div>
            <div className="border-t border-dashed py-2 text-muted-foreground">
              <div className="flex justify-between"><span>1 x Producto ejemplo</span><span>$100.00</span></div>
            </div>
            <div className="flex justify-between border-t border-dashed pt-2 text-sm font-bold">
              <span>TOTAL</span><span>$100.00</span>
            </div>
            <p className="mt-2 text-center">{config.mensajeDespedida || "¡Gracias por su compra!"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
