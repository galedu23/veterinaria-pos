# Guía de conexión a Supabase (VetGram)

Esta guía explica cómo pasar del modo **mock** (datos de prueba en memoria)
al modo **real** con Supabase. Los pasos 1 a 4 los haces tú una sola vez;
el paso 5 es la migración del código, módulo por módulo.

---

## Paso 1 — Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta (gratis).
2. **New project** → nombre `vetgram` → elige una contraseña de base de datos
   (guárdala) → región más cercana → **Create**.

## Paso 2 — Crear las tablas

1. En el menú izquierdo abre **SQL Editor**.
2. Copia TODO el contenido de [`schema.sql`](./schema.sql) y pégalo.
3. Presiona **Run**. Esto crea las 12 tablas, la vista del buscador,
   las funciones de venta/compra, la seguridad (RLS) y los catálogos
   iniciales (especies, razas, categorías).

## Paso 3 — Crear los usuarios del sistema

En **Authentication → Users → Add user** crea los empleados reales
(email + contraseña). El trigger del esquema crea su perfil automáticamente
con rol `recepcion`; para cambiar el rol ve a **Table Editor → perfiles**
y edita la columna `rol` (`administrador`, `veterinario` o `recepcion`).

## Paso 4 — Conectar la app

1. En Supabase: **Settings → API** → copia `Project URL` y `anon public key`.
2. En el proyecto: copia `.env.local.example` como `.env.local` y pega ambos valores.
3. Reinicia el servidor (`npm run dev`). `lib/supabase.ts` detecta las llaves.

## Paso 5 — Migrar los servicios (el trabajo de código)

Los ÚNICOS archivos que cambian son `services/auth.ts` y `services/db.ts`
(los componentes y páginas no se tocan: esa fue la razón de la arquitectura).
Cada función mock se reemplaza por su consulta real:

### services/auth.ts
| Función mock | Reemplazo en Supabase |
|---|---|
| `login(email, password)` | `supabase.auth.signInWithPassword({ email, password })` + leer perfil: `from("perfiles").select("*").eq("id", user.id).single()` |
| `logout()` | `supabase.auth.signOut()` |
| `getSession()` | `supabase.auth.getSession()` (y `onAuthStateChange` en `hooks/use-auth.tsx`) |
| `getUsuarios()` | `from("perfiles").select("*")` |

### services/db.ts — lecturas
| Función mock | Reemplazo en Supabase |
|---|---|
| `getClientes()` | `from("clientes").select("*").order("nombre")` |
| `getMascotas()` / `getMascotaPorId(id)` | `from("mascotas").select("*")` / `.eq("id", id).single()` |
| `buscarMascotasAvanzado(texto)` | vista `mascotas_detalle`: `.or()` con `ilike` sobre nombre, nombre_dueno, nombre_raza (la vista ya trae los joins hechos) |
| `busquedaGlobal(texto)` | dos consultas `ilike` en paralelo: `clientes` + vista `mascotas_detalle` |
| `getConsultasDeMascota(id)` | `from("consultas").select("*").eq("mascota_id", id).order("fecha", { ascending: false })` |
| `getConsultasGlobal()` | `from("consultas").select("*, mascotas(nombre)")` |
| `getRecetasGlobal()` | `from("recetas").select("*, mascotas(nombre, clientes(nombre, apellidos))")` |
| `getVacunasProximas(dias)` | `from("vacunas").select("*, mascotas(nombre)").lte("proxima_dosis", fechaLimite)` |
| `getDashboardStats()` | varios `select("*", { count: "exact", head: true })` en paralelo |

### services/db.ts — escrituras
| Función mock | Reemplazo en Supabase |
|---|---|
| `crearCliente/Mascota/Consulta/Receta/Vacuna/Producto...` | `from(tabla).insert(datos).select().single()` |
| `actualizarX(id, datos)` | `from(tabla).update(datos).eq("id", id).select().single()` |
| `eliminarCliente(id)` | `from("clientes").delete().eq("id", id)` — la FK RESTRICT devuelve error si tiene mascotas (la regla ya vive en la BD) |
| `eliminarProducto(id)` | `from("productos").update({ activo: false })` — soft delete para no romper historiales |
| `registrarVenta(venta)` | `supabase.rpc("registrar_venta", { p_cliente_id, p_usuario_id, p_items, p_total })` — transacción atómica que valida stock |
| `registrarCompra(compra)` | `supabase.rpc("registrar_compra", { ... })` |

### Detalles a cuidar en la migración
- **snake_case ↔ camelCase**: la BD usa `precio_venta`, el frontend `precioVenta`.
  Hacer la traducción dentro de cada función del servicio (o con un helper),
  para que los componentes no cambien.
- **Errores**: el SDK devuelve `{ data, error }`; convertir `error` en
  `throw new Error(mensaje)` para que los formularios los muestren igual que hoy.
- **Ids**: los mock usan `c-1`, `m-1`...; Supabase usa UUIDs. No hay nada que
  cambiar en el frontend (los trata como strings opacos).

---

## Verificación final

1. Login con un usuario real de Authentication.
2. Crear cliente → mascota → consulta → receta → imprimirla.
3. Vender en el POS y confirmar en **Table Editor** que `productos.stock` bajó
   y que la fila de `ventas` tiene su folio.
4. Recargar con F5: ahora los datos SÍ persisten (ya no son mock en memoria).
