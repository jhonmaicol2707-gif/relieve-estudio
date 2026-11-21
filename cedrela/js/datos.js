/* datos.js — MODELO: los datos del proyecto inmobiliario en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, sala de ventas, tipologías, precios y supuestos del simulador
 * sin tocar el diseño. Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un
 * hueco visible ("Dirección por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: "Cedrela" es una marca inventada. Las tipologías son EJEMPLOS para enseñar el diseño;
 * los precios del m² son REFERENCIAS DEL MERCADO con su fuente, no precios del proyecto. Una constructora real
 * escribe sus áreas, sus precios y sus datos legales (licencia, radicado, fiduciaria).
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Cedrela",
    lema: "Apartamentos sobre planos en Medellín",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp, el simulador y el formulario usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      telefono: "",          // fijo o celular para llamar, formato +576041234567
      email: "",
      sector: "",            // p. ej. "Loma de Los Bernal, Medellín" (dónde está el lote)
      salaVentas: "",        // dirección de la sala de ventas, p. ej. "Carrera 00 # 00-00, Medellín"
      mapa: "",              // enlace a la ficha de Google Maps de la sala de ventas
      horario: "",           // p. ej. "Lunes a sábado 9:00 a. m. – 6:00 p. m. · Domingos 10:00 a. m. – 4:00 p. m."
      entrega: "",           // fecha estimada de entrega, p. ej. "Segundo semestre de 2028"
      constructora: "",      // razón social de la constructora
      fiduciaria: "",        // sociedad fiduciaria que recibe los pagos (encargo fiduciario)
      licencia: "",          // número de la licencia de construcción y curaduría
      radicado: ""           // radicado de enajenación ante la Alcaldía de Medellín (Decreto 1077 de 2015)
    },
    redes: { instagram: "", facebook: "", tiktok: "" },

    mensajes: {
      whatsapp: "Hola, Cedrela. Quiero información del proyecto y agendar una visita a la sala de ventas."
    },

    /* Vacío = el formulario abre WhatsApp con el mensaje escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Tipologías. EJEMPLOS de la demo: una constructora real escribe sus áreas (las del plano aprobado).
       "precio" = precio de lista real del proyecto, en pesos y solo números (p. ej. 489000000).
       Mientras esté vacío, la web dice "Precio por confirmar" y el simulador parte de una estimación con el
       precio de referencia del m² (precios.referenciaM2), avisándolo. */
    tipologias: [
      { id: "a", nombre: "Tipo A", area: 54, alcobas: 2, banos: 2, extras: ["Balcón", "Cocina abierta", "Zona de ropas"], precio: "" },
      { id: "b", nombre: "Tipo B", area: 68, alcobas: 3, banos: 2, extras: ["Balcón", "Cocina abierta", "Zona de ropas"], precio: "" },
      { id: "c", nombre: "Tipo C", area: 82, alcobas: 3, banos: 2, extras: ["Estudio", "Balcón", "Zona de ropas"], precio: "" }
    ],

    /* Precios de referencia del m² (apartamentos de 50 a 100 m², precio de publicación, agosto de 2026).
       Son del mercado, NO de este proyecto. */
    precios: {
      fuente: "Metrocuadrado, análisis de 41.000 apartamentos en venta publicados en agosto de 2026",
      fuenteUrl: "https://www.metrocuadrado.com/noticias/precios-m2/cual-es-el-precio-del-metro-cuadrado-en-venta-en-medellin-y-los-municipios-del-valle-de-aburra-7053",
      referenciaM2: 8920000,          // Medellín, estratos 5 y 6, 50–100 m² (lo usa el simulador si no hay precio propio)
      referenciaTexto: "Medellín, estratos 5 y 6",
      lista: [
        { lugar: "Medellín",   e34: "$6,50 millones", e56: "$8,92 millones" },
        { lugar: "Envigado",   e34: "$7,97 millones", e56: "$9,29 millones" },
        { lugar: "Sabaneta",   e34: "$7,18 millones", e56: "$7,69 millones" },
        { lugar: "Itagüí",     e34: "$6,84 millones", e56: "$7,43 millones" },
        { lugar: "Bello",      e34: "$5,45 millones", e56: "$6,65 millones" },
        { lugar: "La Estrella",e34: "$6,34 millones", e56: "$6,63 millones" }
      ]
    },

    /* Supuestos del simulador (el visitante puede cambiarlos). Un proyecto real pone aquí SUS condiciones:
       separación, % de cuota inicial y meses hasta la escrituración. */
    simulador: {
      separacion: 5000000,     // EJEMPLO de la demo
      cuotaInicial: 30,        // % del precio; en vivienda sobre planos suele ir del 20 % al 30 % (Metrocuadrado, Fincaraíz)
      meses: 24,               // EJEMPLO: meses para pagar la cuota inicial durante la obra
      tasa: 13,                // % efectivo anual de referencia; editable por el visitante
      tasaNota: "Tasas de crédito hipotecario no VIS reportadas a la Superintendencia Financiera entre 11,55 % y 16,99 % E.A. (corte del 6 de febrero de 2026, según Noticias RCN).",
      tasaFuenteUrl: "https://www.noticiasrcn.com/economia/bancos-con-la-tasa-mas-baja-para-comprar-casa-en-2026-993955",
      plazo: 20                // años del crédito
    }
  };
})();
