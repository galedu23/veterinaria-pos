"use client";

// ============================================================
// selector-paciente.tsx — Elegir la mascota antes de una consulta.
//
// QUÉ: modal con el BUSCADOR INTELIGENTE de mascotas (cruza nombre +
//   dueño + raza) que muestra foto, nombre, dueño y raza. Al tocar una
//   tarjeta, devuelve esa mascota a quien lo invocó.
// PARA QUÉ: una consulta SIEMPRE pertenece a un paciente. Antes solo se
//   podía dar de alta desde el expediente (donde el paciente ya se
//   conoce); este selector permite hacerlo también desde /consultas
//   sin perder esa regla: primero se elige a quién, luego se captura.
// POR QUÉ con foto: en la clínica el dueño llega con el animal en
//   brazos; reconocerlo por la foto es más rápido y seguro que leer
//   una lista de nombres repetidos.
// CÓMO SE CONECTA A SUPABASE: usa buscarMascotasAvanzado(), que pasará
//   a ser una consulta sobre la vista `mascotas_detalle`.
// ============================================================

import * as React from "react";
import { Search, Loader2, PawPrint } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { buscarMascotasAvanzado } from "@/services/db";
import type { Mascota } from "@/types";

/** Mascota con los datos cruzados que devuelve el buscador */
type MascotaEncontrada = Mascota & {
  nombreDueno: string;
  nombreRaza: string;
  nombreEspecie: string;
};

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  /** Entrega la mascota elegida para abrir el formulario de consulta */
  onSeleccionar: (mascota: MascotaEncontrada) => void;
}

export function SelectorPaciente({ abierto, onCerrar, onSeleccionar }: Props) {
  const [texto, setTexto] = React.useState("");
  const [resultados, setResultados] = React.useState<MascotaEncontrada[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // Al abrir se limpia la búsqueda anterior: cada consulta empieza de cero
  React.useEffect(() => {
    if (abierto) setTexto("");
  }, [abierto]);

  /**
   * Búsqueda con debounce de 250 ms: espera a que el usuario deje de
   * teclear para no lanzar una consulta por cada letra. Con el texto
   * vacío devuelve TODAS las mascotas (lista inicial).
   */
  React.useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    const temporizador = setTimeout(async () => {
      setResultados(await buscarMascotasAvanzado(texto));
      setCargando(false);
    }, 250);
    return () => clearTimeout(temporizador);
  }, [texto, abierto]);

  return (
    <Dialog open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>¿A qué paciente se atiende?</DialogTitle>
          <DialogDescription>
            Busca por nombre de la mascota, del dueño o por raza.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder='Ej. "lobo garcía" o "michi siamés"'
            className="pl-8"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>

        {/* Lista de pacientes con foto para identificarlos rápido */}
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {cargando ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : resultados.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin resultados. Prueba con el nombre del dueño o la raza.
            </p>
          ) : (
            resultados.map((m) => (
              <button
                key={m.id}
                onClick={() => onSeleccionar(m)}
                className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-50"
              >
                {m.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- dataURL local
                  <img src={m.fotoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full border object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <PawPrint className="h-5 w-5 text-blue-600" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.nombreEspecie} · {m.nombreRaza} · {m.nombreDueno}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
