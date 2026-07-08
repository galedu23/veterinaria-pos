"use client";

// ============================================================
// app/(dashboard)/clientes/[id]/page.tsx — PERFIL de un cliente.
//
// QUÉ: muestra los datos de contacto del dueño y la lista de sus
//   mascotas con enlace directo al expediente de cada una.
//   Es la página a la que llega el Buscador Rápido Global.
// POR QUÉ es una ruta dinámica ([id]): cada cliente tiene URL propia,
//   así se puede compartir/guardar el enlace de un cliente.
// CÓMO SE CONECTA A SUPABASE: getClientePorId + getMascotasDeCliente;
//   en Supabase será un solo select con join a mascotas.
// ============================================================

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, PawPrint, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatoFecha } from "@/lib/utils";
import {
  getClientePorId, getMascotasDeCliente, getEspecies, getRazas,
} from "@/services/db";
import type { Cliente, Mascota, Especie, Raza } from "@/types";

export default function PaginaPerfilCliente() {
  // useParams lee el [id] de la URL (/clientes/c-1 -> id = "c-1")
  const params = useParams<{ id: string }>();

  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [mascotas, setMascotas] = React.useState<Mascota[]>([]);
  const [especies, setEspecies] = React.useState<Especie[]>([]);
  const [razas, setRazas] = React.useState<Raza[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // Cargamos el cliente, sus mascotas y los catálogos en paralelo
  React.useEffect(() => {
    (async () => {
      setCargando(true);
      const [cli, masc, esp, raz] = await Promise.all([
        getClientePorId(params.id),
        getMascotasDeCliente(params.id),
        getEspecies(),
        getRazas(),
      ]);
      setCliente(cli ?? null);
      setMascotas(masc);
      setEspecies(esp);
      setRazas(raz);
      setCargando(false);
    })();
  }, [params.id]);

  /** Helpers para traducir ids de catálogo a nombres visibles */
  const nombreEspecie = (id: string) => especies.find((e) => e.id === id)?.nombre ?? "—";
  const nombreRaza = (id: string) => razas.find((r) => r.id === id)?.nombre ?? "—";

  if (cargando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Si el id de la URL no existe, mostramos un aviso amigable
  if (!cliente) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Cliente no encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/clientes"><ArrowLeft /> Volver a clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navegación de regreso al listado */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/clientes"><ArrowLeft /> Clientes</Link>
      </Button>

      {/* Datos de contacto del dueño */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{cliente.nombre} {cliente.apellidos}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" /> {cliente.telefono}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> {cliente.email ?? "Sin email"}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" /> {cliente.direccion ?? "Sin dirección"}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Cliente desde {formatoFecha(cliente.creadoEn)}
          </p>
        </CardContent>
      </Card>

      {/* Mascotas del cliente con enlace a su expediente */}
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <PawPrint className="h-5 w-5 text-blue-600" /> Sus mascotas ({mascotas.length})
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mascotas.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            Este cliente aún no tiene mascotas registradas.
          </p>
        )}
        {mascotas.map((m) => (
          // Cada tarjeta lleva al expediente clínico de la mascota
          <Link
            key={m.id}
            href={`/mascotas/${m.id}`}
            className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-blue-400"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{m.nombre}</p>
              <Badge variant="secondary">{nombreEspecie(m.especieId)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {nombreRaza(m.razaId)} · {m.sexo === "macho" ? "Macho" : "Hembra"}
            </p>
            <p className="mt-2 text-xs font-medium text-blue-700">Ver expediente →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
