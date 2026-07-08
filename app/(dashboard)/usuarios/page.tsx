"use client";

// ============================================================
// app/(dashboard)/usuarios/page.tsx — USUARIOS del sistema.
//
// QUÉ: lista de empleados con su rol. Vista exclusiva del
//   ADMINISTRADOR: aunque el sidebar ya oculta el enlace a otros
//   roles, aquí se valida de nuevo por si alguien teclea la URL
//   directamente (defensa en profundidad).
// POR QUÉ el botón "Nuevo usuario" está deshabilitado: dar de alta
//   usuarios reales exige el backend de autenticación; hacerlo con
//   el mock daría una falsa sensación de seguridad.
// TODO Supabase: habilitar el alta vía Edge Function con
//   supabase.auth.admin y guardar el rol en la tabla `perfiles`.
// ============================================================

import * as React from "react";
import { UserCog, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablaUsuarios } from "@/components/usuarios/tabla-usuarios";
import { useAuth } from "@/hooks/use-auth";
import { getUsuarios, tienePermiso } from "@/services/auth";
import type { Usuario } from "@/types";

export default function PaginaUsuarios() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    getUsuarios().then((u) => {
      setUsuarios(u);
      setCargando(false);
    });
  }, []);

  // Defensa en profundidad: si un no-admin llega por URL directa,
  // se le muestra el aviso en lugar de los datos.
  if (!tienePermiso(usuario, ["administrador"])) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Solo el administrador puede gestionar los usuarios del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UserCog className="h-6 w-6 text-yellow-600" /> Usuarios
        </h2>
        {/* Deshabilitado a propósito: el alta real llega con Supabase Auth */}
        <Button disabled title="Disponible al conectar Supabase Auth">
          <Plus /> Nuevo usuario
        </Button>
      </div>

      <TablaUsuarios usuarios={usuarios} cargando={cargando} idSesion={usuario?.id} />

      <p className="text-xs text-muted-foreground">
        El alta y edición de usuarios se habilitará al conectar Supabase Auth
        (requiere manejo seguro de contraseñas e invitaciones por email).
      </p>
    </div>
  );
}
