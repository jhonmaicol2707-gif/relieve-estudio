/* app.js — CONTROLADOR de Kelvara: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escenas, menú, cine…) lo hacen motor.js y cine.js.
 * Cambios respecto a la plantilla de la skill (problema conocido 7):
 *   - un enlace con dato se MUESTRA siempre (se le quita `hidden`), no solo se oculta el que no lo tiene;
 *   - el visitante nunca ve mensajes técnicos: sin número, el botón lleva al bloque de contacto.
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {}, mensajes = S.mensajes || {};

  /** Texto de WhatsApp de un botón: data-mensaje literal, o la plantilla de datos.js con su data-producto. */
  function mensajeDe(el) {
    var literal = el.getAttribute("data-mensaje");
    if (literal) return literal;
    var producto = el.getAttribute("data-producto");
    var plantilla = mensajes[el.getAttribute("data-tipo") || "blackfriday"] || mensajes.blackfriday || "";
    if (!producto) return mensajes.general || "";
    return plantilla.replace("{producto}", producto);
  }

  /** <a data-enlace="whatsapp|telefono|email|mapa"> → enlace real desde datos.js.
   *  Sin dato: con data-respaldo se queda visible y lleva allí; sin respaldo se oculta. */
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
        var texto = mensajeDe(el);
        el.href = "https://wa.me/" + valor.replace(/\D/g, "") + (texto ? "?text=" + encodeURIComponent(texto) : "");
        el.target = "_blank"; el.rel = "noopener";
      } else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  /** <span data-dato="whatsappVisible"> → valor de datos.js (el HTML ya trae el texto por si no hay JavaScript). */
  function datos() {
    L.todos("[data-dato]").forEach(function (el) {
      var v = contacto[el.getAttribute("data-dato")];
      if (v) el.textContent = v;
    });
  }

  /** Vista previa del mensaje en "Cómo funciona": cambia con el producto que señalas. */
  function vistaMensaje() {
    var vista = document.querySelector("[data-vista-mensaje]");
    if (!vista) return;
    function poner(el) {
      var texto = mensajeDe(el);
      if (!texto || vista.textContent === texto) return;
      vista.style.opacity = 0;
      setTimeout(function () { vista.textContent = texto; vista.style.opacity = 1; }, 160);
    }
    L.todos(".ficha [data-producto], .regalo [data-producto]").forEach(function (el) {
      var tarjeta = el.closest(".ficha, .regalo");
      tarjeta.addEventListener("pointerenter", function () { poner(el); });
      el.addEventListener("focus", function () { poner(el); });
    });
  }

  /** Cuenta atrás honesta: solo hacia las fechas reales de datos.js; "Hoy" el mismo día; desaparece cuando pasan. */
  function cuentas() {
    var cal = (S.calendario || []).map(function (e) {
      var p = e.fecha.split("-").map(Number), ini = new Date(p[0], p[1] - 1, p[2], 0, 0, 0);
      return { nombre: e.nombre, ini: ini, fin: new Date(p[0], p[1] - 1, p[2] + 1, 0, 0, 0) };
    });
    var cajas = L.todos("[data-cuenta]");
    if (!cajas.length || !cal.length) return;
    function dos(n) { return (n < 10 ? "0" : "") + n; }
    function fechaCorta(d) {
      var dia = d.toLocaleDateString("es", { weekday: "long" });
      return dia + " " + dos(d.getDate()) + "." + dos(d.getMonth() + 1) + "." + d.getFullYear();
    }
    function pintar() {
      var ahora = new Date();
      cajas.forEach(function (caja) {
        var solo = caja.getAttribute("data-cuenta-solo");
        var ev = cal.filter(function (e) { return (!solo || e.nombre === solo) && ahora < e.fin; })[0];
        if (!ev) { caja.hidden = true; return; }
        var titulo = caja.querySelector("[data-cuenta-nombre]"), cifras = caja.querySelector("[data-cuenta-cifras]");
        titulo.textContent = ev.nombre + " · " + fechaCorta(ev.ini);
        if (ahora >= ev.ini) { cifras.textContent = "Hoy es " + ev.nombre; return; }
        var s = Math.floor((ev.ini - ahora) / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
            m = Math.floor(s % 3600 / 60), sg = s % 60;
        cifras.innerHTML = "Faltan <b>" + dos(d) + "</b> d · <b>" + dos(h) + "</b> h · <b>" + dos(m) + "</b> min · <b>" + dos(sg) + "</b> s";
      });
    }
    pintar();
    setInterval(pintar, 1000);
  }

  /** Barra fija del móvil: se aparta mientras un botón principal ([data-aparta-barra]) está a la vista. */
  function barra() {
    var zonas = L.todos("[data-aparta-barra]");
    if (!zonas.length || !window.IntersectionObserver) return;
    var vistas = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vistas.add(e.target); else vistas.delete(e.target); });
      document.documentElement.classList.toggle("barra-oculta", vistas.size > 0);
    }, { threshold: 0.01 });
    zonas.forEach(function (z) { io.observe(z); });
  }

  function anio() {
    L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function iniciar() {
    L.seguro(datos, "datos");
    L.seguro(enlaces, "enlaces");
    L.seguro(vistaMensaje, "vista del mensaje");
    L.seguro(cuentas, "cuenta atrás");
    L.seguro(barra, "barra móvil");
    L.seguro(anio, "anio");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
