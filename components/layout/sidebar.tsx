"use client";

// ============================================================
// sidebar.tsx — Menú lateral oscuro (como el sistema anterior).
// El componente <ContenidoSidebar> se reutiliza en dos lugares:
//   1. Sidebar fijo en escritorio (md en adelante)
//   2. Dentro del Sheet (menú hamburguesa) en móviles
// Filtra los módulos según el rol del usuario en sesión.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ITEMS_NAVEGACION } from "@/components/layout/nav-items";

/**
 * ContenidoSidebar: lista de navegación reutilizable (escritorio y móvil).
 * `alNavegar` permite cerrar el menú móvil al tocar una opción.
 */
export function ContenidoSidebar({ alNavegar }: { alNavegar?: () => void }) {
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useAuth();

  // Solo mostramos los módulos permitidos para el rol actual
  const itemsVisibles = ITEMS_NAVEGACION.filter(
    (item) => usuario && item.roles.includes(usuario.rol)
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-slate-200">
      {/* Logo / encabezado del sidebar */}
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-4">
        <PawPrint className="h-7 w-7 text-blue-400" />
        <div>
          <p className="text-base font-bold leading-tight text-white">Soft - VetGram</p>
          <p className="text-xs text-slate-400">Control Veterinario</p>
        </div>
      </div>

      {/* Datos del usuario en sesión (nombre + rol) */}
      {usuario && (
        <div className="border-b border-slate-700 px-4 py-3">
          <p className="truncate text-sm font-medium text-white">{usuario.nombre}</p>
          <p className="text-xs capitalize text-blue-300">{usuario.rol}</p>
        </div>
      )}

      {/* Lista de módulos con resaltado de la ruta activa */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {itemsVisibles.map((item) => {
          const activo =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={alNavegar}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "bg-sidebar-active text-white"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <item.icono className="h-4 w-4 shrink-0" />
              {item.titulo}
            </Link>
          );
        })}
      </nav>

      {/* Botón de cerrar sesión (rojo, como la referencia) */}
      <div className="border-t border-slate-700 p-2">
        <button
          onClick={() => cerrarSesion()}
          className="flex w-full items-center gap-3 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

/**
 * Sidebar: versión fija para escritorio. En móviles se oculta y su
 * contenido se muestra dentro del Sheet del encabezado (header.tsx).
 */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block">
      <ContenidoSidebar />
    </aside>
  );
}
