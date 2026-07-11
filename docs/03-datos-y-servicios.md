# 03 — Datos y servicios

Este documento describe **el modelo de datos** (los tipos = futuras tablas) y
**todas las funciones** de la capa de servicios. Es tu referencia cuando
necesites saber qué función llamar o qué campos tiene una entidad.

---

## 1. El modelo de datos (`types/index.ts`)

Cada `interface` de este archivo es el **espejo exacto de una tabla de Supabase**.
Los tipos y sus relaciones:

```
Usuario (perfiles) ──< Consulta, Receta, Vacuna, Venta, Compra  (quién lo hizo)

Cliente ──< Mascota ──< Consulta ──< Receta
                    ├──< Vacuna
                    ├──< DocumentoMedico
                    └──1 Antecedentes   (uno a uno)

Especie ──< Raza ──< Mascota
Categoria ──< Producto ──< (líneas de) Venta / Compra
Servicio  ....>  Consulta.tipoServicio (por nombre)
```

`──<` = "uno a muchos" · `──1` = "uno a uno"

### Entidades principales

| Tipo | Representa | Campos clave |
|---|---|---|
| `Usuario` | Empleado del sistema | `rol` (administrador/veterinario/recepcion) |
| `Cliente` | Dueño de mascotas | nombre, teléfono, email |
| `Mascota` | Paciente | `clienteId`, `especieId`, `razaId`, `fotoUrl` |
| `Antecedentes` | Info base del paciente (1 por mascota) | enfermedades previas, alergias, lugar donde vive... |
| `Consulta` | Visita clínica | `diagnostico` (DX), `condicionCorporal`, `exploracion` (jsonb) |
| `ExploracionFisica` | Revisión por sistemas de una consulta | FC, FR, mucosas + 10 sistemas — va DENTRO de Consulta |
| `Receta` | Prescripción | `consultaId` **obligatorio**, `medicamentos[]` |
| `MedicamentoRecetado` | Un fármaco de una receta | dosis, frecuencia, duración |
| `Vacuna` | Vacuna aplicada | `proximaDosis` (alimenta alertas) |
| `DocumentoMedico` | PDF/imagen del expediente | `tipo`, `dataUrl` |
| `Servicio` | Catálogo de servicios | nombre, precio |
| `Producto` | Ítem de inventario | `stock`, `stockMinimo`, `fotoUrl` |
| `Venta` | Ticket del POS | `items[]`, `descuento`, `metodoPago`, `estado` |
| `Compra` | Entrada de inventario | `items[]`, proveedor |
| `CorteCaja` | Reporte Z de un día | total, `porMetodo` |
| `ConfiguracionClinica` | Datos para tickets/recetas | nombre, logo, mensaje |

> **Regla al agregar un campo:** empieza SIEMPRE por `types/index.ts`. TypeScript
> te marcará en rojo todos los lugares que debes tocar después. Es tu red de seguridad.

---

## 2. `services/auth.ts` — Autenticación y roles

| Función | Qué hace | Reemplazo Supabase |
|---|---|---|
| `login(email, password)` | Valida contra `USUARIOS_MOCK`, guarda sesión en localStorage | `supabase.auth.signInWithPassword()` |
| `logout()` | Borra la sesión | `supabase.auth.signOut()` |
| `getSession()` | Lee el usuario en sesión (o null) | `supabase.auth.getSession()` |
| `getUsuarios()` | Lista de empleados sin contraseñas | `from("perfiles").select("*")` |
| `tienePermiso(usuario, roles[])` | `true` si el rol está permitido | (se queda igual) |

**Las credenciales quemadas** viven en el array `USUARIOS_MOCK` al inicio del
archivo. Para agregar un usuario de prueba, añade un objeto ahí.

---

## 3. `services/config.ts` — Configuración de la clínica

| Función | Qué hace |
|---|---|
| `getConfiguracionClinica()` | Lee de localStorage (con valores por defecto) |
| `guardarConfiguracionClinica(config)` | Persiste en localStorage |

Usa localStorage (no memoria) para **sobrevivir al F5**. En Supabase será una
tabla `configuracion` de una sola fila (upsert).

---

## 4. `services/db.ts` — Acceso a datos (el corazón)

Es el archivo más grande. Está organizado en dos partes:
1. **Arrays mock** al inicio (`clientes`, `mascotas`, `productos`, `ventas`...):
   son los "datos de prueba". Editar aquí = cambiar los datos con los que arranca la app.
2. **Funciones exportadas**: la API que usan las páginas.

Todas son `async` y esperan `simularRed()` (150 ms) para imitar latencia real.

### Lecturas (getters)

| Función | Devuelve |
|---|---|
| `getDashboardStats()` | Métricas de las tarjetas del dashboard |
| `getClientes()` / `getClientePorId(id)` | Clientes |
| `getMascotas()` / `getMascotaPorId(id)` / `getMascotasDeCliente(id)` | Mascotas |
| `buscarMascotasAvanzado(texto)` | **Buscador inteligente** (cruza nombre+dueño+raza) |
| `busquedaGlobal(texto)` | Buscador del header (clientes + mascotas) |
| `getEspecies()` / `getRazas(especieId?)` | Catálogos |
| `getAntecedentesDeMascota(id)` | Ficha de antecedentes |
| `getConsultasDeMascota(id)` | Historial clínico de una mascota |
| `getRecetasDeMascota(id)` / `getVacunasDeMascota(id)` | Recetas / vacunas |
| `getDocumentosDeMascota(id)` | Documentos del expediente |
| `getConsultasGlobal()` / `getRecetasGlobal()` / `getVacunasGlobal()` | Listados de toda la clínica |
| `getVacunasProximas(dias)` | Vacunas por vencer (para alertas) |
| `getServicios()` / `getCategorias()` / `getProductos()` | Catálogos e inventario |
| `getVentas()` / `getCompras()` / `getVentasDelDia()` | Historiales |
| `getCorteDelDia()` | Resumen de caja en vivo |
| `getReporteMensual()` | Todas las métricas del panel de reportes |

### Escrituras (crear / actualizar / eliminar)

| Entidad | Crear | Actualizar | Eliminar |
|---|---|---|---|
| Cliente | `crearCliente` | `actualizarCliente` | `eliminarCliente`\* |
| Mascota | `crearMascota` | `actualizarMascota` | — |
| Antecedentes | `guardarAntecedentes` (upsert) | ↑ | — |
| Consulta | `crearConsulta` | — | — |
| Receta | `crearReceta` | `actualizarReceta` (edición in-place) | — |
| Vacuna | `crearVacuna` | — | — |
| Documento | `subirDocumento` | — | `eliminarDocumento` |
| Servicio | `crearServicio` | `actualizarServicio` | `eliminarServicio`\* |
| Especie/Raza | `crearEspecie` / `crearRaza` | — | `eliminarRaza`\* |
| Categoría | `crearCategoria` | — | `eliminarCategoria`\* |
| Producto | `crearProducto` | `actualizarProducto` | `eliminarProducto` |
| Foto mascota | `subirFotoMascota` | ↑ | — |

\* = **borrado protegido**: rechaza la operación si el registro está en uso
(cliente con mascotas, raza con mascotas, servicio con consultas, etc.).

### Operaciones especiales (transaccionales)

Estas funciones hacen más que guardar — son las **reglas de negocio del POS**:

| Función | Qué hace |
|---|---|
| `registrarVenta(venta)` | Valida stock y lo **descuenta**; genera folio `V-000X` |
| `registrarCompra(compra)` | **Aumenta** stock; genera folio `C-000X` |
| `cancelarVenta(id)` | **Devuelve** el stock y marca el ticket como cancelado (no lo borra) |
| `registrarCorteCaja(usuarioId)` | Congela el total del día (un corte por día) |

> **Por qué importan en Supabase:** estas cuatro se convertirán en **funciones
> RPC transaccionales** (`registrar_venta`, `cancelar_venta`...) — ya escritas
> en `supabase/schema.sql` — para que descontar stock y crear el ticket ocurran
> juntos o no ocurran (evita que dos cajeros vendan el último producto a la vez).

---

## 5. Cómo cambiar los datos de prueba

Los arrays al inicio de `services/db.ts` definen con qué arranca la app:

- **Agregar un cliente/mascota/producto de ejemplo:** añade un objeto al array
  correspondiente respetando el tipo (TypeScript te guía).
- **Las ventas usan fechas relativas:** `fechaHace(0)` = hoy, `fechaHace(31)` =
  hace un mes. Así el corte de caja y los reportes siempre tienen datos frescos.
- **Recuerda:** estos cambios se pierden en cada recarga (es memoria). Solo
  cambian el punto de partida, no persisten lo que capture el usuario.

---

## 6. La regla de oro para Supabase

Cuando conectes la base de datos real, **solo tocas los tres archivos de
`services/`**. El contrato (qué recibe y qué devuelve cada función) NO cambia,
así que ninguna página ni componente se entera. El mapa completo función-por-
función está en [`supabase/README-CONEXION.md`](../supabase/README-CONEXION.md).
