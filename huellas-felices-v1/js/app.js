/* app.js — CONTROLADOR: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escena 3D, menú…) ya lo hace js/motor.js.
 * Aquí va solo lo propio de Huellas Felices. Cada función se lanza con L3D.seguro() para que un fallo
 * en una parte no deje el resto de la página sin funcionar.
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {};

  /** Dirección de WhatsApp con el mensaje ya escrito. Sin número (dato pendiente) abre WhatsApp
   *  para que el visitante elija a quién enviarlo: el botón no queda roto mientras llega el dato. */
  function urlWhatsapp(texto) {
    var numero = (contacto.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + numero + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  /** Enlaces de contacto a partir de datos.js: <a data-enlace="telefono|whatsapp|email|mapa|instagram…">.
   *  Si el dato no existe, el elemento se oculta (salvo WhatsApp, que es la acción principal de la web). */
  function enlaces() {
    L.todos("[data-enlace]").forEach(function (el) {
      var tipo = el.getAttribute("data-enlace"), valor = contacto[tipo] || (S.redes || {})[tipo];
      if (tipo === "whatsapp") {
        el.href = urlWhatsapp(el.getAttribute("data-mensaje") || "");
        el.target = "_blank"; el.rel = "noopener";
        return;
      }
      if (!valor) { el.hidden = true; return; }
      el.hidden = false;
      if (tipo === "telefono") el.href = "tel:" + valor.replace(/\s+/g, "");
      else if (tipo === "email") el.href = "mailto:" + valor;
      else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  /** Textos que salen de datos.js: <span data-dato="direccion" data-prefijo=" · ">. Vacío = oculto.
   *  <div data-si="horario"> muestra un bloque entero solo si ese dato existe. */
  function datos() {
    L.todos("[data-dato]").forEach(function (el) {
      var valor = contacto[el.getAttribute("data-dato")];
      if (!valor) { el.hidden = true; return; }
      el.textContent = (el.getAttribute("data-prefijo") || "") + valor + (el.getAttribute("data-sufijo") || "");
      el.hidden = false;
    });
    L.todos("[data-si]").forEach(function (el) { el.hidden = !contacto[el.getAttribute("data-si")]; });
  }

  /** Aviso de muestra: lista los datos imprescindibles que faltan en datos.js. Con todo relleno, no aparece. */
  function pendientes() {
    var el = document.querySelector("[data-pendientes]");
    if (!el) return;
    var nombres = { whatsapp: "número de WhatsApp", telefono: "teléfono", direccion: "dirección", horario: "horario de consulta" };
    var faltan = Object.keys(nombres).filter(function (k) { return !contacto[k]; }).map(function (k) { return nombres[k]; });
    if (!faltan.length) { el.hidden = true; return; }
    el.textContent = "";
    var fuerte = document.createElement("strong");
    fuerte.textContent = "Versión de muestra. ";
    el.appendChild(fuerte);
    el.appendChild(document.createTextNode("Faltan datos de la clínica: " + faltan.join(", ") + "."));
    el.hidden = false;
  }

  /** Formulario de cita: no envía nada a ningún servidor. Compone un mensaje natural y abre WhatsApp. */
  function formulario() {
    var form = document.querySelector("[data-formulario]");
    if (!form) return;
    var estado = form.querySelector("[data-formulario-estado]");
    function decir(texto, tipo) {
      if (!estado) return;
      estado.textContent = texto; estado.setAttribute("data-tipo", tipo || "");
    }
    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return;            // el navegador muestra qué falta
      e.preventDefault();
      var trampa = form.querySelector("[name='web']");   // campo oculto anti-robots: si viene relleno, se ignora
      if (trampa && trampa.value) return;
      var d = new FormData(form);
      var servicio = d.get("Servicio"), mascota = d.get("Mascota"), nota = (d.get("Mensaje") || "").trim();
      var mensaje = "Hola, Huellas Felices. Soy " + (d.get("Nombre") || "").trim() + ". " +
        (servicio === "una urgencia" ? "Tengo una urgencia con mi " + mascota + "."
                                     : "Quiero pedir cita de " + servicio + " para mi " + mascota + ".") +
        (nota ? " " + nota : "");
      window.open(urlWhatsapp(mensaje), "_blank", "noopener");
      decir("Abrimos tu WhatsApp con el mensaje escrito. Solo falta que lo envíes.", "ok");
    });
  }

  /** Barra fija del móvil: aparece al dejar atrás la portada (ahí ya hay un botón igual). */
  function barraMovil() {
    var raiz = document.documentElement;
    function revisar() { raiz.classList.toggle("barra-visible", (window.pageYOffset || 0) > window.innerHeight * 0.6); }
    window.addEventListener("scroll", revisar, { passive: true });
    revisar();
  }

  /** Acordeón de preguntas: al abrir una se cierran las demás. */
  function acordeon() {
    var todos = L.todos(".acordeon details");
    todos.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) todos.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  /** Red de seguridad de los revelados: si se llega a un punto de la página de un salto (un enlace del menú,
   *  volver atrás), nada de lo que ya está en pantalla o más arriba se queda sin aparecer. */
  function rescate() {
    var pendiente = false;
    function revisar() {
      pendiente = false;
      var limite = window.innerHeight;
      L.todos("[data-revelar]:not(.visible), .l3d-dividido:not(.visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < limite) el.classList.add("visible");
      });
    }
    function pedir() { if (!pendiente) { pendiente = true; window.setTimeout(revisar, 250); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("load", pedir);
    pedir();
  }

  /** Año del pie siempre al día: <span data-anio></span> */
  function anio() {
    L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function iniciar() {
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formulario, "formulario");
    L.seguro(barraMovil, "barra");
    L.seguro(acordeon, "acordeon");
    L.seguro(anio, "anio");
    L.seguro(rescate, "rescate");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
