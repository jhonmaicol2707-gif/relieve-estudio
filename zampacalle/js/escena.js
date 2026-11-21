/* escena.js — "hamburguesa": la Zampa Clásica con FOTOS reales por capas + vapor y chispas en WebGL.
 *
 * Por qué fotos en HTML y no texturas en WebGL: abriendo index.html con doble clic (file://), Chrome no deja
 * subir imágenes locales a WebGL (seguridad). Las capas son <img> con transformaciones 3D de CSS que esta
 * escena mueve en cada fotograma; el lienzo WebGL solo pinta vapor y chispas (sin texturas), encima.
 *
 * Concepto: "¿con todo?" = todas las capas. Al entrar, las capas caen una a una y se funden en la foto de la
 * hamburguesa armada; con el scroll de la zona (portada → anatomía → cierre) se despieza en profundidad, con
 * etiquetas numeradas pegadas a cada capa, y vuelve a cerrarse.
 *
 * HTML esperado dentro del contenedor de la escena (ver index.html):
 *   .hamb > .hamb__caja > img.hamb__armada + img.hamb__capa[data-capa=0..6] (0 = pan de arriba)
 * Opciones (data-opciones): etiquetas (selector, con data-capa 0..6), vapor (true/false), chispas (true/false).
 * Geometría de las capas: fracciones de la imagen de despiece original (salida de cortar_capas.py).
 */
L3D.registrar("hamburguesa", function (ctx) {
  var THREE = ctx.THREE, op = ctx.opciones || {};
  var escena = ctx.escena, camara = ctx.camara;
  var raizHtml = document.documentElement;
  var cont = ctx.canvas.parentElement;
  var geos = [], mats = [];

  function suave(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lim(x) { return Math.min(1, Math.max(0, x)); }

  // ---------------------------------------------------------------- capas (HTML)
  var GEO = {
    aspecto: 0.6640625,            // ancho / alto de la imagen de despiece
    armada: 0.8687,                // ancho / alto de la foto armada (recortada)
    capas: [                        // x0, x1, y0, y1 (fracciones), de arriba abajo
      [0.2022, 0.7868, 0.0054, 0.1772], [0.2074, 0.7897, 0.1909, 0.2803], [0.1441, 0.8588, 0.2827, 0.4214],
      [0.1507, 0.8441, 0.4204, 0.5371], [0.1610, 0.8338, 0.5371, 0.6978], [0.1618, 0.8257, 0.6650, 0.8369],
      [0.1743, 0.8147, 0.8315, 0.9941]
    ]
  };
  var hamb = cont.querySelector(".hamb"), caja = hamb && hamb.querySelector(".hamb__caja");
  var armada = caja && caja.querySelector(".hamb__armada");
  var capas = [];
  if (caja) {
    Array.prototype.forEach.call(caja.querySelectorAll(".hamb__capa"), function (img) {
      var i = parseInt(img.getAttribute("data-capa"), 10) || 0, g = GEO.capas[i];
      if (!g) return;
      img.style.left = (g[0] * 100) + "%"; img.style.width = ((g[1] - g[0]) * 100) + "%";
      img.style.top = (g[2] * 100) + "%"; img.style.height = ((g[3] - g[2]) * 100) + "%";
      img.style.zIndex = String(10 - i);   // la de arriba tapa a la de abajo (vista algo cenital)
      capas.push({ el: img, i: i, cy: (g[2] + g[3]) / 2, x1: g[1] });
    });
  }
  // Foto armada: tan ancha como la capa más ancha y centrada en el despiece
  var anchoMax = 0;
  GEO.capas.forEach(function (g) { anchoMax = Math.max(anchoMax, g[1] - g[0]); });
  var altoArmada = anchoMax * GEO.aspecto / GEO.armada;     // fracción del alto del despiece
  if (armada) {
    armada.style.width = (anchoMax * 100) + "%";
    armada.style.left = ((1 - anchoMax) / 2 * 100) + "%";
    armada.style.top = ((0.5 - altoArmada / 2) * 100) + "%";
  }
  if (cont && caja) cont.classList.add("hamb-viva");

  // ---------------------------------------------------------------- composición según pantalla
  // Tres planos de la zona: portada, anatomía, cierre: centro (x, y en fracción del lienzo) y s = alto de la
  // hamburguesa armada en fracción del alto del lienzo.
  var planos;
  function componer() {
    var a = ctx.aspecto;
    if (a >= 1.15) planos = [{ x: 0.71, y: 0.55, s: 0.7 }, { x: 0.6, y: 0.535, s: 0.44 }, { x: 0.71, y: 0.5, s: 0.6 }];
    else if (a >= 0.8) planos = [{ x: 0.6, y: 0.64, s: 0.5 }, { x: 0.5, y: 0.38, s: 0.34 }, { x: 0.55, y: 0.38, s: 0.42 }];
    // móvil: en la portada, bajo el texto; en la anatomía, entre la cabecera y la tarjeta
    else planos = [{ x: 0.5, y: 0.77, s: 0.25 }, { x: 0.37, y: 0.335, s: 0.262 }, { x: 0.5, y: 0.3, s: 0.3 }];
  }
  componer();

  // ---------------------------------------------------------------- WebGL: vapor y chispas
  camara.fov = 38; camara.position.set(0, 0, 8.2); camara.lookAt(0, 0, 0); camara.updateProjectionMatrix();
  var ALTO_MUNDO = 2 * 8.2 * Math.tan(THREE.MathUtils.degToRad(19));
  function aMundo(px, py, v) { v.set((px / ctx.ancho - 0.5) * ALTO_MUNDO * ctx.aspecto, (0.5 - py / ctx.alto) * ALTO_MUNDO, 0); return v; }

  var vapor = null, sem = [], nVapor = op.vapor === false ? 0 : ctx.cantidad(46, 30, 0);
  if (nVapor) {
    var geoV = new THREE.BufferGeometry(); geos.push(geoV);
    for (var i = 0; i < nVapor; i++) sem.push({ x: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 0.6, v: 0.18 + Math.random() * 0.2, f: Math.random() });
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

  // Chispas de la plancha: puntos cálidos que suben y parpadean alrededor de la hamburguesa
  var chispas = null, semC = [], nChispas = op.chispas === false ? 0 : ctx.cantidad(70, 40, 16);
  if (nChispas) {
    var geoC = new THREE.BufferGeometry(); geos.push(geoC);
    for (i = 0; i < nChispas; i++) semC.push({ x: (Math.random() - 0.5) * 2.6, v: 0.1 + Math.random() * 0.22, f: Math.random(), o: Math.random() * 6.28, t: 0.5 + Math.random() });
    geoC.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nChispas * 3), 3));
    geoC.setAttribute("aVida", new THREE.BufferAttribute(new Float32Array(nChispas), 1));
    geoC.setAttribute("aTam", new THREE.BufferAttribute(new Float32Array(semC.map(function (q) { return q.t; })), 1));
    var matC = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTam: { value: 30 }, uOpacidad: { value: 1 }, uTiempo: { value: 0 } },
      vertexShader: "attribute float aVida; attribute float aTam; uniform float uTam; uniform float uTiempo; varying float vA;" +
        "void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;" +
        " gl_PointSize = uTam * aTam * (1.0 - aVida * 0.6) / -mv.z;" +
        " vA = smoothstep(0.0, 0.12, aVida) * (1.0 - smoothstep(0.55, 1.0, aVida)) * (0.65 + 0.35 * sin(uTiempo * 9.0 + aTam * 40.0)); }",
      fragmentShader: "uniform float uOpacidad; varying float vA;" +
        "void main(){ float d = length(gl_PointCoord - 0.5); float n = smoothstep(0.5, 0.0, d);" +
        " vec3 c = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.86, 0.45), n * n);" +
        " gl_FragColor = vec4(c, n * n * vA * uOpacidad); }"
    });
    mats.push(matC);
    chispas = new THREE.Points(geoC, matC);
    escena.add(chispas);
  }

  // ---------------------------------------------------------------- etiquetas HTML
  var etiquetas = [];
  if (op.etiquetas) {
    Array.prototype.forEach.call(document.querySelectorAll(op.etiquetas), function (el) {
      etiquetas.push({ el: el, capa: parseInt(el.getAttribute("data-capa"), 10) || 0, visible: false });
    });
  }

  // ---------------------------------------------------------------- entrada: caen una a una y se funden
  var qa = raizHtml.classList.contains("l3d-qa") || /[?&]qa=/.test(location.search);
  var inicio = null;
  function reloj() {   // segundos desde que terminó la cortina (Infinity = entrada hecha)
    if (qa || ctx.reducido) return Infinity;
    if (raizHtml.classList.contains("cine-entrando")) return -1;
    if (inicio === null) inicio = performance.now();
    return (performance.now() - inicio) / 1000;
  }
  function caer(p) { var c1 = 1.4, c3 = c1 + 1; return p >= 1 ? 1 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }

  var v = new THREE.Vector3(), tilX = 0, tilY = 0;
  return {
    actualizar: function (t, dt) {
      if (!caja) return;
      var s = ctx.scroll;
      var e = suave(0.12, 0.42, s) * (1 - suave(0.62, 0.92, s));       // cuánto se despieza (0..1)
      var w1 = suave(0.08, 0.45, s), w2 = suave(0.6, 0.95, s);
      var P = planos, m = ctx.mezclar;
      var cx = m(m(P[0].x, P[1].x, w1), P[2].x, w2) * ctx.ancho,
          cy = m(m(P[0].y, P[1].y, w1), P[2].y, w2) * ctx.alto,
          sa = m(m(P[0].s, P[1].s, w1), P[2].s, w2);
      var D = sa * ctx.alto / altoArmada, W = D * GEO.aspecto;     // caja del despiece en px

      // inclinación hacia el puntero (más marcada con las capas abiertas: se nota la profundidad)
      tilY = m(tilY, ctx.puntero.x * (7 + 9 * e), 0.1);
      tilX = m(tilX, -ctx.puntero.y * (4 + 5 * e) + 6 * e, 0.1);
      var flota = ctx.reducido ? 0 : Math.sin(t * 1.15) * D * 0.006 * (1 - e);
      caja.style.width = W.toFixed(1) + "px"; caja.style.height = D.toFixed(1) + "px";
      caja.style.transform = "translate3d(" + (cx - W / 2).toFixed(1) + "px," + (cy - D / 2 + flota).toFixed(1) + "px,0) rotateX(" +
        tilX.toFixed(2) + "deg) rotateY(" + tilY.toFixed(2) + "deg)";

      // entrada
      var r = reloj(), visibleEntrada = r < 0 ? 0 : 1;
      var fundido = r === Infinity ? 1 : suave(1.35, 1.85, r);         // capas → foto armada
      var abre = suave(0.0, 0.3, e);                                     // foto armada → capas al despiezar
      var opArmada = visibleEntrada * Math.min(fundido, 1 - abre);
      armada.style.opacity = opArmada.toFixed(3);

      var junto = m(0.5, 1, e);                                          // separación entre centros
      for (var k = 0; k < capas.length; k++) {
        var c = capas[k], desdeAbajo = 6 - c.i;
        var p = r === Infinity ? 1 : r < 0 ? 0 : caer(lim((r - 0.1 - desdeAbajo * 0.12) / 0.62));
        var dy = (c.cy - 0.5) * (junto - 1) * D - (1 - p) * ctx.alto * 0.7;
        var dz = (3 - c.i) * 34 * e;
        var opCapa = r < 0 ? 0 : Math.max(abre, 1 - fundido) * lim(p * 4);
        c.el.style.transform = "translate3d(0," + dy.toFixed(1) + "px," + dz.toFixed(1) + "px)";
        c.el.style.opacity = opCapa.toFixed(3);
        c.dy = dy;
      }
      caja.style.setProperty("--sombra", (visibleEntrada * (1 - 0.7 * e)).toFixed(3));

      // vapor y chispas sobre la foto
      var anchoPx = anchoMax * W, arriba = cy - D * altoArmada / 2;
      var escala = (anchoPx / ctx.alto) * ALTO_MUNDO / 2.3;
      if (vapor) {
        aMundo(cx, arriba + D * altoArmada * 0.12, v); vapor.position.copy(v); vapor.scale.setScalar(escala);
        vapor.material.uniforms.uTam.value = 70 * 8.2 * ctx.dpr * Math.max(0.6, ctx.alto / 900) * escala;
        var pa = vapor.geometry.attributes.position, vi = vapor.geometry.attributes.aVida;
        for (var n = 0; n < sem.length; n++) {
          var q = sem[n], vidaN = (q.f + t * q.v * 0.5) % 1;
          pa.setXYZ(n, q.x * (0.5 + vidaN * 0.5) + Math.sin(t * 0.9 + n) * 0.1 * vidaN, vidaN * 1.15, q.z);
          vi.setX(n, vidaN);
        }
        pa.needsUpdate = true; vi.needsUpdate = true;
        vapor.material.uniforms.uOpacidad.value = (1 - Math.min(1, e * 2.2)) * opArmada;
      }
      if (chispas) {
        aMundo(cx, cy + D * altoArmada * 0.42, v); chispas.position.copy(v); chispas.scale.setScalar(escala);
        chispas.material.uniforms.uTam.value = 30 * ctx.dpr * Math.max(0.7, ctx.alto / 900);
        chispas.material.uniforms.uTiempo.value = t;
        var pc = chispas.geometry.attributes.position, vc = chispas.geometry.attributes.aVida;
        for (n = 0; n < semC.length; n++) {
          var qc = semC[n], vida = (qc.f + t * qc.v * 0.35) % 1;
          pc.setXYZ(n, qc.x * (1 + vida * 0.35) + Math.sin(t * 1.3 + qc.o) * 0.18 * vida, vida * 3.6, 0.3);
          vc.setX(n, vida);
        }
        pc.needsUpdate = true; vc.needsUpdate = true;
        chispas.material.uniforms.uOpacidad.value = visibleEntrada * (1 - 0.6 * e);
      }

      // etiquetas pegadas al borde derecho de cada capa
      if (etiquetas.length) {
        var alfa = suave(0.55, 0.92, e);
        var izq = cx - W / 2, sup = cy - D / 2;
        for (var j = 0; j < etiquetas.length; j++) {
          var et = etiquetas[j];
          if (alfa < 0.01) { if (et.visible) { et.el.style.opacity = "0"; et.visible = false; } continue; }
          var g = GEO.capas[et.capa], capa = null;
          for (var z = 0; z < capas.length; z++) if (capas[z].i === et.capa) capa = capas[z];
          if (!g || !capa) continue;
          var ex = izq + g[1] * W + 6, ey = sup + capa.cy * D + capa.dy;
          et.el.style.transform = "translate3d(" + ex.toFixed(1) + "px," + ey.toFixed(1) + "px,0) translateY(-50%)";
          et.el.style.opacity = alfa.toFixed(3);
          et.visible = true;
        }
      }
    },
    alRedimensionar: function () { componer(); },
    destruir: function () {
      if (cont) cont.classList.remove("hamb-viva");
      geos.forEach(function (x) { x.dispose(); }); mats.forEach(function (x) { x.dispose(); });
    }
  };
});
