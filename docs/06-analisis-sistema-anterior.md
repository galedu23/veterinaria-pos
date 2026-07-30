# 06 — Análisis del sistema anterior (Home Pet)

Análisis del sistema en producción `homepet.com.mx/admin` (PHP + Bootstrap +
DataTables), realizado el 11 de julio de 2026 con acceso autorizado de la
propietaria. Sirve para dos cosas: **justificar el proyecto** en el reporte de
estadía y **guiar qué falta** en el sistema nuevo.

---

## 1. Volumen de datos en producción

| Entidad | Registros |
|---|---|
| Clientes | 585 |
| Mascotas | 669 |
| Consultas | 792 |
| Productos | 282 |
| Servicios | 8 |
| Veterinarios | 1 |
| Usuarios | 2 |

> Dato clave para el reporte: **no es un sistema de juguete**, opera con casi
> 800 consultas reales. Cualquier reemplazo debe contemplar migración de datos.

---

## 2. Estructura de módulos (13 en total)

| Módulo | Ruta | Contenido |
|---|---|---|
| Formatos definidos | `/admin/fvarios` | Imprime documentos por mascota: **Eutanasia, Certificado Sanitario, Estética** |
| Mascoteca | `/admin/formatos` | Repositorio de archivos por mascota (columnas fijas Formato-A … Formato-F) |
| Servicios | `/admin/servicios` | Catálogo: Estética, Consulta, Servicio Médico, Vacunación, Pensión… |
| Categorías | `/admin/categorias` | Categorías de producto |
| Razas | `/admin/razas` | Catálogo de razas |
| Clientes | `/admin/clientes` | Nombre, Teléfono, Correo, **Colonia** |
| Veterinarios | `/admin/veterinarios` | Nombre, Dirección, Teléfono, Email, Foto — **separado de Usuarios** |
| Mascotas | `/admin/mascotas` | Nombre, Sexo, Color, **Imagen**, Raza, Dueño, Teléfono, Fecha alta |
| Usuarios | `/admin/usuarios` | Cuentas del sistema |
| Consultas | `/admin/consultas` | Mascota, Dueño, Servicio, Fecha, Próx. consulta, **Imprimir receta** |
| Productos | `/admin/productos` | Código, Nombre, Descripción, Imagen, Stock, Precio compra/venta |
| Compras | `/admin/compras` | Solo filtro por rango de fechas |
| Ventas | `/admin/ventas` | Listado (filtro por fechas) + **Nueva venta** (POS) |

---

## 3. Funciones que el sistema anterior SÍ tiene y el nuevo NO

Estas son las **brechas reales** detectadas — prioridad de desarrollo:

| # | Función | Dónde está | Por qué importa |
|---|---|---|---|
| 1 | **Escáner de código de barras** | POS: campo "Escanear código de barras" | Es como realmente cobran; teclear nombres es más lento |
| 2 | **Cálculo de cambio** | POS: Efectivo / Total pagado / **Total devuelto** | El cajero necesita saber cuánto devolver |
| 3 | **Pago mixto** | POS: campos separados Efectivo **y** Transferencia | Una venta puede pagarse parte en efectivo, parte por transferencia |
| 4 | **Descuento por línea (%Desc)** | POS: columna en cada producto | El nuestro solo tiene descuento global |
| 5 | **Formatos legales imprimibles** | Formatos definidos | Eutanasia y Certificado Sanitario son documentos con valor legal |
| 6 | **Módulo de Veterinarios** | Separado de Usuarios | Guarda dirección, foto y datos del médico (para recetas) |
| 7 | **Exportar reportes / Visor de columnas** | Botones en cada tabla | Permite exportar listados y ocultar columnas |
| 8 | **Campo "Colonia"** | Clientes | Útil para ubicar al cliente en Tuxtla |
| 9 | **Selector de registros por página** | Combo 10/25/50/100 | El nuestro tiene tamaño fijo |

---

## 4. Problemas detectados (justificación del proyecto)

Material directo para la sección de *problemática* de tu reporte:

### Usabilidad
1. **Paginación de 5 registros por defecto** → 585 clientes = **117 páginas**;
   669 mascotas = 134 páginas; 792 consultas = 159 páginas.
2. **Menú acordeón que desplaza las opciones** al expandirse: al abrir un
   submenú, los ítems de abajo se mueven y el usuario hace clic donde no quería.
3. **No es responsive**: la interfaz no se adapta a celular ni tablet.
4. **Mascoteca con estructura rígida** (solo 6 espacios fijos, Formato-A a F):
   por eso solo tiene **14 registros de 669 mascotas** — prácticamente sin uso.

### Integridad de datos
5. **Fechas inválidas `0000-00-00`** en "Próx. consulta" (el campo es
   obligatorio pero no se usa, así que se guarda una fecha imposible).
6. **Códigos de producto duplicados**: `P-00003` aparece en dos productos
   distintos — no hay restricción de unicidad.
7. **Correos basura**: `00@00`, `00000@000`, `00Q@00` — el campo es obligatorio
   aunque muchos clientes no dan correo, así que se llena con relleno.
8. **Sin alerta de stock bajo**: un producto con stock 0 se ve igual que uno con
   stock 5.

### Seguridad
9. **Borrado por GET sin protección**: los botones "Borrar" apuntan a
   `delete.php?id_producto=15`. Basta con abrir esa URL para eliminar el
   registro — vulnerable a CSRF y a borrados accidentales por rastreadores.
10. **Listado de directorios habilitado** en la raíz del sitio: `homepet.com.mx`
    muestra la estructura completa de carpetas (`admin/`, `app/`, `public/`,
    `pruebas.php`, `__MACOSX/`), dándole a un atacante un mapa del sistema.
11. **Contraseñas débiles** en cuentas con acceso a 585 expedientes de clientes.

### Mantenimiento
12. **Enlace roto** en el pie de página, apunta a `http://localhost/vetgram`
    (rastro del entorno de desarrollo del programador anterior).

---

## 5. Cómo el sistema nuevo ya resuelve estos problemas

| Problema anterior | Solución en VetGram |
|---|---|
| 117 páginas de 5 registros | Listados completos con **buscador instantáneo** |
| Buscar entre mascotas homónimas | **Buscador inteligente cruzado** (nombre + dueño + raza) |
| No responsive | **Mobile-first**: sidebar colapsa a menú hamburguesa |
| Borrado por GET | Confirmación en modal + **borrado protegido** (rechaza si el registro está en uso) |
| Códigos duplicados | Restricción `unique` en el esquema |
| Fechas `0000-00-00` | Campos opcionales que guardan `NULL`, no fechas falsas |
| Correos basura | Correo **opcional** (solo nombre y teléfono son obligatorios) |
| Sin alerta de stock | **Badge rojo con ⚠** cuando stock ≤ mínimo |
| Imágenes sin comprimir | Compresión **Canvas → WebP** (~99% menos peso) |
| Recetas sin contexto | **Vinculación estricta** receta → consulta |
| Sin control de caja | **Corte del día** (Reporte Z) con desglose por método de pago |
| Sin reportes | **Panel de reportes mensuales** con gráficos y comparativa |

---

## 6. Plan sugerido de desarrollo (siguiente fase)

Ordenado por impacto en el trabajo diario de la clínica:

1. **Escáner de código de barras** en el POS (campo que enfoca automáticamente
   y agrega el producto al leer el código).
2. **Cálculo de cambio y pago mixto** en el carrito.
3. **Descuento por línea** además del global.
4. **Módulo de formatos imprimibles** (Eutanasia, Certificado Sanitario,
   consentimiento de Estética) reutilizando la lógica de impresión de recetas.
5. **Módulo de Veterinarios** con cédula profesional y firma para las recetas.
6. **Exportar listados** (CSV/PDF) desde las tablas.
7. **Migración de datos** desde la base de datos actual (585 clientes,
   669 mascotas, 792 consultas).
