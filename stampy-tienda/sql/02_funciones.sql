-- =========================================================
-- Estampy — 02 · Funciones de inventario (atómicas)
-- Córrelo después de 01_esquema.sql.
--
-- p_items es un arreglo JSON: [{"id": "...", "talla": "M" | null, "qty": 3}, ...]
-- Reglas (docs/MODELO.md):
--   · modo_stock = 'pedido'  → se ignora (se produce al pedir, sin límite).
--   · modo_stock = 'stock' con tallas  → usa stock_tallas[talla].
--   · modo_stock = 'stock' sin tallas  → usa stock.
-- Las líneas repetidas (mismo producto y talla con otro color o diseño)
-- se suman antes de comprobar.
--
-- Cada llamada vía supabase.rpc() corre en UNA transacción: si algo
-- falla, no se descuenta nada.
-- =========================================================

-- Agrupa y normaliza las líneas: talla null para productos sin tallas.
create or replace function public._stampy_lineas(p_items jsonb)
returns table (id text, talla text, qty integer)
language sql
stable
set search_path = public
as $$
  select e.id,
         case when jsonb_array_length(coalesce(p.tallas, '[]'::jsonb)) > 0 then e.talla else null end as talla,
         sum(e.qty)::integer as qty
  from (
    select x->>'id' as id,
           nullif(x->>'talla', '') as talla,
           (x->>'qty')::integer as qty
    from jsonb_array_elements(p_items) x
  ) e
  left join public.productos p on p.id = e.id
  group by 1, 2
  order by 1, 2;
$$;

-- ---------------------------------------------------------
-- reservar_stock: comprueba TODO y, solo si alcanza, descuenta TODO.
-- Si falta algo lanza una excepción cuyo mensaje empieza por
-- 'STOCK_INSUFICIENTE: ' seguido de los faltantes separados por ' | '.
-- Devuelve [{id, talla, qty, restante}] de lo que sí se descontó.
-- ---------------------------------------------------------
create or replace function public.reservar_stock(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r           record;
  prod        record;
  disponible  integer;
  restante    integer;
  faltantes   text[] := '{}';
  resultado   jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'reservar_stock: se esperaba un arreglo de productos';
  end if;

  -- Bloquea las filas involucradas, siempre en el mismo orden (por id)
  -- para que dos pedidos simultáneos no se interbloqueen.
  perform 1
  from public.productos
  where id in (select distinct x->>'id' from jsonb_array_elements(p_items) x)
  order by id
  for update;

  -- 1) Comprobar todo
  for r in select * from public._stampy_lineas(p_items) loop
    if r.qty is null or r.qty <= 0 then
      raise exception 'reservar_stock: cantidad inválida para %', r.id;
    end if;

    select * into prod from public.productos where id = r.id;
    if not found then
      faltantes := faltantes || format('%s (no existe)', r.id);
      continue;
    end if;
    if prod.modo_stock <> 'stock' then
      continue;
    end if;

    if jsonb_array_length(prod.tallas) > 0 then
      if r.talla is null or not (prod.tallas ? r.talla) then
        faltantes := faltantes || format('%s (talla %s no existe)', prod.nombre, coalesce(r.talla, 'sin indicar'));
        continue;
      end if;
      disponible := coalesce((prod.stock_tallas->>r.talla)::integer, 0);
    else
      disponible := coalesce(prod.stock, 0);
    end if;

    if disponible < r.qty then
      faltantes := faltantes || format('%s%s: pediste %s, quedan %s',
        prod.nombre,
        case when r.talla is not null then ' talla ' || r.talla else '' end,
        r.qty, greatest(disponible, 0));
    end if;
  end loop;

  if coalesce(array_length(faltantes, 1), 0) > 0 then
    raise exception 'STOCK_INSUFICIENTE: %', array_to_string(faltantes, ' | ')
      using errcode = 'P0001';
  end if;

  -- 2) Descontar todo
  for r in select * from public._stampy_lineas(p_items) loop
    select * into prod from public.productos where id = r.id;
    if not found or prod.modo_stock <> 'stock' then
      continue;
    end if;

    if jsonb_array_length(prod.tallas) > 0 then
      restante := coalesce((prod.stock_tallas->>r.talla)::integer, 0) - r.qty;
      update public.productos
         set stock_tallas = jsonb_set(stock_tallas, array[r.talla], to_jsonb(restante), true),
             stock_rev = stock_rev + 1,
             actualizado = now()
       where id = r.id;
    else
      restante := coalesce(prod.stock, 0) - r.qty;
      update public.productos
         set stock = restante,
             stock_rev = stock_rev + 1,
             actualizado = now()
       where id = r.id;
    end if;

    resultado := resultado || jsonb_build_object('id', r.id, 'talla', r.talla, 'qty', r.qty, 'restante', restante);
  end loop;

  return resultado;
end;
$$;

-- ---------------------------------------------------------
-- devolver_stock: suma de vuelta (cancelaciones). Nunca falla por
-- stock; ignora productos inexistentes o bajo pedido.
-- Devuelve [{id, talla, qty, restante}].
-- ---------------------------------------------------------
create or replace function public.devolver_stock(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r          record;
  prod       record;
  restante   integer;
  resultado  jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'devolver_stock: se esperaba un arreglo de productos';
  end if;

  perform 1
  from public.productos
  where id in (select distinct x->>'id' from jsonb_array_elements(p_items) x)
  order by id
  for update;

  for r in select * from public._stampy_lineas(p_items) loop
    if r.qty is null or r.qty <= 0 then
      continue;
    end if;
    select * into prod from public.productos where id = r.id;
    if not found or prod.modo_stock <> 'stock' then
      continue;
    end if;

    if jsonb_array_length(prod.tallas) > 0 then
      if r.talla is null then
        continue;
      end if;
      restante := coalesce((prod.stock_tallas->>r.talla)::integer, 0) + r.qty;
      update public.productos
         set stock_tallas = jsonb_set(stock_tallas, array[r.talla], to_jsonb(restante), true),
             stock_rev = stock_rev + 1,
             actualizado = now()
       where id = r.id;
    else
      restante := coalesce(prod.stock, 0) + r.qty;
      update public.productos
         set stock = restante,
             stock_rev = stock_rev + 1,
             actualizado = now()
       where id = r.id;
    end if;

    resultado := resultado || jsonb_build_object('id', r.id, 'talla', r.talla, 'qty', r.qty, 'restante', restante);
  end loop;

  return resultado;
end;
$$;

-- Solo el backend (service_role) puede ejecutarlas. Son SECURITY DEFINER,
-- así que es importante quitarle el permiso a anon y authenticated.
revoke all on function public._stampy_lineas(jsonb)  from public, anon, authenticated;
revoke all on function public.reservar_stock(jsonb)  from public, anon, authenticated;
revoke all on function public.devolver_stock(jsonb)  from public, anon, authenticated;
grant execute on function public._stampy_lineas(jsonb) to service_role;
grant execute on function public.reservar_stock(jsonb) to service_role;
grant execute on function public.devolver_stock(jsonb) to service_role;
