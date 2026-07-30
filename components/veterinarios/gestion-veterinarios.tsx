"use client";

// ============================================================
// gestion-veterinarios.tsx — Tabla + formulario de VETERINARIOS.
//
// QUÉ: los dos componentes del módulo, juntos porque siempre se usan
//   en pareja (mismo criterio que vacunas-mascota.tsx):
//   1. TablaVeterinarios — listado con cédula y estado
//   2. FormularioVeterinario — alta/edición en un Dialog
// PARA QUÉ sirve el módulo: registrar al MÉDICO que firma. Su cédula
//   profesional se imprime en recetas y documentos legales, por eso es
//   el único campo obligatorio junto al nombre.
// CÓMO SE GUARDA EN SUPABASE: tabla `veterinarios`. La baja es LÓGICA
//   (activo=false) para no romper los documentos ya firmados.
// ============================================================

import * as React from "react";
import { Loader2, Pencil, UserX, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { crearVeterinario, actualizarVeterinario } from "@/services/db";
import type { Veterinario } from "@/types";

// ------------------------------------------------------------
// 1) TABLA
// ------------------------------------------------------------

interface PropsTabla {
  veterinarios: Veterinario[];
  cargando: boolean;
  onEditar: (veterinario: Veterinario) => void;
  onDesactivar: (veterinario: Veterinario) => void;
}

export function TablaVeterinarios({ veterinarios, cargando, onEditar, onDesactivar }: PropsTabla) {
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
            <TableHead>Médico</TableHead>
            <TableHead>Cédula profesional</TableHead>
            <TableHead className="hidden md:table-cell">Especialidad</TableHead>
            <TableHead className="hidden sm:table-cell">Contacto</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {veterinarios.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Sin veterinarios registrados.
              </TableCell>
            </TableRow>
          )}
          {veterinarios.map((v) => (
            <TableRow key={v.id} className={v.activo ? "" : "opacity-60"}>
              <TableCell className="font-medium">{v.nombre}</TableCell>
              <TableCell className="font-mono text-xs">{v.cedulaProfesional}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {v.especialidad ?? "—"}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                {v.telefono ?? v.email ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                {v.activo ? (
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck className="h-3 w-3" /> Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEditar(v)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {/* Baja lógica: nunca se borra (conserva documentos firmados) */}
                  {v.activo && (
                    <Button variant="ghost" size="icon" onClick={() => onDesactivar(v)} aria-label="Desactivar">
                      <UserX className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ------------------------------------------------------------
// 2) FORMULARIO (Dialog)
// ------------------------------------------------------------

interface PropsFormulario {
  abierto: boolean;
  /** null = alta nueva; con veterinario = edición */
  veterinario: Veterinario | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function FormularioVeterinario({ abierto, veterinario, onCerrar, onGuardado }: PropsFormulario) {
  const [nombre, setNombre] = React.useState("");
  const [cedula, setCedula] = React.useState("");
  const [especialidad, setEspecialidad] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Al abrir: precargar (editar) o limpiar (alta nueva)
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    setNombre(veterinario?.nombre ?? "");
    setCedula(veterinario?.cedulaProfesional ?? "");
    setEspecialidad(veterinario?.especialidad ?? "");
    setTelefono(veterinario?.telefono ?? "");
    setEmail(veterinario?.email ?? "");
  }, [abierto, veterinario]);

  /**
   * guardar: valida nombre y CÉDULA (ambos obligatorios: sin cédula el
   * médico no puede firmar certificados con validez legal en México).
   */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre del médico es obligatorio.");
      return;
    }
    if (!cedula.trim()) {
      setError("La cédula profesional es obligatoria: se imprime en recetas y certificados.");
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      cedulaProfesional: cedula.trim(),
      especialidad: especialidad.trim() || undefined,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      activo: veterinario?.activo ?? true,
    };

    setGuardando(true);
    try {
      if (veterinario) {
        await actualizarVeterinario(veterinario.id, datos);
      } else {
        await crearVeterinario(datos);
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{veterinario ? "Editar Veterinario" : "Nuevo Veterinario"}</DialogTitle>
          <DialogDescription>
            Los datos de este médico aparecerán en las recetas y documentos que firme.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombreVet">Nombre completo *</Label>
            <Input id="nombreVet" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="MVZ Laura Méndez Ruiz" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cedulaVet">Cédula profesional *</Label>
            <Input id="cedulaVet" value={cedula} onChange={(e) => setCedula(e.target.value)}
              placeholder="12345678" />
            <p className="text-xs text-muted-foreground">
              Obligatoria por ley para firmar certificados y recetas.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="especialidadVet">Especialidad</Label>
            <Input id="especialidadVet" value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              placeholder="Medicina y cirugía de pequeñas especies" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="telVet">Teléfono</Label>
              <Input id="telVet" type="tel" value={telefono}
                onChange={(e) => setTelefono(e.target.value)} placeholder="961 100 2030" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailVet">Correo</Label>
              <Input id="emailVet" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {veterinario ? "Guardar cambios" : "Registrar médico"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
