/* escena.js — escena(s) 3D de este sitio. Punto de partida: ajusta formas, cantidades y movimiento
 * para que la escena cuente algo de ESTE negocio. Los colores llegan de --l3d-1…4 (css/sitio.css). */

/* capas-foto — producto FOTORREALISTA por capas: entra cayendo capa a capa, se funde en la foto del producto
 * entero y, con el scroll de su zona, se abre en profundidad (vista explotada) con etiquetas por capa.
 * Opcional: vapor (comida caliente, café) y chispas (plancha, brasa, forja) pintados en WebGL encima.
 *
 * Para: hamburguesas, sándwiches, tortas y postres por pisos, cócteles por capas, cosmética (frasco + tapa +
 * contenido), zapatillas o electrónica "despiezadas", cualquier producto que se entienda mejor por dentro.
 *
 * Por qué las fotos van en HTML y no como texturas de WebGL: abriendo index.html con doble clic (file://) el
 * navegador no deja subir imágenes locales a WebGL. Las capas son <img> con transformaciones 3D de CSS que esta
 * escena mueve en cada fotograma; el lienzo solo pinta partículas (sin texturas). Sin JS o sin WebGL se ve la
 * foto entera, quieta (estilos .capas-foto en base.css).
 *
 * HTML (dentro del contenedor de la escena, antes del <canvas>):
 *   <div class="capas-foto"><div class="capas-foto__caja">
 *     <img class="capas-foto__capa" data-capa="0" src="assets/img/producto/capa-0.webp" alt="" width=… height=…>
 *     … una por capa, 0 = la de arriba …
 *     <img class="capas-foto__entera" src="assets/img/producto/armada.webp" alt="" width=… height=… fetchpriority="high">
 *   </div></div>
 *   <canvas class="l3d-lienzo" data-escena="capas-foto" data-opciones='{"geo":{…},"vapor":true}'></canvas>
 * Las imágenes y la geometría salen de scripts/capas.py (pega su bloque "GEO" en data-opciones o en GEO_POR_DEFECTO).
 *
 * Opciones: geo {aspecto, armada, capas:[[x0,x1,y0,y1]…]} · planos {ancho, medio, movil: 3 × {x, y, s}} (centro
 *   en fracción del lienzo y s = alto del producto entero en fracción del alto; uno por tramo de la zona: inicio,
 *   mitad —abierto— y final) · etiquetas (selector de etiquetas HTML con data-capa) · vapor · chispas ·
 *   profundidad (px entre capas al abrir, 34) · junto (separación de las capas cerradas, 0.5) · caida (true) ·
 *   chispasColor (["#centro", "#borde"]; por defecto brasa naranja; p. ej. ["#7FE0C4", "#F4FFFB"] para un brillo limpio).
 *   Las chispas suman luz (blending aditivo): solo se ven sobre fondo oscuro.
 */
L3D.registrar("capas-foto", function (ctx) {
  var THREE = ctx.THREE, op = ctx.opciones || {};
  var escena = ctx.escena, camara = ctx.camara;
  var raizHtml = document.documentElement;
  var cont = ctx.canvas.parentElement;
  var geos = [], mats = [];

  function suave(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lim(x) { return Math.min(1, Math.max(0, x)); }

  var GEO_POR_DEFECTO = { aspecto: 0.664, armada: 0.869, capas: [] };
  var GEO = op.geo || GEO_POR_DEFECTO;
  var raizFoto = cont.querySelector(".capas-foto"), caja = raizFoto && raizFoto.querySelector(".capas-foto__caja");
  var entera = caja && caja.querySelector(".capas-foto__entera");
  if (!caja || !entera || !GEO.capas.length) {
    if (window.console) console.warn("[capas-foto] falta el HTML .capas-foto o la geometría (opción geo)");
    return {};
  }
  var capas = [], n = GEO.capas.length;
  Array.prototype.forEach.call(caja.querySelectorAll(".capas-foto__capa"), function (img) {
    var i = parseInt(img.getAttribute("data-capa"), 10) || 0, g = GEO.capas[i];
    if (!g) return;
    img.style.left = (g[0] * 100) + "%"; img.style.width = ((g[1] - g[0]) * 100) + "%";
    img.style.top = (g[2] * 100) + "%"; img.style.height = ((g[3] - g[2]) * 100) + "%";
    img.style.zIndex = String(n + 3 - i);   // la de arriba tapa a la de abajo (vista algo cenital)
    capas.push({ el: img, i: i, cy: (g[2] + g[3]) / 2, dy: 0 });
  });
  var anchoMax = 0;
  GEO.capas.forEach(function (g) { anchoMax = Math.max(anchoMax, g[1] - g[0]); });
  var altoEntera = anchoMax * GEO.aspecto / GEO.armada;     // fracción del alto del despiece
  entera.style.width = (anchoMax * 100) + "%";
  entera.style.left = ((1 - anchoMax) / 2 * 100) + "%";
  entera.style.top = ((0.5 - altoEntera / 2) * 100) + "%";
  entera.style.zIndex = String(n + 4);
  cont.classList.add("capas-foto-viva");

  var PLANOS = op.planos || {
    ancho: [{ x: 0.71, y: 0.55, s: 0.7 }, { x: 0.6, y: 0.535, s: 0.44 }, { x: 0.71, y: 0.5, s: 0.6 }],
    medio: [{ x: 0.6, y: 0.64, s: 0.5 }, { x: 0.5, y: 0.38, s: 0.34 }, { x: 0.55, y: 0.38, s: 0.42 }],
    movil: [{ x: 0.5, y: 0.77, s: 0.25 }, { x: 0.37, y: 0.335, s: 0.26 }, { x: 0.5, y: 0.3, s: 0.3 }]
  };
  var planos;
  function componer() { planos = ctx.aspecto >= 1.15 ? PLANOS.ancho : ctx.aspecto >= 0.8 ? PLANOS.medio : PLANOS.movil; }
  componer();

  // ---------------------------------------------------------------- WebGL: vapor y chispas (sin texturas)
  camara.fov = 38; camara.position.set(0, 0, 8.2); camara.lookAt(0, 0, 0); camara.updateProjectionMatrix();
  var ALTO_MUNDO = 2 * 8.2 * Math.tan(THREE.MathUtils.degToRad(19));
  function aMundo(px, py, v) { v.set((px / ctx.ancho - 0.5) * ALTO_MUNDO * ctx.aspecto, (0.5 - py / ctx.alto) * ALTO_MUNDO, 0); return v; }

  var vapor = null, sem = [], nVapor = op.vapor ? ctx.cantidad(46, 30, 0) : 0, i;
  if (nVapor) {
    var geoV = new THREE.BufferGeometry(); geos.push(geoV);
    for (i = 0; i < nVapor; i++) sem.push({ x: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 0.6, v: 0.18 + Math.random() * 0.2, f: Math.random() });
    geoV.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nVapor * 3), 3));
    geoV.setAttribute("aVida", new THREE.BufferAttribute(new Float32Array(nVapor), 1));
    var matV = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTam: { value: 260 }, uColor: { value: new THREE.Color(0xfff4e6) }, uOpacidad: { value: 1 } },
      vertexShader: "attribute float aVida; uniform float uTam; varying float vA;" +
        "void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;" +
        " gl_PointSize = uTam * (0.5 + aVida * 1.6) / -mv.z; vA = sin(aVida * 3.14159); }",
      fragmentShader: "uniform vec3 uColor; uniform float uOpacidad; varying float vA;" +
        "void main(){ float d = length(gl_PointCoord - 0.5); float a = pow(smoothstep(0.5, 0.0, d), 2.2) * vA * 0.075 * uOpacidad;" +
        " gl_FragColor = vec4(uColor, a); }"
    });
    mats.push(matV);
    vapor = new THREE.Points(geoV, matV);
    escena.add(vapor);
  }

  var chispas = null, semC = [], nChispas = op.chispas ? ctx.cantidad(70, 40, 16) : 0;
  if (nChispas) {
    var geoC = new THREE.BufferGeometry(); geos.push(geoC);
    for (i = 0; i < nChispas; i++) semC.push({ x: (Math.random() - 0.5) * 2.6, v: 0.1 + Math.random() * 0.22, f: Math.random(), o: Math.random() * 6.28, t: 0.5 + Math.random() });
    geoC.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nChispas * 3), 3));
    geoC.setAttribute("aVida", new THREE.BufferAttribute(new Float32Array(nChispas), 1));
    geoC.setAttribute("aTam", new THREE.BufferAttribute(new Float32Array(semC.map(function (q) { return q.t; })), 1));
    var matC = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTam: { value: 30 }, uOpacidad: { value: 1 }, uTiempo: { value: 0 },
        uC1: { value: new THREE.Color((op.chispasColor || [])[0] || 0xff6b14) }, uC2: { value: new THREE.Color((op.chispasColor || [])[1] || 0xffdb73) } },
      vertexShader: "attribute float aVida; attribute float aTam; uniform float uTam; uniform float uTiempo; varying float vA;" +
        "void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;" +
        " gl_PointSize = uTam * aTam * (1.0 - aVida * 0.6) / -mv.z;" +
        " vA = smoothstep(0.0, 0.12, aVida) * (1.0 - smoothstep(0.55, 1.0, aVida)) * (0.65 + 0.35 * sin(uTiempo * 9.0 + aTam * 40.0)); }",
      fragmentShader: "uniform float uOpacidad; varying float vA;" +
        "uniform vec3 uC1; uniform vec3 uC2; void main(){ float d = length(gl_PointCoord - 0.5); float k = smoothstep(0.5, 0.0, d);" +
        " vec3 c = mix(uC1, uC2, k * k);" +
        " gl_FragColor = vec4(c, k * k * vA * uOpacidad); }"
    });
    mats.push(matC);
    chispas = new THREE.Points(geoC, matC);
    escena.add(chispas);
  }

  var etiquetas = [];
  if (op.etiquetas) {
    Array.prototype.forEach.call(document.querySelectorAll(op.etiquetas), function (el) {
      etiquetas.push({ el: el, capa: parseInt(el.getAttribute("data-capa"), 10) || 0, visible: false });
    });
  }

  // ---------------------------------------------------------------- entrada
  var qa = raizHtml.classList.contains("l3d-qa") || /[?&]qa=/.test(location.search);
  var inicio = null, conCaida = op.caida !== false;
  function reloj() {   // segundos desde que terminó la cortina (Infinity = entrada hecha; −1 = aún no)
    if (qa || ctx.reducido || !conCaida) return Infinity;
    if (raizHtml.classList.contains("cine-entrando")) return -1;
    if (inicio === null) inicio = performance.now();
    return (performance.now() - inicio) / 1000;
  }
  function caer(p) { var c1 = 1.4, c3 = c1 + 1; return p >= 1 ? 1 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
  var finCaida = 0.1 + (n - 1) * 0.12 + 0.62;
  var profundidad = op.profundidad || 34, junto0 = op.junto || 0.5;

  var v = new THREE.Vector3(), tilX = 0, tilY = 0;
  return {
    actualizar: function (t) {
      var s = ctx.scroll;
      var e = suave(0.12, 0.42, s) * (1 - suave(0.62, 0.92, s));       // cuánto se abre (0..1)
      var w1 = suave(0.08, 0.45, s), w2 = suave(0.6, 0.95, s);
      var P = planos, m = ctx.mezclar;
      var cx = m(m(P[0].x, P[1].x, w1), P[2].x, w2) * ctx.ancho,
          cy = m(m(P[0].y, P[1].y, w1), P[2].y, w2) * ctx.alto,
          sa = m(m(P[0].s, P[1].s, w1), P[2].s, w2);
      var D = sa * ctx.alto / altoEntera, W = D * GEO.aspecto;

      tilY = m(tilY, ctx.puntero.x * (7 + 9 * e), 0.1);
      tilX = m(tilX, -ctx.puntero.y * (4 + 5 * e) + 6 * e, 0.1);
      var flota = ctx.reducido ? 0 : Math.sin(t * 1.15) * D * 0.006 * (1 - e);
      caja.style.width = W.toFixed(1) + "px"; caja.style.height = D.toFixed(1) + "px";
      caja.style.transform = "translate3d(" + (cx - W / 2).toFixed(1) + "px," + (cy - D / 2 + flota).toFixed(1) + "px,0) rotateX(" +
        tilX.toFixed(2) + "deg) rotateY(" + tilY.toFixed(2) + "deg)";

      var r = reloj(), ve = r < 0 ? 0 : 1;
      var fundido = r === Infinity ? 1 : suave(finCaida - 0.15, finCaida + 0.35, r);
      var abre = suave(0.0, 0.3, e);
      var opEntera = ve * Math.min(fundido, 1 - abre);
      entera.style.opacity = opEntera.toFixed(3);

      var junto = m(junto0, 1, e);
      for (var k = 0; k < capas.length; k++) {
        var c = capas[k], desdeAbajo = n - 1 - c.i;
        var p = r === Infinity ? 1 : r < 0 ? 0 : caer(lim((r - 0.1 - desdeAbajo * 0.12) / 0.62));
        c.dy = (c.cy - 0.5) * (junto - 1) * D - (1 - p) * ctx.alto * 0.7;
        // profundidad ≥ 0: una capa detrás del plano de la caja (z < 0) que entra desde opacidad 0 a veces no se pinta
        // (Chrome, preserve-3d). La de abajo queda en z = 0 y las de arriba se acercan.
        c.el.style.transform = "translate3d(0," + c.dy.toFixed(1) + "px," + ((n - 1 - c.i) * profundidad * 0.75 * e).toFixed(1) + "px)";
        c.el.style.opacity = (r < 0 ? 0 : Math.max(abre, 1 - fundido) * lim(p * 4)).toFixed(3);
      }
      caja.style.setProperty("--sombra", (ve * (1 - 0.7 * e)).toFixed(3));

      var anchoPx = anchoMax * W, arriba = cy - D * altoEntera / 2;
      var escala = (anchoPx / ctx.alto) * ALTO_MUNDO / 2.3;
      if (vapor) {
        aMundo(cx, arriba + D * altoEntera * 0.12, v); vapor.position.copy(v); vapor.scale.setScalar(escala);
        vapor.material.uniforms.uTam.value = 70 * 8.2 * ctx.dpr * Math.max(0.6, ctx.alto / 900) * escala;
        var pa = vapor.geometry.attributes.position, vi = vapor.geometry.attributes.aVida;
        for (var q = 0; q < sem.length; q++) {
          var sv = sem[q], vida = (sv.f + t * sv.v * 0.5) % 1;
          pa.setXYZ(q, sv.x * (0.5 + vida * 0.5) + Math.sin(t * 0.9 + q) * 0.1 * vida, vida * 1.15, sv.z);
          vi.setX(q, vida);
        }
        pa.needsUpdate = true; vi.needsUpdate = true;
        vapor.material.uniforms.uOpacidad.value = (1 - Math.min(1, e * 2.2)) * opEntera;
      }
      if (chispas) {
        aMundo(cx, cy + D * altoEntera * 0.42, v); chispas.position.copy(v); chispas.scale.setScalar(escala);
        chispas.material.uniforms.uTam.value = 30 * ctx.dpr * Math.max(0.7, ctx.alto / 900);
        chispas.material.uniforms.uTiempo.value = t;
        var pc = chispas.geometry.attributes.position, vc = chispas.geometry.attributes.aVida;
        for (q = 0; q < semC.length; q++) {
          var sc = semC[q], vidaC = (sc.f + t * sc.v * 0.35) % 1;
          pc.setXYZ(q, sc.x * (1 + vidaC * 0.35) + Math.sin(t * 1.3 + sc.o) * 0.18 * vidaC, vidaC * 3.6, 0.3);
          vc.setX(q, vidaC);
        }
        pc.needsUpdate = true; vc.needsUpdate = true;
        chispas.material.uniforms.uOpacidad.value = ve * (1 - 0.6 * e);
      }

      if (etiquetas.length) {
        var alfa = suave(0.55, 0.92, e), izq = cx - W / 2, sup = cy - D / 2;
        for (var j = 0; j < etiquetas.length; j++) {
          var et = etiquetas[j];
          if (alfa < 0.01) { if (et.visible) { et.el.style.opacity = "0"; et.visible = false; } continue; }
          var g = GEO.capas[et.capa], capa = null;
          for (var z = 0; z < capas.length; z++) if (capas[z].i === et.capa) capa = capas[z];
          if (!g || !capa) continue;
          et.el.style.transform = "translate3d(" + (izq + g[1] * W + 6).toFixed(1) + "px," + (sup + capa.cy * D + capa.dy).toFixed(1) + "px,0) translateY(-50%)";
          et.el.style.opacity = alfa.toFixed(3);
          et.visible = true;
        }
      }
    },
    alRedimensionar: function () { componer(); },
    destruir: function () {
      cont.classList.remove("capas-foto-viva");
      geos.forEach(function (x) { x.dispose(); }); mats.forEach(function (x) { x.dispose(); });
    }
  };
});

/* Escena "siluetas" — miles de partículas finas que se ensamblan dibujando una figura y se transforman
 * solas en otras (y también con el scroll). Entran en remolino, respiran, se apartan del puntero.
 * Es la más versátil: la figura puede ser un símbolo del negocio, un trazo SVG propio o una palabra.
 * Encaja con casi todo cuando se quiere elegancia: clínicas, mascotas, despachos, marcas personales, producto.
 *
 * data-opciones (todas opcionales):
 *   formas:   lista de figuras, en orden. Cada una es:
 *               "huella" | "corazon" | "cruz" | "escudo" | "gota" | "estrella" | "hoja" | "casa" | "rayo" | "circulo"
 *               {"trazo": "M10 80 L50 10 L90 80 Z"}   → un path SVG dibujado en una caja de 100×100
 *               {"texto": "24h"}                        → letras o una palabra corta
 *             (por defecto ["circulo"])
 *   ciclo:    segundos que dura cada figura antes de transformarse sola (por defecto 6; 0 = no rota sola)
 *   modo:     quién elige la figura — "auto" (por defecto: con zona propia, data-escena-scroll o
 *             [data-escena-zona], manda el scroll de la zona y quieta rota sola; sin zona, solo el ciclo),
 *             "ciclo" (solo el tiempo), "scroll" (solo el progreso de la zona), "mixto"
 *   La entrada en remolino espera a que termine la cortina de cine.js y, en escenas más abajo, a que se vean.
 *   cantidad: nº de partículas en calidad alta (por defecto 9000)
 *   tamano:   tamaño de la partícula (por defecto 1)
 *   escala:   tamaño de la figura (por defecto 1)
 *   movil:    [{x, y, s}, …] posición y escala de cada figura en pantallas verticales (si no, va al centro)
 *   x, y:     desplazamiento de la figura en pantallas anchas (por defecto 0)
 *   fondo:    "claro" | "oscuro" — se detecta solo a partir del color de fondo de la página
 * Colores: --l3d-1 → --l3d-2 (degradado de la figura), --l3d-3 (destellos).
 * Evento: el lienzo emite "l3d-figura" (detail.indice) al empezar cada figura, para una leyenda 01·02·03:
 *   lienzo.addEventListener("l3d-figura", function (e) { … e.detail.indice … });
 */
(function () {
  "use strict";
  if (!window.L3D) return;

  var LADO = 220;   // resolución del lienzo donde se dibuja cada figura para muestrearla

  // ---- figuras: cada función dibuja en un contexto 2D de 100×100 (origen arriba-izquierda)
  var FIGURAS = {
    circulo: function (g) { g.beginPath(); g.arc(50, 50, 38, 0, 6.2832); g.fill(); },
    huella: function (g) {
      function elipse(x, y, rx, ry, giro) { g.beginPath(); g.ellipse(x, y, rx, ry, giro, 0, 6.2832); g.fill(); }
      // almohadilla: tres lóbulos fundidos
      g.beginPath();
      g.moveTo(50, 46);
      g.bezierCurveTo(66, 46, 80, 62, 78, 76);
      g.bezierCurveTo(77, 88, 64, 90, 58, 86);
      g.bezierCurveTo(54, 83, 46, 83, 42, 86);
      g.bezierCurveTo(36, 90, 23, 88, 22, 76);
      g.bezierCurveTo(20, 62, 34, 46, 50, 46);
      g.fill();
      elipse(22, 42, 8.5, 11.5, -0.45); elipse(39, 24, 8.5, 12.5, -0.14);
      elipse(61, 24, 8.5, 12.5, 0.14); elipse(78, 42, 8.5, 11.5, 0.45);
    },
    corazon: function (g) {
      g.beginPath(); g.moveTo(50, 86);
      g.bezierCurveTo(14, 60, 8, 36, 22, 22); g.bezierCurveTo(34, 10, 48, 18, 50, 30);
      g.bezierCurveTo(52, 18, 66, 10, 78, 22); g.bezierCurveTo(92, 36, 86, 60, 50, 86); g.fill();
    },
    cruz: function (g) {
      function barra(x, y, w, h, r) {
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill();
      }
      barra(37, 12, 26, 76, 7); barra(12, 37, 76, 26, 7);
    },
    escudo: function (g) {
      g.beginPath(); g.moveTo(50, 8); g.bezierCurveTo(64, 16, 76, 18, 86, 18);
      g.bezierCurveTo(88, 52, 76, 78, 50, 92); g.bezierCurveTo(24, 78, 12, 52, 14, 18);
      g.bezierCurveTo(24, 18, 36, 16, 50, 8); g.fill();
    },
    gota: function (g) {
      g.beginPath(); g.moveTo(50, 8); g.bezierCurveTo(62, 30, 80, 46, 80, 64);
      g.bezierCurveTo(80, 80, 66, 92, 50, 92); g.bezierCurveTo(34, 92, 20, 80, 20, 64);
      g.bezierCurveTo(20, 46, 38, 30, 50, 8); g.fill();
    },
    estrella: function (g) {
      g.beginPath();
      for (var i = 0; i < 10; i++) {
        var r = i % 2 ? 18 : 42, a = -1.5708 + i * 0.62832;
        g[i ? "lineTo" : "moveTo"](50 + Math.cos(a) * r, 52 + Math.sin(a) * r);
      }
      g.closePath(); g.fill();
    },
    hoja: function (g) {
      g.beginPath(); g.moveTo(16, 86); g.bezierCurveTo(10, 40, 40, 12, 88, 12);
      g.bezierCurveTo(88, 60, 60, 90, 16, 86); g.fill();
    },
    casa: function (g) {
      g.beginPath(); g.moveTo(50, 10); g.lineTo(90, 46); g.lineTo(78, 46); g.lineTo(78, 88);
      g.lineTo(22, 88); g.lineTo(22, 46); g.lineTo(10, 46); g.closePath(); g.fill();
    },
    rayo: function (g) {
      g.beginPath(); g.moveTo(58, 6); g.lineTo(22, 54); g.lineTo(46, 54); g.lineTo(38, 94);
      g.lineTo(78, 42); g.lineTo(54, 42); g.closePath(); g.fill();
    }
  };

  /** Dibuja la figura y devuelve dos listas de píxeles rellenos: los del borde y los del interior. */
  function muestrear(figura) {
    var c = document.createElement("canvas"); c.width = c.height = LADO;
    var g = c.getContext("2d");
    g.fillStyle = "#000";
    g.save(); g.scale(LADO / 100, LADO / 100);
    if (typeof figura === "string") (FIGURAS[figura] || FIGURAS.circulo)(g);
    else if (figura && figura.trazo && window.Path2D) g.fill(new Path2D(figura.trazo));
    else if (figura && figura.texto) {
      var texto = String(figura.texto).slice(0, 12), tam = 60;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "800 " + tam + "px system-ui, 'Segoe UI', Arial, sans-serif";
      var ancho = g.measureText(texto).width;
      if (ancho > 88) { tam = tam * 88 / ancho; g.font = "800 " + tam + "px system-ui, 'Segoe UI', Arial, sans-serif"; }
      g.fillText(texto, 50, 52);
    } else FIGURAS.circulo(g);
    g.restore();
    var d = g.getImageData(0, 0, LADO, LADO).data, borde = [], dentro = [];
    function lleno(x, y) { return x >= 0 && y >= 0 && x < LADO && y < LADO && d[(y * LADO + x) * 4 + 3] > 120; }
    for (var y = 0; y < LADO; y++) for (var x = 0; x < LADO; x++) {
      if (!lleno(x, y)) continue;
      var enBorde = !lleno(x - 2, y) || !lleno(x + 2, y) || !lleno(x, y - 2) || !lleno(x, y + 2);
      (enBorde ? borde : dentro).push(x, y);
    }
    if (!dentro.length && !borde.length) return muestrear("circulo");
    return { borde: borde, dentro: dentro.length ? dentro : borde };
  }

  L3D.registrar("siluetas", function (ctx) {
    var THREE = ctx.THREE, op = ctx.opciones;
    var n = ctx.cantidad(op.cantidad || 9000, 5500, 3000);
    var formas = op.formas && op.formas.length ? op.formas : ["circulo"];
    var TAM = 4.6;   // la figura ocupa 4.6 unidades de escena
    function azar(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    // ¿fondo claro u oscuro? En claro las partículas se pintan opacas; en oscuro suman luz.
    function detectarClaro() {
      if (op.fondo) return op.fondo === "claro";
      var m = (getComputedStyle(document.body).backgroundColor || "").match(/[\d.]+/g);
      if (!m || (m.length > 3 && parseFloat(m[3]) === 0)) return false;
      return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.55;
    }
    var claro = detectarClaro();

    var objetivos = formas.map(function (figura, f) {
      var m = muestrear(figura), arr = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        // 38 % de las partículas dibujan el contorno: la figura se lee nítida aunque esté hecha de puntos
        var lista = azar(i * 3 + f * 17) < 0.38 ? m.borde : m.dentro;
        if (!lista.length) lista = m.dentro;
        var k = Math.floor(azar(i * 7 + f * 31 + 1) * (lista.length / 2)) * 2;
        var x = lista[k] + azar(i + 11) - 0.5, y = lista[k + 1] + azar(i + 23) - 0.5;
        arr[i * 3] = (x / LADO - 0.5) * TAM;
        arr[i * 3 + 1] = -(y / LADO - 0.5) * TAM;
        arr[i * 3 + 2] = (azar(i + 37) - 0.5) * 0.55;          // algo de grosor: al girar se nota el volumen
      }
      return arr;
    });

    var desde = new Float32Array(objetivos[0]), hasta = new Float32Array(objetivos[0]);
    var semilla = new Float32Array(n), origen = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      semilla[i] = azar(i + 5);
      // punto de partida de la entrada: una nube amplia alrededor
      var a = azar(i + 41) * 6.2832, b = Math.acos(2 * azar(i + 53) - 1), r = 4.5 + azar(i + 67) * 4;
      origen[i * 3] = Math.sin(b) * Math.cos(a) * r; origen[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r; origen[i * 3 + 2] = Math.cos(b) * r - 2;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(desde, 3));
    geo.setAttribute("aHasta", new THREE.BufferAttribute(hasta, 3));
    geo.setAttribute("aOrigen", new THREE.BufferAttribute(origen, 3));
    geo.setAttribute("aSemilla", new THREE.BufferAttribute(semilla, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    var material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      blending: claro ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: {
        uTiempo: { value: 0 }, uMezcla: { value: 0 }, uEntrada: { value: 0 },
        uPuntero: { value: new THREE.Vector3(99, 99, 0) },
        uTamano: { value: (op.tamano || 1) * ctx.renderer.getPixelRatio() * (claro ? 3.3 : 3.2) },
        uClaro: { value: claro ? 1 : 0 },
        uColor1: { value: ctx.color("--l3d-1", claro ? "#0b6b52" : "#7dd3fc") },
        uColor2: { value: ctx.color("--l3d-2", claro ? "#f0702f" : "#a78bfa") },
        uColor3: { value: ctx.color("--l3d-3", claro ? "#f9b84a" : "#ffffff") }
      },
      vertexShader: [
        "attribute vec3 aHasta; attribute vec3 aOrigen; attribute float aSemilla;",
        "uniform float uTiempo, uMezcla, uEntrada, uTamano; uniform vec3 uPuntero;",
        "varying float vTono; varying float vDestello; varying float vAlfa;",
        "void main(){",
        // transformación entre figuras, escalonada por partícula y con un remolino a medio camino
        "  float k = clamp(uMezcla * 1.5 - aSemilla * 0.5, 0.0, 1.0);",
        "  k = k * k * (3.0 - 2.0 * k);",
        "  vec3 p = mix(position, aHasta, k);",
        "  float vuelo = sin(k * 3.14159);",
        "  float ang = vuelo * (1.6 + aSemilla * 2.2);",
        "  p.xy = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xy * (1.0 + vuelo * 0.35);",
        "  p.z += vuelo * (aSemilla - 0.5) * 3.2;",
        // respiración: cada partícula flota un poco alrededor de su sitio
        "  float t = uTiempo;",
        "  p += 0.045 * vec3(sin(t * 0.9 + aSemilla * 43.0), cos(t * 0.7 + aSemilla * 57.0), sin(t * 0.8 + aSemilla * 71.0));",
        "  p.z += 0.10 * sin(t * 0.6 + p.x * 1.3 + p.y * 0.9);",
        // el puntero aparta las partículas cercanas
        "  vec2 lejos = p.xy - uPuntero.xy; float dist = length(lejos);",
        "  float empuje = smoothstep(1.25, 0.0, dist);",
        "  p.xy += normalize(lejos + 0.0001) * empuje * 0.55; p.z += empuje * 0.5;",
        // entrada: llegan en remolino desde la nube exterior
        "  float e = clamp(uEntrada * 1.7 - aSemilla * 0.7, 0.0, 1.0);",
        "  e = 1.0 - pow(1.0 - e, 3.0);",
        "  float giro = (1.0 - e) * 2.4;",
        "  vec3 o = aOrigen; o.xy = mat2(cos(giro), -sin(giro), sin(giro), cos(giro)) * o.xy;",
        "  p = mix(o, p, e);",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  vDestello = step(0.93, aSemilla);",                                   // ~7 % son destellos
        "  float pulso = 0.6 + 0.4 * sin(t * (1.2 + aSemilla * 2.0) + aSemilla * 90.0);",
        "  gl_PointSize = uTamano * (0.55 + aSemilla * 0.75 + vDestello * 1.5 * pulso) * (7.0 / -mv.z) * (0.6 + 0.4 * e);",
        "  vTono = clamp((p.y + 2.3) / 4.6 + (aSemilla - 0.5) * 0.35, 0.0, 1.0);",
        "  vAlfa = (0.35 + 0.65 * e) * (0.72 + 0.28 * pulso) * (1.0 - vuelo * 0.25);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor1, uColor2, uColor3; uniform float uClaro;",
        "varying float vTono; varying float vDestello; varying float vAlfa;",
        "void main(){",
        "  float d = length(gl_PointCoord - 0.5);",
        "  float forma = mix(smoothstep(0.5, 0.0, d), smoothstep(0.5, 0.32, d), uClaro);",   // en claro, punto nítido
        "  vec3 col = mix(mix(uColor1, uColor2, vTono), uColor3, vDestello);",
        "  gl_FragColor = vec4(col, forma * vAlfa * mix(0.9, 0.96, uClaro));",
        "}"
      ].join("\n")
    });

    var puntos = new THREE.Points(geo, material);
    var grupo = new THREE.Group(); grupo.add(puntos); ctx.escena.add(grupo);
    ctx.camara.position.set(0, 0, 7);

    var ciclo = op.ciclo === undefined ? 6 : op.ciclo;
    var escala = op.escala || 1, dx = op.x || 0, dy = op.y || 0;
    var actual = 0, siguiente = 0, mezcla = 0, enTransito = false, reloj = 0;
    var DURACION = 2.4;   // segundos de cada transformación
    var raizDoc = document.documentElement;
    // La entrada arranca la primera vez que la escena se ve de verdad: después de la cortina de cine.js y,
    // si está más abajo, al llegar a ella (el motor no actualiza escenas fuera de pantalla).
    var nacio = null;
    var sinEntrada = ctx.reducido || raizDoc.classList.contains("l3d-qa");
    // Quién elige la figura. "auto": con zona propia (data-escena-scroll o [data-escena-zona]) manda el scroll
    // de esa zona y, quieta, rota sola; sin zona, solo el ciclo (el scroll de toda la página no la mueve).
    var zonaPropia = ctx.canvas.hasAttribute("data-escena-scroll") || !!ctx.canvas.closest("[data-escena-zona]");
    var modo = op.modo || "auto";
    if (modo === "auto") modo = zonaPropia ? "mixto" : "ciclo";

    function irA(indice) {
      if (enTransito || indice === actual || formas.length < 2) return;
      siguiente = indice; hasta.set(objetivos[siguiente]); geo.attributes.aHasta.needsUpdate = true;
      mezcla = 0; enTransito = true; salio = performance.now();
      avisar(indice);
    }
    // Evento "l3d-figura" en el lienzo (detail.indice) para sincronizar una leyenda o un texto con la figura
    function avisar(indice) {
      try { ctx.canvas.dispatchEvent(new CustomEvent("l3d-figura", { detail: { indice: indice } })); } catch (e) {}
    }
    setTimeout(function () { avisar(0); }, 0);
    var salio = 0;

    var plano = new THREE.Vector3();
    return {
      // data-cine-tema cambió la página de oscuro a claro (o al revés): colores y mezcla nuevos
      alCambiarTema: function () {
        setTimeout(function () {   // tras la transición de color del body
          claro = detectarClaro();
          material.blending = claro ? THREE.NormalBlending : THREE.AdditiveBlending;
          material.needsUpdate = true;
          material.uniforms.uClaro.value = claro ? 1 : 0;
          material.uniforms.uColor1.value = ctx.color("--l3d-1", claro ? "#0b6b52" : "#7dd3fc");
          material.uniforms.uColor2.value = ctx.color("--l3d-2", claro ? "#f0702f" : "#a78bfa");
          material.uniforms.uColor3.value = ctx.color("--l3d-3", claro ? "#f9b84a" : "#ffffff");
        }, 850);
      },
      actualizar: function (t, dt) {
        material.uniforms.uTiempo.value = t;
        // la entrada usa el reloj real (no los fotogramas) y se omite en revisión (?qa) y con movimiento reducido
        if (nacio === null && !raizDoc.classList.contains("cine-entrando")) nacio = performance.now();
        var vida = nacio === null ? 0 : (performance.now() - nacio) / 1000;
        material.uniforms.uEntrada.value = sinEntrada ? 1 : Math.min(1, vida / 2.8);

        // qué figura toca, según el modo: "ciclo" (sola cada `ciclo` s), "scroll" (el progreso de la zona),
        // "mixto" (el scroll si se ha movido; quieta, sola)
        if (!enTransito && formas.length > 1) {
          var porScroll = Math.min(formas.length - 1, Math.floor(ctx.scroll * formas.length));
          var usaScroll = modo === "scroll" || (modo === "mixto" && ctx.scroll > 0.02);
          if (usaScroll) { if (porScroll !== actual) irA(porScroll); }
          else if (modo !== "scroll" && ciclo > 0 && (sinEntrada || vida > 3.2)) {
            reloj += dt;
            if (reloj > ciclo) { reloj = 0; irA((actual + 1) % formas.length); }
          }
        }
        if (enTransito) {
          mezcla = sinEntrada ? 1 : (performance.now() - salio) / (DURACION * 1000);   // reloj real: dura lo mismo en equipos lentos
          if (mezcla >= 1) {
            desde.set(objetivos[siguiente]); geo.attributes.position.needsUpdate = true;
            actual = siguiente; mezcla = 0; enTransito = false; reloj = 0;
          }
        }
        material.uniforms.uMezcla.value = mezcla;

        var vertical = ctx.aspecto < 1;
        var s = escala * (vertical ? Math.max(0.5, ctx.aspecto * 1.05) : 1);
        // "movil": [{x, y, s}, …] un plano por figura en pantallas verticales (la figura se aparta del texto de
        // cada paso); entre dos figuras se interpola con la transformación.
        var px = vertical ? 0 : dx, py = vertical ? 0 : dy;
        if (vertical && op.movil && op.movil.length) {
          var ma = op.movil[Math.min(actual, op.movil.length - 1)];
          var mb = op.movil[Math.min(enTransito ? siguiente : actual, op.movil.length - 1)];
          var km = enTransito ? Math.min(1, mezcla) : 0; km = km * km * (3 - 2 * km);
          px = ctx.mezclar(ma.x || 0, mb.x || 0, km); py = ctx.mezclar(ma.y || 0, mb.y || 0, km);
          s *= ctx.mezclar(ma.s || 1, mb.s || 1, km);
        }
        grupo.scale.setScalar(s);
        grupo.position.set(px, py, 0);
        grupo.rotation.y = Math.sin(t * 0.35) * 0.32 + ctx.puntero.x * 0.35;
        grupo.rotation.x = Math.sin(t * 0.27) * 0.10 - ctx.puntero.y * 0.25;

        // puntero llevado al plano de la figura (en coordenadas del grupo)
        var pl = ctx.punteroLocal;
        if (pl && pl.dentro) {
          var alto = 2 * Math.tan((ctx.camara.fov * Math.PI / 180) / 2) * ctx.camara.position.z;
          plano.set(pl.x * alto * ctx.aspecto * 0.5, pl.y * alto * 0.5, 0);
          grupo.worldToLocal(plano);
          material.uniforms.uPuntero.value.copy(plano);
        } else material.uniforms.uPuntero.value.set(99, 99, 0);
      },
      destruir: function () { geo.dispose(); material.dispose(); }
    };
  });
})();
