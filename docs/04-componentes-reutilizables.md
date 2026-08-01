# 04 — Componentes y utilidades reutilizables

Estos son los bloques que se usan en **varios módulos**. Conocerlos evita que
reinventes algo que ya existe, y saber que son compartidos te avisa que
cambiarlos **afecta a todos los lugares donde se usan**.

---

## 1. `components/ui/` — Base de shadcn/ui

Componentes primitivos escritos a mano (no vienen de una librería instalada, así
que puedes editarlos). Son los ladrillos de todo lo demás:

| Componente | Uso |
|---|---|
| `button.tsx` | Botón con variantes (`default`, `outline`, `ghost`, `destructive`...) y tamaños |
| `input.tsx` / `label.tsx` | Campos de formulario |
| `card.tsx` | Tarjetas (Card, CardHeader, CardContent...) |
| `dialog.tsx` | **Modal centrado** (crear/editar, confirmaciones, visores) |
| `sheet.tsx` | **Panel lateral deslizante** (formularios largos, menú móvil) |
| `table.tsx` | Tabla con scroll horizontal en móvil |
| `badge.tsx` | Etiquetas de estado (roles, stock, alertas) con variantes de color |

**Cuándo Dialog vs Sheet:** Dialog para formularios cortos o que necesitan
atención central; Sheet para formularios largos o el menú hamburguesa móvil.

---

## 2. `components/compartidos/` — Reutilizables de negocio

### `dialog-confirmacion.tsx`
Modal de "¿Estás seguro?" para acciones destructivas. Lo usan productos,
clientes, servicios, documentos... Recibe título, mensaje (acepta JSX para
negritas), y callbacks `onConfirmar`/`onCancelar`. Maneja solo su estado de
"procesando" para evitar dobles clics.

```tsx
<DialogConfirmacion
  abierto={!!itemAEliminar}
  titulo="¿Eliminar producto?"
  mensaje={<>Se eliminará <strong>{itemAEliminar?.nombre}</strong>.</>}
  onConfirmar={confirmarEliminar}
  onCancelar={() => setItemAEliminar(null)}
/>
```

### `select-nativo.tsx`
Un `<select>` nativo estilizado con las clases del Input. Se usa el nativo (y no
el de Radix) porque en móvil abre el selector del sistema. Aparece en todos los
formularios con listas desplegables.

### `image-uploader.tsx`
Subidor de imágenes **genérico y controlado**: comprime a WebP y **entrega** el
resultado al formulario padre (no guarda nada por sí mismo). Lo usan el
formulario de producto y el logo de configuración. Ofrece **dos botones**:
"Tomar foto" (abre la cámara) y "Elegir archivo".

```tsx
<ImageUploader
  imagenActual={campos.fotoUrl}
  alt="Foto del producto"
  opciones={{ ladoMaximoPx: 400, calidad: 0.6 }}   // ajustable por uso
  onImagenLista={(foto) => actualizarCampo("fotoUrl", foto.dataUrl)}
  onQuitar={() => actualizarCampo("fotoUrl", "")}
/>
```

### `texto-editable.tsx`
**Edición in-place**: muestra texto; al hacer clic se vuelve input; Enter o
salir del campo guarda, Escape cancela. Es el corazón del editor de recetas.
Emite `onGuardar(nuevoValor)` solo si el texto cambió.

---

## 3. `components/catalogos/catalogo-simple.tsx`

Gestor **genérico** de catálogos de nombres (lista + agregar + eliminar +
validación de duplicados). Una sola implementación que sirve para 3 catálogos:
Especies, Razas y Categorías. La página solo le inyecta las funciones del
servicio. Si necesitas otro catálogo simple de nombres, reúsalo.

---

## 4. `hooks/` — Lógica compartida de React

### `use-auth.tsx`
El contexto de sesión global. Cualquier componente cliente accede al usuario
actual con `useAuth()`:
```tsx
const { usuario, cargando, iniciarSesion, cerrarSesion } = useAuth();
```
Envuelve toda la app en `app/layout.tsx`.

### `use-carrito.ts`
La lógica del carrito (agregar, cambiar cantidad, quitar, limpiar, total).
**Compartida entre el POS (`/ventas`) y las Compras (`/compras`)** — por eso el
`precioUnitario` es un parámetro (venta usa precio de venta, compra usa precio de
compra). No duplica código entre los dos módulos.

### `use-captura-imagen.ts`
Da **dos caminos para la misma foto**: la cámara del dispositivo o un archivo
existente. Administra dos `<input type="file">` ocultos y devuelve sus refs más
las funciones para abrirlos.

```tsx
const captura = useCapturaImagen(procesarArchivo);
// <Button onClick={captura.abrirCamara}>Tomar foto</Button>
// <Button onClick={captura.abrirGaleria}>Elegir archivo</Button>
```

> **Por qué dos inputs:** uno lleva el atributo `capture="environment"`, que
> hace que el **celular abra la cámara de inmediato**, sin el menú intermedio de
> "¿Cámara o Galería?". El otro va sin `capture` para elegir una foto existente.
> En computadora el navegador ignora `capture` y ambos abren el explorador —
> por eso el botón se rotula "Tomar foto" y no "Cámara".

Lo usan `pet-photo-uploader.tsx` (dos botones flotantes sobre el avatar) e
`image-uploader.tsx` (dos botones en el formulario).

### `use-pago.ts`
Toda la **aritmética del cobro** del punto de venta: método elegido, montos del
pago mixto, cuánto falta por cubrir y el **cambio** a devolver. El componente
visual (`panel-pago.tsx`) solo pinta lo que este hook calcula.

```tsx
const pago = usePago(totalACobrar);
// pago.desglose  -> { efectivo, tarjeta, transferencia }
// pago.cambio    -> lo que hay que devolver
// pago.puedeCobrar -> false si el cobro no cuadra (bloquea el botón)
```

Incluye un `redondear()` a centavos: sin él, `0.1 + 0.2` daría
`0.30000000000000004` y una venta exacta marcaría un faltante fantasma.

---

## 4-bis. `components/dashboard/` — Piezas del tablero

### `tarjeta-kpi.tsx`
Tarjeta de indicador: número grande + etiqueta + dato de apoyo, con franja e
icono de color (`azul`, `verde`, `morado`, `ambar`, `rojo`, `gris`). Si recibe
`href`, toda la tarjeta se vuelve un enlace.

### `panel-lista.tsx`
Panel **genérico** de pendientes. El dashboard lo usa **tres veces** (citas,
vacunas, stock bajo). Cada renglón es un `ItemPanel` con título, subtítulo, un
valor a la derecha y una `urgencia` (`alta` roja / `media` ámbar / `baja` gris)
que colorea ese valor. Muestra "y N más · Ver todo" cuando la lista se corta.

---

## 5. `lib/` — Utilidades puras (sin React)

### `utils.ts`
Funciones base usadas en todos lados:
| Función | Qué hace |
|---|---|
| `cn(...)` | Combina clases de Tailwind sin conflictos (estándar de shadcn) |
| `formatoMoneda(n)` | `1160` → `$1,160.00` (MXN) |
| `formatoFecha(iso)` | `2026-07-08` → `08 jul 2026` |
| `diasHasta(iso)` | Días hasta una fecha (negativo si ya pasó) — alimenta el semáforo de vacunas |
| `calcularEdad(iso)` | Fecha de nacimiento → `"3 años 2 meses"` (o solo meses en cachorros) — se usa en certificados y en el portal |

### `comprimir-imagen.ts`
**La compresión Canvas → WebP**, compartida por el uploader de mascotas, el de
productos y los documentos médicos. Redimensiona + baja calidad + convierte a
WebP, todo en el navegador. Parámetros ajustables (`ladoMaximoPx`, `calidad`).
Devuelve `{ dataUrl, blob, kbOriginal, kbFinal }`. Tiene plan B a JPEG para
navegadores viejos.

> **Por qué importa:** una foto de celular pesa 3-8 MB; comprimida queda en
> ~15-25 KB (ahorro del ~99% en el Storage). El `blob` que devuelve ya está
> listo para subir a Supabase Storage.

### `imprimir-receta.ts`
Genera el HTML imprimible de una receta (membrete con logo, tabla de
medicamentos, firma) y abre el diálogo de impresión del navegador (desde ahí se
"Guarda como PDF"). Lee la configuración de la clínica internamente, así el
membrete es idéntico se imprima desde el expediente, el editor o `/recetas`.

### `documentos-legales.ts`
El motor de los **documentos legales**. Tres piezas:
- `MARCADORES` — catálogo de etiquetas disponibles (`{{MASCOTA}}`, `{{CEDULA}}`…),
  que el editor muestra como botones.
- `rellenarPlantilla(contenido, datos, config)` — sustituye los marcadores por
  los datos reales; los que quedan sin valor salen como `__________`.
- `imprimirDocumento(...)` — arma el HTML (membrete con logo, cuerpo, bloques de
  firma con cédula) en tamaño carta y abre el diálogo de impresión.

> Escapa el HTML del contenido: el texto lo escribe un usuario, y sin escapar,
> un `<` rompería el documento impreso.

### `supabase.ts`
El cliente de conexión (singleton) con el interruptor `supabaseConfigurado()`.
Mientras no exista `.env.local`, devuelve `false` y la app sigue en modo mock.
Cuando existan las llaves, se activa. Permite migrar módulo por módulo.

---

## 6. `components/layout/` — Estructura visual

| Componente | Qué hace |
|---|---|
| `sidebar.tsx` | Menú lateral oscuro. `ContenidoSidebar` se reutiliza en escritorio (fijo) y móvil (dentro del Sheet). Filtra ítems por rol. |
| `header.tsx` | Barra superior: menú hamburguesa (móvil) + buscador global |
| `global-search.tsx` | Buscador rápido (Ctrl+K): busca clientes y mascotas, navega al detalle |
| `nav-items.ts` | **Definición ÚNICA del menú** con los roles de cada ítem |

> **`nav-items.ts` es el archivo más importante para personalizar la navegación:**
> el orden de los módulos, sus iconos y qué rol ve cada uno se controlan aquí, en
> un solo lugar. El sidebar de escritorio y el menú móvil leen de él.
