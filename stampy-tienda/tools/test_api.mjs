// =========================================================
// Estampy — pruebas de humo contra la API.
// Requiere `netlify dev` corriendo en otra terminal (http://localhost:8888)
// y un proyecto de Supabase con sql/01–04 aplicados y el catálogo de
// ejemplo sembrado (entra una vez al panel como admin para sembrarlo).
//
//   npm test
//   STAMPY_TEST_BASE=https://tu-sitio.netlify.app/api npm test
//
// OJO: crea pedidos y archivos reales. Úsalo contra un proyecto de
// pruebas, no contra la tienda en producción. Para las pruebas con
// sesión define STAMPY_TEST_USUARIO y STAMPY_TEST_CLAVE (un usuario
// admin): así también se cancela el pedido de prueba y se devuelve el stock
// (y se reenvía la franela-clasica al catálogo; su contenido no cambia).
// =========================================================

const BASE = process.env.STAMPY_TEST_BASE || "http://localhost:8888/api";
let fallos = 0;
let pruebas = 0;

function esperar(nombre, cond, detalle) {
  pruebas++;
  if (!cond) {
    fallos++;
    console.error(`✗ ${nombre}${detalle ? "  → " + detalle : ""}`);
  } else {
    console.log(`✓ ${nombre}`);
  }
}

async function pedir(ruta, opciones = {}) {
  const r = await fetch(BASE + ruta, {
    method: opciones.metodo || "GET",
    headers: { "content-type": "application/json", ...(opciones.token ? { authorization: "Bearer " + opciones.token } : {}) },
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });
  let datos = null;
  try { datos = await r.json(); } catch {}
  return { status: r.status, datos };
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const escalones = (p) => (p.preciosMayor || []).filter((e) => e.desde > 1 && e.precio > 0).sort((a, b) => a.desde - b.desde);
function precioUnitario(p, total) {
  let precio = Number(p.precio);
  escalones(p).forEach((e) => { if (total >= e.desde) precio = e.precio; });
  return precio;
}

// PNG de 1×1 px
const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function main() {
  const salud = await pedir("/salud");
  esperar("GET /salud responde ok:true", salud.datos && salud.datos.ok === true, JSON.stringify(salud.datos));
  esperar("GET /salud informa si STAMPY_SECRET está configurada", salud.datos && typeof salud.datos.secretoConfigurado === "boolean");

  const publico = await pedir("/publico");
  const catalogo = publico.datos?.catalogo || [];
  const config = publico.datos?.config || {};
  esperar("GET /publico devuelve catálogo", Array.isArray(catalogo) && catalogo.length > 0, "¿sembraste el catálogo de ejemplo?");
  esperar("GET /publico devuelve config con zonas", Array.isArray(config.zonas) && config.zonas.length > 0);
  const conCampos = catalogo[0] || {};
  esperar("Los productos traen los campos de Estampy",
    ["preciosMayor", "modoStock", "tallas", "stockTallas", "colores", "prenda", "ubicaciones", "permiteDiseno", "diasProduccion", "pedidoMinimo"].every((k) => k in conCampos));

  const loginMalo = await pedir("/sesion", { metodo: "POST", cuerpo: { usuario: "no-existe", clave: "x" } });
  esperar("Login con usuario inválido devuelve 401 (o 503 si falta STAMPY_SECRET)", loginMalo.status === 401 || loginMalo.status === 503);

  const semillaSinToken = await pedir("/semilla", { metodo: "POST", cuerpo: {} });
  esperar("POST /semilla sin sesión es rechazado", semillaSinToken.status === 401 || semillaSinToken.status === 503);

  // ---------- Subida de diseño ----------
  const diseno = await pedir("/diseno", { metodo: "POST", cuerpo: { nombre: "logo.png", tipo: "image/png", datos: PNG_1PX } });
  esperar("POST /diseno acepta un PNG válido", diseno.status === 201 && diseno.datos?.url && diseno.datos?.ruta, JSON.stringify(diseno.datos));
  esperar("POST /diseno devuelve una ruta aleatoria AAAA/MM/uuid.png", /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/.test(diseno.datos?.ruta || ""));

  const disenoFalso = await pedir("/diseno", {
    metodo: "POST",
    cuerpo: { nombre: "virus.png", tipo: "image/png", datos: Buffer.from("<script>alert(1)</script>").toString("base64") },
  });
  esperar("POST /diseno rechaza un archivo que no es imagen aunque diga image/png", disenoFalso.status === 415);

  // ---------- Pedido con tallas, precio al mayor y logo en la prenda ----------
  const franela = catalogo.find((p) => p.id === "franela-clasica");
  const kit = catalogo.find((p) => p.id === "kit-uniforme");
  const zona = (config.zonas || [])[0];
  let token = null;

  if (!franela || !kit || !zona) {
    console.log("(saltando pruebas de pedido: faltan franela-clasica, kit-uniforme o zonas en el catálogo sembrado)");
  } else {
    esperar("franela-clasica es una prenda con ubicaciones para el logo (frente, espalda y manga derecha)",
      franela.prenda?.tipo === "franela" && ["frente", "espalda", "manga-der"].every((z) => (franela.ubicaciones || []).includes(z)),
      JSON.stringify({ prenda: franela.prenda, ubicaciones: franela.ubicaciones }));

    const color = (franela.colores[0] || {}).nombre || null;
    const archivoSubido = diseno.status === 201 ? diseno.datos : null;
    // Ubicaciones como las arma el simulador (STAMPY.mockup.registro)
    const pechoIzq = { zona: "frente", ref: "Pecho izquierdo", x: 0.76, y: 0.14, w: 0.3, ratio: 1, anchoCm: 9, altoCm: 9, desdeCm: 1.2 };
    const espaldaCentro = { zona: "espalda", ref: "Centro de la espalda", x: 0.5, y: 0.34, w: 0.8, ratio: 1, anchoCm: 24, altoCm: 24, desdeCm: 1.6 };
    // 8 + 6 = 14 franelas → escalón "desde 12" aunque cada línea por sí sola no llegue
    const cuerpoPedido = {
      items: [
        { id: franela.id, talla: "M", color, qty: 8, precio: 0.01,
          diseno: {
            grupo: "prueba",                                   // clave desconocida: se descarta
            nota: "Logo al frente",
            archivo: archivoSubido ? { ...archivoSubido } : null,
            ubicaciones: [
              pechoIzq,
              { ...pechoIzq, ref: "Repetida" },                // zona repetida: se descarta
              { zona: "bolsillo", x: 0.5, y: 0.5, w: 0.5 },    // zona que no existe: se descarta
              espaldaCentro,
            ],
            prenda: { tipo: "franela", cuello: "redondo", infantil: false, color: "#FFFFFF", sobra: 1 },
            logoPorWhatsApp: !archivoSubido,
            preview: "data:image/png;base64," + PNG_1PX,      // vista previa: el servidor la descarta
          } },
        { id: franela.id, talla: "L", color, qty: 6, precio: 0.01,
          // Sin copia de la prenda y con números fuera de rango: se completa y se acota
          diseno: {
            ubicaciones: [{ zona: "manga-der", ref: "x".repeat(60), x: 7, y: -2, w: 0, ratio: 999, anchoCm: 250, altoCm: -3, desdeCm: 3.14159 }],
            logoPorWhatsApp: true,
          } },
      ],
      cliente: { nombre: "Prueba Automática", cedula: "V-00000000", telefono: "0000-0000000", email: "prueba@example.com" },
      entrega: { modo: "delivery", zonaId: zona.id, direccion: "Dirección de prueba" },
      pago: { metodo: "pago-movil", referencia: "000000" },
      totales: { total: 1 }, // el servidor debe ignorarlo
    };
    const pedido = await pedir("/pedido", { metodo: "POST", cuerpo: cuerpoPedido });
    const orden = pedido.datos?.orden;
    esperar("POST /pedido con tallas y logo en la prenda crea el pedido", pedido.status === 201 && !!orden, JSON.stringify(pedido.datos));

    if (orden) {
      const esperado = precioUnitario(franela, 14);
      esperar("Código con formato EST-AAAA-####XX", /^EST-\d{4}-\d{4}[A-Z]{2}$/.test(orden.codigo));
      esperar(`Precio al mayor por total del producto (14 u → $${esperado})`,
        orden.items.every((it) => it.precio === esperado), JSON.stringify(orden.items.map((i) => i.precio)));
      esperar("Las líneas conservan talla y color", orden.items[0].talla === "M" && orden.items[1].talla === "L" && orden.items[0].color === color);
      esperar("El archivo de diseño queda en la línea", !archivoSubido || orden.items[0].diseno?.archivo?.ruta === archivoSubido.ruta);

      const d1 = orden.items[0].diseno || {};
      const d2 = orden.items[1].diseno || {};
      const u1 = d1.ubicaciones || [];
      esperar("Las ubicaciones del logo quedan en la línea, sin zonas repetidas ni inexistentes",
        JSON.stringify(u1.map((u) => u.zona)) === '["frente","espalda"]' && u1[0].ref === "Pecho izquierdo" && u1[0].anchoCm === 9 && u1[1].anchoCm === 24,
        JSON.stringify(u1));
      esperar("La vista previa (preview) y las claves desconocidas se descartan",
        !("preview" in d1) && !("grupo" in d1) && !("sobra" in (d1.prenda || {})) &&
          JSON.stringify(Object.keys(d1).sort()) === '["archivo","logoPorWhatsApp","nota","prenda","ubicaciones"]',
        JSON.stringify(Object.keys(d1)));
      esperar("La línea guarda la copia de la prenda { tipo, cuello, infantil, color }",
        d1.prenda?.tipo === "franela" && d1.prenda?.cuello === "redondo" && d1.prenda?.infantil === false && d1.prenda?.color === "#FFFFFF",
        JSON.stringify(d1.prenda));
      const u2 = (d2.ubicaciones || [])[0] || {};
      esperar("Los números de la ubicación se acotan (x, y 0–1 · w 0,05–1 · ratio 0,05–20 · cm 0–100 con 1 decimal · ref ≤ 40)",
        u2.zona === "manga-der" && u2.x === 1 && u2.y === 0 && u2.w === 0.05 && u2.ratio === 20 &&
          u2.anchoCm === 100 && u2.altoCm === 0 && u2.desdeCm === 3.1 && (u2.ref || "").length === 40,
        JSON.stringify(u2));
      esperar("logoPorWhatsApp se conserva y, sin copia de la prenda, se usa la del producto",
        d2.logoPorWhatsApp === true && d2.prenda?.tipo === franela.prenda?.tipo && /^#[0-9a-f]{6}$/i.test(d2.prenda?.color || ""),
        JSON.stringify(d2));

      const subtotal = round2(orden.items.reduce((s, it) => s + round2(it.precio * it.qty), 0));
      let envio = subtotal >= config.freeShippingOver ? 0 : zona.costo;
      const base = round2(subtotal + envio);
      const total = round2(base + round2(base * config.iva) - round2(base * 0.05));
      esperar("Totales recalculados en el servidor (ignora el total del navegador)",
        orden.totales.subtotal === subtotal && orden.totales.total === total && pedido.datos.totalesAjustados === true,
        JSON.stringify(orden.totales));
      const dias = Math.round((new Date(orden.eta) - new Date(orden.creado)) / 86400000);
      esperar("ETA = producción + días de la zona", dias === franela.diasProduccion + zona.dias, `${dias} días`);

      const seguimiento = await pedir("/pedido/" + orden.codigo);
      esperar("GET /pedido/:codigo encuentra el pedido", seguimiento.status === 200);
      esperar("El seguimiento muestra las ubicaciones del logo",
        (seguimiento.datos?.orden?.items?.[0]?.diseno?.ubicaciones || []).length === 2);
    }

    // Regla de las prendas: cada línea dice dónde va el logo y trae el logo (o "por WhatsApp").
    // Cuerpo completo y válido: si la regla fallara, el pedido se crearía (201).
    const resto = { cliente: { nombre: "Prueba", telefono: "04120000000" }, entrega: { modo: "tienda" }, pago: { metodo: "efectivo" } };
    const sinUbicacion = await pedir("/pedido", {
      metodo: "POST",
      cuerpo: {
        ...resto,
        items: [
          { id: franela.id, talla: "M", qty: 1, diseno: { nota: "¿Dónde va?", ubicaciones: [{ zona: "bolsillo", x: 0.5, y: 0.5, w: 0.5 }], logoPorWhatsApp: true } },
          { id: franela.id, talla: "L", qty: 1, diseno: null },
        ],
      },
    });
    const probUbic = sinUbicacion.datos?.problemas || [];
    esperar("Prenda sin ubicación válida del logo es rechazada (400, un solo mensaje)",
      sinUbicacion.status === 400 && probUbic.length === 1 && probUbic[0].includes("elige dónde va tu logo"),
      JSON.stringify(sinUbicacion.datos));

    const sinLogo = await pedir("/pedido", {
      metodo: "POST",
      cuerpo: { ...resto, items: [{ id: franela.id, talla: "M", qty: 1, diseno: { ubicaciones: [pechoIzq], archivo: null, logoPorWhatsApp: false } }] },
    });
    esperar("Prenda sin logo ni \"lo envío por WhatsApp\" es rechazada (400)",
      sinLogo.status === 400 && (sinLogo.datos?.problemas || []).some((t) => t.includes("sube tu logo")),
      JSON.stringify(sinLogo.datos));

    // Objetos del simulador: la taza tiene 2 lados (frente/espalda = "Lado 1/Lado 2"), sin mangas.
    const taza = catalogo.find((p) => p.id === "taza-11oz");
    if (taza?.prenda?.tipo !== "taza") {
      console.log("(saltando prueba de la taza: el catálogo sembrado no la tiene como objeto del simulador)");
    } else {
      esperar("La taza es un objeto { tipo } con zonas solo de frente y espalda",
        JSON.stringify(taza.prenda) === '{"tipo":"taza"}' && (taza.ubicaciones || []).every((z) => z === "frente" || z === "espalda"),
        JSON.stringify({ prenda: taza.prenda, ubicaciones: taza.ubicaciones }));
      const tazaManga = await pedir("/pedido", {
        metodo: "POST",
        cuerpo: { ...resto, items: [{ id: taza.id, qty: Math.max(1, taza.pedidoMinimo || 1), diseno: { ubicaciones: [{ ...pechoIzq, zona: "manga-izq" }], logoPorWhatsApp: true } }] },
      });
      esperar("Taza con el logo en una manga es rechazada y el mensaje nombra sus lados (400)",
        tazaManga.status === 400 && (tazaManga.datos?.problemas || []).some((t) => t.includes("Lado 1")),
        JSON.stringify(tazaManga.datos));
    }

    // Pedido mínimo: el kit exige `pedidoMinimo` (8) unidades en total. Es una prenda:
    // la línea lleva su ubicación para que el rechazo sea por el mínimo.
    const minimo = await pedir("/pedido", {
      metodo: "POST",
      cuerpo: {
        ...resto,
        items: [{ id: kit.id, talla: kit.tallas[0], qty: Math.max(1, kit.pedidoMinimo - 1), diseno: { ubicaciones: [pechoIzq], logoPorWhatsApp: true } }],
      },
    });
    esperar("Pedido bajo el pedido mínimo es rechazado (400)", minimo.status === 400 && Array.isArray(minimo.datos?.bajoMinimo), JSON.stringify(minimo.datos));

    const tallaMala = await pedir("/pedido", {
      metodo: "POST",
      cuerpo: {
        items: [{ id: franela.id, talla: "XXXXL", qty: 1 }],
        cliente: { nombre: "Prueba", telefono: "04120000000" },
        entrega: { modo: "tienda" },
        pago: { metodo: "efectivo" },
      },
    });
    esperar("Pedido con talla inexistente es rechazado (400)", tallaMala.status === 400);

    // Limpieza: cancelar el pedido de prueba (requiere sesión)
    const usuario = process.env.STAMPY_TEST_USUARIO;
    const clave = process.env.STAMPY_TEST_CLAVE;
    if (usuario && clave && orden) {
      const login = await pedir("/sesion", { metodo: "POST", cuerpo: { usuario, clave } });
      token = login.datos?.token || null;
      esperar("Login válido devuelve token", login.status === 200 && !!token);
      if (token) {
        const estado = await pedir("/estado", { token });
        esperar("GET /estado con token responde 200", estado.status === 200);

        // Catálogo: reenviar la franela con prenda y ubicaciones "sucias" que, una vez
        // limpias, son las mismas de antes. El producto no cambia.
        const antes = (estado.datos?.catalogo || []).find((p) => p.id === franela.id);
        if (antes) {
          const guardar = await pedir("/coleccion/catalogo", {
            metodo: "PUT", token,
            cuerpo: [{
              ...antes,
              prenda: { ...antes.prenda, sobra: "x" },
              ubicaciones: [...antes.ubicaciones].reverse().concat(["frente", "hombro"]),
            }],
          });
          const despues = ((await pedir("/publico")).datos?.catalogo || []).find((p) => p.id === franela.id);
          const vista = (p) => p && JSON.stringify([p.prenda, p.ubicaciones, p.imagenes]);
          esperar("PUT /coleccion/catalogo limpia prenda y ubicaciones (sin repetir, en orden) y deja las imágenes tal cual",
            guardar.status === 200 && vista(despues) === vista(antes),
            JSON.stringify({ status: guardar.status, antes: vista(antes), despues: vista(despues) }));
        }

        const guardado = (estado.datos?.pedidos || []).find((o) => o.codigo === orden.codigo);
        if (guardado) {
          // Los ítems de un pedido existente son del servidor: aunque el panel los
          // mande sin diseño, no se tocan.
          const cancel = await pedir("/coleccion/pedidos", {
            metodo: "PUT", token,
            cuerpo: [{
              ...guardado,
              items: guardado.items.map((it) => ({ ...it, diseno: null })),
              cancelado: true,
              motivoCancelacion: "Pedido de prueba automática",
            }],
          });
          esperar("Cancelar el pedido de prueba por PUT /coleccion/pedidos", cancel.status === 200, JSON.stringify(cancel.datos));
          const tras = await pedir("/pedido/" + orden.codigo);
          esperar("PUT /coleccion/pedidos no toca los ítems guardados (las ubicaciones siguen ahí)",
            (tras.datos?.orden?.items?.[0]?.diseno?.ubicaciones || []).length === 2,
            JSON.stringify(tras.datos?.orden?.items?.[0]?.diseno));
        }
      }
    } else {
      console.log("(sin STAMPY_TEST_USUARIO/STAMPY_TEST_CLAVE: el pedido de prueba queda creado; cancélalo desde el panel)");
    }
  }

  // Stock: un producto con inventario no puede venderse por encima de lo que hay
  const conStock = catalogo.find((p) => p.modoStock === "stock" && (!p.tallas || !p.tallas.length));
  if (conStock) {
    const excedido = await pedir("/pedido", {
      metodo: "POST",
      cuerpo: {
        items: [{ id: conStock.id, qty: Math.min(9999, (conStock.stock || 0) + 1) }],
        cliente: { nombre: "Prueba", telefono: "04120000000" },
        entrega: { modo: "tienda" },
        pago: { metodo: "efectivo" },
      },
    });
    esperar(`Pedido por encima del stock de ${conStock.id} → 409 con faltantes`,
      excedido.status === 409 && Array.isArray(excedido.datos?.faltantes), JSON.stringify(excedido.datos));
  }

  const inexistente = await pedir("/pedido", {
    metodo: "POST",
    cuerpo: { items: [{ id: "producto-que-no-existe", qty: 1 }], cliente: { nombre: "x", telefono: "1" }, entrega: { modo: "tienda" }, pago: { metodo: "efectivo" } },
  });
  esperar("Pedido con producto inexistente es rechazado", inexistente.status === 400);

  console.log(`\n${pruebas - fallos}/${pruebas} pruebas pasaron.`);
  if (fallos > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Error al correr las pruebas:", e.message);
  console.error("¿Tienes `netlify dev` corriendo en otra terminal?");
  process.exit(1);
});
