-- ============================================================
-- schema.sql — ESQUEMA COMPLETO de la base de datos VetGram.
--
-- CÓMO USAR: en tu proyecto de Supabase, abre "SQL Editor",
-- pega TODO este archivo y ejecuta (Run). Es idempotente en lo
-- posible, pero está pensado para correrse UNA vez en un proyecto
-- nuevo.
--
-- El esquema replica exactamente los tipos de types/index.ts y las
-- reglas de negocio que hoy están en services/db.ts (mock):
--   * No borrar clientes con mascotas       -> FK ON DELETE RESTRICT
--   * No borrar razas/categorías usadas     -> FK ON DELETE RESTRICT
--   * Venta descuenta stock sin carreras    -> función registrar_venta
--   * Compra aumenta stock                  -> función registrar_compra
-- ============================================================

-- gen_random_uuid() para llaves primarias
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) PERFILES: datos de empleado ligados a Supabase Auth.
--    auth.users guarda email/contraseña; aquí va nombre y ROL.
-- ------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'recepcion'
    check (rol in ('administrador', 'veterinario', 'recepcion')),
  creado_en timestamptz not null default now()
);

-- Trigger: al registrarse un usuario en Auth se crea su perfil
-- automáticamente (el nombre puede venir en la metadata del alta).
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    coalesce(new.raw_user_meta_data ->> 'rol', 'recepcion')
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- ------------------------------------------------------------
-- 2) CLIENTES (dueños de mascotas)
-- ------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellidos text not null default '',
  telefono text not null,
  email text,
  direccion text,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3) CATÁLOGOS: especies, razas y categorías de producto
-- ------------------------------------------------------------
create table public.especies (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table public.razas (
  id uuid primary key default gen_random_uuid(),
  -- RESTRICT: no se borra una especie que tenga razas
  especie_id uuid not null references public.especies (id) on delete restrict,
  nombre text not null,
  unique (especie_id, nombre) -- sin razas duplicadas dentro de una especie
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

-- ------------------------------------------------------------
-- 4) MASCOTAS
-- ------------------------------------------------------------
create table public.mascotas (
  id uuid primary key default gen_random_uuid(),
  -- RESTRICT: replica la regla del mock "no borrar cliente con mascotas"
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  nombre text not null,
  especie_id uuid not null references public.especies (id) on delete restrict,
  raza_id uuid not null references public.razas (id) on delete restrict,
  sexo text not null check (sexo in ('macho', 'hembra')),
  fecha_nacimiento date,
  color text,
  foto_url text, -- para Supabase Storage a futuro
  creado_en timestamptz not null default now()
);

create index idx_mascotas_cliente on public.mascotas (cliente_id);

-- VISTA para el buscador inteligente: mascota + dueño + raza + especie
-- en una sola consulta (reemplaza a buscarMascotasAvanzado del mock).
create or replace view public.mascotas_detalle as
select
  m.*,
  (c.nombre || ' ' || c.apellidos) as nombre_dueno,
  r.nombre as nombre_raza,
  e.nombre as nombre_especie
from public.mascotas m
join public.clientes c on c.id = m.cliente_id
join public.razas r on r.id = m.raza_id
join public.especies e on e.id = m.especie_id;

-- ------------------------------------------------------------
-- 5) EXPEDIENTE CLÍNICO: consultas, recetas y vacunas
-- ------------------------------------------------------------
create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  -- CASCADE: si se borra la mascota, su expediente se va con ella
  mascota_id uuid not null references public.mascotas (id) on delete cascade,
  veterinario_id uuid not null references public.perfiles (id),
  fecha date not null default current_date,
  motivo text not null,
  diagnostico text not null,
  tratamiento text,
  peso_kg numeric(6, 2),      -- signos vitales opcionales
  temperatura_c numeric(4, 1),
  notas text
);

create index idx_consultas_mascota on public.consultas (mascota_id);

create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null references public.mascotas (id) on delete cascade,
  -- VINCULACIÓN ESTRICTA: toda receta pertenece a una consulta.
  -- NOT NULL + CASCADE: sin consultas no hay recetas huérfanas.
  consulta_id uuid not null references public.consultas (id) on delete cascade,
  veterinario_id uuid not null references public.perfiles (id),
  fecha date not null default current_date,
  -- Los medicamentos van como jsonb (siempre se leen junto a la receta):
  -- [{ "nombre", "dosis", "frecuencia", "duracion", "indicaciones" }, ...]
  medicamentos jsonb not null default '[]'::jsonb,
  observaciones text
);

create index idx_recetas_mascota on public.recetas (mascota_id);

create table public.vacunas (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null references public.mascotas (id) on delete cascade,
  nombre text not null,
  fecha_aplicacion date not null default current_date,
  proxima_dosis date, -- si existe, alimenta las alertas de refuerzo
  lote text,
  veterinario_id uuid not null references public.perfiles (id)
);

create index idx_vacunas_mascota on public.vacunas (mascota_id);
create index idx_vacunas_proxima on public.vacunas (proxima_dosis)
  where proxima_dosis is not null; -- índice parcial: solo las que alertan

-- ------------------------------------------------------------
-- 6) INVENTARIO Y PUNTO DE VENTA
-- ------------------------------------------------------------
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  codigo text not null unique,
  nombre text not null,
  descripcion text,
  precio_compra numeric(10, 2) not null default 0,
  precio_venta numeric(10, 2) not null check (precio_venta > 0),
  stock integer not null default 0 check (stock >= 0), -- nunca negativo
  stock_minimo integer not null default 5,
  activo boolean not null default true -- soft delete: no romper historiales
);

-- Folios consecutivos legibles para tickets (V-0001, C-0001...)
create sequence public.ventas_folio_seq;
create sequence public.compras_folio_seq;

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique
    default ('V-' || lpad(nextval('public.ventas_folio_seq')::text, 4, '0')),
  cliente_id uuid references public.clientes (id), -- null = público general
  usuario_id uuid not null references public.perfiles (id),
  fecha timestamptz not null default now(),
  -- Líneas del ticket como jsonb (copia del nombre/precio al momento de vender)
  items jsonb not null,
  total numeric(10, 2) not null
);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique
    default ('C-' || lpad(nextval('public.compras_folio_seq')::text, 4, '0')),
  proveedor text not null,
  usuario_id uuid not null references public.perfiles (id),
  fecha timestamptz not null default now(),
  items jsonb not null,
  total numeric(10, 2) not null
);

-- ------------------------------------------------------------
-- 7) FUNCIONES RPC: venta y compra como TRANSACCIÓN atómica.
--    POR QUÉ: si dos cajeros venden el último producto a la vez,
--    el "check stock >= 0" + el update atómico garantizan que solo
--    una venta pase. Esto reemplaza a registrarVenta del mock.
--    Desde el frontend: supabase.rpc("registrar_venta", {...})
-- ------------------------------------------------------------
create or replace function public.registrar_venta(
  p_cliente_id uuid,
  p_usuario_id uuid,
  p_items jsonb,
  p_total numeric
)
returns public.ventas
language plpgsql security definer set search_path = public
as $$
declare
  linea jsonb;
  v_venta public.ventas;
  filas_afectadas integer;
begin
  -- Descontamos el stock línea por línea; si no alcanza, abortamos TODO
  for linea in select * from jsonb_array_elements(p_items) loop
    update public.productos
      set stock = stock - (linea ->> 'cantidad')::int
      where id = (linea ->> 'productoId')::uuid
        and stock >= (linea ->> 'cantidad')::int;

    get diagnostics filas_afectadas = row_count;
    if filas_afectadas = 0 then
      raise exception 'Stock insuficiente para el producto %', linea ->> 'nombreProducto';
    end if;
  end loop;

  insert into public.ventas (cliente_id, usuario_id, items, total)
    values (p_cliente_id, p_usuario_id, p_items, p_total)
    returning * into v_venta;

  return v_venta;
end;
$$;

create or replace function public.registrar_compra(
  p_proveedor text,
  p_usuario_id uuid,
  p_items jsonb,
  p_total numeric
)
returns public.compras
language plpgsql security definer set search_path = public
as $$
declare
  linea jsonb;
  v_compra public.compras;
begin
  -- Las compras AUMENTAN el stock (entrada de inventario)
  for linea in select * from jsonb_array_elements(p_items) loop
    update public.productos
      set stock = stock + (linea ->> 'cantidad')::int
      where id = (linea ->> 'productoId')::uuid;
  end loop;

  insert into public.compras (proveedor, usuario_id, items, total)
    values (p_proveedor, p_usuario_id, p_items, p_total)
    returning * into v_compra;

  return v_compra;
end;
$$;

-- ------------------------------------------------------------
-- 8) SEGURIDAD (RLS): solo usuarios AUTENTICADOS acceden a los datos.
--    Para el MVP: cualquier empleado logueado lee/escribe todo, igual
--    que hoy con el mock (la restricción por rol la aplica la UI).
--    TODO (endurecer después): políticas por rol leyendo perfiles.rol,
--    ej. "solo administrador borra productos".
-- ------------------------------------------------------------
alter table public.perfiles   enable row level security;
alter table public.clientes   enable row level security;
alter table public.especies   enable row level security;
alter table public.razas      enable row level security;
alter table public.categorias enable row level security;
alter table public.mascotas   enable row level security;
alter table public.consultas  enable row level security;
alter table public.recetas    enable row level security;
alter table public.vacunas    enable row level security;
alter table public.productos  enable row level security;
alter table public.ventas     enable row level security;
alter table public.compras    enable row level security;

-- Una política amplia por tabla para el MVP (empleados autenticados)
create policy "empleados_todo" on public.perfiles   for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.clientes   for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.especies   for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.razas      for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.categorias for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.mascotas   for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.consultas  for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.recetas    for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.vacunas    for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.productos  for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.ventas     for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.compras    for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 9) DATOS SEMILLA: catálogos iniciales (los mismos del mock)
-- ------------------------------------------------------------
insert into public.especies (nombre) values ('Perro'), ('Gato'), ('Ave');

insert into public.razas (especie_id, nombre)
select e.id, r.nombre
from (values
  ('Perro', 'Labrador'), ('Perro', 'Pastor Alemán'), ('Perro', 'Chihuahua'), ('Perro', 'Criollo'),
  ('Gato', 'Siamés'), ('Gato', 'Persa'), ('Gato', 'Doméstico'),
  ('Ave', 'Periquito')
) as r (especie, nombre)
join public.especies e on e.nombre = r.especie;

insert into public.categorias (nombre)
values ('Alimento'), ('Medicamento'), ('Accesorio'), ('Higiene');

-- ------------------------------------------------------------
-- 10) MÓDULOS DE LA FASE DE AJUSTES
--     (configuración del ticket, fotos, documentos, corte de caja)
-- ------------------------------------------------------------

-- Método de pago de cada venta (alimenta el corte de caja)
alter table public.ventas add column metodo_pago text not null default 'efectivo'
  check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia'));

-- Configuración de la clínica: UNA sola fila (id fijo = 1).
-- El check (id = 1) impide crear filas extra por accidente.
create table public.configuracion (
  id integer primary key default 1 check (id = 1),
  nombre text not null default 'VetGram',
  direccion text not null default '',
  telefono text not null default '',
  mensaje_despedida text not null default '¡Gracias por su compra!',
  -- URL pública del logo en el bucket "fotos" (clinica/logo.webp);
  -- se imprime en tickets y en el membrete de las recetas
  logo_url text not null default ''
);
insert into public.configuracion (id) values (1); -- fila inicial con defaults

-- Documentos médicos: la tabla guarda METADATOS; el archivo real vive
-- en el bucket PRIVADO "documentos" de Storage (crear en Storage > New
-- bucket, SIN marcar público; leer con createSignedUrl por seguridad).
create table public.documentos_medicos (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null references public.mascotas (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('pdf', 'imagen')),
  ruta_storage text not null, -- ej. mascotas/<id>/1720000000-analisis.pdf
  tamano_kb integer not null,
  fecha date not null default current_date,
  subido_por_id uuid not null references public.perfiles (id)
);
create index idx_documentos_mascota on public.documentos_medicos (mascota_id);

-- Cortes de caja: unique(fecha) garantiza UN corte por día a nivel BD
create table public.cortes_caja (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  total_vendido numeric(10, 2) not null,
  numero_tickets integer not null,
  por_metodo jsonb not null, -- { "efectivo": 0, "tarjeta": 0, "transferencia": 0 }
  usuario_id uuid not null references public.perfiles (id),
  cerrado_en timestamptz not null default now()
);

-- NOTA: la columna foto_url de mascotas y productos guardará la URL
-- pública del bucket "fotos" (ese bucket SÍ puede ser público: son
-- avatares y fotos de catálogo, no información sensible).
alter table public.productos add column foto_url text;

alter table public.configuracion enable row level security;
alter table public.documentos_medicos enable row level security;
alter table public.cortes_caja enable row level security;
create policy "empleados_todo" on public.configuracion for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.documentos_medicos for all to authenticated using (true) with check (true);
create policy "empleados_todo" on public.cortes_caja for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- 11) POS AVANZADO: descuentos y cancelación de tickets
-- ------------------------------------------------------------

-- Desglose del cobro: subtotal - descuento = total
alter table public.ventas add column subtotal numeric(10, 2) not null default 0;
alter table public.ventas add column descuento numeric(10, 2) not null default 0;

-- Estado del ticket: los cancelados NO se borran (auditoría y folios
-- continuos); solo cambian de estado y se excluyen de los reportes.
alter table public.ventas add column estado text not null default 'completada'
  check (estado in ('completada', 'cancelada'));
alter table public.ventas add column cancelada_en timestamptz;

-- Actualizamos registrar_venta para recibir el desglose del descuento
create or replace function public.registrar_venta(
  p_cliente_id uuid,
  p_usuario_id uuid,
  p_items jsonb,
  p_subtotal numeric,
  p_descuento numeric,
  p_total numeric,
  p_metodo_pago text
)
returns public.ventas
language plpgsql security definer set search_path = public
as $$
declare
  linea jsonb;
  v_venta public.ventas;
  filas_afectadas integer;
begin
  for linea in select * from jsonb_array_elements(p_items) loop
    update public.productos
      set stock = stock - (linea ->> 'cantidad')::int
      where id = (linea ->> 'productoId')::uuid
        and stock >= (linea ->> 'cantidad')::int;

    get diagnostics filas_afectadas = row_count;
    if filas_afectadas = 0 then
      raise exception 'Stock insuficiente para el producto %', linea ->> 'nombreProducto';
    end if;
  end loop;

  insert into public.ventas (cliente_id, usuario_id, items, subtotal, descuento, total, metodo_pago)
    values (p_cliente_id, p_usuario_id, p_items, p_subtotal, p_descuento, p_total, p_metodo_pago)
    returning * into v_venta;

  return v_venta;
end;
$$;

-- cancelar_venta: transacción atómica que DEVUELVE el stock y marca
-- el ticket como cancelado (espejo de cancelarVenta en services/db.ts).
create or replace function public.cancelar_venta(p_venta_id uuid)
returns public.ventas
language plpgsql security definer set search_path = public
as $$
declare
  linea jsonb;
  v_venta public.ventas;
begin
  select * into v_venta from public.ventas where id = p_venta_id for update;
  if not found then
    raise exception 'Venta no encontrada';
  end if;
  if v_venta.estado = 'cancelada' then
    raise exception 'Este ticket ya fue cancelado.';
  end if;

  -- Cada línea vendida regresa su cantidad al inventario
  for linea in select * from jsonb_array_elements(v_venta.items) loop
    update public.productos
      set stock = stock + (linea ->> 'cantidad')::int
      where id = (linea ->> 'productoId')::uuid;
  end loop;

  update public.ventas
    set estado = 'cancelada', cancelada_en = now()
    where id = p_venta_id
    returning * into v_venta;

  return v_venta;
end;
$$;

-- ------------------------------------------------------------
-- 12) MÓDULO CLÍNICO AVANZADO: antecedentes y consulta completa
-- ------------------------------------------------------------

-- Antecedentes: información BASE del paciente. unique(mascota_id)
-- garantiza UNA ficha por mascota (la app hace upsert sobre ella).
create table public.antecedentes (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null unique references public.mascotas (id) on delete cascade,
  enfermedades_previas text,
  lugar_vive text,
  otras_mascotas text,
  vacunas_desparasitaciones text,
  prevencion_parasitos text,
  alergias text,
  actualizado_en timestamptz not null default now()
);

alter table public.antecedentes enable row level security;
create policy "empleados_todo" on public.antecedentes for all to authenticated using (true) with check (true);

-- Campos del formulario clínico completo en `consultas`:
alter table public.consultas add column tipo_servicio text;
alter table public.consultas add column condicion_corporal integer
  check (condicion_corporal between 1 and 9); -- CC: 1 emaciado, 5 ideal, 9 obeso
alter table public.consultas add column proxima_consulta date;
alter table public.consultas add column progreso text;
-- La revisión por sistemas y vitales complementarios van como jsonb:
-- { "fc", "fr", "pulsoFemoral", "mucosas", "tllc", "cabeza", ... }
alter table public.consultas add column exploracion jsonb;

-- ------------------------------------------------------------
-- 13) CATÁLOGO DE SERVICIOS (alimenta "Tipo de servicio")
-- ------------------------------------------------------------

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  precio numeric(10, 2), -- opcional: hay servicios con precio caso por caso
  descripcion text
);

alter table public.servicios enable row level security;
create policy "empleados_todo" on public.servicios for all to authenticated using (true) with check (true);

-- Semilla del catálogo (misma lista que el mock)
insert into public.servicios (nombre, precio, descripcion) values
  ('Consulta general', 350, null),
  ('Vacunación', 250, null),
  ('Desparasitación', 150, null),
  ('Cirugía', 2500, 'Precio base; varía según procedimiento'),
  ('Estética y baño', 300, null),
  ('Corte de uñas', 80, null),
  ('Profilaxis dental', 900, null),
  ('Rayos X', 600, null),
  ('Urgencia', 500, null),
  ('Seguimiento', 200, null);

-- NOTA: consultas.tipo_servicio guarda el NOMBRE (texto) del servicio;
-- así renombrar un servicio no altera el historial ya capturado. Si a
-- futuro se quiere FK dura, agregar columna servicio_id y migrar.

-- NOTA: los clientes/mascotas/productos de prueba NO se siembran aquí;
-- captúralos desde la propia app para validar los formularios reales.
