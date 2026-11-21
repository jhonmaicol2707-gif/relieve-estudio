/* app.js — CONTROLADOR: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escenas 3D, menú, capa cinematográfica) lo hacen js/motor.js y js/cine.js.
 * Aquí va solo lo propio de Huellas Felices. Cada función se lanza con L3D.seguro() para que un fallo
 * en una parte no deje el resto de la página sin funcionar.
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {};
  var raiz = document.documentElement;

  function urlWhatsapp(texto) {
    return "https://wa.me/" + String(contacto.whatsapp || "").replace(/\D/g, "") + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  /** Enlaces de contacto: <a data-enlace="telefono|whatsapp|email|mapa|instagram…">.
   *  Sin el dato: si tiene data-respaldo (la acción principal) se queda visible y lleva a ese bloque;
   *  si no, se oculta. Con el dato: se rellena y se muestra. */
  function enlaces() {
    L.todos("[data-enlace]").forEach(function (el) {
      var tipo = el.getAttribute("data-enlace"), valor = contacto[tipo] || (S.redes || {})[tipo];
      if (!valor) {
        var respaldo = el.getAttribute("data-respaldo");
        if (respaldo) { el.href = respaldo; el.hidden = false; } else el.hidden = true;
        return;
      }
      el.hidden = false;
      if (tipo === "telefono") el.href = "tel:" + valor.replace(/\s+/g, "");
      else if (tipo === "email") el.href = "mailto:" + valor;
      else if (tipo === "whatsapp") {
        el.href = urlWhatsapp(el.getAttribute("data-mensaje") || "");
        el.target = "_blank"; el.rel = "noopener";
      } else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  /** Textos que salen de datos.js: <span data-dato="direccion" data-prefijo=" · " data-pendiente="Dirección por confirmar">.
   *  Sin dato: muestra el texto de pendiente (hueco visible) o, si no lo tiene, se oculta.
   *  <span data-si-falta="telefono"> solo se ve mientras falte ese dato. */
  function datos() {
    L.todos("[data-dato]").forEach(function (el) {
      var valor = contacto[el.getAttribute("data-dato")];
      var pendiente = el.getAttribute("data-pendiente");
      if (valor) {
        el.textContent = (el.getAttribute("data-prefijo") || "") + valor + (el.getAttribute("data-sufijo") || "");
        el.classList.remove("pendiente");
        el.hidden = false;
      } else if (pendiente) {
        el.textContent = pendiente; el.classList.add("pendiente"); el.hidden = false;
      } else el.hidden = true;
    });
    L.todos("[data-si-falta]").forEach(function (el) { el.hidden = !!contacto[el.getAttribute("data-si-falta")]; });
  }

  /** Franja de muestra: lista los datos imprescindibles que faltan en datos.js. Con todo relleno, no aparece. */
  function pendientes() {
    var el = document.querySelector("[data-pendientes]");
    if (!el) return;
    var nombres = { whatsapp: "WhatsApp", telefono: "teléfono", direccion: "dirección", horario: "horario de consulta" };
    var faltan = Object.keys(nombres).filter(function (k) { return !contacto[k]; }).map(function (k) { return nombres[k]; });
    if (!faltan.length) { el.hidden = true; return; }
    el.textContent = "";
    var fuerte = document.createElement("strong");
    fuerte.textContent = "Muestra";
    el.appendChild(fuerte);
    el.appendChild(document.createTextNode("Faltan datos de la clínica: " + faltan.join(", ") + "."));
    el.hidden = false;
    // la portada descuenta la franja para seguir cabiendo en la primera pantalla
    function medir() { raiz.style.setProperty("--franja", el.offsetHeight + "px"); }
    medir();
    window.addEventListener("resize", medir, { passive: true });
  }

  /** Reloj de Medellín: las urgencias son 24 h, así que "abiertas" siempre es verdad. */
  function reloj() {
    var etiquetas = L.todos("[data-reloj]"), horas = L.todos("[data-reloj-hora]");
    if (!etiquetas.length && !horas.length) return;
    var formato;
    try { formato = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: S.zonaHoraria || "America/Bogota" }); }
    catch (e) { return; }
    function pintar() {
      var hora = formato.format(new Date());
      etiquetas.forEach(function (el) { el.textContent = "Urgencias abiertas · " + hora; });
      horas.forEach(function (el) { el.textContent = hora; });
    }
    pintar();
    window.setInterval(pintar, 15000);
  }

  /** Leyenda de la portada: marca la figura que dibujan los puntos (evento de js/escena.js). */
  function leyenda() {
    var lista = document.querySelector("[data-leyenda]"), lienzo = document.querySelector(".portada canvas[data-escena]");
    if (!lista || !lienzo) return;
    var items = L.todos("li", lista);
    lienzo.addEventListener("l3d-figura", function (e) {
      var i = e.detail ? e.detail.indice : 0;
      items.forEach(function (li, k) { li.classList.toggle("activa", k === i); });
    });
  }

  /** Formulario de cita: no envía nada a ningún servidor. Compone un mensaje natural y abre WhatsApp.
   *  Mientras falte el número de la clínica lo dice claramente en lugar de abrir un chat sin destinatario. */
  function formulario() {
    var form = document.querySelector("[data-formulario]");
    if (!form) return;
    var estado = form.querySelector("[data-formulario-estado]");
    function decir(texto, tipo) { if (estado) { estado.textContent = texto; estado.setAttribute("data-tipo", tipo || ""); } }
    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return;                  // el navegador muestra qué falta
      e.preventDefault();
      var trampa = form.querySelector("[name='web']");    // campo oculto anti-robots
      if (trampa && trampa.value) return;
      var d = new FormData(form);
      var servicio = d.get("Servicio"), mascota = d.get("Mascota"), nota = String(d.get("Mensaje") || "").trim();
      var mensaje = "Hola, Huellas Felices. Soy " + String(d.get("Nombre") || "").trim() + ". " +
        (servicio === "una urgencia" ? "Tengo una urgencia con mi " + mascota + "."
                                     : "Quiero pedir cita de " + servicio + " para mi " + mascota + ".") +
        (nota ? " " + nota : "");
      if (!contacto.whatsapp) {
        decir("Versión de muestra: falta el número de WhatsApp de la clínica. Cuando esté, este botón abrirá tu WhatsApp con este mensaje: «" + mensaje + "»", "error");
        return;
      }
      window.open(urlWhatsapp(mensaje), "_blank", "noopener");
      decir("Abrimos tu WhatsApp con el mensaje escrito. Solo falta que lo envíes.", "ok");
    });
  }

  /** Barra fija del móvil: aparece al dejar atrás la portada y se retira al llegar al cierre (ahí ya está el botón). */
  function barraMovil() {
    var cierre = document.getElementById("contacto");
    function revisar() {
      var y = window.pageYOffset || 0, vh = window.innerHeight;
      var enCierre = cierre && cierre.getBoundingClientRect().top < vh * 0.6;
      raiz.classList.toggle("barra-visible", y > vh * 0.7 && !enCierre);
    }
    window.addEventListener("scroll", revisar, { passive: true });
    revisar();
  }

  /** Preguntas: al abrir una se cierran las demás. */
  function acordeon() {
    var todos = L.todos(".acordeon details");
    todos.forEach(function (d) {
      d.addEventListener("toggle", function () { if (d.open) todos.forEach(function (o) { if (o !== d) o.open = false; }); });
    });
  }

  function anio() { L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }

  function iniciar() {
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(reloj, "reloj");
    L.seguro(leyenda, "leyenda");
    L.seguro(formulario, "formulario");
    L.seguro(barraMovil, "barra");
    L.seguro(acordeon, "acordeon");
    L.seguro(anio, "anio");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
