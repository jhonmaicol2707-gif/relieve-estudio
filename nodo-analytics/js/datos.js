/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí correo, enlaces o precio sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y app.js oculta lo que dependa de él.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Nodo Analytics",
    lema: "Inteligencia artificial para saber cuánto inventario comprar",

    /* Precio de entrada (dato del cliente). Si cambia, se cambia solo aquí: la página lo actualiza sola.
       Recuerda cambiarlo también en el bloque "application/ld+json" de index.html (lo lee Google). */
    plan: { desde: "49", moneda: "USD", periodo: "mes" },

    contacto: {
      telefono: "+573126103137",          // demo: número de contacto actual · formato internacional: +57 300 000 0000
      whatsapp: "573126103137",          // demo: número de contacto actual · solo dígitos con prefijo: 573000000000
      email: "",             // PENDIENTE · correo que recibe las solicitudes de demo
      direccion: "",         // PENDIENTE
      mapa: "",
      horario: ""
    },
    redes: { instagram: "", facebook: "", tiktok: "", linkedin: "", youtube: "" },   // PENDIENTE

    /* Formulario de demo: a dónde se envía.
       Vacío = abre WhatsApp o el correo del visitante con la solicitud ya escrita (necesita whatsapp o email arriba).
       Con un servicio de formularios (Formspree, Web3Forms, el del hosting) pega aquí su dirección. */
    formulario: { destino: "", metodo: "POST" },

    /* Tienda Shopify: no aplica a esta web. */
    shopify: { dominio: "", productos: [] }
  };
})();
