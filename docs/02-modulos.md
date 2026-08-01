# 02 — Módulos (pantalla por pantalla)

Cada sección describe **una pantalla del sistema**: qué hace, de qué archivos se
compone y cómo modificarla. Todas siguen el patrón contenedor/presentacional
explicado en [01 — Arquitectura](01-arquitectura.md).

Índice:
[Dashboard](#dashboard) · [Clientes](#clientes) · [Mascotas](#mascotas) ·
[Expediente clínico](#expediente-clínico) · [Consultas / Recetas / Vacunas (globales)](#listados-globales-clínicos) ·
[Productos](#productos-inventario) · [Punto de Venta](#punto-de-venta-pos) ·
[Compras](#compras) · [Reportes](#reportes) · [Servicios](#servicios) ·
[Veterinarios](#veterinarios) · [Formatos legales](#formatos-legales) ·
[Portal del cliente](#portal-del-cliente) ·
[Catálogos](#catálogos-razas-y-categorías) · [Usuarios](#usuarios) · [Configuración](#configuración)

---

## Dashboard

- **Ruta:** `/` · **Archivos:**
  - `app/(dashboard)/page.tsx` — orquestador
  - `components/dashboard/tarjeta-kpi.tsx` — tarjeta de indicador
  - `components/dashboard/panel-lista.tsx` — panel de pendientes (genérico)
  - Reutiliza `grafico-barras.tsx` y `barras-horizontales.tsx` de reportes
- **Qué hace:** es un **tablero de trabajo**, no un contador de registros.
  De arriba hacia abajo:
  1. Saludo según la hora + fecha
  2. **4 KPIs del día**: ventas, consultas, citas de la semana, alertas
  3. **Gráficos**: tendencia de ventas (7 días) y servicios más dados del mes
  4. **3 paneles de pendientes**: próximas citas, vacunas por aplicar y
     productos por resurtir — con nombre, urgencia y enlace al detalle
  5. Totales del sistema al pie (contexto, no decisiones)
- **De dónde salen los datos:** `getResumenDashboard()` en `services/db.ts`
  (una sola llamada devuelve todo).
- **Roles:** el dinero (ventas y su gráfico) solo lo ven administrador y
  recepción; un veterinario ve el tablero sin importes.
- **Cómo modificar:**
  - *Agregar un KPI*: añade el dato en `getResumenDashboard()` y una
    `<TarjetaKpi>` en la rejilla (colores disponibles: azul, verde, morado,
    ámbar, rojo, gris).
  - *Agregar un panel*: arma un array de `ItemPanel` y pásalo a `<PanelLista>`.

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

Vistas de la actividad de toda la clínica.

| Módulo | Ruta | Archivos |
|---|---|---|
| Consultas | `/consultas` | `app/(dashboard)/consultas/page.tsx` + `components/consultas/tabla-consultas.tsx` + `selector-paciente.tsx` |
| Recetas | `/recetas` | `app/(dashboard)/recetas/page.tsx` + `components/recetas/tabla-recetas.tsx` |
| Vacunas | `/vacunas` | `app/(dashboard)/vacunas/page.tsx` + `components/vacunas/tabla-vacunas.tsx` |

- **Consultas** muestra la **foto del paciente** junto a su nombre y dueño: en
  un listado largo, reconocer al animal de un vistazo es más rápido que leer
  nombres repetidos. Si la mascota no tiene foto se pinta una huella para no
  romper la alineación.
- **Consultas permite dar de alta** sin salir del listado, en 3 pasos
  encadenados: `SelectorPaciente` (¿a qué mascota?) →
  `FormularioConsultaCompleta` → `FormularioReceta` (se abre solo, ligado a la
  consulta creada). El primer paso conserva la regla de que **toda consulta
  pertenece a un paciente**; el selector usa el buscador cruzado con fotos.
  Solo administrador y veterinario ven el botón.
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
  - `app/(dashboard)/ventas/page.tsx` — orquestador (dueño del carrito, descuento y cobro)
  - `components/ventas/catalogo-productos.tsx` — izquierda: buscador + rejilla con fotos
  - `components/ventas/carrito-venta.tsx` — derecha: líneas, descuento y totales
  - `components/ventas/panel-pago.tsx` — **cobro: método, pago mixto y cambio**
  - `hooks/use-pago.ts` — toda la aritmética del cobro
  - `components/ventas/ticket-venta.tsx` — ticket interno (con logo/datos de la clínica)
  - `components/ventas/historial-ventas.tsx` — Drawer: reimprimir y cancelar tickets del día
  - `components/ventas/corte-caja.tsx` — Reporte Z: total del día + desglose por pago
- **Funciones de caja registradora:**
  - *Descuento* (% o monto fijo): el cálculo vive en la página (`useMemo`) con
    topes (% máx 100, monto máx = subtotal).
  - *Método de pago*: efectivo / tarjeta / transferencia / **mixto**.
  - *Cambio*: se captura con cuánto paga el cliente y el sistema calcula la
    devolución. Hay **botones rápidos de billetes** ($50 a $1000 y "Justo").
    El cambio se calcula solo sobre la parte en efectivo (una tarjeta no da cambio).
  - *Pago mixto*: tres montos (efectivo/tarjeta/transferencia) con aviso de
    cuánto falta por cubrir; el botón Cobrar se bloquea si no cuadra.
  - *Reimprimir*: desde el Historial, reutiliza el mismo `TicketVenta`.
  - *Cancelar* (solo admin): `cancelarVenta()` **devuelve el stock** y marca el
    ticket como cancelado (no lo borra — el folio no desaparece).
- **Descontar stock:** `registrarVenta()` valida y descuenta; el corte de caja
  y los reportes excluyen los tickets cancelados y suman el **desglose real**
  por forma de pago (no la etiqueta), para que el efectivo del cajón cuadre.
- **Cómo modificar:**
  - *Cambiar los billetes rápidos*: array `BILLETES` en `panel-pago.tsx`.
  - *Cambiar reglas de cobro*: todo está en `hooks/use-pago.ts`.

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

## Veterinarios

- **Ruta:** `/veterinarios` (solo admin) · **Archivos:**
  - `app/(dashboard)/veterinarios/page.tsx`
  - `components/veterinarios/gestion-veterinarios.tsx` (tabla + formulario)
- **Qué es y por qué está separado de Usuarios:** un **usuario** es una cuenta
  para entrar al sistema; un **veterinario** es el profesional cuya **cédula**
  se imprime en recetas y certificados. Un médico puede no tener cuenta, y una
  cuenta (recepción) no es un médico.
- **La cédula profesional es obligatoria**: sin ella un certificado no tiene
  validez legal en México.
- **Baja lógica, no borrado**: al dar de baja se marca `activo = false`. Si se
  borrara, los documentos ya firmados quedarían sin respaldo de quién los firmó.

---

## Formatos legales

- **Ruta:** `/formatos` (solo admin) · **Archivos:**
  - `app/(dashboard)/formatos/page.tsx` — catálogo de formatos
  - `components/formatos/editor-plantilla.tsx` — editor del texto (Sheet ancho)
  - `components/expediente/generar-documento.tsx` — generación desde el expediente
  - `lib/documentos-legales.ts` — rellena los marcadores e imprime
- **Qué hace:** administra los documentos legales de la clínica. Incluye 4
  redacciones base conforme a normativa mexicana:

  | Documento | Fundamento |
  |---|---|
  | Consentimiento Informado para Eutanasia | NOM-033-SAG/ZOO-2014 |
  | Certificado de Salud Animal | NOM-011-SSA2-2011 (rabia) |
  | Consentimiento para Servicio de Estética | LFPC / contrato de servicios |
  | Consentimiento Quirúrgico y Anestesia | NOM-062-ZOO-1999 |

- **Son totalmente editables**: el texto usa marcadores (`{{MASCOTA}}`,
  `{{CEDULA}}`, `{{DUENO}}`…) que se sustituyen al generar el documento. En el
  editor los marcadores son **botones que se insertan en la posición del cursor**.
  También se pueden crear formatos nuevos desde cero.
- **Cómo se genera:** en el expediente de la mascota → sección "Documentos
  legales" → se elige el formato, quién firma y se llenan dos campos libres
  (`{{MOTIVO}}` y `{{OBSERVACIONES}}`) → **vista previa** → Imprimir/PDF.
  Los marcadores sin dato salen como `__________` para llenar a mano.
- ⚠️ **Aviso**: son redacciones base. Antes de usarlas con clientes reales deben
  ser validadas por el Médico Veterinario responsable y un asesor legal.
- **Cómo modificar:**
  - *Agregar un marcador nuevo*: añádelo a `DatosDocumento` y a `MARCADORES` en
    `lib/documentos-legales.ts`, y llénalo en `generar-documento.tsx`.
  - *Cambiar el diseño impreso* (membrete, márgenes, firmas): la función
    `imprimirDocumento()` del mismo archivo.

---

## Portal del cliente

- **Ruta:** `/portal/[token]` — **PÚBLICA**, sin sesión · **Archivos:**
  - `app/portal/[token]/page.tsx` — la página que ve el dueño
  - `components/portal/recordatorios-portal.tsx` — avisos con semáforo
  - `components/portal/tarjeta-mascota-portal.tsx` — ficha con acordeón
  - `components/clientes/enlace-portal.tsx` — compartir el enlace (lado clínica)
- **Qué ve el cliente:** saludo con su nombre, **recordatorios unificados** de
  todas sus mascotas (vacunas y citas, ordenados por urgencia con colores
  rojo/ámbar/azul) y una tarjeta por mascota con secciones plegables: vacunas,
  visitas y medicamentos. Todo en lenguaje de dueño, no de médico.
- **Cómo accede:** con un enlace único (`/portal/{token}`). Sin usuario ni
  contraseña. Desde el perfil del cliente la clínica puede **copiarlo, enviarlo
  por WhatsApp** con mensaje prellenado, o **regenerarlo** para revocar el anterior.
- **Por qué NO vive en `(dashboard)`:** esa carpeta exige sesión y pinta el menú
  de administración. El portal es público y debe verse limpio en un celular.
- **Seguridad:**
  - El token es aleatorio (20 caracteres), **no el id del cliente** — si fuera
    `/portal/c-1`, cualquiera vería otro expediente cambiando el número.
  - Es de **solo lectura**: desde el portal no se modifica nada.
  - `getPortalPorToken()` **omite a propósito** notas internas del veterinario,
    precios e ids del sistema.
  - En Supabase se leerá con la función `portal_por_token()` (`SECURITY DEFINER`),
    para que la página pública nunca consulte las tablas directamente.

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
