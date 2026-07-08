"use client";

// ============================================================
// hooks/use-auth.tsx — Contexto de autenticación para toda la app.
// Envuelve la app (ver app/layout.tsx) y expone el usuario actual,
// login y logout a cualquier componente cliente vía useAuth().
// TODO: Al conectar Supabase Auth, escuchar aquí onAuthStateChange().
// ============================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types";
import * as authService from "@/services/auth";

interface AuthContexto {
  usuario: Usuario | null;
  cargando: boolean; // true mientras se restaura la sesión de localStorage
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const ContextoAuth = React.createContext<AuthContexto | undefined>(undefined);

/**
 * AuthProvider: proveedor global de sesión. Restaura la sesión guardada
 * al cargar la página y expone las acciones de login/logout.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = React.useState<Usuario | null>(null);
  const [cargando, setCargando] = React.useState(true);

  // Al montar, restauramos la sesión persistida (simula getSession de Supabase)
  React.useEffect(() => {
    setUsuario(authService.getSession());
    setCargando(false);
  }, []);

  /** iniciarSesion: delega en el servicio de auth y guarda el usuario en estado */
  const iniciarSesion = React.useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUsuario(u);
  }, []);

  /** cerrarSesion: limpia la sesión y redirige al login */
  const cerrarSesion = React.useCallback(async () => {
    await authService.logout();
    setUsuario(null);
    router.push("/login");
  }, [router]);

  return (
    <ContextoAuth.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </ContextoAuth.Provider>
  );
}

/**
 * useAuth: hook de acceso al contexto de autenticación.
 * Lanza un error claro si se usa fuera del AuthProvider.
 */
export function useAuth(): AuthContexto {
  const ctx = React.useContext(ContextoAuth);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
