"use client";

// ============================================================
// app/portal/[token]/page.tsx — PORTAL PÚBLICO DEL CLIENTE.
//
// QUÉ: la página que ve el dueño al abrir el enlace que le mandó la
//   clínica por WhatsApp. Muestra sus pendientes (vacunas y citas) y
//   la ficha de cada una de sus mascotas.
//
// POR QUÉ VIVE FUERA DE (dashboard): esa carpeta exige sesión iniciada
//   y pinta el menú de administración. El portal es público y se abre
//   sin cuenta: solo el token del enlace da acceso.
//
// SEGURIDAD (importante al conectar Supabase):
//   - El token es la llave. Quien tenga el enlace ve estos datos, así
//     que se comparte solo con el dueño y puede regenerarse.
//   - Es de SOLO LECTURA: desde aquí no se modifica nada.
//   - Con Supabase, esta página debe leer por una función RPC con
//     SECURITY DEFINER que reciba el token y devuelva únicamente los
//     datos de ese cliente — nunca consultando las tablas directo.
// ============================================================

import * as React from "react";
import { useParams } from "next/navigation";
import { PawPrint, Loader2, TriangleAlert, Phone, MapPin } from "lucide-react";
import { RecordatoriosPortal } from "@/components/portal/recordatorios-portal";
import { TarjetaMascotaPortal } from "@/components/portal/tarjeta-mascota-portal";
import { getPortalPorToken } from "@/services/db";
import { getConfiguracionClinica } from "@/services/config";
import type { DatosPortal, ConfiguracionClinica } from "@/types";

export default function PaginaPortal() {
  // El token viene de la URL: /portal/a7k2p9x...
  const params = useParams<{ token: string }>();

  const [datos, setDatos] = React.useState<DatosPortal | null>(null);
  const [config, setConfig] = React.useState<ConfiguracionClinica | null>(null);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [portal, cfg] = await Promise.all([
        getPortalPorToken(params.token),
        getConfiguracionClinica(),
      ]);
      setDatos(portal);
      setConfig(cfg);
      setCargando(false);
    })();
  }, [params.token]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    );
  }

  // Token inválido o revocado: mensaje amable, sin detalles técnicos
  if (!datos) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
        <TriangleAlert className="h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-bold">Este enlace ya no es válido</h1>
        <p className="max-w-sm text-slate-600">
          Es posible que haya cambiado. Comunícate con la clínica para que te
          compartan tu enlace actualizado.
        </p>
        {config?.telefono && (
          <a href={`tel:${config.telefono}`}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">
            Llamar a la clínica
          </a>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      {/* ---------- Encabezado con la marca de la clínica ---------- */}
      <header className="bg-slate-800 px-4 py-5 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {config?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo WebP local
            <img src={config.logoUrl} alt="" className="h-11 w-11 rounded-lg bg-white object-contain p-1" />
          ) : (
            <PawPrint className="h-9 w-9 text-blue-300" />
          )}
          <div>
            <p className="font-bold leading-tight">{config?.nombre || "Clínica Veterinaria"}</p>
            <p className="text-xs text-slate-300">Portal de clientes</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {/* Saludo personalizado: que sienta que es SU página */}
        <div>
          <h1 className="text-2xl font-bold">
            Hola, {datos.cliente.nombre} 👋
          </h1>
          <p className="text-slate-600">
            Aquí está la información de {datos.mascotas.length === 1
              ? "tu mascota"
              : `tus ${datos.mascotas.length} mascotas`}.
          </p>
        </div>

        {/* Lo más importante primero: qué tiene pendiente */}
        <RecordatoriosPortal recordatorios={datos.recordatorios} />

        {/* Una tarjeta por mascota */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">
            {datos.mascotas.length === 1 ? "Mi mascota" : "Mis mascotas"}
          </h2>
          {datos.mascotas.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
              Todavía no tienes mascotas registradas.
            </p>
          ) : (
            datos.mascotas.map((m) => <TarjetaMascotaPortal key={m.id} mascota={m} />)
          )}
        </div>

        {/* ---------- Pie: cómo contactar a la clínica ---------- */}
        <footer className="rounded-xl border bg-white p-4 text-sm">
          <p className="mb-2 font-semibold">¿Necesitas agendar o tienes dudas?</p>
          {config?.telefono && (
            <a href={`tel:${config.telefono}`}
              className="mb-1 flex items-center gap-2 text-blue-700">
              <Phone className="h-4 w-4" /> {config.telefono}
            </a>
          )}
          {config?.direccion && (
            <p className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4" /> {config.direccion}
            </p>
          )}
          <p className="mt-3 border-t pt-2 text-xs text-slate-400">
            Esta página es solo informativa. Ante cualquier urgencia, comunícate
            directamente con la clínica.
          </p>
        </footer>
      </div>
    </main>
  );
}
