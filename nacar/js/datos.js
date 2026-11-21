/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, teléfono, horario, precios, duraciones y franjas sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un hueco visible
 * ("Por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: "Nácar" es una marca inventada. Los precios son RANGOS DE REFERENCIA DEL MERCADO con su fuente
 * (ColombiaMove 2026, guía nacional; y precios publicados por salones de Medellín en Fresha), no tarifas de Nácar.
 * Las duraciones son orientativas. Un negocio real escribe sus precios en "propio" y confirma duraciones,
 * horario, dirección y franjas.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Nácar",
    lema: "Estudio de belleza en Medellín",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp, el reservador y el formulario usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      /* ►►► NÚMERO PARA LLAMAR (botones "Llamar"): formato internacional con +57 */
      telefono: "+573126103137",
      telefonoTexto: "312 610 3137",
      email: "",
      direccion: "",         // p. ej. "Cra. 35 # 8A-…, El Poblado, Medellín"
      mapa: "",              // enlace de Google Maps del local
      horario: "",           // p. ej. "Lunes a sábado, 9:00 a. m. – 7:00 p. m."
      nit: ""
    },
    redes: { instagram: "", tiktok: "", facebook: "" },

    mensajes: {
      whatsapp: "Hola, Nácar. Quiero reservar una cita."
    },

    /* Vacío = el formulario abre WhatsApp con el mensaje escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Fuentes de los precios de referencia (cada fila de la tabla dice cuál usa). */
    fuentes: {
      cm: { nombre: "ColombiaMove 2026", url: "https://colombiamove.com/blog/es/haircuts-spas-personal-care-colombia/" },
      fresha: { nombre: "Salones de Medellín en Fresha", url: "https://www.fresha.com/lp/en/bt/hair-salons/in/co-medell%C3%ADn" }
    },

    /* Servicios. desde/hasta = rango de referencia en pesos. min = duración orientativa en minutos.
       "propio" = precio de ESTE negocio (solo números o un texto como "desde 90000"). Vacío = "Por confirmar".
       El reservador usa esta misma lista (id, nombre, grupo, min, desde, hasta). */
    servicios: [
      { id: "corte",     servicio: "Corte y peinado",              grupo: "Cabello", min: 60,  desde: 20000,  hasta: 180000, fuente: "cm",     propio: "" },
      { id: "cepillado", servicio: "Cepillado",                    grupo: "Cabello", min: 45,  desde: 15000,  hasta: 60000,  fuente: "cm",     propio: "" },
      { id: "color",     servicio: "Color (proceso único)",        grupo: "Cabello", min: 120, desde: 80000,  hasta: 300000, fuente: "cm",     propio: "" },
      { id: "decolor",   servicio: "Decoloración y tintura",       grupo: "Cabello", min: 180, desde: 200000, hasta: 0,      fuente: "fresha", propio: "" },
      { id: "keratina",  servicio: "Keratina",                     grupo: "Cabello", min: 150, desde: 150000, hasta: 400000, fuente: "cm",     propio: "" },
      { id: "hidrata",   servicio: "Hidratación profunda",         grupo: "Cabello", min: 60,  desde: 150000, hasta: 0,      fuente: "fresha", propio: "" },
      { id: "mani",      servicio: "Manicura tradicional",         grupo: "Uñas",    min: 45,  desde: 8000,   hasta: 25000,  fuente: "cm",     propio: "" },
      { id: "gel",       servicio: "Manicura en gel",              grupo: "Uñas",    min: 75,  desde: 25000,  hasta: 60000,  fuente: "cm",     propio: "" },
      { id: "pedi",      servicio: "Pedicura",                     grupo: "Uñas",    min: 60,  desde: 15000,  hasta: 45000,  fuente: "cm",     propio: "" },
      { id: "pedispa",   servicio: "Pedicura spa con gel",         grupo: "Uñas",    min: 90,  desde: 75000,  hasta: 0,      fuente: "fresha", propio: "" },
      { id: "cejas",     servicio: "Diseño de cejas (hilo o tinte)", grupo: "Mirada", min: 30, desde: 8000,   hasta: 30000,  fuente: "cm",     propio: "" },
      { id: "pestanas",  servicio: "Relleno de pestañas volumen",  grupo: "Mirada",  min: 90,  desde: 165000, hasta: 0,      fuente: "fresha", propio: "" },
      { id: "facial",    servicio: "Limpieza facial",              grupo: "Mirada",  min: 60,  desde: 50000,  hasta: 150000, fuente: "cm",     propio: "" }
    ],
    preciosNota: "Rangos de referencia del mercado, no tarifas de Nácar. ColombiaMove da rangos nacionales (de salón de barrio a alta gama); las filas «desde» son precios publicados por salones de El Poblado en Fresha. El precio final depende del largo del cabello, el producto y el diseño.",

    /* Reservador: días que se ofrecen (0 = domingo … 6 = sábado), cuántos días hacia delante y las franjas.
       Son de EJEMPLO hasta que el negocio confirme su horario (la web lo dice). */
    reserva: {
      confirmada: false,
      dias: [1, 2, 3, 4, 5, 6],
      adelante: 14,
      franjas: [
        { id: "manana", nombre: "Mañana", ayuda: "9:00 – 12:00" },
        { id: "mediodia", nombre: "Mediodía", ayuda: "12:00 – 3:00" },
        { id: "tarde", nombre: "Tarde", ayuda: "3:00 – 7:00" }
      ]
    }
  };
})();
