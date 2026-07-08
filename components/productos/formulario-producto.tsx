"use client";

// ============================================================
// formulario-producto.tsx — Panel lateral de Crear/Editar producto.
//
// QUÉ: Sheet (drawer) con el formulario completo del producto.
//   Si recibe `producto = null` funciona en modo "crear"; si recibe
//   un producto, se precarga y funciona en modo "editar".
// POR QUÉ: el formulario es la parte que más cambia con el tiempo
//   (campos nuevos, validaciones); aislarlo evita tocar la página.
//   Los inputs numéricos se manejan como strings porque un <input>
//   siempre entrega texto; se convierten a número justo al guardar.
// CÓMO SE CONECTA A SUPABASE: llama a crearProducto/actualizarProducto
//   de services/db.ts. Cuando conectes Supabase solo cambia ese
//   servicio; este formulario no se toca.
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
import { ImageUploader } from "@/components/compartidos/image-uploader";
import { crearProducto, actualizarProducto } from "@/services/db";
import type { Producto, Categoria } from "@/types";

/** Los campos del formulario se guardan como strings (así los entrega el input) */
interface CamposFormulario {
  codigo: string;
  nombre: string;
  categoriaId: string;
  descripcion: string;
  precioCompra: string;
  precioVenta: string;
  stock: string;
  stockMinimo: string;
  fotoUrl: string; // dataURL WebP comprimido por el ImageUploader ("" = sin foto)
}

const FORMULARIO_VACIO: CamposFormulario = {
  codigo: "", nombre: "", categoriaId: "", descripcion: "",
  precioCompra: "", precioVenta: "", stock: "0", stockMinimo: "5", fotoUrl: "",
};

interface Props {
  abierto: boolean;
  /** null = modo crear; con producto = modo editar */
  producto: Producto | null;
  categorias: Categoria[];
  onCerrar: () => void;
  /** Aviso al padre para que recargue la tabla después de guardar */
  onGuardado: () => void;
}

export function FormularioProducto({ abierto, producto, categorias, onCerrar, onGuardado }: Props) {
  const [campos, setCampos] = React.useState<CamposFormulario>(FORMULARIO_VACIO);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Cada vez que se abre el panel, precargamos el producto a editar
  // o reiniciamos el formulario si es un producto nuevo.
  React.useEffect(() => {
    if (!abierto) return;
    setError("");
    if (producto) {
      setCampos({
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoriaId: producto.categoriaId,
        descripcion: producto.descripcion ?? "",
        precioCompra: String(producto.precioCompra),
        precioVenta: String(producto.precioVenta),
        stock: String(producto.stock),
        stockMinimo: String(producto.stockMinimo),
        fotoUrl: producto.fotoUrl ?? "",
      });
    } else {
      setCampos({ ...FORMULARIO_VACIO, categoriaId: categorias[0]?.id ?? "" });
    }
  }, [abierto, producto, categorias]);

  /** actualizarCampo: helper genérico para no escribir un onChange por campo */
  const actualizarCampo = (campo: keyof CamposFormulario, valor: string) =>
    setCampos((c) => ({ ...c, [campo]: valor }));

  /**
   * guardar: valida, convierte strings a números y llama al servicio.
   * Las validaciones viven aquí (frontend) para dar feedback inmediato,
   * pero en Supabase se repetirán como constraints (precio > 0, etc.)
   * porque el frontend nunca es la única barrera.
   */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const datos = {
      codigo: campos.codigo.trim(),
      nombre: campos.nombre.trim(),
      categoriaId: campos.categoriaId,
      descripcion: campos.descripcion.trim() || undefined,
      precioCompra: Number(campos.precioCompra),
      precioVenta: Number(campos.precioVenta),
      stock: Number(campos.stock),
      stockMinimo: Number(campos.stockMinimo),
      // La foto ya viene comprimida (WebP) del ImageUploader.
      // TODO Supabase Storage: aquí se subirá el blob y se guardará la URL pública.
      fotoUrl: campos.fotoUrl || undefined,
    };

    if (!datos.codigo || !datos.nombre) {
      setError("El código y el nombre son obligatorios.");
      return;
    }
    if (isNaN(datos.precioVenta) || datos.precioVenta <= 0) {
      setError("El precio de venta debe ser mayor a 0.");
      return;
    }

    setGuardando(true);
    try {
      // Un solo formulario para ambos modos: crear o actualizar
      if (producto) {
        await actualizarProducto(producto.id, datos);
      } else {
        await crearProducto(datos);
      }
      onGuardado(); // el padre recarga la tabla
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
          <SheetTitle>{producto ? "Editar Producto" : "Agregar Producto"}</SheetTitle>
          <SheetDescription>
            Los cambios se guardan sin salir de la pantalla de inventario.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={guardar} className="mt-4 space-y-4">
          {/* Foto del producto: se comprime a WebP en el navegador antes
              de guardarse (componente genérico reutilizable) */}
          <div className="space-y-1.5">
            <Label>Foto del producto</Label>
            <ImageUploader
              imagenActual={campos.fotoUrl}
              alt={campos.nombre || "Foto del producto"}
              onImagenLista={(foto) => actualizarCampo("fotoUrl", foto.dataUrl)}
              onQuitar={() => actualizarCampo("fotoUrl", "")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" value={campos.codigo}
                onChange={(e) => actualizarCampo("codigo", e.target.value)} placeholder="ALI-003" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <SelectNativo id="categoria" value={campos.categoriaId}
                onChange={(e) => actualizarCampo("categoriaId", e.target.value)}>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </SelectNativo>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" value={campos.nombre}
              onChange={(e) => actualizarCampo("nombre", e.target.value)}
              placeholder="Croquetas Cachorro 5kg" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" value={campos.descripcion}
              onChange={(e) => actualizarCampo("descripcion", e.target.value)} placeholder="Opcional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="precioCompra">Precio compra</Label>
              <Input id="precioCompra" type="number" min="0" step="0.01" value={campos.precioCompra}
                onChange={(e) => actualizarCampo("precioCompra", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precioVenta">Precio venta *</Label>
              <Input id="precioVenta" type="number" min="0" step="0.01" value={campos.precioVenta}
                onChange={(e) => actualizarCampo("precioVenta", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock actual</Label>
              <Input id="stock" type="number" min="0" value={campos.stock}
                onChange={(e) => actualizarCampo("stock", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stockMinimo">Stock mínimo (alerta)</Label>
              <Input id="stockMinimo" type="number" min="0" value={campos.stockMinimo}
                onChange={(e) => actualizarCampo("stockMinimo", e.target.value)} />
            </div>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {producto ? "Guardar cambios" : "Agregar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
