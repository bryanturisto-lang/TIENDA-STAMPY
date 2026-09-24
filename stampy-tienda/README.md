# Estampy — tienda online de sublimación

Tienda de Estampy (franelas, chemises, uniformes deportivos, tazas, gorras,
mousepads y cojines sublimados), con panel interno para el equipo.

- **Frontend:** HTML, CSS y JS estáticos en `public/` (tienda) y `public/admin/` (panel).
- **Backend:** una sola función de Netlify, `netlify/functions/api.mjs`, que atiende `/api/*`.
- **Datos:** Supabase (Postgres + Storage). El navegador **nunca** habla con
  Supabase directamente: todo pasa por la función con la `service_role` key.
- **Contrato de datos:** [`docs/MODELO.md`](docs/MODELO.md). Si cambia, se cambia en tienda, panel y backend.

---

## 1. Crear el proyecto de Supabase

1. Crea un proyecto **nuevo** en [supabase.com](https://supabase.com) (región más cercana: `us-east-1`).
2. Ve a **SQL Editor → New query** y corre, **en este orden**, cada archivo de `sql/`:

| Archivo | Qué hace |
|---|---|
| `sql/01_esquema.sql` | Tablas `usuarios`, `productos`, `pedidos`, `configuracion`, `bitacora`. RLS activado sin políticas (solo el backend entra). |
| `sql/02_funciones.sql` | `reservar_stock` y `devolver_stock`: descuentan y devuelven inventario de forma atómica (todo o nada, con bloqueo de filas). |
| `sql/03_storage.sql` | Buckets `productos` (fotos del catálogo) y `disenos` (arte de los clientes, 8 MB máx., PNG/JPG/WEBP/PDF). |
| `sql/04_usuarios.sql` | Usuarios del panel. **Edítalo antes de correrlo** (ver abajo). |

### Usuarios del panel (`04_usuarios.sql`)

- Reemplaza cada `CAMBIA-ESTA-CLAVE-…` por una clave real de **12 caracteres o más**.
  Si dejas un marcador, el script se detiene con un error a propósito.
- Córrelo, y **cierra la pestaña sin guardar**. No guardes la consulta en Supabase
  ni hagas commit del archivo con claves reales: en el repositorio solo deben existir los marcadores.
- Roles: `admin` (todo), `ventas` (pedidos, pagos, clientes), `almacen` (pedidos, inventario, envíos).
- Para cambiar una clave, edita la fila en el mismo archivo y vuelve a correrlo (actualiza a los existentes).

## 2. Variables de entorno en Netlify

**Site configuration → Environment variables:**

| Variable | Obligatoria | Valor |
|---|---|---|
| `STAMPY_SUPABASE_URL` | sí | Project URL de Supabase (`https://xxxx.supabase.co`) |
| `STAMPY_SUPABASE_SERVICE_KEY` | sí | La **service_role key** (Project Settings → API). Es secreta: nunca en el frontend ni en el repositorio. |
| `STAMPY_SECRET` | sí | Cadena aleatoria de 32+ caracteres para firmar las sesiones del panel. Genera una con `openssl rand -base64 48`. |
| `STAMPY_EVOLUTION_URL` | no | URL de tu servidor de Evolution API (WhatsApp) |
| `STAMPY_EVOLUTION_APIKEY` | no | API key de Evolution |
| `STAMPY_EVOLUTION_INSTANCIA` | no | Nombre de la instancia de WhatsApp |
| `STAMPY_EVOLUTION_GRUPO_INTERNO` | no | ID del grupo del equipo (`1203…@g.us`) para avisos internos |

- **Sin `STAMPY_SECRET` el panel queda deshabilitado:** la tienda funciona, pero
  iniciar sesión y todo lo del panel responde `503` con un mensaje claro.
  No hay clave por defecto. `/api/salud` informa `secretoConfigurado` y `panelHabilitado`.
- La **anon key** de Supabase no se usa en este proyecto.
- Sin las variables de Evolution simplemente no se envían mensajes de WhatsApp.

## 3. Probar en local

```bash
npm install
npm install -g netlify-cli
netlify link          # une la carpeta con tu sitio de Netlify (toma sus variables)
netlify dev
```

Abre `http://localhost:8888/api/salud` — debe responder `{"ok":true, ...}`.

Pruebas de humo (con `netlify dev` corriendo y el catálogo ya sembrado; crean
pedidos y archivos reales, así que úsalas contra un proyecto de pruebas):

```bash
npm test
# con sesión (también cancela el pedido de prueba y devuelve el stock):
STAMPY_TEST_USUARIO=admin STAMPY_TEST_CLAVE='tu-clave' npm test
```

## 4. Primera carga de datos

Entra a `/admin` con un usuario **admin**. Como el catálogo está vacío, el panel
siembra los productos y la configuración de ejemplo de `public/assets/js/data.js`
(vía `POST /api/semilla`, que exige sesión de administrador). Luego ajusta desde el
panel: **Configuración** (tasa BCV, datos de pago, zonas, taller) e **Inventario**.

## 5. Publicar

Sube el contenido de esta carpeta a un repositorio de GitHub y conéctalo en Netlify
(**Add new site → Import an existing project**). No hay paso de compilación:
Netlify publica `public/` e instala las dependencias de la función. Si arrastras la
carpeta en vez de usar Git, la función queda sin dependencias y `/api/salud` fallará.

Antes de abrir la tienda:

- Pon tu dominio en `public/robots.txt` y `public/sitemap.xml` (usan rutas relativas
  y los buscadores piden URLs completas: `https://tudominio.com/...`).
- Si agregas o quitas productos, actualiza la lista de `sitemap.xml`.

---

## Cómo funcionan los archivos de diseño

1. En la ficha del producto el cliente adjunta su arte (PNG, JPG, WEBP o PDF, máx. 8 MB).
2. La tienda llama `STAMPY.api.subirDiseno(file)`:
   - Hasta 4 MB: se manda en base64 a `POST /api/diseno`.
   - De 4 a 8 MB: `POST /api/diseno/firma` da una URL firmada, el navegador sube el
     archivo directo a Supabase Storage y `POST /api/diseno/verificar` lo revisa.
     (Netlify corta el cuerpo de las peticiones en ~6 MB, por eso el camino doble.)
3. El servidor comprueba el **contenido real** (los primeros bytes), no solo la
   extensión: un archivo que no sea PNG/JPG/WEBP/PDF se rechaza o se borra.
4. Se guarda en el bucket `disenos` como `AAAA/MM/<uuid>.<ext>` y responde
   `{ url, ruta, nombre }`, que la tienda guarda en `diseno.archivo` de la línea.
5. El equipo abre el archivo desde el pedido en el panel (la URL es pública pero
   imposible de adivinar; el bucket no se puede listar).
6. Límite de abuso: 20 subidas cada 10 minutos por IP (en memoria, aproximado).
7. Sin servidor (abriendo los archivos con doble clic) no se sube nada: `subirDiseno`
   rechaza con `err.sinServidor = true` y la tienda guarda solo el nombre.

## Prendas: un solo color y el logo donde lo pida el cliente

Las franelas, chemises y mangas largas son **blancas** (un solo color). El cliente sube
su logo y en el simulador (`public/assets/js/mockup.js`) elige dónde va: frente,
espalda, manga izquierda y/o manga derecha, y en cada zona lo mueve y cambia de tamaño
dentro del área de impresión. Detalle en [`docs/MODELO.md`](docs/MODELO.md).

Columnas de `productos` para esto:

| Columna | Tipo | Qué guarda |
|---|---|---|
| `prenda` | `jsonb`, null | `{tipo, cuello, infantil}`. `tipo`: `franela` · `chemise` · `manga-larga`; `cuello`: `redondo` · `v` (la chemise no lleva); `infantil`: medidas × 0,75. `null` = no es prenda (tazas, gorras…). |
| `ubicaciones` | `jsonb`, `[]` | Zonas habilitadas para el logo, en este orden: `frente`, `espalda`, `manga-izq`, `manga-der`. |

- Cada línea del pedido guarda en `diseno` las `ubicaciones` elegidas (zona, posición
  rápida, posición y tamaño en fracciones del área y medidas reales en cm), una copia de
  la `prenda` con su color y `logoPorWhatsApp` (el cliente manda el logo después).
- `POST /api/pedido` limpia todo eso: descarta zonas no habilitadas o repetidas, acota
  los números, y quita la vista previa del logo (`preview`) y cualquier clave desconocida.
  Si la prenda tiene `ubicaciones`, cada línea debe decir dónde va el logo y traer el
  archivo o `logoPorWhatsApp: true`; si no, responde `400` con el motivo en `problemas`.
- El aviso al grupo interno lista, por producto, las tallas y dónde va el logo. El
  mensaje al cliente le dice que la prueba llega con su logo ubicado donde lo pidió.
- En `imagenes`, una referencia `mockup:<idProducto>:<vista>` es válida: la dibuja el
  simulador en el navegador.

## Pedidos, precios e inventario

- **El servidor recalcula todo** al crear un pedido (`POST /api/pedido`): precio por
  unidad con el escalón al mayor (según la cantidad total de cada producto, todas sus
  tallas y colores), pedido mínimo, envío por zona, envío gratis, IVA, 5 % de
  descuento en bolívares, total en Bs y fecha estimada (producción del producto más
  lento + días de la zona). Lo que mande el navegador en precios y totales se ignora.
- **Inventario:** los productos `modoStock: "pedido"` no tienen límite. Los de
  `"stock"` se descuentan por talla (o en total si no llevan talla) con
  `reservar_stock`, todo o nada. Si falta algo, el pedido se rechaza con `409` y la
  lista de faltantes.
- **Cancelar / reactivar** un pedido desde el panel devuelve / vuelve a reservar el
  stock **en el servidor**. Si no hay stock para reactivar, el pedido sigue cancelado.
- La base de datos es la fuente de verdad del stock. Cada producto lleva `stockRev`;
  si el panel guarda el catálogo con una copia vieja (hubo ventas o cancelaciones
  mientras estaba abierto), se guardan los demás cambios pero **no** el stock, y la
  respuesta trae un aviso y el catálogo actualizado.

## Seguridad

- **Nunca** hagas commit de claves reales, de la service_role key ni de `STAMPY_SECRET`.
- Configura `STAMPY_SECRET` (32+ caracteres aleatorios). Si alguna vez se filtra,
  cámbiala: todas las sesiones abiertas se invalidan.
- Las tablas tienen RLS activado sin políticas y las funciones de stock solo las
  puede ejecutar `service_role`: con la anon key no se puede leer ni escribir nada.
- `/api/semilla` y `/api/reiniciar` exigen sesión de administrador. **Reiniciar borra
  pedidos, catálogo, configuración y bitácora** del servidor.
- El seguimiento público (`/api/pedido/:codigo`) muestra el pedido a quien tenga el
  código: compártelo solo con el cliente.
- Los archivos del bucket `disenos` son accesibles para quien tenga la URL exacta.
  No es un lugar para documentos confidenciales.

## Limitación conocida

El panel guarda catálogo y pedidos reenviando el **arreglo completo**. El backend
hace `upsert` fila por fila y protege lo importante (precios, totales e ítems de los
pedidos los fija el servidor; el stock tiene control de versión), pero si dos
personas editan el mismo pedido al mismo tiempo, gana el último guardado.
