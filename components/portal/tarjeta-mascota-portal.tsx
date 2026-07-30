"use client";

// ============================================================
// tarjeta-mascota-portal.tsx — Ficha de una mascota para su DUEÑO.
//
// QUÉ: tarjeta con la foto y los datos de la mascota, y tres secciones
//   que se abren y cierran (acordeón): Vacunas, Visitas y Medicamentos.
// POR QUÉ acordeón y no todo desplegado: un dueño con 3 mascotas y
//   años de historial vería un muro de texto. Cerrado por defecto se
//   ve limpio; quien quiera detalles, toca y se abre.
// LENGUAJE: "Visitas" en vez de "consultas", "Le recetaron" en vez de
//   "prescripción" — el portal lo lee alguien sin formación médica.
// ============================================================

import * as React from "react";
import {
  PawPrint, ChevronDown, Syringe, Stethoscope, Pill, CalendarCheck,
} from "lucide-react";
import { formatoFecha, diasHasta } from "@/lib/utils";
import type { MascotaPortal } from "@/types";

/** Una sección plegable dentro de la tarjeta */
function Seccion({
  titulo, icono, cantidad, children,
}: {
  titulo: string;
  icono: React.ReactNode;
  cantidad: number;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = React.useState(false);

  return (
    <div className="border-t">
      <button
        onClick={() => setAbierta(!abierta)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        {icono}
        <span className="flex-1 text-sm font-medium">{titulo}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {cantidad}
        </span>
        {/* La flecha gira 180° al abrir: pista visual de que hay más */}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${abierta ? "rotate-180" : ""}`}
        />
      </button>
      {abierta && <div className="space-y-2 px-4 pb-4">{children}</div>}
    </div>
  );
}

interface Props {
  mascota: MascotaPortal;
}

export function TarjetaMascotaPortal({ mascota }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* ---------- Encabezado: foto y datos básicos ---------- */}
      <div className="flex items-center gap-3 p-4">
        {mascota.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dataURL local
          <img src={mascota.fotoUrl} alt={mascota.nombre}
            className="h-16 w-16 rounded-full border-2 border-blue-100 object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <PawPrint className="h-7 w-7 text-blue-600" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{mascota.nombre}</h3>
          <p className="text-sm text-slate-600">
            {mascota.especie} · {mascota.raza} · {mascota.sexo}
            {mascota.edad && ` · ${mascota.edad}`}
          </p>
        </div>
      </div>

      {/* Próxima cita destacada (si la tiene agendada) */}
      {mascota.proximaConsulta && diasHasta(mascota.proximaConsulta) >= 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <CalendarCheck className="h-4 w-4 shrink-0" />
          <span>Próxima cita: <strong>{formatoFecha(mascota.proximaConsulta)}</strong></span>
        </div>
      )}

      {/* ---------- Vacunas ---------- */}
      <Seccion
        titulo="Vacunas aplicadas"
        icono={<Syringe className="h-4 w-4 text-purple-600" />}
        cantidad={mascota.vacunas.length}
      >
        {mascota.vacunas.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay vacunas registradas.</p>
        ) : (
          mascota.vacunas.map((v, i) => (
            <div key={i} className="rounded-lg bg-slate-50 p-2 text-sm">
              <p className="font-medium">{v.nombre}</p>
              <p className="text-xs text-slate-600">
                Aplicada el {formatoFecha(v.fechaAplicacion)}
                {v.proximaDosis && ` · Refuerzo: ${formatoFecha(v.proximaDosis)}`}
              </p>
            </div>
          ))
        )}
      </Seccion>

      {/* ---------- Visitas (consultas) ---------- */}
      <Seccion
        titulo="Visitas a la clínica"
        icono={<Stethoscope className="h-4 w-4 text-green-600" />}
        cantidad={mascota.visitas.length}
      >
        {mascota.visitas.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay visitas registradas.</p>
        ) : (
          mascota.visitas.map((v, i) => (
            <div key={i} className="rounded-lg bg-slate-50 p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{formatoFecha(v.fecha)}</span>
                <span className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-600">
                  {v.servicio}
                </span>
                {v.pesoKg !== undefined && (
                  <span className="text-xs text-slate-600">Peso: {v.pesoKg} kg</span>
                )}
              </div>
              <p className="mt-1 text-slate-700">{v.diagnostico}</p>
              {v.tratamiento && (
                <p className="text-xs text-slate-600">Tratamiento: {v.tratamiento}</p>
              )}
            </div>
          ))
        )}
      </Seccion>

      {/* ---------- Medicamentos recetados ---------- */}
      <Seccion
        titulo="Medicamentos recetados"
        icono={<Pill className="h-4 w-4 text-blue-600" />}
        cantidad={mascota.medicamentos.length}
      >
        {mascota.medicamentos.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay medicamentos recetados.</p>
        ) : (
          mascota.medicamentos.map((m, i) => (
            <div key={i} className="rounded-lg bg-slate-50 p-2 text-sm">
              <p className="font-medium">{m.nombre}</p>
              <p className="text-xs text-slate-600">{m.indicaciones}</p>
              <p className="text-xs text-slate-500">Recetado el {formatoFecha(m.fecha)}</p>
            </div>
          ))
        )}
      </Seccion>
    </div>
  );
}
