-- =========================================================
-- Estampy — 04 · Usuarios del panel
--
--  ██  EDITA ESTE ARCHIVO ANTES DE CORRERLO  ██
--
--  1. Cambia cada 'CAMBIA-ESTA-CLAVE-…' por una clave REAL, larga y única
--     (mínimo 12 caracteres). Si dejas un marcador, el script se detiene.
--  2. Córrelo en el SQL Editor de Supabase.
--  3. NO GUARDES la versión con claves reales: cierra la pestaña sin
--     guardar la consulta y NUNCA hagas commit de este archivo con claves
--     reales. En el repositorio solo deben existir los marcadores.
--
-- Las claves se guardan cifradas con bcrypt (crypt + gen_salt('bf')).
-- Roles: admin (todo) · ventas (pedidos, pagos, clientes) ·
--        almacen (pedidos, inventario, envíos).
-- Volver a correrlo actualiza nombre, rol, cargo y clave de esos usuarios.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

drop table if exists _nuevos_usuarios;
create temporary table _nuevos_usuarios (
  usuario text, nombre text, rol text, cargo text, clave text
);

insert into _nuevos_usuarios (usuario, nombre, rol, cargo, clave) values
  -- usuario       nombre                 rol        cargo                    clave
  ('admin',        'Administración',      'admin',   'Dueño / administrador', 'CAMBIA-ESTA-CLAVE-1'),
  ('ventas',       'Equipo de ventas',    'ventas',  'Atención al cliente',   'CAMBIA-ESTA-CLAVE-2'),
  ('taller',       'Taller',              'almacen', 'Producción y despacho', 'CAMBIA-ESTA-CLAVE-3');

do $$
begin
  if exists (select 1 from _nuevos_usuarios where clave ilike 'CAMBIA-ESTA-CLAVE%') then
    raise exception 'Todavía hay claves de ejemplo (CAMBIA-ESTA-CLAVE…). Edita 04_usuarios.sql con claves reales antes de correrlo.';
  end if;
  if exists (select 1 from _nuevos_usuarios where length(clave) < 12) then
    raise exception 'Cada clave debe tener al menos 12 caracteres.';
  end if;
end $$;

insert into public.usuarios (usuario, nombre, rol, cargo, clave_hash)
select lower(usuario), nombre, rol, cargo,
       extensions.crypt(clave, extensions.gen_salt('bf', 10))
from _nuevos_usuarios
on conflict (usuario) do update
  set nombre     = excluded.nombre,
      rol        = excluded.rol,
      cargo      = excluded.cargo,
      clave_hash = excluded.clave_hash,
      activo     = true;

drop table if exists _nuevos_usuarios;

-- Para desactivar a alguien sin borrarlo:
--   update public.usuarios set activo = false where usuario = 'ventas';
