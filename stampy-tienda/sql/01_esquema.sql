-- =========================================================
-- Estampy — 01 · Esquema
-- Proyecto de Supabase NUEVO. Córrelo primero, en el SQL Editor.
-- Orden: 01_esquema → 02_funciones → 03_storage → 04_usuarios
--
-- Contrato de datos: docs/MODELO.md (JS en camelCase, Postgres
-- en snake_case). El navegador nunca habla con Supabase: todo
-- pasa por netlify/functions/api.mjs con la service_role key.
-- Por eso RLS queda ACTIVADO y SIN políticas: anon y authenticated
-- no pueden leer ni escribir nada; service_role se salta RLS.
-- =========================================================

-- ---------------------------------------------------------
-- Usuarios del panel
-- ---------------------------------------------------------
create table if not exists public.usuarios (
  id          bigint generated always as identity primary key,
  usuario     text not null unique check (usuario = lower(usuario) and length(usuario) between 3 and 40),
  nombre      text not null,
  rol         text not null check (rol in ('admin', 'ventas', 'almacen')),
  cargo       text,
  clave_hash  text not null,                 -- bcrypt ($2a$ / $2b$)
  activo      boolean not null default true,
  creado      timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Productos (ver docs/MODELO.md → Producto)
-- ---------------------------------------------------------
create table if not exists public.productos (
  id               text primary key,
  nombre           text not null,
  linea            text,
  categoria        text,           -- franelas · deportiva · chemises · ninos · accesorios · hogar
  categoria_label  text,
  precio           numeric(10,2) not null default 0 check (precio >= 0),
  precio_anterior  numeric(10,2),
  precios_mayor    jsonb not null default '[]'::jsonb,   -- [{desde, precio}]
  rating           numeric(3,2) not null default 0,
  reviews          integer not null default 0,
  modo_stock       text not null default 'pedido' check (modo_stock in ('pedido', 'stock')),
  tallas           jsonb not null default '[]'::jsonb,   -- ["S","M",...]; [] = sin talla
  stock_tallas     jsonb not null default '{}'::jsonb,   -- {"S": 10, "M": 4}; solo modo 'stock' con tallas
  stock            integer not null default 0 check (stock >= 0),  -- solo modo 'stock' sin tallas
  -- Revisión del inventario: la suben SOLO las funciones de 02_funciones.sql
  -- (pedidos creados, cancelados o reactivados). El backend la usa para no
  -- pisar el stock con una copia vieja del catálogo que reenvíe el panel.
  stock_rev        integer not null default 0,
  colores          jsonb not null default '[]'::jsonb,   -- [{nombre, hex}]; el cliente elige uno (prendas: Blanco, Negro, Rojo, Azul)
  -- Piezas del simulador (ver docs/MODELO.md → Logo en prendas). null = no usa el simulador.
  prenda           jsonb,                                -- prendas {tipo: franela|chemise|manga-larga, cuello: redondo|v, infantil}; objetos {tipo: taza|gorra|mousepad|cojin}
  ubicaciones      jsonb not null default '[]'::jsonb,   -- dónde puede ir el logo: ["frente","espalda","manga-izq","manga-der"] (taza/cojín: frente y espalda; gorra/mousepad: frente)
  permite_diseno   boolean not null default true,
  dias_produccion  integer not null default 0 check (dias_produccion >= 0),
  pedido_minimo    integer not null default 1 check (pedido_minimo >= 1),
  etiquetas        jsonb not null default '[]'::jsonb,
  destacados       jsonb not null default '[]'::jsonb,
  resumen          text,
  descripcion      text,
  specs            jsonb not null default '{}'::jsonb,
  imagenes         jsonb not null default '[]'::jsonb,
  opiniones        jsonb not null default '[]'::jsonb,
  activo           boolean not null default true,        -- borrado lógico
  creado           timestamptz not null default now(),
  actualizado      timestamptz not null default now(),
  constraint productos_precios_mayor_arreglo check (jsonb_typeof(precios_mayor) = 'array'),
  constraint productos_tallas_arreglo        check (jsonb_typeof(tallas) = 'array'),
  constraint productos_stock_tallas_objeto   check (jsonb_typeof(stock_tallas) = 'object'),
  constraint productos_colores_arreglo       check (jsonb_typeof(colores) = 'array'),
  constraint productos_prenda_objeto         check (prenda is null or jsonb_typeof(prenda) = 'object'),
  constraint productos_ubicaciones_arreglo   check (jsonb_typeof(ubicaciones) = 'array')
);

create index if not exists productos_activo_idx on public.productos (activo);

-- ---------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------
create table if not exists public.pedidos (
  codigo              text primary key check (codigo ~ '^EST-[0-9]{4}-[0-9]{4}[A-Z]{2}$'),
  creado              timestamptz not null default now(),
  eta                 timestamptz,
  items               jsonb not null default '[]'::jsonb,  -- [{id, nombre, qty, precio, img, talla, color, diseno}]
                                                            -- diseno = {nota, archivo, ubicaciones, prenda, logoPorWhatsApp}
  cliente             jsonb not null default '{}'::jsonb,
  entrega             jsonb not null default '{}'::jsonb,
  pago                jsonb not null default '{}'::jsonb,
  totales             jsonb not null default '{}'::jsonb,  -- calculados por el servidor
  estado_index        integer not null default 0 check (estado_index between 0 and 5),
  pago_estado         text not null default 'reportado',   -- reportado · verificado · rechazado · por-cobrar
  pago_verificado     timestamptz,
  pago_motivo         text,
  cancelado           boolean not null default false,
  motivo_cancelacion  text,
  cancelado_el        timestamptz,
  notas               jsonb not null default '[]'::jsonb,
  historial           jsonb not null default '[]'::jsonb,
  guia                text,
  courier             text,
  repartidor          jsonb,
  extra               jsonb not null default '{}'::jsonb,  -- campos del panel sin columna propia
  actualizado         timestamptz not null default now()
);

create index if not exists pedidos_creado_idx on public.pedidos (creado desc);

-- ---------------------------------------------------------
-- Configuración de la tienda (una sola fila, id = 1)
-- ---------------------------------------------------------
create table if not exists public.configuracion (
  id           integer primary key default 1 check (id = 1),
  datos        jsonb not null default '{}'::jsonb,
  actualizado  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Bitácora de actividad
-- ---------------------------------------------------------
create table if not exists public.bitacora (
  id          bigint generated always as identity primary key,
  fecha       timestamptz not null default now(),
  usuario     text,
  rol         text,
  tipo        text not null,
  mensaje     text,
  referencia  text
);

create index if not exists bitacora_fecha_idx on public.bitacora (fecha desc);

-- ---------------------------------------------------------
-- Seguridad: RLS encendido y sin políticas.
-- Solo el backend (service_role) puede leer y escribir.
-- ---------------------------------------------------------
alter table public.usuarios      enable row level security;
alter table public.productos     enable row level security;
alter table public.pedidos       enable row level security;
alter table public.configuracion enable row level security;
alter table public.bitacora      enable row level security;
