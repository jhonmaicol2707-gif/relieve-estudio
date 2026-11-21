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
