/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, teléfono, horario, precios y municipios sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un hueco visible
 * ("Por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: "Fasor" es una marca inventada. Los precios son RANGOS DE REFERENCIA DEL MERCADO con su fuente
 * (Sendwork 2026, Presucosto 2026 y EPM a tu puerta 2026), no tarifas de Fasor. Un negocio real escribe sus precios
 * en "propio" y confirma municipios, horario, matrícula y garantía.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Fasor",
    lema: "Electricistas a domicilio en Medellín",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp, el cotizador, la guía y el formulario usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      /* ►►► NÚMERO PARA LLAMAR (botones "Llamar"): formato internacional con +57 */
      telefono: "+573126103137",
      telefonoTexto: "312 610 3137",
      email: "",
      horario: "",           // p. ej. "Lunes a sábado, 7:00 a. m. – 6:00 p. m."
      urgencias: "",         // p. ej. "Urgencias todos los días con recargo" (solo si es verdad)
      garantia: "",          // p. ej. "6 meses en mano de obra, por escrito"
      matricula: "",         // p. ej. "Matrícula CONTE n.º … (técnico responsable)" — verificable en conte.org.co
      visita: "",            // p. ej. "$90.000, se descuenta si haces el arreglo"
      nit: ""
    },
    redes: { instagram: "", facebook: "", tiktok: "" },

    mensajes: {
      whatsapp: "Hola, Fasor. Necesito un electricista."
    },

    /* Vacío = el formulario abre WhatsApp con el mensaje escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Fuentes de los precios de referencia (cada fila de la tabla dice cuál usa). */
    fuentes: {
      sendwork: { nombre: "Sendwork 2026", url: "https://blog-es.sendwork.com/precios-electricistas-colombia/" },
      presucosto: { nombre: "Presucosto 2026", url: "https://presucosto.com/blog/precio-punto-electrico-colombia-2026" },
      epm: { nombre: "EPM a tu puerta 2026", url: "https://www.epm.com.co/epmatupuerta/listado-de-precios/" }
    },

    /* Servicios. desde/hasta = rango de referencia en pesos (con materiales salvo que diga lo contrario).
       "propio" = precio de ESTE negocio (solo números o un texto como "desde 90000"). Vacío = "Por confirmar". */
    precios: {
      lista: [
        { servicio: "Visita de diagnóstico (Medellín)",        grupo: "Revisión", desde: 80000,  hasta: 120000,  fuente: "sendwork",   propio: "" },
        { servicio: "Diagnóstico de daños eléctricos",          grupo: "Revisión", desde: 90800,  hasta: 0,       fuente: "epm",        propio: "" },
        { servicio: "Cambio de toma o interruptor",             grupo: "Puntos",   desde: 40000,  hasta: 80000,   fuente: "sendwork",   propio: "" },
        { servicio: "Toma doble nueva",                         grupo: "Puntos",   desde: 85000,  hasta: 120000,  fuente: "presucosto", propio: "" },
        { servicio: "Toma con polo a tierra",                   grupo: "Puntos",   desde: 95000,  hasta: 130000,  fuente: "presucosto", propio: "" },
        { servicio: "Toma GFCI para baño o cocina",             grupo: "Puntos",   desde: 120000, hasta: 180000,  fuente: "presucosto", propio: "" },
        { servicio: "Punto de iluminación",                     grupo: "Puntos",   desde: 95000,  hasta: 150000,  fuente: "presucosto", propio: "" },
        { servicio: "Punto 220 V (aire acondicionado, ducha)",  grupo: "Puntos",   desde: 180000, hasta: 280000,  fuente: "presucosto", propio: "" },
        { servicio: "Cambio de breaker o tablero parcial",      grupo: "Tablero",  desde: 120000, hasta: 350000,  fuente: "sendwork",   propio: "" },
        { servicio: "Tablero residencial (Medellín)",           grupo: "Tablero",  desde: 450000, hasta: 800000,  fuente: "sendwork",   propio: "" },
        { servicio: "Puesta a tierra",                          grupo: "Tablero",  desde: 200000, hasta: 350000,  fuente: "presucosto", propio: "" },
        { servicio: "Revisión de carga y balanceo",             grupo: "Revisión", desde: 200000, hasta: 500000,  fuente: "sendwork",   propio: "" },
        { servicio: "Certificación RETIE de una instalación",   grupo: "Revisión", desde: 300000, hasta: 800000,  fuente: "sendwork",   propio: "" },
        { servicio: "Acometida nueva",                          grupo: "Tablero",  desde: 800000, hasta: 2500000, fuente: "sendwork",   propio: "" }
      ],
      nota: "Rangos de referencia del mercado, no tarifas de Fasor. Presucosto da valores nacionales con materiales (±15 %); Sendwork da la fila de Medellín y rangos nacionales, y suma de +50 % a +100 % por urgencias. EPM: IVA incluido."
    },

    /* Cotizador por puntos: rangos de Presucosto 2026 (nacional, ±15 %). mo = solo mano de obra; con = con materiales. */
    cotizador: {
      fuente: "Presucosto, precio de punto eléctrico en Colombia 2026",
      fuenteUrl: "https://presucosto.com/blog/precio-punto-electrico-colombia-2026",
      urgencia: [0.5, 1.0],        // recargo de urgencia de referencia (Sendwork): +50 % a +100 %
      puntos: [
        { id: "toma",     nombre: "Toma doble",                 ayuda: "Sala, alcobas, estudio",   mo: [35000, 50000],  con: [85000, 120000] },
        { id: "tierra",   nombre: "Toma con polo a tierra",     ayuda: "Computador, nevera, TV",   mo: [40000, 55000],  con: [95000, 130000] },
        { id: "gfci",     nombre: "Toma GFCI",                  ayuda: "Baño, cocina, patio",      mo: [45000, 65000],  con: [120000, 180000] },
        { id: "luz",      nombre: "Punto de iluminación",       ayuda: "Lámpara con su interruptor", mo: [40000, 65000], con: [95000, 150000] },
        { id: "p220",     nombre: "Punto 220 V",                ayuda: "Aire acondicionado, ducha", mo: [65000, 100000], con: [180000, 280000] }
      ]
    },

    /* Municipios del Área Metropolitana del Valle de Aburrá, de sur a norte.
       coberturaConfirmada: false = la web los rotula "cobertura de ejemplo". */
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
