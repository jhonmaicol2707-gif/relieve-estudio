/* escena.js — Huellas Felices: partículas que dibujan una huella y se transforman en corazón y en cruz
 * (huellas, cariño, salud). Colores desde --l3d-1…3 en css/sitio.css. */
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
 *   ciclo:    segundos que dura cada figura antes de transformarse sola (por defecto 6; 0 = solo con el scroll)
 *   cantidad: nº de partículas en calidad alta (por defecto 9000)
 *   tamano:   tamaño de la partícula (por defecto 1)
 *   escala:   tamaño de la figura (por defecto 1)
 *   x, y:     desplazamiento de la figura en pantallas anchas (por defecto 0)
 *   fondo:    "claro" | "oscuro" — se detecta solo a partir del color de fondo de la página
 * Colores: --l3d-1 → --l3d-2 (degradado de la figura), --l3d-3 (destellos).
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
    var claro = op.fondo ? op.fondo === "claro" : (function () {
      var m = (getComputedStyle(document.body).backgroundColor || "").match(/[\d.]+/g);
      if (!m || (m.length > 3 && parseFloat(m[3]) === 0)) return false;
      return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.55;
    })();

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
    var nacio = performance.now();
    var sinEntrada = ctx.reducido || document.documentElement.classList.contains("l3d-qa");

    function irA(indice) {
      if (enTransito || indice === actual || formas.length < 2) return;
      siguiente = indice; hasta.set(objetivos[siguiente]); geo.attributes.aHasta.needsUpdate = true;
      mezcla = 0; enTransito = true; salio = performance.now();
    }
    var salio = 0;

    var plano = new THREE.Vector3();
    return {
      actualizar: function (t, dt) {
        material.uniforms.uTiempo.value = t;
        // la entrada usa el reloj real (no los fotogramas) y se omite en revisión (?qa) y con movimiento reducido
        material.uniforms.uEntrada.value = sinEntrada ? 1 : Math.min(1, (performance.now() - nacio) / 2800);

        // qué figura toca: el scroll manda si se ha movido; si no, rota sola cada `ciclo` segundos
        if (!enTransito && formas.length > 1) {
          var porScroll = Math.min(formas.length - 1, Math.floor(ctx.scroll * formas.length));
          if (ctx.scroll > 0.02 && porScroll !== actual) irA(porScroll);
          else if (ciclo > 0 && ctx.scroll <= 0.02 && t > 3.2) {
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
        grupo.scale.setScalar(s);
        grupo.position.set(vertical ? 0 : dx, vertical ? 0 : dy, 0);
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
