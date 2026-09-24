-- =========================================================
-- Estampy — 03 · Storage (archivos)
-- Córrelo después de 02_funciones.sql.
--
-- Dos buckets PÚBLICOS DE LECTURA y SIN políticas de escritura:
--   · productos → fotos del catálogo (las sube el panel vía /api/producto/:id/imagen)
--   · disenos   → arte que adjuntan los clientes (vía /api/diseno)
--
-- "Público" significa que cualquiera que tenga la URL exacta puede abrir
-- el archivo (así el equipo lo abre desde el panel o WhatsApp). Los nombres
-- son aleatorios (AAAA/MM/<uuid>.<ext>) y no se puede listar el bucket sin
-- una política, así que no se pueden adivinar. Aun así: no es un lugar
-- para documentos confidenciales.
--
-- No se crean políticas en storage.objects: solo el backend, con la
-- service_role key, puede subir, reemplazar o borrar.
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('productos', 'productos', true, 6291456,              -- 6 MB
     array['image/png', 'image/jpeg', 'image/webp']),
  ('disenos',   'disenos',   true, 8388608,              -- 8 MB
     array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
