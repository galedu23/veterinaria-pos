# 🐾 VetGram — Sistema de Control Veterinario y Punto de Venta

Aplicación web (PWA) para administrar una clínica veterinaria: clientes, mascotas,
expedientes clínicos, recetas, vacunas, inventario, punto de venta y reportes.

> **Estado actual:** MVP funcional con **datos de prueba en memoria (mock)**.
> Toda la arquitectura está lista para conectarse a Supabase — ver
> [`supabase/README-CONEXION.md`](supabase/README-CONEXION.md).

---

## Inicio rápido

```bash
npm install     # instalar dependencias (solo la primera vez)
npm run dev     # servidor de desarrollo -> http://localhost:3000
npm run build   # compilación de producción (lo que ejecuta Netlify)
```

### Credenciales de prueba

| Rol | Email | Contraseña | Qué puede hacer |
|---|---|---|---|
| Administrador | `admin@vet.com` | `admin123` | Todo (incluye usuarios, reportes, configuración, cancelar ventas) |
| Veterinario | `vet@vet.com` | `vet123` | Módulos clínicos (consultas, recetas, vacunas) |
| Recepción | `recepcion@vet.com` | `rec123` | Clientes, mascotas, productos y punto de venta |

---

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| **Next.js 15** (App Router) | Framework: rutas, build, servidor |
| **React 19** | Componentes de interfaz |
| **Tailwind CSS 3** | Estilos (clases utilitarias) |
| **shadcn/ui** | Componentes base (Dialog, Sheet, Table...) escritos a mano en `components/ui/` |
| **lucide-react** | Iconos |
| **TypeScript** | Tipado: los tipos de `types/index.ts` son el espejo de las futuras tablas |
| **@supabase/supabase-js** | Instalado y listo; se activa al crear `.env.local` |

---

## Estructura del proyecto (mapa general)

```
proyecto de veterinaria/
├── app/                     # PÁGINAS (cada carpeta = una ruta URL)
│   ├── login/               #   /login (pública)
│   ├── portal/[token]/      #   /portal/xxx — PORTAL PÚBLICO del cliente
│   └── (dashboard)/         #   Rutas PROTEGIDAS (piden sesión) con sidebar
│       ├── page.tsx         #   /            -> Tablero principal
│       ├── clientes/        #   /clientes y /clientes/[id]
│       ├── mascotas/        #   /mascotas y /mascotas/[id] (expediente)
│       ├── ventas/          #   /ventas (punto de venta)
│       └── ...              #   (un folder por módulo)
├── components/              # PIEZAS de interfaz, agrupadas por módulo
│   ├── ui/                  #   Base shadcn/ui (button, dialog, table...)
│   ├── compartidos/         #   Reutilizables entre módulos
│   ├── layout/              #   Sidebar, header, buscador global
│   ├── dashboard/           #   Tarjetas KPI y paneles de pendientes
│   ├── portal/              #   Vistas del portal del cliente
│   └── <módulo>/            #   ventas/, productos/, expediente/, etc.
├── services/                # ACCESO A DATOS (la única capa que se
│   ├── db.ts                #   reescribirá al conectar Supabase)
│   ├── auth.ts              #   Login/roles mockeados
│   └── config.ts            #   Datos de la clínica (localStorage)
├── hooks/                   # Lógica de React compartida (sesión, carrito, cobro)
├── lib/                     # Utilidades puras (compresión, impresión, formatos)
├── types/index.ts           # TODOS los tipos = futuras tablas de Supabase
├── supabase/                # schema.sql + guía de conexión
├── docs/                    # 📚 DOCUMENTACIÓN COMPLETA (empieza aquí)
├── public/                  # manifest.json (PWA) e íconos
└── netlify.toml             # Configuración del deploy
```

## Módulos del sistema (21 rutas)

| Área | Módulos |
|---|---|
| **Tablero** | Dashboard con KPIs del día, tendencia de ventas y pendientes accionables |
| **Clientes y pacientes** | Clientes · Mascotas (buscador cruzado) · Expediente clínico completo |
| **Clínico** | Consultas · Recetas (editor in-place) · Vacunas con alertas · Antecedentes · Documentos médicos · **Formatos legales** |
| **Comercial** | Punto de venta (descuento, pago mixto, **cambio**, ticket, corte de caja) · Compras · Productos · Reportes mensuales |
| **Catálogos** | Servicios · Especies y Razas · Categorías · **Veterinarios** |
| **Administración** | Usuarios · Configuración de la clínica (logo, datos del ticket) |
| **Público** | **Portal del cliente** (`/portal/{token}`): sus mascotas, vacunas y citas, sin contraseña |

---

## 📚 Documentación

La documentación completa vive en la carpeta [`docs/`](docs/):

| Documento | Contenido |
|---|---|
| [01 — Arquitectura](docs/01-arquitectura.md) | Cómo fluyen los datos, patrones usados, sesión y roles, convenciones |
| [02 — Módulos](docs/02-modulos.md) | Cada pantalla explicada: qué hace, qué archivos la componen, cómo modificarla |
| [03 — Datos y servicios](docs/03-datos-y-servicios.md) | El modelo de datos, todas las funciones de `services/` y las reglas de negocio |
| [04 — Componentes reutilizables](docs/04-componentes-reutilizables.md) | Los bloques compartidos: uploaders, edición in-place, carrito, compresión de imágenes |
| [05 — Guía de modificaciones](docs/05-guia-de-modificaciones.md) | **Recetario paso a paso**: agregar campos, módulos, roles + solución de problemas |
| [06 — Análisis del sistema anterior](docs/06-analisis-sistema-anterior.md) | Estudio del sistema en producción: módulos, problemas detectados y brechas por cubrir |
| [Despliegue en Netlify](DESPLIEGUE-NETLIFY.md) | Cómo publicar y actualizar el sitio |
| [Conexión a Supabase](supabase/README-CONEXION.md) | El plan para pasar de datos mock a base de datos real |

---

## Advertencias importantes (modo mock)

1. **Los datos NO persisten**: viven en la memoria del navegador y se reinician
   con F5. Excepción: la configuración de la clínica y el logo (localStorage).
2. **Las credenciales están quemadas en el código** y son visibles en el login.
   No capturar datos reales de clientes hasta conectar Supabase Auth.
3. **El proyecto vive dentro de OneDrive**: la sincronización puede corromper
   `.next` o restaurar archivos borrados. Ver la sección de problemas comunes en
   [docs/05](docs/05-guia-de-modificaciones.md).
