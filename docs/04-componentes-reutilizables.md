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
formulario de producto y el logo de configuración.

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
