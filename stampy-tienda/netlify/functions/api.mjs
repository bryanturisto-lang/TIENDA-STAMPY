// =========================================================
// Estampy — API (Netlify Function)
// Atiende /api/* completo. Almacenamiento: Supabase (Postgres + Storage).
// Contrato de datos: docs/MODELO.md (JS camelCase <-> Postgres snake_case).
//
// INVENTARIO — fuente de verdad (léelo antes de tocar stock):
//   · La base de datos manda. Todo movimiento de stock causado por un
//     pedido lo hace el servidor con funciones atómicas de Postgres
//     (sql/02_funciones.sql):
//       - POST /pedido                → reservar_stock
//       - pedido pasa a cancelado     → devolver_stock   (PUT /coleccion/pedidos)
//       - pedido cancelado se reactiva → reservar_stock  (PUT /coleccion/pedidos)
//     Esas funciones suben productos.stock_rev.
//   · PUT /coleccion/catalogo guarda el stock que manda el panel SOLO si
//     el producto trae el mismo stockRev que hay en la base (es decir, el
//     panel estaba al día). Si el stockRev es viejo, hubo ventas o
//     cancelaciones desde que el panel cargó: se guarda todo lo demás del
//     producto pero NO el stock (se conserva el del servidor) y se
//     devuelve un aviso. Así, si el panel todavía ajusta el stock en su
//     copia local al cancelar/reactivar y reenvía el catálogo, no hay
//     doble ajuste: el pedido llega primero (ajusta y sube stock_rev) y
//     el catálogo que llega después ya viene "viejo" y su stock se ignora.
//   · Recomendado para el panel: con servidor, no ajustar stock local al
//     cancelar/reactivar; tomar el `catalogo` que devuelve la respuesta
//     (o recargar /estado).
// =========================================================

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual, randomUUID, randomInt } from "node:crypto";

const SUPABASE_URL = (process.env.STAMPY_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_KEY = process.env.STAMPY_SUPABASE_SERVICE_KEY;

// Secreto para firmar sesiones. SIN valor por defecto: si falta, todo lo
// que requiere sesión responde 503 y el panel queda deshabilitado.
const SECRETO = process.env.STAMPY_SECRET || "";
const SECRETO_LARGO_MINIMO = 32;
const MSG_SIN_SECRETO =
  "El panel está deshabilitado: falta configurar STAMPY_SECRET en las variables de entorno de Netlify " +
  "(una cadena aleatoria de 32 caracteres o más). Configúrala y vuelve a publicar el sitio.";

let supabase = null;
function db() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  return supabase;
}

// --------------------- Evolution API (WhatsApp) ---------------------
const EVOLUTION_URL = (process.env.STAMPY_EVOLUTION_URL || "").replace(/\/+$/, "");
const EVOLUTION_APIKEY = process.env.STAMPY_EVOLUTION_APIKEY;
const EVOLUTION_INSTANCIA = process.env.STAMPY_EVOLUTION_INSTANCIA;
const EVOLUTION_GRUPO_INTERNO = process.env.STAMPY_EVOLUTION_GRUPO_INTERNO; // ej: 120363012345678901@g.us

function evolutionListo() {
  return !!(EVOLUTION_URL && EVOLUTION_APIKEY && EVOLUTION_INSTANCIA);
}

// Convierte un teléfono venezolano tipo "0412-1234567" o "+58 412-1234567"
// al formato que espera WhatsApp: 584121234567
function normalizarNumeroVE(numero) {
  if (!numero) return null;
  const d = String(numero).replace(/\D/g, "");
  if (d.startsWith("58") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return "58" + d.slice(1);
  if (d.length === 10) return "58" + d;
  return d || null;
}

// Envía un mensaje de texto. Nunca lanza error hacia arriba: si Evolution
// no está configurado o falla, solo lo registra en la bitácora — un
// problema de WhatsApp jamás debe tumbar la creación/actualización de un pedido.
async function enviarWhatsApp(sb, numeroDestino, texto, refPedido) {
  if (!evolutionListo() || !numeroDestino) return;
  const destino = String(numeroDestino);
  const numero = destino.includes("@g.us") ? destino : normalizarNumeroVE(destino);
  if (!numero) return;
  try {
    const controlador = new AbortController();
    const corte = setTimeout(() => controlador.abort(), 3000);
    const resp = await fetch(`${EVOLUTION_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCIA)}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: EVOLUTION_APIKEY },
      body: JSON.stringify({ number: numero, text: texto }),
      signal: controlador.signal,
    });
    clearTimeout(corte);
    if (!resp.ok) {
      const detalle = await resp.text().catch(() => "");
      await registrar(sb, { tipo: "whatsapp-error", mensaje: `Fallo al enviar a ${numero}: ${resp.status} ${detalle}`, referencia: refPedido });
    }
  } catch (e) {
    const motivo = e.name === "AbortError" ? "tiempo de espera agotado (3 s)" : e.message;
    await registrar(sb, { tipo: "whatsapp-error", mensaje: `Excepción al enviar a ${numero}: ${motivo}`, referencia: refPedido });
  }
}

async function notificarGrupoInterno(sb, texto, ref) {
  if (!EVOLUTION_GRUPO_INTERNO) return;
  await enviarWhatsApp(sb, EVOLUTION_GRUPO_INTERNO, texto, ref);
}

// Inserta en la bitácora sin romper nunca la petición.
async function registrar(sb, { tipo, mensaje, referencia = null, usuario = null, rol = null }) {
  if (!sb) return;
  try {
    await sb.from("bitacora").insert({
      tipo,
      mensaje: String(mensaje || "").slice(0, 1000),
      referencia: referencia || null,
      usuario,
      rol,
    });
  } catch (e) {
    /* la bitácora nunca debe tumbar una operación */
  }
}

const PERMISOS = {
  admin: ["panel", "pedidos", "pagos", "inventario", "envios", "clientes", "reportes", "configuracion", "bitacora"],
  ventas: ["panel", "pedidos", "pagos", "clientes"],
  almacen: ["panel", "pedidos", "inventario", "envios"],
};

// --------------------- utilidades de respuesta ---------------------
function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store, must-revalidate" },
  });
}
function error(status, msg, extra) {
  return json(status, { error: msg, ...(extra || {}) });
}
async function leerJson(req) {
  try {
    return await req.json();
  } catch (e) {
    return null;
  }
}

// --------------------- tokens firmados (HMAC-SHA256) ---------------------
function firmarToken(payload) {
  if (!SECRETO) throw new Error(MSG_SIN_SECRETO);
  const cuerpo = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const firma = createHmac("sha256", SECRETO).update(cuerpo).digest("base64url");
  return `${cuerpo}.${firma}`;
}
function verificarToken(token) {
  if (!SECRETO) return null;
  if (!token || typeof token !== "string") return null;
  const partes = token.split(".");
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
  const [cuerpo, firma] = partes;
  const esperada = createHmac("sha256", SECRETO).update(cuerpo).digest("base64url");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(cuerpo, "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
function sesionDesdePeticion(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return verificarToken(token);
}

/**
 * Exige sesión (y opcionalmente un permiso, o "admin").
 * Devuelve { sesion } o { respuesta } con el error listo para devolver.
 */
function exigirSesion(req, permiso) {
  if (!SECRETO) return { respuesta: error(503, MSG_SIN_SECRETO) };
  const sesion = sesionDesdePeticion(req);
  if (!sesion) return { respuesta: error(401, "Sesión inválida o vencida.") };
  if (permiso === "admin") {
    if (sesion.rol !== "admin") return { respuesta: error(403, "Solo un administrador puede hacer esto.") };
  } else if (permiso && !(PERMISOS[sesion.rol] || []).includes(permiso)) {
    return { respuesta: error(403, `Tu rol no tiene permiso de ${permiso}.`) };
  }
  return { sesion };
}

// --------------------- utilidades de datos ---------------------
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const numero = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const entero = (v, def = 0, min = 0) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(min, n) : def;
};
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const texto = (v, max = 500) => (v == null ? "" : String(v)).slice(0, max);
const fechaISO = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
function enLotes(lista, n = 150) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += n) lotes.push(lista.slice(i, i + n));
  return lotes;
}
// Trae filas por una lista de claves en lotes (evita URLs gigantes en .in()).
async function filasPorClaves(sb, tabla, columna, claves, columnas = "*") {
  const salida = [];
  for (const lote of enLotes([...new Set(claves)])) {
    if (!lote.length) continue;
    const { data, error: err } = await sb.from(tabla).select(columnas).in(columna, lote);
    if (err) throw err;
    salida.push(...(data || []));
  }
  return salida;
}

// --------------------- prendas, objetos y logo (docs/MODELO.md → Logo en prendas) ---------------------
const TIPOS_PRENDA = ["franela", "chemise", "manga-larga"];
const ZONAS_LOGO = ["frente", "espalda", "manga-izq", "manga-der"]; // también es el orden en que se guardan
const NOMBRE_ZONA = { frente: "Frente", espalda: "Espalda", "manga-izq": "Manga izquierda", "manga-der": "Manga derecha" };
// Objetos: usan los mismos nombres de zona, pero cada tipo tiene las suyas y su propio nombre
// para mostrar (igual que OBJETOS en mockup.js).
const ZONAS_OBJETO = {
  taza: { frente: "Lado 1", espalda: "Lado 2" },
  cojin: { frente: "Cara 1", espalda: "Cara 2" },
  gorra: { frente: "Frente" },
  mousepad: { frente: "Superficie" },
};
const esObjeto = (tipo) => Object.prototype.hasOwnProperty.call(ZONAS_OBJETO, tipo);
// Zonas posibles de un tipo de pieza, en el orden de ZONAS_LOGO.
const zonasTipo = (tipo) => (esObjeto(tipo) ? ZONAS_LOGO.filter((z) => z in ZONAS_OBJETO[tipo]) : ZONAS_LOGO);
const nombreZona = (z, tipo) => (esObjeto(tipo) ? ZONAS_OBJETO[tipo][z] : NOMBRE_ZONA[z]) || z;
const RE_HEX = /^#[0-9a-f]{6}$/i;
const round1 = (n) => Math.round((Number(n) + Number.EPSILON) * 10) / 10;
const round3 = (n) => Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;

// Número (o texto numérico) acotado a [min, max]; si no es un número, `def`.
function acotado(v, min, max, def) {
  const n = typeof v === "number" || (typeof v === "string" && v.trim() !== "") ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}

// { tipo, cuello, infantil } o null si no es una pieza válida del simulador. La chemise no
// lleva `cuello` (siempre es polo); en las demás prendas, lo que no sea "v" es "redondo".
// Los objetos (taza, gorra, mousepad, cojín) son solo { tipo }.
function sanitizarPrenda(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  if (esObjeto(v.tipo)) return { tipo: v.tipo };
  if (!TIPOS_PRENDA.includes(v.tipo)) return null;
  return v.tipo === "chemise"
    ? { tipo: v.tipo, infantil: v.infantil === true }
    : { tipo: v.tipo, cuello: v.cuello === "v" ? "v" : "redondo", infantil: v.infantil === true };
}

// Zonas habilitadas para el logo: subconjunto de ZONAS_LOGO, sin repetir y en ese orden.
// Si la pieza es un objeto, solo las zonas de ese tipo (taza/cojín: frente y espalda;
// gorra/mousepad: frente).
function sanitizarUbicaciones(v, prenda) {
  const lista = arr(v);
  return zonasTipo(prenda && prenda.tipo).filter((z) => lista.includes(z));
}

// Zonas donde el cliente puede poner el logo en este producto. Igual que
// mockup.vistasDe en el navegador: con `ubicaciones` vacío se muestran todas las del tipo.
function zonasDe(p) {
  if (!p.prenda) return [];
  return p.ubicaciones.length ? p.ubicaciones : zonasTipo(p.prenda.tipo);
}

// "frente, espalda o mangas" (taza: "Lado 1 o Lado 2") — para los mensajes de error.
function listaZonas(zonas, tipo) {
  const unir = (partes) => (partes.length > 1 ? partes.slice(0, -1).join(", ") + " o " + partes[partes.length - 1] : partes.join(""));
  if (esObjeto(tipo)) return unir(zonas.map((z) => nombreZona(z, tipo)));
  const partes = zonas.filter((z) => z === "frente" || z === "espalda");
  const izq = zonas.includes("manga-izq");
  const der = zonas.includes("manga-der");
  if (izq && der) partes.push("mangas");
  else if (izq) partes.push("manga izquierda");
  else if (der) partes.push("manga derecha");
  return unir(partes);
}

// Una ubicación del logo de una línea del pedido, o null si su zona no está permitida.
// x, y (centro) y w son fracciones del área de impresión; ratio = alto/ancho del logo;
// anchoCm, altoCm y desdeCm son las medidas reales que calculó el simulador.
function sanitizarUbicacion(u, zonas) {
  if (!u || typeof u !== "object" || !zonas.includes(u.zona)) return null;
  return {
    zona: u.zona,
    ref: typeof u.ref === "string" ? u.ref.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 40) : "",
    x: round3(acotado(u.x, 0, 1, 0.5)),
    y: round3(acotado(u.y, 0, 1, 0.5)),
    w: round3(acotado(u.w, 0.05, 1, 0.5)),
    ratio: round3(acotado(u.ratio, 0.05, 20, 1)),
    anchoCm: round1(acotado(u.anchoCm, 0, 100, 0)),
    altoCm: round1(acotado(u.altoCm, 0, 100, 0)),
    desdeCm: round1(acotado(u.desdeCm, 0, 100, 0)),
  };
}

// Copia de la prenda que se guarda en la línea: { tipo, cuello, infantil, color } (objetos:
// { tipo, color }). Se respeta la del navegador (las ubicaciones se midieron sobre ella); si
// no manda una válida, o cambia de objeto a prenda (o de un objeto a otro), se toma la del
// producto. Color: el hex del navegador o el del producto.
function prendaDeLinea(v, p) {
  if (!p.prenda) return null;
  const nav = sanitizarPrenda(v);
  const valida = nav && (nav.tipo === p.prenda.tipo || !(esObjeto(nav.tipo) || esObjeto(p.prenda.tipo)));
  const prenda = valida ? nav : { ...p.prenda };
  const hexProducto = p.colores.map((c) => c && c.hex).find((h) => typeof h === "string" && RE_HEX.test(h));
  prenda.color = v && typeof v.color === "string" && RE_HEX.test(v.color) ? v.color : hexProducto || "#FFFFFF";
  return prenda;
}

// La vista previa del logo (data URL) nunca se guarda en el servidor (docs/MODELO.md → Pedido).
function itemsSinPreview(items) {
  return arr(items).map((it) => {
    if (!it || typeof it !== "object" || !it.diseno || typeof it.diseno !== "object" || !("preview" in it.diseno)) return it;
    const diseno = { ...it.diseno };
    delete diseno.preview;
    return { ...it, diseno };
  });
}

// --------------------- mapeo fila <-> objeto del frontend ---------------------
function productoDesdeFila(f) {
  return {
    id: f.id,
    nombre: f.nombre,
    linea: f.linea || "",
    categoria: f.categoria || "",
    categoriaLabel: f.categoria_label || "",
    precio: Number(f.precio) || 0,
    precioAnterior: f.precio_anterior != null ? Number(f.precio_anterior) : null,
    preciosMayor: arr(f.precios_mayor),
    rating: Number(f.rating) || 0,
    reviews: f.reviews || 0,
    modoStock: f.modo_stock === "stock" ? "stock" : "pedido",
    tallas: arr(f.tallas),
    stockTallas: obj(f.stock_tallas),
    stock: f.stock || 0,
    // Revisión del inventario en el servidor. El panel debe reenviarla tal
    // cual (viene dentro del objeto del producto): ver comentario al inicio.
    stockRev: f.stock_rev || 0,
    colores: arr(f.colores),
    prenda: sanitizarPrenda(f.prenda),
    ubicaciones: sanitizarUbicaciones(f.ubicaciones, sanitizarPrenda(f.prenda)),
    permiteDiseno: f.permite_diseno !== false,
    diasProduccion: f.dias_produccion || 0,
    pedidoMinimo: f.pedido_minimo || 1,
    etiquetas: arr(f.etiquetas),
    destacados: arr(f.destacados),
    resumen: f.resumen || "",
    descripcion: f.descripcion || "",
    specs: obj(f.specs),
    imagenes: arr(f.imagenes),
    opiniones: arr(f.opiniones),
    activo: f.activo !== false,
  };
}

function escalonesDe(p) {
  return arr(p && p.preciosMayor)
    .map((e) => ({ desde: entero(e && e.desde), precio: round2(numero(e && e.precio)) }))
    .filter((e) => e.desde > 1 && e.precio > 0)
    .sort((a, b) => a.desde - b.desde);
}

// Normaliza lo que manda el panel. stock_rev NO se toca desde aquí: es del servidor.
function filaDesdeProducto(p) {
  const tallas = [...new Set(arr(p.tallas).map((t) => String(t).trim()).filter(Boolean))];
  const stockTallasIn = obj(p.stockTallas);
  const stockTallas = {};
  tallas.forEach((t) => {
    if (stockTallasIn[t] != null) stockTallas[t] = entero(stockTallasIn[t]);
  });
  const anterior = numero(p.precioAnterior, 0);
  return {
    id: String(p.id).trim(),
    nombre: texto(p.nombre, 200) || String(p.id),
    linea: texto(p.linea, 100),
    categoria: texto(p.categoria, 60),
    categoria_label: texto(p.categoriaLabel, 100),
    precio: round2(Math.max(0, numero(p.precio))),
    precio_anterior: anterior > 0 ? round2(anterior) : null,
    precios_mayor: escalonesDe(p),
    rating: Math.min(5, Math.max(0, numero(p.rating))),
    reviews: entero(p.reviews),
    modo_stock: p.modoStock === "stock" ? "stock" : "pedido",
    tallas,
    stock_tallas: stockTallas,
    stock: entero(p.stock),
    colores: arr(p.colores)
      .filter((c) => c && c.nombre)
      .map((c) => ({ nombre: texto(c.nombre, 60), hex: texto(c.hex || "", 20) })),
    prenda: sanitizarPrenda(p.prenda),
    ubicaciones: sanitizarUbicaciones(p.ubicaciones, sanitizarPrenda(p.prenda)),
    permite_diseno: p.permiteDiseno !== false,
    dias_produccion: entero(p.diasProduccion),
    pedido_minimo: entero(p.pedidoMinimo, 1, 1),
    etiquetas: arr(p.etiquetas).map((x) => texto(x, 60)),
    destacados: arr(p.destacados).map((x) => texto(x, 300)),
    resumen: texto(p.resumen, 2000),
    descripcion: texto(p.descripcion, 10000),
    specs: obj(p.specs),
    // Archivo de assets/img/productos/, URL de Storage o vista del simulador
    // "mockup:<idProducto>:<vista>" u "objeto:<tipo>:1|2" (las dibuja el navegador): todas se guardan tal cual.
    imagenes: arr(p.imagenes).map((x) => texto(x, 1000)).filter(Boolean),
    opiniones: arr(p.opiniones),
    activo: p.activo !== false,
    actualizado: new Date().toISOString(),
  };
}

// Campos del pedido con columna propia. Lo demás que mande el panel va a `extra`.
const CAMPOS_PEDIDO = new Set([
  "codigo", "creado", "eta", "items", "cliente", "entrega", "pago", "totales",
  "estadoIndex", "pagoEstado", "pagoVerificado", "pagoMotivo", "cancelado",
  "motivoCancelacion", "canceladoEl", "notas", "historial", "guia", "courier", "repartidor",
]);

/* Versión del pedido para el seguimiento público: cualquiera con el código
   la ve, así que se ocultan cédula, teléfono, correo, dirección exacta,
   referencia de pago y las notas internas del equipo. */
function ocultar(txt, visibles = 3) {
  const s = String(txt || "");
  if (!s) return "";
  return "•".repeat(Math.max(3, s.length - visibles)) + s.slice(-visibles);
}
function pedidoPublico(o) {
  const c = o.cliente || {};
  const e = o.entrega || {};
  const p = o.pago || {};
  const primerNombre = String(c.nombre || "").trim().split(/\s+/)[0] || "";
  const correo = String(c.email || "");
  const arroba = correo.indexOf("@");
  return {
    ...o,
    notas: [],
    cliente: {
      nombre: primerNombre,
      cedula: ocultar(c.cedula),
      telefono: ocultar(c.telefono, 4),
      email: arroba > 0 ? correo[0] + "•••" + correo.slice(arroba) : "",
      empresa: null,
    },
    entrega: e.modo === "tienda"
      ? { ...e, retiraOtro: e.retiraOtro ? String(e.retiraOtro).split(/[\s,]+/)[0] : "" }
      : { modo: e.modo, zonaId: e.zonaId, zonaNombre: e.zonaNombre, ciudad: e.ciudad, direccion: "Dirección registrada (oculta por seguridad)" },
    pago: { metodo: p.metodo, banco: p.banco, referencia: p.referencia ? ocultar(p.referencia, 4) : "" },
  };
}

function pedidoDesdeFila(f) {
  const o = {
    ...obj(f.extra),
    codigo: f.codigo,
    creado: f.creado,
    eta: f.eta,
    items: arr(f.items),
    cliente: obj(f.cliente),
    entrega: obj(f.entrega),
    pago: obj(f.pago),
    totales: obj(f.totales),
    estadoIndex: f.estado_index || 0,
    pagoEstado: f.pago_estado,
    cancelado: !!f.cancelado,
    notas: arr(f.notas),
    historial: arr(f.historial),
    guia: f.guia || null,
    courier: f.courier || null,
    repartidor: f.repartidor || null,
  };
  if (f.pago_verificado) o.pagoVerificado = f.pago_verificado;
  if (f.pago_motivo) o.pagoMotivo = f.pago_motivo;
  if (f.motivo_cancelacion) o.motivoCancelacion = f.motivo_cancelacion;
  if (f.cancelado_el) o.canceladoEl = f.cancelado_el;
  return o;
}

function filaDesdePedido(o) {
  let extra = {};
  for (const k of Object.keys(o)) if (!CAMPOS_PEDIDO.has(k) && o[k] !== undefined) extra[k] = o[k];
  if (JSON.stringify(extra).length > 20000) extra = {};
  return {
    codigo: o.codigo,
    creado: fechaISO(o.creado) || new Date().toISOString(),
    eta: fechaISO(o.eta),
    items: itemsSinPreview(o.items),
    cliente: obj(o.cliente),
    entrega: obj(o.entrega),
    pago: obj(o.pago),
    totales: obj(o.totales),
    estado_index: Math.min(5, entero(o.estadoIndex)),
    pago_estado: texto(o.pagoEstado || "reportado", 20),
    pago_verificado: fechaISO(o.pagoVerificado),
    pago_motivo: o.pagoMotivo ? texto(o.pagoMotivo, 500) : null,
    cancelado: !!o.cancelado,
    motivo_cancelacion: o.motivoCancelacion ? texto(o.motivoCancelacion, 500) : null,
    cancelado_el: fechaISO(o.canceladoEl),
    notas: arr(o.notas),
    historial: arr(o.historial),
    guia: o.guia ? texto(o.guia, 60) : null,
    courier: o.courier ? texto(o.courier, 60) : null,
    repartidor: o.repartidor && typeof o.repartidor === "object" ? o.repartidor : null,
    extra,
    actualizado: new Date().toISOString(),
  };
}

// --------------------- carga de colecciones completas ---------------------
async function cargarCatalogo(sb) {
  const { data, error: err } = await sb.from("productos").select("*").eq("activo", true).order("nombre");
  if (err) throw err;
  return (data || []).map(productoDesdeFila);
}
async function cargarConfig(sb) {
  const { data, error: err } = await sb.from("configuracion").select("datos").eq("id", 1).maybeSingle();
  if (err) throw err;
  return data ? data.datos : null;
}
async function cargarPedidos(sb) {
  const { data, error: err } = await sb.from("pedidos").select("*").order("creado", { ascending: false });
  if (err) throw err;
  return (data || []).map(pedidoDesdeFila);
}
async function cargarBitacora(sb) {
  const { data, error: err } = await sb.from("bitacora").select("*").order("fecha", { ascending: false }).limit(500);
  if (err) throw err;
  return (data || []).map((f) => ({ id: f.id, fecha: f.fecha, usuario: f.usuario, rol: f.rol, accion: f.tipo, detalle: f.mensaje, ref: f.referencia }));
}

// --------------------- precios, totales y fechas (igual que app.js) ---------------------
// Mismo criterio que A.precioUnitario: el escalón lo decide la cantidad
// TOTAL de ese producto en el pedido (todas sus tallas, colores y diseños).
function precioUnitario(p, cantidadTotal) {
  let precio = numero(p.precio);
  escalonesDe(p).forEach((e) => {
    if (cantidadTotal >= e.desde) precio = e.precio;
  });
  return precio;
}

// Mismo cálculo que A.calcTotales en public/assets/js/app.js.
function calcTotales(subtotal, entrega, metodo, cfg) {
  const zonas = arr(cfg.zonas);
  const gratisDesde = cfg.freeShippingOver != null && cfg.freeShippingOver !== "" ? numero(cfg.freeShippingOver, Infinity) : Infinity;
  let envio = 0;
  if (entrega && entrega.modo === "delivery") {
    const z = zonas.find((x) => x.id === entrega.zonaId);
    envio = z ? numero(z.costo) : 0;
    if (subtotal >= gratisDesde) envio = 0;
  }
  const base = round2(subtotal + envio);
  const iva = round2(base * numero(cfg.iva));
  // 5 % de descuento pagando en bolívares (pago móvil o transferencia)
  const aplicaDesc = metodo === "pago-movil" || metodo === "transferencia";
  const descuento = aplicaDesc ? round2(base * 0.05) : 0;
  const total = round2(base + iva - descuento);
  return {
    subtotal: round2(subtotal),
    envio: round2(envio),
    envioGratis: !!(entrega && entrega.modo === "delivery" && subtotal >= gratisDesde),
    iva,
    descuento,
    total,
    totalBs: round2(total * numero(cfg.bcvRate)),
  };
}

// Mismo criterio que A.diasEntrega: producción del producto más lento + días de la zona.
function diasEntrega(productos, entrega, cfg) {
  const produccion = productos.reduce((m, p) => Math.max(m, entero(p.diasProduccion)), 0);
  let envio = 0;
  if (entrega && entrega.modo === "delivery") {
    const z = arr(cfg.zonas).find((x) => x.id === entrega.zonaId);
    envio = z ? entero(z.dias) : 3;
  }
  return produccion + envio;
}

const METODOS_PAGO = ["pago-movil", "transferencia", "zelle", "binance", "paypal", "banesco-panama", "efectivo"];
const RE_CODIGO = /^EST-\d{4}-\d{4}[A-Z]{2}$/;
const LETRAS_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function generarCodigo() {
  const y = new Date().getFullYear();
  const n = String(1000 + randomInt(9000));
  const a = LETRAS_CODIGO[randomInt(LETRAS_CODIGO.length)];
  const b = LETRAS_CODIGO[randomInt(LETRAS_CODIGO.length)];
  return `EST-${y}-${n}${a}${b}`;
}
function generarGuia() {
  return "EST" + (100000000 + randomInt(900000000));
}

// --------------------- archivos de diseño ---------------------
const DISENO_MAX = 8 * 1024 * 1024; // 8 MB (igual que el bucket en sql/03_storage.sql)
const TIPOS_DISENO = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", pdf: "application/pdf" };
const EXT_POR_MIME = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "application/pdf": "pdf" };
const RE_RUTA_DISENO = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp|pdf)$/;

// Identifica el formato real por sus primeros bytes ("números mágicos").
function detectarTipo(buf) {
  if (!buf || buf.length < 4) return null;
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  return null;
}

function rutaDiseno(ext) {
  const d = new Date();
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
}
function prefijoPublico(bucket) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
}
function limpiarNombreArchivo(n) {
  const base = String(n || "").split(/[\\/]/).pop() || "";
  return base.replace(/[\u0000-\u001f\u007f<>"]/g, "").trim().slice(0, 120) || "diseno";
}

async function guardarDiseno(sb, buf, ext, nombre) {
  const ruta = rutaDiseno(ext);
  const { error: errSubir } = await sb.storage
    .from("disenos")
    .upload(ruta, buf, { contentType: TIPOS_DISENO[ext], upsert: false, cacheControl: "31536000" });
  if (errSubir) throw new Error("No se pudo guardar el archivo: " + errSubir.message);
  const { data } = sb.storage.from("disenos").getPublicUrl(ruta);
  return { url: data.publicUrl, ruta, nombre: limpiarNombreArchivo(nombre) };
}

// Límite por IP, en memoria (best effort: cada instancia de la función
// tiene su propio contador y se reinicia en frío). Frena abusos simples.
const LIMITE_SUBIDAS = { ventanaMs: 10 * 60 * 1000, max: 20 };
const subidasPorIp = new Map();
function ipDe(req, context) {
  return (
    (context && context.ip) ||
    req.headers.get("x-nf-client-connection-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "desconocida"
  );
}
function permitirSubida(ip) {
  const ahora = Date.now();
  let r = subidasPorIp.get(ip);
  if (!r || ahora > r.hasta) {
    r = { n: 0, hasta: ahora + LIMITE_SUBIDAS.ventanaMs };
    subidasPorIp.set(ip, r);
  }
  r.n++;
  if (subidasPorIp.size > 5000) {
    for (const [k, v] of subidasPorIp) if (ahora > v.hasta) subidasPorIp.delete(k);
  }
  return r.n <= LIMITE_SUBIDAS.max;
}

// Diseño de una línea del pedido: { nota, archivo, ubicaciones, prenda, logoPorWhatsApp }.
// Solo se guardan esas claves: la vista previa (`preview`, data URL) y cualquier otra se
// descartan. La URL del archivo no se confía: se reconstruye desde la ruta, y solo si la
// ruta tiene el formato de nuestro bucket.
// Devuelve { diseno, problema }. `problema` es el mensaje para el cliente cuando la línea
// es de una prenda con ubicaciones y no dice dónde va el logo, o no trae el logo (archivo)
// ni `logoPorWhatsApp` (docs/MODELO.md → Pedido).
function sanitizarDiseno(d, p) {
  if (!p.permiteDiseno) return { diseno: null, problema: null };
  const e = d && typeof d === "object" && !Array.isArray(d) ? d : {};
  const nota = texto(e.nota, 2000).trim();
  let archivo = null;
  const a = e.archivo;
  if (a && typeof a === "object") {
    let ruta = typeof a.ruta === "string" && RE_RUTA_DISENO.test(a.ruta) ? a.ruta : null;
    if (!ruta && typeof a.url === "string" && SUPABASE_URL && a.url.startsWith(prefijoPublico("disenos"))) {
      const resto = a.url.slice(prefijoPublico("disenos").length);
      if (RE_RUTA_DISENO.test(resto)) ruta = resto;
    }
    const nombre = limpiarNombreArchivo(a.nombre);
    // Solo { nombre }: el archivo no llegó a subirse y el cliente lo manda por WhatsApp.
    archivo = ruta && SUPABASE_URL ? { url: prefijoPublico("disenos") + ruta, ruta, nombre } : { nombre };
  }

  // Prendas y objetos del simulador: dónde va el logo, a lo sumo una ubicación por zona.
  const zonas = zonasDe(p);
  const ubicaciones = [];
  for (const u of arr(e.ubicaciones)) {
    const limpia = sanitizarUbicacion(u, zonas);
    if (limpia && !ubicaciones.some((x) => x.zona === limpia.zona)) ubicaciones.push(limpia);
    if (ubicaciones.length === ZONAS_LOGO.length) break;
  }
  const logoPorWhatsApp = e.logoPorWhatsApp === true;

  // Regla del simulador (prenda u objeto con zonas y que admite diseño): al menos una
  // ubicación y el logo (archivo) o "lo envío por WhatsApp".
  if (p.prenda && p.ubicaciones.length) {
    if (!ubicaciones.length) {
      return { diseno: null, problema: `${p.nombre}: elige dónde va tu logo (${listaZonas(p.ubicaciones, p.prenda.tipo)}).` };
    }
    if (!archivo && !logoPorWhatsApp) {
      return { diseno: null, problema: `${p.nombre}: sube tu logo o marca que lo envías por WhatsApp.` };
    }
  }
  if (!nota && !archivo && !ubicaciones.length && !logoPorWhatsApp) return { diseno: null, problema: null };
  return {
    diseno: { nota, archivo, ubicaciones, prenda: prendaDeLinea(e.prenda, p), logoPorWhatsApp },
    problema: null,
  };
}

// --------------------- inventario ---------------------
const UMBRAL_STOCK_BAJO = 3;

// Líneas {id, talla, qty} para las funciones de Postgres.
function lineasStock(items) {
  return arr(items)
    .map((it) => ({
      id: String((it && it.id) || ""),
      talla: it && it.talla != null && it.talla !== "" ? String(it.talla) : null,
      qty: entero(it && it.qty),
    }))
    .filter((x) => x.id && x.qty > 0);
}

// Si el error viene de reservar_stock por falta de stock, devuelve la lista de faltantes.
function faltantesDesdeError(err) {
  const msg = String((err && (err.message || err.details)) || "");
  const i = msg.indexOf("STOCK_INSUFICIENTE:");
  if (i === -1) return null;
  return msg
    .slice(i + "STOCK_INSUFICIENTE:".length)
    .split(" | ")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Alertas a partir de lo que devuelve reservar_stock ([{id, talla, qty, restante}]).
function alertasDesdeReserva(resultado, nombrePorId) {
  const alertas = [];
  arr(resultado).forEach((r) => {
    const restante = numero(r.restante);
    const antes = restante + numero(r.qty);
    const etiqueta = (nombrePorId.get(r.id) || r.id) + (r.talla ? ` (talla ${r.talla})` : "");
    if (restante <= 0) alertas.push(`🚫 *${etiqueta}* se quedó sin stock.`);
    else if (restante <= UMBRAL_STOCK_BAJO && antes > UMBRAL_STOCK_BAJO) alertas.push(`⚠️ Stock bajo de *${etiqueta}*: quedan ${restante} unidades.`);
  });
  return alertas;
}

// Existencias por variante de una fila de productos (snake_case). Bajo pedido → {}.
function variantesStock(f) {
  if (!f || f.modo_stock !== "stock") return {};
  const tallas = arr(f.tallas);
  if (tallas.length) {
    const st = obj(f.stock_tallas);
    const out = {};
    tallas.forEach((t) => (out[t] = entero(st[t])));
    return out;
  }
  return { "": entero(f.stock) };
}
function mismoStock(a, b) {
  if (entero(a.stock) !== entero(b.stock)) return false;
  const x = obj(a.stock_tallas);
  const y = obj(b.stock_tallas);
  const claves = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const k of claves) if (entero(x[k]) !== entero(y[k])) return false;
  return true;
}

// --------------------- textos de WhatsApp ---------------------
const fmtUSD = (n) => "$" + round2(n).toFixed(2);
const fmtBs = (n) => "Bs. " + round2(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function fmtFecha(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Caracas" });
  } catch (e) {
    return String(iso).slice(0, 10);
  }
}
const hola = (nombre) => (nombre ? `¡Hola, ${String(nombre).trim().split(" ")[0]}!` : "¡Hola!");
const fmtCm = (n) => Number(n || 0).toLocaleString("es-VE", { maximumFractionDigits: 1 });

// "Frente: Pecho izquierdo 9×9 cm" · "Manga derecha: 7×7 cm, a 2 cm del hombro"
// Objetos (tipo de la pieza): "Lado 2: Centrado 6×5 cm" · "Superficie: 20×16 cm, a 1 cm del borde"
function textoUbicacion(u, tipo) {
  const zona = nombreZona(u.zona, tipo);
  const medida = u.anchoCm > 0 && u.altoCm > 0 ? `${fmtCm(u.anchoCm)}×${fmtCm(u.altoCm)} cm` : "";
  if (u.ref) return `${zona}: ${u.ref}${medida ? " " + medida : ""}`;
  if (!medida) return zona;
  const desde = esObjeto(tipo) ? "del borde" : u.zona === "frente" || u.zona === "espalda" ? "del cuello" : "del hombro";
  return `${zona}: ${medida}, a ${fmtCm(u.desdeCm)} cm ${desde}`;
}

// Piezas del pedido para el grupo interno: una línea por producto y diseño, con sus
// tallas y dónde va el logo. Ej.: "Franela clásica (S×4, M×8) — Frente: Pecho izquierdo
// 9×9 cm; Espalda: Centro de la espalda 24×24 cm — logo por WhatsApp"
function resumenPiezas(items, productos) {
  const grupos = new Map();
  for (const it of items) {
    const p = productos.get(it.id);
    const d = it.diseno;
    const ubic = d ? arr(d.ubicaciones) : [];
    const tipo = (d && d.prenda && d.prenda.tipo) || (p && p.prenda && p.prenda.tipo) || "";
    const cosa = ubic.length ? "logo" : "archivo";
    const partes = [];
    if (ubic.length) partes.push(ubic.map((u) => textoUbicacion(u, tipo)).join("; "));
    if (d && d.archivo && d.archivo.url) partes.push(`${cosa} adjunto`);
    else if (d && (d.archivo || d.logoPorWhatsApp)) partes.push(`${cosa} por WhatsApp`);
    const titulo = it.nombre + (it.color && p && p.colores.length > 1 ? ` · ${it.color}` : "");
    const clave = [titulo, ...partes].join("\n");
    if (!grupos.has(clave)) grupos.set(clave, { titulo, partes, tallas: new Map() });
    const tallas = grupos.get(clave).tallas;
    const t = it.talla || "";
    tallas.set(t, (tallas.get(t) || 0) + it.qty);
  }
  return [...grupos.values()].map((g) => {
    const piezas = [...g.tallas].map(([t, n]) => (t ? `${t}×${n}` : `×${n}`)).join(", ");
    return [`${g.titulo} (${piezas})`, ...g.partes].join(" — ");
  });
}

function msgPedidoRecibido(o) {
  const enTaller = o.entrega && o.entrega.modo === "tienda";
  const pasoPago =
    o.pago && o.pago.metodo === "efectivo"
      ? "1️⃣ Pagas en efectivo al retirar en el taller."
      : "1️⃣ Verificamos tu pago (te avisamos por aquí).";
  const disenos = arr(o.items).map((it) => it && it.diseno).filter(Boolean);
  const conUbicaciones = disenos.some((d) => arr(d.ubicaciones).length);
  // El cliente marcó "lo envío por WhatsApp", o su archivo no llegó a subirse
  const faltaArchivo = disenos.some((d) => d.logoPorWhatsApp || (d.archivo && !d.archivo.url));
  const pasoPrueba = conUbicaciones
    ? "2️⃣ Por este chat te enviaremos la prueba con tu logo ubicado donde lo pediste, para que la apruebes."
    : "2️⃣ Te enviaremos la prueba de diseño por WhatsApp para que la apruebes.";
  return (
    `🟢 *Pedido recibido — Estampy*\n\n` +
    `${hola(o.cliente && o.cliente.nombre)} Gracias por elegir Estampy. Registramos tu pedido *${o.codigo}* ` +
    `por *${fmtUSD(o.totales.total)}* (${fmtBs(o.totales.totalBs)}).\n\n` +
    `Así seguimos:\n${pasoPago}\n` +
    `${pasoPrueba}\n` +
    `3️⃣ Producimos y ${enTaller ? "te avisamos para retirar en el taller" : "te lo despachamos"}. ` +
    `Fecha estimada: *${fmtFecha(o.eta)}* (puede moverse según cuándo apruebes el diseño).\n\n` +
    (faltaArchivo
      ? `📎 Envíanos por este chat tu logo o archivo de diseño, en la mejor calidad que tengas: lo necesitamos para preparar la prueba.\n\n`
      : "") +
    `Puedes seguir tu pedido en la web con el código *${o.codigo}*. ¿Dudas? Responde este mensaje. 🎨`
  );
}

function msgPagoRechazado(o) {
  return (
    `🔴 *No pudimos verificar tu pago*\n\n${hola(o.cliente && o.cliente.nombre)} Revisamos el pago de tu pedido *${o.codigo}* ` +
    `y todavía no lo encontramos en el estado de cuenta${o.pagoMotivo ? ` (${o.pagoMotivo})` : ""}.\n\n` +
    `Responde este mensaje con la captura del comprobante y lo revisamos de inmediato. 🤝`
  );
}

function msgCancelado(o) {
  return (
    `⛔ *Pedido cancelado*\n\n${hola(o.cliente && o.cliente.nombre)} Tu pedido *${o.codigo}* fue cancelado` +
    `${o.motivoCancelacion ? `: ${o.motivoCancelacion}` : "."}\n\n` +
    `Si es un error o quieres retomarlo, responde este mensaje y te ayudamos.`
  );
}

// Mensaje al cliente cuando el pedido llega al estado `indice` (0–5, ver docs/MODELO.md):
// 0 recibido · 1 pago · 2 diseño aprobado · 3 producción · 4 despachado/listo · 5 entregado/retirado
function msgEstado(o, indice, cfg) {
  const n = hola(o.cliente && o.cliente.nombre);
  const c = `*${o.codigo}*`;
  const enTaller = o.entrega && o.entrega.modo === "tienda";
  switch (indice) {
    case 1:
      return (
        `✅ *Pago verificado*\n\n${n} Confirmamos el pago de tu pedido ${c}.\n\n` +
        `Siguiente paso: te enviaremos la prueba de diseño por WhatsApp. Revísala con calma y respóndenos ` +
        `para aprobarla o pedir cambios; la producción arranca cuando la apruebes. 🎨`
      );
    case 2:
      return `🎨 *Diseño aprobado*\n\n${n} ¡Gracias por aprobar la prueba de diseño de tu pedido ${c}! Ya está en la cola de producción.`;
    case 3:
      return (
        `🖨️ *En producción*\n\n${n} Estamos imprimiendo y sublimando las piezas de tu pedido ${c}.` +
        `${o.eta ? ` Fecha estimada: *${fmtFecha(o.eta)}*.` : ""}`
      );
    case 4: {
      if (enTaller) {
        const t = arr(cfg && cfg.tiendas).find((x) => x && x.id === (o.entrega && o.entrega.tiendaId)) || {};
        const lugar = t.nombre || (o.entrega && o.entrega.tiendaNombre) || "el taller";
        const dir = t.direccion || (o.entrega && o.entrega.direccion) || "";
        const horario = t.horario || (o.entrega && o.entrega.horario) || "";
        return (
          `📦 *Listo para retirar*\n\n${n} Tu pedido ${c} está listo. Pásate por *${lugar}*` +
          `${dir ? ` (${dir})` : ""}${horario ? `\n🕘 ${horario}` : ""}\n\nTrae tu cédula y el código del pedido.`
        );
      }
      return (
        `🚚 *Despachado*\n\n${n} Tu pedido ${c} salió del taller` +
        `${o.courier ? ` con *${o.courier}*` : ""}${o.guia ? `, guía *${o.guia}*` : ""}. Pronto lo tendrás contigo.`
      );
    }
    case 5: {
      const ig = cfg && cfg.contact && cfg.contact.instagram ? ` Si te gustó, etiquétanos en Instagram @${cfg.contact.instagram}.` : "";
      return enTaller
        ? `✅ *Retirado*\n\n${n} Retiraste tu pedido ${c}. ¡Que lo disfrutes! Gracias por confiar en Estampy.${ig} 💜`
        : `✅ *Entregado*\n\n${n} Tu pedido ${c} fue entregado. ¡Gracias por confiar en Estampy!${ig} 💜`;
    }
    default:
      return null;
  }
}

// =========================================================
// Handler principal
// =========================================================
export default async (req, context) => {
  const url = new URL(req.url);
  const partes = url.pathname.replace(/^\/(\.netlify\/functions\/)?api\/?/, "").split("/").filter(Boolean);
  const ruta = "/" + partes.join("/");
  const metodo = req.method;

  const sb = db();

  // -------- /salud --------
  if (ruta === "/salud" && metodo === "GET") {
    const avisos = [];
    if (!SECRETO) avisos.push("Falta STAMPY_SECRET: el panel está deshabilitado hasta que la configures.");
    else if (SECRETO.length < SECRETO_LARGO_MINIMO) avisos.push(`STAMPY_SECRET es corta: usa ${SECRETO_LARGO_MINIMO} caracteres o más.`);
    const base = {
      secretoConfigurado: !!SECRETO,
      secretoPorDefecto: !SECRETO, // compatibilidad con api.js (aviso de seguridad)
      secretoCorto: !!SECRETO && SECRETO.length < SECRETO_LARGO_MINIMO,
      panelHabilitado: !!SECRETO,
      evolutionConfigurado: evolutionListo(),
      evolutionGrupoInternoConfigurado: !!EVOLUTION_GRUPO_INTERNO,
      avisos,
    };
    if (!sb) {
      return json(200, {
        ok: false,
        almacenamiento: false,
        motivo: "Faltan STAMPY_SUPABASE_URL o STAMPY_SUPABASE_SERVICE_KEY en las variables de entorno.",
        ...base,
      });
    }
    try {
      const { error: err } = await sb.from("configuracion").select("id").limit(1);
      if (err) throw err;
      return json(200, { ok: true, almacenamiento: true, ...base });
    } catch (e) {
      return json(200, { ok: false, almacenamiento: false, motivo: e.message, ...base });
    }
  }

  if (!sb) return error(500, "Almacenamiento no configurado.");

  try {
    // -------- /publico --------
    if (ruta === "/publico" && metodo === "GET") {
      const [catalogo, config] = await Promise.all([cargarCatalogo(sb), cargarConfig(sb)]);
      return json(200, { catalogo, config: config || {} });
    }

    // -------- /sesion (login) --------
    if (ruta === "/sesion" && metodo === "POST") {
      if (!SECRETO) return error(503, MSG_SIN_SECRETO);
      const body = (await leerJson(req)) || {};
      const usuario = String(body.usuario || "").trim().toLowerCase();
      const clave = String(body.clave || "");
      if (!usuario || !clave) return error(400, "Usuario y clave requeridos.");

      const { data: fila, error: err } = await sb.from("usuarios").select("*").eq("usuario", usuario).maybeSingle();
      if (err) throw err;
      if (!fila || fila.activo === false) return error(401, "Usuario o clave incorrectos.");

      const ok = await bcrypt.compare(clave, fila.clave_hash);
      if (!ok) return error(401, "Usuario o clave incorrectos.");

      const sesion = { usuario: fila.usuario, nombre: fila.nombre, rol: fila.rol, cargo: fila.cargo, desde: new Date().toISOString() };
      const token = firmarToken({ ...sesion, exp: Date.now() + 1000 * 60 * 60 * 12 }); // 12 horas

      return json(200, {
        token,
        sesion,
        permisos: PERMISOS[fila.rol] || [],
        avisoSeguridad: SECRETO.length < SECRETO_LARGO_MINIMO,
      });
    }

    // -------- /estado (requiere sesión) --------
    if (ruta === "/estado" && metodo === "GET") {
      const { sesion, respuesta } = exigirSesion(req);
      if (respuesta) return respuesta;
      const [catalogo, config, pedidos, bitacora] = await Promise.all([
        cargarCatalogo(sb), cargarConfig(sb), cargarPedidos(sb), cargarBitacora(sb),
      ]);
      return json(200, {
        catalogo, config: config || {}, pedidos, bitacora,
        sesion: { usuario: sesion.usuario, nombre: sesion.nombre, rol: sesion.rol, cargo: sesion.cargo, desde: sesion.desde },
        permisos: PERMISOS[sesion.rol] || [],
      });
    }

    // -------- /pedido (crear, público) --------
    // El servidor NO confía en precios, totales, fechas ni estados del navegador:
    // los recalcula desde el catálogo y la configuración guardados.
    if (ruta === "/pedido" && metodo === "POST") {
      const body = await leerJson(req);
      if (!body || typeof body !== "object") return error(400, "Pedido inválido.");
      const lineas = arr(body.items);
      if (!lineas.length) return error(400, "El pedido no tiene productos.");
      if (lineas.length > 100) return error(400, "El pedido tiene demasiadas líneas (máximo 100).");

      const cfg = await cargarConfig(sb);
      if (!cfg || !Array.isArray(cfg.zonas)) return error(503, "La tienda todavía no está configurada. Intenta más tarde.");

      // Productos del pedido, desde la base (solo activos)
      const ids = [...new Set(lineas.map((it) => String((it && it.id) || "")).filter(Boolean))];
      const filasProd = ids.length ? await filasPorClaves(sb, "productos", "id", ids) : [];
      const productos = new Map(filasProd.filter((f) => f.activo !== false).map((f) => [f.id, productoDesdeFila(f)]));

      const problemas = [];
      const limpias = [];
      for (const it of lineas) {
        const idLinea = String((it && it.id) || "");
        const p = productos.get(idLinea);
        if (!p) {
          problemas.push(`El producto "${texto(idLinea, 80)}" no existe o ya no está disponible.`);
          continue;
        }
        const qty = Number(it.qty);
        if (!Number.isInteger(qty) || qty < 1 || qty > 9999) {
          problemas.push(`Cantidad inválida para ${p.nombre}.`);
          continue;
        }
        let talla = null;
        if (p.tallas.length) {
          talla = it.talla == null ? "" : String(it.talla);
          if (!p.tallas.includes(talla)) {
            problemas.push(`${p.nombre}: elige una talla válida (${p.tallas.join(", ")}).`);
            continue;
          }
        }
        let color = null;
        if (p.colores.length && it.color != null && it.color !== "") {
          const c = p.colores.find((x) => x && x.nombre === String(it.color));
          if (!c) {
            problemas.push(`${p.nombre}: el color "${texto(it.color, 40)}" no está disponible.`);
            continue;
          }
          color = c.nombre;
        }
        const { diseno, problema } = sanitizarDiseno(it.diseno, p);
        if (problema) {
          problemas.push(problema);
          continue;
        }
        limpias.push({ p, qty, talla, color, diseno });
      }
      if (problemas.length) {
        // Las tallas de un mismo diseño fallan igual: un solo mensaje por problema
        const unicos = [...new Set(problemas)];
        return error(400, unicos.join(" "), { problemas: unicos });
      }

      // Cantidad total por producto: define el escalón al mayor y el pedido mínimo
      const totalPorId = {};
      limpias.forEach((l) => (totalPorId[l.p.id] = (totalPorId[l.p.id] || 0) + l.qty));
      const bajoMinimo = Object.keys(totalPorId)
        .map((id) => productos.get(id))
        .filter((p) => totalPorId[p.id] < p.pedidoMinimo)
        .map((p) => ({ id: p.id, nombre: p.nombre, tiene: totalPorId[p.id], minimo: p.pedidoMinimo }));
      if (bajoMinimo.length) {
        return error(
          400,
          "No se alcanza el pedido mínimo: " + bajoMinimo.map((x) => `${x.nombre} (mínimo ${x.minimo}, tienes ${x.tiene})`).join(", ") + ".",
          { bajoMinimo }
        );
      }

      const items = limpias.map((l) => ({
        id: l.p.id,
        nombre: l.p.nombre,
        qty: l.qty,
        precio: precioUnitario(l.p, totalPorId[l.p.id]),
        img: l.p.imagenes[0] || "",
        talla: l.talla,
        color: l.color,
        diseno: l.diseno,
      }));
      const subtotal = round2(items.reduce((s, it) => s + round2(it.precio * it.qty), 0));

      // Entrega
      const e = obj(body.entrega);
      let entrega;
      if (e.modo === "delivery") {
        const zona = cfg.zonas.find((z) => z && z.id === e.zonaId);
        if (!zona) return error(400, "Elige una zona de delivery válida.");
        entrega = {
          modo: "delivery",
          zonaId: zona.id,
          zonaNombre: zona.nombre,
          direccion: texto(e.direccion, 300),
          ciudad: texto(e.ciudad, 100),
          referencia: texto(e.referencia, 300),
          nota: texto(e.nota, 500),
        };
      } else if (e.modo === "tienda") {
        const tiendas = arr(cfg.tiendas);
        const t = tiendas.find((x) => x && x.id === e.tiendaId) || (e.tiendaId ? null : tiendas[0]);
        if (!t) return error(400, "Elige un punto de retiro válido.");
        entrega = {
          modo: "tienda",
          tiendaId: t.id,
          tiendaNombre: t.nombre,
          direccion: t.direccion || "",
          horario: t.horario || "",
          retiraOtro: texto(e.retiraOtro, 120),
        };
      } else {
        return error(400, "Elige delivery o retiro en el taller.");
      }

      // Cliente
      const ci = obj(body.cliente);
      const cliente = {
        nombre: texto(ci.nombre, 120).trim(),
        cedula: texto(ci.cedula, 30).trim(),
        telefono: texto(ci.telefono, 30).trim(),
        email: texto(ci.email, 120).trim(),
        empresa: ci.empresa && typeof ci.empresa === "object"
          ? { razonSocial: texto(ci.empresa.razonSocial, 200), rif: texto(ci.empresa.rif, 30) }
          : null,
      };
      if (!cliente.nombre || !cliente.telefono) return error(400, "Faltan tu nombre y tu teléfono.");

      // Pago
      const pagoIn = obj(body.pago);
      const metodoPago = String(pagoIn.metodo || "");
      if (!METODOS_PAGO.includes(metodoPago)) return error(400, "Elige un método de pago válido.");
      if (metodoPago === "efectivo" && entrega.modo !== "tienda") {
        return error(400, "El pago en efectivo solo está disponible al retirar en el taller.");
      }
      const totales = calcTotales(subtotal, entrega, metodoPago, cfg);
      const pago = {};
      Object.keys(pagoIn).slice(0, 30).forEach((k) => {
        const v = pagoIn[k];
        if (typeof v === "string") pago[k] = texto(v, 300);
        else if (typeof v === "number" || typeof v === "boolean" || v === null) pago[k] = v;
      });
      pago.metodo = metodoPago;
      pago.montoBs = totales.totalBs;

      const totalCliente = body.totales && Number(body.totales.total);
      const totalesAjustados = Number.isFinite(totalCliente) && Math.abs(totalCliente - totales.total) > 0.009;

      // Reservar inventario: todo o nada, en una transacción (sql/02_funciones.sql)
      const reserva = lineasStock(items);
      const hayStockControlado = items.some((it) => productos.get(it.id).modoStock === "stock");
      let reservado = [];
      if (hayStockControlado) {
        const { data: res, error: errRes } = await sb.rpc("reservar_stock", { p_items: reserva });
        if (errRes) {
          const faltantes = faltantesDesdeError(errRes);
          if (faltantes) return error(409, "No hay suficiente inventario: " + faltantes.join("; ") + ".", { faltantes });
          throw errRes;
        }
        reservado = arr(res);
      }
      const devolverReserva = async () => {
        if (reservado.length) await sb.rpc("devolver_stock", { p_items: reserva });
      };

      const ahora = new Date();
      const dias = diasEntrega([...new Set(items.map((it) => it.id))].map((id) => productos.get(id)), entrega, cfg);
      const couriers = arr(cfg.courier).filter(Boolean);
      const orden = {
        codigo: typeof body.codigo === "string" && RE_CODIGO.test(body.codigo) ? body.codigo : generarCodigo(),
        creado: ahora.toISOString(),
        eta: new Date(ahora.getTime() + dias * 86400000).toISOString(),
        items,
        cliente,
        entrega,
        pago,
        totales,
        estadoIndex: 0,
        pagoEstado: metodoPago === "efectivo" ? "por-cobrar" : "reportado",
        cancelado: false,
        notas: [],
        historial: [{ paso: "recibido", fecha: ahora.toISOString() }],
        guia: generarGuia(),
        courier: entrega.modo === "delivery" && couriers.length ? couriers[randomInt(couriers.length)] : null,
        repartidor: null,
      };

      // Insertar; si el código ya existe se genera otro (hasta 5 intentos).
      let insertado = false;
      for (let intento = 0; intento < 5; intento++) {
        const { error: errIns } = await sb.from("pedidos").insert(filaDesdePedido(orden));
        if (!errIns) {
          insertado = true;
          break;
        }
        if (errIns.code === "23505") {
          orden.codigo = generarCodigo();
          continue;
        }
        await devolverReserva();
        throw errIns;
      }
      if (!insertado) {
        await devolverReserva();
        return error(500, "No pudimos generar un código de pedido. Intenta de nuevo.");
      }

      await registrar(sb, {
        tipo: "pedido-creado",
        mensaje: `Pedido ${orden.codigo} por ${fmtUSD(totales.total)}` +
          (totalesAjustados ? ` (el navegador había calculado ${fmtUSD(totalCliente)}; se usó el total del servidor)` : ""),
        referencia: orden.codigo,
      });

      const nombrePorId = new Map([...productos.values()].map((p) => [p.id, p.nombre]));
      const alertas = alertasDesdeReserva(reservado, nombrePorId);
      const unidades = items.reduce((s, it) => s + it.qty, 0);
      const piezas = resumenPiezas(items, productos);
      await Promise.all([
        enviarWhatsApp(sb, cliente.telefono, msgPedidoRecibido(orden), orden.codigo),
        notificarGrupoInterno(
          sb,
          `🛒 *Nuevo pedido*\n📋 Orden: *${orden.codigo}*\n👤 Cliente: *${cliente.nombre}*\n` +
            `👕 ${unidades} pieza(s) en ${items.length} línea(s)\n` +
            piezas.map((x) => `• ${x}\n`).join("") +
            `💵 Total: *${fmtUSD(totales.total)}*\n` +
            `🏪 Entrega: *${entrega.modo === "tienda" ? "Retiro en el taller" : "Delivery · " + entrega.zonaNombre}*\n` +
            `⏳ ${orden.pagoEstado === "por-cobrar" ? "Pago en efectivo al retirar." : "Pago pendiente de verificación."}`,
          orden.codigo
        ),
        ...alertas.map((msg) => notificarGrupoInterno(sb, msg, orden.codigo)),
      ]);

      return json(201, { orden, totalesAjustados });
    }

    // -------- /pedido/:codigo (seguimiento público) --------
    if (partes[0] === "pedido" && partes[1] && !partes[2] && metodo === "GET") {
      const codigo = decodeURIComponent(partes[1]).trim().toUpperCase();
      if (!RE_CODIGO.test(codigo)) return error(404, "No encontramos ese número de pedido.");
      const { data, error: err } = await sb.from("pedidos").select("*").eq("codigo", codigo).maybeSingle();
      if (err) throw err;
      if (!data) return error(404, "No encontramos ese número de pedido.");
      return json(200, { orden: pedidoPublico(pedidoDesdeFila(data)) });
    }

    // -------- /pedido/:codigo (eliminar) — solo administradores --------
    if (partes[0] === "pedido" && partes[1] && !partes[2] && metodo === "DELETE") {
      const { sesion, respuesta } = exigirSesion(req, "admin");
      if (respuesta) return respuesta;
      const codigo = decodeURIComponent(partes[1]);
      const { data: existente, error: errSel } = await sb.from("pedidos").select("*").eq("codigo", codigo).maybeSingle();
      if (errSel) throw errSel;
      if (!existente) return error(404, "No encontramos ese pedido.");
      const { error: err } = await sb.from("pedidos").delete().eq("codigo", codigo);
      if (err) throw err;
      // Si el pedido seguía activo, su mercancía vuelve al inventario.
      let devuelto = false;
      if (!existente.cancelado) {
        const { error: errDev } = await sb.rpc("devolver_stock", { p_items: lineasStock(existente.items) });
        devuelto = !errDev;
      }
      await registrar(sb, {
        tipo: "pedido-eliminado",
        mensaje: `${sesion.nombre} eliminó el pedido ${codigo}` + (devuelto ? ". Stock devuelto." : ""),
        referencia: codigo,
        usuario: sesion.usuario,
        rol: sesion.rol,
      });
      return json(200, { ok: true, stockDevuelto: devuelto, catalogo: devuelto ? await cargarCatalogo(sb) : undefined });
    }

    // -------- /diseno (subir arte del cliente, público) --------
    // Cuerpo: { nombre, tipo, datos (base64, con o sin "data:...;base64,") }
    // OJO: Netlify limita el cuerpo de la petición a ~6 MB, así que por esta
    // vía caben archivos de hasta ~4 MB. Para 4–8 MB, api.js usa
    // /diseno/firma + /diseno/verificar (subida directa a Storage).
    if (ruta === "/diseno" && metodo === "POST") {
      if (!permitirSubida(ipDe(req, context))) {
        return error(429, "Subiste demasiados archivos seguidos. Espera unos minutos e intenta de nuevo.");
      }
      const body = await leerJson(req);
      if (!body || typeof body.datos !== "string" || !body.datos) return error(400, "Falta el archivo.");
      const declarado = String(body.tipo || "").toLowerCase();
      if (declarado && !EXT_POR_MIME[declarado]) return error(415, "Formato no permitido. Usa PNG, JPG, WEBP o PDF.");

      let b64 = body.datos;
      const coma = b64.indexOf(",");
      if (b64.startsWith("data:") && coma !== -1) b64 = b64.slice(coma + 1);
      b64 = b64.replace(/\s/g, "");
      if (b64.length > Math.ceil(DISENO_MAX / 3) * 4 + 4) return error(413, "El archivo pesa más de 8 MB.");
      if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(b64)) return error(400, "El archivo no está bien codificado.");
      const buf = Buffer.from(b64, "base64");
      if (!buf.length) return error(400, "El archivo está vacío.");
      if (buf.length > DISENO_MAX) return error(413, "El archivo pesa más de 8 MB.");

      const ext = detectarTipo(buf);
      if (!ext) return error(415, "El archivo no parece un PNG, JPG, WEBP o PDF válido.");
      return json(201, await guardarDiseno(sb, buf, ext, body.nombre));
    }

    // -------- /diseno/firma (archivos grandes: pide permiso para subir directo) --------
    // Cuerpo: { nombre, tipo, tamano }. Responde { subida, token, ruta, tipo, nombre }.
    if (ruta === "/diseno/firma" && metodo === "POST") {
      if (!permitirSubida(ipDe(req, context))) {
        return error(429, "Subiste demasiados archivos seguidos. Espera unos minutos e intenta de nuevo.");
      }
      const body = (await leerJson(req)) || {};
      const ext = EXT_POR_MIME[String(body.tipo || "").toLowerCase()];
      if (!ext) return error(415, "Formato no permitido. Usa PNG, JPG, WEBP o PDF.");
      const tamano = Number(body.tamano);
      if (!Number.isFinite(tamano) || tamano <= 0) return error(400, "Tamaño de archivo inválido.");
      if (tamano > DISENO_MAX) return error(413, "El archivo pesa más de 8 MB.");
      const rutaNueva = rutaDiseno(ext);
      const { data, error: errFirma } = await sb.storage.from("disenos").createSignedUploadUrl(rutaNueva);
      if (errFirma) throw errFirma;
      return json(200, {
        subida: data.signedUrl,
        token: data.token,
        ruta: rutaNueva,
        tipo: TIPOS_DISENO[ext],
        nombre: limpiarNombreArchivo(body.nombre),
      });
    }

    // -------- /diseno/verificar (tras la subida directa: revisa el contenido real) --------
    // Cuerpo: { ruta, nombre }. Responde { url, ruta, nombre } o borra el archivo si no es válido.
    if (ruta === "/diseno/verificar" && metodo === "POST") {
      const body = (await leerJson(req)) || {};
      const rutaArchivo = String(body.ruta || "");
      if (!RE_RUTA_DISENO.test(rutaArchivo)) return error(400, "Ruta de archivo inválida.");
      const { data: blob, error: errBajar } = await sb.storage.from("disenos").download(rutaArchivo);
      if (errBajar || !blob) return error(404, "No encontramos el archivo subido.");
      const buf = Buffer.from(await blob.arrayBuffer());
      const extRuta = rutaArchivo.split(".").pop();
      const ext = detectarTipo(buf);
      if (buf.length > DISENO_MAX || !ext || ext !== extRuta) {
        await sb.storage.from("disenos").remove([rutaArchivo]).catch(() => {});
        return error(415, buf.length > DISENO_MAX ? "El archivo pesa más de 8 MB." : "El archivo no parece un PNG, JPG, WEBP o PDF válido.");
      }
      const { data } = sb.storage.from("disenos").getPublicUrl(rutaArchivo);
      return json(200, { url: data.publicUrl, ruta: rutaArchivo, nombre: limpiarNombreArchivo(body.nombre) });
    }

    // -------- /producto/:id/imagen (subir foto del catálogo) --------
    if (partes[0] === "producto" && partes[1] && partes[2] === "imagen" && metodo === "POST") {
      const { sesion, respuesta } = exigirSesion(req, "inventario");
      if (respuesta) return respuesta;

      const productoId = decodeURIComponent(partes[1]);
      const body = await leerJson(req);
      if (!body || typeof body.dataBase64 !== "string" || !body.dataBase64) return error(400, "Falta la imagen.");

      const { data: prod, error: errProd } = await sb.from("productos").select("imagenes").eq("id", productoId).maybeSingle();
      if (errProd) throw errProd;
      if (!prod) return error(404, "No encontramos ese producto.");

      let b64 = body.dataBase64;
      const coma = b64.indexOf(",");
      if (b64.startsWith("data:") && coma !== -1) b64 = b64.slice(coma + 1);
      const binario = Buffer.from(b64, "base64");
      if (!binario.length) return error(400, "Imagen inválida.");
      if (binario.length > 6 * 1024 * 1024) return error(413, "La imagen pesa demasiado (máximo 6 MB).");
      const ext = detectarTipo(binario);
      if (!ext || ext === "pdf") return error(415, "La foto debe ser PNG, JPG o WEBP.");

      const nombreArchivo = `${productoId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
      const { error: errSubir } = await sb.storage
        .from("productos")
        .upload(nombreArchivo, binario, { contentType: TIPOS_DISENO[ext], upsert: false, cacheControl: "604800" });
      if (errSubir) return error(500, "No se pudo subir la imagen: " + errSubir.message);

      const { data: urlPublica } = sb.storage.from("productos").getPublicUrl(nombreArchivo);
      const imagenesNuevas = [...arr(prod.imagenes), urlPublica.publicUrl];

      const { error: errUpd } = await sb.from("productos").update({ imagenes: imagenesNuevas, actualizado: new Date().toISOString() }).eq("id", productoId);
      if (errUpd) return error(500, errUpd.message);

      await registrar(sb, {
        tipo: "producto-imagen-agregada",
        mensaje: `${sesion.nombre} agregó una foto a ${productoId}`,
        referencia: productoId,
        usuario: sesion.usuario,
        rol: sesion.rol,
      });
      return json(200, { ok: true, imagenes: imagenesNuevas });
    }

    // -------- /producto/:id/imagen (eliminar foto) --------
    if (partes[0] === "producto" && partes[1] && partes[2] === "imagen" && metodo === "DELETE") {
      const { respuesta } = exigirSesion(req, "inventario");
      if (respuesta) return respuesta;

      const productoId = decodeURIComponent(partes[1]);
      const body = await leerJson(req);
      if (!body || typeof body.url !== "string" || !body.url) return error(400, "Falta indicar cuál imagen eliminar.");

      const { data: prod, error: errProd } = await sb.from("productos").select("imagenes").eq("id", productoId).maybeSingle();
      if (errProd) throw errProd;
      if (!prod) return error(404, "No encontramos ese producto.");

      const imagenesNuevas = arr(prod.imagenes).filter((u) => u !== body.url);

      // Si la imagen vivía en nuestro bucket de Storage, la borra también de ahí.
      const marcador = "/storage/v1/object/public/productos/";
      const pos = body.url.indexOf(marcador);
      if (pos !== -1) {
        const rutaInterna = body.url.slice(pos + marcador.length);
        await sb.storage.from("productos").remove([rutaInterna]).catch(() => {});
      }

      const { error: errUpd } = await sb.from("productos").update({ imagenes: imagenesNuevas, actualizado: new Date().toISOString() }).eq("id", productoId);
      if (errUpd) return error(500, errUpd.message);
      return json(200, { ok: true, imagenes: imagenesNuevas });
    }

    // -------- /producto/:id (dar de baja: borrado lógico) --------
    if (partes[0] === "producto" && partes[1] && !partes[2] && metodo === "DELETE") {
      const { sesion, respuesta } = exigirSesion(req, "inventario");
      if (respuesta) return respuesta;

      const productoId = decodeURIComponent(partes[1]);
      const { data: prod, error: errProd } = await sb.from("productos").select("id, nombre").eq("id", productoId).maybeSingle();
      if (errProd) throw errProd;
      if (!prod) return error(404, "No encontramos ese producto.");

      const { error: errUpd } = await sb.from("productos").update({ activo: false, actualizado: new Date().toISOString() }).eq("id", productoId);
      if (errUpd) return error(500, errUpd.message);

      await registrar(sb, {
        tipo: "modelo-dado-de-baja",
        mensaje: `${sesion.nombre} dio de baja ${prod.nombre}`,
        referencia: productoId,
        usuario: sesion.usuario,
        rol: sesion.rol,
      });
      return json(200, { ok: true });
    }

    // -------- /coleccion/:nombre (guarda desde el panel) --------
    if (partes[0] === "coleccion" && partes[1] && metodo === "PUT") {
      const { sesion, respuesta } = exigirSesion(req);
      if (respuesta) return respuesta;
      const nombre = partes[1];
      const permisosRol = PERMISOS[sesion.rol] || [];
      const body = await leerJson(req);
      if (body == null) return error(400, "Cuerpo inválido.");

      // ---- catálogo ----
      if (nombre === "catalogo") {
        if (!permisosRol.includes("inventario")) return error(403, "Tu rol no tiene permiso de inventario.");
        if (!Array.isArray(body)) return error(400, "Se esperaba un arreglo de productos.");

        const entrada = body.filter((p) => p && typeof p.id === "string" && p.id.trim() && p.id.length <= 100);
        const previos = await filasPorClaves(sb, "productos", "id", entrada.map((p) => p.id.trim()),
          "id, nombre, modo_stock, tallas, stock, stock_tallas, stock_rev");
        const previoPorId = new Map(previos.map((f) => [f.id, f]));

        // Ver "INVENTARIO — fuente de verdad" al inicio del archivo.
        const completas = [];
        const sinStock = [];
        const avisos = [];
        for (const p of entrada) {
          const fila = filaDesdeProducto(p);
          const prev = previoPorId.get(fila.id);
          const revVieja = prev && typeof p.stockRev === "number" && p.stockRev !== prev.stock_rev;
          if (revVieja) {
            const { stock, stock_tallas, ...resto } = fila;
            sinStock.push(resto);
            if (fila.modo_stock === "stock" && !mismoStock(fila, prev)) {
              avisos.push(`${fila.nombre}: el inventario cambió en el servidor (ventas o cancelaciones) desde que abriste el panel; se conservó el stock del servidor. Revisa y vuelve a ajustarlo si hace falta.`);
            }
          } else {
            completas.push(fila);
          }
        }

        if (completas.length) {
          const { error: err } = await sb.from("productos").upsert(completas, { onConflict: "id" });
          if (err) throw err;
        }
        if (sinStock.length) {
          const { error: err } = await sb.from("productos").upsert(sinStock, { onConflict: "id" });
          if (err) throw err;
        }

        // Alertas de stock bajo por variante (talla), solo productos con inventario
        const alertas = [];
        for (const fila of completas) {
          const antes = variantesStock(previoPorId.get(fila.id));
          const despues = variantesStock(fila);
          for (const k of Object.keys(despues)) {
            if (antes[k] === undefined) continue;
            const etiqueta = fila.nombre + (k ? ` (talla ${k})` : "");
            if (despues[k] === 0 && antes[k] > 0) alertas.push(`🚫 *${etiqueta}* se quedó sin stock.`);
            else if (despues[k] > 0 && despues[k] <= UMBRAL_STOCK_BAJO && antes[k] > UMBRAL_STOCK_BAJO) {
              alertas.push(`⚠️ Stock bajo de *${etiqueta}*: quedan ${despues[k]} unidades.`);
            }
          }
        }
        for (const msg of alertas) await notificarGrupoInterno(sb, msg, null);

        return json(200, { ok: true, avisos, catalogo: avisos.length ? await cargarCatalogo(sb) : undefined });
      }

      // ---- configuración ----
      if (nombre === "config") {
        if (!permisosRol.includes("configuracion")) return error(403, "Tu rol no tiene permiso de configuración.");
        if (typeof body !== "object" || Array.isArray(body)) return error(400, "Se esperaba un objeto de configuración.");
        const { error: err } = await sb.from("configuracion").upsert({ id: 1, datos: body, actualizado: new Date().toISOString() });
        if (err) throw err;
        return json(200, { ok: true });
      }

      // ---- pedidos ----
      if (nombre === "pedidos") {
        if (!permisosRol.includes("pedidos")) return error(403, "Tu rol no tiene permiso de pedidos.");
        if (!Array.isArray(body)) return error(400, "Se esperaba un arreglo de pedidos.");

        const validos = body.filter((o) => o && typeof o.codigo === "string" && RE_CODIGO.test(o.codigo));
        const previos = await filasPorClaves(sb, "pedidos", "codigo", validos.map((o) => o.codigo));
        const previoPorCodigo = new Map(previos.map((f) => [f.codigo, f]));

        const existentes = validos.filter((o) => previoPorCodigo.has(o.codigo));
        // Los pedidos nuevos se crean con POST /pedido (que valida precios y
        // reserva stock). Por aquí solo un admin puede insertar (p. ej. al
        // restaurar pedidos de ejemplo) y SIN tocar inventario.
        const nuevos = validos.filter((o) => !previoPorCodigo.has(o.codigo));
        const ignorados = sesion.rol === "admin" ? [] : nuevos.map((o) => o.codigo);

        const avisos = [];
        let stockCambio = false;
        const alertas = [];
        const nombresProd = new Map();

        // 1) Reactivaciones: reservar stock ANTES de guardar. Si no alcanza,
        //    el pedido sigue cancelado.
        const reactivados = [];
        for (const o of existentes) {
          const antes = previoPorCodigo.get(o.codigo);
          if (!(antes.cancelado && !o.cancelado)) continue;
          const lineas = lineasStock(antes.items);
          const { data: res, error: errRes } = lineas.length
            ? await sb.rpc("reservar_stock", { p_items: lineas })
            : { data: [], error: null };
          if (errRes) {
            const faltantes = faltantesDesdeError(errRes);
            if (!faltantes) throw errRes;
            o.cancelado = true;
            o.motivoCancelacion = antes.motivo_cancelacion || o.motivoCancelacion || "Cancelado";
            o.canceladoEl = antes.cancelado_el || o.canceladoEl;
            avisos.push(`${o.codigo} no se reactivó por falta de inventario: ${faltantes.join("; ")}.`);
            await registrar(sb, { tipo: "reactivacion-rechazada", mensaje: `${o.codigo}: sin inventario (${faltantes.join("; ")})`, referencia: o.codigo, usuario: sesion.usuario, rol: sesion.rol });
            continue;
          }
          reactivados.push({ codigo: o.codigo, lineas });
          if (arr(res).length) stockCambio = true;
          arr(antes.items).forEach((it) => nombresProd.set(it.id, it.nombre));
          alertas.push(...alertasDesdeReserva(res, nombresProd));
        }

        // 2) Guardar. En pedidos existentes, items (con su diseño y las
        //    ubicaciones del logo), totales y fecha de creación son del
        //    servidor: el panel no los puede cambiar.
        const filasExistentes = existentes.map((o) => {
          const f = filaDesdePedido(o);
          delete f.items;
          delete f.totales;
          delete f.creado;
          return f;
        });
        const filasNuevas = sesion.rol === "admin" ? nuevos.map(filaDesdePedido) : [];
        try {
          if (filasExistentes.length) {
            const { error: err } = await sb.from("pedidos").upsert(filasExistentes, { onConflict: "codigo" });
            if (err) throw err;
          }
          if (filasNuevas.length) {
            const { error: err } = await sb.from("pedidos").upsert(filasNuevas, { onConflict: "codigo", ignoreDuplicates: true });
            if (err) throw err;
          }
        } catch (e) {
          // Deshace las reservas de las reactivaciones que no quedaron guardadas
          for (const r of reactivados) if (r.lineas.length) await sb.rpc("devolver_stock", { p_items: r.lineas });
          throw e;
        }

        // 3) Cancelaciones: devolver stock DESPUÉS de guardar el pedido como cancelado.
        for (const o of existentes) {
          const antes = previoPorCodigo.get(o.codigo);
          if (!(!antes.cancelado && o.cancelado)) continue;
          const lineas = lineasStock(antes.items);
          if (!lineas.length) continue;
          const { data: res, error: errDev } = await sb.rpc("devolver_stock", { p_items: lineas });
          if (errDev) {
            await registrar(sb, { tipo: "stock-error", mensaje: `No se pudo devolver el stock de ${o.codigo}: ${errDev.message}`, referencia: o.codigo, usuario: sesion.usuario, rol: sesion.rol });
            avisos.push(`${o.codigo}: no se pudo devolver el stock automáticamente. Revísalo en Inventario.`);
          } else if (arr(res).length) {
            stockCambio = true;
          }
        }

        // 4) Notificaciones: comparamos antes vs. después de cada pedido.
        let cfg = null;
        for (const o of existentes) {
          const antes = previoPorCodigo.get(o.codigo);
          const actual = pedidoDesdeFila({ ...antes, ...filaDesdePedido(o), items: antes.items, totales: antes.totales, creado: antes.creado });
          const tel = actual.cliente && actual.cliente.telefono;

          if (!antes.cancelado && actual.cancelado) {
            if (tel) await enviarWhatsApp(sb, tel, msgCancelado(actual), actual.codigo);
            await notificarGrupoInterno(sb, `⛔ *Pedido cancelado*\n📋 Orden: *${actual.codigo}*\n👤 ${actual.cliente.nombre || "Cliente"}\n↩️ Stock devuelto al inventario.`, actual.codigo);
            continue;
          }
          if (actual.cancelado) continue;

          if (antes.pago_estado !== "rechazado" && actual.pagoEstado === "rechazado") {
            if (tel) await enviarWhatsApp(sb, tel, msgPagoRechazado(actual), actual.codigo);
            await notificarGrupoInterno(sb, `⚠️ *Pago rechazado*\n📋 Orden: *${actual.codigo}*\n👤 Cliente: *${actual.cliente.nombre || "Cliente"}*`, actual.codigo);
          }

          const pagoRecienVerificado = antes.pago_estado !== "verificado" && actual.pagoEstado === "verificado";
          const cambioEstado = antes.estado_index !== actual.estadoIndex && actual.estadoIndex > antes.estado_index;
          if (!tel) continue;
          if (cambioEstado && actual.estadoIndex >= 2) {
            if (!cfg) cfg = (await cargarConfig(sb)) || {};
            const msg = msgEstado(actual, actual.estadoIndex, cfg);
            if (msg) await enviarWhatsApp(sb, tel, msg, actual.codigo);
          } else if (pagoRecienVerificado || (cambioEstado && actual.estadoIndex === 1)) {
            await enviarWhatsApp(sb, tel, msgEstado(actual, 1, cfg), actual.codigo);
          }
        }
        for (const msg of alertas) await notificarGrupoInterno(sb, msg, null);

        return json(200, {
          ok: true,
          avisos,
          ignorados,
          // Si el inventario cambió, el panel debería reemplazar su catálogo con este.
          catalogo: stockCambio ? await cargarCatalogo(sb) : undefined,
        });
      }

      // ---- bitácora (solo agrega) ----
      if (nombre === "bitacora") {
        if (!Array.isArray(body)) return error(400, "Se esperaba un arreglo.");
        const nuevas = body
          .filter((b) => b && !b.id)
          .slice(0, 200)
          .map((b) => ({
            tipo: texto(b.accion || "nota", 60),
            mensaje: texto(b.detalle, 1000),
            referencia: b.ref ? texto(b.ref, 100) : null,
            usuario: sesion.usuario,
            rol: sesion.rol,
            fecha: fechaISO(b.fecha) || new Date().toISOString(),
          }));
        if (nuevas.length) {
          const { error: err } = await sb.from("bitacora").insert(nuevas);
          if (err) throw err;
        }
        return json(200, { ok: true });
      }

      return error(400, "Colección desconocida.");
    }

    // -------- /semilla (sembrar datos de ejemplo) — solo administradores --------
    if (ruta === "/semilla" && metodo === "POST") {
      const { sesion, respuesta } = exigirSesion(req, "admin");
      if (respuesta) return respuesta;

      const { count, error: errCount } = await sb.from("productos").select("id", { count: "exact", head: true });
      if (errCount) throw errCount;
      if (count && count > 0) return json(200, { ok: true, yaSembrado: true });

      const body = (await leerJson(req)) || {};
      const catalogo = arr(body.catalogo).filter((p) => p && typeof p.id === "string" && p.id.trim());
      if (catalogo.length) {
        const { error: err } = await sb.from("productos").insert(catalogo.map(filaDesdeProducto));
        if (err) throw err;
      }
      if (body.config && typeof body.config === "object" && !Array.isArray(body.config)) {
        const { data: cfgActual } = await sb.from("configuracion").select("id").eq("id", 1).maybeSingle();
        if (!cfgActual) {
          const { error: err } = await sb.from("configuracion").insert({ id: 1, datos: body.config });
          if (err) throw err;
        }
      }
      const pedidos = arr(body.pedidos).filter((o) => o && typeof o.codigo === "string" && RE_CODIGO.test(o.codigo));
      if (pedidos.length) {
        const { error: err } = await sb.from("pedidos").upsert(pedidos.map(filaDesdePedido), { onConflict: "codigo", ignoreDuplicates: true });
        if (err) throw err;
      }
      await registrar(sb, { tipo: "datos-sembrados", mensaje: `${sesion.nombre} cargó el catálogo de ejemplo (${catalogo.length} productos)`, usuario: sesion.usuario, rol: sesion.rol });
      return json(200, { ok: true });
    }

    // -------- /reiniciar — solo administradores --------
    // Borra pedidos, catálogo, configuración y bitácora (lo que promete el
    // panel en Configuración → Reiniciar). Al volver a entrar se re-siembra.
    if (ruta === "/reiniciar" && metodo === "POST") {
      const { sesion, respuesta } = exigirSesion(req, "admin");
      if (respuesta) return respuesta;
      const pasos = [
        sb.from("pedidos").delete().neq("codigo", ""),
        sb.from("productos").delete().neq("id", ""),
        sb.from("configuracion").delete().eq("id", 1),
        sb.from("bitacora").delete().gte("id", 0), // id es bigint
      ];
      for (const paso of pasos) {
        const { error: err } = await paso;
        if (err) throw err;
      }
      await registrar(sb, { tipo: "tienda-reiniciada", mensaje: `${sesion.nombre} reinició los datos de la tienda`, usuario: sesion.usuario, rol: sesion.rol });
      return json(200, { ok: true });
    }

    return error(404, "Ruta no encontrada: " + ruta);
  } catch (e) {
    console.error("[api]", ruta, e);
    return error(500, (e && e.message) || "Error interno.");
  }
};

export const config = {
  path: "/api/*",
};
