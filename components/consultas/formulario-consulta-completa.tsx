"use client";

// ============================================================
// formulario-consulta-completa.tsx — ALTA DE CONSULTA CLÍNICA.
//
// QUÉ: el formulario clínico extenso en un Dialog CENTRADO y amplio
//   (max-w-4xl) con scroll interno, dividido en 4 secciones:
//   1. Datos generales  2. Signos vitales
//   3. Revisión por sistemas  4. Diagnóstico y plan
// POR QUÉ Dialog centrado y ya no Drawer lateral: con ~25 campos el
//   drawer quedaba angosto y kilométrico; centrado aprovecha todo el
//   ancho en PC (hasta 4 columnas) y en móvil colapsa a 1 columna
//   (mobile-first: grid-cols-1 como base, sm:/lg: solo agregan columnas).
// TIPO DE SERVICIO: el select se alimenta del CATÁLOGO /servicios
//   (getServicios) — ya no es una lista fija en el código.
// FLUJO CONSULTA -> RECETA: al guardar, onGuardado recibe la consulta
//   RECIÉN CREADA para que el expediente abra automáticamente el
//   modal de "Nueva Receta" ligado a su id (vinculación estricta).
// CÓMO SE GUARDA EN SUPABASE: insert en `consultas`; la exploración
//   va en la columna jsonb `exploracion`.
// ============================================================

import * as React from "react";
import { Stethoscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { SelectNativo } from "@/components/compartidos/select-nativo";
import { useAuth } from "@/hooks/use-auth";
import { crearConsulta, getServicios } from "@/services/db";
import type { Consulta, ExploracionFisica, Servicio } from "@/types";

/** Campos de la revisión por sistemas: catálogo -> el grid se genera
 *  solo y agregar un sistema nuevo es agregar UNA línea aquí. */
const CAMPOS_SISTEMAS: Array<{ clave: keyof ExploracionFisica; etiqueta: string }> = [
  { clave: "cabeza", etiqueta: "Cabeza" },
  { clave: "pielPelaje", etiqueta: "Piel y pelaje" },
  { clave: "ganglios", etiqueta: "Ganglio linfático" },
  { clave: "sistemaRespiratorio", etiqueta: "Sistema respiratorio" },
  { clave: "sistemaEndocrino", etiqueta: "Sistema endócrino" },
  { clave: "sistemaMusculoEsqueletico", etiqueta: "Sistema músculo esquelético" },
  { clave: "sistemaNervioso", etiqueta: "Sistema nervioso" },
  { clave: "sistemaReproductivo", etiqueta: "Sistema reproductivo" },
  { clave: "palpacion", etiqueta: "Palpación rectal y vaginal" },
  { clave: "otros", etiqueta: "Otros" },
];

/** Signos vitales complementarios (los que viven en `exploracion`) */
const CAMPOS_VITALES: Array<{ clave: keyof ExploracionFisica; etiqueta: string; placeholder: string }> = [
  { clave: "fc", etiqueta: "FC (frec. cardíaca)", placeholder: "120 lpm" },
  { clave: "fr", etiqueta: "FR (frec. respiratoria)", placeholder: "24 rpm" },
  { clave: "pulsoFemoral", etiqueta: "Pulso femoral", placeholder: "Fuerte y simétrico" },
  { clave: "deshidratacionPct", etiqueta: "% Deshidratación", placeholder: "5%" },
  { clave: "mucosas", etiqueta: "Mucosas", placeholder: "Rosadas y húmedas" },
  { clave: "tllc", etiqueta: "THC (llenado capilar)", placeholder: "<2 s" },
];

interface Props {
  abierto: boolean;
  mascotaId: string;
  onCerrar: () => void;
  /** Recibe la consulta CREADA: el expediente encadena la receta con su id */
  onGuardado: (consultaCreada: Consulta) => void;
}

export function FormularioConsultaCompleta({ abierto, mascotaId, onCerrar, onGuardado }: Props) {
  const { usuario } = useAuth();

  // Catálogo de servicios (viene del módulo /servicios)
  const [servicios, setServicios] = React.useState<Servicio[]>([]);

  // ---- Datos generales y clínicos principales ----
  const [tipoServicio, setTipoServicio] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [proximaConsulta, setProximaConsulta] = React.useState("");
  const [peso, setPeso] = React.useState("");
  const [temperatura, setTemperatura] = React.useState("");
  const [condicionCorporal, setCondicionCorporal] = React.useState(""); // "" = sin capturar
  const [diagnostico, setDiagnostico] = React.useState("");
  const [tratamiento, setTratamiento] = React.useState("");
  const [progreso, setProgreso] = React.useState("");
  const [notas, setNotas] = React.useState("");
  // ---- Exploración física: un solo objeto para los 16 campos ----
  const [exploracion, setExploracion] = React.useState<ExploracionFisica>({});

  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  // Al abrir: formulario limpio + catálogo de servicios fresco
  // (por si el admin agregó un servicio hace un momento)
  React.useEffect(() => {
    if (!abierto) return;
    setMotivo(""); setProximaConsulta(""); setPeso(""); setTemperatura("");
    setCondicionCorporal(""); setDiagnostico(""); setTratamiento("");
    setProgreso(""); setNotas(""); setExploracion({}); setError("");
    getServicios().then((lista) => {
      setServicios(lista);
      setTipoServicio(lista[0]?.nombre ?? "");
    });
  }, [abierto]);

  /** editarExploracion: actualiza UN campo del objeto de exploración */
  const editarExploracion = (clave: keyof ExploracionFisica, valor: string) =>
    setExploracion((e) => ({ ...e, [clave]: valor }));

  /**
   * limpiarExploracion: quita los campos vacíos antes de guardar.
   * POR QUÉ: guardar { cabeza: "", ganglios: "" } ensucia el jsonb;
   * solo persiste lo que el veterinario realmente capturó.
   */
  const limpiarExploracion = (): ExploracionFisica | undefined => {
    const limpio = Object.fromEntries(
      Object.entries(exploracion).filter(([, v]) => v && v.trim() !== "")
    ) as ExploracionFisica;
    return Object.keys(limpio).length > 0 ? limpio : undefined;
  };

  /**
   * guardar: valida lo mínimo, registra la consulta y ENTREGA la
   * consulta creada al padre — así el expediente puede abrir de
   * inmediato el modal de receta ligado a este id (consulta_id).
   */
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!motivo.trim() || !diagnostico.trim()) {
      setError("El motivo y el diagnóstico (DX) son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      const consultaCreada = await crearConsulta({
        mascotaId,
        veterinarioId: usuario?.id ?? "",
        fecha: new Date().toISOString().slice(0, 10),
        motivo: motivo.trim(),
        diagnostico: diagnostico.trim(),
        tratamiento: tratamiento.trim() || undefined,
        pesoKg: peso ? Number(peso) : undefined,
        temperaturaC: temperatura ? Number(temperatura) : undefined,
        notas: notas.trim() || undefined,
        tipoServicio: tipoServicio || undefined,
        condicionCorporal: condicionCorporal ? Number(condicionCorporal) : undefined,
        proximaConsulta: proximaConsulta || undefined,
        progreso: progreso.trim() || undefined,
        exploracion: limpiarExploracion(),
      });
      onCerrar();
      onGuardado(consultaCreada); // el expediente encadena la receta
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  /** SeccionTitulo: separador visual de cada bloque del formulario */
  const SeccionTitulo = ({ texto }: { texto: string }) => (
    <p className="border-b pb-1 text-sm font-semibold text-blue-800">{texto}</p>
  );

  return (
    <Dialog open={abierto} onOpenChange={(estaAbierto) => !estaAbierto && onCerrar()}>
      {/* Modal CENTRADO y amplio: max-w-4xl en PC, pantalla casi completa
          en móvil, con scroll interno limpio (max-h + overflow) */}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" /> Alta de Consulta Clínica
          </DialogTitle>
          <DialogDescription>
            Atiende: {usuario?.nombre} · {new Date().toLocaleDateString("es-MX")} ·
            Solo motivo y DX son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-5">
          {/* ================= 1. DATOS GENERALES ================= */}
          <div className="space-y-3">
            <SeccionTitulo texto="1. Datos generales" />
            {/* Mobile-first: 1 columna en teléfono, 3 desde sm */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="tipoServicio">Tipo de servicio</Label>
                {/* Alimentado por el catálogo /servicios (ya no lista fija) */}
                <SelectNativo id="tipoServicio" value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </SelectNativo>
              </div>
              <div className="space-y-1">
                <Label htmlFor="proximaConsulta">Próxima consulta</Label>
                <Input id="proximaConsulta" type="date" value={proximaConsulta}
                  onChange={(e) => setProximaConsulta(e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label htmlFor="cc">Condición corporal (1-9)</Label>
                <SelectNativo id="cc" value={condicionCorporal}
                  onChange={(e) => setCondicionCorporal(e.target.value)}>
                  <option value="">Sin capturar</option>
                  {/* 1=emaciado · 5=ideal · 9=obeso */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "(emaciado)" : n === 5 ? "(ideal)" : n === 9 ? "(obeso)" : ""}
                    </option>
                  ))}
                </SelectNativo>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="motivo">Motivo de la visita *</Label>
              <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Vómito y decaimiento" />
            </div>
          </div>

          {/* ================= 2. SIGNOS VITALES ================= */}
          <div className="space-y-3">
            <SeccionTitulo texto="2. Signos vitales" />
            {/* Mobile-first: 1 col en teléfono -> 2 en sm -> 4 en lg */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input id="peso" type="number" min="0" step="0.1" value={peso}
                  onChange={(e) => setPeso(e.target.value)} placeholder="32.5" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="temperatura">Temp. (°C)</Label>
                <Input id="temperatura" type="number" min="30" max="45" step="0.1"
                  value={temperatura} onChange={(e) => setTemperatura(e.target.value)}
                  placeholder="38.5" />
              </div>
              {/* Los 6 vitales del catálogo se generan en el mismo grid */}
              {CAMPOS_VITALES.map(({ clave, etiqueta, placeholder }) => (
                <div key={clave} className="space-y-1">
                  <Label htmlFor={clave}>{etiqueta}</Label>
                  <Input id={clave} value={exploracion[clave] ?? ""}
                    onChange={(e) => editarExploracion(clave, e.target.value)}
                    placeholder={placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* ============ 3. REVISIÓN POR SISTEMAS ============ */}
          <div className="space-y-3">
            <SeccionTitulo texto="3. Revisión por sistemas" />
            {/* Mobile-first: 1 col -> 2 en sm -> 3 en lg (10 campos) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS_SISTEMAS.map(({ clave, etiqueta }) => (
                <div key={clave} className="space-y-1">
                  <Label htmlFor={clave}>{etiqueta}</Label>
                  <Input id={clave} value={exploracion[clave] ?? ""}
                    onChange={(e) => editarExploracion(clave, e.target.value)}
                    placeholder="Sin alteraciones" />
                </div>
              ))}
            </div>
          </div>

          {/* ============ 4. DIAGNÓSTICO Y PLAN ============ */}
          <div className="space-y-3">
            <SeccionTitulo texto="4. Diagnóstico y plan" />
            <div className="space-y-1">
              <Label htmlFor="dx">DX presuntivo *</Label>
              <textarea id="dx" rows={2} value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Diagnóstico presuntivo"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="tx">TX (tratamiento)</Label>
                <Input id="tx" value={tratamiento} onChange={(e) => setTratamiento(e.target.value)}
                  placeholder="Reposo y antiinflamatorio" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="progreso">Progreso / evolución</Label>
                <Input id="progreso" value={progreso} onChange={(e) => setProgreso(e.target.value)}
                  placeholder="Primera visita por este cuadro" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notas">Notas</Label>
              <textarea id="notas" rows={2} value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones adicionales..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar y continuar a receta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
