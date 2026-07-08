"use client";

// ============================================================
// app/(dashboard)/layout.tsx — Layout PROTEGIDO del sistema.
// Todas las vistas internas (dashboard, clientes, mascotas, POS...)
// viven dentro de este grupo de rutas y comparten:
//   - Guardia de autenticación (redirige a /login sin sesión)
//   - Sidebar oscuro fijo en escritorio
//   - Header con menú hamburguesa (móvil) y buscador global
// TODO: Al conectar Supabase, mover esta protección a middleware.ts
//       con cookies de sesión del servidor (@supabase/ssr).
// ============================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function LayoutProtegido({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  // Guardia de ruta: si no hay sesión, redirigimos al login
  React.useEffect(() => {
    if (!cargando && !usuario) router.replace("/login");
  }, [cargando, usuario, router]);

  // Mientras se restaura la sesión mostramos un indicador de carga
  if (cargando || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar fijo (solo escritorio) */}
      <Sidebar />

      {/* Contenido: se desplaza a la derecha del sidebar en escritorio */}
      <div className="md:pl-64">
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
