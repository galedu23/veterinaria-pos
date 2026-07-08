"use client";

// ============================================================
// tabla-usuarios.tsx — Tabla de empleados del sistema.
//
// QUÉ: lista los usuarios con su rol como badge de color.
// POR QUÉ es de SOLO LECTURA por ahora: crear/editar usuarios
//   requiere el backend real (contraseñas, invitaciones); con el
//   mock solo mostramos los 3 usuarios de prueba.
// TODO Supabase: el alta será supabase.auth.admin.inviteUserByEmail()
//   desde una Edge Function (nunca desde el navegador) + fila en
//   la tabla `perfiles` con el rol.
// ============================================================

import { Loader2, ShieldCheck, Stethoscope, Headset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Usuario, Rol } from "@/types";

/** Apariencia de cada rol: color del badge + icono (una sola fuente de verdad) */
const APARIENCIA_ROL: Record<Rol, { etiqueta: string; variante: "default" | "success" | "warning"; Icono: typeof ShieldCheck }> = {
  administrador: { etiqueta: "Administrador", variante: "warning", Icono: ShieldCheck },
  veterinario: { etiqueta: "Veterinario", variante: "success", Icono: Stethoscope },
  recepcion: { etiqueta: "Recepción", variante: "default", Icono: Headset },
};

interface Props {
  usuarios: Usuario[];
  cargando: boolean;
  /** Id del usuario en sesión, para marcar "(tú)" en su fila */
  idSesion?: string;
}

export function TablaUsuarios({ usuarios, cargando, idSesion }: Props) {
  if (cargando) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((u) => {
            const rol = APARIENCIA_ROL[u.rol];
            return (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.nombre}
                  {u.id === idSesion && (
                    <span className="ml-1 text-xs text-muted-foreground">(tú)</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={rol.variante} className="gap-1">
                    <rol.Icono className="h-3 w-3" /> {rol.etiqueta}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
