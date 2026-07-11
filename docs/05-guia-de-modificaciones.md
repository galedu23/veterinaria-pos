# 05 — Guía de modificaciones (recetario práctico)

Recetas paso a paso para los cambios más comunes. Cada una dice **qué archivos
tocar y en qué orden**. La regla general: **empieza siempre por `types/index.ts`**
— TypeScript te marcará en rojo todo lo demás que falta.

Índice:
[Agregar un campo](#receta-1-agregar-un-campo-a-una-entidad) ·
[Nuevo módulo CRUD](#receta-2-crear-un-módulo-crud-nuevo) ·
[Cambiar permisos de rol](#receta-3-cambiar-qué-rol-ve-qué) ·
[Menú: orden, iconos, nombres](#receta-4-personalizar-el-menú-lateral) ·
[Cambiar colores y estilos](#receta-5-colores-y-estilos) ·
[Datos de prueba](#receta-6-cambiar-los-datos-de-prueba) ·
[Ajustar compresión de fotos](#receta-7-ajustar-la-compresión-de-imágenes) ·
[Publicar cambios](#receta-8-publicar-cambios-en-el-sitio) ·
[Problemas comunes](#problemas-comunes)

---

## Receta 1: Agregar un campo a una entidad

**Ejemplo: agregar "RFC" al cliente.**

1. **`types/index.ts`** — agrega el campo a la interfaz:
   ```ts
   export interface Cliente {
     // ...campos existentes
     rfc?: string;   // el ? lo hace opcional
   }
   ```
2. **`components/clientes/formulario-cliente.tsx`** — agrega el input:
   - Añade `rfc: ""` al objeto `CAMPOS_VACIOS`.
   - En el `useEffect` de precarga, añade `rfc: cliente.rfc ?? ""`.
   - Copia un bloque `<div className="space-y-1.5">...</div>` con un `<Input>`
     ligado a `campos.rfc`.
   - En `guardar()`, incluye `rfc: campos.rfc.trim() || undefined` en `datos`.
3. **(Opcional) `components/clientes/tabla-clientes.tsx`** — si quieres mostrarlo,
   agrega una `<TableHead>` y su `<TableCell>`.
4. **(Al conectar Supabase)** — `alter table clientes add column rfc text;`

> El mock guarda cualquier campo nuevo automáticamente (los objetos se
> propagan con `...datos`), así que no hay que tocar `services/db.ts`.

---

## Receta 2: Crear un módulo CRUD nuevo

**Ejemplo: un módulo de "Proveedores".** Copia el módulo de Servicios (es el
más simple) y renombra:

1. **`types/index.ts`** — define `interface Proveedor { id: string; nombre: string; ... }`
2. **`services/db.ts`** — agrega el array mock `proveedores` y las funciones
   `getProveedores`, `crearProveedor`, `actualizarProveedor`, `eliminarProveedor`
   (copia las de servicios y renombra).
3. **`components/proveedores/`** — crea `tabla-proveedores.tsx` y
   `formulario-proveedor.tsx` (copia de `components/servicios/`).
4. **`app/(dashboard)/proveedores/page.tsx`** — copia
   `app/(dashboard)/servicios/page.tsx` y ajusta nombres.
5. **`components/layout/nav-items.ts`** — agrega la entrada del menú:
   ```ts
   { titulo: "Proveedores", href: "/proveedores", icono: Truck, roles: ["administrador"] },
   ```
   (importa el icono `Truck` de `lucide-react` arriba).

Listo: por la arquitectura repetida, un módulo nuevo es "buscar y reemplazar".

---

## Receta 3: Cambiar qué rol ve qué

Todo está en **`components/layout/nav-items.ts`**. Cada ítem tiene un array `roles`:

```ts
{ titulo: "Reportes", href: "/reportes", icono: BarChart3, roles: ["administrador"] },
//                                                          ^ agrega "veterinario" aquí
```

Para **ocultar/mostrar un botón** dentro de una página (ej. eliminar), busca
`tienePermiso(usuario, [...])` en el componente y ajusta la lista de roles.

Para **proteger una página completa** por URL, copia el bloque de validación que
tienen `/usuarios` o `/reportes` (el que muestra "Acceso restringido").

---

## Receta 4: Personalizar el menú lateral

También en **`components/layout/nav-items.ts`**:

- **Reordenar módulos:** cambia el orden de los objetos en el array `ITEMS_NAVEGACION`.
- **Cambiar un icono:** importa otro de [lucide.dev](https://lucide.dev) arriba
  del archivo y úsalo en `icono:`.
- **Renombrar un módulo en el menú:** cambia `titulo` (esto NO cambia la URL).

---

## Receta 5: Colores y estilos

- **Tarjetas del dashboard:** array `TARJETAS` en `app/(dashboard)/page.tsx`
  (`color: "bg-yellow-500"`...).
- **Colores del tema (azul primario, etc.):** variables CSS en `app/globals.css`
  (bloque `:root`). Cambiar `--primary` afecta todos los botones azules.
- **Sidebar oscuro:** `tailwind.config.ts`, sección `colors.sidebar`.
- **Cualquier elemento puntual:** son clases Tailwind directas en el JSX
  (`text-blue-700`, `bg-red-600`...). Cámbialas en el componente específico.

---

## Receta 6: Cambiar los datos de prueba

Los arrays al inicio de **`services/db.ts`** (`clientes`, `mascotas`,
`productos`, `ventas`...). Agrega, quita o edita objetos respetando el tipo.

- Las **ventas** usan `fechaHace(n)` (0 = hoy, 31 = hace un mes) para que los
  reportes siempre tengan datos.
- Las **credenciales** de login están en `USUARIOS_MOCK` dentro de `services/auth.ts`.

Recuerda: en modo mock esto solo cambia el punto de partida; nada persiste al F5.

---

## Receta 7: Ajustar la compresión de imágenes

En **`lib/comprimir-imagen.ts`** están los valores por defecto (400px, calidad
0.6). Pero cada uso puede pasar los suyos:

- **Foto de mascota:** en `pet-photo-uploader.tsx` (avatar pequeño).
- **Foto de producto:** en `formulario-producto.tsx` vía `<ImageUploader opciones={...}>`.
- **Logo:** en `formulario-clinica.tsx` (`{ ladoMaximoPx: 300, calidad: 0.8 }`).
- **Documentos (imágenes):** en `documentos-mascota.tsx` (1200px, calidad 0.7 —
  más grande porque un análisis debe seguir siendo legible).

Sube `calidad` (hacia 1) para mejor imagen y más peso; bájala para menos peso.

---

## Receta 8: Publicar cambios en el sitio

Cada vez que quieras que tus cambios aparezcan en la URL de Netlify:

```bash
git add -A
git commit -m "Descripción del cambio"
git push
```

Netlify detecta el push y **redespliega solo** en 2-4 minutos. Detalles en
[`DESPLIEGUE-NETLIFY.md`](../DESPLIEGUE-NETLIFY.md).

> **Antes de subir**, verifica que compila: `npm run build`. Si falla, el mensaje
> te dice el archivo y la línea del problema.

---

## Problemas comunes

### "Couldn't find any 'pages' or 'app' directory" en Netlify
La carpeta `app/` no llegó a GitHub (suele pasar al subir arrastrando por la web).
**Solución:** sube con `git push` (no por la web de GitHub). Si el repo quedó
incompleto: `git push --force`.

### Netlify bloquea el deploy por "critical security vulnerability"
Next.js quedó desactualizado con una CVE. **Solución:**
```bash
npm install next@latest react@latest react-dom@latest
npm run build   # verificar
git add -A && git commit -m "Actualiza Next.js" && git push
```

### Error de webpack / "Couldn't find module" en local
La caché `.next` se corrompió (típico si corriste `build` con el `dev` activo, o
por OneDrive). **Solución:**
```bash
# Detén el servidor (Ctrl+C), luego:
rm -rf .next        # en PowerShell: Remove-Item -Recurse -Force .next
npm run dev
```

### No me deja comprimir la carpeta / "un programa la está usando"
Es el servidor de desarrollo de Node. Deténlo (Ctrl+C en la terminal de
`npm run dev`) antes de comprimir. **Nunca** incluyas `node_modules`, `.next` ni
`.git` en un ZIP — se regeneran con `npm install`.

### OneDrive restaura archivos que borré
OneDrive re-sincroniza archivos eliminados. Si borras un archivo y reaparece,
bórralo de nuevo y haz commit de inmediato. **Recomendación:** mueve el proyecto
fuera de OneDrive (ej. `C:\proyectos\vetgram`) para evitar esto y que todo sea
más rápido.

### Un push da error 403 (permiso denegado)
Windows tiene guardada la credencial de otra cuenta de GitHub. **Solución:**
```powershell
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```
y vuelve a hacer `git push` (se abrirá el navegador para iniciar sesión con la
cuenta correcta).

---

## Checklist antes de dar por terminado un cambio

- [ ] `npm run build` pasa sin errores
- [ ] Lo probaste en `npm run dev` (incluido en móvil, encogiendo la ventana)
- [ ] Si agregaste un campo/tabla, lo anotaste para `supabase/schema.sql`
- [ ] Hiciste `git commit` y `git push` para publicarlo
