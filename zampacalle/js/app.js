/* app.js — CONTROLADOR: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escena 3D, menú, capa cinematográfica) ya lo hacen js/motor.js y js/cine.js.
 * Aquí va lo propio de Zampacalle: la carta (pintada desde datos.js), los filtros, el pedido (cantidades,
 * total, domicilio / recoger / mesa), la hoja del pedido en el móvil, la barra fija y el mensaje de WhatsApp.
 * Cada función se lanza con L3D.seguro() para que un fallo en una parte no deje el resto sin funcionar.
 *
 * Atributos genéricos que entiende (se rellenan desde datos.js):
 *   <a data-enlace="whatsapp|telefono|email|mapa|instagram…" data-mensaje="…" data-respaldo="#donde">
 *     (sin data-mensaje usa SITIO.mensajes.whatsapp; {producto} = data-producto del botón o de su tarjeta)
 *   <span data-dato="direccion" data-pendiente="Dirección por confirmar">   <span data-si-falta="telefono">
 *   <p data-pendientes="direccion,horario" data-pendientes-texto="…" hidden>   <span data-anio>
 * Propios: [data-carta] [data-filtros] [data-pedido] [data-pedido-form] [data-abrir-pedido] [data-cerrar-pedido]
 *   [data-pedido-cuenta] [data-pedido-total] [data-barra]
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {};
  var raiz = document.documentElement;
  var CARTA = S.carta || { categorias: [], productos: [] };
  var CONF = S.pedido || {};

  var NOMBRES = { whatsapp: "WhatsApp", telefono: "teléfono", email: "correo", direccion: "dirección",
                  horario: "horario", mapa: "mapa", zonas: "barrios con domicilio", pagos: "medios de pago" };

  function valorDe(tipo) { return contacto[tipo] || (S.redes || {})[tipo] || ""; }
  function urlWhatsapp(texto) {
    return "https://wa.me/" + String(contacto.whatsapp || "").replace(/\D/g, "") + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }
  function pesos(n) { return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto != null) el.textContent = texto;
    return el;
  }
  function icono(id, tam) {
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"), uso = document.createElementNS(ns, "use");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("width", tam || 18); svg.setAttribute("height", tam || 18);
    svg.setAttribute("aria-hidden", "true"); uso.setAttribute("href", "#" + id); svg.appendChild(uso);
    return svg;
  }
  var esHoja = function () { return !window.matchMedia("(min-width: 1024px)").matches; };
  var anunciar = function (texto) { var a = document.querySelector("[data-anuncio]"); if (a) { a.textContent = ""; setTimeout(function () { a.textContent = texto; }, 30); } };

  // ================================================================ DIBUJOS para productos sin foto
  // Ilustraciones propias (trazo 3 px, una tinta). Se usan mientras el cliente no tenga su foto.
  var DIBUJOS = {
    arepa: '<ellipse cx="60" cy="66" rx="40" ry="17" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 60c0-11 18-20 40-20s40 9 40 20" fill="none" stroke="currentColor" stroke-width="3"/><path d="M34 52l6-4m10 6 7-5m11 5 6-4m-34 8 5-3" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M28 70c10 6 54 6 64 0" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/><rect x="44" y="30" width="32" height="10" rx="2" fill="currentColor" opacity=".9" transform="rotate(-8 60 35)"/>',
    salchipapa: '<path d="M22 50h76l-9 42H31z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M36 50l-4-26m14 26 1-30m11 30 4-28m10 28 8-24m-46 6 3 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><ellipse cx="46" cy="48" rx="9" ry="5" fill="currentColor"/><ellipse cx="72" cy="46" rx="9" ry="5" fill="currentColor"/><circle cx="60" cy="40" r="4" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="84" cy="38" r="3.5" fill="none" stroke="currentColor" stroke-width="3"/>',
    queso: '<path d="M20 78l66-36 14 12v24z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M20 78h80" stroke="currentColor" stroke-width="3"/><circle cx="52" cy="70" r="5" fill="currentColor"/><circle cx="78" cy="62" r="4" fill="currentColor"/><circle cx="88" cy="72" r="3" fill="currentColor"/>',
    tocineta: '<path d="M18 50c12-12 22 12 34 0s22 12 34 0 12-6 16-6M18 66c12-12 22 12 34 0s22 12 34 0 12-6 16-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18 58c12-12 22 12 34 0s22 12 34 0 12-6 16-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 7"/>',
    huevos: '<ellipse cx="44" cy="60" rx="14" ry="18" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="74" cy="56" rx="14" ry="18" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="74" cy="58" r="6" fill="currentColor"/><path d="M38 52l4 2m4 8 3-1" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    gaseosa: '<path d="M44 30h32l-4 62H48z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M62 30l8-14h8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="56" cy="56" r="2.5" fill="currentColor"/><circle cx="64" cy="68" r="3" fill="currentColor"/><circle cx="57" cy="78" r="2" fill="currentColor"/><path d="M46 44h28" stroke="currentColor" stroke-width="3"/>'
  };
  function dibujo(nombre) {
    var span = crear("span");
    span.innerHTML = '<svg viewBox="0 0 120 110" aria-hidden="true">' + (DIBUJOS[nombre] || DIBUJOS.arepa) + "</svg>";
    return span.firstChild;
  }

  // ================================================================ ESTADO DEL PEDIDO
  var productos = {}, orden = [];
  (CARTA.productos || []).forEach(function (p) { productos[p.id] = p; orden.push(p.id); });
  var estado = { items: {}, entrega: "Domicilio", nombre: "", barrio: "" };

  function cargar() {
    if (!CONF.guardar) return;
    try {
      var guardado = JSON.parse(localStorage.getItem(CONF.clave || "pedido") || "null");
      if (guardado && guardado.items) {
        Object.keys(guardado.items).forEach(function (id) {
          var n = parseInt(guardado.items[id], 10);
          if (productos[id] && n > 0) estado.items[id] = Math.min(n, 99);
        });
        ["entrega", "nombre", "barrio"].forEach(function (k) { if (typeof guardado[k] === "string") estado[k] = guardado[k]; });
      }
    } catch (e) { /* navegador sin almacenamiento: el pedido funciona igual, solo no se recuerda */ }
  }
  function guardar() {
    if (!CONF.guardar) return;
    try { localStorage.setItem(CONF.clave || "pedido", JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ }
  }
  function cuenta() { var n = 0; for (var id in estado.items) n += estado.items[id]; return n; }
  function total() { var t = 0; for (var id in estado.items) t += estado.items[id] * (productos[id] ? productos[id].precio : 0); return t; }
  function cambiar(id, delta, fijar) {
    if (!productos[id]) return;
    var antes = estado.items[id] || 0;
    var n = fijar != null ? fijar : antes + delta;
    n = Math.max(0, Math.min(99, n));
    if (n) estado.items[id] = n; else delete estado.items[id];
    guardar();
    pintarPedido();
    pintarControles(id);
    if (n > antes) {
      L.todos("[data-barra] .barra-movil__icono, .nav__pedido .contador").forEach(function (el) {
        el.classList.remove("salta"); void el.offsetWidth; el.classList.add("salta");
      });
      anunciar(productos[id].nombre + " agregado. " + cuenta() + " en tu pedido, total " + pesos(total()) + ".");
    } else anunciar(n ? productos[id].nombre + ": " + n + "." : productos[id].nombre + " quitado del pedido.");
  }

  // ================================================================ CARTA
  function controlCantidad(id, n, etiquetaNombre) {
    var caja = crear("div", "cantidad");
    caja.setAttribute("role", "group"); caja.setAttribute("aria-label", "Cantidad de " + etiquetaNombre);
    var menos = crear("button"); menos.type = "button"; menos.setAttribute("aria-label", "Quitar uno de " + etiquetaNombre);
    menos.appendChild(icono("i-menos", 18)); menos.addEventListener("click", function () { cambiar(id, -1); });
    var salida = crear("output", "", String(n)); salida.setAttribute("aria-live", "off");
    var mas = crear("button"); mas.type = "button"; mas.setAttribute("aria-label", "Agregar otro " + etiquetaNombre);
    mas.appendChild(icono("i-mas", 18)); mas.addEventListener("click", function () { cambiar(id, 1); });
    caja.appendChild(menos); caja.appendChild(salida); caja.appendChild(mas);
    return caja;
  }

  function pintarControles(id) {
    L.todos('[data-control="' + id + '"]').forEach(function (hueco) {
      var p = productos[id], n = estado.items[id] || 0;
      var enfocado = hueco.contains(document.activeElement) ? document.activeElement : null;
      var eraMas = enfocado && /Agregar otro/.test(enfocado.getAttribute("aria-label") || "");
      var eraMenos = enfocado && /Quitar uno/.test(enfocado.getAttribute("aria-label") || "");
      var eraAgregar = enfocado && enfocado.classList.contains("agregar");
      hueco.textContent = "";
      if (!n) {
        var b = crear("button", "agregar"); b.type = "button";
        b.setAttribute("aria-label", "Agregar " + p.nombre + " al pedido");
        b.appendChild(icono("i-mas", 18)); b.appendChild(document.createTextNode("Agregar"));
        b.addEventListener("click", function () { cambiar(id, 1); });
        hueco.appendChild(b);
        if (eraMenos) b.focus();
      } else {
        var ctl = controlCantidad(id, n, p.nombre);
        hueco.appendChild(ctl);
        if (eraMas || eraAgregar) ctl.lastChild.focus(); else if (eraMenos) ctl.firstChild.focus();
      }
    });
  }

  function tarjeta(p, compacta, catNombre) {
    var art = crear("article", "plato" + (compacta ? " plato--compacto" : ""));
    art.setAttribute("data-producto", p.nombre);
    art.setAttribute("data-categoria", p.categoria);
    var fig = crear("figure", "plato__foto");
    if (p.imagen) {
      var img = crear("img");
      img.src = p.imagen; img.alt = p.alt || p.nombre; img.loading = "lazy"; img.decoding = "async";
      img.width = compacta ? 300 : 800; img.height = compacta ? 300 : 600;
      fig.appendChild(img);
    } else {
      fig.className += " plato__foto--dibujo" + (p.categoria === "salchipapas" || p.categoria === "bebidas" ? " rosa" : "");
      fig.appendChild(dibujo(p.dibujo));
      if (!compacta) fig.appendChild(crear("span", "plato__nota-foto", "Ilustración · foto pendiente"));
    }
    if (!compacta) {
      fig.appendChild(crear("span", "plato__cat", catNombre));
      if (p.etiqueta) fig.appendChild(crear("span", "plato__sello", p.etiqueta));
    }
    art.appendChild(fig);

    var cuerpo = crear("div", "plato__cuerpo");
    cuerpo.appendChild(crear(compacta ? "h4" : "h4", "plato__nombre", p.nombre));
    if (p.descripcion) cuerpo.appendChild(crear("p", "plato__desc", p.descripcion));
    var pie = crear("div", "plato__pie");
    var precio = crear("p", "precio", pesos(p.precio));
    precio.appendChild(crear("small", "", "ejemplo"));
    pie.appendChild(precio);
    var hueco = crear("div", "plato__control"); hueco.setAttribute("data-control", p.id);
    pie.appendChild(hueco);
    cuerpo.appendChild(pie);
    if (!compacta) {
      var wa = crear("a", "plato__wa");
      wa.href = "#donde"; wa.setAttribute("data-enlace", "whatsapp"); wa.setAttribute("data-respaldo", "#donde");
      wa.setAttribute("aria-label", "Pedir solo " + p.nombre + " por WhatsApp");
      wa.appendChild(icono("i-wa", 16)); wa.appendChild(document.createTextNode("Pedir solo este por WhatsApp"));
      cuerpo.appendChild(wa);
    }
    art.appendChild(cuerpo);
    return art;
  }

  function carta() {
    var lista = document.querySelector("[data-carta]");
    if (!lista || !(CARTA.productos || []).length) return;
    lista.textContent = "";
    (CARTA.categorias || []).forEach(function (cat) {
      var deCat = CARTA.productos.filter(function (p) { return p.categoria === cat.id; });
      if (!deCat.length) return;
      var grupo = crear("section", "grupo" + (cat.compacta ? " grupo--compacta" : ""));
      grupo.id = "carta-" + cat.id; grupo.setAttribute("data-grupo", cat.id);
      grupo.setAttribute("aria-labelledby", "titulo-" + cat.id);
      var h = crear("h3", "grupo__titulo", cat.nombre); h.id = "titulo-" + cat.id;
      h.appendChild(crear("small", "", String(deCat.length).padStart(2, "0")));
      grupo.appendChild(h);
      var rejilla = crear("div", "grupo__rejilla");
      deCat.forEach(function (p) { rejilla.appendChild(tarjeta(p, cat.compacta, cat.corto || cat.nombre)); });
      grupo.appendChild(rejilla);
      lista.appendChild(grupo);
    });
    orden.forEach(pintarControles);
  }

  function filtros() {
    var caja = document.querySelector("[data-filtros]");
    if (!caja) return;
    var opciones = [{ id: "", corto: "Todo", n: (CARTA.productos || []).length }].concat((CARTA.categorias || []).map(function (c) {
      return { id: c.id, corto: c.corto || c.nombre, n: CARTA.productos.filter(function (p) { return p.categoria === c.id; }).length };
    }));
    opciones.forEach(function (o) {
      var b = crear("button", "filtro", o.corto); b.type = "button";
      b.setAttribute("aria-pressed", o.id ? "false" : "true");
      b.appendChild(crear("small", "", String(o.n)));
      b.addEventListener("click", function () {
        L.todos(".filtro", caja).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        L.todos("[data-grupo]").forEach(function (g) { g.hidden = !!o.id && g.getAttribute("data-grupo") !== o.id; });
        var lista = document.querySelector("[data-carta]");
        var arriba = lista.getBoundingClientRect().top;
        if (arriba < 0 || arriba > window.innerHeight * 0.6) {
          window.scrollTo({ top: window.pageYOffset + arriba - caja.offsetHeight - (parseFloat(getComputedStyle(raiz).getPropertyValue("--nav-alto")) || 4.25) * 16 - 8,
                            behavior: L.reducido ? "auto" : "smooth" });
        }
        anunciar(o.id ? "Mostrando " + o.corto.toLowerCase() : "Mostrando toda la carta");
      });
      caja.appendChild(b);
    });
  }

  // ================================================================ PEDIDO: panel / hoja
  function pintarPedido() {
    var n = cuenta(), t = total();
    L.todos("[data-pedido-cuenta]").forEach(function (el) { el.textContent = String(n); });
    L.todos("[data-pedido-total]").forEach(function (el) { el.textContent = pesos(t); });
    var barra = document.querySelector("[data-barra]");
    if (barra) {
      barra.classList.toggle("barra-vacia", !n);
      var texto = barra.querySelector("[data-barra-texto]");
      if (texto) texto.textContent = n ? "Ver mi pedido (" + n + ")" : "Armar mi pedido";
      var boton = barra.querySelector("a");
      if (boton) boton.setAttribute("aria-label", n ? "Ver mi pedido: " + n + " productos, total de ejemplo " + pesos(t) : "Armar mi pedido: ir a la carta");
    }
    var vacio = document.querySelector("[data-pedido-vacio]"), resumen = document.querySelector("[data-pedido-resumen]");
    if (vacio) vacio.hidden = !!n;
    if (resumen) resumen.hidden = !n;
    var ul = document.querySelector("[data-pedido-items]");
    if (!ul) return;
    var foco = ul.contains(document.activeElement) ? (document.activeElement.getAttribute("aria-label") || "") : "";
    ul.textContent = "";
    orden.forEach(function (id) {
      var q = estado.items[id]; if (!q) return;
      var p = productos[id], li = crear("li", "item");
      var nombre = crear("p", "item__nombre", p.nombre); nombre.appendChild(crear("small", "", pesos(p.precio) + " c/u"));
      li.appendChild(nombre);
      li.appendChild(crear("p", "item__total", pesos(q * p.precio)));
      li.appendChild(controlCantidad(id, q, p.nombre));
      var quitar = crear("button", "item__quitar", "Quitar"); quitar.type = "button";
      quitar.setAttribute("aria-label", "Quitar " + p.nombre + " del pedido");
      quitar.addEventListener("click", function () { cambiar(id, 0, 0); });
      li.appendChild(quitar);
      ul.appendChild(li);
    });
    if (foco) { var mismo = ul.querySelector('[aria-label="' + foco.replace(/"/g, '\\"') + '"]'); if (mismo) mismo.focus(); }
    barraMovil();
  }

  var abridor = null;
  function abrir(origen) {
    var panel = document.getElementById("pedido");
    if (!panel) return;
    if (!esHoja()) { panel.scrollIntoView({ behavior: L.reducido ? "auto" : "smooth", block: "start" }); panel.focus({ preventScroll: true }); return; }
    abridor = origen || document.activeElement;
    raiz.classList.add("pedido-abierto");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true");
    var fondo = document.querySelector(".pedido-fondo"); if (fondo) fondo.hidden = false;
    L.todos("[data-abrir-pedido]").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    // El foco pasa al botón de cerrar. Mientras la hoja termina de entrar, el navegador puede ignorar el
    // primer intento: se reintenta unas veces.
    var x = panel.querySelector("[data-cerrar-pedido]") || panel, intentos = 0;
    (function enfocar() {
      if (!raiz.classList.contains("pedido-abierto")) return;
      x.focus({ preventScroll: true });
      if (document.activeElement !== x && ++intentos < 16) setTimeout(enfocar, 100);
    })();
    barraMovil();
  }
  function cerrar() {
    if (!raiz.classList.contains("pedido-abierto")) return;
    raiz.classList.remove("pedido-abierto");
    var panel = document.getElementById("pedido");
    if (panel) { panel.removeAttribute("role"); panel.removeAttribute("aria-modal"); }
    var fondo = document.querySelector(".pedido-fondo"); if (fondo) setTimeout(function () { if (!raiz.classList.contains("pedido-abierto")) fondo.hidden = true; }, 350);
    L.todos("[data-abrir-pedido]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (abridor && abridor.focus) abridor.focus({ preventScroll: true });
    barraMovil();
  }

  function hoja() {
    L.todos("[data-abrir-pedido]").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function (e) {
        // Con el pedido vacío, la barra lleva a la carta; con productos, abre el pedido
        if (b.closest("[data-barra]") && !cuenta()) {
          e.preventDefault();
          var c = document.getElementById("carta"); if (c) c.scrollIntoView({ behavior: L.reducido ? "auto" : "smooth" });
          return;
        }
        e.preventDefault(); abrir(b);
      });
    });
    L.todos("[data-cerrar-pedido]").forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cerrar();
      if (e.key === "Tab" && raiz.classList.contains("pedido-abierto")) {   // el foco no se escapa de la hoja
        var panel = document.getElementById("pedido");
        var f = L.todos('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', panel)
          .filter(function (x) { return x.offsetParent !== null && !x.classList.contains("solo-lector"); });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener("resize", function () { if (!esHoja()) cerrar(); }, { passive: true });
  }

  /** Barra fija del móvil: aparece al dejar la zona de portada (dentro taparía la hamburguesa y las tarjetas;
   *  ahí el botón "Mi pedido" de la cabecera ya lleva la cuenta), se retira en el cierre si el pedido está
   *  vacío (ahí ya está el botón) y nunca está con la hoja abierta. */
  function barraMovil() {
    var cierre = document.getElementById("contacto"), zona = document.getElementById("inicio");
    var vh = window.innerHeight;
    var trasPortada = zona ? zona.getBoundingClientRect().bottom < vh * 0.9 : window.pageYOffset > vh * 0.75;
    var enCierre = cierre && cierre.getBoundingClientRect().top < vh * 0.55 && !cuenta();
    var visible = trasPortada && !enCierre && !raiz.classList.contains("pedido-abierto");
    raiz.classList.toggle("barra-visible", visible);
  }

  // ================================================================ PEDIDO: formulario y mensaje
  function formularioPedido() {
    var form = document.querySelector("[data-pedido-form]");
    if (!form) return;
    var est = form.querySelector("[data-formulario-estado]");
    function decir(texto, tipo) { if (est) { est.textContent = texto; est.setAttribute("data-tipo", tipo || ""); } }
    var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    var fecha = form.querySelector('[name="Fecha"]'); if (fecha) fecha.min = hoy.toISOString().slice(0, 10);
    var personas = form.querySelector('[name="Personas"]'); if (personas && CONF.personasMax) personas.max = CONF.personasMax;

    function modo() { var r = form.querySelector('[name="Entrega"]:checked'); return r ? r.value : "Domicilio"; }
    function aplicarModo() {
      var m = modo();
      L.todos("[data-solo]", form).forEach(function (bloque) {
        var activo = bloque.getAttribute("data-solo") === m;
        bloque.hidden = !activo;
        // los campos ocultos se desactivan: no se validan ni se envían
        L.todos("input, textarea, select", bloque).concat(bloque.matches("input") ? [bloque] : []).forEach(function (c) { c.disabled = !activo; });
      });
      var txt = form.querySelector("[data-pedido-enviar-texto]");
      if (txt) txt.textContent = m === "Reserva de mesa" ? "Enviar reserva por WhatsApp" : "Enviar pedido por WhatsApp";
    }
    // estado guardado → formulario
    L.todos('[name="Entrega"]', form).forEach(function (r) {
      r.checked = r.value === estado.entrega;
      r.addEventListener("change", function () { estado.entrega = modo(); guardar(); aplicarModo(); decir(""); });
    });
    if (!form.querySelector('[name="Entrega"]:checked')) form.querySelector('[name="Entrega"]').checked = true;
    var nombre = form.querySelector('[name="Nombre"]'), barrio = form.querySelector('[name="Barrio"]');
    if (nombre) { nombre.value = estado.nombre || ""; nombre.addEventListener("change", function () { estado.nombre = nombre.value.trim(); guardar(); }); }
    if (barrio) { barrio.value = estado.barrio || ""; barrio.addEventListener("change", function () { estado.barrio = barrio.value.trim(); guardar(); }); }
    aplicarModo();

    var vaciar = document.querySelector("[data-pedido-vaciar]");
    if (vaciar) vaciar.addEventListener("click", function () {
      var ids = Object.keys(estado.items);
      estado.items = {}; guardar(); pintarPedido(); ids.forEach(pintarControles);
      decir(""); anunciar("Pedido vacío.");
    });

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return;                 // el navegador señala qué falta
      e.preventDefault();
      var trampa = form.querySelector("[name='web']"); if (trampa && trampa.value) return;
      if (!cuenta()) { decir("Tu pedido está vacío: agrega al menos un producto de la carta.", "error"); return; }
      var datos = new FormData(form), m = modo(), lineas = [];
      lineas.push(CONF.saludo || "Hola, quiero hacer este pedido:");
      lineas.push("");
      orden.forEach(function (id) {
        var q = estado.items[id]; if (!q) return;
        lineas.push("• " + q + " × " + productos[id].nombre + " — " + pesos(q * productos[id].precio));
      });
      lineas.push("");
      lineas.push("*Total de ejemplo:* " + pesos(total()) + " (" + cuenta() + (cuenta() === 1 ? " producto" : " productos") + ")");
      lineas.push("*Entrega:* " + m);
      lineas.push("*Nombre:* " + String(datos.get("Nombre") || "").trim());
      if (m === "Domicilio") lineas.push("*Barrio:* " + String(datos.get("Barrio") || "").trim());
      if (m === "Reserva de mesa") {
        var f = String(datos.get("Fecha") || ""), partes = f.split("-");
        lineas.push("*Reserva:* " + (partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : f) + " a las " + datos.get("Hora") + " · " + datos.get("Personas") + " personas");
      }
      var notas = String(datos.get("Notas") || "").trim();
      if (notas) lineas.push("*Notas:* " + notas);
      lineas.push("");
      lineas.push(CONF.despedida || "Gracias.");
      var mensaje = lineas.join("\n");
      estado.nombre = String(datos.get("Nombre") || "").trim();
      if (m === "Domicilio") estado.barrio = String(datos.get("Barrio") || "").trim();
      guardar();
      if (!contacto.whatsapp) {
        console.warn("[app] Falta contacto.whatsapp en js/datos.js: el pedido no tiene a dónde ir.");
        decir("Los pedidos por WhatsApp aún no están activos en esta muestra.", "error");
        return;
      }
      window.open(urlWhatsapp(mensaje), "_blank", "noopener");
      decir("Abrimos tu WhatsApp con el pedido escrito. Solo falta que lo envíes.", "ok");
    });
  }

  // ================================================================ GENÉRICO DE LA PLANTILLA
  function mensajeDe(el) {
    var plantilla = el.getAttribute("data-mensaje") || ((S.mensajes || {}).whatsapp) || "";
    var conProducto = el.closest("[data-producto]");
    var producto = conProducto ? conProducto.getAttribute("data-producto") : "";
    return plantilla.replace(/\{producto\}/g, producto).replace(/\s{2,}/g, " ").trim();
  }
  function enlaces() {
    L.todos("[data-enlace]").forEach(function (el) {
      var tipo = el.getAttribute("data-enlace"), valor = valorDe(tipo);
      if (!valor) {
        var respaldo = el.getAttribute("data-respaldo");
        if (respaldo) { el.href = respaldo; el.hidden = false; el.removeAttribute("target"); }
        else el.hidden = true;
        return;
      }
      el.hidden = false;
      if (tipo === "telefono") el.href = "tel:" + valor.replace(/[^\d+]/g, "");
      else if (tipo === "email") el.href = "mailto:" + valor;
      else if (tipo === "whatsapp") { el.href = urlWhatsapp(mensajeDe(el)); el.target = "_blank"; el.rel = "noopener"; }
      else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }
  function datos() {
    L.todos("[data-dato]").forEach(function (el) {
      var valor = valorDe(el.getAttribute("data-dato")), pendiente = el.getAttribute("data-pendiente");
      if (valor) { el.textContent = (el.getAttribute("data-prefijo") || "") + valor + (el.getAttribute("data-sufijo") || ""); el.classList.remove("pendiente"); el.hidden = false; }
      else if (pendiente) { el.textContent = pendiente; el.classList.add("pendiente"); el.hidden = false; }
      else el.hidden = true;
    });
    L.todos("[data-si-falta]").forEach(function (el) { el.hidden = !!valorDe(el.getAttribute("data-si-falta")); });
  }
  function pendientes() {
    var el = document.querySelector("[data-pendientes]");
    if (!el) return;
    var claves = (el.getAttribute("data-pendientes") || "whatsapp").split(",").map(function (k) { return k.trim(); });
    var faltan = claves.filter(function (k) { return k && !valorDe(k); }).map(function (k) { return NOMBRES[k] || k; });
    if (!faltan.length) { el.hidden = true; raiz.style.setProperty("--franja", "0px"); return; }
    el.textContent = "";
    el.appendChild(crear("strong", "", "Muestra "));
    el.appendChild(document.createTextNode((el.getAttribute("data-pendientes-texto") || "Faltan datos del negocio:") + " " + faltan.join(", ") + "."));
    el.hidden = false;
    function medir() { raiz.style.setProperty("--franja", el.offsetHeight + "px"); }
    medir(); window.addEventListener("resize", medir, { passive: true });
  }
  /** Formularios genéricos (no hay en esta página aparte del pedido, que tiene el suyo). */
  function formulario() {
    L.todos("[data-formulario]:not([data-pedido-form])").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        if (!form.checkValidity()) return;
        e.preventDefault();
        var lineas = []; new FormData(form).forEach(function (v, k) { if (k !== "web" && String(v).trim()) lineas.push(k + ": " + String(v).trim()); });
        if (contacto.whatsapp) window.open(urlWhatsapp(lineas.join("\n")), "_blank", "noopener");
      });
    });
  }
  function anio() { L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }

  function iniciar() {
    L.seguro(cargar, "cargar pedido");
    L.seguro(carta, "carta");
    L.seguro(filtros, "filtros");
    L.seguro(enlaces, "enlaces");          // después de la carta: los "Pedir solo este" ya existen
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formularioPedido, "formulario del pedido");
    L.seguro(formulario, "formulario");
    L.seguro(hoja, "hoja del pedido");
    L.seguro(pintarPedido, "pedido");
    L.seguro(anio, "anio");
    window.addEventListener("scroll", function () { L.seguro(barraMovil, "barra"); }, { passive: true });
    window.addEventListener("resize", function () { L.seguro(barraMovil, "barra"); }, { passive: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
