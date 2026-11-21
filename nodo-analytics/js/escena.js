/* escena.js — la escena 3D de Nodo Analytics. Los colores llegan de --l3d-1…4 (css/sitio.css).
 *
 * Qué cuenta: lo que hace el producto. Una nube desordenada de puntos (ventas sueltas) se ordena al bajar:
 *   "nube"   → ventas dispersas (portada)
 *   "serie"  → las ventas puestas en el tiempo (paso 1)
 *   "barras" → la previsión: barras que crecen (paso 2)
 *   "cubo"   → la caja: el pedido (paso 3)
 * Ajustes propios sobre la escena base: formas nuevas (nube, serie, barras), la figura se queda a la derecha
 * en pantallas anchas y sube de abajo arriba en móvil, se balancea en vez de girar sin parar (para que el
 * gráfico se lea de frente) y cada forma se "sostiene" un tramo del scroll antes de transformarse. */

/* Escena "particulas" — nube de puntos que se transforma entre formas al hacer scroll.
 * Encaja con: tecnología, datos, IA, finanzas, consultoría. Muy personalizable.
 *
 * data-opciones (todas opcionales):
 *   formas:   lista ordenada de formas por las que pasa con el scroll.
 *             Disponibles: "esfera", "toro", "helice", "onda", "cubo", "anillos", "galaxia"
 *   cantidad: nº de puntos en calidad alta (se reduce solo en móviles)
 *   tamano:   tamaño del punto (por defecto 0.085)
 *   giro:     velocidad de giro (por defecto 0.08)
 *   inclinacion: inclinación hacia la cámara en radianes (por defecto 0.15; usa ~0.9 con "galaxia", "anillos" u "onda", que son planas)
 * Colores: variables CSS --l3d-1 (principal) y --l3d-2 (secundario) en el canvas o un ancestro.
 */
(function () {
  "use strict";
  if (!window.L3D) return;

  var FORMAS = {
    /* --- formas propias de Nodo Analytics --- */
    nube: function (i, n, v, azar) {
      var r = Math.pow(azar(i + 3), 0.55) * 2.7, a = azar(i + 13) * 6.2832, b = Math.acos(azar(i + 29) * 2 - 1);
      v.set(Math.sin(b) * Math.cos(a) * r * 1.15, Math.cos(b) * r * 0.85, Math.sin(b) * Math.sin(a) * r);
    },
    serie: function (i, n, v, azar) {
      var t = azar(i + 3), d = azar(i + 17) - 0.5;
      var y = -1.2 + t * 1.6 + Math.sin(t * Math.PI * 5) * 0.42 + Math.sin(t * Math.PI * 13) * 0.11;
      v.set((t - 0.5) * 4.8, y + d * d * d * 5.5, (azar(i + 41) - 0.5) * 0.45);
    },
    barras: function (i, n, v, azar) {
      var H = [0.8, 1.2, 1.0, 1.6, 1.4, 2.0, 2.5, 3.1], total = 13.6, u = azar(i + 3) * total, k = 0;
      while (k < 7 && u > H[k]) { u -= H[k]; k++; }
      var h = H[k], y = azar(i + 11) < 0.3 ? h : azar(i + 23) * h;      // la tapa de cada barra, más marcada
      v.set((k - 3.5) * 0.56 + (azar(i + 31) - 0.5) * 0.36, -1.55 + y, (azar(i + 47) - 0.5) * 0.36);
    },
    /* --- formas de la escena base --- */
    esfera: function (i, n, v) {
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.399963;
      v.set(Math.cos(a) * r * 2, y * 2, Math.sin(a) * r * 2);
    },
    toro: function (i, n, v) {
      var u = (i / n) * Math.PI * 2 * 34, w = (i / n) * Math.PI * 2;
      var R = 1.7, r = 0.65;
      v.set((R + r * Math.cos(u)) * Math.cos(w), r * Math.sin(u), (R + r * Math.cos(u)) * Math.sin(w));
    },
    helice: function (i, n, v) {
      var t = i / n, lado = i % 2 ? 1 : -1, a = t * Math.PI * 9 + (lado > 0 ? 0 : Math.PI);
      v.set(Math.cos(a) * 0.9, (t - 0.5) * 5.2, Math.sin(a) * 0.9);
    },
    onda: function (i, n, v) {
      var lado = Math.ceil(Math.sqrt(n)), x = (i % lado) / lado - 0.5, z = Math.floor(i / lado) / lado - 0.5;
      v.set(x * 7, Math.sin(x * 9) * 0.35 + Math.cos(z * 11) * 0.35, z * 7);
    },
    /* la caja del pedido: aristas muy marcadas, caras tenues y una cinta de embalaje por arriba */
    cubo: function (i, n, v, azar) {
      var s = 1.05, r = azar(i + 61), a = azar(i) * 2 - 1, b = azar(i + 7919) * 2 - 1;
      if (r < 0.55) {                                   // 12 aristas
        var eje = i % 3, combo = Math.floor(azar(i + 71) * 4), sa = (combo & 1) ? 1 : -1, sb = (combo & 2) ? 1 : -1;
        if (eje === 0) v.set(a * s, sa * s, sb * s); else if (eje === 1) v.set(sa * s, a * s, sb * s); else v.set(sa * s, sb * s, a * s);
      } else if (r < 0.67) {                            // cinta sobre la tapa y bajando por dos caras
        var c = (azar(i + 5) - 0.5) * 0.24;
        if (i % 3 === 0) v.set(c, s, b * s); else if (i % 3 === 1) v.set(c, a * s * 0.5 + s * 0.5, s); else v.set(c, a * s * 0.5 + s * 0.5, -s);
      } else {                                          // caras
        var cara = i % 6;
        if (cara === 0) v.set(s, a * s, b * s); else if (cara === 1) v.set(-s, a * s, b * s);
        else if (cara === 2) v.set(a * s, s, b * s); else if (cara === 3) v.set(a * s, -s, b * s);
        else if (cara === 4) v.set(a * s, b * s, s); else v.set(a * s, b * s, -s);
      }
    },
    anillos: function (i, n, v) {
      var anillo = i % 5, a = (i / n) * Math.PI * 2 * 5, r = 0.7 + anillo * 0.42;
      v.set(Math.cos(a) * r, Math.sin(a * 3 + anillo) * 0.06, Math.sin(a) * r);
    },
    galaxia: function (i, n, v, azar) {
      var t = i / n, brazo = i % 3, r = Math.pow(t, 0.6) * 3, a = r * 1.6 + brazo * 2.094;
      v.set(Math.cos(a) * r + (azar(i) - 0.5) * 0.35, (azar(i + 31) - 0.5) * 0.3 * (1 - t), Math.sin(a) * r + (azar(i + 97) - 0.5) * 0.35);
    }
  };

  L3D.registrar("particulas", function (ctx) {
    var THREE = ctx.THREE, op = ctx.opciones;
    var n = ctx.cantidad(op.cantidad || 9000, 5000, 2600);
    var nombres = (op.formas && op.formas.length ? op.formas : ["esfera", "toro", "helice"]).filter(function (f) { return FORMAS[f]; });
    if (!nombres.length) nombres = ["esfera"];

    function azar(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    var v = new THREE.Vector3();
    var objetivos = nombres.map(function (nombre) {
      var arr = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) { FORMAS[nombre](i, n, v, azar); arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; }
      return arr;
    });

    var posiciones = new Float32Array(objetivos[0]);
    var semillas = new Float32Array(n);
    for (var i = 0; i < n; i++) semillas[i] = azar(i + 5);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    geo.setAttribute("aSemilla", new THREE.BufferAttribute(semillas, 1));

    var material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTiempo: { value: 0 },
        uTamano: { value: (op.tamano || 0.085) * ctx.renderer.getPixelRatio() },
        uColor1: { value: ctx.color("--l3d-1", "#7dd3fc") },
        uColor2: { value: ctx.color("--l3d-2", "#a78bfa") },
        uOpacidad: { value: 1 }
      },
      vertexShader: [
        "attribute float aSemilla;",
        "uniform float uTiempo; uniform float uTamano;",
        "varying float vMezcla; varying float vBrillo;",
        "void main(){",
        "  vec3 p = position;",
        "  p += 0.045 * vec3(sin(uTiempo*0.9 + aSemilla*40.0), cos(uTiempo*0.7 + aSemilla*55.0), sin(uTiempo*0.8 + aSemilla*70.0));",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = uTamano * (0.6 + aSemilla) * (300.0 / -mv.z);",
        "  vMezcla = clamp(p.y * 0.25 + 0.5 + (aSemilla - 0.5) * 0.4, 0.0, 1.0);",
        "  vBrillo = 0.55 + 0.45 * sin(uTiempo * 1.3 + aSemilla * 90.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor1; uniform vec3 uColor2; uniform float uOpacidad;",
        "varying float vMezcla; varying float vBrillo;",
        "void main(){",
        "  float d = length(gl_PointCoord - 0.5);",
        "  float a = smoothstep(0.5, 0.05, d);",
        "  gl_FragColor = vec4(mix(uColor1, uColor2, vMezcla), a * vBrillo * uOpacidad);",
        "}"
      ].join("\n")
    });

    var puntos = new THREE.Points(geo, material);
    var grupo = new THREE.Group();
    grupo.add(puntos);
    ctx.escena.add(grupo);
    ctx.camara.position.set(0, 0, 7.5);

    var giro = op.giro === undefined ? 0.08 : op.giro;
    var inclinacion = op.inclinacion === undefined ? 0.15 : op.inclinacion;
    grupo.rotation.x = inclinacion;

    return {
      actualizar: function (t, dt) {
        material.uniforms.uTiempo.value = t;
        // mezcla entre formas según el scroll; cada forma se sostiene un tramo antes de transformarse
        var tramo = ctx.scroll * (objetivos.length - 1);
        var a = Math.min(Math.floor(tramo), objetivos.length - 1), b = Math.min(a + 1, objetivos.length - 1);
        var k = ctx.suavizar(ctx.limitar((tramo - a - 0.36) / 0.5, 0, 1));
        var A = objetivos[a], B = objetivos[b];
        for (var i = 0, total = n * 3; i < total; i++) posiciones[i] = A[i] + (B[i] - A[i]) * k;
        geo.attributes.position.needsUpdate = true;

        // balanceo (no giro continuo): el gráfico siempre se lee de frente
        grupo.rotation.y = Math.sin(t * giro * 3) * 0.42 + 0.3 + ctx.puntero.x * 0.18;
        grupo.rotation.x = ctx.mezclar(grupo.rotation.x, ctx.puntero.y * -0.2 + inclinacion, 0.06);

        // encaje con el texto: a la derecha en pantallas anchas; en vertical sube de abajo (portada) a arriba (pasos)
        var vertical = ctx.aspecto < 1;
        var entrada = ctx.suavizar(ctx.limitar(tramo, 0, 1));
        if (vertical) {
          ctx.camara.position.z = 7.5 / Math.max(ctx.aspecto, 0.55) * 0.85;
          grupo.position.set(0, ctx.mezclar(-3.0, 1.9, entrada), 0);
          grupo.scale.setScalar(ctx.mezclar(0.7, 0.84, entrada));
          material.uniforms.uOpacidad.value = ctx.mezclar(0.6, 0.9, entrada);
        } else {
          ctx.camara.position.z = 7.5;
          grupo.position.set(ctx.aspecto > 1.3 ? 2.3 : 1.7, 0, 0);
          grupo.scale.setScalar(ctx.aspecto > 1.3 ? 1 : 0.8);
          material.uniforms.uOpacidad.value = 1;
        }
      },
      destruir: function () { geo.dispose(); material.dispose(); }
    };
  });
})();
