"use client";

// ============================================================
// global-search.tsx — BUSCADOR RÁPIDO GLOBAL del encabezado.
// El empleado teclea el nombre de un cliente o mascota y puede
// abrir su detalle al instante. Busca con "debounce" (espera
// 300 ms tras dejar de teclear) para no saturar el backend.
// ============================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, User, PawPrint, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { busquedaGlobal } from "@/services/db";
import type { ResultadoBusqueda } from "@/types";

export function GlobalSearch() {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [resultados, setResultados] = React.useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = React.useState(false);

  // Atajo de teclado Ctrl+K / Cmd+K para abrir el buscador desde cualquier vista
  React.useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto(true);
      }
    };
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, []);

  // Búsqueda con debounce: espera 300 ms después de la última tecla
  React.useEffect(() => {
    if (!abierto) return;
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const temporizador = setTimeout(async () => {
      const encontrados = await busquedaGlobal(texto);
      setResultados(encontrados);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(temporizador);
  }, [texto, abierto]);

  /** irADetalle: navega a la vista de detalle y cierra el buscador */
  const irADetalle = (r: ResultadoBusqueda) => {
    setAbierto(false);
    setTexto("");
    setResultados([]);
    router.push(r.url);
  };

  return (
    <>
      {/* Botón que simula una barra de búsqueda en el encabezado */}
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full max-w-xs items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-sm"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar cliente o mascota...</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 text-[10px] font-medium sm:inline-block">
          Ctrl K
        </kbd>
      </button>

      {/* Modal de búsqueda con resultados en vivo */}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="top-[20%] translate-y-0 gap-3 p-4 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Buscador rápido</DialogTitle>
            <DialogDescription>
              Escribe el nombre de un cliente, mascota, teléfono o raza.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            placeholder='Ej. "Lobo García" o "555-101"'
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          {/* Lista de resultados */}
          <div className="max-h-72 overflow-y-auto">
            {buscando && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
              </div>
            )}

            {!buscando && texto.trim().length >= 2 && resultados.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin resultados para &quot;{texto}&quot;
              </p>
            )}

            {!buscando &&
              resultados.map((r) => (
                <button
                  key={`${r.tipo}-${r.id}`}
                  onClick={() => irADetalle(r)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  {r.tipo === "cliente" ? (
                    <User className="h-4 w-4 shrink-0 text-blue-600" />
                  ) : (
                    <PawPrint className="h-4 w-4 shrink-0 text-green-600" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{r.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.subtitulo}</span>
                  </span>
                  <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {r.tipo}
                  </span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
