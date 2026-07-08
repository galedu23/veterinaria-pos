// ============================================================
// app/layout.tsx — Layout RAÍZ de toda la aplicación.
// Define metadatos, el manifest de la PWA y envuelve todo con el
// AuthProvider para que cualquier vista conozca la sesión actual.
// El Sidebar y el Header viven en app/(dashboard)/layout.tsx,
// así la pantalla de login queda limpia (sin menús).
// ============================================================

import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/hooks/use-auth";
import "./globals.css";

// Metadatos globales + registro del manifest para la PWA
export const metadata: Metadata = {
  title: "VetGram | Sistema de Control Veterinario",
  description: "Sistema de control veterinario y punto de venta",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "VetGram",
    statusBarStyle: "default",
  },
};

// Color de la barra del navegador en móviles (coincide con el sidebar)
export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
};

/** RootLayout: estructura HTML base y proveedor de autenticación */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
