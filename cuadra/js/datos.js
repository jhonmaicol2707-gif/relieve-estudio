/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, teléfono, horario, planes y opciones de la demo sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un hueco visible
 * ("Por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: "Cuadra" es una marca inventada. Los precios de los planes son RANGOS DE REFERENCIA DEL MERCADO
 * con su fuente (planes publicados por Alegra y Siigo en noviembre de 2026), no tarifas de Cuadra. Un negocio real
 * escribe sus precios en "propio" y confirma su habilitación como proveedor tecnológico, horario, NIT y dirección.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Cuadra",
    lema: "Software de gestión para pymes y contadores",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp, la agenda de demos y el formulario usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      /* ►►► NÚMERO PARA LLAMAR (botones "Llamar"): formato internacional con +57 */
      telefono: "+573126103137",
      telefonoTexto: "312 610 3137",
      email: "",
      direccion: "",         // p. ej. "Cra. 43A # …, El Poblado, Medellín"
      horario: "",           // p. ej. "Lunes a viernes, 8:00 a. m. – 6:00 p. m."
      proveedor: "",         // p. ej. "Proveedor tecnológico habilitado por la DIAN (Resolución n.º …)" — solo si es verdad
      nit: ""
    },
    redes: { linkedin: "", instagram: "", youtube: "" },

    mensajes: {
      whatsapp: "Hola, Cuadra. Quiero conocer el software."
    },

    /* Vacío = el formulario abre WhatsApp con el mensaje escrito (sin servidor). */
    formulario: { destino: "", metodo: "POST" },

    /* Fuentes de los rangos de los planes. */
    fuentes: {
      alegra: { nombre: "Alegra, planes Colombia", url: "https://www.alegra.com/colombia/" },
      siigo: { nombre: "Siigo, planes y precios", url: "https://www.siigo.com/precios-siigo/" }
    },

    /* Planes. desde/hasta = rango mensual de referencia en pesos (planes publicados de software comparable).
       "propio" = precio de ESTE negocio (solo números o un texto). Vacío = "Por confirmar". */
    planes: [
      { id: "factura", nombre: "Factura", para: "Solo facturar electrónicamente", desde: 9992, hasta: 92318,
        refs: "Siigo Facturación electrónica 24 a 1500 documentos al año (pago anual)", fuentes: ["siigo"],
        incluye: ["Factura electrónica de venta", "Notas crédito y débito", "1 usuario", "App en el celular"], propio: "" },
      { id: "emprende", nombre: "Emprende", para: "Negocio que arranca", desde: 74900, hasta: 145993,
        refs: "Alegra Emprendedor · Siigo Profesional independiente", fuentes: ["alegra", "siigo"],
        incluye: ["Todo lo de Factura", "Contabilidad automática", "Inventario básico", "1 usuario + tu contador"], propio: "" },
      { id: "pyme", nombre: "Pyme", para: "Equipo pequeño que crece", desde: 163900, hasta: 191327, destacado: true,
        refs: "Alegra Pyme · Siigo Emprendedor (3 usuarios)", fuentes: ["alegra", "siigo"],
        incluye: ["Todo lo de Emprende", "2 a 3 usuarios", "Varias bodegas", "Reportes y conciliación bancaria"], propio: "" },
      { id: "empresa", nombre: "Empresa", para: "Operación grande", desde: 207869, hasta: 319900,
        refs: "Siigo Premium (5 usuarios) · Alegra Plus", fuentes: ["siigo", "alegra"],
        incluye: ["Todo lo de Pyme", "5 usuarios o más", "Nómina electrónica", "Soporte prioritario"], propio: "" }
    ],
    planesNota: "Rangos mensuales de referencia de planes publicados por Alegra y Siigo (noviembre de 2026), no tarifas de Cuadra. Siigo cobra en pago anual (valor mensual equivalente con descuento de cliente nuevo); los planes no son idénticos entre marcas.",

    /* Agenda de demos: tipos de negocio, volumen de facturas (con el plan que sugiere), días y franjas.
       Días y franjas son de EJEMPLO hasta que el negocio confirme (la web lo dice). */
    demo: {
      confirmada: false,
      negocios: ["Comercio o tienda", "Servicios", "Restaurante o café", "Profesional independiente", "Distribuidora", "Otro"],
      volumen: [
        { id: "v1", nombre: "Hasta 20 al mes", plan: "factura" },
        { id: "v2", nombre: "20 a 100", plan: "emprende" },
        { id: "v3", nombre: "100 a 500", plan: "pyme" },
        { id: "v4", nombre: "Más de 500", plan: "empresa" }
      ],
      clientesContador: ["1 a 5 clientes", "6 a 20 clientes", "21 a 50 clientes", "Más de 50 clientes"],
      dias: [1, 2, 3, 4, 5],
      adelante: 10,
      franjas: [
        { nombre: "Mañana", ayuda: "8 a. m. – 12 m." },
        { nombre: "Tarde", ayuda: "2 – 6 p. m." }
      ]
    }
  };
})();
