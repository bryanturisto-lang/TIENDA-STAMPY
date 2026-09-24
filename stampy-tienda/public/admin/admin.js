/* =========================================================
   STAMPY — Motor del panel administrativo
   Sesión, menú por rol, tablas, modales, gráficos y utilidades
   ========================================================= */

window.ADM = (function () {
  "use strict";

  const A = window.STAMPY;
  const ADM = {};

  /* ==================== Menú ==================== */
  const MENU = [
    { grupo: "Operación" },
    { id: "panel", label: "Panel", icono: "chart", href: "index.html" },
    { id: "pedidos", label: "Pedidos", icono: "receipt", href: "pedidos.html", contador: () => A.orders.activos().filter((o) => o.estadoIndex < A.orders.pasosDe(o).length - 1).length },
    { id: "pagos", label: "Pagos por verificar", icono: "phone", href: "pagos.html", contador: () => A.orders.porVerificar().length },
    { id: "envios", label: "Envíos", icono: "truck", href: "envios.html", contador: () => A.orders.enCurso().length },
    { grupo: "Catálogo" },
    { id: "inventario", label: "Inventario", icono: "box", href: "inventario.html", contador: () => new Set(ADM.alertasStock().map((x) => x.producto.id)).size },
    { grupo: "Negocio" },
    { id: "clientes", label: "Clientes", icono: "user", href: "clientes.html" },
    { id: "reportes", label: "Reportes", icono: "sparkle", href: "reportes.html" },
    { grupo: "Sistema" },
    { id: "configuracion", label: "Configuración", icono: "settings", href: "configuracion.html" },
    { id: "bitacora", label: "Actividad", icono: "clock", href: "bitacora.html" },
  ];

  ADM.rolNombre = { admin: "Administrador", ventas: "Ventas", almacen: "Almacén" };

  /* ==================== Arranque de página ====================
     Devuelve false si no hay sesión o permiso: la página no debe seguir. */
  ADM.iniciar = async function (modulo, titulo, subtitulo) {
    A.basePath = "../";
    document.body.classList.add("adm-body");
    await A.initAdmin();

    const s = A.sesion.actual();
    if (!s) { ADM.pantallaLogin(); return false; }
    if (!A.sesion.puede(modulo)) { ADM.pantallaSinAcceso(modulo); return false; }

    ADM.armazon(modulo, titulo, subtitulo);
    return true;
  };

  /* ==================== Pantalla de acceso ==================== */
  ADM.pantallaLogin = function () {
    document.body.innerHTML = `
    <div class="login-bg">
      <div class="login-card">
        <a class="login-logo" href="../index.html" aria-label="Estampy — volver a la tienda">${ADM.wordmark()}</a>
        <div class="center" style="margin-bottom:22px">
          <h1 style="font-size:1.3rem">Panel interno</h1>
          <p class="small muted" style="margin-top:5px">Acceso solo para el equipo de Estampy.</p>
        </div>

        <form id="formLogin" class="stack-16" novalidate>
          <div class="field">
            <label for="lgUsuario">Usuario</label>
            <input class="input" id="lgUsuario" autocomplete="username" placeholder="admin">
          </div>
          <div class="field">
            <label for="lgClave">Contraseña</label>
            <input class="input" id="lgClave" type="password" autocomplete="current-password" placeholder="••••••••">
          </div>
          <div id="lgError" class="notice notice-red hidden"></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit">Entrar</button>
        </form>

        <div id="lgBloqueDemos"></div>

        <p class="tiny muted center" style="margin-top:14px" id="lgModo"></p>

        <p class="tiny muted center" style="margin-top:18px">
          <a href="../index.html" style="color:var(--brand)">← Volver a la tienda</a>
        </p>
      </div>
    </div>`;

    /* Los usuarios de demostración solo existen en el modo local (sin
       servidor). Con servidor, las claves las valida el backend y nunca
       se muestran aquí, aunque sigan siendo las de ejemplo. */
    if (!A.modoServidor) {
      document.getElementById("lgBloqueDemos").innerHTML = `
        <div class="login-demo">
          <p class="tiny muted" style="margin-bottom:10px">Modo demostración local — haz clic para entrar:</p>
          <div id="lgDemos">${A.usuarios
            .map(
              (u) => `<button type="button" data-u="${A.escape(u.usuario)}">
                <span class="avatar">${A.escape(u.nombre.split(" ").map((x) => x[0]).slice(0, 2).join(""))}</span>
                <span><strong>${A.escape(u.nombre)} · ${A.escape(u.cargo)}</strong><span>${A.escape(u.usuario)} / ${A.escape(u.clave)}</span></span>
              </button>`
            )
            .join("")}</div>
        </div>`;
    }

    // Aviso del modo en el que está corriendo el panel
    const modo = document.getElementById("lgModo");
    if (A.modoServidor) {
      modo.innerHTML = "Conectado al servidor. Los datos son los mismos para todo el equipo.";
      if (A.avisoSeguridad) {
        modo.innerHTML +=
          '<br><span style="color:var(--amber-600);font-weight:700">Aún usa las claves de demostración: define STAMPY_USUARIOS y STAMPY_SECRET en Netlify.</span>';
      }
    } else {
      const d = (A.api && A.api.diagnostico) || {};
      modo.innerHTML = `
        <span style="color:var(--amber-600);font-weight:700">${A.escape(d.titulo || "Sin conexión con el servidor")}</span><br>
        <span>El panel trabaja con los datos de este navegador.</span>
        <button type="button" id="lgDetalle"
                style="display:block;margin:8px auto 0;color:var(--brand);text-decoration:underline;font-size:.72rem">
          Ver detalle
        </button>`;

      const boton = document.getElementById("lgDetalle");
      if (boton) boton.onclick = () => ADM.diagnostico();
    }

    const demos = document.getElementById("lgDemos");
    if (demos && !A.modoServidor) {
      demos.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-u]");
        if (!b) return;
        const u = A.usuarios.find((x) => x.usuario === b.dataset.u);
        if (!u) return;
        document.getElementById("lgUsuario").value = u.usuario;
        document.getElementById("lgClave").value = u.clave;
        entrar(u.usuario, u.clave);
      });
    }

    document.getElementById("formLogin").addEventListener("submit", (e) => {
      e.preventDefault();
      entrar(document.getElementById("lgUsuario").value, document.getElementById("lgClave").value);
    });

    async function entrar(usuario, clave) {
      const err = document.getElementById("lgError");
      const boton = document.querySelector("#formLogin button[type=submit]");
      boton.disabled = true;
      boton.textContent = "Comprobando…";

      const s = await A.sesion.entrar(usuario, clave);

      if (!s) {
        boton.disabled = false;
        boton.textContent = "Entrar";
        err.classList.remove("hidden");
        err.innerHTML = A.icon("alert") + "<span>Usuario o contraseña incorrectos.</span>";
        return;
      }
      location.reload();
    }
  };

  ADM.pantallaSinAcceso = function (modulo) {
    const s = A.sesion.actual();
    document.body.innerHTML = `
      <div class="sin-acceso">
        ${A.icon("lock", "", 46)}
        <h1 style="font-size:1.3rem">Sin acceso a esta sección</h1>
        <p class="small muted" style="margin-top:8px">
          Tu perfil (<strong>${ADM.rolNombre[s.rol]}</strong>) no tiene permiso para ver
          <strong>${modulo}</strong>. Pídeselo a un administrador.
        </p>
        <div class="row" style="justify-content:center;gap:10px;margin-top:22px">
          <a class="btn btn-primary" href="index.html">Ir al panel</a>
          <button class="btn btn-ghost" type="button" onclick="ADM.salir()">Cambiar de usuario</button>
        </div>
      </div>`;
  };

  ADM.salir = function () {
    A.sesion.salir();
    location.href = "index.html";
  };

  /* ==================== Diagnóstico de conexión ==================== */
  ADM.diagnostico = function () {
    const d = (A.api && A.api.diagnostico) || {};
    const enLocal = d.causa === "local";

    ADM.modal({
      titulo: enLocal ? "Estás trabajando sin servidor" : "No hay conexión con el servidor",
      subtitulo: "Qué está pasando y cómo resolverlo",
      cuerpo: `
        <div class="notice ${enLocal ? "notice-blue" : "notice-amber"}" style="margin-bottom:18px">
          ${A.icon(enLocal ? "info" : "alert")}
          <span><strong>${A.escape(d.titulo || "Sin conexión")}</strong><br>${A.escape(d.detalle || "")}</span>
        </div>

        <h4 style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-muted);margin-bottom:8px">Qué hacer</h4>
        <p class="small" style="color:var(--ink-soft);margin-bottom:18px">${A.escape(d.ayuda || "")}</p>

        <h4 style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-muted);margin-bottom:8px">Mientras tanto</h4>
        <p class="small" style="color:var(--ink-soft);margin-bottom:18px">
          El panel y la tienda funcionan igual, pero con los datos guardados en <strong>este navegador</strong>.
          Los pedidos que haga un cliente no los verás aquí, y lo que cambies aquí no lo verá nadie más.
        </p>

        <details style="border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px 14px">
          <summary style="cursor:pointer;font-size:.82rem;font-weight:600;color:var(--brand-deep)">Detalle técnico</summary>
          <dl class="dl" style="margin-top:12px">
            <div class="dl-row"><dt>Causa</dt><dd class="mono">${A.escape(d.causa || "—")}</dd></div>
            <div class="dl-row"><dt>Comprobación</dt><dd class="mono">${location.origin}/api/salud</dd></div>
          </dl>
          <p class="tiny muted" style="margin-top:10px">
            Abre esa dirección en una pestaña: si responde <span class="mono">{"ok":true}</span> el servidor está bien.
            Si da error, míralo en Netlify → Deploys → último deploy → Function logs.
          </p>
        </details>`,
      pie: `<button class="btn btn-ghost" type="button" onclick="ADM.cerrarModal()">Cerrar</button>
            <a class="btn btn-ghost" href="${location.origin}/api/salud" target="_blank" rel="noopener">Abrir /api/salud</a>
            <button class="btn btn-primary" type="button" id="admReintentar">${A.icon("refresh")} Reintentar conexión</button>`,
      alAbrir: (bg) => {
        bg.querySelector("#admReintentar").onclick = async function () {
          this.disabled = true;
          this.innerHTML = "Comprobando…";
          const ok = await A.api.reintentar();
          if (ok) {
            A.toast("¡Conectado! Recargando…", "checkCircle");
            setTimeout(() => location.reload(), 900);
          } else {
            ADM.cerrarModal();
            setTimeout(ADM.diagnostico, 300);
          }
        };
      },
    });
  };

  /* ==================== Armazón (menú + barra) ==================== */
  ADM.armazon = function (activo, titulo, subtitulo) {
    const s = A.sesion.actual();
    const permitidos = A.permisos[s.rol] || [];
    const iniciales = s.nombre.split(" ").map((x) => x[0]).slice(0, 2).join("");

    let nav = "";
    MENU.forEach((m) => {
      if (m.grupo) {
        const quedan = MENU.slice(MENU.indexOf(m) + 1);
        const hasta = quedan.findIndex((x) => x.grupo);
        const items = hasta === -1 ? quedan : quedan.slice(0, hasta);
        if (!items.some((i) => permitidos.includes(i.id))) return;
        nav += `<div class="adm-nav-group">${m.grupo}</div>`;
        return;
      }
      if (!permitidos.includes(m.id)) return;
      let n = 0;
      try { n = m.contador ? m.contador() : 0; } catch (e) { n = 0; }
      nav += `<a href="${m.href}"${m.id === activo ? ' class="is-active"' : ""}>
        ${A.icon(m.icono)}<span>${m.label}</span>${n > 0 ? `<span class="pill">${n}</span>` : ""}
      </a>`;
    });

    const shell = document.createElement("div");
    shell.className = "adm";
    shell.innerHTML = `
      <aside class="adm-side" id="admSide">
        <div class="adm-brand">
          <a href="index.html" aria-label="Estampy — panel">
            ${ADM.wordmark()}
            <small>Panel interno</small>
          </a>
        </div>
        <nav class="adm-nav">${nav}</nav>
        <div class="adm-side-foot">
          <div class="adm-user">
            <span class="avatar">${iniciales}</span>
            <span><strong>${A.escape(s.nombre)}</strong><span>${A.escape(s.cargo)}</span></span>
          </div>
          <div class="tiny" style="padding:0 4px 10px;color:rgba(255,255,255,.45)">
            ${A.modoServidor
              ? (A.avisoSeguridad
                  ? '<span style="color:#ffcf7a">● Servidor · falta configurar las claves</span>'
                  : '<span style="color:#7fe0a8">● Conectado al servidor</span>')
              : `<button type="button" onclick="ADM.diagnostico()" style="color:#ffcf7a;text-align:left;font-size:inherit">
                   ○ Sin servidor · ver por qué
                 </button>`}
          </div>
          <div class="row" style="gap:7px">
            <a class="btn btn-ghost btn-sm grow" href="../index.html" style="background:transparent;color:rgba(255,255,255,.75);border-color:rgba(255,255,255,.18)">Ver tienda</a>
            <button class="btn btn-ghost btn-sm" type="button" onclick="ADM.salir()" style="background:transparent;color:rgba(255,255,255,.75);border-color:rgba(255,255,255,.18)" aria-label="Salir">Salir</button>
          </div>
        </div>
      </aside>

      <div class="adm-backdrop" id="admBackdrop" onclick="ADM.menu(false)"></div>

      <div class="adm-main">
        <header class="adm-top">
          <button class="icon-btn adm-burger" type="button" onclick="ADM.menu(true)" aria-label="Menú">${A.icon("menu")}</button>
          <div>
            <h1>${titulo}</h1>
            ${subtitulo ? `<p>${subtitulo}</p>` : ""}
          </div>
          <div class="adm-top-actions" id="admAcciones"></div>
        </header>
        <main class="adm-content" id="admContenido"></main>
      </div>`;

    const cuerpo = document.getElementById("adm-page");
    document.body.insertBefore(shell, cuerpo);
    document.getElementById("admContenido").appendChild(cuerpo);
    cuerpo.classList.remove("hidden");
  };

  ADM.menu = function (abrir) {
    document.getElementById("admSide").classList.toggle("is-open", abrir);
    document.getElementById("admBackdrop").classList.toggle("is-open", abrir);
  };

  ADM.acciones = function (html) {
    const c = document.getElementById("admAcciones");
    if (c) c.innerHTML = html;
  };

  /* ==================== Modal ==================== */
  ADM.modal = function (opciones) {
    cerrarModal();
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.id = "admModal";
    bg.innerHTML = `
      <div class="modal ${opciones.ancho || ""}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>${opciones.titulo}</h3>
            ${opciones.subtitulo ? `<p>${opciones.subtitulo}</p>` : ""}
          </div>
          <button class="icon-btn" type="button" onclick="ADM.cerrarModal()" aria-label="Cerrar">${A.icon("close")}</button>
        </div>
        <div class="modal-body">${opciones.cuerpo}</div>
        ${opciones.pie ? `<div class="modal-foot">${opciones.pie}</div>` : ""}
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener("click", (e) => { if (e.target === bg) cerrarModal(); });
    requestAnimationFrame(() => bg.classList.add("is-open"));
    if (opciones.alAbrir) opciones.alAbrir(bg);
    return bg;
  };

  function cerrarModal() {
    const m = document.getElementById("admModal");
    if (!m) return;
    m.classList.remove("is-open");
    setTimeout(() => m.remove(), 240);
  }
  ADM.cerrarModal = cerrarModal;

  ADM.confirmar = function (titulo, texto, alConfirmar, textoBoton, peligro) {
    ADM.modal({
      titulo,
      ancho: "angosto",
      cuerpo: `<p class="small" style="color:var(--ink-soft)">${texto}</p>`,
      pie: `<button class="btn btn-ghost" type="button" onclick="ADM.cerrarModal()">Cancelar</button>
            <button class="btn ${peligro ? "btn-dark" : "btn-primary"}" type="button" id="admConfirmarOk"
                    ${peligro ? 'style="background:var(--red-600)"' : ""}>${textoBoton || "Confirmar"}</button>`,
      alAbrir: (bg) => {
        bg.querySelector("#admConfirmarOk").onclick = () => { cerrarModal(); alConfirmar(); };
      },
    });
  };

  /* ==================== Panel de detalle ==================== */
  ADM.detalle = function (titulo, cuerpo, pie) {
    let d = document.getElementById("admDetalle");
    if (!d) {
      d = document.createElement("aside");
      d.className = "det";
      d.id = "admDetalle";
      document.body.appendChild(d);
      const bd = document.createElement("div");
      bd.className = "overlay";
      bd.id = "admDetalleBg";
      bd.onclick = ADM.cerrarDetalle;
      document.body.appendChild(bd);
    }
    d.innerHTML = `
      <div class="det-head">
        <div class="row-between">
          ${titulo}
          <button class="icon-btn" type="button" onclick="ADM.cerrarDetalle()" aria-label="Cerrar">${A.icon("close")}</button>
        </div>
      </div>
      <div class="det-body">${cuerpo}</div>
      ${pie ? `<div class="det-foot">${pie}</div>` : ""}`;
    requestAnimationFrame(() => {
      d.classList.add("is-open");
      document.getElementById("admDetalleBg").classList.add("is-open");
    });
    return d;
  };

  ADM.cerrarDetalle = function () {
    const d = document.getElementById("admDetalle");
    const bg = document.getElementById("admDetalleBg");
    if (d) d.classList.remove("is-open");
    if (bg) bg.classList.remove("is-open");
  };

  /* ==================== Utilidades de datos ==================== */
  ADM.estadoBadge = function (o) {
    if (o.cancelado) return '<span class="badge badge-red">Cancelado</span>';
    const pasos = A.orders.pasosDe(o);
    const p = pasos[o.estadoIndex];
    if (o.estadoIndex >= pasos.length - 1) return '<span class="badge badge-green">' + p.titulo + "</span>";
    if (o.estadoIndex === 0) return '<span class="badge badge-amber">' + p.titulo + "</span>";
    return '<span class="badge">' + p.titulo + "</span>";
  };

  ADM.pagoBadge = function (o) {
    return {
      verificado: '<span class="badge badge-green">Verificado</span>',
      reportado: '<span class="badge badge-amber">Por verificar</span>',
      rechazado: '<span class="badge badge-red">Rechazado</span>',
      "por-cobrar": '<span class="badge badge-gray">Por cobrar</span>',
    }[o.pagoEstado] || '<span class="badge badge-gray">—</span>';
  };

  ADM.metodoLabel = function (m) {
    return {
      "pago-movil": "Pago móvil",
      transferencia: "Transferencia",
      zelle: "Zelle",
      binance: "Binance (USDT)",
      paypal: "PayPal",
      "banesco-panama": "Banesco Panamá",
      efectivo: "Efectivo al retirar",
    }[m] || m;
  };

  /* ==================== Stock ==================== */
  ADM.STOCK_BAJO = 3;

  /** Variantes con 3 unidades o menos (por talla si el producto tiene tallas).
      Los productos bajo pedido nunca generan alerta. */
  ADM.alertasStock = function (lista) {
    const out = [];
    (lista || A.products).forEach((p) => {
      if (A.bajoPedido(p)) return;
      if (A.tieneTallas(p)) {
        p.tallas.forEach((t) => {
          const n = A.stockDe(p, t);
          if (n <= ADM.STOCK_BAJO) out.push({ producto: p, talla: t, stock: n });
        });
      } else {
        const n = A.stockDe(p);
        if (n <= ADM.STOCK_BAJO) out.push({ producto: p, talla: null, stock: n });
      }
    });
    return out.sort((a, b) => a.stock - b.stock);
  };

  /** Estado de inventario de un producto: pedido | agotado | parcial | bajo | ok */
  ADM.estadoStock = function (p) {
    if (A.bajoPedido(p)) return "pedido";
    const total = A.stockTotal(p);
    if (total === 0) return "agotado";
    const alertas = ADM.alertasStock([p]);
    if (alertas.some((a) => a.stock === 0)) return "parcial";
    if (alertas.length) return "bajo";
    return "ok";
  };

  ADM.stockBadge = function (p) {
    const e = ADM.estadoStock(p);
    const total = A.stockTotal(p);
    if (e === "pedido") return '<span class="badge badge-pedido">Bajo pedido</span>';
    if (e === "agotado") return '<span class="badge badge-red">Agotado</span>';
    if (e === "parcial") return '<span class="badge badge-red">Tallas agotadas</span>';
    if (e === "bajo") return '<span class="badge badge-amber">Stock bajo</span>';
    return '<span class="badge badge-green">' + total + " unid.</span>";
  };

  /** Desglose de stock por talla como fichas (resalta las que están bajas). */
  ADM.stockTallasHTML = function (p) {
    if (A.bajoPedido(p) || !A.tieneTallas(p)) return "";
    return `<div class="talla-stock">${p.tallas
      .map((t) => {
        const n = A.stockDe(p, t);
        const cls = n === 0 ? "cero" : n <= ADM.STOCK_BAJO ? "bajo" : "";
        return `<span class="${cls}" title="Talla ${A.escape(t)}: ${n} unid."><b>${A.escape(t)}</b>${n}</span>`;
      })
      .join("")}</div>`;
  };

  /* ==================== Líneas de pedido: talla, color y diseño ==================== */
  const esURL = (u) => typeof u === "string" && /^https?:\/\//i.test(u.trim());

  /** Hex del color de una línea según el producto (si todavía existe). */
  ADM.colorHex = function (id, nombre) {
    if (!nombre) return null;
    const p = A.getProduct(id);
    const c = p && (p.colores || []).find((x) => x.nombre === nombre);
    return c ? c.hex : null;
  };

  ADM.colorHTML = function (id, nombre) {
    if (!nombre) return "";
    const hex = ADM.colorHex(id, nombre);
    return `<span class="lin-color">${hex ? `<i style="background:${A.escape(hex)}"></i>` : ""}${A.escape(nombre)}</span>`;
  };

  /* --- Logo en prendas y objetos (simulador STAMPY.mockup, ver docs/MODELO.md) ---
     diseno = { nota, archivo, ubicaciones: [{ zona, ref, x, y, w, ratio, anchoCm, altoCm, desdeCm }],
                prenda: { tipo, cuello, infantil, color }, logoPorWhatsApp, preview? }
     En objetos (taza, gorra, mousepad, cojín) prenda = { tipo, color } y las zonas frente/espalda
     son "Lado 1/2", "Cara 1/2", "Frente" o "Superficie" según el tipo. */
  const MK = () => A.mockup || null;
  const ubicDe = (d) => (d && Array.isArray(d.ubicaciones) ? d.ubicaciones.filter((u) => u && u.zona) : []);
  const esManga = (z) => z === "manga-izq" || z === "manga-der";
  // Tipo de pieza del diseño (o del producto, si el diseño no guardó la prenda)
  const tipoDe = (d, producto) =>
    (d && d.prenda && d.prenda.tipo) || (producto && producto.prenda && producto.prenda.tipo) || "";
  const esObjeto = (tipo) => !!(tipo && MK() && MK().esObjeto({ tipo }));
  const vistaLabel = (z, tipo) => (MK() ? MK().etiqueta(tipo || "", z) : z);
  const vistaCorta = (z, tipo) => (MK() ? MK().etiqueta(tipo || "", z, true) : z);

  /** Centímetros al estilo venezolano: 3,5 */
  ADM.cm = (n) => Number(n || 0).toLocaleString("es-VE", { maximumFractionDigits: 1 });

  /** ¿La línea trae algo de diseño (nota, archivo, logo por WhatsApp o ubicaciones)? */
  ADM.tieneDiseno = (d) => !!(d && (d.nota || d.archivo || d.logoPorWhatsApp || ubicDe(d).length));

  /** "Frente · Centro del pecho · 18 × 18 cm · a 3,4 cm del cuello; Espalda · …" (en una taza: "Lado 1 · …") */
  ADM.ubicacionesTexto = function (d) {
    const ubic = ubicDe(d);
    if (!ubic.length) return "";
    if (MK()) return MK().textoUbicaciones({ ubicaciones: ubic, prenda: d.prenda || null });
    return ubic.map((u) => vistaLabel(u.zona) + (u.anchoCm ? ` ${ADM.cm(u.anchoCm)} × ${ADM.cm(u.altoCm)} cm` : "")).join("; ");
  };

  /** "Franela (manga corta) · cuello en V · talla de niño" (o "Taza") a partir del diseño o del producto. */
  ADM.prendaTexto = function (d, producto) {
    const m = MK();
    const pr = m && ((d && d.prenda && m.prendaDe(d.prenda)) || m.prendaDe(producto));
    if (!pr) return "";
    const partes = [m.TIPOS[pr.tipo] || pr.tipo];
    if (pr.cuello === "v" || pr.cuello === "redondo") partes.push(pr.cuello === "v" ? "cuello en V" : "cuello redondo");
    if (pr.infantil) partes.push("talla de niño");
    return partes.join(" · ");
  };

  /** De dónde sale el logo: archivo subido, archivo que no llegó, WhatsApp o nada. */
  function fuenteLogo(d) {
    const a = (d && d.archivo) || null;
    if (a && esURL(a.url)) return { tipo: "archivo", url: a.url.trim(), nombre: a.nombre || "" };
    if (a) return { tipo: "sin-subir", nombre: a.nombre || "" };
    if (d && d.logoPorWhatsApp) return { tipo: "whatsapp" };
    return { tipo: "ninguno" };
  }

  /** Bloque del diseño del cliente: archivo o aviso de WhatsApp, nota y dónde va el logo.
      opciones: { producto, tam } — el producto sirve si el diseño no guardó la prenda. */
  ADM.disenoHTML = function (d, compacto, opciones) {
    const o = opciones || {};
    if (!ADM.tieneDiseno(d)) {
      return compacto ? "" : `<div class="lin-diseno vacio">${A.icon("info", "icon-16")}<span>Sin diseño adjunto: coordinar por WhatsApp.</span></div>`;
    }
    const ubic = ubicDe(d);
    const f = fuenteLogo(d);
    let archivo = "";
    if (f.tipo === "archivo") {
      archivo = `<a class="lin-archivo" href="${A.escape(f.url)}" target="_blank" rel="noopener noreferrer">${A.icon("download", "icon-16")} ${A.escape(f.nombre || "Abrir archivo del logo")}</a>`;
    } else if (f.tipo === "sin-subir") {
      archivo = `<span class="lin-archivo sin-url">${A.icon("whatsapp", "icon-16")} Diseño por WhatsApp${f.nombre ? ` · «${A.escape(f.nombre)}»` : ""}</span>`;
    } else if (f.tipo === "whatsapp") {
      archivo = `<span class="lin-wa">${A.icon("whatsapp", "icon-16")} El cliente enviará el logo por WhatsApp</span>`;
    }
    const m = MK();
    const minis = ubic.length && m
      ? m.miniaturasHTML(Object.assign({}, d, { ubicaciones: ubic }), { tam: o.tam || (compacto ? 46 : 72), producto: o.producto || null, texto: !compacto })
      : "";
    const tipo = tipoDe(d, o.producto);
    const lista = ubic.length && !compacto
      ? `<ul class="lin-ubic">${ubic.map((u) => `<li>${A.escape(m ? m.describir(u, tipo) : vistaLabel(u.zona, tipo))}</li>`).join("")}</ul>`
      : "";
    return `<div class="lin-diseno${compacto ? " compacto" : ""}">
      ${archivo}
      ${d.nota ? `<p>${A.icon("sparkle", "icon-16")}<span>${A.escape(d.nota)}</span></p>` : ""}
      ${minis}${lista}
    </div>`;
  };

  /** Texto plano del diseño (CSV, WhatsApp, búsqueda). */
  ADM.disenoTexto = function (d) {
    if (!d) return "";
    const partes = [];
    if (d.nota) partes.push(d.nota);
    const f = fuenteLogo(d);
    if (f.tipo === "archivo") partes.push(f.url);
    else if (f.tipo === "sin-subir") partes.push("Diseño por WhatsApp" + (f.nombre ? " (" + f.nombre + ")" : ""));
    else if (f.tipo === "whatsapp") partes.push("Logo por WhatsApp");
    const ub = ADM.ubicacionesTexto(d);
    if (ub) partes.push("Logo en: " + ub);
    return partes.join(" · ");
  };

  ADM.archivoURL = (d) => (d && d.archivo && esURL(d.archivo.url) ? d.archivo.url.trim() : "");

  /** Resumen del logo de un pedido para listas: "Logo por WhatsApp · Frente, Espalda" (taza: "Lado 1, Lado 2"). */
  ADM.estadoLogo = function (o) {
    const ds = (o.items || []).map((i) => i.diseno).filter(Boolean);
    const orden = (MK() && MK().ORDEN) || ["frente", "espalda", "manga-izq", "manga-der"];
    const zonas = [];
    (o.items || []).forEach((it) => {
      const tipo = it.diseno ? tipoDe(it.diseno, A.getProduct(it.id)) : "";
      ubicDe(it.diseno).forEach((u) => zonas.push({ z: u.zona, lb: vistaCorta(u.zona, tipo) }));
    });
    zonas.sort((a, b) => orden.indexOf(a.z) - orden.indexOf(b.z));
    const lista = [...new Set(zonas.map((x) => x.lb))].join(", ");
    const tipos = ds.map((d) => fuenteLogo(d).tipo);
    let texto = "Sin diseño adjunto", clase = "";
    if (tipos.includes("whatsapp")) { texto = "Logo por WhatsApp"; clase = "wa"; }
    else if (tipos.includes("sin-subir")) { texto = "Diseño por WhatsApp"; clase = "wa"; }
    else if (tipos.includes("archivo")) { texto = "Archivo de diseño adjunto"; clase = "archivo"; }
    else if (ds.some((d) => d.nota)) { texto = "Diseño con nota"; clase = "nota"; }
    return { texto: texto + (lista ? " · " + lista : ""), clase };
  };

  /* Dos líneas se agrupan solo si llevan el mismo diseño: nota, archivo y ubicaciones del logo. */
  const claveDiseno = (d) =>
    d
      ? [
          d.grupo || "",
          d.nota || "",
          (d.archivo && (d.archivo.url || d.archivo.nombre)) || "",
          d.logoPorWhatsApp ? "wa" : "",
          ubicDe(d).map((u) => [u.zona, u.x, u.y, u.w, u.ratio].join(",")).join(";"),
        ].join("¦")
      : "";

  /** Agrupa las líneas de un pedido por producto + color + diseño, sumando las tallas.
      Devuelve [{ id, nombre, img, color, diseno, tallas:[{talla, qty, precio}], qty, subtotal }]. */
  ADM.agruparLineas = function (items) {
    const grupos = [];
    const mapa = {};
    (items || []).forEach((it) => {
      const k = [it.id, it.color || "", claveDiseno(it.diseno)].join("|");
      if (!mapa[k]) {
        mapa[k] = { id: it.id, nombre: it.nombre, img: it.img, color: it.color || null, diseno: it.diseno || null, tallas: [], qty: 0, subtotal: 0 };
        grupos.push(mapa[k]);
      }
      const g = mapa[k];
      const t = g.tallas.find((x) => x.talla === (it.talla || null));
      if (t) t.qty += it.qty;
      else g.tallas.push({ talla: it.talla || null, qty: it.qty, precio: it.precio });
      g.qty += it.qty;
      g.subtotal = A.round2(g.subtotal + it.precio * it.qty);
    });
    // Tallas en el orden del producto (XS, S, M… o 2, 4, 6…)
    grupos.forEach((g) => {
      const p = A.getProduct(g.id);
      const orden = (p && p.tallas) || [];
      g.tallas.sort((a, b) => {
        const ia = orden.indexOf(a.talla), ib = orden.indexOf(b.talla);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    });
    return grupos;
  };

  /** "S×4 · M×12 · L×10" */
  ADM.tallasTexto = (g) =>
    g.tallas.some((t) => t.talla) ? g.tallas.map((t) => `${t.talla || "—"}×${t.qty}`).join(" · ") : "";

  /** Una línea por grupo con cantidades por talla, color y diseño (detalle de pedidos, pagos, envíos). */
  ADM.lineasHTML = function (items, opciones) {
    const o = opciones || {};
    return ADM.agruparLineas(items)
      .map((g) => {
        const tallas = g.tallas.some((t) => t.talla)
          ? `<div class="lin-tallas">${g.tallas.map((t) => `<span><b>${A.escape(t.talla || "—")}</b>×${t.qty}</span>`).join("")}</div>`
          : "";
        const precios = [...new Set(g.tallas.map((t) => t.precio))];
        return `<div class="order-mini lin">
          <span class="mini-img" style="width:54px;height:54px"><img src="${A.img(g.img)}" alt=""></span>
          <div class="grow" style="min-width:0">
            <strong class="lin-nombre">${A.escape(g.nombre)}</strong>
            <div class="lin-meta">
              <span>${g.qty} ${g.qty === 1 ? "pieza" : "piezas"}</span>
              ${g.color ? ADM.colorHTML(g.id, g.color) : ""}
              ${o.sinPrecio ? "" : `<span>${precios.map((x) => A.fmtUSD(x)).join(" / ")} c/u</span>`}
            </div>
            ${tallas}
            ${o.sinDiseno ? "" : ADM.disenoHTML(g.diseno, o.disenoCompacto, { producto: A.getProduct(g.id), tam: o.tamLogo })}
          </div>
          ${o.sinPrecio ? "" : `<strong class="lin-subtotal">${A.fmtUSD(g.subtotal)}</strong>`}
        </div>`;
      })
      .join("");
  };

  /** Resumen de una línea para CSV y listas: "Franela (Blanco) S×4 · M×8" */
  ADM.resumenGrupo = (g) =>
    `${g.qty}× ${g.nombre}${g.color ? " (" + g.color + ")" : ""}${ADM.tallasTexto(g) ? " " + ADM.tallasTexto(g) : ""}`;

  ADM.resumenPedido = (o) => ADM.agruparLineas(o.items).map(ADM.resumenGrupo).join(" | ");

  ADM.piezas = (o) => o.items.reduce((s, i) => s + i.qty, 0);

  /** ¿La línea se vendió con precio al mayor? (cantidad total del producto en el pedido ≥ primer escalón) */
  ADM.esMayor = function (o, id) {
    const p = A.getProduct(id);
    if (!p) return false;
    const esc = A.escalones(p);
    if (!esc.length) return false;
    const total = o.items.filter((i) => i.id === id).reduce((s, i) => s + i.qty, 0);
    return total >= esc[0].desde;
  };

  /* ==================== Hoja de producción ==================== */

  /** Distancia horizontal del centro del logo a la línea central de la zona.
      Frente y espalda: izquierda/derecha de quien lleva puesta la prenda
      (en el frente, la derecha del dibujo es su lado izquierdo). Mangas: hacia
      el frente o la espalda, como indica el dibujo. Objetos: según el dibujo. */
  function desdeCentroTexto(base, u) {
    const m = MK();
    const area = m && base ? m.areaCm(base, u.zona) : null;
    const x = Number(u.x);
    if (!area || !isFinite(x)) return "—";
    const dx = (x - 0.5) * area.ancho; // + = hacia la derecha del dibujo
    if (Math.abs(dx) < 0.25) return "Centrado";
    const d = ADM.cm(Math.abs(dx)) + " cm";
    if (esObjeto(base.tipo)) return `${d} a la ${dx > 0 ? "derecha" : "izquierda"}`;
    if (u.zona === "frente") return `${d} a la ${dx > 0 ? "izquierda" : "derecha"}`;
    if (u.zona === "espalda") return `${d} a la ${dx > 0 ? "derecha" : "izquierda"}`;
    const haciaFrente = u.zona === "manga-izq" ? dx > 0 : dx < 0;
    return `${d} hacia ${haciaFrente ? "el frente" : "la espalda"}`;
  }

  /** Aviso de dónde sale el logo, pensado para el taller (se lee impreso, sin iconos). */
  function fuenteLogoHojaHTML(d) {
    const f = fuenteLogo(d);
    if (f.tipo === "archivo") {
      return `<div class="hoja-fuente"><strong>Archivo del logo:</strong>
        <a href="${A.escape(f.url)}" target="_blank" rel="noopener noreferrer">${A.escape(f.nombre || "abrir archivo")}</a>
        <span class="hoja-url mono">${A.escape(f.url)}</span></div>`;
    }
    const prev = d && d.preview ? " Los dibujos usan la vista previa que subió el cliente." : "";
    if (f.tipo === "sin-subir") {
      return `<div class="hoja-fuente alerta"><strong>Logo «${A.escape(f.nombre || "sin nombre")}» sin archivo en el sistema.</strong>
        Pídelo por WhatsApp antes de imprimir.${prev}</div>`;
    }
    if (f.tipo === "whatsapp") {
      return `<div class="hoja-fuente alerta wa"><strong>LOGO POR WHATSAPP</strong>
        El cliente envía el logo por WhatsApp: confirma que llegó (y que es el aprobado) antes de imprimir.</div>`;
    }
    return `<div class="hoja-fuente alerta"><strong>Sin archivo del logo.</strong> Coordina el arte con el cliente por WhatsApp.</div>`;
  }

  /** Diseño de un grupo en la hoja: un dibujo grande por ubicación del logo y la tabla de medidas. */
  function hojaDisenoHTML(g, producto) {
    const d = g.diseno;
    const ubic = ubicDe(d);
    const m = MK();
    if (!ubic.length || !m) {
      return ADM.disenoHTML(d) + (d && ADM.archivoURL(d) ? `<p class="hoja-url mono">${A.escape(ADM.archivoURL(d))}</p>` : "");
    }
    const base = (d.prenda && m.prendaDe(d.prenda)) || m.prendaDe(producto) || null;
    const tipo = (base && base.tipo) || "";
    const objeto = esObjeto(tipo);
    const desde = (z) => (objeto ? "del borde" : esManga(z) ? "del hombro" : "del cuello");
    const dibujos = ubic.map((u, i) => `
      <div class="hoja-zona">
        ${m.miniaturasHTML(Object.assign({}, d, { ubicaciones: [u] }), { tam: 200, producto: producto || null, texto: false })}
        <div class="hoja-zona-cap"><b>${i + 1}</b><span><strong>${A.escape(vistaLabel(u.zona, tipo))}</strong>${u.ref ? A.escape(u.ref) : "Posición a mano"}</span></div>
      </div>`).join("");
    const filas = ubic.map((u, i) => `
      <tr>
        <td class="n">${i + 1}</td>
        <td><strong>${A.escape(vistaLabel(u.zona, tipo))}</strong></td>
        <td>${u.ref ? A.escape(u.ref) : '<span class="muted">A mano (ver dibujo)</span>'}</td>
        <td class="med">${u.anchoCm ? `${ADM.cm(u.anchoCm)} × ${ADM.cm(u.altoCm)} cm` : "—"}</td>
        <td class="med">${u.desdeCm != null && u.anchoCm ? `${ADM.cm(u.desdeCm)} cm <small>${desde(u.zona)}</small>` : "—"}</td>
        <td>${desdeCentroTexto(base, u)}</td>
        <td class="chk">☐</td>
      </tr>`).join("");
    return `
      ${fuenteLogoHojaHTML(d)}
      ${d.nota ? `<p class="hoja-indicaciones"><strong>Indicaciones del cliente:</strong> ${A.escape(d.nota)}</p>` : ""}
      <div class="hoja-zonas">${dibujos}</div>
      <div class="hoja-medidas-wrap">
        <table class="hoja-medidas">
          <thead><tr><th>#</th><th>Zona</th><th>Posición</th><th>Tamaño del logo<br><small>ancho × alto</small></th>
            <th>Borde superior<br><small>${objeto ? "al borde de la pieza" : "al cuello / hombro"}</small></th><th>Desde el centro</th><th>Listo</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      <p class="hoja-leyenda">${objeto
        ? "Medidas reales del logo. «Borde superior»: del borde de arriba del logo al borde de arriba de la pieza. Izquierda y derecha según el dibujo."
        : `Medidas reales del logo${base && base.infantil ? " (talla de niño)" : ""}. «Borde superior»: del borde de arriba del logo al cuello, o al hombro en las mangas. Izquierda y derecha según quien lleva puesta la prenda.`}</p>`;
  }

  ADM.hojaProduccionHTML = function (o) {
    const pasos = A.orders.pasosDe(o);
    const grupos = ADM.agruparLineas(o.items);
    const porProducto = [];
    grupos.forEach((g) => {
      let pr = porProducto.find((x) => x.id === g.id);
      if (!pr) { pr = { id: g.id, nombre: g.nombre, img: g.img, grupos: [], qty: 0 }; porProducto.push(pr); }
      pr.grupos.push(g);
      pr.qty += g.qty;
    });

    const bloques = porProducto.map((pr) => {
      const p = A.getProduct(pr.id);
      const spec = (p && p.specs) || {};
      return `<section class="hoja-prod">
        <header>
          <div>
            <h3>${A.escape(pr.nombre)}</h3>
            <p>${[spec["Técnica"], spec["Material"], spec["Área de impresión"]].filter(Boolean).map(A.escape).join(" · ") || "&nbsp;"}</p>
          </div>
          <div class="hoja-total"><strong>${pr.qty}</strong><span>${pr.qty === 1 ? "pieza" : "piezas"}</span></div>
        </header>
        ${pr.grupos.map((g) => {
          const prenda = ADM.prendaTexto(g.diseno, p);
          return `
          <div class="hoja-grupo">
            <div class="hoja-grupo-head">
              <span class="hoja-grupo-var">
                ${g.color ? ADM.colorHTML(g.id, g.color) : '<span class="lin-color">Sin color base</span>'}
                ${prenda ? `<span class="hoja-prenda">${A.escape(prenda)}</span>` : ""}
              </span>
              <span class="tiny muted">${g.qty} ${g.qty === 1 ? "pieza" : "piezas"}</span>
            </div>
            ${g.tallas.some((t) => t.talla)
              ? `<table class="hoja-tallas"><tr>${g.tallas.map((t) => `<th>${A.escape(t.talla || "—")}</th>`).join("")}<th class="tot">Total</th></tr>
                 <tr>${g.tallas.map((t) => `<td>${t.qty}</td>`).join("")}<td class="tot">${g.qty}</td></tr></table>`
              : `<p class="hoja-sin-talla">Cantidad: <strong>${g.qty}</strong> (sin talla)</p>`}
            ${hojaDisenoHTML(g, p)}
            <div class="hoja-checks"><span>☐ Impreso</span><span>☐ Sublimado</span><span>☐ Revisado</span><span>☐ Empacado</span></div>
          </div>`;
        }).join("")}
      </section>`;
    });

    const entrega = o.entrega.modo === "tienda"
      ? `Retira en ${A.escape(o.entrega.tiendaNombre || "el taller")}`
      : `Delivery · ${A.escape(o.entrega.ciudad || "")}${o.courier ? " · " + A.escape(o.courier) : ""}`;

    return `<div class="hoja">
      <div class="hoja-cab">
        <div>
          ${ADM.wordmark("hoja-logo")}
          <p class="tiny muted">Hoja de producción</p>
        </div>
        <div style="text-align:right">
          <div class="mono hoja-codigo">${A.escape(o.codigo)}</div>
          <div class="tiny muted">${A.fmtFechaHora(o.creado)}</div>
        </div>
      </div>
      <dl class="hoja-datos">
        <div><dt>Cliente</dt><dd>${A.escape(o.cliente.nombre)} · ${A.escape(o.cliente.telefono || "")}</dd></div>
        <div><dt>Estado</dt><dd>${o.cancelado ? "CANCELADO" : A.escape(pasos[o.estadoIndex].titulo)}</dd></div>
        <div><dt>Entrega</dt><dd>${entrega}</dd></div>
        <div><dt>Prometido para</dt><dd>${A.fmtFecha(o.eta)}</dd></div>
        <div><dt>Total de piezas</dt><dd>${ADM.piezas(o)}</dd></div>
      </dl>
      ${bloques.join("")}
      ${(o.notas || []).length ? `<section class="hoja-notas"><h4>Notas internas</h4>${o.notas.map((n) => `<p>• ${A.escape(n.texto)}</p>`).join("")}</section>` : ""}
    </div>`;
  };

  /** Abre una o varias hojas de producción en un modal con botón para imprimir. */
  ADM.verHojas = function (pedidos, titulo) {
    const lista = (pedidos || []).filter(Boolean);
    if (!lista.length) return A.toast("No hay pedidos para producir", "alert");
    // Se arma de nuevo para imprimir: cada dibujo del simulador lleva ids propios
    // y no deben repetirse entre el modal y el área de impresión.
    const armar = () => lista.map(ADM.hojaProduccionHTML).join('<div class="hoja-salto"></div>');
    ADM.modal({
      titulo: titulo || "Hoja de producción",
      subtitulo: lista.length === 1 ? lista[0].codigo + " · agrupado por producto, color, diseño y talla" : `${lista.length} pedidos · una hoja por pedido`,
      ancho: "ancho",
      cuerpo: `<div id="hojasProduccion">${armar()}</div>`,
      pie: `<button class="btn btn-ghost" type="button" onclick="ADM.cerrarModal()">Cerrar</button>
            <button class="btn btn-primary" type="button" id="btnImprimirHoja">${A.icon("print")} Imprimir</button>`,
      alAbrir: (bg) => {
        bg.querySelector("#btnImprimirHoja").onclick = () => ADM.imprimir(armar());
      },
    });
  };

  /** Imprime solo el HTML dado (el resto de la página se oculta con @media print).
      Espera (máx. 2 s) a que carguen los logos de los dibujos para que salgan en papel. */
  ADM.imprimir = function (html) {
    let area = document.getElementById("printArea");
    if (!area) {
      area = document.createElement("div");
      area.id = "printArea";
      document.body.appendChild(area);
    }
    area.innerHTML = html;
    document.body.classList.add("imprimiendo");
    const fin = () => {
      document.body.classList.remove("imprimiendo");
      area.innerHTML = "";
      window.removeEventListener("afterprint", fin);
    };
    window.addEventListener("afterprint", fin);
    const remotas = Array.from(area.querySelectorAll("image")).filter((im) => /^https?:/i.test(im.getAttribute("href") || ""));
    const cargas = remotas.map((im) => new Promise((ok) => { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); }));
    const espera = cargas.length ? Promise.race([Promise.all(cargas), new Promise((ok) => setTimeout(ok, 2000))]) : Promise.resolve();
    espera.then(() => setTimeout(() => window.print(), 60));
  };

  /* ==================== Configuración pendiente ==================== */
  ADM.esMarcador = (v) => typeof v === "string" && v.trim().startsWith("[");

  /** Rutas de la configuración que aún tienen valores de ejemplo "[…]". */
  ADM.pendientesConfig = function () {
    const out = [];
    const recorrer = (obj, ruta) => {
      if (obj == null) return;
      if (typeof obj === "string") { if (ADM.esMarcador(obj)) out.push(ruta); return; }
      if (Array.isArray(obj)) { if (ruta === "bancos" || ruta === "courier") return; obj.forEach((x, i) => recorrer(x, ruta + "[" + i + "]")); return; }
      if (typeof obj === "object") Object.keys(obj).forEach((k) => recorrer(obj[k], ruta ? ruta + "." + k : k));
    };
    recorrer(A.config, "");
    return out;
  };

  /* ==================== Marca ==================== */
  ADM.wordmark = function (cls) {
    return `<img class="stp-wordmark ${cls || ""}" src="../assets/img/estampy-logo.png" alt="Estampy" width="560" height="463">`;
  };

  ADM.hace = function (iso) {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.round(ms / 60000);
    if (min < 1) return "hace instantes";
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
    return A.fmtFecha(iso);
  };

  ADM.diaISO = (d) => new Date(d).toISOString().slice(0, 10);

  /** Ventas agrupadas por día en los últimos n días. */
  ADM.ventasPorDia = function (n) {
    const hoy = new Date();
    const dias = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(hoy.getTime() - i * 86400000);
      dias.push({ fecha: ADM.diaISO(d), etiqueta: d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" }), total: 0, pedidos: 0 });
    }
    A.orders.activos().forEach((o) => {
      const k = ADM.diaISO(o.creado);
      const d = dias.find((x) => x.fecha === k);
      if (d) { d.total = A.round2(d.total + o.totales.total); d.pedidos++; }
    });
    return dias;
  };

  /** Unidades y monto vendido por modelo. */
  ADM.ventasPorModelo = function () {
    const mapa = {};
    A.orders.activos().forEach((o) =>
      o.items.forEach((it) => {
        if (!mapa[it.id]) mapa[it.id] = { id: it.id, nombre: it.nombre, unidades: 0, monto: 0 };
        mapa[it.id].unidades += it.qty;
        mapa[it.id].monto = A.round2(mapa[it.id].monto + it.precio * it.qty);
      })
    );
    return Object.values(mapa).sort((a, b) => b.monto - a.monto);
  };

  ADM.ventasPorMetodo = function () {
    const mapa = {};
    A.orders.activos().forEach((o) => {
      const k = o.pago.metodo;
      if (!mapa[k]) mapa[k] = { metodo: k, label: ADM.metodoLabel(k), pedidos: 0, monto: 0 };
      mapa[k].pedidos++;
      mapa[k].monto = A.round2(mapa[k].monto + o.totales.total);
    });
    return Object.values(mapa).sort((a, b) => b.monto - a.monto);
  };

  ADM.clientes = function () {
    const mapa = {};
    A.orders.all().forEach((o) => {
      const k = (o.cliente.email || o.cliente.cedula).toLowerCase();
      if (!mapa[k]) {
        mapa[k] = { clave: k, ...o.cliente, pedidos: 0, gastado: 0, cancelados: 0, ultimo: o.creado, primero: o.creado };
      }
      const c = mapa[k];
      if (o.cancelado) c.cancelados++;
      else { c.pedidos++; c.gastado = A.round2(c.gastado + o.totales.total); }
      if (new Date(o.creado) > new Date(c.ultimo)) c.ultimo = o.creado;
      if (new Date(o.creado) < new Date(c.primero)) c.primero = o.creado;
    });
    return Object.values(mapa).sort((a, b) => b.gastado - a.gastado);
  };

  /* ==================== Gráficos ==================== */
  ADM.graficoBarras = function (datos, formato) {
    const max = Math.max(...datos.map((d) => d.total), 1);
    return `<div class="chart">${datos
      .map(
        (d) => `<div class="chart-col">
          <div class="chart-bar" style="height:${Math.max(3, (d.total / max) * 165)}px">
            <span>${(formato || A.fmtUSD)(d.total)}</span>
          </div>
          <span class="chart-lbl">${d.etiqueta}</span>
        </div>`
      )
      .join("")}</div>`;
  };

  ADM.barrasH = function (filas) {
    const max = Math.max(...filas.map((f) => f.valor), 1);
    return `<div class="barra-h">${filas
      .map(
        (f) => `<div>
          <div class="barra-h-row">
            <span class="barra-h-lbl">${A.escape(f.etiqueta)}</span>
            <span class="barra-h-val">${f.texto}</span>
          </div>
          <div class="barra-h-track"><div class="barra-h-fill ${f.color || ""}" style="width:${(f.valor / max) * 100}%"></div></div>
        </div>`
      )
      .join("")}</div>`;
  };

  ADM.donut = function (partes) {
    const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
    // Paleta de la marca: magenta, cian, amarillo, tinta y dos apoyos
    const colores = ["#E16539", "#51ABB2", "#F0DFC8", "#303030", "#8B7FD1", "#2FAF7A"];
    let acumulado = 0;
    const r = 54, c = 2 * Math.PI * r;
    const arcos = partes
      .map((p, i) => {
        const largo = (p.valor / total) * c;
        const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${colores[i % colores.length]}"
          stroke-width="22" stroke-dasharray="${largo} ${c - largo}"
          stroke-dashoffset="${-acumulado}" transform="rotate(-90 70 70)"/>`;
        acumulado += largo;
        return seg;
      })
      .join("");

    return `<div class="row" style="gap:26px;flex-wrap:wrap;align-items:center">
      <svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0">
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--gray-100)" stroke-width="22"/>
        ${arcos}
      </svg>
      <ul class="donut-leyenda grow">
        ${partes
          .map(
            (p, i) => `<li>
              <span class="donut-punto" style="background:${colores[i % colores.length]}"></span>
              <span class="grow">${A.escape(p.etiqueta)}</span>
              <strong style="color:var(--brand-deep)">${p.texto}</strong>
            </li>`
          )
          .join("")}
      </ul>
    </div>`;
  };

  /* ==================== Exportar CSV ==================== */
  ADM.exportarCSV = function (nombre, columnas, filas) {
    const esc = (v) => {
      const s = String(v == null ? "" : v).replace(/"/g, '""');
      return /[",;\n]/.test(s) ? `"${s}"` : s;
    };
    const csv =
      "﻿" +
      [columnas.map(esc).join(";")]
        .concat(filas.map((f) => f.map(esc).join(";")))
        .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre + "-" + ADM.diaISO(new Date()) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    A.toast("Archivo CSV descargado", "box");
  };

  /* ==================== Tabla vacía ==================== */
  ADM.vacio = function (icono, titulo, texto) {
    return `<div class="tabla-vacia">
      ${A.icon(icono, "", 40)}
      <h4 style="color:var(--brand-deep);margin-bottom:5px">${titulo}</h4>
      <p class="small">${texto}</p>
    </div>`;
  };

  return ADM;
})();
