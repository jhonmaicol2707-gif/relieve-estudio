/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, teléfono, horario, precios y municipios sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un hueco visible
 * ("Horario por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: "Alisio" es una marca inventada. Los precios de la tabla son REFERENCIAS DEL MERCADO con su
 * fuente (lista oficial de EPM a tu puerta 2026), no tarifas de Alisio. Un negocio real escribe sus precios en
 * la columna "propio" y confirma sus municipios, horario, garantía y certificación.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Alisio",
    lema: "Aire acondicionado y refrigeración en Medellín",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp, la calculadora, el diagnóstico y el formulario usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      /* ►►► NÚMERO PARA LLAMAR (botones "Llamar"): formato internacional con +57 */
      telefono: "+573126103137",
      telefonoTexto: "312 610 3137",
      email: "",
      horario: "",           // p. ej. "Lunes a sábado, 7:00 a. m. – 6:00 p. m."
      urgencias: "",         // p. ej. "Urgencias los domingos y festivos con recargo" (solo si es verdad)
      garantia: "",          // p. ej. "3 meses en mano de obra, por escrito" (lo que ofrezca de verdad)
      certificacion: "",     // p. ej. "Técnicos certificados por el SENA en buenas prácticas en refrigeración"
      visita: "",            // valor de la visita o diagnóstico, p. ej. "$80.000, se descuenta si haces el arreglo"
      nit: ""
    },
    redes: { instagram: "", facebook: "", tiktok: "" },

    mensajes: {
      whatsapp: "Hola, Alisio. Necesito un técnico para mi aire acondicionado."
    },

    /* Vacío = el formulario abre WhatsApp con el mensaje escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Servicios. "referencia" = precio de la lista oficial de EPM a tu puerta 2026 (IVA incluido, repuestos
       aparte). "propio" = precio de ESTE negocio, en pesos y solo números (p. ej. 180000). Mientras esté vacío,
       la web dice "Por confirmar". */
    precios: {
      fuente: "EPM a tu puerta, precios de servicios técnicos vigentes para 2026",
      fuenteUrl: "https://www.epm.com.co/epmatupuerta/listado-de-precios/",
      lista: [
        { id: "inst-split",  servicio: "Instalación de mini split",          equipo: "Mini split", referencia: 490700, propio: "" },
        { id: "mant-split",  servicio: "Mantenimiento de mini split",        equipo: "Mini split", referencia: 255700, propio: "" },
        { id: "inst-ventana",servicio: "Instalación de aire de ventana",     equipo: "Ventana",    referencia: 207800, propio: "" },
        { id: "mant-ventana",servicio: "Mantenimiento de aire de ventana",   equipo: "Ventana",    referencia: 292600, propio: "" },
        { id: "inst-casete", servicio: "Instalación de aire tipo casete",    equipo: "Casete",     referencia: 699800, propio: "" },
        { id: "mant-casete", servicio: "Mantenimiento de aire tipo casete",  equipo: "Casete",     referencia: 363500, propio: "" },
        { id: "mant-nevera", servicio: "Mantenimiento de nevera o nevecón",  equipo: "Nevera",     referencia: 248900, propio: "" },
        { id: "diagnostico", servicio: "Diagnóstico técnico",                equipo: "Cualquiera", referencia: 90800,  propio: "" }
      ],
      nota: "IVA incluido. Los repuestos van aparte, con cotización previa. Fuera del Área Metropolitana del Valle de Aburrá, EPM suma $16.000 de desplazamiento.",
      equipo: "Un equipo inverter de 12.000 BTU con instalación cuesta en Medellín entre $1,8 y $3,2 millones, según la marca (guía de precios de ManoRapido).",
      equipoUrl: "https://manorapido.com/articulo/aire-acondicionado-medellin-precios-guia-2025"
    },

    /* Calculadora de BTU: regla de Midea Colombia (área × 600 BTU y ajustes). */
    btu: {
      porM2: 600, sol: 0.10, techo: 0.10, porPersona: 600, personasBase: 2, porAparato: 400,
      tamanos: [9000, 12000, 18000, 24000, 36000],
      fuente: "Midea Colombia, guía de BTU para aire acondicionado (16 de enero de 2026)",
      fuenteUrl: "https://www.midea.com/co/blog/que-significa-btu-en-aire-acondicionado"
    },

    /* Municipios del Área Metropolitana del Valle de Aburrá, de sur a norte.
       coberturaConfirmada: false = la web los rotula "cobertura de ejemplo". El negocio pone cubre: false en los
       que no atiende y coberturaConfirmada: true cuando la lista sea la suya. */
    coberturaConfirmada: false,
    cobertura: [
      { municipio: "Caldas", cubre: true },
      { municipio: "La Estrella", cubre: true },
      { municipio: "Sabaneta", cubre: true },
      { municipio: "Itagüí", cubre: true },
      { municipio: "Envigado", cubre: true },
      { municipio: "Medellín", cubre: true },
      { municipio: "Bello", cubre: true },
      { municipio: "Copacabana", cubre: true },
      { municipio: "Girardota", cubre: true },
      { municipio: "Barbosa", cubre: true }
    ]
  };
})();
