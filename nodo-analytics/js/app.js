/* app.js — CONTROLADOR: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escenas 3D, menú, inclinación…) ya lo hace js/motor.js.
 * Aquí va solo lo propio de este sitio. Cada función se lanza con L3D.seguro() para que un fallo
 * en una parte no deje el resto de la página sin funcionar.
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {};

  /** Rellena enlaces de contacto a partir de datos.js: <a data-enlace="telefono|whatsapp|email|mapa">.
   *  Si el dato no existe, el elemento se oculta en lugar de quedar roto. */
  function enlaces() {
    L.todos("[data-enlace]").forEach(function (el) {
      var tipo = el.getAttribute("data-enlace"), valor = contacto[tipo] || (S.redes || {})[tipo];
      if (!valor) {                         // sin dato: la acción principal (data-respaldo) lleva a ese bloque; el resto se oculta
        var respaldo = el.getAttribute("data-respaldo");
        if (respaldo) { el.href = respaldo; el.hidden = false; el.removeAttribute("target"); } else el.hidden = true;
        return;
      }
      if (tipo === "telefono") el.href = "tel:" + valor.replace(/\s+/g, "");
      else if (tipo === "email") el.href = "mailto:" + valor;
      else if (tipo === "whatsapp") {
        var texto = el.getAttribute("data-mensaje") || "";
        el.href = "https://wa.me/" + valor.replace(/\D/g, "") + (texto ? "?text=" + encodeURIComponent(texto) : "");
        el.target = "_blank"; el.rel = "noopener";
      } else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  /** Formulario de contacto: valida, evita envíos dobles y dice con claridad qué ha pasado.
   *  Sin destino configurado abre WhatsApp (o el correo) con el mensaje ya escrito: funciona sin servidor. */
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
      var trampa = form.querySelector("[name='web']");   // campo oculto anti-robots: si viene relleno, se ignora
      if (trampa && trampa.value) { e.preventDefault(); return; }
      var destino = (S.formulario || {}).destino;
      var datos = new FormData(form);
      if (!destino) {
        e.preventDefault();
        var lineas = [];
        datos.forEach(function (v, k) { if (k !== "web" && v) lineas.push(k + ": " + v); });
        var mensaje = lineas.join("\n");
        if (contacto.whatsapp) window.open("https://wa.me/" + contacto.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(mensaje), "_blank", "noopener");
        else if (contacto.email) window.location.href = "mailto:" + contacto.email + "?subject=" + encodeURIComponent("Solicitud de demo — " + (S.marca || "web")) + "&body=" + encodeURIComponent(mensaje);
        else {
          // Aún no hay correo, WhatsApp ni servicio de formularios en js/datos.js: se dice la verdad en vez de fingir un envío.
          decir("Este formulario todavía no está conectado: falta el correo de contacto de " + (S.marca || "la empresa") + " (js/datos.js).", "error");
          return;
        }
        decir("Se ha abierto tu aplicación para enviar la solicitud de demo.", "ok");
        return;
      }
      e.preventDefault();
      var boton = form.querySelector("[type='submit']");
      if (boton) boton.disabled = true;
      decir("Enviando…", "");
      fetch(destino, { method: (S.formulario.metodo || "POST"), body: datos, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); decir("Solicitud enviada. Te escribiremos para acordar la demo.", "ok"); })
        .catch(function () { decir("No se pudo enviar. Inténtalo de nuevo en unos minutos.", "error"); })
        .then(function () { if (boton) boton.disabled = false; });
    });
  }

  /** Botones de compra de Shopify: <a data-comprar="ID_VARIANTE" data-cantidad="1">.
   *  Llevan al carrito de la tienda con el producto ya añadido (enlace oficial de carrito, sin claves). */
  function compra() {
    var dominio = (S.shopify || {}).dominio;
    L.todos("[data-comprar]").forEach(function (el) {
      var variante = el.getAttribute("data-comprar");
      if (!dominio || !variante) { el.hidden = true; return; }
      el.href = "https://" + dominio.replace(/^https?:\/\//, "").replace(/\/$/, "") + "/cart/" + variante + ":" + (el.getAttribute("data-cantidad") || "1");
    });
  }

  /** Año del pie siempre al día: <span data-anio></span> */
  function anio() {
    L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Propio de Nodo Analytics ---------- */

  /** Precio de entrada desde datos.js: <span data-plan="desde|moneda|periodo">. El HTML ya trae el valor
   *  escrito (se lee sin JavaScript); aquí solo se sincroniza si alguien lo cambia en datos.js. */
  function plan() {
    var p = S.plan || {};
    L.todos("[data-plan]").forEach(function (el) {
      var v = p[el.getAttribute("data-plan")];
      if (v) el.textContent = v;
    });
  }

  /** Barra fija del móvil: aparece al pasar la portada y se retira al llegar al formulario (ya no hace falta). */
  function barraMovil() {
    var barra = document.querySelector("[data-barra]"), demo = document.getElementById("demo");
    if (!barra) return;
    function revisar() {
      var y = window.pageYOffset || 0, vh = window.innerHeight || 1;
      var enDemo = demo ? demo.getBoundingClientRect().top < vh * 0.75 : false;
      barra.classList.toggle("activa", y > vh * 0.6 && !enDemo);
    }
    window.addEventListener("scroll", revisar, { passive: true });
    window.addEventListener("resize", revisar, { passive: true });
    revisar();
    window.setTimeout(revisar, 600);
  }

  /** Acordeón de preguntas: al abrir una se cierran las demás. */
  function preguntas() {
    var todas = L.todos(".acordeon details");
    todas.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) todas.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  function iniciar() {
    L.seguro(enlaces, "enlaces");
    L.seguro(formulario, "formulario");
    L.seguro(compra, "compra");
    L.seguro(anio, "anio");
    L.seguro(plan, "plan");
    L.seguro(barraMovil, "barra móvil");
    L.seguro(preguntas, "preguntas");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
