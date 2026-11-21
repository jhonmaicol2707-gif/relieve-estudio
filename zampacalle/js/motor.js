/*! L3D motor · landing-3d-pro
 * Motor de escenas 3D + movimiento para landings estáticas.
 * Sin build y sin dependencias obligatorias (Three.js solo si hay escena 3D).
 * NO editar por proyecto: el diseño vive en css/sitio.css, js/escena.js y js/app.js.
 */
(function () {
  "use strict";
  if (window.L3D) return;

  var win = window, doc = document, raiz = doc.documentElement;

  // ------------------------------------------------------------------ utilidades
  function mm(q) { return win.matchMedia ? win.matchMedia(q).matches : false; }
  function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mezclar(a, b, t) { return a + (b - a) * t; }
  function suavizar(t) { return t * t * (3 - 2 * t); }
  function todos(sel, ambito) { return Array.prototype.slice.call((ambito || doc).querySelectorAll(sel)); }
  function seguro(fn, nombre) {
    try { return fn(); } catch (e) { if (win.console) console.warn("[L3D] " + (nombre || "paso") + " falló:", e); }
  }
  function parametro(nombre) {
    try { return new URLSearchParams(win.location.search).get(nombre); } catch (e) { return null; }
  }

  var QA = parametro("qa");            // ?qa=0.5 → salta a esa fracción del scroll (revisión visual)
  var SIN_3D = parametro("sin3d") !== null;   // ?sin3d → fuerza el respaldo sin WebGL
  var reducido = mm("(prefers-reduced-motion: reduce)");
  var punteroFino = mm("(hover: hover) and (pointer: fine)");
  var tactil = mm("(pointer: coarse)");

  function soporta3D() {
    if (SIN_3D) return false;
    try {
      var c = doc.createElement("canvas");
      return !!(win.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  function medirCalidad() {
    var forzada = parametro("calidad");
    if (forzada === "alta" || forzada === "media" || forzada === "baja") return forzada;
    var nucleos = navigator.hardwareConcurrency || 4;
    var memoria = navigator.deviceMemory || 4;
    var estrecho = Math.min(win.innerWidth, win.innerHeight) < 600;
    if (nucleos <= 2 || memoria <= 2) return "baja";
    if (tactil || estrecho || nucleos <= 4 || memoria <= 4) return "media";
    return "alta";
  }
  var calidad = medirCalidad();

  /** Progreso 0..1 de un elemento respecto a la ventana.
   *  - Zona más alta que la ventana (canvas fijo dentro): 0 al entrar arriba, 1 al terminar.
   *  - Elemento normal: 0 cuando asoma por abajo, 1 cuando sale por arriba. */
  function progresoDe(el) {
    var vh = win.innerHeight || 1;
    if (!el || el === doc.body || el === raiz) {
      var max = raiz.scrollHeight - vh;
      return max > 0 ? limitar((win.pageYOffset || raiz.scrollTop) / max, 0, 1) : 0;
    }
    var r = el.getBoundingClientRect();
    if (r.height > vh * 1.2) return limitar(-r.top / (r.height - vh), 0, 1);
    return limitar((vh - r.top) / (vh + r.height), 0, 1);
  }

  // ------------------------------------------------------------------ bucle único
  var tareas = [];          // funciones (t, dt) por frame
  var ultimo = 0, enMarcha = false;
  function tic(ahora) {
    var t = ahora / 1000, dt = Math.min(0.05, ultimo ? t - ultimo : 0.016);
    ultimo = t;
    for (var i = 0; i < tareas.length; i++) seguro(function () { tareas[i](t, dt); }, "frame");
    win.requestAnimationFrame(tic);
  }
  function alFrame(fn) {
    tareas.push(fn);
    if (!enMarcha) { enMarcha = true; win.requestAnimationFrame(tic); }
    return function () { var i = tareas.indexOf(fn); if (i > -1) tareas.splice(i, 1); };
  }

  // puntero normalizado (-1..1) compartido
  var puntero = { x: 0, y: 0, activo: false };
  if (punteroFino) {
    win.addEventListener("pointermove", function (e) {
      puntero.x = (e.clientX / win.innerWidth) * 2 - 1;
      puntero.y = -((e.clientY / win.innerHeight) * 2 - 1);
      puntero.cx = e.clientX; puntero.cy = e.clientY;
      puntero.activo = true;
    }, { passive: true });
  }

  // ------------------------------------------------------------------ escenas 3D
  var fabricas = {}, arrancado = false;
  function registrar(nombre, fabrica) {
    fabricas[nombre] = fabrica;
    if (!arrancado) return;
    // La escena llegó después del arranque (script cargado tarde): monta lo que estuviera esperando.
    todos('canvas[data-escena="' + nombre + '"]').forEach(function (c) {
      if (c.__l3d) return;
      c.removeAttribute("hidden");
      c.parentElement.classList.remove("l3d-sin-3d");
      seguro(function () { montar(c); }, "montar escena");
    });
  }

  function leerOpciones(canvas) {
    var crudo = canvas.getAttribute("data-opciones");
    if (!crudo) return {};
    try { return JSON.parse(crudo); } catch (e) { console.warn("[L3D] data-opciones no es JSON válido"); return {}; }
  }

  function montar(canvas, extra) {
    if (!canvas || canvas.__l3d) return canvas && canvas.__l3d;
    var cont = canvas.parentElement;
    var nombre = (extra && extra.escena) || canvas.getAttribute("data-escena");

    function respaldo(motivo) {
      cont.classList.add("l3d-sin-3d");
      canvas.setAttribute("hidden", "");
      if (motivo && win.console) console.info("[L3D] escena '" + nombre + "' en modo respaldo: " + motivo);
      return null;
    }

    if (!soporta3D()) return respaldo("sin WebGL");
    if (!win.THREE) return respaldo("no se cargó lib/three.min.js");
    if (!fabricas[nombre]) return respaldo("escena no registrada");

    var THREE = win.THREE, renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: calidad !== "baja", powerPreference: "high-performance"
      });
    } catch (e) { return respaldo("no se pudo crear el contexto"); }

    renderer.setClearColor(0x000000, 0);
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    var dprMax = calidad === "alta" ? 2 : calidad === "media" ? 1.5 : 1;
    // La densidad de píxeles se fija ANTES de construir la escena: las que calculan el tamaño de punto con
    // renderer.getPixelRatio() (o ctx.dpr) lo hacen ya con el valor real en pantallas 2x.
    renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, dprMax));

    var escena = new THREE.Scene();
    var camara = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camara.position.set(0, 0, 6);

    var estilo = win.getComputedStyle(canvas);
    var selZona = canvas.getAttribute("data-escena-scroll");
    var zona = selZona ? doc.querySelector(selZona) : (canvas.closest("[data-escena-zona]") || null);

    var ctx = {
      THREE: THREE, renderer: renderer, escena: escena, camara: camara, canvas: canvas,
      calidad: calidad, reducido: reducido, tactil: tactil,
      dpr: renderer.getPixelRatio(),
      ancho: 1, alto: 1, aspecto: 1,
      puntero: { x: 0, y: 0 },      // suavizado, respecto a la ventana (para inclinar la escena)
      punteroLocal: { x: 0, y: 0, dentro: false },   // respecto al lienzo, −1..1 (para tocar objetos)
      scroll: 0,                    // progreso suavizado 0..1 de la zona
      opciones: Object.assign({}, leerOpciones(canvas), extra || {}),
      /** Color desde una variable CSS del canvas (así la escena sigue la paleta del sitio). Lee el valor
       *  actual cada vez: si la página cambia de tema (data-cine-tema), el motor llama a
       *  instancia.alCambiarTema(ctx) y la escena vuelve a pedir sus colores ahí. */
      color: function (variable, porDefecto) {
        var v = (estilo.getPropertyValue(variable) || "").trim();
        return new THREE.Color(v || porDefecto || "#ffffff");
      },
      /** Cantidad escalada por calidad del dispositivo. */
      cantidad: function (alta, media, baja) {
        return calidad === "alta" ? alta : calidad === "media" ? (media || Math.round(alta * 0.55)) : (baja || Math.round(alta * 0.3));
      },
      limitar: limitar, mezclar: mezclar, suavizar: suavizar
    };

    var instancia = seguro(function () { return fabricas[nombre](ctx) || {}; }, "escena " + nombre);
    if (!instancia) { renderer.dispose(); return respaldo("error al construir la escena"); }

    function medir() {
      var w = canvas.clientWidth || cont.clientWidth || 1, h = canvas.clientHeight || cont.clientHeight || 1;
      if (w === ctx.ancho && h === ctx.alto) return;
      ctx.ancho = w; ctx.alto = h; ctx.aspecto = w / h;
      renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, dprMax));
      renderer.setSize(w, h, false);
      camara.aspect = ctx.aspecto; camara.updateProjectionMatrix();
      if (instancia.alRedimensionar) seguro(function () { instancia.alRedimensionar(w, h); }, "redimensionar");
    }
    medir();
    if (instancia.alCambiarTema && win.MutationObserver) {
      new MutationObserver(function () {
        seguro(function () { instancia.alCambiarTema(ctx); }, "tema " + nombre);
      }).observe(raiz, { attributes: true, attributeFilter: ["data-tema"] });
    }
    if (win.ResizeObserver) new ResizeObserver(medir).observe(canvas);
    win.addEventListener("resize", medir, { passive: true });

    var visible = true;
    if (win.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "120px" }).observe(canvas);
    }

    var perdido = false, primera = true, tiempo = 0;
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); perdido = true; respaldo("contexto perdido"); });

    var escalaTiempo = reducido ? 0.25 : 1;   // con "reducir movimiento" la escena sigue viva pero muy tranquila
    ctx.scroll = progresoDe(zona);
    var quitar = alFrame(function (t, dt) {
      if (perdido || !visible || doc.hidden) return;
      tiempo += dt * escalaTiempo;
      var objetivo = progresoDe(zona);
      ctx.scroll = primera ? objetivo : mezclar(ctx.scroll, objetivo, 1 - Math.pow(0.001, dt));
      if (!reducido) {
        ctx.puntero.x = mezclar(ctx.puntero.x, puntero.x, 1 - Math.pow(0.02, dt));
        ctx.puntero.y = mezclar(ctx.puntero.y, puntero.y, 1 - Math.pow(0.02, dt));
        if (puntero.activo) {
          var caja = canvas.getBoundingClientRect();
          var lx = ((puntero.cx - caja.left) / caja.width) * 2 - 1, ly = -(((puntero.cy - caja.top) / caja.height) * 2 - 1);
          ctx.punteroLocal.dentro = Math.abs(lx) <= 1.2 && Math.abs(ly) <= 1.2;
          ctx.punteroLocal.x = mezclar(ctx.punteroLocal.x, lx, 1 - Math.pow(0.0005, dt));
          ctx.punteroLocal.y = mezclar(ctx.punteroLocal.y, ly, 1 - Math.pow(0.0005, dt));
        }
      }
      if (instancia.actualizar) instancia.actualizar(tiempo, dt * escalaTiempo);
      renderer.render(escena, camara);
      if (primera) { primera = false; cont.classList.add("l3d-lista"); }
    });

    canvas.__l3d = {
      ctx: ctx,
      destruir: function () {
        quitar();
        if (instancia.destruir) seguro(instancia.destruir, "destruir");
        renderer.dispose();
        canvas.__l3d = null;
      }
    };
    return canvas.__l3d;
  }

  function montarEscenas() {
    todos("canvas[data-escena]").forEach(function (c) { seguro(function () { montar(c); }, "montar escena"); });
  }

  // ------------------------------------------------------------------ texto dividido
  function dividir(el) {
    if (el.__l3dDividido) return;
    el.__l3dDividido = true;
    var modo = el.getAttribute("data-dividir") || "palabras";
    var indice = 0;
    if (modo === "letras") el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());

    function pieza(texto) {
      var fuera = doc.createElement("span"); fuera.className = "l3d-pieza";
      var dentro = doc.createElement("span"); dentro.textContent = texto;
      dentro.style.setProperty("--i", indice++);
      fuera.appendChild(dentro);
      if (modo === "letras") fuera.setAttribute("aria-hidden", "true");
      return fuera;
    }
    function recorrer(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
        if (hijo.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function (trozo) {
            if (!trozo) return;
            if (/^\s+$/.test(trozo)) { frag.appendChild(doc.createTextNode(" ")); return; }
            if (modo === "letras") {
              var palabra = doc.createElement("span"); palabra.className = "l3d-palabra";
              Array.from(trozo).forEach(function (letra) { palabra.appendChild(pieza(letra)); });
              frag.appendChild(palabra);
            } else frag.appendChild(pieza(trozo));
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1 && hijo.tagName !== "BR") recorrer(hijo);
      });
    }
    recorrer(el);
    el.classList.add("l3d-dividido");
  }

  // ------------------------------------------------------------------ revelados
  function iniciarRevelados() {
    todos("[data-dividir]").forEach(function (el) { seguro(function () { dividir(el); }, "dividir"); });
    todos("[data-revelar-grupo]").forEach(function (grupo) {
      Array.prototype.slice.call(grupo.children).forEach(function (hijo, i) {
        if (!hijo.hasAttribute("data-revelar")) hijo.setAttribute("data-revelar", grupo.getAttribute("data-revelar-grupo") || "");
        hijo.style.setProperty("--i", i);
      });
    });
    var elementos = todos("[data-revelar], [data-dividir], [data-contar]");
    function mostrar(el) {
      if (el.classList.contains("visible")) return;
      el.classList.add("visible");
      if (el.hasAttribute("data-contar")) contar(el);
      // Quita el recorte cuando acaba el revelado (sombras y elementos que sobresalen se ven enteros).
      var tipo = el.getAttribute("data-revelar");
      if (tipo === "mascara" || tipo === "cortina") {
        var acabar = function () { el.classList.add("revelado"); };
        el.addEventListener("transitionend", function fin(ev) {
          if (ev.target === el && ev.propertyName === "clip-path") { el.removeEventListener("transitionend", fin); acabar(); }
        });
        win.setTimeout(acabar, 2600);
      }
    }
    if (!win.IntersectionObserver) { elementos.forEach(mostrar); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting || en.boundingClientRect.top < 0) { mostrar(en.target); io.unobserve(en.target); }
      });
    }, { threshold: QA !== null ? 0 : 0.05, rootMargin: QA !== null ? "0px" : "0px 0px -6% 0px" });
    elementos.forEach(function (el) { io.observe(el); });
    // Red de seguridad: si algo impide que el observador dispare, nada se queda invisible.
    win.setTimeout(function () {
      elementos.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < (win.innerHeight || 0) && r.bottom > 0) mostrar(el);
      });
    }, QA !== null ? 300 : 2500);
  }

  function contar(el) {
    var fin = parseFloat(el.getAttribute("data-contar")) || 0;
    var decimales = parseInt(el.getAttribute("data-decimales") || "0", 10);
    var prefijo = el.getAttribute("data-prefijo") || "", sufijo = el.getAttribute("data-sufijo") || "";
    var idioma = raiz.lang || "es";
    function pintar(v) {
      el.textContent = prefijo + v.toLocaleString(idioma, { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + sufijo;
    }
    if (reducido) { pintar(fin); return; }
    var inicio = null, dur = 1600;
    function paso(ahora) {
      if (inicio === null) inicio = ahora;
      var p = limitar((ahora - inicio) / dur, 0, 1);
      pintar(fin * (1 - Math.pow(2, -10 * p)) / (1 - Math.pow(2, -10)));
      if (p < 1) win.requestAnimationFrame(paso); else pintar(fin);
    }
    win.requestAnimationFrame(paso);
  }

  // ------------------------------------------------------------------ scroll: --p y paralaje
  var escuchas = [];
  /** Llama a fn(p) cada vez que cambia el progreso 0..1 de un elemento (o de la página si el es null). */
  function alScroll(el, fn) { escuchas.push({ el: el, fn: fn, p: -1 }); }

  function iniciarScroll() {
    var conProgreso = todos("[data-progreso]");
    var conParalaje = reducido ? [] : todos("[data-paralaje]");
    function emitir(e) {
      var p = progresoDe(e.el);
      if (Math.abs(p - e.p) > 0.0005) { e.p = p; seguro(function () { e.fn(p); }, "alScroll"); }
    }
    alFrame(function () {
      var vh = win.innerHeight, i, el, r;
      for (i = 0; i < conProgreso.length; i++) {
        el = conProgreso[i]; r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        el.style.setProperty("--p", progresoDe(el).toFixed(4));
      }
      for (i = 0; i < conParalaje.length; i++) {
        el = conParalaje[i]; r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var factor = parseFloat(el.getAttribute("data-paralaje")) || 0.15;
        var actual = el.__l3dY || 0;
        var centro = (r.top - actual) + r.height / 2 - vh / 2;
        var y = -centro * factor;
        el.__l3dY = y;
        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      }
      for (i = 0; i < escuchas.length; i++) emitir(escuchas[i]);
    });
  }

  // ------------------------------------------------------------------ puntero: inclinación e imán
  function iniciarPuntero() {
    if (!punteroFino || reducido) return;
    todos("[data-inclinar]").forEach(function (el) {
      var max = parseFloat(el.getAttribute("data-inclinar")) || 7;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--rx", (-y * max).toFixed(2) + "deg");
        el.style.setProperty("--ry", (x * max).toFixed(2) + "deg");
        el.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
      });
    });
    todos("[data-iman]").forEach(function (el) {
      var fuerza = parseFloat(el.getAttribute("data-iman")) || 0.3;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--ix", ((e.clientX - r.left - r.width / 2) * fuerza).toFixed(1) + "px");
        el.style.setProperty("--iy", ((e.clientY - r.top - r.height / 2) * fuerza).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--ix", "0px"); el.style.setProperty("--iy", "0px");
      });
    });
  }

  // ------------------------------------------------------------------ navegación
  function iniciarNav() {
    var nav = doc.querySelector("[data-nav]");
    var boton = doc.querySelector("[data-menu-boton]");
    if (nav) {
      var previo = 0, autoOcultar = nav.getAttribute("data-nav") === "auto-ocultar";
      var alDesplazar = function () {
        var y = win.pageYOffset || 0;
        nav.classList.toggle("con-fondo", y > 24);
        if (autoOcultar) nav.classList.toggle("oculta", y > previo && y > 400 && !raiz.classList.contains("menu-abierto"));
        previo = y;
      };
      win.addEventListener("scroll", alDesplazar, { passive: true });
      alDesplazar();
    }
    if (boton) {
      var cerrar = function () { raiz.classList.remove("menu-abierto"); boton.setAttribute("aria-expanded", "false"); };
      boton.setAttribute("aria-expanded", "false");
      boton.addEventListener("click", function () {
        var abierto = raiz.classList.toggle("menu-abierto");
        boton.setAttribute("aria-expanded", abierto ? "true" : "false");
      });
      doc.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
      todos("[data-menu] a").forEach(function (a) { a.addEventListener("click", cerrar); });
    }
  }

  // ------------------------------------------------------------------ arranque
  function arrancar() {
    arrancado = true;
    raiz.classList.add("l3d-arrancado");
    raiz.classList.add("l3d-calidad-" + calidad);
    if (reducido) raiz.classList.add("l3d-reducido");
    seguro(iniciarNav, "nav");
    seguro(iniciarRevelados, "revelados");
    seguro(iniciarScroll, "scroll");
    seguro(iniciarPuntero, "puntero");
    seguro(montarEscenas, "escenas");

    var cargada = function () { raiz.classList.add("l3d-cargada"); };
    if (doc.readyState === "complete") cargada(); else win.addEventListener("load", cargada);
    win.setTimeout(cargada, 3000);   // nunca dejar la entrada esperando a un recurso lento

    if (QA !== null) {
      raiz.classList.add("l3d-qa");
      raiz.style.scrollBehavior = "auto";
      var saltar = function () {
        var max = raiz.scrollHeight - win.innerHeight;
        win.scrollTo(0, Math.max(0, max) * limitar(parseFloat(QA) || 0, 0, 1));
      };
      saltar(); win.addEventListener("load", saltar); win.setTimeout(saltar, 400);
    }
  }

  var L3D = win.L3D = {
    version: "1.0.0",
    calidad: calidad, reducido: reducido, punteroFino: punteroFino,
    soporta3D: soporta3D, registrar: registrar, montar: montar,
    alFrame: alFrame, alScroll: alScroll, progresoDe: progresoDe,
    seguro: seguro, limitar: limitar, mezclar: mezclar, suavizar: suavizar, todos: todos
  };

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
