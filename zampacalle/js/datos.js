/* datos.js — MODELO: los datos del negocio en un solo sitio.
 * Quien mantenga la web cambia aquí WhatsApp, horario, la carta, los precios y las fotos sin tocar el diseño.
 * Regla: nada inventado. Si un dato no se conoce, se deja vacío ("") y la web muestra un hueco visible
 * ("Dirección por confirmar") o esconde lo que dependa de él.
 *
 * ESTO ES UNA DEMO: la marca "Zampacalle", los productos y los precios son DE EJEMPLO.
 */
(function () {
  "use strict";
  window.SITIO = {
    marca: "Zampacalle",
    lema: "Comidas rápidas con todo",

    contacto: {
      /* ►►► NÚMERO DE WHATSAPP: aquí se cambia. Solo dígitos, con el 57 de Colombia delante.
         Todos los botones de WhatsApp y el pedido usan este número. */
      whatsapp: "573126103137",
      whatsappTexto: "+57 312 610 3137",   // cómo se ve escrito en la página
      telefono: "",          // formato internacional: +576011234567 (si hay línea fija para llamar)
      email: "",
      direccion: "",         // p. ej. "Calle 00 # 00-00, Barrio, Ciudad"  (vacío = hueco "Dirección de ejemplo")
      mapa: "",              // enlace a la ficha de Google Maps
      horario: "",           // p. ej. "Lunes a domingo, 5:00 p. m. a 11:00 p. m."
      zonas: "",             // barrios con domicilio, p. ej. "Chapinero, Teusaquillo y Galerías"
      pagos: ""              // p. ej. "Efectivo, Nequi, Daviplata y tarjeta"
    },
    redes: { instagram: "", facebook: "", tiktok: "" },

    /* Mensaje que sale escrito al pulsar "Pedir solo este" en un producto.
       {producto} se cambia por el nombre del producto. */
    mensajes: {
      whatsapp: "Hola, Zampacalle. Quiero pedir: {producto}. ¿Me confirman disponibilidad y tiempo de entrega?"
    },

    /* El formulario de contacto genérico no se usa: el pedido arma su propio mensaje (js/app.js). */
    formulario: { destino: "", metodo: "POST" },

    /* Pedido: se guarda en el navegador del visitante (por si cierra la página). No se envía a ningún servidor. */
    pedido: {
      guardar: true,
      clave: "zampacalle-pedido",
      personasMax: 20,
      saludo: "Hola, Zampacalle. Quiero hacer este pedido desde la web:",
      despedida: "Quedo atento a la confirmación. ¡Gracias!"
    },

    /* ============================ LA CARTA ============================
     * precio: en pesos colombianos, sin puntos (13900 = $13.900). SON PRECIOS DE EJEMPLO.
     * imagen: ruta de la foto. Todas las fotos de la carta están en assets/img/carta/.
     *   Para poner la foto real del cliente: guarda su foto con el MISMO nombre (p. ej. perro-zampa.webp),
     *   o pon aquí la ruta nueva. Proporción recomendada 4:3 (cuadrada en adicionales y bebidas), 900 px de ancho.
     *   Vacío ("") = la tarjeta usa un dibujo propio (campo "dibujo") en lugar de foto.
     * credito: nombre del autor de la foto de banco (la licencia completa está en creditos.html). Bórralo al
     *   poner fotos propias del cliente.
     */
    carta: {
      moneda: "COP",
      notaPrecios: "Precios de ejemplo",
      categorias: [
        { id: "perros", nombre: "Perros calientes", corto: "Perros" },
        { id: "hamburguesas", nombre: "Hamburguesas", corto: "Hamburguesas" },
        { id: "arepas", nombre: "Arepas rellenas", corto: "Arepas" },
        { id: "salchipapas", nombre: "Salchipapas", corto: "Salchipapas" },
        { id: "adicionales", nombre: "Adicionales", corto: "Adicionales", compacta: true },
        { id: "bebidas", nombre: "Bebidas", corto: "Bebidas", compacta: true }
      ],
      productos: [
        { id: "perro-zampa", categoria: "perros", nombre: "Perro Zampa", precio: 13900,
          descripcion: "Salchicha americana a la plancha, salsa de queso, tomate, jalapeño y ensalada de repollo crocante.",
          imagen: "assets/img/carta/perro-zampa.webp", alt: "Perro caliente con salsa de queso, tomate y jalapeños, con ensalada de repollo", credito: "jeffreyw" },
        { id: "perro-chili", categoria: "perros", nombre: "Perro Chili", precio: 16900,
          descripcion: "Salchicha americana, carne molida guisada en casa, cheddar rallado y cebolla blanca picada.",
          imagen: "assets/img/carta/perro-chili.webp", alt: "Perros calientes cubiertos de carne molida, cheddar rallado y cebolla picada", credito: "jeffreyw" },
        { id: "perro-con-todo", categoria: "perros", nombre: "Perro Con Todo", precio: 19900, etiqueta: "De la casa",
          descripcion: "Salchicha envuelta en tocineta, huevo revuelto con cebollín, queso fundido y salsa de tomate.",
          imagen: "assets/img/carta/perro-con-todo.webp", alt: "Perro caliente con salchicha en tocineta, huevo revuelto y queso fundido", credito: "PersonalCreations.com" },

        { id: "burger-clasica", categoria: "hamburguesas", nombre: "Zampa Clásica", precio: 21900,
          descripcion: "Carne de res de 150 g a la plancha, cheddar fundido, cebolla y salsa de la casa en pan brioche. Con papas en cascos.",
          imagen: "assets/img/carta/burger-clasica.webp", alt: "Hamburguesa con cheddar fundido y papas en cascos", credito: "vwcampin" },
        { id: "burger-doble", categoria: "hamburguesas", nombre: "Doble Bulla", precio: 29900, etiqueta: "Doble carne",
          descripcion: "Dos carnes de 150 g, doble cheddar, tocineta crocante, cebolla caramelizada y salsa BBQ.",
          imagen: "assets/img/carta/burger-doble.webp", alt: "Hamburguesa alta de doble carne con queso sobre una tabla de madera", credito: "homegets.com" },
        { id: "burger-cebollona", categoria: "hamburguesas", nombre: "La Cebollona", precio: 24900,
          descripcion: "Carne de 150 g con una montaña de cebolla caramelizada, queso suizo y salsa de ajo.",
          imagen: "assets/img/carta/burger-cebollona.webp", alt: "Hamburguesa mordida con carne jugosa y cebolla caramelizada", credito: "pellesten" },
        { id: "burger-pollo", categoria: "hamburguesas", nombre: "Pollo Crocante", precio: 22900,
          descripcion: "Pechuga apanada crocante, salsa picante suave, lechuga y pan con ajonjolí.",
          imagen: "assets/img/carta/burger-pollo.webp", alt: "Hamburguesa de pollo apanado con pan de ajonjolí y papas", credito: "Aditya Pratap Singh" },

        { id: "arepa-desmechada", categoria: "arepas", nombre: "Arepa de Desmechada", precio: 15900,
          descripcion: "Arepa de maíz asada, rellena de carne desmechada en hogao y queso costeño rallado.",
          imagen: "assets/img/carta/arepa-desmechada.webp", alt: "Arepa asada rellena de carne desmechada", credito: "avlxyz" },
        { id: "arepa-mixta", categoria: "arepas", nombre: "Arepa Mixta", precio: 17900,
          descripcion: "Carne y pollo desmechados en hogao, mozzarella fundida y salsa de la casa.",
          imagen: "assets/img/carta/arepa-mixta.webp", alt: "Arepa abierta con relleno abundante de carne desmechada", credito: "avlxyz" },
        { id: "arepa-choclo", categoria: "arepas", nombre: "Arepa de Choclo con Queso", precio: 12900,
          descripcion: "Arepa dulce de maíz tierno con mantequilla y una tajada de queso campesino que se derrite.",
          imagen: "", dibujo: "arepa", alt: "" },

        { id: "salchipapa-callejera", categoria: "salchipapas", nombre: "Salchipapa Callejera", precio: 15900,
          descripcion: "Papas a la francesa, salchicha a la plancha en rodajas y las salsas de la casa.",
          imagen: "assets/img/carta/salchipapa-callejera.webp", alt: "Papas a la francesa con salchicha en salsa", credito: "rawpixel (dominio público)" },
        { id: "salchipapa-con-todo", categoria: "salchipapas", nombre: "Salchipapa Con Todo", precio: 26900, etiqueta: "Para compartir",
          descripcion: "Papas, salchicha, chorizo, tocineta, huevos de codorniz, queso gratinado y papita ripio.",
          imagen: "", dibujo: "salchipapa", alt: "" },

        { id: "papas-francesa", categoria: "adicionales", nombre: "Papas a la francesa", precio: 6900,
          descripcion: "Porción para acompañar.", imagen: "assets/img/carta/papas-francesa.webp", alt: "Papas a la francesa", credito: "Ross Catrow" },
        { id: "queso-extra", categoria: "adicionales", nombre: "Queso gratinado extra", precio: 3500,
          descripcion: "Para cualquier perro, arepa o salchipapa.", imagen: "", dibujo: "queso" },
        { id: "tocineta-extra", categoria: "adicionales", nombre: "Tocineta extra", precio: 4500,
          descripcion: "Crocante, en tiras.", imagen: "", dibujo: "tocineta" },
        { id: "huevos-codorniz", categoria: "adicionales", nombre: "Huevos de codorniz ×5", precio: 3900,
          descripcion: "El toque que pide un perro con todo.", imagen: "", dibujo: "huevos" },

        { id: "limonada-hierbabuena", categoria: "bebidas", nombre: "Limonada de hierbabuena", precio: 7500,
          descripcion: "Natural, con hielo.", imagen: "assets/img/carta/limonada-hierbabuena.webp", alt: "Jarra de limonada con hierbabuena y rodajas de limón", credito: "Jakub Kapusnak (rawpixel, CC0)" },
        { id: "jugo-mango", categoria: "bebidas", nombre: "Jugo de mango en leche", precio: 8500,
          descripcion: "Fruta natural, vaso de 400 ml.", imagen: "assets/img/carta/jugo-mango.webp", alt: "Vaso de jugo de mango con hierbabuena", credito: "Matthias Rhomberg" },
        { id: "jugo-maracuya", categoria: "bebidas", nombre: "Jugo de maracuyá en agua", precio: 6900,
          descripcion: "Fruta natural, vaso de 400 ml.", imagen: "assets/img/carta/jugo-maracuya.webp", alt: "Jarra y vaso de jugo amarillo de fruta", credito: "Breville USA" },
        { id: "gaseosa", categoria: "bebidas", nombre: "Gaseosa personal", precio: 4500,
          descripcion: "400 ml, varios sabores.", imagen: "", dibujo: "gaseosa" }
      ]
    },

    shopify: { dominio: "", productos: [] }
  };
})();
