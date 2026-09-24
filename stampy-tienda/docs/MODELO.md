# Modelo de datos de Estampy

Estampy es una tienda de sublimación: franelas, chemises, uniformes deportivos, tazas, gorras, mousepads y cojines. Se hereda la arquitectura de la tienda Alfa: frontend estático en `public/`, backend en Netlify Functions (`netlify/functions/api.mjs`) y Supabase.

Este documento es el contrato entre frontend, panel y backend. Si algo aquí cambia, se cambia en los tres.

## Producto (JS en camelCase · Postgres en snake_case)

| JS | Postgres | Tipo | Notas |
|---|---|---|---|
| id | id | text PK | slug |
| nombre, linea, categoria, categoriaLabel | nombre, linea, categoria, categoria_label | text | categorías: `franelas`, `deportiva`, `chemises`, `ninos`, `accesorios`, `hogar` |
| precio | precio | numeric(10,2) | precio por unidad al detal |
| precioAnterior | precio_anterior | numeric null | tachado |
| preciosMayor | precios_mayor | jsonb `[{desde, precio}]` | escalones por **cantidad total del producto en el pedido** (todas sus tallas y colores) |
| rating, reviews | rating, reviews | | |
| modoStock | modo_stock | text `'pedido'` \| `'stock'` | `pedido` = se produce al pedir, sin límite de stock |
| tallas | tallas | jsonb `string[]` | `[]` = sin talla |
| stockTallas | stock_tallas | jsonb `{talla: int}` | solo si `modoStock='stock'` y hay tallas |
| stock | stock | int | solo si `modoStock='stock'` y **no** hay tallas |
| colores | colores | jsonb `[{nombre, hex}]` | color base (prenda, malla, interior de taza); el cliente elige uno. Prendas: Blanco `#FFFFFF`, Negro `#1E1E20`, Rojo `#B0232A`, Azul `#1F3F8F` (varios permitidos; el primero es el de las fotos del simulador). `[]` = sin elección |
| permiteDiseno | permite_diseno | bool | el cliente puede adjuntar arte y nota (siempre `true` si hay `prenda`) |
| prenda | prenda | jsonb \| null | pieza del simulador. Prendas `{tipo, cuello, infantil}`: `tipo` `franela` \| `chemise` \| `manga-larga`; `cuello` `redondo` \| `v` (la chemise no lleva, es polo); `infantil`: bool (medidas × 0,75). Objetos `{tipo}`: `taza` \| `gorra` \| `mousepad` \| `cojin` (sin cuello ni infantil). `null` = no usa el simulador |
| ubicaciones | ubicaciones | jsonb string[] | zonas donde el cliente puede poner su logo, subconjunto de `frente`, `espalda`, `manga-izq`, `manga-der`. Objetos: solo las de su tipo (taza y cojín `frente` y `espalda`; gorra y mousepad `frente`). Solo tiene sentido con `prenda` |
| diasProduccion | dias_produccion | int | días hábiles tras aprobar el diseño |
| pedidoMinimo | pedido_minimo | int default 1 | mínimo de unidades totales del producto |
| etiquetas, destacados | etiquetas, destacados | jsonb string[] | |
| resumen, descripcion | resumen, descripcion | text | |
| specs | specs | jsonb `{clave: valor}` | claves sugeridas: Material, Técnica, Área de impresión, Cuello, Capacidad, Medidas, Talla, Incluye, Cuidado, Producción |
| imagenes | imagenes | jsonb string[] | nombre de archivo en `assets/img/productos/`, URL completa (Storage) o una vista del simulador que dibuja `A.img()` en el navegador: prendas `mockup:<idProducto>:frente\|espalda`, objetos `objeto:<tipo>:1` (completo) y `objeto:<tipo>:2` (detalle) |
| opiniones | opiniones | jsonb | `[{autor, estrellas, fecha, texto}]` puede estar vacío |
| activo | activo | bool | borrado lógico |

Se eliminan del modelo de Alfa: `color`, `colores_disponibles` y los specs de laptop.

## Ayudantes compartidos (en `public/assets/js/app.js`, ya implementados)

- `A.bajoPedido(p)`, `A.tieneTallas(p)`
- `A.stockDe(p, talla)` → unidades disponibles (Infinity si es bajo pedido)
- `A.stockTotal(p)` → suma (Infinity si es bajo pedido)
- `A.ajustarStock(p, talla, delta)`
- `A.escalones(p)`, `A.precioUnitario(p, cantidadTotal)`, `A.precioMinimo(p)`
- `A.diasEntrega(items, entrega)` → producción del ítem más lento + días de la zona
- `A.cart.agregar(id, {talla: qty} | {_: qty}, {color, diseno: {nota, archivo}})`
- `A.cart.add(id, qty, {talla, color, diseno})`
- `A.cart.setQty(key, qty)`, `A.cart.remove(key)` — **usan `key`, no `id`**
- `A.cart.detailed()` → líneas con `precio` (ya con escalón al mayor), `precioBase`, `mayor`, `subtotal`, `producto`
- `A.cart.faltaMinimo()` → `[{producto, tiene, minimo}]` productos bajo su pedido mínimo (bloquean el checkout)
- `A.cart.lineasPedido()` → las líneas tal como se guardan en el pedido

## Logo en prendas y objetos (simulador `public/assets/js/mockup.js`)

Las franelas, chemises (hechas bajo pedido) y mangas largas vienen en varios colores (Blanco, Negro, Rojo y Azul) y el cliente elige uno. Las tazas, gorras, mousepads y cojines usan el mismo editor. El cliente sube su logo y en el simulador elige **dónde va** (una o varias zonas); en cada zona puede moverlo y cambiarle el tamaño dentro del área de impresión.

Las zonas usan siempre los mismos nombres; en los objetos cambia cómo se muestran (`STAMPY.mockup.etiqueta(tipo, zona)`):

| Pieza | `frente` | `espalda` | `manga-izq` / `manga-der` |
|---|---|---|---|
| Prendas | Frente | Espalda | Manga izquierda / derecha |
| Taza | Lado 1 | Lado 2 (detrás del asa) | — |
| Cojín | Cara 1 | Cara 2 | — |
| Gorra | Frente | — | — |
| Mousepad | Superficie | — | — |

Una ubicación se guarda en fracciones del área de impresión de esa vista, más las medidas reales ya calculadas para producción:

```
{ zona: "frente" | "espalda" | "manga-izq" | "manga-der",
  ref: "Pecho izquierdo" | "" ,     // posición rápida elegida; "" si la movió a mano
  x, y: 0..1,                       // centro del logo dentro del área
  w: 0..1,                          // ancho del logo / ancho del área
  ratio: alto/ancho del logo,
  anchoCm, altoCm,                  // tamaño real del logo
  desdeCm }                         // distancia del borde superior del logo al cuello (al hombro en mangas; al borde de la pieza en objetos)
```

Áreas de impresión de las prendas (adulto; niño × 0,75):

| Prenda | Frente | Espalda | Mangas |
|---|---|---|---|
| Franela | 30 × 40 cm (cuello V: 30 × 37,5) | 30 × 40 cm | 9 × 9 cm |
| Chemise | 30 × 37,5 cm | 30 × 40 cm | 9 × 9 cm |
| Manga larga | 30 × 40 cm | 30 × 40 cm | 8 × 30 cm |

Áreas de impresión de los objetos:

| Objeto | Área |
|---|---|
| Taza | 9 × 8 cm por lado (Lado 1 y Lado 2) |
| Gorra | 11 × 7 cm (frente) |
| Mousepad | 22 × 18 cm (superficie) |
| Cojín | 40 × 40 cm por cara (Cara 1 y Cara 2) |

API (en el navegador, `STAMPY.mockup`): `svg(prendaOProducto, vista, {u, logo, fondo, area})`, `miniaturasHTML(diseno, {tam})`, `textoUbicaciones(diseno)`, `describir(ubicacion, tipo)` (pasar `diseno.prenda.tipo`), `registro(prenda, zona, u, ratio)`, `presetsDe(producto, vista)`, `vistasDe(producto)`, `prendaDe(producto)`, `zonasDe(tipo)`, `etiqueta(productoOPrenda | tipo, zona, corto)`, `esObjeto(productoOPrenda)`, `TIPOS` (prendas y objetos), `VISTAS`, `ORDEN`, `editor(elemento, {producto, alCambiar})`.

## Línea del carrito

`{ key, id, talla|null, color|null, qty, diseno|null }`, con `diseno = { grupo, nota, archivo: {url, nombre, ruta}|null, ubicaciones: [...], prenda: {tipo, cuello, infantil, color}|null, logoPorWhatsApp: bool }` (en objetos, `prenda = {tipo, color}`). Las tallas añadidas juntas comparten `grupo` para que el mismo diseño cubra todas. La vista previa del logo (PNG pequeño en data URL) se guarda aparte por grupo (`A.logoPreview(grupo)`), no en cada línea.

## Pedido

Igual que Alfa, salvo:

- Código `EST-AAAA-####XX`; guía `EST#########`.
- `items[]`: `{ id, nombre, qty, precio, img, talla, color, diseno | null }` con `diseno = { nota, archivo, ubicaciones, prenda, logoPorWhatsApp }` (ver arriba). `precio` es el unitario ya con escalón al mayor.
- En modo demostración (sin servidor) `diseno.preview` lleva la vista previa del logo; **el servidor la descarta**.
- Regla: si el producto tiene `prenda` (prenda u objeto), `ubicaciones` y `permiteDiseno`, cada línea debe traer al menos una ubicación válida (zona dentro de `producto.ubicaciones`) y, además, un archivo o `logoPorWhatsApp: true`.
- `eta` = creado + `A.diasEntrega`.
- Estados (siempre 6, por índice): 0 recibido · 1 pago · 2 diseño aprobado · 3 en producción · 4 despachado / listo para retirar · 5 entregado / retirado.

## Archivos de diseño

- `POST /api/diseno` (público) con `{ nombre, tipo, datos(base64) }`.
- Tipos: png, jpg, webp, pdf. Máximo 8 MB.
- Se guarda en el bucket `disenos` de Supabase Storage con un nombre aleatorio.
- Responde `{ url, ruta, nombre }`. El cliente guarda eso en `diseno.archivo`.
- En modo sin servidor (demo local), el archivo no se sube y solo se guarda `{ nombre }`.

## Marca

- Paleta:

  | Color | Hex | Uso |
  |---|---|---|
  | Tinta | `#1E1B2E` | texto y fondos oscuros |
  | Magenta | `#D6246E` | acción principal |
  | Cian | `#0E9CC4` | |
  | Amarillo | `#F2BE12` | |
  | Fondo | `#F7F6FA` | neutro frío |

- Tipografía: **Unbounded** (display, 500–800) y **Figtree** (texto, 400–700), ambas de Google Fonts.
- Logo: la palabra "stampy" en minúsculas en Unbounded 800, seguida de tres puntos cian, magenta y amarillo (`assets/img/logo.svg`, `favicon.svg`).
- Motivo: franja CMY (cian, magenta, amarillo) y marcas de registro de imprenta, con moderación.
