/* =========================================================
   STAMPY — Cliente de la API
   Habla con /api/* (funciones de Netlify). Si no hay servidor
   —por ejemplo al abrir los archivos con doble clic— avisa y la
   tienda sigue funcionando con los datos del propio navegador.
   ========================================================= */

window.STAMPY = window.STAMPY || {};

STAMPY.api = (function () {
  "use strict";

  const BASE = "/api";
  const K_TOKEN = "stampy.token.v1";

  let disponible = null; // null = sin comprobar, true/false = resultado

  function token() {
    try { return localStorage.getItem(K_TOKEN) || null; } catch (e) { return null; }
  }
  function guardarToken(t) {
    try { t ? localStorage.setItem(K_TOKEN, t) : localStorage.removeItem(K_TOKEN); } catch (e) { /* sin almacenamiento */ }
  }

  async function pedir(ruta, opciones) {
    const o = opciones || {};
    const cab = { "content-type": "application/json" };
    const t = token();
    if (t) cab.authorization = "Bearer " + t;

    const respuesta = await fetch(BASE + ruta, {
      method: o.metodo || "GET",
      headers: cab,
      body: o.cuerpo === undefined ? undefined : JSON.stringify(o.cuerpo),
    });

    let datos = null;
    try { datos = await respuesta.json(); } catch (e) { datos = null; }

    if (!respuesta.ok) {
      const err = new Error((datos && datos.error) || "Error " + respuesta.status);
      err.estado = respuesta.status;
      err.datos = datos;
      throw err;
    }
    return datos;
  }

  /* ---- Archivos de diseño (ver docs/MODELO.md → Archivos de diseño) ---- */
  const DISENO_MAX = 8 * 1024 * 1024;      // 8 MB
  const DISENO_DIRECTO_MAX = 4 * 1024 * 1024; // hasta aquí va en base64 por /api/diseno (Netlify corta el cuerpo en ~6 MB)
  const TIPOS_DISENO = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
  const EXT_DISENO = /\.(png|jpe?g|webp|pdf)$/i;

  function errorDiseno(mensaje, extra) {
    const e = new Error(mensaje);
    Object.assign(e, extra || {});
    return e;
  }

  function leerBase64(file) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result).split(",")[1] || "");
      lector.onerror = () => reject(errorDiseno("No se pudo leer el archivo."));
      lector.readAsDataURL(file);
    });
  }

  /**
   * Sube el arte del cliente. Devuelve { url, ruta, nombre }.
   * Rechaza con un Error en español; si no hay servidor, el error trae
   * `sinServidor: true` para que la tienda guarde solo { nombre }.
   */
  async function subirDiseno(file) {
    if (!file || typeof file.size !== "number") throw errorDiseno("Elige un archivo.");
    if (!file.size) throw errorDiseno("El archivo está vacío.");
    if (file.size > DISENO_MAX) throw errorDiseno("El archivo pesa más de 8 MB.", { estado: 413 });
    const tipo = (file.type || "").toLowerCase();
    if (tipo ? !TIPOS_DISENO.includes(tipo) : !EXT_DISENO.test(file.name || "")) {
      throw errorDiseno("Formato no permitido. Usa PNG, JPG, WEBP o PDF.", { estado: 415 });
    }

    const hay = await STAMPY.api.comprobar();
    if (!hay) {
      throw errorDiseno("No hay servidor para subir archivos en este momento. " + (STAMPY.api.diagnostico.titulo || ""), {
        sinServidor: true,
        causa: STAMPY.api.diagnostico.causa,
      });
    }

    if (file.size <= DISENO_DIRECTO_MAX) {
      const datos = await leerBase64(file);
      return pedir("/diseno", { metodo: "POST", cuerpo: { nombre: file.name || "diseno", tipo, datos } });
    }

    // Archivo grande: el servidor firma una subida directa a Storage,
    // se sube, y luego el servidor revisa el contenido real.
    const tipoFirma = tipo || (/\.pdf$/i.test(file.name) ? "application/pdf" : /\.png$/i.test(file.name) ? "image/png" : /\.webp$/i.test(file.name) ? "image/webp" : "image/jpeg");
    const firma = await pedir("/diseno/firma", { metodo: "POST", cuerpo: { nombre: file.name || "diseno", tipo: tipoFirma, tamano: file.size } });
    const cuerpo = new FormData();
    cuerpo.append("cacheControl", "3600");
    cuerpo.append("", file);
    let r;
    try {
      r = await fetch(firma.subida, { method: "PUT", headers: { "x-upsert": "false" }, body: cuerpo });
    } catch (e) {
      throw errorDiseno("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.");
    }
    if (!r.ok) throw errorDiseno("No se pudo subir el archivo (error " + r.status + ").", { estado: r.status });
    return pedir("/diseno/verificar", { metodo: "POST", cuerpo: { ruta: firma.ruta, nombre: file.name || "diseno" } });
  }

  return {
    get disponible() { return disponible === true; },
    get token() { return token(); },

    /** Motivo por el que no hay servidor, para poder explicárselo al usuario. */
    diagnostico: { causa: "sin-comprobar", titulo: "", detalle: "", ayuda: "" },

    /** Comprueba si hay backend. Devuelve true/false y no lanza nunca. */
    async comprobar() {
      if (disponible !== null) return disponible;
      const d = STAMPY.api.diagnostico;

      if (typeof fetch !== "function" || location.protocol === "file:") {
        disponible = false;
        Object.assign(d, {
          causa: "local",
          titulo: "Abierto como archivo, sin servidor",
          detalle: "Estás viendo el sitio directamente desde tu computadora, no desde una dirección web.",
          ayuda: "Es normal: sirve para revisar el diseño. Para trabajar con datos compartidos, entra por la dirección de tu sitio publicado.",
        });
        return false;
      }

      let respuesta, datos;
      try {
        const controlador = new AbortController();
        const corte = setTimeout(() => controlador.abort(), 8000);
        respuesta = await fetch(BASE + "/salud", { signal: controlador.signal });
        clearTimeout(corte);
      } catch (e) {
        disponible = false;
        Object.assign(d, {
          causa: "sin-red",
          titulo: "No se pudo contactar al servidor",
          detalle: e.name === "AbortError" ? "La consulta tardó demasiado." : "La petición a /api/salud falló.",
          ayuda: "Revisa tu conexión a internet y vuelve a intentarlo.",
        });
        return false;
      }

      if (respuesta.status === 404) {
        disponible = false;
        Object.assign(d, {
          causa: "sin-funcion",
          titulo: "El servidor no está publicado",
          detalle: "La dirección /api/salud responde 404: la función no llegó al sitio.",
          ayuda: "Comprueba que la carpeta netlify/functions esté en el repositorio y que netlify.toml esté en la raíz.",
        });
        return false;
      }

      try {
        datos = await respuesta.json();
      } catch (e) {
        datos = null;
      }

      if (!datos) {
        disponible = false;
        Object.assign(d, {
          causa: "respuesta-rara",
          titulo: "El servidor respondió algo inesperado",
          detalle: "Código " + respuesta.status + " sin datos legibles.",
          ayuda: "Mira los registros de la función en Netlify: Deploys → último deploy → Function logs.",
        });
        return false;
      }

      if (datos.ok) {
        disponible = true;
        Object.assign(d, { causa: "ok", titulo: "Conectado al servidor", detalle: "", ayuda: "" });
        STAMPY.avisoSeguridad = !!(datos.usuariosPorDefecto || datos.secretoPorDefecto || datos.secretoCorto);
        // false si falta STAMPY_SECRET: la tienda funciona, pero el panel responde 503.
        STAMPY.panelHabilitado = datos.panelHabilitado !== false;
        return true;
      }

      // El servidor responde pero el almacenamiento falla
      disponible = false;
      Object.assign(d, {
        causa: "sin-almacenamiento",
        titulo: "El servidor responde, pero no puede guardar datos",
        detalle: datos.motivo || datos.error || "Error desconocido en el almacenamiento.",
        ayuda: "Si subiste el sitio arrastrando la carpeta, vuelve a publicarlo desde GitHub: al arrastrar no se instalan las dependencias del servidor.",
      });
      return false;
    },

    /** Vuelve a comprobar desde cero (para el botón de reintentar). */
    async reintentar() {
      disponible = null;
      return STAMPY.api.comprobar();
    },

    publico: () => pedir("/publico"),
    sembrar: (datos) => pedir("/semilla", { metodo: "POST", cuerpo: datos }),

    crearPedido: (orden) => pedir("/pedido", { metodo: "POST", cuerpo: orden }),
    buscarPedido: (codigo) => pedir("/pedido/" + encodeURIComponent(codigo)),
    eliminarPedido: (codigo) => pedir("/pedido/" + encodeURIComponent(codigo), { metodo: "DELETE" }),
    subirImagenProducto: (id, dataBase64, tipo) =>
      pedir("/producto/" + encodeURIComponent(id) + "/imagen", { metodo: "POST", cuerpo: { dataBase64, tipo } }),
    eliminarImagenProducto: (id, url) =>
      pedir("/producto/" + encodeURIComponent(id) + "/imagen", { metodo: "DELETE", cuerpo: { url } }),
    darDeBajaProducto: (id) => pedir("/producto/" + encodeURIComponent(id), { metodo: "DELETE" }),

    /** Sube el arte del cliente (PNG, JPG, WEBP o PDF, máx. 8 MB) → { url, ruta, nombre }. */
    subirDiseno,

    async entrar(usuario, clave) {
      const d = await pedir("/sesion", { metodo: "POST", cuerpo: { usuario, clave } });
      guardarToken(d.token);
      return d;
    },
    salir() { guardarToken(null); },

    estado: () => pedir("/estado"),
    guardar: (nombre, valor) => pedir("/coleccion/" + nombre, { metodo: "PUT", cuerpo: valor }),
    reiniciar: () => pedir("/reiniciar", { metodo: "POST" }),
  };
})();
