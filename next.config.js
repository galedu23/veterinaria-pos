/** @type {import('next').NextConfig} */

// Configuración principal de Next.js para la PWA veterinaria.
// TODO: Cuando se conecte Supabase, agregar aquí las variables de entorno
//       (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) vía .env.local
// TODO: Para soporte offline completo, instalar y envolver con "@serwist/next"
//       o "next-pwa" (service worker). El manifest.json ya está listo en /public.
const nextConfig = {
  reactStrictMode: true,

  // Cabeceras HTTP para que el navegador trate correctamente el manifest de la PWA
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
