/* datos.js — MODELO: los datos de la clínica en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, dirección, horario, equipo y precios sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un hueco visible
 * ("Dirección por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: la marca "Casa Molar" es inventada. Los precios son RANGOS DE REFERENCIA DEL MERCADO
 * en Bogotá (fuente abajo), no tarifas de una clínica. Una clínica real escribe los suyos en "precio".
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Casa Molar",
    lema: "Odontología familiar en Bogotá",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp y el formulario usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      telefono: "",          // fijo o celular para llamar, formato +576011234567
      email: "",
      direccion: "",         // p. ej. "Calle 00 # 00-00, consultorio 000, Barrio, Bogotá"
      mapa: "",              // enlace a la ficha de Google Maps
      horario: "",           // p. ej. "Lunes a viernes 7:00 a. m. – 7:00 p. m. · Sábados 8:00 a. m. – 1:00 p. m."
      urgencias: "",         // p. ej. "Urgencias por WhatsApp hasta las 9:00 p. m."
      pagos: "",             // p. ej. "Efectivo, tarjetas, Nequi y financiación con …"
      convenios: "",         // prepagadas o convenios, p. ej. "Colsanitas, Sura…" (solo si son reales)
      reps: ""               // código de habilitación en el REPS (Resolución 3100 de 2019)
    },
    redes: { instagram: "", facebook: "", tiktok: "" },

    mensajes: {
      whatsapp: "Hola, Casa Molar. Quiero pedir una cita de valoración."
    },

    /* Vacío = el formulario abre WhatsApp con el mensaje escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Equipo: SOLO profesionales reales, con su registro (RETHUS / tarjeta profesional).
       Mientras "nombre" esté vacío, la tarjeta muestra el hueco "Nombre y registro por confirmar". */
    equipo: [
      { rol: "Odontopediatría",        nombre: "", registro: "" },
      { rol: "Ortodoncia",             nombre: "", registro: "" },
      { rol: "Odontología general",    nombre: "", registro: "" },
      { rol: "Endodoncia y rehabilitación", nombre: "", registro: "" }
    ],

    /* Precios. "rango" = referencia del mercado en Bogotá (no es la tarifa de esta clínica).
       "precio" = tarifa propia de la clínica: escríbela y la tabla la muestra en su columna. */
    precios: {
      fuente: "cuantomecuesta.com/co/dentista, actualizado en abril de 2026",
      fuenteUrl: "https://cuantomecuesta.com/co/dentista/",
      lista: [
        { id: "valoracion",    tratamiento: "Consulta de valoración",        detalle: "Diagnóstico y plan",          rango: "$50.000 – $150.000",      precio: "" },
        { id: "limpieza",      tratamiento: "Limpieza (profilaxis)",          detalle: "Con flúor · cada 6 meses",    rango: "$60.000 – $180.000",      precio: "" },
        { id: "resina",        tratamiento: "Resina",                         detalle: "Por diente",                  rango: "$80.000 – $400.000",      precio: "" },
        { id: "extraccion",    tratamiento: "Extracción simple",              detalle: "Por diente",                  rango: "$80.000 – $250.000",      precio: "" },
        { id: "endodoncia",    tratamiento: "Endodoncia",                     detalle: "Según el diente",             rango: "$350.000 – $1.200.000",   precio: "" },
        { id: "blanqueamiento",tratamiento: "Blanqueamiento en consultorio",  detalle: "Sesión en clínica",           rango: "$400.000 – $1.500.000",   precio: "" },
        { id: "corona",        tratamiento: "Corona",                         detalle: "Por diente",                  rango: "$800.000 – $3.500.000",   precio: "" },
        { id: "ortodoncia",    tratamiento: "Ortodoncia con brackets",        detalle: "Tratamiento completo",        rango: "$3.500.000 – $7.000.000", precio: "" },
        { id: "implante",      tratamiento: "Implante",                       detalle: "Sin la corona",               rango: "$3.000.000 – $8.000.000", precio: "" }
      ]
    }
  };
})();
