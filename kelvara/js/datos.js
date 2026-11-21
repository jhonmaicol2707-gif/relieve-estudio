/* datos.js — MODELO: los datos de la tienda en un solo sitio.
 * Kelvara es una marca de muestra (proyecto de portafolio). Los productos de la web son reales y están en
 * index.html con su fuente en aviso.html. Regla: nada inventado; un dato que no se conoce se deja vacío ("").
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Kelvara",
    lema: "De la caja negra al regalo",
    contacto: {
      telefono: "",                        // sin teléfono de llamadas en la muestra
      whatsapp: "573126103137",            // solo dígitos con prefijo (wa.me)
      whatsappVisible: "+57 312 610 3137", // cómo se muestra en la página
      email: "",
      direccion: "",
      mapa: "",
      horario: ""
    },
    redes: { instagram: "", facebook: "", tiktok: "", linkedin: "", youtube: "" },

    /* Mensaje que sale escrito en WhatsApp. {producto} se sustituye por el producto del botón (data-producto). */
    mensajes: {
      blackfriday: "Hola, Kelvara. Quiero saber el precio de Black Friday de: {producto}.",
      navidad: "Hola, Kelvara. Busco un regalo de Navidad: {producto}. ¿Qué precio tiene?",
      general: "Hola, Kelvara. Quiero saber los precios de Black Friday de la selección."
    },

    /* Fechas reales de la temporada (hora local del visitante). La cuenta atrás va a la siguiente que no haya
       pasado; el día de la fecha dice "Hoy"; cuando pasan todas, desaparece. Nada de cronómetros que se reinician. */
    calendario: [
      { nombre: "Black Friday", fecha: "2026-11-27" },
      { nombre: "Navidad", fecha: "2026-12-25" }
    ],

    formulario: { destino: "", metodo: "POST" },   // sin formulario: la conversación es por WhatsApp
    shopify: { dominio: "", productos: [] }
  };
})();
