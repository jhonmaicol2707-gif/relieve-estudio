/* datos.js — lo que se cambia sin tocar el diseño: contacto del estudio y las fichas del catálogo.
 * Cada ficha: slug (carpeta de la demo en este mismo sitio), video (archivo en videos/), sector, categoría y 3 puntos.
 */
window.CATALOGO = {
  estudio: "Relieve Estudio",
  whatsapp: "573126103137",                       // solo dígitos con el prefijo de Colombia
  mensajeGeneral: "Hola, Relieve Estudio. WEB: quiero una landing page para mi negocio.",
  mensajeFicha: "Hola, Relieve Estudio. Vi el catálogo y quiero una landing como la de {sector} para mi negocio.",

  categorias: ["Todas", "Salud", "Servicios", "Comida y belleza", "Tiendas", "Software", "Inmobiliario"],

  fichas: [
    { slug: "huellas-felices-v2", variante: { slug: "huellas-felices-v1", texto: "Versión sobria" },
      video: "veterinarias", sector: "Veterinarias", categoria: "Salud", demo: "Huellas Felices",
      puntos: ["Huella 3D hecha de partículas", "Urgencias 24 h con reloj «abierto ahora»", "Cita por WhatsApp con el mensaje escrito"] },
    { slug: "casa-molar", video: "odontologia", sector: "Odontología", categoria: "Salud", demo: "Casa Molar",
      puntos: ["Diente 3D que se abre por capas", "Precios de referencia explicados", "Cita para toda la familia por WhatsApp"] },
    { slug: "alisio", video: "aire-acondicionado", sector: "Aire acondicionado", categoria: "Servicios", demo: "Alisio",
      puntos: ["Copo de hielo 3D que se vuelve un equipo", "Calculadora de BTU por cuarto", "Diagnóstico por síntomas y WhatsApp"] },
    { slug: "fasor", video: "electricistas", sector: "Electricistas", categoria: "Servicios", demo: "Fasor",
      puntos: ["Placa de circuito 3D que se enciende", "Cotizador por puntos", "Cotización detallada por WhatsApp"] },
    { slug: "zampacalle", video: "comidas-rapidas", sector: "Comidas rápidas", categoria: "Comida y belleza", demo: "Zampacalle",
      puntos: ["Hamburguesa 3D que se arma por capas", "Carta con filtros que suma sola", "Pedido por WhatsApp con el total"] },
    { slug: "nacar", video: "belleza", sector: "Belleza y uñas", categoria: "Comida y belleza", demo: "Nácar",
      puntos: ["Frasco de esmalte 3D por capas", "Precios y duraciones claros", "Reserva: servicio, día y franja"] },
    { slug: "kelvara", video: "tienda-tecnologia", sector: "Tienda de tecnología", categoria: "Tiendas", demo: "Kelvara",
      puntos: ["Productos presentados como lanzamientos", "Precio por WhatsApp en cada producto", "De Black Friday a Navidad al bajar"] },
    { slug: "cuadra", video: "software-gestion", sector: "Software de gestión", categoria: "Software", demo: "Cuadra",
      puntos: ["Panel de cristal 3D por capas", "Pestañas: empresas o contadores", "Agenda de demo por WhatsApp"] },
    { slug: "nodo-analytics", video: "startups-software", sector: "Startups de software e IA", categoria: "Software", demo: "Nodo Analytics",
      puntos: ["Escena 3D de datos", "Precio claro desde el principio", "Formulario de demo que llega a WhatsApp"] },
    { slug: "cedrela", video: "vivienda", sector: "Proyectos de vivienda", categoria: "Inmobiliario", demo: "Cedrela",
      puntos: ["Torre 3D que se vuelve plano", "Apartamentos por tipología", "Simulador de cuota y WhatsApp"] }
  ]
};
