"use client";

// ============================================================
// header.tsx — Barra superior de la app.
// Contiene: menú hamburguesa (solo móvil), título del sistema
// y el Buscador Rápido Global. En móvil, el Sheet muestra el
// mismo contenido del sidebar de escritorio (sin duplicar código).
// ============================================================

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ContenidoSidebar } from "@/components/layout/sidebar";
import { GlobalSearch } from "@/components/layout/global-search";

export function Header() {
  // Controla la apertura del menú hamburguesa en móviles
  const [menuAbierto, setMenuAbierto] = React.useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4">
      {/* Menú hamburguesa: visible solo en pantallas pequeñas */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-0 p-0">
          {/* Título accesible requerido por Radix (oculto visualmente) */}
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          {/* Reutilizamos el sidebar; al navegar se cierra el menú */}
          <ContenidoSidebar alNavegar={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>

      {/* Título del sistema (se oculta en pantallas muy pequeñas) */}
      <h1 className="hidden text-sm font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Sistema de Control Veterinario
      </h1>

      {/* Buscador rápido global, alineado a la derecha */}
      <div className="ml-auto flex w-full max-w-sm justify-end">
        <GlobalSearch />
      </div>
    </header>
  );
}
