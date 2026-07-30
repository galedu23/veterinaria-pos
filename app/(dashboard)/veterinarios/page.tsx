"use client";

// ============================================================
// app/(dashboard)/veterinarios/page.tsx — MÉDICOS VETERINARIOS.
//
// QUÉ: administra a los médicos que firman consultas, recetas y
//   documentos legales. Es DISTINTO de /usuarios (cuentas de acceso).
// PARA QUÉ: la cédula profesional registrada aquí es la que se imprime
//   en los certificados; sin ella un documento no tiene validez legal.
// CÓMO SE CONECTA A SUPABASE: services/db.ts -> tabla `veterinarios`.
// ============================================================

import * as React from "react";
import { Stethoscope, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TablaVeterinarios, FormularioVeterinario,
} from "@/components/veterinarios/gestion-veterinarios";
import { DialogConfirmacion } from "@/components/compartidos/dialog-confirmacion";
import { useAuth } from "@/hooks/use-auth";
import { tienePermiso } from "@/services/auth";
import { getVeterinarios, desactivarVeterinario } from "@/services/db";
import type { Veterinario } from "@/types";

export default function PaginaVeterinarios() {
  const { usuario } = useAuth();

  const [veterinarios, setVeterinarios] = React.useState<Veterinario[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [enEdicion, setEnEdicion] = React.useState<Veterinario | null>(null);
  const [aDesactivar, setADesactivar] = React.useState<Veterinario | null>(null);

  /** cargarVeterinarios: trae el listado (activos primero) */
  const cargarVeterinarios = React.useCallback(async () => {
    setCargando(true);
    setVeterinarios(await getVeterinarios());
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarVeterinarios();
  }, [cargarVeterinarios]);

  /** confirmarDesactivar: baja lógica, conserva los documentos firmados */
  const confirmarDesactivar = async () => {
    if (!aDesactivar) return;
    await desactivarVeterinario(aDesactivar.id);
    setADesactivar(null);
    await cargarVeterinarios();
  };

  // Defensa en profundidad: el sidebar oculta el enlace, pero alguien
  // podría teclear la URL directamente.
  if (!tienePermiso(usuario, ["administrador"])) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">
          Solo el administrador puede gestionar a los médicos veterinarios.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Stethoscope className="h-6 w-6 text-teal-600" /> Médicos Veterinarios
        </h2>
        <Button onClick={() => { setEnEdicion(null); setModalAbierto(true); }}>
          <Plus /> Nuevo Veterinario
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        La cédula profesional de estos médicos se imprime en recetas, certificados
        y consentimientos. Dar de baja a un médico no borra los documentos que ya firmó.
      </p>

      <TablaVeterinarios
        veterinarios={veterinarios}
        cargando={cargando}
        onEditar={(v) => { setEnEdicion(v); setModalAbierto(true); }}
        onDesactivar={setADesactivar}
      />

      <FormularioVeterinario
        abierto={modalAbierto}
        veterinario={enEdicion}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={cargarVeterinarios}
      />

      <DialogConfirmacion
        abierto={!!aDesactivar}
        titulo="¿Dar de baja al médico?"
        mensaje={
          <>
            <strong>{aDesactivar?.nombre}</strong> dejará de aparecer al firmar
            documentos nuevos. Los documentos que ya firmó se conservan intactos.
          </>
        }
        textoConfirmar="Dar de baja"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setADesactivar(null)}
      />
    </div>
  );
}
