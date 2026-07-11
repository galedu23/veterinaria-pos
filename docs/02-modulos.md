# 02 — Módulos (pantalla por pantalla)

Cada sección describe **una pantalla del sistema**: qué hace, de qué archivos se
compone y cómo modificarla. Todas siguen el patrón contenedor/presentacional
explicado en [01 — Arquitectura](01-arquitectura.md).

Índice:
[Dashboard](#dashboard) · [Clientes](#clientes) · [Mascotas](#mascotas) ·
[Expediente clínico](#expediente-clínico) · [Consultas / Recetas / Vacunas (globales)](#listados-globales-clínicos) ·
[Productos](#productos-inventario) · [Punto de Venta](#punto-de-venta-pos) ·
[Compras](#compras) · [Reportes](#reportes) · [Servicios](#servicios) ·
[Catálogos](#catálogos-razas-y-categorías) · [Usuarios](#usuarios) · [Configuración](#configuración)

---

## Dashboard

- **Ruta:** `/` · **Archivo:** `app/(dashboard)/page.tsx`
- **Qué hace:** muestra las tarjetas de métricas de colores (usuarios, clientes,
  mascotas, consultas, productos, vacunas próximas). Cada tarjeta enlaza a su módulo.
- **De dónde salen los números:** `getDashboardStats()` en `services/db.ts`.
- **Cómo modificar:**
  - *Agregar una tarjeta*: añade un objeto al array `TARJETAS` (clave, título,
    color, icono, href) y asegúrate de que `getDashboardStats()` devuelva esa clave.
  - *Cambiar colores*: son clases Tailwind (`bg-yellow-500`, `bg-blue-600`...) en
    el mismo array.

---

## Clientes

- **Rutas:** `/clientes` (lista) y `/clientes/[id]` (perfil del dueño)
- **Archivos:**
  - `app/(dashboard)/clientes/page.tsx` — orquestador
  - `components/clientes/tabla-clientes.tsx` — la tabla (con badge de nº de mascotas)
  - `components/clientes/formulario-cliente.tsx` — modal crear/editar (Dialog)
  - `app/(dashboard)/clientes/[id]/page.tsx` — perfil con sus mascotas
- **Regla de negocio:** no se puede eliminar un cliente que tenga mascotas
  (lo rechaza `eliminarCliente()` en el servicio y la página muestra el error).
- **Cómo modificar:**
  - *Agregar un campo (ej. RFC)*: 1) añádelo a `Cliente` en `types/index.ts`,
    2) agrégalo al formulario `formulario-cliente.tsx`, 3) opcionalmente
    muéstralo en la tabla o el perfil. Ver receta detallada en [doc 05](05-guia-de-modificaciones.md).

---

## Mascotas

- **Rutas:** `/mascotas` (lista con buscador inteligente) y `/mascotas/[id]` (expediente)
- **Archivos:**
  - `app/(dashboard)/mascotas/page.tsx` — orquestador con **buscador cruzado**
  - `components/mascotas/tabla-mascotas.tsx` — tabla que muestra dueño + raza
  - `components/mascotas/formulario-mascota.tsx` — panel Sheet con selects dependientes
  - `components/mascotas/pet-photo-uploader.tsx` — foto con compresión WebP
- **El buscador inteligente:** `buscarMascotasAvanzado()` cruza *nombre de
  mascota + dueño + raza + especie*. Como muchas mascotas se llaman igual
  ("Lobo"), escribir `"lobo garcía"` distingue por dueño. Usa **debounce** de
  300 ms (espera a que dejes de teclear antes de buscar).
- **Selects dependientes:** al elegir especie en el formulario, se refiltran
  las razas de esa especie (`cambiarEspecie` reinicia la raza).
- **Cómo modificar:**
  - *Cambiar los campos que busca*: edita `buscarMascotasAvanzado()` en `services/db.ts`.
  - *Ajustar el tiempo del debounce*: el `setTimeout(..., 300)` en la página.

---

## Expediente clínico

- **Ruta:** `/mascotas/[id]` · **Archivo:** `app/(dashboard)/mascotas/[id]/page.tsx`
- **Qué es:** la pantalla más rica del sistema. Reúne TODO sobre un paciente y
  es el destino del buscador global. Se compone de:

| Sección | Componente | Qué hace |
|---|---|---|
| Ficha + foto | `pet-photo-uploader.tsx` + `antecedentes-mascota.tsx` | Datos, foto y botón de antecedentes |
| Historial de consultas | `historial-consultas.tsx` / `tabla-anamnesis.tsx` | Alterna vista **Tarjetas** (detalle) / **Anamnesis** (tabla comparable) |
| Recetas | `lista-recetas.tsx` + `editor-receta.tsx` | Lista; clic abre el editor profesional con edición in-place |
| Vacunas | `vacunas-mascota.tsx` | Lista con semáforo de refuerzos + registro |
| Documentos médicos | `documentos-mascota.tsx` + `visor-documento.tsx` | Sube PDFs/imágenes y los ve embebidos |

- **Flujo Consulta → Receta (vinculación estricta):** al guardar una consulta
  nueva, el sistema abre **automáticamente** el modal de receta ligado al id de
  esa consulta. Una receta NUNCA existe sin su consulta (`consultaId` obligatorio).
- **Formulario de consulta:** `components/consultas/formulario-consulta-completa.tsx`
  es un Dialog centrado y ancho (`max-w-4xl`) con 4 secciones. El select "Tipo de
  servicio" se alimenta del módulo de Servicios.
- **Roles:** recepción NO ve los botones de captura clínica (solo admin y veterinario).

---

## Listados globales clínicos

Vistas de **solo lectura** para ver la actividad de toda la clínica. La captura
siempre se hace desde el expediente de cada mascota.

| Módulo | Ruta | Archivos |
|---|---|---|
| Consultas | `/consultas` | `app/(dashboard)/consultas/page.tsx` + `components/consultas/tabla-consultas.tsx` |
| Recetas | `/recetas` | `app/(dashboard)/recetas/page.tsx` + `components/recetas/tabla-recetas.tsx` |
| Vacunas | `/vacunas` | `app/(dashboard)/vacunas/page.tsx` + `components/vacunas/tabla-vacunas.tsx` |

- **Vacunas** arranca filtrado en "próximas y vencidas" (el uso diario: saber a
  quién llamar), con botón para ver todo. Reutiliza el semáforo `EstadoVacuna`
  del expediente — un solo criterio en toda la app.

---

## Productos (inventario)

- **Ruta:** `/productos` · **Archivos:**
  - `app/(dashboard)/productos/page.tsx` — orquestador
  - `components/productos/tabla-productos.tsx` — tabla con miniatura y badge de stock
  - `components/productos/formulario-producto.tsx` — Sheet con `ImageUploader`
- **Alertas de stock:** cuando `stock <= stockMinimo`, el badge se pone rojo con ⚠.
- **Foto del producto:** se comprime a WebP en el navegador antes de guardar.
- **Roles:** solo el administrador ve el botón de eliminar.

---

## Punto de Venta (POS)

- **Ruta:** `/ventas` · **Archivos:**
  - `app/(dashboard)/ventas/page.tsx` — orquestador (dueño del carrito y del descuento)
  - `components/ventas/catalogo-productos.tsx` — izquierda: buscador + rejilla con fotos
  - `components/ventas/carrito-venta.tsx` — derecha: líneas, descuento, método de pago, total
  - `components/ventas/ticket-venta.tsx` — ticket interno (con logo/datos de la clínica)
  - `components/ventas/historial-ventas.tsx` — Drawer: reimprimir y cancelar tickets del día
  - `components/ventas/corte-caja.tsx` — Reporte Z: total del día + desglose por pago
- **Funciones de caja registradora:**
  - *Descuento* (% o monto fijo): el cálculo vive en la página (`useMemo`) con
    topes (% máx 100, monto máx = subtotal).
  - *Método de pago*: efectivo / tarjeta / transferencia; alimenta el corte de caja.
  - *Reimprimir*: desde el Historial, reutiliza el mismo `TicketVenta`.
  - *Cancelar* (solo admin): `cancelarVenta()` **devuelve el stock** y marca el
    ticket como cancelado (no lo borra — el folio no desaparece).
- **Descontar stock:** `registrarVenta()` valida y descuenta; una venta cancelada
  o el corte de caja excluyen los tickets cancelados.

---

## Compras

- **Ruta:** `/compras` · **Archivo:** `app/(dashboard)/compras/page.tsx`
- **Qué hace:** igual mecánica que el POS pero **suma** stock (entrada de
  inventario a precio de compra). Usa el mismo hook `use-carrito`.
  `registrarCompra()` aumenta el stock. Abajo, historial de compras.

---

## Reportes

- **Ruta:** `/reportes` (solo admin) · **Archivos:**
  - `app/(dashboard)/reportes/page.tsx` — orquestador
  - `components/reportes/tarjeta-resumen.tsx` — número grande + comparativa ▲▼
  - `components/reportes/grafico-barras.tsx` — ventas por día (Tailwind puro, con tooltip)
  - `components/reportes/barras-horizontales.tsx` — genérico: top productos e ingresos por método
- **Todo el cálculo** está en `getReporteMensual()` (una sola función que
  devuelve total del mes, comparativa vs mes anterior, ventas por día, top 5 y
  desglose por método). Los gráficos son **solo Tailwind, sin librerías**.
- **Datos de demostración:** las ventas semilla usan fechas relativas a hoy
  (`fechaHace()`), así los reportes siempre muestran datos.

---

## Servicios

- **Ruta:** `/servicios` (solo admin) · **Archivos:**
  - `app/(dashboard)/servicios/page.tsx` — orquestador
  - `components/servicios/tabla-servicios.tsx` + `formulario-servicio.tsx`
- **La conexión clave:** este catálogo **alimenta el select "Tipo de servicio"**
  del alta de consulta. Agrega "Ultrasonido" aquí y aparece en la próxima consulta.
- **Regla:** no se puede borrar un servicio ya usado en consultas.

---

## Catálogos (Razas y Categorías)

- **Rutas:** `/razas` y `/categorias` · **Archivos:**
  - `app/(dashboard)/razas/page.tsx` y `.../categorias/page.tsx`
  - Ambos usan el genérico `components/catalogos/catalogo-simple.tsx`
- **Razas:** dos columnas (especies + razas de la especie seleccionada, con
  select dependiente). **Categorías:** una sola lista.
- **Regla:** no se borra una raza/categoría en uso (protege el historial).

---

## Usuarios

- **Ruta:** `/usuarios` (solo admin) · **Archivos:**
  - `app/(dashboard)/usuarios/page.tsx` + `components/usuarios/tabla-usuarios.tsx`
- **Estado actual:** solo lectura. El botón "Nuevo usuario" está **deshabilitado
  a propósito** — dar de alta usuarios reales necesita Supabase Auth (crearlos con
  el mock daría falsa seguridad). Muestra los 3 usuarios mock con badge por rol.

---

## Configuración

- **Ruta:** `/configuracion` (solo admin) · **Archivos:**
  - `app/(dashboard)/configuracion/page.tsx` + `components/configuracion/formulario-clinica.tsx`
- **Qué guarda:** nombre, dirección, teléfono, mensaje de despedida y **logo** de
  la clínica. Estos datos se imprimen en el **ticket de venta** y el **membrete de
  las recetas**. Tiene vista previa en vivo.
- **Persistencia:** usa `localStorage` (vía `services/config.ts`), así SÍ sobrevive
  al F5 — a diferencia del resto del mock.
- **El logo** reutiliza el `ImageUploader` (compresión WebP a 300px).
