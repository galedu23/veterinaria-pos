"use client";

// ============================================================
// formulario-mascota.tsx — Panel (Sheet) de Crear/Editar mascota.
//
// QUÉ: formulario con dueño, nombre, especie, raza, sexo, fecha de
//   nacimiento y color.
// DETALLE CLAVE (selects dependientes): al cambiar la ESPECIE se
//   filtran las RAZAS de esa especie. Por eso recibimos el catálogo
//   completo de razas y filtramos en memoria con cada cambio.
// CÓMO SE CONECTA A SUPABASE: crearMascota/actualizarMascota del
//   servicio. Las razas vendrán de la tabla `razas` filtradas por
//   especie_id (o se siguen filtrando en memoria, son pocas).
// ============================================================

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { SelectNativo } from "@/components/compartidos/select-nativo";
import { crearMascota, actualizarMascota } from "@/services/db";
import type { Mascota, Cliente, Especie, Raza } from "@/types";

interface Campos {
  clienteId: string;
  nombre: string;
  especieId: string;
  razaId: string;
  sexo: "macho" | "hembra";
  fechaNacimiento: string;
  color: string;
}

interface Props {
  abierto: boolean;
  /** null = crear; con mascota = editar */
  mascota: Mascota | null;
  clientes: Cliente[];
  especies: Especie[];
  razas: Raza[];
  /** Preselecciona el dueño (útil al crear desde el perfil del cliente) */
  clienteIdInicial?: string;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function FormularioMascota({
  abierto, mascota, clientes, especies, razas, clienteIdInicial, onCerrar, onGuardado,
}: Props) {
  const [campos, setCampos] = React.useState<Campos>({
    clienteId: "", nombre: "", especieId: "", razaId: "",
    sexo: "macho", fechaNacimiento: "", color: "",
  });
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Al abrir el panel: precargar (editar) o inicializar (crear)
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    if (mascota) {
      setCampos({
        clienteId: mascota.clienteId,
        nombre: mascota.nombre,
        especieId: mascota.especieId,
        razaId: mascota.razaId,
        sexo: mascota.sexo,
        fechaNacimiento: mascota.fechaNacimiento ?? "",
        color: mascota.color ?? "",
      });
    } else {
      const especieInicial = especies[0]?.id ?? "";
      setCampos({
        clienteId: clienteIdInicial ?? clientes[0]?.id ?? "",
        nombre: "",
        especieId: especieInicial,
        // La raza inicial debe ser coherente con la especie inicial
        razaId: razas.find((r) => r.especieId === especieInicial)?.id ?? "",
        sexo: "macho",
        fechaNacimiento: "",
        color: "",
      });
    }
  }, [abierto, mascota, clientes, especies, razas, clienteIdInicial]);

  // Razas visibles = solo las de la especie seleccionada (select dependiente)
  const razasFiltradas = razas.filter((r) => r.especieId === campos.especieId);

  /**
   * cambiarEspecie: al cambiar de especie, la raza seleccionada deja de
   * ser válida, así que la reiniciamos a la primera de la nueva especie.
   */
  const cambiarEspecie = (especieId: string) => {
    const primeraRaza = razas.find((r) => r.especieId === especieId)?.id ?? "";
    setCampos((c) => ({ ...c, especieId, razaId: primeraRaza }));
  };

  const actualizarCampo = (campo: keyof Campos, valor: string) =>
    setCampos((c) => ({ ...c, [campo]: valor }));

  /** guardar: valida y llama al servicio en el modo correspondiente */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!campos.nombre.trim()) {
      setError("El nombre de la mascota es obligatorio.");
      return;
    }
    if (!campos.clienteId) {
      setError("Selecciona al dueño de la mascota.");
      return;
    }

    const datos = {
      clienteId: campos.clienteId,
      nombre: campos.nombre.trim(),
      especieId: campos.especieId,
      razaId: campos.razaId,
      sexo: campos.sexo,
      fechaNacimiento: campos.fechaNacimiento || undefined,
      color: campos.color.trim() || undefined,
    };

    setGuardando(true);
    try {
      if (mascota) {
        await actualizarMascota(mascota.id, datos);
      } else {
        await crearMascota(datos);
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
    <Sheet open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mascota ? "Editar Mascota" : "Registrar Mascota"}</SheetTitle>
          <SheetDescription>
            La mascota queda ligada a su dueño para el expediente clínico.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={guardar} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dueno">Dueño *</Label>
            <SelectNativo id="dueno" value={campos.clienteId}
              onChange={(e) => actualizarCampo("clienteId", e.target.value)}>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
              ))}
            </SelectNativo>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombreMascota">Nombre *</Label>
            <Input id="nombreMascota" value={campos.nombre}
              onChange={(e) => actualizarCampo("nombre", e.target.value)} placeholder="Lobo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="especie">Especie</Label>
              {/* Al cambiar especie se refiltran las razas */}
              <SelectNativo id="especie" value={campos.especieId}
                onChange={(e) => cambiarEspecie(e.target.value)}>
                {especies.map((esp) => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </SelectNativo>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="raza">Raza</Label>
              <SelectNativo id="raza" value={campos.razaId}
                onChange={(e) => actualizarCampo("razaId", e.target.value)}>
                {razasFiltradas.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </SelectNativo>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sexo">Sexo</Label>
              <SelectNativo id="sexo" value={campos.sexo}
                onChange={(e) => actualizarCampo("sexo", e.target.value as "macho" | "hembra")}>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </SelectNativo>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaNac">Fecha de nacimiento</Label>
              <Input id="fechaNac" type="date" value={campos.fechaNacimiento}
                onChange={(e) => actualizarCampo("fechaNacimiento", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color">Color / señas</Label>
            <Input id="color" value={campos.color}
              onChange={(e) => actualizarCampo("color", e.target.value)} placeholder="Opcional" />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {mascota ? "Guardar cambios" : "Registrar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
