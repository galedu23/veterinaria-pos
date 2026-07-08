// ============================================================
// services/auth.ts — Servicio de autenticación MOCKEADO.
//
// Credenciales de prueba (quemadas en el código):
//   Administrador: admin@vet.com     / admin123
//   Veterinario:   vet@vet.com       / vet123
//   Recepción:     recepcion@vet.com / rec123
//
// TODO: Conectar con Supabase Auth. Al hacerlo:
//   1. Reemplazar `login()` por supabase.auth.signInWithPassword()
//   2. Reemplazar `logout()` por supabase.auth.signOut()
//   3. Reemplazar `getSession()` por supabase.auth.getSession()
//   4. El rol se leerá de una tabla `perfiles` ligada al usuario.
// La firma de las funciones (async/Promise) ya está lista para el cambio.
// ============================================================

import type { Usuario, Rol } from "@/types";

/** Clave usada en localStorage para simular la sesión persistente */
const CLAVE_SESION = "vetgram_sesion";

/** Usuarios de prueba con contraseñas quemadas (solo para desarrollo local) */
const USUARIOS_MOCK: Array<Usuario & { password: string }> = [
  {
    id: "u-1",
    nombre: "Admin General",
    email: "admin@vet.com",
    password: "admin123",
    rol: "administrador",
  },
  {
    id: "u-2",
    nombre: "Dra. Laura Méndez",
    email: "vet@vet.com",
    password: "vet123",
    rol: "veterinario",
  },
  {
    id: "u-3",
    nombre: "Carlos Recepción",
    email: "recepcion@vet.com",
    password: "rec123",
    rol: "recepcion",
  },
];

/**
 * login: valida credenciales contra los usuarios mock y guarda la sesión
 * en localStorage. Devuelve el usuario si es correcto o lanza un error.
 */
export async function login(email: string, password: string): Promise<Usuario> {
  // Simulamos la latencia de red de un backend real
  await new Promise((r) => setTimeout(r, 400));

  const encontrado = USUARIOS_MOCK.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );

  if (!encontrado) {
    throw new Error("Correo o contraseña incorrectos");
  }

  // Nunca guardamos la contraseña en la sesión
  const { password: _omitida, ...usuario } = encontrado;
  localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
  return usuario;
}

/**
 * logout: cierra la sesión eliminando el registro de localStorage.
 */
export async function logout(): Promise<void> {
  localStorage.removeItem(CLAVE_SESION);
}

/**
 * getSession: recupera el usuario en sesión (o null si no hay sesión).
 * Solo funciona en el cliente; en el servidor devuelve null.
 */
export function getSession(): Usuario | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    return crudo ? (JSON.parse(crudo) as Usuario) : null;
  } catch {
    return null;
  }
}

/**
 * getUsuarios: lista de empleados del sistema SIN contraseñas (vista /usuarios).
 * TODO Supabase: leerá la tabla `perfiles` (nombre, rol) unida a auth.users;
 * crear/editar usuarios se hará con supabase.auth.admin desde un endpoint seguro.
 */
export async function getUsuarios(): Promise<Usuario[]> {
  await new Promise((r) => setTimeout(r, 150));
  // Quitamos la contraseña de cada usuario antes de exponerlos a la UI
  return USUARIOS_MOCK.map(({ password: _omitida, ...usuario }) => usuario);
}

/**
 * tienePermiso: valida si el rol del usuario está dentro de los roles permitidos.
 * Se usa para mostrar/ocultar módulos del sidebar y botones de acción.
 */
export function tienePermiso(usuario: Usuario | null, rolesPermitidos: Rol[]): boolean {
  if (!usuario) return false;
  return rolesPermitidos.includes(usuario.rol);
}
