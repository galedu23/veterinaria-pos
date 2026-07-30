"use client";

// ============================================================
// enlace-portal.tsx — Compartir el PORTAL con el cliente.
//
// QUÉ: botón + modal que muestra el enlace personal del cliente, lo
//   copia al portapapeles, lo envía por WhatsApp con un mensaje listo,
//   y permite REGENERARLO (invalidando el anterior).
// PARA QUÉ WhatsApp: es como la clínica ya se comunica con sus dueños
//   en México; abrir wa.me con el mensaje escrito evita que la
//   recepcionista tenga que copiar y pegar entre aplicaciones.
// SEGURIDAD: el enlace es la llave del expediente de ese cliente, por
//   eso el modal lo advierte y ofrece regenerarlo si se compartió mal.
// ============================================================

import * as React from "react";
import { Share2, Copy, Check, RefreshCw, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { regenerarTokenPortal } from "@/services/db";
import type { Cliente } from "@/types";

interface Props {
  cliente: Cliente;
  /** Avisa al perfil para recargar cuando el token cambia */
  onTokenRegenerado: () => void;
}

export function EnlacePortal({ cliente, onTokenRegenerado }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [copiado, setCopiado] = React.useState(false);
  const [regenerando, setRegenerando] = React.useState(false);
  // El enlace se arma en el navegador porque necesita el dominio actual
  // (localhost en pruebas, el dominio real en producción).
  const [enlace, setEnlace] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setEnlace(`${window.location.origin}/portal/${cliente.tokenPortal}`);
    }
  }, [cliente.tokenPortal]);

  /** copiar: manda el enlace al portapapeles y confirma por 2 segundos */
  const copiar = async () => {
    await navigator.clipboard.writeText(enlace);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  /**
   * abrirWhatsApp: arma el mensaje y abre WhatsApp.
   * El teléfono se limpia de espacios y guiones, y se le antepone 52
   * (México) si viene de 10 dígitos, como lo exige wa.me.
   */
  const abrirWhatsApp = () => {
    const soloDigitos = cliente.telefono.replace(/\D/g, "");
    const numero = soloDigitos.length === 10 ? `52${soloDigitos}` : soloDigitos;
    const mensaje =
      `Hola ${cliente.nombre}, aquí puedes consultar la información de tus ` +
      `mascotas, sus vacunas y próximas citas: ${enlace}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  /** regenerar: crea un token nuevo; el enlace anterior deja de servir */
  const regenerar = async () => {
    setRegenerando(true);
    await regenerarTokenPortal(cliente.id);
    setRegenerando(false);
    onTokenRegenerado(); // el perfil recarga y este componente recibe el token nuevo
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Share2 /> Portal del cliente
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enlace personal de {cliente.nombre}</DialogTitle>
            <DialogDescription>
              Con este enlace podrá ver sus mascotas, vacunas y próximas citas
              sin necesidad de usuario ni contraseña.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* El enlace, en tipografía monoespaciada para leerlo bien */}
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="break-all font-mono text-xs text-slate-700">{enlace}</p>
            </div>

            {/* Acciones principales: copiar y mandar por WhatsApp */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={copiar}>
                {copiado ? <Check className="text-green-600" /> : <Copy />}
                {copiado ? "¡Copiado!" : "Copiar enlace"}
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={abrirWhatsApp}>
                <MessageCircle /> Enviar por WhatsApp
              </Button>
            </div>

            {/* Advertencia + opción de revocar */}
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Trátalo como una contraseña</p>
              <p className="mt-1 text-xs">
                Cualquier persona con el enlace puede ver la información de este
                cliente. Si se compartió por error, genera uno nuevo: el anterior
                dejará de funcionar de inmediato.
              </p>
              <Button
                variant="outline" size="sm" className="mt-2"
                onClick={regenerar} disabled={regenerando}
              >
                {regenerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw />}
                Generar enlace nuevo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
