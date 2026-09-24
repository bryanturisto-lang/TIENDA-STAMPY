/* =========================================================
   STAMPY — Datos de la tienda
   Catálogo de ejemplo + configuración. En producción, el
   catálogo y la configuración viven en Supabase: esto es solo
   la semilla que se carga la primera vez.
   ========================================================= */

window.STAMPY = window.STAMPY || {};

/* ---------------------------------------------------------
   Configuración general — edita aquí para adaptar la tienda.
   Los valores entre [ ] son marcadores: cámbialos desde el
   panel (Configuración) antes de abrir la tienda.
   --------------------------------------------------------- */
STAMPY.config = {
  storeName: "Estampy",
  tagline: "Tu diseño, a todo color",

  // Tasa de cambio referencial (Bs por 1 USD). Cámbiala cuando la actualices.
  bcvRate: 216.40,
  bcvUpdated: "02/08/2026",

  iva: 0.16,              // 16 % IVA
  freeShippingOver: 120,  // delivery gratis a partir de este monto en USD

  contact: {
    phone: "[+58 4XX-XXX-XXXX]",
    whatsapp: "",               // solo dígitos, ej. 584140000000
    email: "hola@estampy.com",
    rif: "[J-00000000-0]",
    instagram: "estampy",
  },

  // Archivos de diseño que sube el cliente
  disenos: {
    maxMB: 8,
    formatos: "PNG, JPG, WEBP o PDF",
  },

  // Datos para pago móvil (los que ve el cliente al pagar)
  pagoMovil: {
    banco: "[Banco por configurar]",
    rif: "[RIF / C.I.]",
    telefono: "[04XX-XXXXXXX]",
    titular: "[Titular]",
  },

  transferencia: {
    banco: "[Banco por configurar]",
    cuenta: "[0000-0000-00-0000000000]",
    tipo: "Corriente",
    titular: "[Titular]",
    rif: "[RIF]",
  },

  zelle: { email: "[correo@zelle.com]", titular: "[Titular]" },

  binance: { id: "[Binance Pay ID]", alias: "Estampy" },

  paypal: { titular: "[Titular]", email: "[correo@paypal.com]", nota: "Recuerda que PayPal cobra una comisión aparte." },

  banescoPanama: { titular: "[Titular]", banco: "Banesco Panamá", cuenta: "[Número de cuenta]", tipo: "Cuenta corriente" },

  bancos: [
    "0102 — Banco de Venezuela", "0104 — Venezolano de Crédito",
    "0105 — Mercantil", "0108 — Provincial", "0114 — Bancaribe",
    "0115 — Exterior", "0128 — Banco Caroní", "0134 — Banesco",
    "0138 — Banco Plaza", "0151 — BFC Banco Fondo Común",
    "0156 — 100% Banco", "0163 — Banco del Tesoro",
    "0168 — Bancrecer", "0169 — Mi Banco", "0171 — Banco Activo",
    "0172 — Bancamiga", "0174 — Banplus", "0175 — Bicentenario",
    "0177 — Banfanb", "0191 — BNC Banco Nacional de Crédito",
  ],

  // Taller o tienda para retirar pedidos
  tiendas: [
    {
      id: "taller",
      nombre: "Taller Estampy",
      direccion: "[Dirección del taller por configurar]",
      horario: "Lun a Vie · 9:00 a 17:00 · Sáb 9:00 a 13:00",
      telefono: "[+58 4XX-XXX-XXXX]",
    },
  ],

  // Zonas de delivery: costo en USD y tiempo de envío (días hábiles).
  // El tiempo de producción de cada producto se suma aparte.
  zonas: [
    { id: "ccs", nombre: "Caracas (Distrito Capital y Miranda)", costo: 6, dias: 1 },
    { id: "central", nombre: "Región Central (Aragua, Carabobo, Vargas)", costo: 8, dias: 2 },
    { id: "occidente", nombre: "Occidente (Zulia, Falcón, Lara, Trujillo)", costo: 11, dias: 3 },
    { id: "oriente", nombre: "Oriente (Anzoátegui, Sucre, Monagas, N. Esparta)", costo: 12, dias: 4 },
    { id: "andes", nombre: "Los Andes (Mérida, Táchira, Barinas)", costo: 12, dias: 4 },
    { id: "llanos", nombre: "Llanos y Guayana (Bolívar, Apure, Guárico, Amazonas)", costo: 14, dias: 5 },
  ],

  courier: ["Zoom", "MRW", "Tealca", "Domesa", "Delivery propio Estampy"],
};

/* ---------------------------------------------------------
   Modelo de producto (detalle en docs/MODELO.md):
   - modoStock "pedido": se produce al pedir, no hay inventario.
     modoStock "stock": hay piezas listas; se descuenta al vender.
   - tallas: [] si el producto no lleva talla.
   - stockTallas: { S: 10, M: 4 } (solo modoStock "stock" con tallas).
   - preciosMayor: escalones por cantidad total del producto.
   - permiteDiseno: el cliente puede subir su arte o describirlo.
   - prenda: { tipo, cuello, infantil } si la pieza se personaliza en el
     simulador (mockup.js). tipo: franela | chemise | manga-larga (prendas)
     o taza | gorra | mousepad | cojin (objetos). El cliente coloca su logo
     en las zonas de "ubicaciones" (frente, espalda, mangas; en objetos:
     frente/espalda = lado o cara 1 y 2).
   --------------------------------------------------------- */
const TALLAS_ADULTO = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const CUIDADO = "Lavar al revés con agua fría · No usar cloro · Planchar por el revés";
// Colores de las prendas (tonos de tela reales). El cliente elige uno y coloca su logo.
const COLORES_PRENDA = [
  { nombre: "Blanco", hex: "#FFFFFF" },
  { nombre: "Negro", hex: "#1E1E20" },
  { nombre: "Rojo", hex: "#B0232A" },
  { nombre: "Azul", hex: "#1F3F8F" },
];
const coloresPrenda = () => COLORES_PRENDA.map((c) => ({ ...c }));
// Dónde puede ir el logo en las prendas (el panel puede quitar alguna por producto)
const UBICACIONES = ["frente", "espalda", "manga-izq", "manga-der"];

STAMPY.products = [
  {
    id: "franela-clasica",
    nombre: "Franela clásica con tu logo",
    linea: "Básica",
    categoria: "franelas",
    categoriaLabel: "Franelas",
    precio: 12,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 10 }, { desde: 50, precio: 8.5 } ],
    rating: 4.8,
    reviews: 132,
    modoStock: "pedido",
    tallas: TALLAS_ADULTO.slice(),
    stockTallas: {},
    stock: 0,
    colores: coloresPrenda(),
    prenda: { tipo: "franela", cuello: "redondo" },
    ubicaciones: UBICACIONES.slice(),
    permiteDiseno: true,
    diasProduccion: 3,
    pedidoMinimo: 1,
    etiquetas: ["Más vendida"],
    resumen: "Franela cuello redondo en tela fría, en blanco, negro, rojo o azul. Sube tu logo y elige dónde va: al frente, en la espalda, en las mangas o en varias partes a la vez.",
    descripcion: "Elige el color de la franela, sube tu logo y colócalo en el simulador: al centro del pecho, en el lado del corazón, en la espalda o en las mangas. La tinta queda dentro de la fibra, así que el logo no se agrieta ni se despega con los lavados. Antes de producir te mandamos la prueba por WhatsApp.",
    destacados: [
      "Tu logo en frente, espalda y mangas: tú decides dónde y de qué tamaño",
      "El logo queda dentro de la tela: no se agrieta ni se despega",
      "Prueba de diseño por WhatsApp antes de producir",
      "Desde 12 unidades baja el precio por pieza",
    ],
    specs: {
      Material: "Tela fría 100 % poliéster, 150 g/m²",
      Colores: "Blanco · Negro · Rojo · Azul",
      Técnica: "Sublimación por transferencia",
      "Área de impresión": "Frente y espalda hasta 30 × 40 cm · Mangas 9 × 9 cm",
      Cuello: "Redondo, con refuerzo",
      Cuidado: CUIDADO,
      Producción: "3 días hábiles tras aprobar el diseño",
    },
    imagenes: ["mockup:franela-clasica:frente", "mockup:franela-clasica:espalda"],
    opiniones: [
      { autor: "María G.", estrellas: 5, fecha: "12 ago 2026", texto: "Pedí 20 para el cumpleaños de mi papá con el logo en el pecho y la fecha en la espalda. Quedaron idénticas a la prueba." },
      { autor: "Jorge R.", estrellas: 5, fecha: "30 jul 2026", texto: "Ya las he lavado un montón de veces y el logo sigue intacto." },
      { autor: "Andrea P.", estrellas: 4, fecha: "18 jul 2026", texto: "Muy buena calidad. La talla M me quedó un poco holgada, pide tu talla justa." },
    ],
  },
  {
    id: "franela-deportiva",
    nombre: "Franela deportiva dry-fit",
    linea: "Deportiva",
    categoria: "deportiva",
    categoriaLabel: "Deportiva",
    precio: 15,
    precioAnterior: 17,
    preciosMayor: [ { desde: 12, precio: 12.5 }, { desde: 50, precio: 10.5 } ],
    rating: 4.9,
    reviews: 87,
    modoStock: "pedido",
    tallas: TALLAS_ADULTO.slice(),
    stockTallas: {},
    stock: 0,
    colores: coloresPrenda(),
    prenda: { tipo: "franela", cuello: "v" },
    ubicaciones: UBICACIONES.slice(),
    permiteDiseno: true,
    diasProduccion: 4,
    pedidoMinimo: 1,
    etiquetas: ["Dry-fit"],
    resumen: "Camiseta deportiva cuello en V en blanco, negro, rojo o azul, en tela dry-fit que seca rápido. Tu escudo al pecho, el patrocinador en la espalda y lo que quieras en las mangas.",
    descripcion: "Para equipos, academias, maratones y clubes. La tela dry-fit deja salir el sudor y seca rápido. Coloca el escudo o logo en el simulador y, si es para un equipo, escribe en las indicaciones la lista de nombres y números por talla: los personalizamos uno a uno sin costo extra.",
    destacados: [
      "Escudo, patrocinadores y número donde los quieras",
      "Tela dry-fit que seca rápido y no se pega al cuerpo",
      "Nombre y número por jugador sin costo extra",
      "Precio de equipo desde 12 unidades",
    ],
    specs: {
      Material: "Dry-fit 100 % poliéster, 140 g/m²",
      Colores: "Blanco · Negro · Rojo · Azul",
      Técnica: "Sublimación por transferencia",
      "Área de impresión": "Frente 30 × 37,5 cm · Espalda 30 × 40 cm · Mangas 9 × 9 cm",
      Cuello: "En V",
      Cuidado: CUIDADO,
      Producción: "4 días hábiles tras aprobar el diseño",
    },
    imagenes: ["mockup:franela-deportiva:frente", "mockup:franela-deportiva:espalda"],
    opiniones: [
      { autor: "Club Los Halcones", estrellas: 5, fecha: "05 ago 2026", texto: "Uniformes para 18 niños con el escudo al pecho y el número atrás. Llegaron antes de la fecha." },
      { autor: "Luis M.", estrellas: 5, fecha: "22 jul 2026", texto: "La tela es muy fresca, perfecta para correr." },
    ],
  },
  {
    id: "chemise-pique",
    nombre: "Chemise piqué con tu logo",
    linea: "Corporativa",
    categoria: "chemises",
    categoriaLabel: "Chemises",
    precio: 18,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 15.5 }, { desde: 50, precio: 13 } ],
    rating: 4.7,
    reviews: 54,
    modoStock: "pedido",
    tallas: ["S", "M", "L", "XL", "2XL"],
    stockTallas: {},
    stock: 0,
    colores: coloresPrenda(),
    prenda: { tipo: "chemise" },
    ubicaciones: UBICACIONES.slice(),
    permiteDiseno: true,
    diasProduccion: 2,
    pedidoMinimo: 1,
    etiquetas: ["Uniforme corporativo"],
    resumen: "Chemise tipo polo en piqué, en blanco, negro, rojo o azul. Tu logo en el pecho, en la espalda o en las mangas: la prenda más pedida para uniformes de empresa.",
    descripcion: "Elige el color, sube tu logo y ubícalo donde lo quieras. Lo más común es el logo pequeño en el lado del corazón y uno grande en la espalda; también puedes ponerlo en las mangas. Si necesitas el nombre de cada empleado, indícalo en las indicaciones.",
    destacados: [
      "Lista en 2 días hábiles tras aprobar el diseño",
      "Logo en pecho, espalda y mangas",
      "Piqué de poliéster que no pierde la forma",
      "Ideal para uniformes de empresa y eventos",
    ],
    specs: {
      Material: "Piqué 100 % poliéster, 180 g/m²",
      Colores: "Blanco · Negro · Rojo · Azul",
      Técnica: "Sublimación por zonas",
      "Área de impresión": "Frente 30 × 37,5 cm · Espalda 30 × 40 cm · Mangas 9 × 9 cm",
      Cuello: "Tejido con 3 botones",
      Cuidado: CUIDADO,
      Producción: "2 días hábiles tras aprobar el diseño",
    },
    imagenes: ["mockup:chemise-pique:frente", "mockup:chemise-pique:espalda"],
    opiniones: [
      { autor: "Farmacia Santa Rosa", estrellas: 5, fecha: "09 ago 2026", texto: "Hicimos 40 chemises para el personal con el logo al pecho. Quedó nítido y las tallas llegaron completas." },
      { autor: "Carlos D.", estrellas: 4, fecha: "15 jul 2026", texto: "Buena tela y el logo en la manga quedó muy bien." },
    ],
  },
  {
    id: "manga-larga-uv",
    nombre: "Franela manga larga UV",
    linea: "Outdoor",
    categoria: "franelas",
    categoriaLabel: "Franelas",
    precio: 16,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 13.5 }, { desde: 50, precio: 11.5 } ],
    rating: 4.8,
    reviews: 41,
    modoStock: "pedido",
    tallas: TALLAS_ADULTO.slice(),
    stockTallas: {},
    stock: 0,
    colores: coloresPrenda(),
    prenda: { tipo: "manga-larga", cuello: "redondo" },
    ubicaciones: UBICACIONES.slice(),
    permiteDiseno: true,
    diasProduccion: 4,
    pedidoMinimo: 1,
    etiquetas: ["Protección UV"],
    resumen: "Manga larga con protección solar UPF 50+, en blanco, negro, rojo o azul. Tu logo al frente, en la espalda o a lo largo de las mangas. Para pesca, playa, ciclismo y trabajo al aire libre.",
    descripcion: "Pensada para pasar el día bajo el sol: la tela bloquea la radiación UV, es ligera y seca rápido. Las mangas largas tienen un área de 8 × 30 cm, perfecta para el logo del club o el nombre del torneo.",
    destacados: [
      "Protección solar UPF 50+",
      "Logo en frente, espalda y a lo largo de las mangas",
      "Ligera y de secado rápido",
    ],
    specs: {
      Material: "Microfibra 100 % poliéster UPF 50+, 130 g/m²",
      Colores: "Blanco · Negro · Rojo · Azul",
      Técnica: "Sublimación por transferencia",
      "Área de impresión": "Frente y espalda hasta 30 × 40 cm · Mangas 8 × 30 cm",
      Cuello: "Redondo",
      Cuidado: CUIDADO,
      Producción: "4 días hábiles tras aprobar el diseño",
    },
    imagenes: ["mockup:manga-larga-uv:frente", "mockup:manga-larga-uv:espalda"],
    opiniones: [
      { autor: "Club de Pesca Morrocoy", estrellas: 5, fecha: "28 jul 2026", texto: "Logo al pecho y el nombre del torneo en la manga. Las usamos todo el torneo y nadie se quemó." },
    ],
  },
  {
    id: "franela-nino",
    nombre: "Franela para niños con tu logo",
    linea: "Kids",
    categoria: "ninos",
    categoriaLabel: "Niños",
    precio: 9,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 7.5 }, { desde: 50, precio: 6.5 } ],
    rating: 4.9,
    reviews: 66,
    modoStock: "pedido",
    tallas: ["2", "4", "6", "8", "10", "12", "14"],
    stockTallas: {},
    stock: 0,
    colores: coloresPrenda(),
    prenda: { tipo: "franela", cuello: "redondo", infantil: true },
    ubicaciones: UBICACIONES.slice(),
    permiteDiseno: true,
    diasProduccion: 3,
    pedidoMinimo: 1,
    etiquetas: ["Cumpleaños"],
    resumen: "Franela infantil en tela fría (blanco, negro, rojo o azul), perfecta para cumpleaños, graduaciones de preescolar y uniformes escolares.",
    descripcion: "El pedido favorito para las fiestas: el personaje o el logo del cumpleaños al frente y el nombre en la espalda. Si quieres personalizarlas una a una, escribe en las indicaciones qué nombre va en cada talla.",
    destacados: [
      "Tallas de la 2 a la 14",
      "Logo al frente, nombre en la espalda",
      "Precio especial desde 12 unidades para fiestas",
    ],
    specs: {
      Material: "Tela fría 100 % poliéster, 150 g/m²",
      Colores: "Blanco · Negro · Rojo · Azul",
      Técnica: "Sublimación por transferencia",
      "Área de impresión": "Frente y espalda hasta 22,5 × 30 cm · Mangas 6,7 × 6,7 cm",
      Cuello: "Redondo",
      Cuidado: CUIDADO,
      Producción: "3 días hábiles tras aprobar el diseño",
    },
    imagenes: ["mockup:franela-nino:frente", "mockup:franela-nino:espalda"],
    opiniones: [
      { autor: "Yuleisy F.", estrellas: 5, fecha: "02 ago 2026", texto: "Hice 25 para el cumple de mi hija. Todos los niños felices con su nombre en la espalda." },
    ],
  },
  {
    id: "kit-uniforme",
    nombre: "Kit uniforme deportivo",
    linea: "Equipos",
    categoria: "deportiva",
    categoriaLabel: "Deportiva",
    precio: 26,
    precioAnterior: null,
    preciosMayor: [ { desde: 15, precio: 23 }, { desde: 30, precio: 20 } ],
    rating: 4.8,
    reviews: 23,
    modoStock: "pedido",
    tallas: ["8", "10", "12", "14"].concat(TALLAS_ADULTO),
    stockTallas: {},
    stock: 0,
    colores: coloresPrenda(),
    prenda: { tipo: "franela", cuello: "v" },
    ubicaciones: UBICACIONES.slice(),
    permiteDiseno: true,
    diasProduccion: 6,
    pedidoMinimo: 8,
    etiquetas: ["Equipos", "Mínimo 8"],
    resumen: "Franela y short en dry-fit, en blanco, negro, rojo o azul, con el escudo del equipo donde lo quieras y nombre y número por jugador.",
    descripcion: "Coloca el escudo en el simulador de la franela (pecho, espalda o mangas); el short lleva el número en la pierna. Pedido mínimo de 8 kits. Escribe en las indicaciones la lista de jugadores con talla, nombre y número, o envíala después por WhatsApp.",
    destacados: [
      "Franela + short en dry-fit, en 4 colores",
      "Escudo donde lo quieras, nombre y número por jugador",
      "Mínimo 8 kits · mejor precio desde 15",
    ],
    specs: {
      Material: "Dry-fit 100 % poliéster",
      Colores: "Blanco · Negro · Rojo · Azul",
      Técnica: "Sublimación por transferencia",
      "Área de impresión": "Franela: frente 30 × 37,5 cm, espalda 30 × 40 cm, mangas 9 × 9 cm · Short: número en la pierna",
      Incluye: "Franela + short",
      Cuidado: CUIDADO,
      Producción: "6 días hábiles tras aprobar el diseño",
    },
    imagenes: ["mockup:kit-uniforme:frente", "mockup:kit-uniforme:espalda"],
    opiniones: [
      { autor: "Academia Futuro FC", estrellas: 5, fecha: "20 jul 2026", texto: "Tercer año que hacemos los uniformes con ellos. Cumplen con la fecha del torneo." },
    ],
  },
  {
    id: "taza-11oz",
    nombre: "Taza sublimada 11 oz",
    linea: "Tazas",
    categoria: "hogar",
    categoriaLabel: "Hogar y regalos",
    precio: 7,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 5.5 }, { desde: 36, precio: 4.5 } ],
    rating: 4.8,
    reviews: 158,
    modoStock: "stock",
    tallas: [],
    stockTallas: {},
    stock: 72,
    colores: [ { nombre: "Blanca", hex: "#FFFFFF" }, { nombre: "Interior naranja", hex: "#E16539" }, { nombre: "Interior negro", hex: "#303030" } ],
    prenda: { tipo: "taza" },
    ubicaciones: ["frente", "espalda"],
    permiteDiseno: true,
    diasProduccion: 1,
    pedidoMinimo: 1,
    etiquetas: ["Regalo"],
    resumen: "Taza de cerámica con recubrimiento para sublimar. Tu foto, frase o logo a todo color alrededor de la taza.",
    descripcion: "El regalo que nunca falla: día de la madre, cumpleaños, aniversarios o el recuerdo de tu evento corporativo. La imagen se fija con calor sobre el recubrimiento de la cerámica y resiste el lavado a mano.",
    destacados: [
      "Impresión envolvente a todo color",
      "Lista en 24 horas",
      "Caja individual para regalo incluida",
    ],
    specs: {
      Material: "Cerámica AAA con recubrimiento de poliéster",
      Técnica: "Sublimación en prensa de tazas",
      "Área de impresión": "20 × 9 cm envolvente",
      Capacidad: "11 oz (325 ml)",
      Cuidado: "Lavar a mano · No usar esponja abrasiva · Apta para microondas",
      Producción: "1 día hábil tras aprobar el diseño",
    },
    imagenes: ["objeto:taza:1", "objeto:taza:2"],
    opiniones: [
      { autor: "Paola S.", estrellas: 5, fecha: "11 ago 2026", texto: "La foto de mis hijos quedó preciosa. Mi mamá lloró." },
      { autor: "Inversiones K&R", estrellas: 4, fecha: "25 jul 2026", texto: "50 tazas con el logo para los clientes. Muy bien empacadas." },
    ],
  },
  {
    id: "gorra-trucker",
    nombre: "Gorra trucker sublimada",
    linea: "Accesorios",
    categoria: "accesorios",
    categoriaLabel: "Accesorios",
    precio: 9,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 7.5 }, { desde: 50, precio: 6 } ],
    rating: 4.6,
    reviews: 39,
    modoStock: "stock",
    tallas: [],
    stockTallas: {},
    stock: 45,
    colores: [ { nombre: "Malla negra", hex: "#303030" }, { nombre: "Malla turquesa", hex: "#51ABB2" }, { nombre: "Malla blanca", hex: "#FFFFFF" } ],
    prenda: { tipo: "gorra" },
    ubicaciones: ["frente"],
    permiteDiseno: true,
    diasProduccion: 2,
    pedidoMinimo: 1,
    etiquetas: [],
    resumen: "Gorra trucker con frente de espuma blanca para sublimar y malla trasera. Ajustable con broche.",
    descripcion: "El frente de espuma recibe la sublimación con colores muy vivos. Ideal para marcas, eventos, promociones y despedidas de soltero.",
    destacados: [
      "Frente sublimado a todo color",
      "Talla única ajustable",
      "Tres colores de malla",
    ],
    specs: {
      Material: "Frente de espuma poliéster · malla de nylon",
      Técnica: "Sublimación en prensa de gorras",
      "Área de impresión": "Frente 11 × 7 cm",
      Talla: "Única, ajustable con broche",
      Cuidado: "Limpiar con paño húmedo",
      Producción: "2 días hábiles tras aprobar el diseño",
    },
    imagenes: ["objeto:gorra:1", "objeto:gorra:2"],
    opiniones: [],
  },
  {
    id: "mousepad",
    nombre: "Mousepad sublimado",
    linea: "Oficina",
    categoria: "accesorios",
    categoriaLabel: "Accesorios",
    precio: 6,
    precioAnterior: null,
    preciosMayor: [ { desde: 12, precio: 4.8 }, { desde: 50, precio: 4 } ],
    rating: 4.7,
    reviews: 28,
    modoStock: "stock",
    tallas: [],
    stockTallas: {},
    stock: 3,
    colores: [],
    prenda: { tipo: "mousepad" },
    ubicaciones: ["frente"],
    permiteDiseno: true,
    diasProduccion: 1,
    pedidoMinimo: 1,
    etiquetas: [],
    resumen: "Mousepad de tela con base de goma antideslizante. Tu foto o el logo de tu empresa en el escritorio.",
    descripcion: "Un detalle corporativo económico y útil. La superficie de tela sublimada es suave para el mouse y la base de goma no se mueve.",
    destacados: [
      "Superficie de tela sublimada",
      "Base de goma antideslizante de 3 mm",
      "Listo en 24 horas",
    ],
    specs: {
      Material: "Tela poliéster con base de goma",
      Técnica: "Sublimación en prensa plana",
      "Área de impresión": "22 × 18 cm completa",
      Grosor: "3 mm",
      Cuidado: "Limpiar con paño húmedo",
      Producción: "1 día hábil tras aprobar el diseño",
    },
    imagenes: ["objeto:mousepad:1", "objeto:mousepad:2"],
    opiniones: [],
  },
  {
    id: "cojin-40",
    nombre: "Cojín sublimado 40 × 40",
    linea: "Hogar",
    categoria: "hogar",
    categoriaLabel: "Hogar y regalos",
    precio: 14,
    precioAnterior: 16,
    preciosMayor: [ { desde: 6, precio: 12 } ],
    rating: 4.9,
    reviews: 19,
    modoStock: "pedido",
    tallas: [],
    stockTallas: {},
    stock: 0,
    colores: [],
    prenda: { tipo: "cojin" },
    ubicaciones: ["frente", "espalda"],
    permiteDiseno: true,
    diasProduccion: 3,
    pedidoMinimo: 1,
    etiquetas: ["Regalo"],
    resumen: "Funda de cojín en tela tipo satín con relleno incluido. Fotos familiares, mascotas o frases.",
    descripcion: "La funda se sublima por ambas caras y se cierra con cremallera oculta, así puedes lavarla aparte. Incluye el relleno de fibra siliconada.",
    destacados: [
      "Sublimado por ambas caras",
      "Relleno incluido",
      "Funda lavable con cremallera oculta",
    ],
    specs: {
      Material: "Funda satín poliéster · relleno de fibra siliconada",
      Técnica: "Sublimación en prensa plana",
      "Área de impresión": "40 × 40 cm por cara",
      Medidas: "40 × 40 cm",
      Cuidado: "Lavar la funda al revés con agua fría",
      Producción: "3 días hábiles tras aprobar el diseño",
    },
    imagenes: ["objeto:cojin:1", "objeto:cojin:2"],
    opiniones: [
      { autor: "Daniel V.", estrellas: 5, fecha: "14 ago 2026", texto: "Le regalé a mi novia uno con la foto de nuestro perro. Quedó perfecto." },
    ],
  },
];

/* Estados por los que pasa un pedido (usados en el seguimiento).
   Siempre 6 y en este orden: el panel y el backend usan los índices
   (0 recibido · 1 pago · 2 diseño · 3 producción · 4 despacho/listo · 5 entregado). */
STAMPY.estados = [
  { id: "recibido", titulo: "Pedido recibido", icono: "receipt", texto: "Registramos tu pedido y te enviamos el resumen por WhatsApp." },
  { id: "pago", titulo: "Pago verificado", icono: "shield", texto: "Confirmamos tu pago contra el estado de cuenta del banco." },
  { id: "diseno", titulo: "Diseño aprobado", icono: "sparkle", texto: "Te enviamos la prueba de diseño por WhatsApp y la aprobaste." },
  { id: "produccion", titulo: "En producción", icono: "print", texto: "Estamos imprimiendo el papel y sublimando tus piezas en la plancha." },
  { id: "enviado", titulo: "Despachado", icono: "truck", texto: "Tu pedido salió del taller rumbo a la dirección de entrega." },
  { id: "entregado", titulo: "Entregado", icono: "check", texto: "El pedido fue entregado y firmado por el destinatario." },
];

/* Variante de estados cuando el cliente retira en el taller */
STAMPY.estadosTienda = [
  { id: "recibido", titulo: "Pedido recibido", icono: "receipt", texto: "Registramos tu pedido y te enviamos el resumen por WhatsApp." },
  { id: "pago", titulo: "Pago verificado", icono: "shield", texto: "Confirmamos tu pago contra el estado de cuenta del banco." },
  { id: "diseno", titulo: "Diseño aprobado", icono: "sparkle", texto: "Te enviamos la prueba de diseño por WhatsApp y la aprobaste." },
  { id: "produccion", titulo: "En producción", icono: "print", texto: "Estamos imprimiendo el papel y sublimando tus piezas en la plancha." },
  { id: "listo", titulo: "Listo para retirar", icono: "store", texto: "Puedes pasar por el taller con tu cédula y el número de pedido." },
  { id: "entregado", titulo: "Retirado", icono: "check", texto: "Retiraste tu pedido en el taller. ¡Que lo disfrutes!" },
];
