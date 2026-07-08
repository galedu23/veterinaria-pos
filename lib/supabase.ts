// ============================================================
// lib/supabase.ts — Cliente ÚNICO de conexión a Supabase.
//
// QUÉ: crea (una sola vez) el cliente del SDK con las llaves del
//   archivo .env.local y lo comparte con toda la app.
// POR QUÉ singleton: crear un cliente nuevo en cada llamada abriría
//   conexiones y estados de sesión duplicados; el patrón estándar
//   es un módulo que lo instancia una vez y lo exporta.
// CÓMO SE USA (en services/db.ts y services/auth.ts):
//   import { getSupabase, supabaseConfigurado } from "@/lib/supabase";
//   const { data, error } = await getSupabase().from("clientes").select("*");
//
// MIENTRAS NO EXISTA .env.local la app sigue funcionando con los
// servicios mock: supabaseConfigurado() devuelve false y los
// servicios no deben intentar llamar a getSupabase().
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Instancia compartida (se crea en la primera llamada a getSupabase)
let cliente: SupabaseClient | null = null;

/**
 * supabaseConfigurado: true si las variables de entorno existen.
 * Los servicios la usan para decidir entre datos mock y datos reales,
 * así la migración puede hacerse módulo por módulo sin romper nada.
 */
export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * getSupabase: devuelve el cliente compartido, creándolo si es la
 * primera vez. Lanza un error claro si faltan las llaves para que
 * el problema se detecte de inmediato y no como un fallo silencioso.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseConfigurado()) {
    throw new Error(
      "Supabase no está configurado: crea el archivo .env.local a partir de " +
      ".env.local.example y agrega la URL y la anon key de tu proyecto."
    );
  }
  if (!cliente) {
    cliente = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return cliente;
}
