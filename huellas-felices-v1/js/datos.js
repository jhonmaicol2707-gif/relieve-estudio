/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí teléfono, horarios, enlaces o precios sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y app.js oculta lo que dependa de él.
 *
 * WhatsApp y teléfono: de momento el número de contacto de la demo; cámbialo por el de la clínica.
 * PENDIENTE DE LA CLÍNICA (ahora mismo vacíos): email, direccion, mapa, horario y redes.
 * Mientras falten datos, arriba de la página aparece un aviso de "versión de muestra" que se quita solo al rellenar los datos.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Huellas Felices",
    lema: "Clínica veterinaria para perros y gatos en Medellín",
    ciudad: "Medellín, Colombia",
    contacto: {
      telefono: "+573126103137",          // demo: número de contacto actual · formato internacional: +576040000000 o +573000000000
      whatsapp: "573126103137",          // demo: número de contacto actual · solo dígitos con el prefijo de Colombia (57): 573000000000
      email: "",
      direccion: "",         // calle, número y barrio
      mapa: "",              // enlace a su ficha de Google Maps
      horario: ""            // horario de consulta, peluquería y guardería (las urgencias son 24 horas)
    },
    redes: { instagram: "", facebook: "", tiktok: "", linkedin: "", youtube: "" },

    /* Formulario: a dónde se envía. Vacío = el formulario abre WhatsApp con el mensaje ya escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Tienda Shopify (no se usa en esta web). */
    shopify: { dominio: "", productos: [] }
  };
})();
