"use client";

// ============================================================
// select-nativo.tsx — Select estilizado REUTILIZABLE.
//
// QUÉ: un <select> nativo del navegador con los estilos del Input
//   de shadcn/ui, para que se vea integrado con el resto del diseño.
// POR QUÉ: shadcn/ui tiene un Select propio basado en Radix, pero el
//   nativo funciona mejor en móviles (usa el picker del sistema) y no
//   agrega dependencias. Se centraliza aquí para no repetir las clases
//   CSS en cada formulario (productos, mascotas, ventas...).
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";

const SelectNativo = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
SelectNativo.displayName = "SelectNativo";

export { SelectNativo };
