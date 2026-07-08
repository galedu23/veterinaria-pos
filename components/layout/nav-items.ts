// ============================================================
// nav-items.ts — Definición ÚNICA del menú de navegación.
// El Sidebar (escritorio) y el menú hamburguesa (móvil) leen de aquí,
// así no se repite código. Cada ítem declara qué roles pueden verlo.
// ============================================================

import {
  LayoutDashboard, Users, PawPrint, Stethoscope, FileText, Syringe,
  Package, ShoppingCart, Receipt, UserCog, Tags, Dog, Settings, BarChart3, HeartPulse,
} from "lucide-react";
import type { Rol } from "@/types";

export interface ItemNavegacion {
  titulo: string;
  href: string;
  icono: React.ComponentType<{ className?: string }>;
  /** Roles que pueden ver este módulo en el menú */
  roles: Rol[];
}

const TODOS: Rol[] = ["administrador", "veterinario", "recepcion"];

/** Menú principal del sistema, en el orden en que se muestra */
export const ITEMS_NAVEGACION: ItemNavegacion[] = [
  { titulo: "Dashboard", href: "/", icono: LayoutDashboard, roles: TODOS },
  { titulo: "Clientes", href: "/clientes", icono: Users, roles: TODOS },
  { titulo: "Mascotas", href: "/mascotas", icono: PawPrint, roles: TODOS },
  { titulo: "Especies y Razas", href: "/razas", icono: Dog, roles: ["administrador", "veterinario"] },
  { titulo: "Consultas", href: "/consultas", icono: Stethoscope, roles: ["administrador", "veterinario"] },
  { titulo: "Recetas", href: "/recetas", icono: FileText, roles: ["administrador", "veterinario"] },
  { titulo: "Vacunas", href: "/vacunas", icono: Syringe, roles: ["administrador", "veterinario"] },
  { titulo: "Servicios", href: "/servicios", icono: HeartPulse, roles: ["administrador"] },
  { titulo: "Categorías", href: "/categorias", icono: Tags, roles: ["administrador"] },
  { titulo: "Productos", href: "/productos", icono: Package, roles: ["administrador", "recepcion"] },
  { titulo: "Compras", href: "/compras", icono: ShoppingCart, roles: ["administrador"] },
  { titulo: "Ventas (POS)", href: "/ventas", icono: Receipt, roles: ["administrador", "recepcion"] },
  { titulo: "Reportes", href: "/reportes", icono: BarChart3, roles: ["administrador"] },
  { titulo: "Usuarios", href: "/usuarios", icono: UserCog, roles: ["administrador"] },
  { titulo: "Configuración", href: "/configuracion", icono: Settings, roles: ["administrador"] },
];
