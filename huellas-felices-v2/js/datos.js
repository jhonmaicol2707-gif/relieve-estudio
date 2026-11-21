/* datos.js — MODELO: los datos de Huellas Felices en un solo sitio.
 * Quien mantenga la web cambia aquí teléfono, WhatsApp, dirección u horario sin tocar el diseño.
 * Regla: nada inventado. Lo que la clínica aún no ha confirmado se deja vacío ("") y la web lo muestra
 * como pendiente (o lo oculta, si es un botón secundario). La franja "Muestra" de arriba desaparece sola
 * cuando WhatsApp, teléfono, dirección y horario están rellenos.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Huellas Felices",
    lema: "Cuidamos a tu perro y a tu gato. De día y de noche.",
    ciudad: "Medellín, Colombia",
    zonaHoraria: "America/Bogota",     // para el reloj de "Urgencias abiertas"
    contacto: {
      telefono: "+573126103137",          // demo: número de contacto actual · formato internacional: +57 604 000 0000
      whatsapp: "573126103137",          // demo: número de contacto actual · solo dígitos con el prefijo de Colombia: 573000000000
      email: "",             // PENDIENTE (opcional)
      direccion: "",         // PENDIENTE · p. ej. "Calle 00 # 00-00, barrio, Medellín"
      mapa: "",              // PENDIENTE · enlace de Google Maps de la clínica
      horario: ""            // PENDIENTE · horario de consulta, peluquería y guardería
    },
    redes: { instagram: "", facebook: "", tiktok: "" },

    /* Formulario: vacío = compone el mensaje y abre el WhatsApp del visitante (sin servidor, sin guardar nada). */
    formulario: { destino: "", metodo: "POST" },

    shopify: { dominio: "", productos: [] }
  };
})();
