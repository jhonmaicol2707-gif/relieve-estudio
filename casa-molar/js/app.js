/* app.js — CONTROLADOR: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escenas 3D, menú, capa cinematográfica) ya lo hacen js/motor.js y js/cine.js.
 * Aquí va solo lo propio de este sitio. Cada función se lanza con L3D.seguro() para que un fallo
 * en una parte no deje el resto de la página sin funcionar.
 *
 * Atributos que entiende (todos se rellenan desde datos.js; cambiar un dato no exige tocar el HTML):
 *   <a data-enlace="whatsapp|telefono|email|mapa|instagram…" data-mensaje="…" data-respaldo="#contacto">
 *     (mensaje con {producto} y data-producto en el botón o su tarjeta; plantilla común en SITIO.mensajes.whatsapp)
 *   <span data-dato="direccion" data-pendiente="Dirección por confirmar" data-prefijo="" data-sufijo="">
 *   <span data-si-falta="telefono">…solo se ve mientras falte ese dato…</span>
 *   <p data-pendientes="whatsapp,telefono,direccion" data-pendientes-texto="Faltan datos del negocio:" hidden>
 *   <form data-formulario data-whatsapp-saludo="Hola, …">   <a data-comprar="ID_VARIANTE">   <span data-anio>
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {};
  var raiz = document.documentElement;

  var NOMBRES = { whatsapp: "WhatsApp", telefono: "teléfono", email: "correo", direccion: "dirección",
                  horario: "horario", mapa: "mapa" };

  /** Un dato por su nombre: primero contacto y redes; después, el precio propio de un tratamiento
   *  (data-dato="valoracion" lee precios.lista[id="valoracion"].precio). */
  function valorDe(tipo) {
    var v = contacto[tipo] || (S.redes || {})[tipo];
    if (v) return v;
    var item = ((S.precios || {}).lista || []).filter(function (p) { return p.id === tipo; })[0];
    return item ? (item.precio || "") : "";
  }

  function urlWhatsapp(texto) {
    return "https://wa.me/" + String(contacto.whatsapp || "").replace(/\D/g, "") + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  /** Mensaje de WhatsApp de un botón: su data-mensaje o, si no tiene, la plantilla de datos.js
   *  (SITIO.mensajes.whatsapp). {producto} se cambia por el data-producto del botón o de su tarjeta:
   *  <article data-producto="Nintendo Switch 2"> … <a data-enlace="whatsapp" data-respaldo="#contacto">Pregunta</a> */
  function mensajeDe(el) {
    var plantilla = el.getAttribute("data-mensaje") || ((S.mensajes || {}).whatsapp) || "";
    var conProducto = el.closest("[data-producto]");
    var producto = conProducto ? conProducto.getAttribute("data-producto") : "";
    return plantilla.replace(/\{producto\}/g, producto).replace(/\s{2,}/g, " ").trim();
  }

  /** Enlaces de contacto. Con el dato: se rellenan y se MUESTRAN (aunque el HTML los traiga con hidden).
   *  Sin el dato: si llevan data-respaldo (la acción principal) se quedan visibles y llevan a ese bloque;
   *  si no, se ocultan en lugar de quedar rotos. */
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
      else if (tipo === "whatsapp") {
        el.href = urlWhatsapp(mensajeDe(el));
        el.target = "_blank"; el.rel = "noopener";
      } else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  /** Textos que salen de datos.js. Sin dato: el texto de data-pendiente (hueco visible, clase .pendiente)
   *  o, si no lo tiene, se oculta. */
  function datos() {
    L.todos("[data-dato]").forEach(function (el) {
      var valor = valorDe(el.getAttribute("data-dato"));
      var pendiente = el.getAttribute("data-pendiente");
      if (valor) {
        el.textContent = (el.getAttribute("data-prefijo") || "") + valor + (el.getAttribute("data-sufijo") || "");
        el.classList.remove("pendiente"); el.hidden = false;
      } else if (pendiente) {
        el.textContent = pendiente; el.classList.add("pendiente"); el.hidden = false;
      } else el.hidden = true;
    });
    L.todos("[data-si-falta]").forEach(function (el) { el.hidden = !!valorDe(el.getAttribute("data-si-falta")); });
  }

  /** Franja de muestra: enumera los datos imprescindibles que faltan. Con todos rellenos no aparece.
   *  Escribe --franja (su alto) en <html> para que la portada lo descuente. */
  function pendientes() {
    var el = document.querySelector("[data-pendientes]");
    if (!el) return;
    var claves = (el.getAttribute("data-pendientes") || "whatsapp").split(",").map(function (k) { return k.trim(); });
    var faltan = claves.filter(function (k) { return k && !valorDe(k); }).map(function (k) { return NOMBRES[k] || k; });
    if (!faltan.length) { el.hidden = true; raiz.style.setProperty("--franja", "0px"); return; }
    el.textContent = "";
    var fuerte = document.createElement("strong");
    fuerte.textContent = "Muestra ";
    el.appendChild(fuerte);
    el.appendChild(document.createTextNode((el.getAttribute("data-pendientes-texto") || "Faltan datos del negocio:") + " " + faltan.join(", ") + "."));
    el.hidden = false;
    function medir() { raiz.style.setProperty("--franja", el.offsetHeight + "px"); }
    medir();
    window.addEventListener("resize", medir, { passive: true });
  }

  /** Formulario de contacto: valida, evita envíos dobles y dice con claridad qué ha pasado.
   *  Sin destino (S.formulario.destino) abre WhatsApp o el correo con el mensaje ya escrito: funciona sin servidor.
   *  Si no hay ningún canal, el visitante ve un mensaje normal y quien construye, un aviso en la consola. */
  function formulario() {
    L.todos("[data-formulario]").forEach(function (form) {
      var estado = form.querySelector("[data-formulario-estado]");
      function decir(texto, tipo) { if (estado) { estado.textContent = texto; estado.setAttribute("data-tipo", tipo || ""); } }
      form.addEventListener("submit", function (e) {
        if (!form.checkValidity()) return;                  // el navegador muestra qué falta
        e.preventDefault();
        var trampa = form.querySelector("[name='web']");    // campo oculto anti-robots: si viene relleno, se ignora
        if (trampa && trampa.value) return;
        var datosForm = new FormData(form);
        var destino = (S.formulario || {}).destino;
        if (!destino) {
          var lineas = [];
          var saludo = form.getAttribute("data-whatsapp-saludo");
          if (saludo) lineas.push(saludo);
          // fuera del mensaje: la trampa anti-robots y los campos con data-no-mensaje (p. ej. la casilla de autorización)
          var fuera = { web: true };
          L.todos("[data-no-mensaje]", form).forEach(function (c) { if (c.name) fuera[c.name] = true; });
          datosForm.forEach(function (v, k) { if (!fuera[k] && String(v).trim()) lineas.push(k + ": " + String(v).trim()); });
          var mensaje = lineas.join("\n");
          if (contacto.whatsapp) {
            window.open(urlWhatsapp(mensaje), "_blank", "noopener");
            decir("Abrimos tu WhatsApp con el mensaje escrito. Solo falta que lo envíes.", "ok");
          } else if (contacto.email) {
            window.location.href = "mailto:" + contacto.email + "?subject=" + encodeURIComponent("Contacto desde la web") + "&body=" + encodeURIComponent(mensaje);
            decir("Abrimos tu correo con el mensaje escrito. Solo falta que lo envíes.", "ok");
          } else {
            console.warn("[app] El formulario no tiene destino: rellena contacto.whatsapp, contacto.email o formulario.destino en js/datos.js");
            decir(form.getAttribute("data-sin-canal") || "Este formulario aún no está activo. Muy pronto podrás escribirnos desde aquí.", "error");
          }
          return;
        }
        var boton = form.querySelector("[type='submit']");
        if (boton) boton.disabled = true;
        decir("Enviando…", "");
        fetch(destino, { method: (S.formulario.metodo || "POST"), body: datosForm, headers: { Accept: "application/json" } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); decir("Mensaje enviado. Te responderemos pronto.", "ok"); })
          .catch(function () { decir("No se pudo enviar. Inténtalo de nuevo o escríbenos por otro canal.", "error"); })
          .then(function () { if (boton) boton.disabled = false; });
      });
    });
  }

  /** Botones de compra de Shopify: <a data-comprar="ID_VARIANTE" data-cantidad="1">.
   *  Llevan al carrito de la tienda con el producto ya añadido (enlace oficial de carrito, sin claves). */
  function compra() {
    var dominio = (S.shopify || {}).dominio;
    L.todos("[data-comprar]").forEach(function (el) {
      var variante = el.getAttribute("data-comprar");
      if (!dominio || !variante) { el.hidden = true; return; }
      el.hidden = false;
      el.href = "https://" + dominio.replace(/^https?:\/\//, "").replace(/\/$/, "") + "/cart/" + variante + ":" + (el.getAttribute("data-cantidad") || "1");
    });
  }

  /** Año del pie siempre al día: <span data-anio></span> */
  function anio() {
    L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  // ================================================================ PROPIO DE CASA MOLAR

  /** Tabla de precios desde datos.js: rango de referencia del mercado + precio propio si la clínica lo escribe.
   *  El HTML trae las mismas filas para quien no tiene JavaScript. */
  function precios() {
    var cuerpo = document.querySelector("[data-precios]"), P = S.precios || {};
    if (!cuerpo || !(P.lista || []).length) return;
    cuerpo.textContent = "";
    P.lista.forEach(function (p) {
      var fila = document.createElement("tr");
      var th = document.createElement("th"); th.scope = "row"; th.textContent = p.tratamiento + " ";
      if (p.detalle) { var sm = document.createElement("small"); sm.textContent = p.detalle; th.appendChild(sm); }
      var rango = document.createElement("td"); rango.textContent = p.rango || "—";
      var propio = document.createElement("td");
      if (p.precio) propio.textContent = p.precio;
      else { var pe = document.createElement("span"); pe.className = "pendiente"; pe.textContent = "En la valoración"; propio.appendChild(pe); }
      fila.appendChild(th); fila.appendChild(rango); fila.appendChild(propio);
      cuerpo.appendChild(fila);
    });
    var fuente = document.querySelector("[data-precios-fuente]");
    if (fuente && P.fuente) { fuente.textContent = P.fuente; if (P.fuenteUrl) fuente.href = P.fuenteUrl; }
  }

  /** Equipo: nombre y registro reales desde datos.js; sin nombre, el hueco visible se queda. */
  function equipo() {
    var lista = S.equipo || [];
    L.todos("[data-equipo]").forEach(function (el) {
      var p = lista[parseInt(el.getAttribute("data-equipo"), 10)], hueco = el.querySelector("[data-equipo-nombre]");
      if (!p || !hueco) return;
      var rol = el.querySelector(".persona__rol");
      if (rol && p.rol) rol.textContent = p.rol;
      if (p.nombre) {
        hueco.textContent = p.nombre + (p.registro ? " · Registro " + p.registro : "");
        hueco.classList.remove("pendiente");
      }
    });
  }

  /** Antes y después: el control deslizante mueve el corte (accesible con teclado: flechas). */
  function comparador() {
    L.todos("[data-comparador]").forEach(function (fig) {
      var marco = fig.querySelector(".comparador__marco"), rango = fig.querySelector("[data-comparador-rango]");
      if (!marco || !rango) return;
      function poner() {
        marco.style.setProperty("--corte", rango.value + "%");
        rango.setAttribute("aria-valuetext", rango.value < 15 ? "Casi todo después" : rango.value > 85 ? "Casi todo antes" : "Mitad antes, mitad después");
      }
      rango.addEventListener("input", poner);
      poner();
    });
  }

  /** Barra fija del móvil: aparece al salir de la zona de la portada y se esconde al llegar al contacto
   *  (allí ya está el formulario y no debe tapar su botón). */
  function barraMovil() {
    var cierre = document.getElementById("contacto"), zona = document.getElementById("inicio");
    var pendiente = false;
    function mirar() {
      pendiente = false;
      var vh = window.innerHeight;
      var trasPortada = zona ? zona.getBoundingClientRect().bottom < vh * 0.9 : window.pageYOffset > vh * 0.75;
      var enCierre = cierre && cierre.getBoundingClientRect().top < vh * 0.85;
      raiz.classList.toggle("barra-visible", trasPortada && !enCierre && !raiz.classList.contains("menu-abierto"));
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(mirar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    mirar();
  }

  function iniciar() {
    L.seguro(precios, "precios");
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formulario, "formulario");
    L.seguro(compra, "compra");
    L.seguro(anio, "anio");
    L.seguro(equipo, "equipo");
    L.seguro(comparador, "comparador");
    L.seguro(barraMovil, "barraMovil");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
