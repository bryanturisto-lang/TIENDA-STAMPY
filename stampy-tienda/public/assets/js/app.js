/* =========================================================
   STAMPY — Núcleo de la tienda
   Iconos · formato · carrito · pedidos · header/footer · UI
   ========================================================= */

(function () {
  "use strict";

  const A = window.STAMPY;
  const CFG = A.config;

  /* ============================ Iconos ============================ */
  const ICONS = {
    cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z"/>',
    star: '<path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3 1.2-6.5L2.5 9.3l6.6-.9z"/>',
    truck: '<path d="M3 16V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10"/><path d="M15 9h3.5a1 1 0 0 1 .8.4L22 13v3"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>',
    store: '<path d="M3 10h18M4 10V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/><path d="M9 20v-5h6v5"/>',
    shield: '<path d="M12 3l7.5 3v5.4c0 4.5-3.1 8.3-7.5 9.6-4.4-1.3-7.5-5.1-7.5-9.6V6z"/><path d="M9 12l2 2 4-4"/>',
    box: '<path d="M21 8.5l-9-5-9 5 9 5z"/><path d="M3 8.5v7l9 5 9-5v-7"/><path d="M12 13.5v7"/>',
    receipt: '<path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21z"/><path d="M9 8h6M9 12h6"/>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    phone: '<path d="M6.5 3h3l1.5 4-2 1.6a12 12 0 0 0 5.4 5.4l1.6-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 4.9.7c0 1.9-2.9 2-2.9 3.6M12 16.5h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18z"/>',
    bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v9M10 10v9M14 10v9M19 10v9"/><path d="M3 21h18"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    battery: '<rect x="2" y="8" width="16" height="9" rx="2"/><path d="M21 11v3"/><path d="M5 11v3M8.5 11v3"/>',
    weight: '<path d="M6 8h12l2 12H4z"/><circle cx="12" cy="5" r="2.4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-.7 4.3"/><path d="M20 5v6h-6"/>',
    upload: '<path d="M12 16V4"/><path d="M8 8l4-4 4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/>',
    whatsapp: '<path d="M3 21l1.6-4.4A8.3 8.3 0 1 1 8 20.2z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r="1"/>',
    facebook: '<path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V3h-2.5A4 4 0 0 0 10.5 7v1.5H8V12h2.5v9H14v-9h2.5l.5-3.5z"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    package: '<path d="M16.5 9.4L7.5 4.2"/><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="2"/><rect x="17.5" y="13" width="4" height="6" rx="2"/><path d="M19.5 19v.5a2.5 2.5 0 0 1-2.5 2.5h-2"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 15h4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    /* --- Panel administrativo --- */
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.5" y="12" width="3" height="5" rx="1"/><rect x="13" y="8" width="3" height="9" rx="1"/><rect x="18" y="5" width="3" height="12" rx="1"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6h.1A1.6 1.6 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10.5 11v6M13.5 11v6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M12 4v12"/><path d="M8 12l4 4 4-4"/><path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3"/><rect x="8" y="13" width="8" height="6"/>',
    copyDoc: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
    users: '<circle cx="9" cy="8" r="3.3"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.3 3.3 0 0 1 0 5.6"/><path d="M17.5 14.4A6.5 6.5 0 0 1 21.5 20"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.6"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.6 5 3.2 5 1.3 5 3.3-2.2 3.2-5 3.2-5-1.3-5-3.2"/>',
  };

  /* Los atributos width/height dan un tamaño por defecto sensato;
     cualquier regla CSS los sobrescribe sin problema. */
  A.icon = function (name, cls, size) {
    const d = ICONS[name] || "";
    const s = size || 20;
    return `<svg${cls ? ` class="${cls}"` : ""} width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  };

  /* ============================ Formato ============================ */
  A.fmtUSD = (n) =>
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  A.fmtBs = (n) =>
    "Bs " + (Number(n) * CFG.bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  A.fmtBsRaw = (bs) =>
    "Bs " + Number(bs).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  A.round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  A.fmtFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Caracas" });
  };
  A.fmtFechaHora = (iso) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Caracas" }) +
      " · " +
      d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Caracas" })
    );
  };

  A.escape = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  A.getProduct = (id) => A.products.find((p) => p.id === id);

  /* Ruta de una imagen de producto: nombre de archivo en assets/img/productos/
     o URL completa (Supabase Storage). Si la página es autocontenida
     (STAMPY.IMG_MAP existe, con las ilustraciones incrustadas), usa esa versión. */
  A.img = (file) => {
    if (!file) return (A.basePath || "") + "assets/img/sin-imagen.svg";
    // Vistas del simulador de prendas: "mockup:<idProducto>:<vista>"
    if (A.mockup && A.mockup.esRef(file)) return A.mockup.urlDeRef(file);
    if (/^(https?:|data:|blob:)/.test(file)) return file;
    return (A.IMG_MAP && A.IMG_MAP[file]) || (A.basePath || "") + "assets/img/productos/" + file;
  };

  A.stars = (rating) => {
    let out = '<span class="stars">';
    for (let i = 1; i <= 5; i++) {
      out += `<svg width="13" height="13" viewBox="0 0 24 24" class="${i <= Math.round(rating) ? "" : "off"}" fill="currentColor" stroke="none">${ICONS.star}</svg>`;
    }
    return out + "</span>";
  };

  /* ============================ Storage ============================ */
  /* Usa localStorage cuando está disponible. Si el navegador lo bloquea
     (por ejemplo al abrir con file:// en Safari o en modo privado), cae
     a memoria: la tienda sigue funcionando durante la sesión. */
  const memoria = {};
  let backend;
  try {
    localStorage.setItem("stampy.test", "1");
    localStorage.removeItem("stampy.test");
    backend = localStorage;
  } catch (e) {
    backend = {
      getItem: (k) => (k in memoria ? memoria[k] : null),
      setItem: (k, v) => { memoria[k] = String(v); },
      removeItem: (k) => { delete memoria[k]; },
    };
    A.sinPersistencia = true;
  }

  /* Colecciones que viven en el servidor cuando hay backend.
     Sin backend, todo cae al almacenamiento del navegador. */
  const REMOTAS = {};
  const remoto = { pedidos: null, catalogo: null, config: null, bitacora: null };
  A.modoServidor = false;

  const puedeEscribirRemoto = () => A.modoServidor && A.api && A.api.token;

  /* Cola de guardado: agrupa escrituras seguidas en una sola petición */
  const pendientes = new Map();
  let temporizador = null;

  function encolar(nombre, valor) {
    pendientes.set(nombre, JSON.parse(JSON.stringify(valor)));
    clearTimeout(temporizador);
    temporizador = setTimeout(vaciarCola, 300);
  }

  async function vaciarCola() {
    const lote = Array.from(pendientes.entries());
    pendientes.clear();
    for (const [nombre, valor] of lote) {
      try {
        const r = await A.api.guardar(nombre, valor);
        // El servidor es la fuente de verdad del stock: si cambió (ventas,
        // cancelaciones), devuelve el catálogo fresco y avisos para el equipo.
        if (r && Array.isArray(r.catalogo) && r.catalogo.length) {
          remoto.catalogo = r.catalogo;
          A.products = r.catalogo;
          document.dispatchEvent(new CustomEvent("stampy:catalogo"));
        }
        if (r && Array.isArray(r.avisos)) r.avisos.forEach((m) => A.toast(m, "alert"));
      } catch (e) {
        if (e.estado === 401) {
          A.toast("Tu sesión venció. Vuelve a entrar.", "alert");
          A.api.salir();
          setTimeout(() => location.reload(), 1500);
          return;
        }
        A.toast("No se pudo guardar en el servidor: " + e.message, "alert");
      }
    }
  }

  A.sincronizar = vaciarCola;

  const store = {
    get(key, fallback) {
      if (A.modoServidor && REMOTAS[key]) {
        const v = remoto[REMOTAS[key]];
        return v == null ? fallback : v;
      }
      try {
        const v = backend.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, val) {
      if (A.modoServidor && REMOTAS[key]) {
        remoto[REMOTAS[key]] = val;
        if (puedeEscribirRemoto()) encolar(REMOTAS[key], val);
        return true;
      }
      try {
        backend.setItem(key, JSON.stringify(val));
        return true;
      } catch (e) {
        return false;
      }
    },
  };
  A.store = store;

  const K_CART = "stampy.cart.v1";
  const K_LOGOS = "stampy.logos.v1";   // vistas previas de logos del carrito, por grupo
  const K_ORDERS = "stampy.orders.v1";
  const K_FAVS = "stampy.favs.v1";
  const K_CAT = "stampy.catalogo.v1";
  const K_CFG = "stampy.config.v1";
  const K_LOG = "stampy.bitacora.v1";
  const K_SESION = "stampy.sesion.v1";

  /* ==================== Catálogo persistente ====================
     El catálogo de data.js es la semilla. A partir de la primera carga
     vive en el almacenamiento, para que el panel pueda editarlo y la
     tienda pública refleje esos cambios. */
  A.productosSemilla = JSON.parse(JSON.stringify(A.products));
  A.configSemilla = JSON.parse(JSON.stringify(A.config));

  REMOTAS[K_ORDERS] = "pedidos";
  REMOTAS[K_CAT] = "catalogo";
  REMOTAS[K_CFG] = "config";
  REMOTAS[K_LOG] = "bitacora";

  function aplicarDatos() {
    const cat = store.get(K_CAT, null);
    if (Array.isArray(cat) && cat.length) A.products = cat;
    else store.set(K_CAT, A.products);

    const cfg = store.get(K_CFG, null);
    if (cfg && Object.keys(cfg).length) Object.keys(cfg).forEach((k) => (A.config[k] = cfg[k]));
  }

  /** Carga el estado inicial. Con backend, del servidor; si no, del navegador. */
  A.cargarDatos = async function () {
    const hayServidor = A.api ? await A.api.comprobar() : false;

    if (!hayServidor) {
      A.modoServidor = false;
      aplicarDatos();
      return false;
    }

    A.modoServidor = true;
    let datos = null;

    if (A.api.token) {
      try {
        datos = await A.api.estado();
      } catch (e) {
        A.api.salir();
        store.set(K_SESION, null);
      }
    }
    if (!datos) {
      try {
        const p = await A.api.publico();
        datos = { catalogo: p.catalogo, config: p.config, pedidos: [], bitacora: [] };
      } catch (e) {
        A.modoServidor = false;
        aplicarDatos();
        return false;
      }
    }

    remoto.catalogo = datos.catalogo;
    remoto.config = datos.config;
    remoto.pedidos = datos.pedidos || [];
    remoto.bitacora = datos.bitacora || [];
    if (datos.permisos && datos.sesion) A.permisos[datos.sesion.rol] = datos.permisos;

    // Primera vez en este sitio: se siembra el catálogo y los pedidos de ejemplo
    if (!Array.isArray(remoto.catalogo) || !remoto.catalogo.length) {
      await sembrarServidor();
    }

    aplicarDatos();
    return true;
  };

  async function sembrarServidor() {
    const catalogo = JSON.parse(JSON.stringify(A.productosSemilla));
    const config = JSON.parse(JSON.stringify(A.configSemilla));
    const pedidos = Orders.generarSemilla(catalogo, config);
    try {
      await A.api.sembrar({ catalogo, config, pedidos, bitacora: [] });
      const p = await A.api.publico();
      remoto.catalogo = p.catalogo;
      remoto.config = p.config;
    } catch (e) {
      remoto.catalogo = catalogo;
      remoto.config = config;
    }
  }

  A.guardarCatalogo = function () {
    store.set(K_CAT, A.products);
    document.dispatchEvent(new CustomEvent("stampy:catalogo"));
  };

  A.guardarConfig = function () {
    store.set(K_CFG, A.config);
    document.dispatchEvent(new CustomEvent("stampy:config"));
  };

  A.restaurarCatalogo = function () {
    A.products = JSON.parse(JSON.stringify(A.productosSemilla));
    A.guardarCatalogo();
  };

  A.restaurarConfig = function () {
    Object.keys(A.configSemilla).forEach((k) => (A.config[k] = JSON.parse(JSON.stringify(A.configSemilla[k]))));
    A.guardarConfig();
  };

  /* ==================== Bitácora de actividad ==================== */
  A.bitacora = {
    all: () => store.get(K_LOG, []),
    add(accion, detalle, ref) {
      const list = store.get(K_LOG, []);
      list.unshift({
        fecha: new Date().toISOString(),
        usuario: (A.sesion && A.sesion.actual() && A.sesion.actual().nombre) || "Sistema",
        rol: (A.sesion && A.sesion.actual() && A.sesion.actual().rol) || "sistema",
        accion,
        detalle,
        ref: ref || null,
      });
      store.set(K_LOG, list.slice(0, 400));
    },
    limpiar() { store.set(K_LOG, []); },
  };

  /* ==================== Producto: stock, tallas y precios ====================
     Ver docs/MODELO.md. Un producto "pedido" se produce al pedir y no
     tiene límite de stock; uno "stock" descuenta de stockTallas (si tiene
     tallas) o de stock (si no). */
  A.bajoPedido = (p) => !p || p.modoStock !== "stock";
  A.tieneTallas = (p) => !!(p && Array.isArray(p.tallas) && p.tallas.length);

  /** Unidades disponibles de una variante. Infinity si es bajo pedido. */
  A.stockDe = function (p, talla) {
    if (!p) return 0;
    if (A.bajoPedido(p)) return Infinity;
    if (A.tieneTallas(p)) return Math.max(0, Number((p.stockTallas || {})[talla]) || 0);
    return Math.max(0, Number(p.stock) || 0);
  };

  /** Stock total del producto (suma de tallas). Infinity si es bajo pedido. */
  A.stockTotal = function (p) {
    if (!p) return 0;
    if (A.bajoPedido(p)) return Infinity;
    if (A.tieneTallas(p)) return p.tallas.reduce((s, t) => s + A.stockDe(p, t), 0);
    return Math.max(0, Number(p.stock) || 0);
  };

  /** Suma o resta unidades del inventario de una variante (no hace nada si es bajo pedido). */
  A.ajustarStock = function (p, talla, delta) {
    if (!p || A.bajoPedido(p)) return;
    if (A.tieneTallas(p) && talla) {
      p.stockTallas = p.stockTallas || {};
      p.stockTallas[talla] = Math.max(0, (Number(p.stockTallas[talla]) || 0) + delta);
    } else {
      p.stock = Math.max(0, (Number(p.stock) || 0) + delta);
    }
  };

  /** Escalones de precio al mayor, de menor a mayor cantidad. */
  A.escalones = (p) =>
    (Array.isArray(p && p.preciosMayor) ? p.preciosMayor : [])
      .filter((e) => Number(e.desde) > 1 && Number(e.precio) > 0)
      .map((e) => ({ desde: Number(e.desde), precio: Number(e.precio) }))
      .sort((a, b) => a.desde - b.desde);

  /** Precio por unidad según la cantidad total pedida de ese producto. */
  A.precioUnitario = function (p, cantidadTotal) {
    let precio = Number(p.precio) || 0;
    A.escalones(p).forEach((e) => { if (cantidadTotal >= e.desde) precio = e.precio; });
    return precio;
  };

  /** El precio más bajo alcanzable (para "desde $X al mayor"). */
  A.precioMinimo = (p) => A.escalones(p).reduce((m, e) => Math.min(m, e.precio), Number(p.precio) || 0);

  /** Clave única de una línea del carrito: producto + talla + color + grupo de diseño. */
  A.claveLinea = (it) => [it.id, it.talla || "", it.color || "", (it.diseno && it.diseno.grupo) || ""].join("|");

  /** Vista previa (data URL pequeña) del logo de un grupo del carrito, o "". */
  A.logoPreview = (grupo) => (grupo && store.get(K_LOGOS, {})[grupo]) || "";

  /** Diseño tal como se guarda en el pedido. La vista previa solo viaja cuando no
      hay archivo en el servidor (modo demostración), para que el panel la muestre. */
  A.disenoParaPedido = function (d) {
    const out = {
      nota: d.nota || "",
      archivo: d.archivo || null,
      ubicaciones: Array.isArray(d.ubicaciones) ? d.ubicaciones : [],
      prenda: d.prenda || null,
      logoPorWhatsApp: !!d.logoPorWhatsApp,
    };
    const prev = A.logoPreview(d.grupo);
    if (prev && !(d.archivo && d.archivo.url) && !A.modoServidor) out.preview = prev;
    return out;
  };

  /* ============================ Carrito ============================
     Cada línea: { key, id, talla, color, qty, diseno }
     diseno: { grupo, nota, archivo: { url, nombre } | null } | null
     Las tallas de un mismo "agregar al carrito" comparten grupo de diseño. */
  const Cart = {
    items() {
      return store.get(K_CART, [])
        .filter((it) => A.getProduct(it.id))
        .map((it) => (it.key ? it : { ...it, talla: it.talla || null, color: it.color || null, diseno: it.diseno || null, key: A.claveLinea(it) }));
    },
    save(items) {
      store.set(K_CART, items);
      // Borra las vistas previas de logos que ya no están en ninguna línea
      const grupos = new Set(items.map((it) => it.diseno && it.diseno.grupo).filter(Boolean));
      const prev = store.get(K_LOGOS, {});
      Object.keys(prev).forEach((g) => { if (!grupos.has(g)) delete prev[g]; });
      store.set(K_LOGOS, prev);
      A.renderCart();
      document.dispatchEvent(new CustomEvent("stampy:cart"));
    },
    /** Unidades de un producto ya en el carrito (de una talla, o de todas si no se indica). */
    enCarrito(id, talla) {
      return Cart.items()
        .filter((it) => it.id === id && (!talla || it.talla === talla))
        .reduce((s, it) => s + it.qty, 0);
    },
    /**
     * Agrega varias tallas de un producto de una vez.
     * @param {string} id
     * @param {object} cantidades  { M: 3, L: 2 }  — o { _: 5 } si no lleva talla
     * @param {object} opts        { color, diseno: { nota, archivo } }
     * @returns {number} unidades agregadas
     */
    agregar(id, cantidades, opts) {
      opts = opts || {};
      const p = A.getProduct(id);
      if (!p) return 0;
      const items = Cart.items();
      const d = opts.diseno || null;
      const ubic = d && Array.isArray(d.ubicaciones) ? d.ubicaciones : [];
      const diseno = d && (d.nota || d.archivo || ubic.length || d.logoPorWhatsApp)
        ? {
            grupo: d.grupo || "d" + Date.now().toString(36),
            nota: d.nota || "",
            archivo: d.archivo || null,
            ubicaciones: ubic,
            prenda: d.prenda || (A.mockup ? A.mockup.instantanea(p) : null),
            logoPorWhatsApp: !!d.logoPorWhatsApp,
          }
        : null;
      // La vista previa del logo (imagen pequeña) se guarda aparte, una vez por grupo
      if (diseno && d.preview) {
        const prev = store.get(K_LOGOS, {});
        prev[diseno.grupo] = d.preview;
        store.set(K_LOGOS, prev);
      }
      let agregadas = 0;
      const avisos = [];
      Object.keys(cantidades).forEach((t) => {
        let qty = Math.floor(Number(cantidades[t]) || 0);
        if (qty <= 0) return;
        const talla = t === "_" ? null : t;
        const libre = A.stockDe(p, talla) - Cart.enCarrito(id, talla);
        if (qty > libre) {
          avisos.push(talla ? `talla ${talla}: quedan ${Math.max(0, libre)}` : `quedan ${Math.max(0, libre)}`);
          qty = Math.max(0, libre);
        }
        if (!qty) return;
        const linea = { id, talla, color: opts.color || null, qty, diseno };
        linea.key = A.claveLinea(linea);
        const found = items.find((x) => x.key === linea.key);
        if (found) found.qty += qty;
        else items.push(linea);
        agregadas += qty;
      });
      if (avisos.length) A.toast(`Stock limitado de ${p.nombre}: ${avisos.join(", ")}`, "alert");
      if (!agregadas) return 0;
      Cart.save(items);
      A.toast(`${agregadas} × ${p.nombre} al carrito`, "checkCircle");
      return agregadas;
    },
    /** Atajo: una talla (o ninguna) con cantidad. */
    add(id, qty, opts) {
      opts = opts || {};
      return Cart.agregar(id, { [opts.talla || "_"]: qty || 1 }, opts);
    },
    setQty(key, qty) {
      const items = Cart.items();
      const it = items.find((x) => x.key === key);
      if (!it) return;
      const p = A.getProduct(it.id);
      const otras = items.filter((x) => x !== it && x.id === it.id && x.talla === it.talla).reduce((s, x) => s + x.qty, 0);
      const max = Math.min(999, A.stockDe(p, it.talla) - otras);
      it.qty = Math.max(1, Math.min(qty, max));
      Cart.save(items);
    },
    remove(key) {
      Cart.save(Cart.items().filter((it) => it.key !== key));
    },
    clear() {
      Cart.save([]);
    },
    count() {
      return Cart.items().reduce((s, it) => s + it.qty, 0);
    },
    /** Cantidad total por producto (todas sus tallas y colores): define el escalón de precio. */
    totalesPorProducto() {
      const t = {};
      Cart.items().forEach((it) => { t[it.id] = (t[it.id] || 0) + it.qty; });
      return t;
    },
    detailed() {
      const tot = Cart.totalesPorProducto();
      return Cart.items().map((it) => {
        const p = A.getProduct(it.id);
        const precio = A.precioUnitario(p, tot[it.id]);
        return {
          ...it,
          producto: p,
          precio,
          precioBase: Number(p.precio) || 0,
          mayor: precio < (Number(p.precio) || 0),
          subtotal: A.round2(precio * it.qty),
        };
      });
    },
    subtotal() {
      return A.round2(Cart.detailed().reduce((s, l) => s + l.subtotal, 0));
    },
    /** Productos por debajo de su pedido mínimo: [{ producto, tiene, minimo }] */
    faltaMinimo() {
      const tot = Cart.totalesPorProducto();
      return Object.keys(tot)
        .map((id) => ({ producto: A.getProduct(id), tiene: tot[id] }))
        .filter((x) => x.producto && (Number(x.producto.pedidoMinimo) || 1) > x.tiene)
        .map((x) => ({ ...x, minimo: Number(x.producto.pedidoMinimo) || 1 }));
    },
    /** Líneas del pedido tal como se guardan (ver docs/MODELO.md). */
    lineasPedido() {
      return Cart.detailed().map((l) => ({
        id: l.id,
        nombre: l.producto.nombre,
        qty: l.qty,
        precio: l.precio,
        img: (l.producto.imagenes || [])[0] || "",
        talla: l.talla || null,
        color: l.color || null,
        diseno: l.diseno ? A.disenoParaPedido(l.diseno) : null,
      }));
    },
  };
  A.cart = Cart;

  /* ---- Favoritos ---- */
  A.favs = {
    all: () => store.get(K_FAVS, []),
    has: (id) => A.favs.all().includes(id),
    toggle(id) {
      const f = A.favs.all();
      const i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1);
      else f.push(id);
      store.set(K_FAVS, f);
      return i < 0;
    },
  };

  /* ---- Pedidos hechos desde este navegador (accesos rápidos) ---- */
  const K_MIOS = "stampy.mispedidos.v1";
  A.recordarPedido = function (codigo) {
    const l = store.get(K_MIOS, []).filter((c) => c !== codigo);
    l.unshift(codigo);
    store.set(K_MIOS, l.slice(0, 10));
  };
  A.misPedidos = () => store.get(K_MIOS, []);

  /* ============================ Totales ============================ */
  /**
   * Calcula los totales de una compra.
   * @param {number} subtotal  suma de productos en USD
   * @param {object} entrega   { modo:'delivery'|'tienda', zonaId }
   * @param {string} metodo    'pago-movil' | 'transferencia' | 'zelle' | 'efectivo'
   */
  A.calcTotales = function (subtotal, entrega, metodo, config) {
    const CFG = config || A.config;
    let envio = 0;
    if (entrega && entrega.modo === "delivery") {
      const z = CFG.zonas.find((x) => x.id === entrega.zonaId);
      envio = z ? z.costo : 0;
      if (subtotal >= CFG.freeShippingOver) envio = 0;
    }
    const base = A.round2(subtotal + envio);
    const iva = A.round2(base * CFG.iva);
    // 5 % de descuento pagando en bolívares (pago móvil o transferencia)
    const aplicaDesc = metodo === "pago-movil" || metodo === "transferencia";
    const descuento = aplicaDesc ? A.round2(base * 0.05) : 0;
    const total = A.round2(base + iva - descuento);
    return {
      subtotal: A.round2(subtotal),
      envio: A.round2(envio),
      envioGratis: entrega && entrega.modo === "delivery" && subtotal >= CFG.freeShippingOver,
      iva,
      descuento,
      total,
      totalBs: A.round2(total * CFG.bcvRate),
    };
  };

  /** Días hasta la entrega: el producto más lento del pedido + el envío a la zona. */
  A.diasEntrega = function (items, entrega, config) {
    const C = config || A.config;
    const produccion = (items || []).reduce((m, it) => {
      const p = A.getProduct(it.id);
      return Math.max(m, p ? Number(p.diasProduccion) || 0 : 0);
    }, 0);
    let envio = 0;
    if (entrega && entrega.modo === "delivery") {
      const z = (C.zonas || []).find((x) => x.id === entrega.zonaId);
      envio = z ? z.dias : 3;
    }
    return produccion + envio;
  };

  /* ============================ Pedidos ============================ */
  const Orders = {
    all: () => store.get(K_ORDERS, []),
    saveAll: (list) => store.set(K_ORDERS, list),

    nuevoCodigo() {
      const y = new Date().getFullYear();
      const n = String(Math.floor(1000 + Math.random() * 8999));
      const l = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      return `EST-${y}-${n}${l[Math.floor(Math.random() * l.length)]}${l[Math.floor(Math.random() * l.length)]}`;
    },

    create(data) {
      const list = Orders.all();
      const ahora = new Date();
      const pasos = data.entrega.modo === "tienda" ? A.estadosTienda : A.estados;

      const eta = new Date(ahora.getTime() + A.diasEntrega(data.items, data.entrega) * 86400000);

      const orden = {
        codigo: data.codigo || Orders.nuevoCodigo(),
        creado: ahora.toISOString(),
        eta: eta.toISOString(),
        items: data.items,
        cliente: data.cliente,
        entrega: data.entrega,
        pago: data.pago,
        totales: data.totales,
        estadoIndex: 0,
        pagoEstado: data.pago.metodo === "efectivo" ? "por-cobrar" : "reportado",
        cancelado: false,
        notas: [],
        historial: [{ paso: pasos[0].id, fecha: ahora.toISOString() }],
        guia: "EST" + Math.floor(100000000 + Math.random() * 899999999),
        courier: data.entrega.modo === "delivery" ? CFG.courier[Math.floor(Math.random() * CFG.courier.length)] : null,
        repartidor: null,
      };
      list.unshift(orden);
      Orders.saveAll(list);

      // Descontar del inventario. Con servidor, el stock lo reserva la base
      // de datos al registrar el pedido (reservar_stock): aquí no se toca.
      if (!A.modoServidor) {
        orden.items.forEach((it) => A.ajustarStock(A.getProduct(it.id), it.talla, -it.qty));
        A.guardarCatalogo();
      }

      A.bitacora.add("pedido-creado", `Pedido ${orden.codigo} por ${A.fmtUSD(orden.totales.total)}`, orden.codigo);
      return orden;
    },

    /** Crea el pedido. Con servidor lo registra allá (el stock es único
        para todos); sin servidor, lo guarda en este navegador. */
    async crear(data) {
      if (!A.modoServidor) return Orders.create(data);

      const provisional = Orders.create(data);          // arma el objeto y actualiza la vista
      try {
        const r = await A.api.crearPedido(provisional);
        // El servidor manda: refrescamos catálogo y pedido con lo que quedó guardado
        const publico = await A.api.publico();
        if (Array.isArray(publico.catalogo) && publico.catalogo.length) {
          A.products = publico.catalogo;
          store.set(K_CAT, publico.catalogo);
        }
        A.recordarPedido(r.orden.codigo);
        return r.orden;
      } catch (e) {
        // Se deshace el pedido local para no dejar datos inconsistentes
        Orders.saveAll(Orders.all().filter((o) => o.codigo !== provisional.codigo));
        const err = new Error(e.message || "No se pudo registrar el pedido");
        err.datos = e.datos;
        throw err;
      }
    },

    /** Busca un pedido: primero en memoria, si no en el servidor. */
    async buscar(codigo) {
      const local = Orders.find(codigo);
      if (local) return local;
      if (!A.modoServidor) return null;
      try {
        const r = await A.api.buscarPedido(String(codigo).trim().toUpperCase());
        return r.orden || null;
      } catch (e) {
        return null;
      }
    },

    randomRepartidor() {
      const nombres = ["Carlos Prieto", "Ana Bermúdez", "Wilmer Rojas", "Katiuska Silva", "Jesús Marcano"];
      return {
        nombre: nombres[Math.floor(Math.random() * nombres.length)],
        telefono: "0414-" + Math.floor(1000000 + Math.random() * 8999999),
        vehiculo: Math.random() > 0.5 ? "Moto" : "Camioneta",
      };
    },

    find(codigo) {
      if (!codigo) return null;
      const c = String(codigo).trim().toUpperCase();
      return Orders.all().find((o) => o.codigo.toUpperCase() === c) || null;
    },

    pasosDe(o) {
      return o.entrega.modo === "tienda" ? A.estadosTienda : A.estados;
    },

    avanzar(codigo) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      const pasos = Orders.pasosDe(o);
      if (o.estadoIndex >= pasos.length - 1) return o;
      o.estadoIndex++;
      o.historial.push({ paso: pasos[o.estadoIndex].id, fecha: new Date().toISOString() });
      if (o.estadoIndex >= 1 && o.pagoEstado === "reportado") o.pagoEstado = "verificado";
      if (o.estadoIndex >= 4 && o.entrega.modo === "delivery" && !o.repartidor) o.repartidor = Orders.randomRepartidor();
      Orders.saveAll(list);
      A.bitacora.add("estado-avanzado", `${o.codigo} → ${pasos[o.estadoIndex].titulo}`, o.codigo);
      return o;
    },

    reiniciar(codigo) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      const pasos = Orders.pasosDe(o);
      o.estadoIndex = 0;
      o.historial = [{ paso: pasos[0].id, fecha: new Date().toISOString() }];
      Orders.saveAll(list);
      A.bitacora.add("estado-reiniciado", `${o.codigo} volvió al primer estado`, o.codigo);
      return o;
    },

    /* ---------- Acciones del panel administrativo ---------- */

    /** Fija el pedido en un estado concreto, rellenando el historial. */
    setEstado(codigo, indice) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      const pasos = Orders.pasosDe(o);
      const destino = Math.max(0, Math.min(indice, pasos.length - 1));
      const ahora = new Date().toISOString();

      if (destino > o.estadoIndex) {
        for (let i = o.estadoIndex + 1; i <= destino; i++) o.historial.push({ paso: pasos[i].id, fecha: ahora });
      } else if (destino < o.estadoIndex) {
        const ids = pasos.slice(0, destino + 1).map((p) => p.id);
        o.historial = o.historial.filter((h) => ids.includes(h.paso));
      }
      o.estadoIndex = destino;
      if (destino >= 1 && o.pagoEstado === "reportado") o.pagoEstado = "verificado";
      if (destino >= 4 && o.entrega.modo === "delivery" && !o.repartidor) o.repartidor = Orders.randomRepartidor();
      Orders.saveAll(list);
      A.bitacora.add("estado-cambiado", `${o.codigo} fijado en “${pasos[destino].titulo}”`, o.codigo);
      return o;
    },

    verificarPago(codigo) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      o.pagoEstado = "verificado";
      o.pagoVerificado = new Date().toISOString();
      if (o.estadoIndex < 1) {
        const pasos = Orders.pasosDe(o);
        o.estadoIndex = 1;
        o.historial.push({ paso: pasos[1].id, fecha: o.pagoVerificado });
      }
      if (o.estadoIndex >= 4 && o.entrega.modo === "delivery" && !o.repartidor) o.repartidor = Orders.randomRepartidor();
      Orders.saveAll(list);
      A.bitacora.add("pago-verificado", `Pago de ${o.codigo} por ${A.fmtUSD(o.totales.total)} verificado`, o.codigo);
      return o;
    },

    rechazarPago(codigo, motivo) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      o.pagoEstado = "rechazado";
      o.pagoMotivo = motivo || "Referencia no encontrada en el estado de cuenta";
      o.estadoIndex = 0;
      o.historial = [{ paso: Orders.pasosDe(o)[0].id, fecha: o.creado }];
      Orders.saveAll(list);
      A.bitacora.add("pago-rechazado", `Pago de ${o.codigo} rechazado: ${o.pagoMotivo}`, o.codigo);
      return o;
    },

    actualizarEnvio(codigo, datos) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      if (datos.courier !== undefined) o.courier = datos.courier;
      if (datos.guia !== undefined) o.guia = datos.guia;
      if (datos.repartidor !== undefined) o.repartidor = datos.repartidor;
      if (datos.eta !== undefined) o.eta = datos.eta;
      Orders.saveAll(list);
      A.bitacora.add("envio-actualizado", `Datos de envío de ${o.codigo} actualizados`, o.codigo);
      return o;
    },

    cancelar(codigo, motivo) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o || o.cancelado) return o;
      o.cancelado = true;
      o.motivoCancelacion = motivo || "Cancelado por el equipo";
      o.canceladoEl = new Date().toISOString();
      Orders.saveAll(list);
      // Devolver el stock. Con servidor lo hace la base de datos al guardar el pedido.
      if (!A.modoServidor) {
        o.items.forEach((it) => A.ajustarStock(A.getProduct(it.id), it.talla, it.qty));
        A.guardarCatalogo();
      }
      A.bitacora.add("pedido-cancelado", `${o.codigo} cancelado: ${o.motivoCancelacion}. Stock devuelto.`, o.codigo);
      return o;
    },

    reactivar(codigo) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o || !o.cancelado) return o;
      o.cancelado = false;
      delete o.motivoCancelacion;
      delete o.canceladoEl;
      Orders.saveAll(list);
      if (!A.modoServidor) {
        o.items.forEach((it) => A.ajustarStock(A.getProduct(it.id), it.talla, -it.qty));
        A.guardarCatalogo();
      }
      A.bitacora.add("pedido-reactivado", `${o.codigo} reactivado`, o.codigo);
      return o;
    },

    agregarNota(codigo, texto) {
      const list = Orders.all();
      const o = list.find((x) => x.codigo === codigo);
      if (!o) return null;
      o.notas = o.notas || [];
      o.notas.unshift({
        fecha: new Date().toISOString(),
        usuario: (A.sesion && A.sesion.actual() && A.sesion.actual().nombre) || "Equipo",
        texto,
      });
      Orders.saveAll(list);
      A.bitacora.add("nota-agregada", `Nota interna en ${o.codigo}`, o.codigo);
      return o;
    },

    /* ---------- Consultas agregadas ---------- */
    activos: () => Orders.all().filter((o) => !o.cancelado),

    porVerificar: () =>
      Orders.activos().filter((o) => o.pagoEstado === "reportado" || o.pagoEstado === "rechazado"),

    enCurso: () =>
      Orders.activos().filter((o) => o.estadoIndex >= 1 && o.estadoIndex < Orders.pasosDe(o).length - 1),

    entregados: () => Orders.activos().filter((o) => o.estadoIndex >= Orders.pasosDe(o).length - 1),

    ingresos(soloVerificados) {
      return A.round2(
        Orders.activos()
          .filter((o) => (soloVerificados ? o.pagoEstado === "verificado" : true))
          .reduce((s, o) => s + o.totales.total, 0)
      );
    },

    /* Crea los pedidos de ejemplo la primera vez, para que tanto el
       seguimiento como el panel tengan datos reales con los que trabajar. */
    seed() {
      if (A.modoServidor) return; // en el servidor se siembra una sola vez para todos
      if (store.get("stampy.seeded.v2", false)) return;
      const pedidos = Orders.generarSemilla(A.products, CFG);
      Orders.saveAll(pedidos);
      A.guardarCatalogo();
      store.set("stampy.seeded.v2", true);
      store.set("stampy.seeded.v1", true);
    },

    /** Genera los pedidos de ejemplo y ajusta el stock del catálogo recibido. */
    generarSemilla(catalogo, config) {
      const CFGS = config || CFG;
      const buscar = (id) => catalogo.find((p) => p.id === id);
      const hace = (d) => new Date(Date.now() - d * 86400000).toISOString();

      /* --- Definición compacta de los pedidos de ejemplo --- */
      const CLIENTES = [
        ["Luis Ruiz", "V-20.145.987", "0412-5559834", "luisruizweb@gmail.com"],
        ["Rosa Elena Pérez", "V-11.887.203", "0424-8832019", "rosa.perez@ejemplo.com"],
        ["Daniela Fuentes", "V-18.334.771", "0414-2298450", "dani.fuentes@ejemplo.com"],
        ["Ricardo Molina", "J-40551223-8", "0212-5550188", "compras@inversionesmolina.com"],
        ["Camila Villalobos", "V-24.667.102", "0416-7741039", "camila.v@ejemplo.com"],
        ["Héctor Jiménez", "V-14.209.556", "0426-3390122", "hector.jimenez@ejemplo.com"],
        ["Gabriela Toro", "V-27.881.340", "0412-6612984", "gabriela.toro@ejemplo.com"],
        ["Ernesto Blanco", "V-09.774.612", "0414-8850273", "ernesto.blanco@ejemplo.com"],
        ["Yolanda Castillo", "V-16.443.098", "0424-1129877", "y.castillo@ejemplo.com"],
        ["Pedro Zambrano", "V-22.907.554", "0416-5583021", "pedro.z@ejemplo.com"],
      ];

      const DIRS = [
        ["Av. Francisco de Miranda, Torre Delta, piso 7, ofic. 7-B", "Caracas", "ccs", "Frente al Metro Altamira"],
        ["Av. Bolívar Norte, Res. El Trigal, torre B, apto 9-C", "Valencia", "central", "Al lado del CC Camoruco"],
        ["Calle 72 con Av. 15 Delicias, Edif. Zulia, PB", "Maracaibo", "occidente", "Portón blanco, timbre 2"],
        ["Urb. Los Chaguaramos, Res. Aurora, casa 14", "Barcelona", "oriente", "Casa esquinera azul"],
        ["Av. Los Próceres, Res. Montaña Alta, apto 4-A", "Mérida", "andes", "Cerca del CC Alto Prado"],
        ["Av. Guayana, Res. Caroní Suites, torre 1, apto 12-B", "Puerto Ordaz", "llanos", "Junto a la panadería La Espiga"],
      ];

      /* Ítems: [id, cantidades ({ talla: qty } o un número si no lleva talla), color, nota del diseño]
         Pedido: [codigo, díasAtrás, ítems, clienteIdx, entrega, pago, estadoIndex, pagoEstado, cancelado] */
      const SPECS = [
        ["EST-2026-4821KM", 3.0, [["franela-clasica", { S: 4, M: 8, L: 6, XL: 2 }, "Blanco", "La fecha del evento va debajo del logo de la espalda", [["frente", "centro"], ["espalda", "centro"]]]], 0, ["delivery", 0], ["pago-movil", "0105 — Mercantil", "884512"], 4, "verificado", false],
        ["EST-2026-7390PT", 6.0, [["taza-11oz", 12, "Blanca", "Foto familiar con la frase «Feliz día mamá»"], ["cojin-40", 2, null, "Misma foto de las tazas"]], 1, ["tienda", "taller"], ["transferencia", "0102 — Banco de Venezuela", "0091774"], 5, "verificado", false],
        ["EST-2026-1174QB", 0.12, [["franela-deportiva", { M: 6, L: 5, XL: 3 }, "Blanco", "Equipo de kickingball: número en la espalda, lista por WhatsApp", [["frente", "pecho-izq"], ["espalda", "centro"], ["manga-der", "centro"]]]], 4, ["delivery", 1], ["pago-movil", "0134 — Banesco", "553201"], 0, "reportado", false],
        ["EST-2026-2065HD", 0.35, [["franela-nino", { "4": 6, "6": 10, "8": 4 }, "Blanco", "Personaje al frente; nombre Valentina y el número 5 en la espalda", [["frente", "centro"], ["espalda", "centro"]]]], 2, ["delivery", 0], ["pago-movil", "0108 — Provincial", "710948"], 0, "reportado", false],
        ["EST-2026-3318LR", 0.9, [["gorra-trucker", 3, "Malla negra", "Logo de la barbería"]], 6, ["tienda", "taller"], ["efectivo", null, null], 0, "por-cobrar", false],
        ["EST-2026-5527XF", 1.4, [["chemise-pique", { S: 4, M: 12, L: 10, XL: 6, "2XL": 2 }, "Blanco", "", [["frente", "pecho-izq"], ["espalda", "centro"], ["manga-izq", "centro"]]]], 3, ["delivery", 0], ["transferencia", "0191 — BNC Banco Nacional de Crédito", "0224781"], 3, "verificado", false],
        ["EST-2026-6743NV", 2.2, [["kit-uniforme", { "10": 4, "12": 6, "14": 5 }, "Blanco", "Academia sub-12. Lista de nombres y números por WhatsApp", [["frente", "pecho-izq"], ["espalda", "centro"]]]], 7, ["delivery", 5], ["zelle", null, "1122334455"], 2, "verificado", false],
        ["EST-2026-8890CT", 4.5, [["manga-larga-uv", { M: 5, L: 7 }, "Blanco", "Nombre del torneo en la manga", [["frente", "centro"], ["manga-izq", "hombro"]]]], 8, ["delivery", 2], ["pago-movil", "0172 — Bancamiga", "334019"], 5, "verificado", false],
        ["EST-2026-9012WS", 5.8, [["mousepad", 20, null, "Logo de la empresa sobre fondo azul"]], 5, ["tienda", "taller"], ["pago-movil", "0114 — Bancaribe", "667201"], 5, "verificado", false],
        ["EST-2026-4406JG", 8.3, [["franela-clasica", { M: 1 }, "Blanco", "Foto de mi perro con su nombre, Toby", [["frente", "centro"]]]], 9, ["delivery", 3], ["transferencia", "0163 — Banco del Tesoro", "0118093"], 5, "verificado", false],
        ["EST-2026-7781DM", 9.6, [["taza-11oz", 2, "Interior naranja", "Frase: «Primero el café»"]], 2, ["delivery", 4], ["pago-movil", "0105 — Mercantil", "889003"], 5, "verificado", false],
        ["EST-2026-2298BK", 1.1, [["franela-deportiva", { L: 1 }, "Blanco", "", [["frente", "centro"]]]], 9, ["delivery", 1], ["pago-movil", "0169 — Mi Banco", "112233"], 0, "rechazado", false],
        ["EST-2026-6650ZP", 7.2, [["cojin-40", 1, null, "Foto de boda"]], 6, ["delivery", 3], ["pago-movil", "0175 — Bicentenario", "445566"], 0, "reportado", true],
      ];

      const lista = SPECS.map((s) => {
        const [codigo, dias, items, ci, ent, pg, estadoIndex, pagoEstado, cancelado] = s;
        const creado = hace(dias);
        const [nombre, cedula, telefono, email] = CLIENTES[ci];

        const lineas = [];
        items.forEach(([id, cant, color, nota, zonas]) => {
          const p = buscar(id);
          const porTalla = typeof cant === "number" ? { _: cant } : cant;
          const total = Object.values(porTalla).reduce((a, b) => a + b, 0);
          const precio = A.precioUnitario(p, total);
          // Prendas: el logo va en las zonas indicadas (posiciones rápidas del simulador)
          const ubicaciones = zonas && A.mockup
            ? zonas.map(([zona, preset]) => {
                const pre = A.mockup.presetsDe(p, zona).find((x) => x.id === preset) || A.mockup.presetsDe(p, zona)[0];
                return A.mockup.registro(p, zona, { x: pre.x, y: pre.y, w: pre.w, ref: pre.label }, 1);
              })
            : [];
          const diseno = nota || ubicaciones.length
            ? { nota: nota || "", archivo: null, ubicaciones, prenda: ubicaciones.length ? A.mockup.instantanea(p) : null, logoPorWhatsApp: ubicaciones.length > 0 }
            : null;
          Object.keys(porTalla).forEach((t) => {
            lineas.push({
              id, nombre: p.nombre, qty: porTalla[t], precio, img: p.imagenes[0],
              talla: t === "_" ? null : t, color: color || null,
              diseno,
            });
          });
        });
        const subtotal = A.round2(lineas.reduce((s2, l) => s2 + l.precio * l.qty, 0));

        let entrega;
        if (ent[0] === "tienda") {
          const t = CFGS.tiendas.find((x) => x.id === ent[1]) || CFGS.tiendas[0];
          entrega = { modo: "tienda", tiendaId: t.id, tiendaNombre: t.nombre, direccion: t.direccion, horario: t.horario };
        } else {
          const [dir, ciudad, zonaId, ref] = DIRS[ent[1]];
          const z = CFGS.zonas.find((x) => x.id === zonaId);
          entrega = { modo: "delivery", zonaId, zonaNombre: z.nombre, direccion: dir, ciudad, referencia: ref, nota: "" };
        }
        const produccion = lineas.reduce((m, l) => Math.max(m, Number((buscar(l.id) || {}).diasProduccion) || 0), 0);
        const zona = entrega.modo === "delivery" ? CFGS.zonas.find((x) => x.id === entrega.zonaId) : null;
        const diasTotal = produccion + (zona ? zona.dias : 0);

        const totales = A.calcTotales(subtotal, entrega, pg[0], CFGS);
        const pago = { metodo: pg[0], montoBs: totales.totalBs };
        if (pg[1]) pago.banco = pg[1];
        if (pg[2]) pago.referencia = pg[2];
        if (pg[0] === "pago-movil") { pago.telefono = telefono; pago.cedula = cedula; pago.fecha = creado.slice(0, 10); }
        if (pg[0] === "transferencia") { pago.titular = nombre; pago.fecha = creado.slice(0, 10); }
        if (pg[0] === "zelle") { pago.titular = nombre; pago.email = email; }
        if (pg[0] === "efectivo") { pago.moneda = "usd"; pago.pendiente = true; }

        const pasos = entrega.modo === "tienda" ? A.estadosTienda : A.estados;
        const historial = [];
        for (let i = 0; i <= estadoIndex; i++) {
          historial.push({ paso: pasos[i].id, fecha: hace(dias - (dias * i) / (estadoIndex + 1.15)) });
        }

        return {
          codigo,
          creado,
          eta: new Date(new Date(creado).getTime() + diasTotal * 86400000).toISOString(),
          items: lineas,
          cliente: { nombre, cedula, telefono, email, empresa: cedula.startsWith("J") ? { razonSocial: "Inversiones Molina C.A.", rif: cedula } : null },
          entrega,
          pago,
          totales,
          estadoIndex,
          pagoEstado,
          pagoMotivo: pagoEstado === "rechazado" ? "La referencia no aparece en el estado de cuenta del banco" : undefined,
          cancelado,
          motivoCancelacion: cancelado ? "El cliente pidió cancelar y hacer otro diseño" : undefined,
          notas: [],
          historial,
          guia: "EST" + Math.floor(100000000 + Math.random() * 899999999),
          courier: entrega.modo === "delivery" ? CFGS.courier[Math.floor(Math.random() * CFGS.courier.length)] : null,
          repartidor: entrega.modo === "delivery" && estadoIndex >= 4 ? Orders.randomRepartidor() : null,
        };
      });

      // El primero mantiene el repartidor conocido para la documentación
      lista[0].guia = "EST748193025";
      lista[0].courier = "Delivery propio Estampy";
      lista[0].repartidor = { nombre: "Carlos Prieto", telefono: "0414-3387192", vehiculo: "Moto" };
      lista[1].guia = "EST551209884";

      // Ajustar el stock de lo que se vende de inventario (lo bajo pedido no cambia)
      lista.filter((o) => !o.cancelado).forEach((o) =>
        o.items.forEach((it) => A.ajustarStock(buscar(it.id), it.talla, -it.qty))
      );

      return lista;
    },

  };
  A.orders = Orders;

  /* ============================ Toasts ============================ */
  A.toast = function (msg, icon) {
    let box = document.querySelector(".toasts");
    if (!box) {
      box = document.createElement("div");
      box.className = "toasts";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = A.icon(icon || "checkCircle") + "<span>" + A.escape(msg) + "</span>";
    box.appendChild(t);
    setTimeout(() => {
      t.classList.add("is-out");
      setTimeout(() => t.remove(), 320);
    }, 2600);
  };

  /* Abre WhatsApp (app o web) con un mensaje ya escrito. La persona
     del otro lado tiene que pulsar enviar — no manda nada solo. */
  /* Convierte cualquier imagen (JPG, PNG…) a WebP en el propio navegador,
     y de paso la achica si es más grande de lo necesario. Nunca lanza:
     si algo falla, devuelve el archivo original tal cual. */
  A.aWebP = function (archivo, ladoMax) {
    return new Promise((resolve) => {
      if (!archivo.type.startsWith("image/") || archivo.type === "image/svg+xml") {
        resolve({ base64: null, tipo: archivo.type, original: true });
        return;
      }
      const lector = new FileReader();
      lector.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = ladoMax || 1400;
          let { width: w, height: h } = img;
          if (w > max || h > max) {
            const ratio = Math.min(max / w, max / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const lienzo = document.createElement("canvas");
          lienzo.width = w; lienzo.height = h;
          lienzo.getContext("2d").drawImage(img, 0, 0, w, h);
          lienzo.toBlob(
            (blob) => {
              if (!blob) { resolve({ base64: null, tipo: archivo.type, original: true }); return; }
              const l2 = new FileReader();
              l2.onload = () => resolve({ base64: l2.result.split(",")[1], tipo: "image/webp", original: false });
              l2.onerror = () => resolve({ base64: null, tipo: archivo.type, original: true });
              l2.readAsDataURL(blob);
            },
            "image/webp",
            0.85
          );
        };
        img.onerror = () => resolve({ base64: null, tipo: archivo.type, original: true });
        img.src = lector.result;
      };
      lector.onerror = () => resolve({ base64: null, tipo: archivo.type, original: true });
      lector.readAsDataURL(archivo);
    });
  };

  A.abrirWhatsApp = function (numero, mensaje) {
    let d = String(numero || "").replace(/\D/g, "");
    if (!d) return;
    // Venezuela: 0412-1234567 (11 dígitos con 0) → 584121234567
    if (d.startsWith("0") && d.length === 11) d = "58" + d.slice(1);
    else if (d.length === 10) d = "58" + d; // sin 0 ni código de país
    else if (!d.startsWith("58")) d = "58" + d.replace(/^0+/, "");
    const url = `https://wa.me/${d}?text=${encodeURIComponent(mensaje || "")}`;
    window.open(url, "_blank", "noopener");
  };

  A.copiar = function (texto, btn) {
    const done = () => {
      A.toast("Copiado: " + texto, "copy");
      if (btn) {
        const old = btn.innerHTML;
        btn.innerHTML = A.icon("check");
        setTimeout(() => (btn.innerHTML = old), 1400);
      }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(done).catch(() => fallback());
    } else fallback();

    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { A.toast("No se pudo copiar", "alert"); }
      ta.remove();
    }
  };

  /* ====================== Ayudantes de presentación ====================== */

  /** Logotipo de Estampy (imagen). */
  A.logoHTML = function (href) {
    return `<a class="logo" href="${href}" aria-label="Estampy — inicio">
      <img src="${A.basePath || ""}assets/img/estampy-logo.png" alt="Estampy" width="560" height="463">
    </a>`;
  };

  /** Enlace de WhatsApp con mensaje, o "" si la tienda no tiene número configurado. */
  A.waURL = function (mensaje) {
    let d = String((CFG.contact && CFG.contact.whatsapp) || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("0") && d.length === 11) d = "58" + d.slice(1);
    else if (d.length === 10) d = "58" + d;
    return `https://wa.me/${d}${mensaje ? "?text=" + encodeURIComponent(mensaje) : ""}`;
  };

  A.instagramURL = function () {
    const u = String((CFG.contact && CFG.contact.instagram) || "").replace(/^@/, "").trim();
    return u ? `https://www.instagram.com/${encodeURIComponent(u)}/` : "";
  };

  /** "XS–3XL", "Tallas 2–14"… o "" si no lleva talla. */
  A.rangoTallas = function (p) {
    if (!A.tieneTallas(p)) return "";
    const t = p.tallas;
    return t.length === 1 ? "Talla " + t[0] : `Tallas ${t[0]}–${t[t.length - 1]}`;
  };

  /** Estado de disponibilidad para tarjetas y ficha: { cls, txt, agotado } */
  A.estadoStock = function (p) {
    if (A.bajoPedido(p)) {
      const d = Number(p.diasProduccion) || 0;
      return { cls: "dot-cyan", txt: d ? `Bajo pedido · ${d} ${d === 1 ? "día" : "días"} de producción` : "Bajo pedido", agotado: false };
    }
    const n = A.stockTotal(p);
    if (n <= 0) return { cls: "dot-red", txt: "Agotado por ahora", agotado: true };
    if (n <= 10) return { cls: "dot-amber", txt: `Últimas ${n} ${n === 1 ? "unidad" : "unidades"} listas`, agotado: false };
    return { cls: "dot-green", txt: "Listo en taller", agotado: false };
  };

  /** Hex del color de un producto por su nombre (para el puntito de color). */
  A.hexColor = function (p, nombre) {
    const c = ((p && p.colores) || []).find((x) => x.nombre === nombre);
    return c ? c.hex : null;
  };

  /** Chips de talla y color de una línea (carrito, pedido). */
  A.lineaMetaHTML = function (l) {
    const p = l.producto || A.getProduct(l.id);
    const out = [];
    if (l.talla) out.push(`<span class="spec-pill">Talla ${A.escape(l.talla)}</span>`);
    if (l.color) {
      const hex = A.hexColor(p, l.color);
      out.push(`<span class="spec-pill">${hex ? `<span class="swatch-dot" style="background:${A.escape(hex)}"></span>` : ""}${A.escape(l.color)}</span>`);
    }
    return out.join("");
  };

  /** Resumen del diseño de una línea: archivo o nota, y dónde va el logo (miniaturas). */
  A.disenoHTML = function (d, conEnlace, tam) {
    const ubic = d && Array.isArray(d.ubicaciones) ? d.ubicaciones : [];
    if (!d || (!d.nota && !d.archivo && !ubic.length && !d.logoPorWhatsApp)) return "";
    const partes = [];
    if (d.archivo && d.archivo.nombre) {
      const nombre = A.escape(d.archivo.nombre);
      partes.push(conEnlace && d.archivo.url
        ? `<a href="${A.escape(d.archivo.url)}" target="_blank" rel="noopener" style="text-decoration:underline"><strong>${nombre}</strong></a>`
        : `<strong>${nombre}</strong>${d.archivo.url ? "" : " (por WhatsApp)"}`);
    } else if (d.logoPorWhatsApp) {
      partes.push("<strong>Logo por WhatsApp</strong>");
    }
    if (d.nota) partes.push("“" + A.escape(d.nota) + "”");
    const fila = partes.length
      ? `<div class="cart-design">${A.icon(d.archivo || d.logoPorWhatsApp ? "upload" : "edit")}<span>${partes.join(" · ")}</span></div>`
      : "";
    const minis = ubic.length && A.mockup ? A.mockup.miniaturasHTML(d, { tam: tam || 58 }) : "";
    return fila + minis;
  };

  /** Agrupa líneas de pedido del mismo producto, color y diseño (las tallas van juntas). */
  A.agruparLineas = function (items) {
    const grupos = [];
    (items || []).forEach((it) => {
      const d = it.diseno || null;
      const ubic = d && Array.isArray(d.ubicaciones) ? d.ubicaciones.map((u) => [u.zona, u.x, u.y, u.w].join(",")).join(";") : "";
      const k = [it.id, it.color || "", it.precio, d ? d.nota : "", d && d.archivo ? d.archivo.nombre : "", ubic].join("|");
      let g = grupos.find((x) => x.k === k);
      if (!g) {
        g = { k, id: it.id, nombre: it.nombre, img: it.img, color: it.color || null, diseno: d, precio: it.precio, qty: 0, tallas: [] };
        grupos.push(g);
      }
      g.qty += it.qty;
      if (it.talla) g.tallas.push({ talla: it.talla, qty: it.qty });
    });
    return grupos;
  };

  /** Bloque HTML de una línea agrupada (confirmación y seguimiento). */
  A.grupoHTML = function (g, linkProducto) {
    const url = `${A.basePath || ""}producto.html?id=${encodeURIComponent(g.id)}`;
    const thumb = `<img src="${A.img(g.img)}" alt="">`;
    return `
      <div class="order-mini">
        ${linkProducto ? `<a class="summary-thumb" style="width:60px;height:60px" href="${url}">${thumb}</a>` : `<span class="summary-thumb" style="width:60px;height:60px">${thumb}</span>`}
        <div class="grow">
          ${linkProducto ? `<a href="${url}">` : ""}<strong style="font-size:.93rem;color:var(--brand-deep);display:block">${A.escape(g.nombre)}</strong>${linkProducto ? "</a>" : ""}
          <span class="tiny muted">${g.qty} ${g.qty === 1 ? "unidad" : "unidades"} · ${A.fmtUSD(g.precio)} c/u</span>
          <div class="tallas-line">
            ${g.tallas.map((t) => `<span class="spec-pill">Talla ${A.escape(t.talla)} × ${t.qty}</span>`).join("")}
            ${A.lineaMetaHTML({ id: g.id, color: g.color })}
          </div>
          ${A.disenoHTML(g.diseno, true, 76)}
        </div>
        <strong style="font-size:.93rem;color:var(--brand-deep);white-space:nowrap">${A.fmtUSD(A.round2(g.precio * g.qty))}</strong>
      </div>`;
  };

  /** Texto de plazo: "7 días hábiles" */
  A.diasTxt = (n) => `${n} ${n === 1 ? "día hábil" : "días hábiles"}`;

  /** Enlace de "Diseñar ahora": la franela clásica (o la primera prenda con simulador). */
  A.urlDisenar = function () {
    const bp = A.basePath || "";
    const activa = (p) => p && p.activo !== false;
    const conSimulador = (p) => activa(p) && p.permiteDiseno && A.mockup && A.mockup.vistasDe(p).length;
    const base = A.getProduct("franela-clasica");
    const p = conSimulador(base) ? base : (A.products || []).find(conSimulador);
    return p ? `${bp}producto.html?id=${encodeURIComponent(p.id)}` : `${bp}index.html#catalogo`;
  };

  /** Datos cortos de un producto para la tarjeta y la ficha:
      { genero, color, tallas, tallasLargo, extra, minimo } (cadenas; "" si no aplica). */
  A.specsCortas = function (p) {
    const col = Array.isArray(p.colores) ? p.colores : [];
    const t = A.tieneTallas(p) ? p.tallas : null;
    const sp = p.specs || {};
    const gsm = /(\d+(?:[.,]\d+)?)\s*g\/m²/i.exec(String(sp.Material || ""));
    const medida = /\d+(?:[.,]\d+)?\s*×\s*\d+(?:[.,]\d+)?\s*cm/.exec(String(sp.Medidas || (!p.prenda && sp["Área de impresión"]) || ""));
    const talla = String(sp.Talla || "");
    const min = Number(p.pedidoMinimo) || 1;
    return {
      genero: p.prenda ? (p.prenda.infantil ? "Infantil" : "Unisex") : "",
      color: col.length === 1 ? col[0].nombre : col.length > 1 ? `${col.length} colores` : "",
      tallas: t ? (t.length === 1 ? `Talla ${t[0]}` : `${/^\d/.test(t[0]) ? "Tallas " : ""}${t[0]}–${t[t.length - 1]}`) : "",
      tallasLargo: A.rangoTallas(p),
      extra: gsm ? `${gsm[1]} g/m²`
        : sp.Capacidad ? String(sp.Capacidad)
        : sp.Incluye ? String(sp.Incluye)
        : /única/i.test(talla) ? "Talla única"
        : medida ? medida[0] : "",
      minimo: min > 1 ? `Mínimo ${min}` : "",
    };
  };

  /* ====================== Header y footer ====================== */
  const NAV = [
    { href: "index.html#catalogo", label: "Catálogo", key: "catalogo" },
    { href: "index.html#como-funciona", label: "Cómo funciona", key: "como" },
    { href: "index.html#mayor", label: "Al mayor", key: "mayor" },
    { href: "seguimiento.html", label: "Seguimiento", key: "seguimiento" },
  ];

  A.renderChrome = function (active) {
    const bp = A.basePath || "";
    const headerHost = document.getElementById("app-header");
    if (headerHost) {
      const gratis = Number(CFG.freeShippingOver) || 0;
      headerHost.outerHTML = `
<div class="announce">
  <div class="wrap announce-inner">
    <span>Envío a toda Venezuela</span>
    <span class="spark" aria-hidden="true"></span>
    <span>Prueba de diseño gratis por WhatsApp</span>
    ${gratis ? `<span class="spark announce-extra" aria-hidden="true"></span>
    <span class="announce-extra">Delivery gratis desde ${A.fmtUSD(gratis)}</span>` : ""}
  </div>
</div>
<header class="header">
  <div class="wrap header-inner">
    ${A.logoHTML(bp + "index.html")}

    <nav class="nav" id="mainNav" aria-label="Principal">
      ${NAV.map((n) => `<a href="${bp}${n.href}"${n.key === active ? ' class="is-active" aria-current="page"' : ""}>${n.label}</a>`).join("")}
      <form class="searchbar nav-search" role="search" onsubmit="return STAMPY.onGlobalSearch(event, this)">
        ${A.icon("search")}
        <input type="search" name="q" placeholder="Buscar franelas, tazas, uniformes…" aria-label="Buscar productos">
      </form>
    </nav>

    <form class="searchbar" role="search" id="globalSearch" onsubmit="return STAMPY.onGlobalSearch(event, this)">
      ${A.icon("search")}
      <input type="search" name="q" id="globalSearchInput" placeholder="Buscar franelas, tazas, uniformes…" aria-label="Buscar productos">
    </form>

    <div class="header-actions">
      <button class="icon-btn" type="button" onclick="STAMPY.openCart()" aria-label="Abrir carrito" aria-controls="cartDrawer">
        ${A.icon("cart")}
        <span class="cart-count" id="cartCount" data-empty="true">0</span>
      </button>
      <a class="btn btn-dark btn-sm header-cta" href="${A.urlDisenar()}">Diseñar ahora</a>
      <button class="icon-btn burger" id="navToggle" type="button" onclick="STAMPY.toggleNav()" aria-label="Menú" aria-controls="mainNav" aria-expanded="false">
        ${A.icon("menu")}
      </button>
    </div>
  </div>
</header>

<div class="overlay" id="overlay" onclick="STAMPY.closeCart()"></div>
<aside class="drawer" id="cartDrawer" aria-labelledby="cartTitle">
  <div class="drawer-head">
    <h3 id="cartTitle">Tu carrito <small id="cartTitleCount"></small></h3>
    <button class="icon-btn" type="button" onclick="STAMPY.closeCart()" aria-label="Cerrar carrito">${A.icon("close")}</button>
  </div>
  <div class="drawer-body" id="cartBody"></div>
  <div class="drawer-foot" id="cartFoot"></div>
</aside>`;

      // Menú móvil: se cierra al elegir un enlace o con Escape
      const nav = document.getElementById("mainNav");
      if (nav) nav.addEventListener("click", (e) => { if (e.target.closest("a")) A.toggleNav(false); });
      document.addEventListener("keydown", (e) => {
        const n = document.getElementById("mainNav");
        if (e.key === "Escape" && n && n.classList.contains("is-open")) {
          A.toggleNav(false);
          const b = document.getElementById("navToggle");
          if (b) b.focus();
        }
      });
    }

    const footerHost = document.getElementById("app-footer");
    if (footerHost) {
      const ig = A.instagramURL();
      const wa = A.waURL("Hola Estampy, quiero hacer un pedido");
      const tel = String(CFG.contact.phone || "");
      const telValido = /\d{7,}/.test(tel.replace(/\D/g, "")) && !/\[/.test(tel);
      footerHost.outerHTML = `
<footer class="footer" id="contacto">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        ${A.logoHTML(bp + "index.html")}
        <p class="footer-desc">Sublimación a todo color hecha en Venezuela: franelas, uniformes, tazas, gorras y regalos con tu diseño. Desde una pieza hasta el lote de tu empresa o tu equipo.</p>
        <div class="socials">
          ${ig ? `<a href="${ig}" target="_blank" rel="noopener" aria-label="Instagram de Estampy">${A.icon("instagram")}</a>` : ""}
          ${wa ? `<a href="${wa}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${A.icon("whatsapp")}</a>` : ""}
          <a href="mailto:${A.escape(CFG.contact.email)}" aria-label="Correo de Estampy">${A.icon("mail")}</a>
        </div>
      </div>
      <div>
        <h4>Tienda</h4>
        <ul>
          <li><a href="${bp}index.html?filtro=franelas#catalogo">Franelas</a></li>
          <li><a href="${bp}index.html?filtro=deportiva#catalogo">Uniformes deportivos</a></li>
          <li><a href="${bp}index.html?filtro=chemises#catalogo">Chemises</a></li>
          <li><a href="${bp}index.html?filtro=ninos#catalogo">Niños</a></li>
          <li><a href="${bp}index.html?filtro=accesorios#catalogo">Gorras y accesorios</a></li>
          <li><a href="${bp}index.html?filtro=hogar#catalogo">Tazas y regalos</a></li>
        </ul>
      </div>
      <div>
        <h4>Ayuda</h4>
        <ul>
          <li><a href="${bp}index.html#como-funciona">Cómo funciona</a></li>
          <li><a href="${bp}index.html#mayor">Precios al mayor</a></li>
          <li><a href="${bp}index.html#pagos">Formas de pago y entrega</a></li>
          <li><a href="${bp}seguimiento.html">Seguir mi pedido</a></li>
        </ul>
      </div>
      <div>
        <h4>Contacto</h4>
        <ul>
          <li>${telValido ? `<a href="tel:${tel.replace(/[^\d+]/g, "")}">${A.escape(tel)}</a>` : A.escape(tel)}</li>
          <li><a href="mailto:${A.escape(CFG.contact.email)}">${A.escape(CFG.contact.email)}</a></li>
          ${ig ? `<li><a href="${ig}" target="_blank" rel="noopener">@${A.escape(String(CFG.contact.instagram).replace(/^@/, ""))}</a></li>` : ""}
          ${wa ? `<li><a href="${wa}" target="_blank" rel="noopener">WhatsApp</a></li>` : ""}
          ${(CFG.tiendas || []).map((t) => `<li><span>${A.escape(t.nombre)}</span></li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${A.escape(CFG.storeName || "Estampy")}${CFG.contact.rif ? " · RIF " + A.escape(CFG.contact.rif) : ""}</span>
      <span>
        Tasa referencial: 1 USD = ${Number(CFG.bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs · act. ${A.escape(CFG.bcvUpdated)}
        · <a href="${bp}admin/index.html">Panel interno</a>
      </span>
    </div>
  </div>
</footer>`;
    }

    A.renderCart();
  };

  /** Abre o cierra el menú móvil (forzar: true/false opcional). */
  A.toggleNav = function (forzar) {
    const nav = document.getElementById("mainNav");
    if (!nav) return;
    const abierto = nav.classList.toggle("is-open", typeof forzar === "boolean" ? forzar : undefined);
    const b = document.getElementById("navToggle");
    if (b) b.setAttribute("aria-expanded", abierto ? "true" : "false");
  };

  A.onGlobalSearch = function (ev, form) {
    ev.preventDefault();
    const input = (form && form.querySelector("input")) || document.getElementById("globalSearchInput");
    const q = input ? input.value.trim() : "";
    const bp = A.basePath || "";
    if (document.getElementById("gridProductos") && A.catalogo) {
      A.catalogo.buscar(q);
      const nav = document.getElementById("mainNav");
      if (nav) nav.classList.remove("is-open");
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    } else {
      location.href = bp + "index.html?q=" + encodeURIComponent(q) + "#catalogo";
    }
    return false;
  };

  /* ====================== Drawer del carrito ====================== */
  let focoAntesDelCarrito = null;
  A.openCart = function () {
    const d = document.getElementById("cartDrawer");
    if (!d) return;
    if (!d.classList.contains("is-open")) focoAntesDelCarrito = document.activeElement;
    d.classList.add("is-open");
    document.getElementById("overlay").classList.add("is-open");
    document.body.style.overflow = "hidden";
    A.toggleNav(false);
    const cerrar = d.querySelector(".drawer-head .icon-btn");
    if (cerrar) setTimeout(() => cerrar.focus({ preventScroll: true }), 60);
  };
  A.closeCart = function () {
    const d = document.getElementById("cartDrawer");
    if (!d) return;
    const estabaAbierto = d.classList.contains("is-open");
    d.classList.remove("is-open");
    document.getElementById("overlay").classList.remove("is-open");
    document.body.style.overflow = "";
    if (estabaAbierto && focoAntesDelCarrito && document.contains(focoAntesDelCarrito) && focoAntesDelCarrito.focus) {
      focoAntesDelCarrito.focus({ preventScroll: true });
    }
    focoAntesDelCarrito = null;
  };

  /** Aviso de productos bajo su pedido mínimo (HTML) o "" si todo está bien. */
  A.avisoMinimoHTML = function () {
    const f = Cart.faltaMinimo();
    if (!f.length) return "";
    return `<div class="notice notice-red">${A.icon("alert")}<span>${f
      .map((x) => `<strong>${A.escape(x.producto.nombre)}</strong>: el pedido mínimo es de ${x.minimo} unidades y llevas ${x.tiene}. Agrega ${x.minimo - x.tiene} más para poder pagar.`)
      .join("<br>")}</span></div>`;
  };

  A.renderCart = function () {
    const badge = document.getElementById("cartCount");
    const n = Cart.count();
    if (badge) {
      badge.textContent = n;
      badge.dataset.empty = n === 0 ? "true" : "false";
    }

    const body = document.getElementById("cartBody");
    const foot = document.getElementById("cartFoot");
    if (!body || !foot) return;

    const lineas = Cart.detailed();
    const bp = A.basePath || "";
    const titulo = document.getElementById("cartTitleCount");
    if (titulo) titulo.textContent = n ? `(${n} ${n === 1 ? "unidad" : "unidades"})` : "";

    if (!body.dataset.listo) {
      body.dataset.listo = "1";
      body.addEventListener("click", (e) => {
        const b = e.target.closest("[data-act]");
        if (!b) return;
        const key = b.closest("[data-key]").dataset.key;
        const it = Cart.items().find((x) => x.key === key);
        if (!it) return;
        if (b.dataset.act === "quitar") Cart.remove(key);
        else if (b.dataset.act === "menos") it.qty <= 1 ? Cart.remove(key) : Cart.setQty(key, it.qty - 1);
        else if (b.dataset.act === "mas") {
          const antes = it.qty;
          Cart.setQty(key, it.qty + 1);
          const ahora = (Cart.items().find((x) => x.key === key) || {}).qty;
          if (ahora === antes) A.toast("No quedan más unidades de esa talla", "alert");
        }
      });
    }

    if (!lineas.length) {
      body.innerHTML = `
        <div class="empty-state">
          ${A.icon("cart")}
          <h4 style="margin-bottom:6px">Tu carrito está vacío</h4>
          <p class="small">Elige una franela, una taza o lo que quieras personalizar.</p>
          <a class="btn btn-dark btn-sm" style="margin-top:18px" href="${bp}index.html#catalogo" onclick="STAMPY.closeCart()">Ver catálogo</a>
        </div>`;
      foot.innerHTML = "";
      return;
    }

    body.innerHTML = lineas
      .map((l) => {
        const url = `${bp}producto.html?id=${encodeURIComponent(l.id)}`;
        const max = A.stockDe(l.producto, l.talla);
        return `
      <div class="cart-item" data-key="${A.escape(l.key)}">
        <a class="cart-thumb" href="${url}">
          <img src="${A.img((l.producto.imagenes || [])[0])}" alt="${A.escape(l.producto.nombre)}">
        </a>
        <div class="cart-info">
          <h4><a href="${url}">${A.escape(l.producto.nombre)}</a></h4>
          <p class="cart-sub">
            ${A.fmtUSD(l.precio)} c/u
            ${l.mayor ? ` <s class="muted"><span class="sr-only">antes </span>${A.fmtUSD(l.precioBase)}</s> <span class="badge badge-yellow" style="margin-left:4px">Al mayor</span>` : ""}
          </p>
          <div class="cart-meta">${A.lineaMetaHTML(l)}</div>
          ${A.disenoHTML(l.diseno)}
          <div class="cart-line-foot">
            <div class="qty">
              <button type="button" data-act="menos" aria-label="Restar una unidad de ${A.escape(l.producto.nombre)}">−</button>
              <span>${l.qty}</span>
              <button type="button" data-act="mas" aria-label="Sumar una unidad de ${A.escape(l.producto.nombre)}" ${l.qty >= max ? "disabled" : ""}>+</button>
            </div>
            <div class="cart-line-total">
              <strong>${A.fmtUSD(l.subtotal)}</strong>
              <button class="cart-remove" type="button" data-act="quitar" aria-label="Quitar ${A.escape(l.producto.nombre)} del carrito">Quitar</button>
            </div>
          </div>
        </div>
      </div>`;
      })
      .join("");

    const sub = Cart.subtotal();
    const falta = A.round2(CFG.freeShippingOver - sub);
    const minimo = A.avisoMinimoHTML();
    const dias = A.diasEntrega(Cart.items(), null);
    foot.innerHTML = `
      <div class="totals">
        <div class="total-row"><span>Subtotal (${n} ${n === 1 ? "unidad" : "unidades"})</span><strong>${A.fmtUSD(sub)}</strong></div>
        <div class="total-row"><span class="tiny">Equivalente en bolívares</span><span class="tiny">${A.fmtBs(sub)}</span></div>
        <div class="total-row"><span class="tiny">Producción</span><span class="tiny">${dias ? A.diasTxt(dias) + " tras aprobar el diseño" : "Listo para despachar"}</span></div>
      </div>
      ${minimo ? `<div style="margin-bottom:12px">${minimo}</div>` : ""}
      ${
        falta > 0
          ? `<div class="notice notice-blue" style="margin-bottom:12px">${A.icon("truck")}<span>Te faltan <strong>${A.fmtUSD(falta)}</strong> para el delivery gratis.</span></div>`
          : `<div class="notice notice-green" style="margin-bottom:12px">${A.icon("checkCircle")}<span>¡Tu pedido tiene delivery gratis!</span></div>`
      }
      ${minimo
        ? `<button class="btn btn-primary btn-block" type="button" disabled>${A.icon("lock")} Completa el mínimo para pagar</button>`
        : `<a class="btn btn-primary btn-block" href="${bp}checkout.html">${A.icon("lock")} Finalizar compra</a>`}
      <button class="btn btn-ghost btn-block btn-sm" style="margin-top:8px" type="button" onclick="STAMPY.closeCart()">Seguir comprando</button>`;
  };

  /* ====================== Tarjeta de producto ====================== */
  /** ¿Hace falta elegir algo (talla, diseño) antes de agregar? */
  A.necesitaElegir = (p) => A.tieneTallas(p) || !!p.permiteDiseno || ((p.colores || []).length > 1) || (Number(p.pedidoMinimo) || 1) > 1;

  A.cardHTML = function (p) {
    const bp = A.basePath || "";
    const url = `${bp}producto.html?id=${encodeURIComponent(p.id)}`;
    const dsc = p.precioAnterior ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
    const est = A.estadoStock(p);
    const min = A.precioMinimo(p);
    const mayor = min < Number(p.precio);
    const elegir = A.necesitaElegir(p);
    const fav = A.favs.has(p.id);
    const s = A.specsCortas(p);
    // "Blanco · XS–3XL · 150 g/m²"
    const linea = [s.color, s.tallas, s.extra, s.minimo].filter(Boolean).join(" · ") || p.categoriaLabel || "";
    const etiqueta = (p.etiquetas || [])[0];
    const aviso = est.agotado || est.cls === "dot-amber"
      ? `<p class="card-stock${est.agotado ? " is-out" : ""}">${A.escape(est.txt)}</p>` : "";
    const antes = p.precioAnterior ? `<s><span class="sr-only">antes </span>${A.fmtUSD(p.precioAnterior)}</s> ` : "";

    return `
    <article class="card" data-id="${A.escape(p.id)}">
      <div class="card-media">
        <img src="${A.img((p.imagenes || [])[0])}" alt="" loading="lazy" width="400" height="400">
        <div class="card-tags">
          ${dsc > 0 ? `<span class="badge badge-solid">−${dsc}%</span>` : ""}
          ${etiqueta ? `<span class="badge badge-ink">${A.escape(etiqueta)}</span>` : ""}
        </div>
        <button class="card-fav${fav ? " is-on" : ""}" type="button" aria-pressed="${fav}"
                onclick="STAMPY.toggleFav('${A.escape(p.id)}', this)" aria-label="Guardar ${A.escape(p.nombre)} en favoritos">${A.icon("heart")}</button>
      </div>
      <div class="card-body">
        <h3 class="card-title"><a href="${url}">${A.escape(p.nombre)}</a></h3>
        <p class="card-spec">${A.escape(linea)}</p>
        ${aviso}
        <div class="card-foot">
          <p class="card-price">
            ${mayor
              ? `<span class="card-price-from">Desde <strong>${A.fmtUSD(min)}</strong></span>
                 <span class="card-price-retail">${antes}${A.fmtUSD(p.precio)} c/u</span>`
              : `<strong class="card-price-from">${A.fmtUSD(p.precio)}</strong>
                 <span class="card-price-retail">${antes}c/u</span>`}
          </p>
          <button class="add-btn" type="button" onclick="STAMPY.quickAdd('${A.escape(p.id)}', this)"
                  aria-label="${elegir ? "Personalizar" : "Agregar al carrito"}: ${A.escape(p.nombre)}"
                  title="${elegir ? "Elegir tallas y diseño" : "Agregar al carrito"}"
                  ${est.agotado ? "disabled" : ""}>${A.icon(elegir ? "arrowRight" : "plus")}</button>
        </div>
      </div>
    </article>`;
  };

  /** Botón rápido de la tarjeta: si hay que elegir talla o diseño, abre la ficha. */
  A.quickAdd = function (id, btn) {
    const p = A.getProduct(id);
    if (!p) return;
    if (A.necesitaElegir(p)) {
      location.href = `${A.basePath || ""}producto.html?id=${encodeURIComponent(id)}#comprar`;
      return;
    }
    if (!Cart.add(id, 1)) return;
    if (btn) {
      btn.classList.add("is-done");
      btn.innerHTML = A.icon("check");
      setTimeout(() => {
        btn.classList.remove("is-done");
        btn.innerHTML = A.icon("plus");
      }, 1200);
    }
  };

  A.toggleFav = function (id, btn) {
    const on = A.favs.toggle(id);
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    A.toast(on ? "Guardado en favoritos" : "Quitado de favoritos", "heart");
  };

  /* ====================== Validaciones ====================== */
  A.validar = {
    requerido: (v) => String(v || "").trim().length > 0,
    email: (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || "").trim()),
    telefono: (v) => /^0(4(12|14|16|24|26)|2\d{2})[-\s]?\d{3}[-\s]?\d{4}$/.test(String(v || "").replace(/\s/g, "")),
    cedula: (v) => /^[VEJGPvejgp][-\s]?\d{1,3}\.?\d{3}\.?\d{3}$/.test(String(v || "").trim()),
    referencia: (v) => /^\d{4,20}$/.test(String(v || "").trim()),
    minLen: (v, n) => String(v || "").trim().length >= n,
  };

  A.marcarError = function (input, hay) {
    if (!input) return;
    input.classList.toggle("is-error", !!hay);
    const err = input.parentElement.querySelector(".field-error");
    if (err) err.classList.toggle("is-shown", !!hay);
  };

  /* ==================== Sesión del panel ====================
     Autenticación de demostración: los usuarios viven en el propio
     archivo. En producción esto lo resuelve el servidor. */
  A.usuarios = [
    { usuario: "admin", clave: "stampy-demo", nombre: "Luis Ruiz", rol: "admin", cargo: "Administrador" },
    { usuario: "almacen", clave: "stampy-demo", nombre: "Wilmer Rojas", rol: "almacen", cargo: "Jefe de almacén" },
    { usuario: "ventas", clave: "stampy-demo", nombre: "Katiuska Silva", rol: "ventas", cargo: "Coordinadora de ventas" },
  ];

  A.permisos = {
    admin: ["panel", "pedidos", "pagos", "inventario", "envios", "clientes", "reportes", "configuracion", "bitacora"],
    ventas: ["panel", "pedidos", "pagos", "clientes"],
    almacen: ["panel", "pedidos", "inventario", "envios"],
  };

  A.sesion = {
    actual: () => store.get(K_SESION, null),

    /** Con servidor, la clave la valida el backend y nunca viaja en el código
        público. Sin servidor, se valida contra la lista de arriba. */
    async entrar(usuario, clave) {
      if (A.modoServidor) {
        try {
          const d = await A.api.entrar(usuario, clave);
          store.set(K_SESION, d.sesion);
          if (d.permisos && d.permisos.length) A.permisos[d.sesion.rol] = d.permisos;
          A.avisoSeguridad = !!d.avisoSeguridad;
          return d.sesion;
        } catch (e) {
          return null;
        }
      }
      const u = A.usuarios.find(
        (x) => x.usuario === String(usuario).trim().toLowerCase() && x.clave === clave
      );
      if (!u) return null;
      const s = { usuario: u.usuario, nombre: u.nombre, rol: u.rol, cargo: u.cargo, desde: new Date().toISOString() };
      store.set(K_SESION, s);
      A.bitacora.add("sesion-iniciada", `${u.nombre} (${u.cargo}) inició sesión`);
      return s;
    },

    salir() {
      const s = A.sesion.actual();
      if (s && !A.modoServidor) A.bitacora.add("sesion-cerrada", `${s.nombre} cerró sesión`);
      store.set(K_SESION, null);
      if (A.api) A.api.salir();
    },
    puede(modulo) {
      const s = A.sesion.actual();
      if (!s) return false;
      return (A.permisos[s.rol] || []).includes(modulo);
    },
  };

  /* ====================== Arranque ====================== */
  A.init = async function (page) {
    await A.cargarDatos();
    Orders.seed();
    A.renderChrome(page);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") A.closeCart();
    });
    // En producto y checkout el cliente está armando su pedido: no se recarga sola.
    if (!/(producto|checkout).html/.test(location.pathname)) A.autoRefrescar();
    return A.modoServidor;
  };

  /* Arranque para las páginas del panel (sin carrito ni cabecera pública) */
  A.initAdmin = async function () {
    await A.cargarDatos();
    Orders.seed();
    A.autoRefrescar();
    return A.modoServidor;
  };

  /* ==================== Auto-refresco ====================
     Cada 5 minutos recarga la página para traer datos frescos del
     servidor (precios, stock, estado de pedidos), en toda la tienda,
     el panel y el checkout. Se pausa solo si el usuario está
     escribiendo en un campo o hay un modal abierto en ese momento. */
  A.autoRefrescar = function () {
    const CINCO_MIN = 5 * 60 * 1000;
    setInterval(() => {
      const activo = document.activeElement;
      const escribiendo = activo && (activo.tagName === "INPUT" || activo.tagName === "TEXTAREA" || activo.tagName === "SELECT");
      const hayModalAbierto = document.querySelector(".modal-overlay, .modal.is-open, [aria-modal='true']");
      if (escribiendo || hayModalAbierto) return; // reintenta en el próximo ciclo
      location.reload();
    }, CINCO_MIN);
  };
})();
