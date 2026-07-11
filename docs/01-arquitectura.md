# 01 — Arquitectura del sistema

Este documento explica **cómo está construido VetGram por dentro**: las capas,
los patrones que se repiten en todo el código y las decisiones de diseño.
Entender esto te permite modificar cualquier módulo con confianza, porque
**todos siguen exactamente la misma estructura**.

---

## 1. Las tres capas

Todo el sistema se organiza en tres capas. La regla de oro es que **cada capa
solo habla con la de abajo**:

```
┌─────────────────────────────────────────────────────────┐
│  PÁGINAS  (app/(dashboard)/*/page.tsx)                   │
│  Orquestan: cargan datos, guardan estado, coordinan      │
├─────────────────────────────────────────────────────────┤
│  COMPONENTES  (components/<módulo>/*.tsx)                │
│  Pintan: reciben props, emiten eventos, NO cargan datos* │
├─────────────────────────────────────────────────────────┤
│  SERVICIOS  (services/db.ts, auth.ts, config.ts)         │
│  Datos: hoy arreglos mock en memoria; mañana Supabase    │
└─────────────────────────────────────────────────────────┘
```

\* Excepción documentada: algunos componentes "autosuficientes" cargan sus
propios datos porque son independientes del resto de la página (ej.
`documentos-mascota.tsx`, `antecedentes-mascota.tsx`, `historial-ventas.tsx`).
Se hace así cuando el dato solo lo usa ese componente y nadie más.

### ¿Por qué esta separación?

- **Para conectar Supabase sin dolor**: cuando llegue la base de datos real,
  SOLO se reescriben los archivos de `services/`. Ninguna página ni componente
  se toca, porque nunca supieron de dónde venían los datos.
- **Para rediseñar sin romper**: si quieres cambiar cómo se ve una tabla,
  editas su componente. La lógica (búsquedas, guardado) vive en la página y no
  se entera.

---

## 2. El patrón que se repite en cada módulo

Todos los módulos CRUD (productos, clientes, mascotas, servicios...) son
**exactamente iguales**. Si entiendes uno, entiendes todos:

```
app/(dashboard)/productos/page.tsx      <- la PÁGINA (orquestador)
components/productos/tabla-productos.tsx    <- la TABLA (presentacional)
components/productos/formulario-producto.tsx <- el FORMULARIO (Dialog/Sheet)
components/compartidos/dialog-confirmacion.tsx <- confirmar borrados
```

La página siempre tiene la misma anatomía:

```tsx
// 1. ESTADO DE DATOS: lo que viene del servicio
const [productos, setProductos] = React.useState<Producto[]>([]);
const [cargando, setCargando] = React.useState(true);

// 2. ESTADO DE INTERFAZ: lo que el usuario manipula
const [busqueda, setBusqueda] = React.useState("");
const [panelAbierto, setPanelAbierto] = React.useState(false);
const [productoEnEdicion, setProductoEnEdicion] = React.useState<Producto | null>(null);
//     ^ null = modo "crear"; con objeto = modo "editar" (UN estado, DOS usos)

// 3. CARGA: pide al servicio y guarda en estado
const cargarDatos = React.useCallback(async () => { ... }, []);
React.useEffect(() => { cargarDatos(); }, [cargarDatos]);

// 4. RENDER: filtra en memoria y delega a los componentes
```

**Convención clave — `null` como "cerrado/nuevo":** en todo el proyecto, un
estado tipo `Producto | null` significa: `null` = el modal está cerrado (o es
un registro nuevo); con objeto = el modal está abierto editando ese registro.

---

## 3. Rutas y protección de sesión

### Grupos de rutas de Next.js

```
app/
├── layout.tsx            <- Layout RAÍZ: metadatos PWA + <AuthProvider>
├── login/page.tsx        <- Pública (sin sidebar)
└── (dashboard)/          <- GRUPO: el paréntesis NO aparece en la URL
    ├── layout.tsx        <- Guardia de sesión + Sidebar + Header
    └── .../page.tsx      <- Todas las páginas internas
```

El truco: `(dashboard)` es un *route group* — organiza archivos sin afectar la
URL. Así `/ventas` vive en `app/(dashboard)/ventas/page.tsx` pero hereda el
layout protegido, mientras `/login` queda fuera y sin menús.

### Cómo funciona la sesión (mock)

```
Usuario escribe email/password en /login
        │
        ▼
hooks/use-auth.tsx (contexto global <AuthProvider>)
        │  llama a
        ▼
services/auth.ts -> valida contra USUARIOS_MOCK (credenciales quemadas)
        │  si es correcto
        ▼
Guarda el usuario en localStorage (clave "vetgram_sesion")
        │
        ▼
app/(dashboard)/layout.tsx: si NO hay sesión -> redirige a /login
```

- `useAuth()` es el hook que cualquier componente usa para saber quién está
  en sesión: `const { usuario, cerrarSesion } = useAuth();`
- Al recargar la página, el AuthProvider **restaura** la sesión desde
  localStorage (por eso no te desloguea el F5).
- **TODO Supabase:** solo cambia `services/auth.ts` (signInWithPassword,
  signOut, getSession) y se escucha `onAuthStateChange` en el hook.

---

## 4. Sistema de roles

Hay 3 roles definidos en `types/index.ts`:

```ts
export type Rol = "administrador" | "veterinario" | "recepcion";
```

La validación ocurre en **tres niveles** (defensa en profundidad):

1. **Menú lateral** — `components/layout/nav-items.ts`: cada ítem declara
   `roles: [...]` y el sidebar solo pinta los permitidos. **Para cambiar qué
   rol ve qué módulo, edita SOLO este archivo.**
2. **Botones de acción** — con el helper `tienePermiso(usuario, ["administrador"])`
   de `services/auth.ts` (ej. solo el admin ve "Eliminar producto" o
   "Cancelar venta").
3. **Páginas sensibles** — `/usuarios`, `/reportes` y `/configuracion` validan
   el rol de nuevo dentro de la página, por si alguien teclea la URL directa.

> ⚠️ En modo mock la seguridad es SOLO de interfaz. La seguridad real llegará
> con Supabase (políticas RLS en la base de datos).

---

## 5. Convenciones del código (respétalas al modificar)

| Convención | Regla |
|---|---|
| **Nombres de archivo** | kebab-case: `tabla-productos.tsx`, `use-carrito.ts` |
| **Componentes** | PascalCase: `TablaProductos`, `FormularioProducto` |
| **Variables y funciones** | Español descriptivo: `cargarDatos`, `productoAEliminar` |
| **Comentarios** | Español, formato QUÉ / POR QUÉ / CÓMO-Supabase en el encabezado de cada archivo |
| **Servicios** | SIEMPRE `async` que devuelven `Promise`, aunque el mock no lo necesite — así la firma no cambia con Supabase |
| **Formularios** | Los inputs guardan `string`; se convierte a número JUSTO al guardar |
| **Ids mock** | `"c-1"`, `"m-2"`, `` `p-${Date.now()}` `` — el frontend los trata como strings opacos (los UUID de Supabase entrarán sin cambios) |
| **Catálogos en arrays** | Los formularios largos generan sus campos desde arrays (`CAMPOS_SISTEMAS`, `CAMPOS_ANTECEDENTES`): agregar un campo = agregar una línea |
| **Mobile-first** | `grid-cols-1` como base; `sm:`/`lg:` solo AGREGAN columnas |

---

## 6. PWA (aplicación instalable)

- `public/manifest.json`: nombre, colores e íconos de la app instalada.
- `app/layout.tsx`: lo registra vía `metadata.manifest` y define el color de
  la barra del navegador (`viewport.themeColor`).
- `public/icons/icon-192.png` y `icon-512.png`: **son placeholders** ("VG"
  azul) — reemplázalos por el logo real manteniendo nombre y tamaño.
- Falta para offline completo: un *service worker* (`@serwist/next` o
  `next-pwa`) — anotado como TODO en `next.config.js`.

---

## 7. El camino a Supabase (resumen)

Toda la app está diseñada para que la migración sea mecánica:

1. `supabase/schema.sql` crea las tablas (ya incluye TODAS las reglas de
   negocio: llaves foráneas, transacciones de venta, RLS).
2. `.env.local` con las llaves activa el cliente (`lib/supabase.ts` tiene el
   interruptor `supabaseConfigurado()`).
3. Se reescriben las funciones de `services/db.ts` y `services/auth.ts` una
   por una siguiendo el mapa de `supabase/README-CONEXION.md`.
4. **Nada más cambia**: ni páginas, ni componentes, ni tipos.
