/* catalogo.js — enlaces de WhatsApp, filtros por sector, videos que se reproducen al verse y revelados. */
(function () {
  "use strict";
  document.documentElement.classList.remove("sin-js");
  var C = window.CATALOGO || {};
  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function todos(sel, raiz) { return [].slice.call((raiz || document).querySelectorAll(sel)); }
  function seguro(fn) { try { fn(); } catch (e) { if (window.console) console.warn("[catálogo]", e); } }

  /** WhatsApp: general o con el sector de la ficha. Sin número, el botón lleva a la sección de contacto. */
  function whatsapp() {
    var num = String(C.whatsapp || "").replace(/\D/g, "");
    todos("[data-wa]").forEach(function (a) {
      if (!num) return;
      var sector = a.getAttribute("data-sector");
      var texto = sector ? (C.mensajeFicha || "").replace("{sector}", sector) : (C.mensajeGeneral || "");
      a.href = "https://wa.me/" + num + (texto ? "?text=" + encodeURIComponent(texto) : "");
      a.target = "_blank"; a.rel = "noopener";
    });
    var n = document.querySelector("[data-numero]");
    if (n && num) n.textContent = "+" + num.slice(0, 2) + " " + num.slice(2, 5) + " " + num.slice(5, 8) + " " + num.slice(8);
  }

  /** Filtros: botones con aria-pressed; anuncia cuántas fichas quedan. */
  function filtros() {
    var botones = todos("[data-filtro]"), fichas = todos(".ficha"), estado = document.querySelector("[data-estado]");
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.getAttribute("data-filtro"), visibles = 0;
        botones.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        fichas.forEach(function (f) {
          var si = cat === "Todas" || f.getAttribute("data-categoria") === cat;
          f.hidden = !si; if (si) { visibles++; f.classList.add("visible"); }
        });
        if (estado) estado.textContent = cat === "Todas" ? "" : visibles + (visibles === 1 ? " ejemplo" : " ejemplos") + " de " + cat.toLowerCase() + ".";
        actualizarVideos();
      });
    });
  }

  /** Videos: se cargan y reproducen solo cuando la ficha está a la vista (ahorra datos en el celular). */
  var observador = null;
  function actualizarVideos() { if (observador) todos(".ficha__video").forEach(function (v) { observador.unobserve(v); observador.observe(v); }); }
  function videos() {
    var lista = todos(".ficha__video");
    if (!("IntersectionObserver" in window) || reducido) return;   // con movimiento reducido: el visitante le da play
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio > .45) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: [0, .45, .8] });
    lista.forEach(function (v) { observador.observe(v); });
    if (reducido) lista.forEach(function (v) { v.controls = true; });
  }

  /** Sonido: uno a la vez. */
  function sonido() {
    var botones = todos("[data-sonido]");
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.parentNode.querySelector("video"), activar = v.muted;
        todos(".ficha__video").forEach(function (o) { o.muted = true; });
        botones.forEach(function (o) { o.setAttribute("aria-pressed", "false"); o.querySelector("span").textContent = "Sonido"; });
        v.muted = !activar;
        if (activar) { b.setAttribute("aria-pressed", "true"); b.querySelector("span").textContent = "Silenciar"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      });
    });
  }

  function revelar() {
    var els = todos("[data-revelar]");
    if (!("IntersectionObserver" in window) || reducido) { els.forEach(function (e) { e.classList.add("visible"); }); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /** Modo revisión (?qa=0..1), igual que el motor de las landings: todo revelado y scroll a esa fracción. */
  function revision() {
    var qa = new URLSearchParams(location.search).get("qa");
    if (qa === null || qa === "" || isNaN(qa)) return false;
    todos("[data-revelar]").forEach(function (e) { e.classList.add("visible"); });
    var ir = function () { scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * parseFloat(qa)); };
    if (document.readyState === "complete") ir(); else window.addEventListener("load", ir);
    return true;
  }

  function iniciar() { seguro(whatsapp); seguro(filtros); seguro(videos); seguro(sonido); if (!revision()) seguro(revelar); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
