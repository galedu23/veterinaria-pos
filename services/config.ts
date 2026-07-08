// ============================================================
// services/config.ts — Configuración de la clínica (para el ticket).
//
// QUÉ: guarda y lee los datos que se imprimen en el ticket de venta
//   (nombre de la clínica, dirección, teléfono, mensaje final).
// POR QUÉ en localStorage y no en memoria: a diferencia del resto
//   del mock, la configuración debe SOBREVIVIR al F5 — sería muy
//   molesto recapturarla en cada prueba. localStorage es el
//   equivalente local perfecto mientras no hay base de datos.
// TODO Supabase: será una tabla `configuracion` con UNA sola fila:
//   getConfiguracionClinica -> from("configuracion").select("*").single()
//   guardarConfiguracionClinica -> .upsert({ id: 1, ...datos })
// ============================================================

import type { ConfiguracionClinica } from "@/types";

/** Clave bajo la que se guarda la configuración en localStorage */
const CLAVE_CONFIG = "vetgram_config_clinica";

/** Valores por defecto si el administrador aún no configura nada */
const CONFIG_POR_DEFECTO: ConfiguracionClinica = {
  nombre: "VetGram",
  direccion: "",
  telefono: "",
  mensajeDespedida: "¡Gracias por su compra!",
  logoUrl: "", // sin logo hasta que el admin lo suba
};

/**
 * getConfiguracionClinica: lee la configuración guardada, combinándola
 * con los valores por defecto (si falta un campo nuevo agregado después,
 * no rompe: toma el default). Es síncrona porque localStorage lo es,
 * pero se expone como async para que al migrar a Supabase la firma
 * no cambie y ningún componente se tenga que tocar.
 */
export async function getConfiguracionClinica(): Promise<ConfiguracionClinica> {
  if (typeof window === "undefined") return CONFIG_POR_DEFECTO; // en servidor no hay localStorage
  try {
    const crudo = localStorage.getItem(CLAVE_CONFIG);
    return crudo
      ? { ...CONFIG_POR_DEFECTO, ...(JSON.parse(crudo) as Partial<ConfiguracionClinica>) }
      : CONFIG_POR_DEFECTO;
  } catch {
    return CONFIG_POR_DEFECTO; // JSON corrupto -> empezamos de cero
  }
}

/**
 * guardarConfiguracionClinica: persiste los datos capturados por el
 * administrador. El ticket los leerá en la siguiente venta.
 */
export async function guardarConfiguracionClinica(config: ConfiguracionClinica): Promise<void> {
  localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
}
