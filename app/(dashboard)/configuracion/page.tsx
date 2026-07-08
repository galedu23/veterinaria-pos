"use client";

// ============================================================
// app/(dashboard)/configuracion/page.tsx — CONFIGURACIÓN del sistema.
//
// QUÉ: página exclusiva del ADMINISTRADOR con los ajustes generales.
//   Hoy contiene los datos de la clínica para el ticket; aquí se
//   agregarán futuras secciones (impuestos, logo, horarios...).
// POR QUÉ valida el rol otra vez (defensa en profundidad): el sidebar
//   oculta el enlace, pero cualquiera puede teclear la URL.
// ============================================================

import { Settings, ShieldAlert } from "lucide-react";
import { FormularioClinica } from "@/components/configuracion/formulario-clinica";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";

export default function PaginaConfiguracion() {
  const { usuario } = useAuth();

  // Solo el administrador configura el sistema
  if (!tienePermiso(usuario, ["administrador"])) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Solo el administrador puede modificar la configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Settings className="h-6 w-6 text-slate-600" /> Configuración
      </h2>
      <p className="text-sm text-muted-foreground">
        Estos datos se imprimen en el encabezado y pie de los tickets de venta.
      </p>
      <FormularioClinica />
    </div>
  );
}
