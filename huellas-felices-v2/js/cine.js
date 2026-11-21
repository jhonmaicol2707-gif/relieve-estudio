/*! L3D cine · landing-3d-pro
 * Capa de movimiento cinematográfico: entrada con cortina, cursor propio, textos que se iluminan al leer,
 * imágenes que se abren con zoom, galería horizontal fijada, tarjetas apiladas, cintas que reaccionan a la
 * velocidad del scroll, texto que se "descifra", focos de luz en rejillas y cambio de tema por sección.
 * Todo se activa con atributos data-cine-* en el HTML. Depende de js/motor.js (va después). NO editar por proyecto.
 *
 * Principios: el contenido se ve sin JavaScript; con "reducir movimiento" se queda lo estático y legible;
 * en revisión (?qa=…) todo se muestra en su estado final para que las capturas sean fiables.
 */
(function () {
  "use strict";
  var L = window.L3D;
  if (!L || window.L3DCine) return;

  var doc = document, raiz = doc.documentElement, win = window;
  var QA = raiz.classList.contains("l3d-qa") || /[?&]qa=/.test(location.search);
  var reducido = L.reducido;
  var fino = L.punteroFino;
  var limitar = L.limitar, mezclar = L.mezclar, todos = L.todos, seguro = L.seguro;

  // ------------------------------------------------------------------ velocidad del scroll (compartida)
  var vel = { valor: 0, suave: 0, ultimoY: win.pageYOffset || 0 };
  L.alFrame(function (t, dt) {
    var y = win.pageYOffset || 0;
    var v = (y - vel.ultimoY) / Math.max(dt, 0.001);          // px/s
    vel.ultimoY = y;
    vel.valor = v;
    vel.suave = mezclar(vel.suave, v, 1 - Math.pow(0.0008, dt));
  });

  // ------------------------------------------------------------------ 1. Cortina de entrada
  // <html data-cine-entrada="Nombre de marca">  → telón con la marca y un contador que se abre hacia arriba
  function entrada() {
    var texto = raiz.getAttribute("data-cine-entrada");
    if (texto === null) return;
    if (QA || reducido) { raiz.classList.add("cine-entro"); return; }
    try { if (sessionStorage.getItem("cine-entro")) { raiz.classList.add("cine-entro"); return; } } catch (e) {}

    var cortina = doc.createElement("div");
    cortina.className = "cine-cortina";
    cortina.setAttribute("aria-hidden", "true");
    cortina.innerHTML = '<div class="cine-cortina__marca"><span></span></div><div class="cine-cortina__cuenta">000</div><div class="cine-cortina__linea"><i></i></div>';
    cortina.querySelector(".cine-cortina__marca span").textContent = texto || doc.title;
    doc.body.appendChild(cortina);
    raiz.classList.add("cine-entrando");

    var cuenta = cortina.querySelector(".cine-cortina__cuenta"), barra = cortina.querySelector(".cine-cortina__linea i");
    var inicio = performance.now(), cargada = false, minimo = 1100, maximo = 2600;
    win.addEventListener("load", function () { cargada = true; });
    if (doc.readyState === "complete") cargada = true;

    (function paso(ahora) {
      var t = ahora - inicio;
      // avanza solo hasta el 90 % mientras la página carga; el último tramo, al terminar
      var objetivo = cargada && t > minimo ? 1 : Math.min(0.9, t / maximo);
      var p = limitar(objetivo, 0, 1);
      var actual = parseFloat(barra.style.getPropertyValue("--p") || 0);
      var nuevo = mezclar(actual, p, 0.12);
      if (p === 1 && nuevo > 0.995) nuevo = 1;
      barra.style.setProperty("--p", nuevo.toFixed(4));
      cuenta.textContent = String(Math.round(nuevo * 100)).padStart(3, "0");
      if (nuevo < 1 && t < maximo + 1500) { requestAnimationFrame(paso); return; }
      cortina.classList.add("abierta");
      raiz.classList.remove("cine-entrando");
      raiz.classList.add("cine-entro");
      try { sessionStorage.setItem("cine-entro", "1"); } catch (e) {}
      setTimeout(function () { cortina.remove(); }, 1400);
    })(inicio);
  }

  // ------------------------------------------------------------------ 2. Cursor propio
  // <html data-cine-cursor>  ·  en enlaces o zonas: data-cursor="Ver" muestra una etiqueta dentro del círculo
  function cursor() {
    if (!raiz.hasAttribute("data-cine-cursor") || !fino || reducido || QA) return;
    var punto = doc.createElement("div"), aro = doc.createElement("div"), etiqueta = doc.createElement("span");
    punto.className = "cine-cursor__punto"; aro.className = "cine-cursor__aro"; aro.appendChild(etiqueta);
    punto.setAttribute("aria-hidden", "true"); aro.setAttribute("aria-hidden", "true");
    doc.body.appendChild(aro); doc.body.appendChild(punto);
    raiz.classList.add("cine-con-cursor");
    var x = -100, y = -100, ax = -100, ay = -100, visible = false;
    win.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!visible) { visible = true; ax = x; ay = y; raiz.classList.add("cine-cursor-visible"); }
      var objetivo = e.target.closest ? e.target.closest("a, button, [data-cursor], input, textarea, select, label, summary") : null;
      var texto = objetivo && objetivo.getAttribute("data-cursor");
      aro.classList.toggle("sobre", !!objetivo);
      aro.classList.toggle("con-texto", !!texto);
      etiqueta.textContent = texto || "";
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { visible = false; raiz.classList.remove("cine-cursor-visible"); });
    win.addEventListener("pointerdown", function () { aro.classList.add("pulsado"); });
    win.addEventListener("pointerup", function () { aro.classList.remove("pulsado"); });
    L.alFrame(function (t, dt) {
      ax = mezclar(ax, x, 1 - Math.pow(0.0001, dt));
      ay = mezclar(ay, y, 1 - Math.pow(0.0001, dt));
      punto.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      aro.style.transform = "translate3d(" + ax + "px," + ay + "px,0)";
    });
  }

  // ------------------------------------------------------------------ 3. Texto que se ilumina al leer
  // <p data-cine-leer>…</p>  → cada palabra pasa de apagada a encendida según avanza el scroll
  function leer() {
    todos("[data-cine-leer]").forEach(function (el) {
      var palabras = [];
      (function recorrer(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (h) {
          if (h.nodeType === 3) {
            var frag = doc.createDocumentFragment();
            h.textContent.split(/(\s+)/).forEach(function (trozo) {
              if (!trozo) return;
              if (/^\s+$/.test(trozo)) { frag.appendChild(doc.createTextNode(" ")); return; }
              var s = doc.createElement("span"); s.className = "cine-palabra"; s.textContent = trozo;
              frag.appendChild(s); palabras.push(s);
            });
            nodo.replaceChild(frag, h);
          } else if (h.nodeType === 1) recorrer(h);
        });
      })(el);
      el.classList.add("cine-leer-listo");
      if (reducido) { palabras.forEach(function (p) { p.style.opacity = 1; }); return; }
      var n = palabras.length;
      L.alScroll(el, function (p) {
        // se enciende entre el 15 % y el 65 % del paso del bloque por la pantalla
        var avance = limitar((p - 0.15) / 0.5, 0, 1) * n;
        for (var i = 0; i < n; i++) palabras[i].style.opacity = (0.16 + 0.84 * limitar(avance - i, 0, 1)).toFixed(3);
      });
    });
  }

  // ------------------------------------------------------------------ 4. Imagen que se abre con zoom
  // <figure data-cine-imagen><img …></figure>  → recorte que se abre y zoom que se asienta con el scroll
  function imagenes() {
    todos("[data-cine-imagen]").forEach(function (el) {
      el.classList.add("cine-imagen");
      if (reducido) return;
      var dentro = el.firstElementChild;
      L.alScroll(el, function (p) {
        var a = limitar(p / 0.5, 0, 1), s = a * a * (3 - 2 * a);
        el.style.setProperty("--cine-recorte", ((1 - s) * 14).toFixed(2) + "%");
        if (dentro) dentro.style.transform = "scale(" + (1.28 - 0.28 * s + (p > 0.5 ? (p - 0.5) * 0.08 : 0)).toFixed(4) + ")";
      });
    });
  }

  // ------------------------------------------------------------------ 5. Galería horizontal fijada
  // <section data-cine-horizontal><div class="cine-horizontal__pista"> …tarjetas… </div></section>
  function horizontales() {
    todos("[data-cine-horizontal]").forEach(function (sec) {
      var pista = sec.querySelector(".cine-horizontal__pista") || sec.firstElementChild;
      if (!pista) return;
      sec.classList.add("cine-horizontal");
      if (reducido) { sec.classList.add("cine-horizontal--estatica"); return; }
      var fijo = doc.createElement("div"); fijo.className = "cine-horizontal__fijo";
      sec.insertBefore(fijo, pista); fijo.appendChild(pista);
      var recorrido = 0;
      function medir() {
        recorrido = Math.max(0, pista.scrollWidth - fijo.clientWidth);
        sec.style.height = (win.innerHeight + recorrido) + "px";
      }
      medir();
      win.addEventListener("resize", medir, { passive: true });
      win.addEventListener("load", medir);
      L.alScroll(sec, function (p) {
        pista.style.transform = "translate3d(" + (-p * recorrido).toFixed(1) + "px,0,0)";
        sec.style.setProperty("--p", p.toFixed(4));
      });
    });
  }

  // ------------------------------------------------------------------ 6. Tarjetas apiladas
  // <div data-cine-apilar> <article>…</article> × n </div>  → cada tarjeta se queda pegada y la siguiente la cubre
  function apilados() {
    todos("[data-cine-apilar]").forEach(function (grupo) {
      grupo.classList.add("cine-apilar");
      var tarjetas = Array.prototype.slice.call(grupo.children);
      tarjetas.forEach(function (t, i) { t.style.setProperty("--n", i); t.classList.add("cine-apilar__tarjeta"); });
      if (reducido) return;
      tarjetas.forEach(function (t, i) {
        var siguiente = tarjetas[i + 1];
        if (!siguiente) return;
        L.alScroll(siguiente, function (p) {
          // mientras la siguiente sube, esta se aleja y se oscurece
          var k = limitar(p / 0.5, 0, 1);
          t.style.setProperty("--cine-hundir", k.toFixed(4));
        });
      });
    });
  }

  // ------------------------------------------------------------------ 7. Cintas con inercia
  // <div data-cine-cinta="40"> <span>…</span> </div>  → se duplica sola, se mueve en bucle y acelera con el scroll
  function cintas() {
    todos("[data-cine-cinta]").forEach(function (el) {
      var base = parseFloat(el.getAttribute("data-cine-cinta")) || 40;   // px/s
      var pista = doc.createElement("div"); pista.className = "cine-cinta__pista";
      while (el.firstChild) pista.appendChild(el.firstChild);
      var copia = pista.cloneNode(true); copia.setAttribute("aria-hidden", "true");
      var marco = doc.createElement("div"); marco.className = "cine-cinta__marco";
      marco.appendChild(pista); marco.appendChild(copia);
      el.appendChild(marco); el.classList.add("cine-cinta");
      if (reducido) return;
      var x = 0, sentido = base < 0 ? -1 : 1, rapidez = Math.abs(base);
      L.alFrame(function (t, dt) {
        var w = pista.offsetWidth || 1;
        var extra = limitar(Math.abs(vel.suave) / 6, 0, rapidez * 6);
        if (Math.abs(vel.suave) > 40) sentido = (vel.suave > 0 ? 1 : -1) * (base < 0 ? -1 : 1);
        x -= sentido * (rapidez + extra) * dt;
        if (x <= -w) x += w; if (x > 0) x -= w;
        marco.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      });
    });
  }

  // ------------------------------------------------------------------ 8. Inclinación por velocidad
  // data-cine-velocidad="1"  → el elemento se inclina un poco al hacer scroll rápido (titulares, filas de imágenes)
  function velocidad() {
    if (reducido) return;
    var els = todos("[data-cine-velocidad]");
    if (!els.length) return;
    L.alFrame(function () {
      var s = limitar(vel.suave / 900, -1, 1);
      for (var i = 0; i < els.length; i++) {
        var f = parseFloat(els[i].getAttribute("data-cine-velocidad")) || 1;
        els[i].style.transform = "skewY(" + (s * -3.2 * f).toFixed(3) + "deg)";
      }
    });
  }

  // ------------------------------------------------------------------ 9. Texto que se descifra
  // <span data-cine-codigo>Texto</span>  → al entrar en pantalla, los caracteres se sortean hasta formar el texto
  var SIGNOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>=";
  function codigos() {
    var els = todos("[data-cine-codigo]");
    if (!els.length) return;
    function descifrar(el) {
      var final = el.getAttribute("data-cine-texto") || el.textContent;
      el.setAttribute("data-cine-texto", final);
      el.setAttribute("aria-label", final);
      if (reducido || QA) { el.textContent = final; return; }
      var inicio = performance.now(), dur = Math.min(1600, 380 + final.length * 45);
      (function paso(ahora) {
        var p = limitar((ahora - inicio) / dur, 0, 1), fijos = Math.floor(p * final.length), out = "";
        for (var i = 0; i < final.length; i++) {
          var c = final[i];
          out += i < fijos || c === " " ? c : SIGNOS[Math.floor(Math.random() * SIGNOS.length)];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(paso); else el.textContent = final;
      })(inicio);
    }
    if (!win.IntersectionObserver) { els.forEach(descifrar); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { descifrar(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ------------------------------------------------------------------ 10. Focos en rejillas
  // <div data-cine-foco> <article>…</article> … </div>  → un halo de luz sigue al puntero por toda la rejilla
  function focos() {
    if (!fino) return;
    todos("[data-cine-foco]").forEach(function (grupo) {
      grupo.classList.add("cine-foco");
      grupo.addEventListener("pointermove", function (e) {
        Array.prototype.forEach.call(grupo.children, function (h) {
          var r = h.getBoundingClientRect();
          h.style.setProperty("--fx", (e.clientX - r.left).toFixed(0) + "px");
          h.style.setProperty("--fy", (e.clientY - r.top).toFixed(0) + "px");
        });
      });
    });
  }

  // ------------------------------------------------------------------ 11. Tema por sección
  // <section data-cine-tema="oscuro"> … → al ocupar el centro de la pantalla, <html data-tema="oscuro">
  function temas() {
    var secciones = todos("[data-cine-tema]");
    if (!secciones.length) return;
    var actual = null;
    L.alFrame(function () {
      var centro = win.innerHeight / 2, elegido = null;
      for (var i = 0; i < secciones.length; i++) {
        var r = secciones[i].getBoundingClientRect();
        if (r.top <= centro && r.bottom >= centro) { elegido = secciones[i].getAttribute("data-cine-tema"); break; }
      }
      if (elegido !== actual) {
        actual = elegido;
        if (elegido) raiz.setAttribute("data-tema", elegido); else raiz.removeAttribute("data-tema");
      }
    });
  }

  // ------------------------------------------------------------------ 12. Barra de progreso de lectura
  // <div data-cine-progreso></div> en la cabecera
  function progreso() {
    var barras = todos("[data-cine-progreso]");
    if (!barras.length) return;
    L.alScroll(null, function (p) { barras.forEach(function (b) { b.style.setProperty("--p", p.toFixed(4)); }); });
  }

  function iniciar() {
    seguro(entrada, "cine:entrada");
    seguro(cursor, "cine:cursor");
    seguro(leer, "cine:leer");
    seguro(imagenes, "cine:imagenes");
    seguro(horizontales, "cine:horizontal");
    seguro(apilados, "cine:apilar");
    seguro(cintas, "cine:cintas");
    seguro(velocidad, "cine:velocidad");
    seguro(codigos, "cine:codigo");
    seguro(focos, "cine:focos");
    seguro(temas, "cine:temas");
    seguro(progreso, "cine:progreso");
    raiz.classList.add("cine-listo");
  }

  window.L3DCine = { version: "1.0.0", velocidad: vel };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
