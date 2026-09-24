/* =========================================================
   STAMPY — Simulador de prendas
   Dibuja franelas, chemises y mangas largas de un solo color
   y coloca el logo del cliente en frente, espalda y mangas.
   Todo en SVG (viewBox 400 × 400): lo usan la ficha de
   producto (editor), las miniaturas del catálogo, el carrito,
   el seguimiento y la hoja de producción del panel.

   Una ubicación del logo se guarda como fracciones del área
   de impresión de esa vista, así no depende del tamaño en
   pantalla:  { zona, x, y, w }  (x, y = centro; w = ancho).
   ========================================================= */
(function () {
  "use strict";

  const A = (window.STAMPY = window.STAMPY || {});

  // Colores de Estampy
  const TINTA = "#303030";
  const NARANJA = "#E16539";
  const TEAL = "#51ABB2";

  // Logo de Estampy (PNG) para las prendas de muestra del catálogo
  const LOGO_MUESTRA = "data:image/png;base64,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";
  const RATIO_MUESTRA = 463 / 560;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const f = (n) => String(Math.round(n * 100) / 100);
  const r1 = (n) => Math.round(n * 10) / 10;
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------------- Vistas: dónde puede ir el logo ---------------- */
  const VISTAS = {
    frente: { label: "Frente", corto: "Frente" },
    espalda: { label: "Espalda", corto: "Espalda" },
    "manga-izq": { label: "Manga izquierda", corto: "Manga izq." },
    "manga-der": { label: "Manga derecha", corto: "Manga der." },
  };
  const ORDEN = ["frente", "espalda", "manga-izq", "manga-der"];
  const esManga = (v) => v === "manga-izq" || v === "manga-der";

  const TIPOS = {
    franela: "Franela (manga corta)",
    chemise: "Chemise (cuello polo)",
    "manga-larga": "Manga larga",
    taza: "Taza",
    gorra: "Gorra trucker",
    mousepad: "Mousepad",
    cojin: "Cojín",
  };
  // Piezas que no son prendas (tienen sus propias zonas: lados, caras, frente)
  const OBJETO = new Set(["taza", "gorra", "mousepad", "cojin"]);
  const esObjeto = (pr) => !!pr && OBJETO.has(pr.tipo);

  /* ---------------- Colores de la prenda ---------------- */
  function rgb(hex) {
    let h = String(hex || "#FFFFFF").replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    if (!/^[0-9a-f]{6}$/i.test(h) || isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mezclar(hex, otro, t) {
    const a = rgb(hex), b = rgb(otro);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  function tonos(hex) {
    const [r, g, b] = rgb(hex);
    const oscura = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.4;
    const hacia = oscura ? "#FFFFFF" : TINTA;
    return {
      tela: hex,
      borde: mezclar(hex, hacia, oscura ? 0.3 : 0.26),
      sombra: mezclar(hex, TINTA, oscura ? 0.35 : 0.1),
      rib: mezclar(hex, TINTA, oscura ? 0.18 : 0.05),
      costura: mezclar(hex, hacia, oscura ? 0.28 : 0.2),
      oscura,
    };
  }

  /* ---------------- Siluetas ----------------
     Prenda extendida vista desde arriba (flat lay), viewBox 400 × 400.
     Escala del cuerpo: 4 unidades ≈ 1 cm (pecho de 50 cm = 200 u). */
  const CUELLO = {
    redondoF: "M162 58 C170 94 230 94 238 58",
    redondoE: "M162 58 C176 70 224 70 238 58",
    vF: "M162 58 C178 76 192 92 200 104 C208 92 222 76 238 58",
    poloF: "M162 58 L200 82 L238 58",
    poloE: "M162 58 C176 66 224 66 238 58",
  };
  const HOMBRO = " C258 62 278 67 296 74";
  const CUERPO = {
    corta: HOMBRO + " C318 90 342 118 360 148 C346 162 324 178 306 190 C304 178 302 168 300 158 C303 228 302 296 299 350 C238 357 162 357 101 350 C98 296 97 228 100 158 C98 168 96 178 94 190 C76 178 54 162 40 148 C58 118 82 90 104 74 C122 67 142 62 162 58 Z",
    larga: HOMBRO + " C322 110 346 210 364 300 C352 306 338 310 324 312 C318 260 306 196 300 158 C303 228 302 296 299 350 C238 357 162 357 101 350 C98 296 97 228 100 158 C94 196 82 260 76 312 C62 310 48 306 36 300 C54 210 78 110 104 74 C122 67 142 62 162 58 Z",
    polo: HOMBRO + " C318 90 342 118 360 148 C346 162 324 178 306 190 C304 178 302 168 300 158 C303 230 302 300 299 356 C238 361 162 361 101 356 C98 300 97 230 100 158 C98 168 96 178 94 190 C76 178 54 162 40 148 C58 118 82 90 104 74 C122 67 142 62 162 58 Z",
  };
  const MANGA = {
    corta: "M78 96 C118 30 282 30 322 96 C312 170 300 240 292 300 C230 310 170 310 108 300 C100 240 88 170 78 96 Z",
    larga: "M138 68 C160 26 240 26 262 68 C252 170 240 280 230 372 C210 378 190 378 170 372 C160 280 148 170 138 68 Z",
  };

  /** Contorno de la prenda en una vista. */
  function silueta(pr, vista) {
    if (esManga(vista)) return pr.tipo === "manga-larga" ? MANGA.larga : MANGA.corta;
    const frente = vista === "frente";
    const cuello = pr.tipo === "chemise" ? (frente ? CUELLO.poloF : CUELLO.poloE)
      : frente ? (pr.cuello === "v" ? CUELLO.vF : CUELLO.redondoF) : CUELLO.redondoE;
    return cuello + (pr.tipo === "chemise" ? CUERPO.polo : pr.tipo === "manga-larga" ? CUERPO.larga : CUERPO.corta);
  }

  /* Áreas de impresión por vista, en unidades del SVG, con su medida real.
     refY = línea desde la que se mide la distancia (cuello u hombro). */
  const AREAS = {
    franela: {
      frente: { x: 140, y: 100, w: 120, h: 160, cmW: 30, cmH: 40, refY: 85, ref: "del cuello" },
      espalda: { x: 140, y: 88, w: 120, h: 160, cmW: 30, cmH: 40, refY: 67, ref: "del cuello" },
      manga: { x: 155, y: 100, w: 90, h: 90, cmW: 9, cmH: 9, refY: 46.5, ref: "del hombro" },
    },
    chemise: {
      frente: { x: 140, y: 96, w: 120, h: 150, cmW: 30, cmH: 37.5, refY: 82, ref: "del cuello" },
      espalda: { x: 140, y: 86, w: 120, h: 160, cmW: 30, cmH: 40, refY: 64, ref: "del cuello" },
      manga: { x: 155, y: 100, w: 90, h: 90, cmW: 9, cmH: 9, refY: 46.5, ref: "del hombro" },
    },
    "manga-larga": {
      frente: { x: 140, y: 100, w: 120, h: 160, cmW: 30, cmH: 40, refY: 85, ref: "del cuello" },
      espalda: { x: 140, y: 88, w: 120, h: 160, cmW: 30, cmH: 40, refY: 67, ref: "del cuello" },
      manga: { x: 178.5, y: 80, w: 43, h: 160, cmW: 8, cmH: 30, refY: 36.5, ref: "del hombro" },
    },
  };
  const FRENTE_V = { x: 140, y: 116, w: 120, h: 146, cmW: 30, cmH: 36.5, refY: 104, ref: "del cuello" };

  /* Posiciones rápidas (fracciones del área). La primera es la de arranque. */
  const PRESETS = {
    frente: [
      { id: "centro", label: "Centro del pecho", x: 0.5, y: 0.3, w: 0.6 },
      { id: "pecho-izq", label: "Pecho izquierdo", pista: "lado del corazón", x: 0.76, y: 0.14, w: 0.3 },
      { id: "pecho-der", label: "Pecho derecho", x: 0.24, y: 0.14, w: 0.3 },
      { id: "completo", label: "Frente completo", x: 0.5, y: 0.5, w: 1 },
    ],
    frenteChemise: [
      { id: "pecho-izq", label: "Pecho izquierdo", pista: "lado del corazón", x: 0.8, y: 0.17, w: 0.28 },
      { id: "pecho-der", label: "Pecho derecho", x: 0.2, y: 0.17, w: 0.28 },
      { id: "bajo-tapeta", label: "Centro, bajo la tapeta", x: 0.5, y: 0.72, w: 0.55 },
    ],
    espalda: [
      { id: "centro", label: "Centro de la espalda", x: 0.5, y: 0.34, w: 0.8 },
      { id: "nuca", label: "Nuca", x: 0.5, y: 0.07, w: 0.28 },
      { id: "completo", label: "Espalda completa", x: 0.5, y: 0.5, w: 1 },
    ],
    manga: [{ id: "centro", label: "Centro de la manga", x: 0.5, y: 0.45, w: 0.8 }],
    mangaLarga: [
      { id: "hombro", label: "Cerca del hombro", x: 0.5, y: 0.14, w: 0.95 },
      { id: "antebrazo", label: "Antebrazo", x: 0.5, y: 0.8, w: 0.95 },
    ],
  };

  /* ---------------- Producto → prenda ---------------- */

  /** { tipo, cuello, infantil, color } de un producto, o null si no es prenda. */
  function prendaDe(x) {
    if (!x) return null;
    const src = x.prenda && typeof x.prenda === "object" ? x.prenda : x.tipo ? x : null;
    if (!src || !TIPOS[src.tipo]) return null;
    const color = src.color || (Array.isArray(x.colores) && x.colores[0] && x.colores[0].hex) || "#FFFFFF";
    const objeto = OBJETO.has(src.tipo);
    return {
      tipo: src.tipo,
      cuello: objeto ? null : src.tipo === "chemise" ? "polo" : src.cuello === "v" ? "v" : "redondo",
      infantil: !objeto && !!src.infantil,
      color,
    };
  }

  /** Copia mínima de la prenda para guardar con el pedido (por si el producto cambia). */
  function instantanea(p) {
    const pr = prendaDe(p);
    return pr ? { tipo: pr.tipo, cuello: pr.cuello, infantil: pr.infantil, color: pr.color } : null;
  }

  /** Vistas habilitadas del producto, en orden. */
  function vistasDe(p) {
    const pr = prendaDe(p);
    if (!pr) return [];
    const todas = zonasDe(pr.tipo);
    const u = Array.isArray(p.ubicaciones) && p.ubicaciones.length ? p.ubicaciones : todas;
    const ok = todas.filter((v) => u.includes(v));
    return ok.length ? ok : todas;
  }

  /** Zonas posibles para un tipo de pieza. */
  function zonasDe(tipo) {
    return OBJETO.has(tipo) ? Object.keys(OBJETOS[tipo].zonas) : ORDEN.slice();
  }

  /** Nombre de una zona para mostrar: "Frente", "Manga izq.", "Lado 2"… */
  function etiqueta(x, zona, corto) {
    const pr = typeof x === "string" ? { tipo: x } : prendaDe(x) || x || {};
    const z = OBJETO.has(pr.tipo) ? OBJETOS[pr.tipo].zonas[zona] : VISTAS[zona];
    if (!z) return zona;
    return corto ? z.corto : z.label;
  }

  function areaDe(pr, vista) {
    if (esObjeto(pr)) {
      const zs = OBJETOS[pr.tipo].zonas;
      return zs[vista] || zs[Object.keys(zs)[0]];
    }
    const t = AREAS[pr.tipo] || AREAS.franela;
    if (esManga(vista)) return t.manga;
    if (vista === "frente" && pr.tipo !== "chemise" && pr.cuello === "v") return FRENTE_V;
    return t[vista] || t.frente;
  }

  function presetsDe(pr, vista) {
    if (esObjeto(pr)) return OBJETOS[pr.tipo].presets;
    if (esManga(vista)) return pr.tipo === "manga-larga" ? PRESETS.mangaLarga : PRESETS.manga;
    if (vista === "frente" && pr.tipo === "chemise") return PRESETS.frenteChemise;
    return PRESETS[vista] || PRESETS.frente;
  }

  /* ---------------- Geometría del logo ---------------- */

  /** Ajusta una ubicación para que el logo quede dentro del área. */
  function ajustar(pr, vista, u, ratio) {
    const a = areaDe(pr, vista);
    const rt = ratio > 0 ? ratio : 1;
    const wMax = Math.min(1, a.h / (a.w * rt));
    const w = clamp(Number(u.w) || 0.5, Math.min(0.08, wMax), wMax);
    const lw = w * a.w, lh = lw * rt;
    const mx = lw / 2 / a.w, my = lh / 2 / a.h;
    return {
      ...u,
      w: r3(w),
      x: r3(clamp(Number(u.x), mx, 1 - mx)),
      y: r3(clamp(Number(u.y), my, 1 - my)),
    };
  }

  /** Posición del logo en unidades del SVG: { cx, cy, lw, lh } */
  function geometria(pr, vista, u, ratio) {
    const a = areaDe(pr, vista);
    const lw = u.w * a.w;
    const lh = lw * (ratio > 0 ? ratio : 1);
    return { cx: a.x + u.x * a.w, cy: a.y + u.y * a.h, lw, lh };
  }

  /** Medidas reales: { anchoCm, altoCm, desdeCm, ref } */
  function medidas(prendaOProducto, vista, u, ratio) {
    const pr = prendaDe(prendaOProducto) || prendaDe({ prenda: { tipo: "franela" } });
    const a = areaDe(pr, vista);
    const k = pr.infantil ? 0.75 : 1;
    const porCm = a.w / a.cmW;
    const g = geometria(pr, vista, u, ratio);
    return {
      anchoCm: r1((g.lw / porCm) * k),
      altoCm: r1((g.lh / porCm) * k),
      desdeCm: r1(Math.max(0, (g.cy - g.lh / 2 - a.refY) / porCm) * k),
      ref: a.ref,
    };
  }

  /** Medida del área de impresión de una vista, en cm (según talla adulto/niño). */
  function areaCm(prendaOProducto, vista) {
    const pr = prendaDe(prendaOProducto);
    if (!pr) return null;
    const a = areaDe(pr, vista);
    const k = pr.infantil ? 0.75 : 1;
    return { ancho: r1(a.cmW * k), alto: r1(a.cmH * k) };
  }

  /** Registro completo de una ubicación, listo para guardar en el carrito o el pedido. */
  function registro(prendaOProducto, zona, u, ratio) {
    const pr = prendaDe(prendaOProducto);
    const rt = ratio > 0 ? ratio : 1;
    const ok = ajustar(pr, zona, u, rt);
    const m = medidas(pr, zona, ok, rt);
    return {
      zona,
      ref: u.ref || "",
      x: ok.x,
      y: ok.y,
      w: ok.w,
      ratio: r3(rt),
      anchoCm: m.anchoCm,
      altoCm: m.altoCm,
      desdeCm: m.desdeCm,
    };
  }

  const cm = (n) => Number(n || 0).toLocaleString("es-VE", { maximumFractionDigits: 1 });

  /** "Frente · Pecho izquierdo · 9 × 9 cm · a 4 cm del cuello" */
  function describir(ubic, tipo) {
    if (!ubic) return "";
    const objeto = OBJETO.has(tipo);
    const ref = objeto ? "del borde" : esManga(ubic.zona) ? "del hombro" : "del cuello";
    const partes = [objeto ? etiqueta(tipo, ubic.zona) : (VISTAS[ubic.zona] || { label: ubic.zona }).label];
    if (ubic.ref) partes.push(ubic.ref);
    if (ubic.anchoCm) partes.push(`${cm(ubic.anchoCm)} × ${cm(ubic.altoCm)} cm`);
    if (ubic.desdeCm != null && ubic.anchoCm) partes.push(`a ${cm(ubic.desdeCm)} cm ${ref}`);
    return partes.join(" · ");
  }

  /* ---------------- Dibujo con acabado de foto ----------------
     Capas, de abajo hacia arriba:
       fondo de estudio · sombra sobre la mesa · tela
       · logo impreso (se multiplica con la tela y sigue sus ondas)
       · costuras, cuello y tapeta
       · luz: arrugas, volumen de los bordes y grano del tejido.
     La luz va encima del logo para que las arrugas también lo afecten. */
  let uid = 0;
  const SOMBRA = "#2B2520";
  // Convierte una imagen en escala de grises en sombra: color SOMBRA, opacidad = 1 − brillo
  const SOMBRA_MATRIZ = "0 0 0 0 0.169  0 0 0 0 0.145  0 0 0 0 0.125  -1 0 0 0 1";

  function esBlanca(hex) {
    const [r, g, b] = rgb(hex);
    return (r + g + b) / 3 > 236;
  }

  function defs(id, vista, c, forma) {
    const semilla = { frente: 11, espalda: 23, "manga-izq": 5, "manga-der": 8 }[vista] || 3;
    const manga = esManga(vista);
    const blur = (n, s) => `<filter id="${id}-${n}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
    const gris = (m, b) => `<feFuncR type="linear" slope="${m}" intercept="${b}"/><feFuncG type="linear" slope="${m}" intercept="${b}"/><feFuncB type="linear" slope="${m}" intercept="${b}"/>`;
    return `<defs>
      <clipPath id="${id}-clip"><path d="${forma}"/></clipPath>
      <radialGradient id="${id}-fondo" cx="50%" cy="38%" r="78%"><stop offset="0" stop-color="#FDFBF7"/><stop offset="1" stop-color="#E9E1D5"/></radialGradient>
      <linearGradient id="${id}-hueco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sombra}"/><stop offset="1" stop-color="${c.rib}"/></linearGradient>
      <radialGradient id="${id}-brillo" cx="36%" cy="30%" r="70%">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".16"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity=".04"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id}-cil" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="${SOMBRA}" stop-opacity=".22"/><stop offset=".24" stop-color="${SOMBRA}" stop-opacity=".03"/>
        <stop offset=".58" stop-color="${SOMBRA}" stop-opacity="0"/><stop offset="1" stop-color="${SOMBRA}" stop-opacity=".24"/>
      </linearGradient>
      ${blur("b2", 1.6)}${blur("b5", 5)}${blur("b9", 9)}
      <filter id="${id}-tela" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="${manga ? "0.008 0.014" : "0.0055 0.011"}" numOctaves="2" seed="${semilla}" result="ruido"/>
        <feGaussianBlur in="ruido" stdDeviation="4" result="suave"/>
        <feDiffuseLighting in="suave" surfaceScale="4.5" diffuseConstant="1.18" lighting-color="#ffffff">
          <feDistantLight azimuth="235" elevation="58"/>
        </feDiffuseLighting>
        <feColorMatrix type="matrix" values="${SOMBRA_MATRIZ}"/>
      </filter>
      <filter id="${id}-grano" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${semilla + 4}"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>${gris(0.35, 0.72)}<feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>
        <feColorMatrix type="matrix" values="${SOMBRA_MATRIZ}"/>
      </filter>
      <filter id="${id}-imp" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.034" numOctaves="2" seed="${semilla}" result="ruido"/>
        <feDisplacementMap in="SourceGraphic" in2="ruido" scale="4" xChannelSelector="R" yChannelSelector="G" result="doblado"/>
        <feGaussianBlur in="doblado" stdDeviation=".22"/>
      </filter>
    </defs>`;
  }

  /** Capas de la prenda: { base, encima, luz, contorno } */
  function capasPrenda(pr, vista, c, id, forma) {
    const manga = esManga(vista);
    const largo = pr.tipo === "manga-larga";
    const polo = pr.tipo === "chemise";
    const frente = vista === "frente";
    const linea = c.oscura ? "#FFFFFF" : SOMBRA;
    const hilo = `fill="none" stroke="${linea}" stroke-opacity="${c.oscura ? ".22" : ".24"}" stroke-width=".8" stroke-dasharray="2.2 1.8" stroke-linecap="round"`;
    const costura = `fill="none" stroke="${linea}" stroke-opacity="${c.oscura ? ".12" : ".1"}" stroke-width="1.1"`;
    // Tejido de punto (rib): banda de color con rayitas perpendiculares
    const rib = (d, ancho) =>
      `<path d="${d}" fill="none" stroke="${c.rib}" stroke-width="${ancho}" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${SOMBRA}" stroke-opacity=".08" stroke-width="${ancho}" stroke-dasharray=".7 1.5" stroke-linejoin="round"/>`;
    const solapas = "M160 56 C172 66 188 76 199 82 L185 112 C172 104 158 92 148 78 C150 68 154 60 160 56 Z M240 56 C228 66 212 76 201 82 L215 112 C228 104 242 92 252 78 C250 68 246 60 240 56 Z";

    const base = [
      `<path d="${forma}" transform="translate(0 9)" fill="${SOMBRA}" opacity=".26" filter="url(#${id}-b9)"/>`,
      `<path d="${forma}" transform="translate(0 2)" fill="${SOMBRA}" opacity=".12" filter="url(#${id}-b2)"/>`,
      `<path d="${forma}" fill="${c.tela}"/>`,
    ];
    const encima = [];

    if (manga) {
      if (largo) {
        encima.push(`<path d="M170 372 C190 378 210 378 230 372 L232 354 C212 358 188 358 168 354 Z" fill="${c.rib}"/>`);
        encima.push(`<path d="M169 363 C190 368 210 368 231 363" fill="none" stroke="${SOMBRA}" stroke-opacity=".08" stroke-width="15" stroke-dasharray=".7 1.5"/>`);
        encima.push(`<path d="M146 70 C166 34 234 34 254 70" ${hilo}/>`);
      } else {
        if (polo) {
          encima.push(`<path d="M108 300 C170 310 230 310 292 300 L294 282 C230 292 170 292 106 282 Z" fill="${c.rib}"/>`);
          encima.push(`<path d="M107 291 C170 301 230 301 293 291" fill="none" stroke="${SOMBRA}" stroke-opacity=".08" stroke-width="15" stroke-dasharray=".7 1.5"/>`);
        } else {
          encima.push(`<path d="M110 288 C170 297 230 297 290 288 M111 283 C170 292 230 292 289 283" ${hilo}/>`);
        }
        encima.push(`<path d="M86 97 C124 38 276 38 314 97" ${hilo}/>`);
      }
    } else {
      // Costuras de las sisas
      encima.push(`<path d="M296 74 C286 100 290 132 300 158 M104 74 C114 100 110 132 100 158" ${costura}/>`);
      // Mangas: ruedo o puño
      if (largo) {
        encima.push(`<path d="M364 300 C352 306 338 310 324 312 L322 296 C335 294 348 290 360 284 Z M36 300 C48 306 62 310 76 312 L78 296 C65 294 52 290 40 284 Z" fill="${c.rib}"/>`);
        encima.push(`<path d="M362 292 C349 298 336 302 323 304 M38 292 C51 298 64 302 77 304" fill="none" stroke="${SOMBRA}" stroke-opacity=".08" stroke-width="13" stroke-dasharray=".7 1.5"/>`);
      } else if (polo) {
        encima.push(`<path d="M360 148 C346 162 324 178 306 190 L301 182 C318 171 339 157 353 142 Z M40 148 C54 162 76 178 94 190 L99 182 C82 171 61 157 47 142 Z" fill="${c.rib}"/>`);
      } else {
        encima.push(`<path d="M352 141 C338 155 318 171 302 182 M349 136 C335 150 315 166 301 176 M48 141 C62 155 82 171 98 182 M51 136 C65 150 85 166 99 176" ${hilo}/>`);
      }
      // Ruedo
      encima.push(polo
        ? `<path d="M103 348 C162 353 238 353 297 348 M103 343 C162 348 238 348 297 343" ${hilo}/><path d="M299 356 L298 340 M101 356 L102 340" stroke="${SOMBRA}" stroke-opacity=".3" stroke-width="1"/>`
        : `<path d="M103 342 C162 349 238 349 297 342 M103 337 C162 344 238 344 297 337" ${hilo}/>`);

      // Cuello
      if (polo && frente) {
        encima.push(`<path d="M162 58 L200 82 L238 58 C226 50 174 50 162 58 Z" fill="url(#${id}-hueco)"/>`);
        encima.push(rib("M162 58 C176 50 224 50 238 58", 7));
        encima.push(`<path d="M191 80 L209 80 L209 151 Q209 155 205 155 L195 155 Q191 155 191 151 Z" fill="${c.tela}" stroke="${linea}" stroke-opacity=".3" stroke-width=".9"/>`);
        encima.push(`<path d="M193.5 84 L193.5 151 M206.5 84 L206.5 151" ${hilo}/>`);
        [98, 118, 138].forEach((y) => encima.push(
          `<circle cx="200" cy="${y}" r="3.7" fill="${mezclar(c.tela, "#D8D0C4", 0.55)}" stroke="${SOMBRA}" stroke-opacity=".28" stroke-width=".7"/>` +
          `<circle cx="198.8" cy="${y - 0.4}" r=".75" fill="${SOMBRA}" fill-opacity=".45"/><circle cx="201.2" cy="${y + 0.4}" r=".75" fill="${SOMBRA}" fill-opacity=".45"/>`));
        encima.push(`<path d="${solapas}" transform="translate(1.5 3)" fill="${SOMBRA}" opacity=".2" filter="url(#${id}-b2)"/>`);
        encima.push(`<path d="${solapas}" fill="${c.tela}" stroke="${linea}" stroke-opacity=".32" stroke-width=".9"/>`);
        encima.push(`<path d="M185 112 C172 104 158 92 148 78 M215 112 C228 104 242 92 252 78" fill="none" stroke="${SOMBRA}" stroke-opacity=".08" stroke-width="5" stroke-dasharray=".7 1.5"/>`);
      } else if (polo) {
        encima.push(`<path d="M160 56 C176 46 224 46 240 56 L238 65 C222 57 178 57 162 65 Z" fill="${c.rib}" stroke="${SOMBRA}" stroke-opacity=".15" stroke-width=".8"/>`);
        encima.push(`<path d="M161 60 C177 51 223 51 239 60" fill="none" stroke="${SOMBRA}" stroke-opacity=".08" stroke-width="8" stroke-dasharray=".7 1.5"/>`);
        encima.push(`<path d="M162 67 C178 59 222 59 238 67" fill="none" stroke="${SOMBRA}" stroke-opacity=".14" stroke-width="3" filter="url(#${id}-b2)"/>`);
      } else if (frente) {
        const v = pr.cuello === "v";
        const abre = v ? CUELLO.vF : CUELLO.redondoF;
        const bajo = v ? "M163 63 C179 81 193 97 200 110 C207 97 221 81 237 63" : "M163 63 C171 101 229 101 237 63";
        encima.push(`<path d="${abre} C226 50 174 50 162 58 Z" fill="url(#${id}-hueco)"/>`);
        encima.push(rib("M164 57 C178 50 222 50 236 57", 5));
        encima.push(`<rect x="193" y="52.5" width="14" height="7" rx="1" fill="#FFFFFF" stroke="${SOMBRA}" stroke-opacity=".18" stroke-width=".6"/>`);
        encima.push(`<path d="${bajo}" fill="none" stroke="${SOMBRA}" stroke-opacity=".13" stroke-width="4" filter="url(#${id}-b2)"/>`);
        encima.push(rib(abre, 9));
        encima.push(`<path d="${bajo}" ${hilo}/>`);
      } else {
        encima.push(rib(CUELLO.redondoE, 8));
        encima.push(`<path d="M163 64 C177 77 223 77 237 64" fill="none" stroke="${SOMBRA}" stroke-opacity=".1" stroke-width="3" filter="url(#${id}-b2)"/>`);
        encima.push(`<path d="M163 64 C177 77 223 77 237 64" ${hilo}/>`);
      }
    }

    // Luz: arrugas (relieve iluminado), volumen de bordes, pliegues y grano.
    // Cada capa lleva su propio recorte para que el modo "multiplicar" se mezcle con la tela.
    const clip = `clip-path="url(#${id}-clip)"`;
    const luz = [
      `<rect width="400" height="400" ${clip} filter="url(#${id}-tela)" opacity=".75"/>`,
      `<path d="${forma}" ${clip} fill="none" stroke="${SOMBRA}" stroke-opacity=".2" stroke-width="22" filter="url(#${id}-b9)"/>`,
    ];
    if (manga) {
      luz.push(`<path d="${forma}" fill="url(#${id}-cil)"/>`);
    } else {
      const brazos = largo
        ? "M72 150 C68 200 62 250 58 292 M328 150 C332 200 338 250 342 292"
        : "M70 118 C80 136 88 152 94 170 M330 118 C320 136 312 152 306 170";
      luz.push(`<path ${clip} d="M110 172 C126 190 132 212 136 236 M290 172 C274 190 268 212 264 236 M118 262 C124 290 122 318 116 340 M282 262 C276 290 278 318 284 340 M160 320 C185 313 215 313 240 320 ${brazos}" fill="none" stroke="${SOMBRA}" stroke-opacity=".075" stroke-width="9" stroke-linecap="round" filter="url(#${id}-b5)"/>`);
      if (!esBlanca(c.tela)) {
        luz.push(`<path ${clip} d="M121 170 C137 190 143 212 147 236 M279 170 C263 190 257 212 253 236" fill="none" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="7" stroke-linecap="round" filter="url(#${id}-b5)"/>`);
      }
    }
    luz.push(`<rect width="400" height="400" ${clip} filter="url(#${id}-grano)" opacity=".25"/>`);
    if (c.oscura) {
      // En telas oscuras la luz se nota más en los brillos que en las sombras
      luz.push(`<path d="${forma}" ${clip} fill="url(#${id}-brillo)"/>`);
    }

    // Rótulo de orientación en las mangas (fuera de la prenda)
    if (manga) {
      const der = vista === "manga-der";
      encima.push(`<text x="${der ? 40 : 360}" y="390" text-anchor="${der ? "start" : "end"}" font-family="Poppins, Arial, sans-serif" font-size="10.5" font-weight="600" fill="${SOMBRA}" fill-opacity=".42">${der ? "◂ frente" : "frente ▸"}</text>`);
    }

    return {
      base: base.join(""),
      encima: encima.join(""),
      luz: `<g pointer-events="none">${luz.join("")}</g>`,
      contorno: `<path d="${forma}" fill="none" stroke="${SOMBRA}" stroke-opacity=".16" stroke-width=".9" pointer-events="none"/>`,
    };
  }

  /** Contenido del logo, centrado en (0,0). Se "imprime": se multiplica con la tela y sigue sus ondas. */
  function logoInner(lw, lh, logo, seleccion, id, sinMezcla, filtro) {
    const x = -lw / 2, y = -lh / 2;
    // Sobre tela blanca el logo se "multiplica" (el blanco del archivo desaparece, como al sublimar)
    const s = [`<g class="mk-print" filter="url(#${filtro || id + "-imp"})"${sinMezcla ? "" : ` style="mix-blend-mode:multiply"`}>`];
    if (logo && logo.src && logo.tipo !== "pdf") {
      s.push(`<image href="${esc(logo.src)}" x="${f(x)}" y="${f(y)}" width="${f(lw)}" height="${f(lh)}" preserveAspectRatio="xMidYMid meet"/>`);
    } else if (logo && logo.muestra) {
      s.push(`<image href="${LOGO_MUESTRA}" x="${f(x)}" y="${f(y)}" width="${f(lw)}" height="${f(lh)}" preserveAspectRatio="xMidYMid meet"/>`);
    } else {
      // "TU / LOGO" en dos líneas (o "PDF" si el archivo es un PDF que no se puede dibujar)
      const lineas = logo && logo.tipo === "pdf" ? ["PDF"] : ["TU", "LOGO"];
      const largo = Math.max(...lineas.map((l) => l.length));
      const fs = Math.max(4, Math.min((lw * 0.8) / (largo * 0.95), (lh * 0.7) / (lineas.length * 1.15)));
      s.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(lw)}" height="${f(lh)}" rx="${f(Math.min(lw, lh) * 0.1)}" fill="${NARANJA}" fill-opacity=".1" stroke="${NARANJA}" stroke-width="1.4" stroke-dasharray="5 4"/>`);
      lineas.forEach((l, i) => {
        const dy = (i - (lineas.length - 1) / 2) * fs * 1.12 + fs * 0.36;
        s.push(`<text y="${f(dy)}" text-anchor="middle" font-family="Righteous, Poppins, Arial, sans-serif" font-size="${f(fs)}" fill="${NARANJA}">${l}</text>`);
      });
    }
    s.push("</g>");
    if (seleccion) {
      const p = 4;
      s.push(`<rect class="mk-sel" x="${f(x - p)}" y="${f(y - p)}" width="${f(lw + 2 * p)}" height="${f(lh + 2 * p)}" rx="4" fill="none" stroke="${NARANJA}" stroke-width="1.5" stroke-dasharray="4 3"/>`);
    }
    return s.join("");
  }

  /**
   * SVG de una vista de la prenda.
   * opts: { u, logo, area, fondo, editable, titulo, clase }
   *   u     ubicación { x, y, w } del logo en esa vista (o null)
   *   logo  { src, ratio, tipo: "img"|"pdf" } | { muestra: true } | null (= "TU LOGO")
   */
  function svg(x, vista, opts) {
    opts = opts || {};
    const pr = prendaDe(x) || prendaDe({ prenda: { tipo: "franela" } });
    if (esObjeto(pr)) return objetoSVG(pr, vista, opts);
    const c = tonos(pr.color);
    const blanca = esBlanca(pr.color);
    const id = "mk" + ++uid;
    const a = areaDe(pr, vista);
    const forma = silueta(pr, vista);
    const capas = capasPrenda(pr, vista, c, id, forma);
    const s = [];
    s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" data-mk="${id}" data-imp="${id}-imp" data-oscura="${blanca ? 0 : 1}"${opts.clase ? ` class="${esc(opts.clase)}"` : ""}${opts.editable ? "" : ` role="img"`} aria-label="${esc(opts.titulo || (VISTAS[vista] || {}).label || "Prenda")}">`);
    s.push(defs(id, vista, c, forma));
    if (opts.fondo) s.push(`<rect width="400" height="400" fill="${typeof opts.fondo === "string" ? opts.fondo : `url(#${id}-fondo)`}"/>`);
    s.push(capas.base);
    if (opts.u) {
      const ratio = (opts.logo && opts.logo.ratio) || 1;
      const u = ajustar(pr, vista, opts.u, ratio);
      const g = geometria(pr, vista, u, ratio);
      const attrs = opts.editable
        ? ` class="mk-logo" tabindex="0" role="button" aria-label="Logo en ${esc((VISTAS[vista] || {}).label || vista)}. Arrastra o usa las flechas para moverlo; + y − cambian el tamaño."`
        : "";
      s.push(`<g class="mk-zona"><g${attrs} transform="translate(${f(g.cx)} ${f(g.cy)})">${logoInner(g.lw, g.lh, opts.logo, opts.editable, id, !blanca)}</g></g>`);
    }
    s.push(capas.encima);
    s.push(capas.luz);
    s.push(capas.contorno);
    if (opts.area) {
      s.push(`<rect class="mk-area" x="${f(a.x)}" y="${f(a.y)}" width="${f(a.w)}" height="${f(a.h)}" rx="4" fill="${TEAL}" fill-opacity=".05" stroke="${TEAL}" stroke-width="1.3" stroke-dasharray="6 4" pointer-events="none"/>`);
    }
    s.push("</svg>");
    return s.join("");
  }

  const cacheURL = new Map();
  /** Imagen (data URL) de una vista con un logo de muestra: para <img> de catálogo y carrito. */
  function dataURL(x, vista, opts) {
    opts = opts || {};
    const pr = prendaDe(x) || prendaDe({ prenda: { tipo: "franela" } });
    const key = JSON.stringify([pr, vista, opts.sinLogo ? 0 : 1]);
    if (cacheURL.has(key)) return cacheURL.get(key);
    const pres = presetsDe(pr, vista);
    const base = vista === "frente" ? pres[0] : vista === "espalda" ? { x: 0.5, y: 0.36, w: 0.72 } : pres[0];
    const u = opts.sinLogo ? null : { x: base.x, y: base.y, w: vista === "frente" && pr.tipo !== "chemise" ? 0.5 : base.w };
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(pr, vista, { u, logo: { muestra: true, ratio: RATIO_MUESTRA }, fondo: true }));
    cacheURL.set(key, url);
    return url;
  }

  /* ---------------- Objetos: taza, gorra, mousepad y cojín ----------------
     Mismo acabado de foto que las prendas. Cada objeto tiene zonas donde el
     cliente coloca su logo (con el mismo editor) y, en el catálogo, se muestra
     con el logo de Estampy: "objeto:<tipo>:1" (completo) y ":2" (detalle). */
  const PRESETS_OBJETO = (todo) => [
    { id: "centro", label: "Centrado", x: 0.5, y: 0.5, w: 0.62 },
    { id: "completo", label: todo, x: 0.5, y: 0.5, w: 1 },
  ];
  const TAZA_CUERPO = "M110 112 L110 318 C110 331 290 331 290 318 L290 112 Z";
  const MOUSEPAD = "M78 108 Q78 96 90 95 L312 88 Q324 88 325 100 L330 292 Q330 304 318 305 L96 312 Q84 312 83 300 Z";
  const COJIN = "M88 92 C150 78 250 78 312 92 C328 152 328 248 312 308 C250 322 150 322 88 308 C72 248 72 152 88 92 Z";

  const OBJETOS = {
    taza: {
      detalle: "112 128 176 176",
      zonas: {
        frente: { label: "Lado 1", corto: "Lado 1", x: 132, y: 158, w: 136, h: 121, cmW: 9, cmH: 8, refY: 112, ref: "del borde" },
        espalda: { label: "Lado 2 (detrás del asa)", corto: "Lado 2", x: 132, y: 158, w: 136, h: 121, cmW: 9, cmH: 8, refY: 112, ref: "del borde" },
      },
      presets: PRESETS_OBJETO("Todo el lado"),
      capas(id, zona, color) {
        const interior = color && !esBlanca(color) ? color : null;
        const asa = "M290 150 C346 148 354 178 354 206 C354 242 332 266 290 266 L290 238 C314 238 324 226 324 208 C324 190 318 178 290 178 Z";
        const espejo = (s) => (zona === "espalda" ? `<g transform="matrix(-1 0 0 1 400 0)">${s}</g>` : s);
        return {
          antes: espejo([
            `<ellipse cx="206" cy="332" rx="118" ry="16" fill="${SOMBRA}" opacity=".3" filter="url(#${id}-b9)"/>`,
            `<path d="${asa}" fill="#FFFFFF"/><path d="${asa}" fill="url(#${id}-asa)"/>`,
            `<path d="${TAZA_CUERPO}" fill="#FFFFFF"/>`,
          ].join("")),
          despues: espejo([
            `<path d="${TAZA_CUERPO}" fill="url(#${id}-cil)"/>`,
            `<path d="M140 118 L140 316" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="9" filter="url(#${id}-b5)"/>`,
            `<ellipse cx="200" cy="112" rx="90" ry="16" fill="#FFFFFF"/>`,
            interior
              ? `<ellipse cx="200" cy="114" rx="84" ry="12.5" fill="${interior}"/><ellipse cx="200" cy="114" rx="84" ry="12.5" fill="url(#${id}-hondo)"/>`
              : `<ellipse cx="200" cy="114" rx="84" ry="12.5" fill="url(#${id}-interior)"/>`,
            `<ellipse cx="200" cy="112" rx="90" ry="16" fill="none" stroke="${SOMBRA}" stroke-opacity=".14" stroke-width="1"/>`,
            `<path d="M112 318 C112 330 288 330 288 318" fill="none" stroke="${SOMBRA}" stroke-opacity=".18" stroke-width="1.2"/>`,
          ].join("")),
        };
      },
      defs: (id) => `
        <linearGradient id="${id}-cil" x1="0" x2="1">
          <stop offset="0" stop-color="${SOMBRA}" stop-opacity=".26"/><stop offset=".12" stop-color="${SOMBRA}" stop-opacity=".06"/>
          <stop offset=".3" stop-color="${SOMBRA}" stop-opacity="0"/><stop offset=".7" stop-color="${SOMBRA}" stop-opacity=".05"/>
          <stop offset="1" stop-color="${SOMBRA}" stop-opacity=".3"/>
        </linearGradient>
        <linearGradient id="${id}-asa" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${SOMBRA}" stop-opacity=".05"/><stop offset="1" stop-color="${SOMBRA}" stop-opacity=".28"/>
        </linearGradient>
        <radialGradient id="${id}-interior" cx="50%" cy="20%" r="80%">
          <stop offset="0" stop-color="#C9C3BA"/><stop offset=".6" stop-color="#EEEAE4"/><stop offset="1" stop-color="#FFFFFF"/>
        </radialGradient>
        <radialGradient id="${id}-hondo" cx="50%" cy="20%" r="80%">
          <stop offset="0" stop-color="#000000" stop-opacity=".45"/><stop offset="1" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>`,
    },

    gorra: {
      completo: "44 58 316 316",
      detalle: "96 96 196 196",
      zonas: {
        // Frente de espuma, en perspectiva de tres cuartos
        frente: { label: "Frente", corto: "Frente", x: 116, y: 160, w: 88, h: 56, cmW: 11, cmH: 7, refY: 140, ref: "del borde", transform: "translate(160 188) rotate(-7) scale(.86 1) translate(-160 -188)", onda: 3 },
      },
      presets: [{ id: "centro", label: "Centrado", x: 0.5, y: 0.5, w: 0.8 }, { id: "completo", label: "Todo el frente", x: 0.5, y: 0.5, w: 1 }],
      capas(id, zona, color) {
        const m = color || TINTA;
        const copa = "M112 262 C104 178 160 104 236 102 C300 104 340 160 342 220 C343 238 340 252 334 262 Z";
        const frente = "M112 262 C104 178 160 104 236 102 C214 132 206 196 218 266 Z";
        const visera = "M70 268 C104 238 190 232 244 256 C236 292 184 322 114 322 C80 322 60 298 70 268 Z";
        return {
          antes: [
            `<ellipse cx="206" cy="326" rx="140" ry="18" fill="${SOMBRA}" opacity=".3" filter="url(#${id}-b9)"/>`,
            `<path d="${copa}" fill="${m}"/><path d="${copa}" fill="url(#${id}-malla)"/>`,
            `<path d="M218 266 C206 196 214 132 236 102 M270 264 C268 196 262 140 236 102" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="1"/>`,
            `<path d="${frente}" fill="#FFFFFF"/>`,
          ].join(""),
          despues: [
            `<path d="${frente}" fill="url(#${id}-domo)"/>`,
            `<path d="M218 266 C206 196 214 132 236 102" fill="none" stroke="${SOMBRA}" stroke-opacity=".18" stroke-width="1.4"/>`,
            `<path d="M116 256 C150 250 190 252 222 262" fill="none" stroke="${SOMBRA}" stroke-opacity=".22" stroke-width="1" stroke-dasharray="2.2 1.8"/>`,
            `<circle cx="236" cy="103" r="7" fill="${m}"/><circle cx="234" cy="101" r="2.4" fill="#FFFFFF" fill-opacity=".35"/>`,
            `<path d="M112 262 C160 250 220 252 250 262" fill="none" stroke="${SOMBRA}" stroke-opacity=".3" stroke-width="7" filter="url(#${id}-b5)"/>`,
            `<path d="${visera}" fill="${m}"/><path d="${visera}" fill="url(#${id}-visera)"/>`,
            `<path d="M80 270 C112 246 188 242 236 262 M90 276 C120 256 186 252 228 270" fill="none" stroke="#FFFFFF" stroke-opacity=".3" stroke-width=".8" stroke-dasharray="2.2 1.8"/>`,
          ].join(""),
        };
      },
      defs: (id) => `
        <pattern id="${id}-malla" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#FFFFFF" fill-opacity=".05"/><circle cx="3" cy="3" r="1.5" fill="#000000" fill-opacity=".38"/>
        </pattern>
        <radialGradient id="${id}-domo" cx="30%" cy="28%" r="80%">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset=".55" stop-color="${SOMBRA}" stop-opacity="0"/>
          <stop offset="1" stop-color="${SOMBRA}" stop-opacity=".26"/>
        </radialGradient>
        <linearGradient id="${id}-visera" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity=".2"/><stop offset="1" stop-color="#000000" stop-opacity=".28"/>
        </linearGradient>`,
    },

    mousepad: {
      detalle: "110 110 180 180",
      zonas: {
        frente: { label: "Superficie", corto: "Superficie", x: 92, y: 104, w: 224, h: 183, cmW: 22, cmH: 18, refY: 104, ref: "del borde", clip: "pad" },
      },
      presets: PRESETS_OBJETO("Toda la superficie"),
      capas(id) {
        return {
          antes: [
            `<path d="${MOUSEPAD}" transform="translate(4 12)" fill="${SOMBRA}" opacity=".3" filter="url(#${id}-b9)"/>`,
            `<path d="${MOUSEPAD}" transform="translate(0 5)" fill="#3A3632"/>`,
            `<path d="${MOUSEPAD}" fill="#FBF6EE"/>`,
          ].join(""),
          despues: [
            `<path d="${MOUSEPAD}" fill="url(#${id}-luz)"/>`,
            `<rect width="400" height="400" clip-path="url(#${id}-pad)" filter="url(#${id}-grano)" opacity=".35"/>`,
            `<path d="${MOUSEPAD}" fill="none" stroke="${SOMBRA}" stroke-opacity=".2" stroke-width="1"/>`,
          ].join(""),
        };
      },
      defs: (id) => `
        <clipPath id="${id}-pad"><path d="${MOUSEPAD}"/></clipPath>
        <linearGradient id="${id}-luz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity=".35"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/>
          <stop offset="1" stop-color="${SOMBRA}" stop-opacity=".12"/>
        </linearGradient>`,
    },

    cojin: {
      detalle: "108 108 184 184",
      zonas: {
        frente: { label: "Cara 1", corto: "Cara 1", x: 88, y: 88, w: 224, h: 224, cmW: 40, cmH: 40, refY: 88, ref: "del borde", clip: "cojin", onda: 9 },
        espalda: { label: "Cara 2", corto: "Cara 2", x: 88, y: 88, w: 224, h: 224, cmW: 40, cmH: 40, refY: 88, ref: "del borde", clip: "cojin", onda: 9 },
      },
      presets: PRESETS_OBJETO("Toda la cara"),
      capas(id) {
        return {
          antes: [
            `<path d="${COJIN}" transform="translate(3 12)" fill="${SOMBRA}" opacity=".3" filter="url(#${id}-b9)"/>`,
            `<path d="${COJIN}" fill="#FFFFFF"/>`,
          ].join(""),
          despues: [
            `<path d="${COJIN}" fill="url(#${id}-relleno)"/>`,
            `<g clip-path="url(#${id}-cojin)" fill="none" stroke="${SOMBRA}" stroke-opacity=".07" stroke-width="7" stroke-linecap="round" filter="url(#${id}-b5)">
              <path d="M94 100 C108 110 118 118 128 126"/><path d="M306 100 C292 110 282 118 272 126"/>
              <path d="M94 300 C108 290 118 282 128 274"/><path d="M306 300 C292 290 282 282 272 274"/>
            </g>`,
            `<path d="M150 116 C180 108 230 108 262 116" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="8" stroke-linecap="round" filter="url(#${id}-b5)"/>`,
            `<rect width="400" height="400" clip-path="url(#${id}-cojin)" filter="url(#${id}-grano)" opacity=".22"/>`,
            `<path d="${COJIN}" fill="none" stroke="${SOMBRA}" stroke-opacity=".25" stroke-width="2.4"/>`,
            `<path d="M93 97 C150 84 250 84 307 97 C322 154 322 246 307 303 C250 316 150 316 93 303 C78 246 78 154 93 97 Z" fill="none" stroke="${SOMBRA}" stroke-opacity=".2" stroke-width=".8" stroke-dasharray="2.2 1.8"/>`,
          ].join(""),
        };
      },
      defs: (id) => `
        <clipPath id="${id}-cojin"><path d="${COJIN}"/></clipPath>
        <radialGradient id="${id}-relleno" cx="46%" cy="44%" r="62%">
          <stop offset="0" stop-color="${SOMBRA}" stop-opacity="0"/><stop offset=".65" stop-color="${SOMBRA}" stop-opacity=".05"/>
          <stop offset="1" stop-color="${SOMBRA}" stop-opacity=".26"/>
        </radialGradient>`,
    },
  };

  /**
   * SVG de un objeto con el logo en una zona (misma interfaz que las prendas).
   * opts: { u, logo, area, fondo, editable, titulo, clase, detalle }
   */
  function objetoSVG(x, zona, opts) {
    opts = opts || {};
    const pr = prendaDe(x) || { tipo: "taza", color: "#FFFFFF" };
    const o = OBJETOS[pr.tipo] || OBJETOS.taza;
    if (!o.zonas[zona]) zona = Object.keys(o.zonas)[0];
    const z = o.zonas[zona];
    const id = "mk" + ++uid;
    const filtro = z.onda ? `${id}-imp${z.onda}` : `${id}-imp`;
    const capas = o.capas(id, zona, pr.color);
    const vb = opts.detalle ? o.detalle : o.completo || "0 0 400 400";
    const transf = z.transform ? ` transform="${z.transform}"` : "";
    const clip = z.clip ? ` clip-path="url(#${id}-${z.clip})"` : "";
    const blur = (n, s) => `<filter id="${id}-${n}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
    const onda = (n, e) => `<filter id="${id}-imp${n}" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed="4" result="r"/>
        <feDisplacementMap in="SourceGraphic" in2="r" scale="${e}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    let logoG = "";
    if (opts.u) {
      const ratio = (opts.logo && opts.logo.ratio) || 1;
      const u = ajustar(pr, zona, opts.u, ratio);
      const g = geometria(pr, zona, u, ratio);
      const attrs = opts.editable
        ? ` class="mk-logo" tabindex="0" role="button" aria-label="Logo en ${esc(z.label)}. Arrastra o usa las flechas para moverlo; + y − cambian el tamaño."`
        : "";
      logoG = `<g${attrs} transform="translate(${f(g.cx)} ${f(g.cy)})">${logoInner(g.lw, g.lh, opts.logo, opts.editable, id, false, filtro)}</g>`;
    }
    const area = opts.area
      ? `<g${transf} pointer-events="none"><rect class="mk-area" x="${f(z.x)}" y="${f(z.y)}" width="${f(z.w)}" height="${f(z.h)}" rx="4" fill="${TEAL}" fill-opacity=".05" stroke="${TEAL}" stroke-width="1.3" stroke-dasharray="6 4"/></g>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="400" height="400" data-mk="${id}" data-imp="${filtro}" data-oscura="0"${opts.clase ? ` class="${esc(opts.clase)}"` : ""}${opts.editable ? "" : ` role="img"`} aria-label="${esc(opts.titulo || z.label)}">
      <defs>
        <radialGradient id="${id}-fondo" cx="50%" cy="38%" r="78%"><stop offset="0" stop-color="#FDFBF7"/><stop offset="1" stop-color="#E9E1D5"/></radialGradient>
        ${blur("b5", 5)}${blur("b9", 9)}
        <filter id="${id}-imp" x="-6%" y="-6%" width="112%" height="112%"><feGaussianBlur stdDeviation=".2"/></filter>
        ${onda(3, 3)}${onda(9, 9)}
        <filter id="${id}-grano" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncR type="linear" slope=".35" intercept=".72"/><feFuncG type="linear" slope=".35" intercept=".72"/><feFuncB type="linear" slope=".35" intercept=".72"/></feComponentTransfer>
          <feColorMatrix type="matrix" values="${SOMBRA_MATRIZ}"/>
        </filter>
        ${o.defs(id)}
      </defs>
      ${opts.fondo === false ? "" : `<rect x="-50" y="-50" width="500" height="500" fill="url(#${id}-fondo)"/>`}
      ${capas.antes}
      <g class="mk-zona"${transf}><g${clip}>${logoG}</g></g>
      ${capas.despues}
      ${area}
    </svg>`;
  }

  const cacheObjetos = new Map();
  /** Imagen (data URL) de un objeto con el logo de muestra, para el catálogo. */
  function objetoURL(tipo, vista, color) {
    const key = [tipo, vista, color || ""].join("|");
    if (!cacheObjetos.has(key)) {
      const o = OBJETOS[tipo] || OBJETOS.taza;
      const zona = Object.keys(o.zonas)[0];
      const pre = o.presets[0];
      const svgTxt = objetoSVG({ tipo, color }, zona, {
        u: { x: pre.x, y: pre.y, w: tipo === "cojin" || tipo === "mousepad" ? 0.66 : 0.9 },
        logo: { muestra: true, ratio: RATIO_MUESTRA },
        detalle: String(vista) === "2",
      });
      cacheObjetos.set(key, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgTxt));
    }
    return cacheObjetos.get(key);
  }

  /** ¿La referencia de imagen es del simulador? ("mockup:<idProducto>:<vista>" u "objeto:<tipo>:<vista>") */
  const esRef = (file) => typeof file === "string" && (file.indexOf("mockup:") === 0 || file.indexOf("objeto:") === 0);
  function urlDeRef(file) {
    if (file.indexOf("objeto:") === 0) {
      const [, tipo, vista] = file.split(":");
      return OBJETOS[tipo] ? objetoURL(tipo, vista || "1") : "";
    }
    const [, id, vista] = file.split(":");
    const p = (A.getProduct && A.getProduct(id)) || null;
    return dataURL(p || { prenda: { tipo: "franela" } }, ORDEN.includes(vista) ? vista : "frente");
  }

  /* ---------------- Miniaturas de un diseño (carrito, pedido, panel) ---------------- */

  /** Logo para dibujar a partir del diseño guardado: imagen subida, vista previa o marcador. */
  function logoDeDiseno(d, ratio) {
    const arch = (d && d.archivo) || {};
    const nombre = String(arch.nombre || "");
    const esPDF = /\.pdf$/i.test(nombre) || /\.pdf(\?|$)/i.test(String(arch.url || ""));
    const prev = (d && d.preview) || (d && d.grupo && A.logoPreview ? A.logoPreview(d.grupo) : "");
    if (arch.url && !esPDF) return { src: arch.url, ratio, tipo: "img" };
    if (prev) return { src: prev, ratio, tipo: "img" };
    return { tipo: esPDF ? "pdf" : "marcador", ratio };
  }

  /**
   * HTML con una miniatura por ubicación del logo.
   * @param {object} d        diseño { ubicaciones, prenda, archivo, preview }
   * @param {object} opts     { producto, tam: px, texto: bool }
   */
  function miniaturasHTML(d, opts) {
    opts = opts || {};
    const ubic = (d && Array.isArray(d.ubicaciones) && d.ubicaciones) || [];
    if (!ubic.length) return "";
    const base = (d && d.prenda) || opts.producto || { prenda: { tipo: "franela" } };
    const tam = opts.tam || 64;
    return `<div class="mk-minis">${ubic.map((u) => {
      const logo = logoDeDiseno(d, u.ratio);
      const tipo = (prendaDe(base) || {}).tipo;
      const titulo = describir(u, tipo);
      return `<figure class="mk-mini" style="--mk-tam:${tam}px" title="${esc(titulo)}">
        ${svg(base, u.zona, { u, logo, fondo: true, titulo })}
        ${opts.texto === false ? "" : `<figcaption>${esc(etiqueta(base, u.zona, true))}${u.anchoCm ? ` · ${cm(u.anchoCm)} cm` : ""}</figcaption>`}
      </figure>`;
    }).join("")}</div>`;
  }

  /** Texto plano de las ubicaciones: "Frente · Pecho izquierdo · 9 × 9 cm …; Manga der. …" */
  function textoUbicaciones(d) {
    const ubic = (d && Array.isArray(d.ubicaciones) && d.ubicaciones) || [];
    const tipo = (prendaDe(d && d.prenda) || {}).tipo;
    return ubic.map((u) => describir(u, tipo)).join("; ");
  }

  /* ---------------- Editor interactivo (ficha de producto) ---------------- */

  /**
   * Crea el editor en `root`.
   * opts: { producto, alCambiar(estado) }
   * Devuelve { ponerLogo(logo), ubicaciones(), zonasActivas(), reiniciar(), ir(vista) }
   */
  function editor(root, opts) {
    const p = opts.producto;
    const pr = prendaDe(p);
    const vistas = vistasDe(p);
    if (!pr || !vistas.length) return null;

    const S = { vista: vistas[0], logo: null, zonas: {} };
    const inicial = () => {
      S.zonas = {};
      const pre = presetsDe(pr, vistas[0])[0];
      S.zonas[vistas[0]] = { x: pre.x, y: pre.y, w: pre.w, ref: pre.label };
    };
    inicial();

    const ratio = () => (S.logo && S.logo.ratio) || 1;

    root.innerHTML = `
      <div class="mk-editor">
        <div class="mk-stage" id="mkStage"></div>
        <div class="mk-tabs" role="tablist" aria-label="Parte de la prenda"></div>
        <div class="mk-tools">
          <label class="mk-switch"><input type="checkbox" id="mkOn"><span class="mk-switch-ui" aria-hidden="true"></span><span id="mkOnTxt"></span></label>
          <div class="mk-presets" id="mkPresets" role="group" aria-label="Posiciones rápidas"></div>
          <div class="mk-size" id="mkSizeBox">
            <label for="mkSize">Tamaño</label>
            <input type="range" id="mkSize" min="8" max="100" step="1">
            <output id="mkSizeOut" for="mkSize"></output>
          </div>
          <p class="mk-hint" id="mkHint"></p>
        </div>
        <div class="mk-resumen" id="mkResumen" aria-live="polite"></div>
      </div>`;

    const $ = (sel) => root.querySelector(sel);
    const stage = $("#mkStage");
    const tabs = $(".mk-tabs");

    function avisar() {
      pintarResumen();
      if (typeof opts.alCambiar === "function") opts.alCambiar(api);
    }

    function pintarTabs() {
      tabs.innerHTML = vistas.map((v) => `
        <button type="button" role="tab" class="mk-tab${v === S.vista ? " is-active" : ""}" data-v="${v}" aria-selected="${v === S.vista}">
          <span>${esc(etiqueta(pr, v, true))}</span>${S.zonas[v] ? '<i class="mk-tab-dot" aria-label="con logo"></i>' : ""}
        </button>`).join("");
    }

    function pintarStage() {
      const u = S.zonas[S.vista];
      stage.innerHTML = svg(pr, S.vista, { u: u || null, logo: S.logo, area: true, editable: !!u, clase: "mk-svg", fondo: true });
      stage.classList.toggle("is-empty", !u);
    }

    function pintarHerramientas() {
      const u = S.zonas[S.vista];
      const on = !!u;
      $("#mkOn").checked = on;
      $("#mkOnTxt").textContent = `Logo en ${etiqueta(pr, S.vista).toLowerCase()}`;
      const pres = presetsDe(pr, S.vista);
      $("#mkPresets").innerHTML = pres.map((x) => `
        <button type="button" class="chip mk-chip${on && u.ref === x.label ? " is-active" : ""}" data-preset="${x.id}" aria-pressed="${on && u.ref === x.label}">
          ${esc(x.label)}${x.pista ? `<small>${esc(x.pista)}</small>` : ""}
        </button>`).join("");
      $("#mkSizeBox").hidden = !on;
      if (on) {
        $("#mkSize").value = Math.round(u.w * 100);
        pintarMedida();
      }
      const a = areaCm(pr, S.vista);
      $("#mkHint").textContent = on
        ? "Arrastra el logo para moverlo dentro del área punteada. Con el teclado: flechas para mover, + y − para el tamaño."
        : `Área de impresión: ${cm(a.ancho)} × ${cm(a.alto)} cm. Activa la casilla o toca una posición para poner tu logo aquí.`;
    }

    function pintarMedida() {
      const u = S.zonas[S.vista];
      if (!u) return;
      const m = medidas(pr, S.vista, ajustar(pr, S.vista, u, ratio()), ratio());
      $("#mkSizeOut").textContent = `${cm(m.anchoCm)} × ${cm(m.altoCm)} cm`;
    }

    function pintarResumen() {
      const lista = api.ubicaciones();
      $("#mkResumen").innerHTML = lista.length
        ? `<strong>Tu logo va en:</strong><ul>${lista.map((u) => `<li><button type="button" class="mk-ir" data-v="${u.zona}">${esc(describir(u, pr.tipo))}</button></li>`).join("")}</ul>`
        : `<div class="notice notice-amber">Elige al menos una parte de la prenda para tu logo.</div>`;
    }

    function pintarTodo() { pintarTabs(); pintarStage(); pintarHerramientas(); avisar(); }

    /* Actualiza solo el logo (sin redibujar la prenda) para no perder el foco ni el arrastre */
    function moverLogoDOM() {
      const u = S.zonas[S.vista];
      const g = stage.querySelector(".mk-logo");
      if (!u || !g) return pintarStage();
      const ok = ajustar(pr, S.vista, u, ratio());
      Object.assign(u, ok);
      const geo = geometria(pr, S.vista, ok, ratio());
      g.setAttribute("transform", `translate(${f(geo.cx)} ${f(geo.cy)})`);
      const el = stage.querySelector("svg");
      g.innerHTML = logoInner(geo.lw, geo.lh, S.logo, true, el ? el.dataset.mk : "", el ? el.dataset.oscura === "1" : false, el ? el.dataset.imp : "");
    }

    function activar(vista, preset) {
      const pre = preset || presetsDe(pr, vista)[0];
      S.zonas[vista] = ajustar(pr, vista, { x: pre.x, y: pre.y, w: pre.w, ref: pre.label }, ratio());
    }

    /* --- Pestañas --- */
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".mk-tab");
      if (!b) return;
      api.ir(b.dataset.v);
    });
    tabs.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const i = vistas.indexOf(S.vista);
      const j = (i + (e.key === "ArrowRight" ? 1 : vistas.length - 1)) % vistas.length;
      api.ir(vistas[j]);
      const t = tabs.querySelector(`[data-v="${vistas[j]}"]`);
      if (t) t.focus();
    });

    /* --- Activar / quitar el logo de esta vista --- */
    $("#mkOn").addEventListener("change", (e) => {
      if (e.target.checked) activar(S.vista);
      else delete S.zonas[S.vista];
      pintarTodo();
    });

    /* --- Posiciones rápidas --- */
    $("#mkPresets").addEventListener("click", (e) => {
      const b = e.target.closest("[data-preset]");
      if (!b) return;
      const pre = presetsDe(pr, S.vista).find((x) => x.id === b.dataset.preset);
      if (pre) activar(S.vista, pre);
      pintarTodo();
    });

    /* --- Tamaño --- */
    $("#mkSize").addEventListener("input", (e) => {
      const u = S.zonas[S.vista];
      if (!u) return;
      u.w = Number(e.target.value) / 100;
      moverLogoDOM();
      pintarMedida();
    });
    $("#mkSize").addEventListener("change", avisar);

    /* --- Arrastrar (ratón, dedo o lápiz) --- */
    let arrastre = null;
    const aSVG = (ev) => {
      // Coordenadas de la zona del logo (en la gorra la zona va en perspectiva)
      const el = stage.querySelector(".mk-zona") || stage.querySelector("svg");
      const m = el && el.getScreenCTM();
      if (!m) return null;
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
      return { x: pt.x, y: pt.y };
    };
    stage.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0) return;
      const pt = aSVG(ev);
      if (!pt) return;
      const a = areaDe(pr, S.vista);
      const dentroArea = pt.x >= a.x && pt.x <= a.x + a.w && pt.y >= a.y && pt.y <= a.y + a.h;
      const u = S.zonas[S.vista];
      if (!u) {
        // Vista sin logo: tocar el área punteada lo pone ahí
        if (!dentroArea) return;
        activar(S.vista);
        const nuevo = S.zonas[S.vista];
        nuevo.x = (pt.x - a.x) / a.w;
        nuevo.y = (pt.y - a.y) / a.h;
        nuevo.ref = "";
        S.zonas[S.vista] = ajustar(pr, S.vista, nuevo, ratio());
        pintarTodo();
        return;
      }
      const sobreLogo = ev.target.closest(".mk-logo");
      if (!sobreLogo) {
        // Tocar dentro del área lleva el logo a ese punto
        if (!dentroArea) return;
        u.x = (pt.x - a.x) / a.w;
        u.y = (pt.y - a.y) / a.h;
        u.ref = "";
        moverLogoDOM();
      }
      ev.preventDefault();
      arrastre = { id: ev.pointerId, x0: pt.x, y0: pt.y, ux: u.x, uy: u.y, a, movido: !sobreLogo };
      try { stage.setPointerCapture(ev.pointerId); } catch (e) { /* puntero sintético: se sigue sin captura */ }
      stage.classList.add("is-dragging");
      const g = stage.querySelector(".mk-logo");
      if (g) g.focus({ preventScroll: true });
    });
    stage.addEventListener("pointermove", (ev) => {
      if (!arrastre || ev.pointerId !== arrastre.id) return;
      const pt = aSVG(ev);
      const u = S.zonas[S.vista];
      if (!pt || !u) return;
      const dx = (pt.x - arrastre.x0) / arrastre.a.w;
      const dy = (pt.y - arrastre.y0) / arrastre.a.h;
      if (Math.abs(dx) + Math.abs(dy) > 0.005) arrastre.movido = true;
      u.x = arrastre.ux + dx;
      u.y = arrastre.uy + dy;
      moverLogoDOM();
    });
    const soltar = (ev) => {
      if (!arrastre || ev.pointerId !== arrastre.id) return;
      const u = S.zonas[S.vista];
      if (u && arrastre.movido) u.ref = "";
      arrastre = null;
      stage.classList.remove("is-dragging");
      pintarTabs();
      pintarHerramientas();
      avisar();
      const g = stage.querySelector(".mk-logo");
      if (g) g.focus({ preventScroll: true });
    };
    stage.addEventListener("pointerup", soltar);
    stage.addEventListener("pointercancel", soltar);
    // En pantallas táctiles, que arrastrar el logo no desplace la página
    stage.addEventListener("touchmove", (e) => { if (arrastre) e.preventDefault(); }, { passive: false });

    /* --- Teclado sobre el logo --- */
    stage.addEventListener("keydown", (e) => {
      if (!e.target.closest(".mk-logo")) return;
      const u = S.zonas[S.vista];
      if (!u) return;
      const paso = e.shiftKey ? 0.05 : 0.01;
      const mover = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key];
      if (mover) {
        u.x += mover[0];
        u.y += mover[1];
        u.ref = "";
      } else if (e.key === "+" || e.key === "=") {
        u.w += 0.03;
      } else if (e.key === "-" || e.key === "_") {
        u.w -= 0.03;
      } else return;
      e.preventDefault();
      moverLogoDOM();
      $("#mkSize").value = Math.round(S.zonas[S.vista].w * 100);
      pintarMedida();
      pintarResumen();
    });
    stage.addEventListener("keyup", (e) => {
      if (e.target.closest(".mk-logo") && /^Arrow|[+=_-]$/.test(e.key)) {
        pintarHerramientas();
        avisar();
        const g = stage.querySelector(".mk-logo");
        if (g) g.focus({ preventScroll: true });
      }
    });

    /* --- Resumen: ir a una vista --- */
    $("#mkResumen").addEventListener("click", (e) => {
      const b = e.target.closest(".mk-ir");
      if (b) api.ir(b.dataset.v);
    });

    const api = {
      prenda: pr,
      /** Cambia el color de la pieza (hex) y la redibuja. */
      ponerColor(hex) {
        if (!hex || hex === pr.color) return;
        pr.color = hex;
        pintarStage();
      },
      /** logo: { src, ratio, tipo: "img"|"pdf" } o null para el marcador "TU LOGO" */
      ponerLogo(logo) {
        S.logo = logo || null;
        Object.keys(S.zonas).forEach((v) => (S.zonas[v] = ajustar(pr, v, S.zonas[v], ratio())));
        pintarTodo();
      },
      /** Ubicaciones listas para guardar, en el orden de las vistas. */
      ubicaciones() {
        return vistas.filter((v) => S.zonas[v]).map((v) => registro(pr, v, S.zonas[v], ratio()));
      },
      zonasActivas: () => vistas.filter((v) => S.zonas[v]),
      ir(vista) {
        if (!vistas.includes(vista)) return;
        S.vista = vista;
        pintarTabs();
        pintarStage();
        pintarHerramientas();
      },
      reiniciar() {
        S.vista = vistas[0];
        inicial();
        Object.keys(S.zonas).forEach((v) => (S.zonas[v] = ajustar(pr, v, S.zonas[v], ratio())));
        pintarTodo();
      },
    };

    pintarTodo();
    return api;
  }

  A.mockup = {
    VISTAS,
    ORDEN,
    TIPOS,
    prendaDe,
    instantanea,
    vistasDe,
    presetsDe: (x, vista) => presetsDe(prendaDe(x), vista),
    areaCm,
    medidas,
    registro,
    describir,
    svg,
    dataURL,
    esRef,
    urlDeRef,
    esObjeto: (x) => esObjeto(prendaDe(x)),
    zonasDe,
    etiqueta,
    objetoSVG,
    objetoURL,
    miniaturasHTML,
    textoUbicaciones,
    editor,
  };
})();
