/* escena.js — Kelvara · escena "kelvin" (nueva, sobre el motor de la skill).
 *
 * Idea: la caja negra del Black Friday. Miles de puntos forman un cubo y, mientras pasan los textos del relato,
 * se despiezan en las siluetas 3D de las categorías del año (plegable, auriculares, reloj, consola, gafas).
 * En el cierre de Navidad los mismos puntos caen como nieve y se cierran en una caja de regalo.
 *
 * Diferencias con la escena "siluetas" de la skill (problema conocido 4):
 *   - La forma la decide QUÉ PASO DE TEXTO está en el centro de la pantalla (opción "pasos"), no el scroll de toda
 *     la página: cada lienzo cuenta su propia historia aunque la página sea larga.
 *   - La entrada en remolino espera a que se abra la cortina (html.cine-entrando) y a que el lienzo se vea.
 *   - Las formas son volúmenes 3D (aristas + caras), no figuras planas: al girar se lee el objeto.
 *
 * data-opciones:
 *   formas:   lista en orden: "caja" | "plegable" | "auriculares" | "reloj" | "consola" | "gafas" | "regalo" | "nieve"
 *   pasos:    selector de los bloques de texto (dentro de la zona) que marcan cada forma, en el mismo orden
 *   x, y:     desplazamiento de la figura en pantallas anchas (en vertical se coloca arriba sola)
 *   escala:   tamaño (1)
 *   cantidad: puntos en calidad alta (9000)
 *   fondo:    "claro" → puntos opacos (mezcla normal); por defecto suman luz sobre fondo oscuro
 * Colores: --l3d-1 → --l3d-2 (degradado), --l3d-3 (destellos).
 */
(function () {
  "use strict";
  if (!window.L3D) return;

  var PI = Math.PI;
  function azar(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ---------------------------------------------------------------- geometría auxiliar
  /** Punto del contorno de un rectángulo redondeado (centrado), t en [0,1). */
  function perimetro(w, h, r, t) {
    r = Math.min(r, w / 2, h / 2);
    var lw = w - 2 * r, lh = h - 2 * r, la = PI * r / 2, hx = w / 2, hy = h / 2;
    var d = t * (2 * lw + 2 * lh + 4 * la), a;
    if (d < lw) return [-hx + r + d, hy]; d -= lw;
    if (d < la) { a = PI / 2 - d / r; return [hx - r + Math.cos(a) * r, hy - r + Math.sin(a) * r]; } d -= la;
    if (d < lh) return [hx, hy - r - d]; d -= lh;
    if (d < la) { a = -d / r; return [hx - r + Math.cos(a) * r, -hy + r + Math.sin(a) * r]; } d -= la;
    if (d < lw) return [hx - r - d, -hy]; d -= lw;
    if (d < la) { a = -PI / 2 - d / r; return [-hx + r + Math.cos(a) * r, -hy + r + Math.sin(a) * r]; } d -= la;
    if (d < lh) return [-hx, -hy + r + d]; d -= lh;
    a = PI - d / r; return [-hx + r + Math.cos(a) * r, hy - r + Math.sin(a) * r];
  }
  /** Punto del interior de un rectángulo redondeado (las esquinas se pliegan al radio). */
  function interior(w, h, r, u, v) {
    var x = (u - 0.5) * w, y = (v - 0.5) * h, ex = w / 2 - r, ey = h / 2 - r;
    var cx = Math.max(Math.abs(x) - ex, 0), cy = Math.max(Math.abs(y) - ey, 0), d = Math.sqrt(cx * cx + cy * cy);
    if (d > r) { var k = r / d; x = Math.sign(x) * (ex + cx * k); y = Math.sign(y) * (ey + cy * k); }
    return [x, y];
  }
  function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
  function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
  function mover(p, x, y, z) { return [p[0] + x, p[1] + y, p[2] + z]; }
  function segmento(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function anillo(cx, cy, z, r, t) { return [cx + Math.cos(t * 2 * PI) * r, cy + Math.sin(t * 2 * PI) * r, z]; }

  /** Losa redondeada (teléfono, caja de reloj, mando): contornos delante y detrás, canto y algo de cara. */
  function losa(w, h, d, r, R, cara) {
    var a = R(1), t = R(2);
    var p;
    if (a < 0.34) { p = perimetro(w, h, r, t); return [p[0], p[1], d / 2]; }
    if (a < 0.56) { p = perimetro(w, h, r, t); return [p[0], p[1], -d / 2]; }
    if (a < 0.72) { p = perimetro(w, h, r, t); return [p[0], p[1], (R(3) - 0.5) * d]; }
    p = interior(w, h, r, R(4), R(5));
    return [p[0], p[1], (cara === "atras" ? -1 : 1) * d / 2];
  }
  /** Elige una pieza según pesos: piezas = [[peso, fn], …] */
  function elegir(piezas, R) {
    var total = 0, i;
    for (i = 0; i < piezas.length; i++) total += piezas[i][0];
    var x = R(0) * total;
    for (i = 0; i < piezas.length; i++) { x -= piezas[i][0]; if (x <= 0) return piezas[i][1](R); }
    return piezas[piezas.length - 1][1](R);
  }

  // ---------------------------------------------------------------- formas (unidades de escena; ~4 de alto)
  var FORMAS = {
    caja: function (R) {
      var S = 2.5, p = elegir([
        [0.6, function (R) {                      // aristas: el cubo se lee nítido
          var e = Math.floor(R(1) * 12), eje = e % 3, q = Math.floor(e / 3);
          var s1 = q & 1 ? 1 : -1, s2 = q & 2 ? 1 : -1, t = (R(2) - 0.5) * S, j = (R(3) - 0.5) * 0.03;
          var o = [0, 0, 0]; o[eje] = t; o[(eje + 1) % 3] = s1 * S / 2 + j; o[(eje + 2) % 3] = s2 * S / 2 - j; return o;
        }],
        [0.4, function (R) {                      // caras, más tenues
          var f = Math.floor(R(1) * 6), eje = f % 3, signo = f < 3 ? 1 : -1;
          var o = [0, 0, 0]; o[eje] = signo * S / 2; o[(eje + 1) % 3] = (R(2) - 0.5) * S; o[(eje + 2) % 3] = (R(3) - 0.5) * S; return o;
        }]
      ], R);
      return rotX(rotY(p, 0.62), 0.42);
    },

    plegable: function (R) {
      var w = 1.42, h = 2.9, d = 0.06, ang = -0.52, izq = R(9) < 0.5;
      var p = elegir([
        [0.62, function (R) { var q = losa(w, h, d, 0.16, R, "delante"); return [q[0] + w / 2 + 0.03, q[1], q[2]]; }],
        [0.2, function (R) { var q = perimetro(w - 0.18, h - 0.2, 0.08, R(1)); return [q[0] + w / 2 + 0.03, q[1], d / 2 + 0.01]; }],
        [0.08, function (R) { return [0, (R(1) - 0.5) * (h - 0.1), (R(2) - 0.5) * 0.08]; }],     // bisagra
        [0.1, function (R) {                       // cámaras en la cara trasera
          var k = Math.floor(R(1) * 3), cy = h / 2 - 0.36 - k * 0.36;
          var q = anillo(w - 0.32, cy, -d / 2 - 0.02, 0.13, R(2)); return [q[0] + 0.03, q[1], q[2]];
        }]
      ], R);
      if (izq && R(10) < 0.92) p = [-p[0], p[1], p[2]];                       // la otra mitad, en espejo
      p = p[0] >= 0 ? rotY(p, ang) : rotY(p, -ang);
      return rotX(rotY(p, 0.18), -0.08);
    },

    auriculares: function (R) {
      var cy = 0.15, Rb = 1.45;
      var p = elegir([
        [0.32, function (R) {                      // diadema exterior (arco de tubo)
          var f = lerp(0.1 * PI, 0.9 * PI, R(1)), g = R(2) * 2 * PI, r = 0.085;
          var n = [Math.cos(f), Math.sin(f)];
          return [n[0] * (Rb + Math.cos(g) * r), cy + n[1] * (Rb + Math.cos(g) * r), Math.sin(g) * r * 1.6];
        }],
        [0.1, function (R) {                       // almohadilla interior de la diadema
          var f = lerp(0.2 * PI, 0.8 * PI, R(1));
          return [Math.cos(f) * (Rb - 0.16), cy + Math.sin(f) * (Rb - 0.16), (R(2) - 0.5) * 0.18];
        }],
        [0.5, function (R) {                       // copas: losas redondeadas mirando a la oreja
          var lado = R(8) < 0.5 ? -1 : 1, q = losa(0.95, 1.55, 0.44, 0.44, R, "delante");
          return [lado * (1.5 + q[2]), q[1] - 0.55, q[0]];
        }],
        [0.08, function (R) {                      // horquillas
          var lado = R(8) < 0.5 ? -1 : 1, t = R(1);
          var a = [lado * Rb * Math.cos(0.1 * PI), cy + Rb * Math.sin(0.1 * PI), 0], b = [lado * 1.5, 0.25, 0];
          return segmento(a, b, t);
        }]
      ], R);
      return rotX(rotY(p, 0.62), 0.12);
    },

    reloj: function (R) {
      var p = elegir([
        [0.42, function (R) { return losa(1.5, 1.8, 0.42, 0.42, R, "delante"); }],
        [0.14, function (R) { var q = perimetro(1.26, 1.56, 0.32, R(1)); return [q[0], q[1], 0.22]; }],
        [0.12, function (R) {                       // pulso en la pantalla: el dato del Series 12
          var pts = [[-0.5, -0.05], [-0.2, -0.05], [-0.09, 0.32], [0.04, -0.42], [0.16, 0.14], [0.25, -0.05], [0.5, -0.05]];
          var k = Math.floor(R(1) * (pts.length - 1)), a = pts[k], b = pts[k + 1], t = R(2);
          return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), 0.23];
        }],
        [0.04, function (R) { var g = R(1) * 2 * PI; return [0.78 + R(2) * 0.14, 0.32 + Math.cos(g) * 0.1, Math.sin(g) * 0.1]; }],
        [0.28, function (R) {                       // correas que se curvan hacia atrás
          var arriba = R(8) < 0.5 ? 1 : -1, v = R(1), borde = R(2) < 0.45;
          var x = borde ? (R(3) < 0.5 ? -0.62 : 0.62) : (R(3) - 0.5) * 1.24;
          return [x, arriba * (0.86 + v * 1.25), -0.08 - 0.75 * v * v];
        }]
      ], R);
      return rotX(rotY(p, -0.3), 0.1);
    },

    consola: function (R) {
      var p = elegir([
        [0.36, function (R) { return losa(2.6, 1.5, 0.16, 0.08, R, "delante"); }],
        [0.14, function (R) { var q = perimetro(2.28, 1.24, 0.04, R(1)); return [q[0], q[1], 0.09]; }],
        [0.34, function (R) {                       // mandos laterales
          var lado = R(8) < 0.5 ? -1 : 1, q = losa(0.62, 1.5, 0.24, 0.28, R, "delante");
          return [lado * (1.3 + 0.32) + q[0], q[1], q[2]];
        }],
        [0.16, function (R) {                       // palancas, botones y cruceta
          var k = R(1);
          if (k < 0.3) return anillo(-1.62, 0.36, 0.15, 0.17, R(2));
          if (k < 0.6) return anillo(1.62, -0.32, 0.15, 0.17, R(2));
          if (k < 0.82) { var b = Math.floor(R(2) * 4), ang = b * PI / 2; return anillo(1.62 + Math.cos(ang) * 0.17, 0.36 + Math.sin(ang) * 0.17, 0.15, 0.045, R(3)); }
          var h = R(2) < 0.5, t = (R(3) - 0.5) * 0.34; return [-1.62 + (h ? t : 0), -0.32 + (h ? 0 : t), 0.15];
        }]
      ], R);
      return rotX(rotY(p, 0.36), -0.32);
    },

    gafas: function (R) {
      var p = elegir([
        [0.5, function (R) {                        // monturas (tubo alrededor del contorno)
          var lado = R(8) < 0.5 ? -1 : 1, q = perimetro(1.36, 1.02, 0.34, R(1)), g = R(2) * 2 * PI;
          var k = 1 + Math.cos(g) * 0.05;
          return [lado * 0.86 + q[0] * k, q[1] * k + 0.05, Math.sin(g) * 0.06];
        }],
        [0.14, function (R) { var lado = R(8) < 0.5 ? -1 : 1, q = interior(1.2, 0.86, 0.28, R(1), R(2)); return [lado * 0.86 + q[0], q[1] + 0.05, 0]; }],
        [0.08, function (R) { var t = R(1); return [lerp(-0.18, 0.18, t), 0.3 + Math.sin(t * PI) * 0.12, 0]; }],
        [0.24, function (R) {                        // patillas hacia atrás
          var lado = R(8) < 0.5 ? -1 : 1, t = R(1);
          return [lado * (1.54 + t * 0.12), 0.38 - t * 0.12 - (t > 0.85 ? (t - 0.85) * 1.6 : 0), -t * 2.5];
        }],
        [0.04, function (R) { return anillo(-1.38, 0.42, 0.07, 0.07, R(1)); }]   // cámara
      ], R);
      return rotX(rotY(p, 0.62), 0.16);
    },

    regalo: function (R) {
      var S = 2.2, h = S / 2;
      var p = elegir([
        [0.42, function (R) {
          var e = Math.floor(R(1) * 12), eje = e % 3, q = Math.floor(e / 3);
          var o = [0, 0, 0]; o[eje] = (R(2) - 0.5) * S; o[(eje + 1) % 3] = (q & 1 ? 1 : -1) * h; o[(eje + 2) % 3] = (q & 2 ? 1 : -1) * h; return o;
        }],
        [0.2, function (R) {
          var f = Math.floor(R(1) * 6), eje = f % 3, signo = f < 3 ? 1 : -1;
          var o = [0, 0, 0]; o[eje] = signo * h; o[(eje + 1) % 3] = (R(2) - 0.5) * S; o[(eje + 2) % 3] = (R(3) - 0.5) * S; return o;
        }],
        [0.22, function (R) {                        // cinta: dos bandas que abrazan la caja
          var banda = R(1) < 0.5, t = (R(2) - 0.5) * 0.3, s = R(3) * 4, o;
          var lado = Math.floor(s), u = (s - lado) * S - h;
          if (lado === 0) o = [u, h, t]; else if (lado === 1) o = [h, -u, t]; else if (lado === 2) o = [-u, -h, t]; else o = [-h, u, t];
          if (banda) o = [o[2], o[1], o[0]];
          return [o[0] * 1.01, o[1] * 1.01, o[2] * 1.01];
        }],
        [0.16, function (R) {                        // lazo: dos lazadas y el nudo
          var k = R(1);
          if (k < 0.12) { var g = R(2) * 2 * PI, b = Math.acos(2 * R(3) - 1); return [Math.sin(b) * Math.cos(g) * 0.14, h + 0.12 + Math.cos(b) * 0.12, Math.sin(b) * Math.sin(g) * 0.14]; }
          var lado = R(4) < 0.5 ? -1 : 1, a = R(2) * 2 * PI;
          var x = 0.42 + Math.cos(a) * 0.4, y = Math.sin(a) * 0.26;
          var q = [lado * x * Math.cos(0.5), h + 0.24 + y + x * 0.35, lado * x * Math.sin(0.5) * 0.4];
          return q;
        }]
      ], R);
      return rotX(rotY(p, 0.68), 0.32);
    },

    nieve: function (R) { return [(R(1) - 0.5) * 10, (R(2) - 0.5) * 7, (R(3) - 0.5) * 4.5 - 0.8]; }
  };

  function construir(nombre, n, f) {
    var fn = FORMAS[nombre] || FORMAS.caja, arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var base = i * 13 + f * 7919;
      var p = fn(function (k) { return azar(base + k * 101.3); });
      arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2];
    }
    return arr;
  }

  L3D.registrar("kelvin", function (ctx) {
    var THREE = ctx.THREE, op = ctx.opciones;
    var n = ctx.cantidad(op.cantidad || 9000, 6000, 3500);
    var nombres = op.formas && op.formas.length ? op.formas : ["caja"];
    var claro = op.fondo === "claro";
    var raiz = document.documentElement;
    var QA = raiz.classList.contains("l3d-qa") || /[?&]qa=/.test(location.search);

    var formas = nombres.map(function (nombre, f) { return construir(nombre, n, f); });
    var esNieve = nombres.map(function (nombre) { return nombre === "nieve"; });

    var desde = new Float32Array(formas[0]), hasta = new Float32Array(formas[Math.min(1, formas.length - 1)]);
    var semilla = new Float32Array(n), origen = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      semilla[i] = azar(i + 5);
      var a = azar(i + 41) * 6.2832, b = Math.acos(2 * azar(i + 53) - 1), r = 5 + azar(i + 67) * 4;
      origen[i * 3] = Math.sin(b) * Math.cos(a) * r; origen[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r; origen[i * 3 + 2] = Math.cos(b) * r - 2;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(desde, 3));
    geo.setAttribute("aHasta", new THREE.BufferAttribute(hasta, 3));
    geo.setAttribute("aOrigen", new THREE.BufferAttribute(origen, 3));
    geo.setAttribute("aSemilla", new THREE.BufferAttribute(semilla, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 14);

    var material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      blending: claro ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: {
        uTiempo: { value: 0 }, uMezcla: { value: 0 }, uEntrada: { value: 0 },
        uNieveA: { value: esNieve[0] ? 1 : 0 }, uNieveB: { value: esNieve[1] ? 1 : 0 },
        uPuntero: { value: new THREE.Vector3(99, 99, 0) },
        uTamano: { value: (op.tamano || 1) * ctx.renderer.getPixelRatio() * (claro ? 3.1 : 2.9) },
        uClaro: { value: claro ? 1 : 0 },
        uColor1: { value: ctx.color("--l3d-1", claro ? "#D9361E" : "#D2FF3C") },
        uColor2: { value: ctx.color("--l3d-2", claro ? "#E8A23A" : "#6FE3FF") },
        uColor3: { value: ctx.color("--l3d-3", claro ? "#7A1E10" : "#FFFFFF") }
      },
      vertexShader: [
        "attribute vec3 aHasta; attribute vec3 aOrigen; attribute float aSemilla;",
        "uniform float uTiempo, uMezcla, uEntrada, uTamano, uNieveA, uNieveB; uniform vec3 uPuntero;",
        "varying float vTono; varying float vDestello; varying float vAlfa;",
        "vec3 nevar(vec3 p, float t){",
        "  p.y = mod(p.y - t * (0.22 + 0.32 * aSemilla) + 3.5, 7.0) - 3.5;",
        "  p.x += sin(t * 0.5 + aSemilla * 20.0) * 0.16;",
        "  return p; }",
        "void main(){",
        "  float t = uTiempo;",
        "  vec3 a = position; if (uNieveA > 0.5) a = nevar(a, t);",
        "  vec3 b = aHasta;   if (uNieveB > 0.5) b = nevar(b, t);",
        "  float k = clamp(uMezcla * 1.5 - aSemilla * 0.5, 0.0, 1.0);",
        "  k = k * k * (3.0 - 2.0 * k);",
        "  vec3 p = mix(a, b, k);",
        "  float vuelo = sin(k * 3.14159);",                                  // a medio camino: despiece en espiral
        "  float ang = vuelo * (1.2 + aSemilla * 2.0);",
        "  p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz * (1.0 + vuelo * 0.45);",
        "  p.y += vuelo * (aSemilla - 0.5) * 1.6;",
        "  p += 0.035 * vec3(sin(t * 0.9 + aSemilla * 43.0), cos(t * 0.7 + aSemilla * 57.0), sin(t * 0.8 + aSemilla * 71.0));",
        "  vec2 lejos = p.xy - uPuntero.xy; float dist = length(lejos);",
        "  float empuje = smoothstep(1.1, 0.0, dist);",
        "  p.xy += normalize(lejos + 0.0001) * empuje * 0.5; p.z += empuje * 0.45;",
        "  float e = clamp(uEntrada * 1.7 - aSemilla * 0.7, 0.0, 1.0);",
        "  e = 1.0 - pow(1.0 - e, 3.0);",
        "  float giro = (1.0 - e) * 2.6;",
        "  vec3 o = aOrigen; o.xz = mat2(cos(giro), -sin(giro), sin(giro), cos(giro)) * o.xz;",
        "  p = mix(o, p, e);",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  vDestello = step(0.94, aSemilla);",
        "  float pulso = 0.6 + 0.4 * sin(t * (1.3 + aSemilla * 2.0) + aSemilla * 90.0);",
        "  gl_PointSize = uTamano * (0.5 + aSemilla * 0.7 + vDestello * 1.4 * pulso) * (7.0 / -mv.z) * (0.6 + 0.4 * e);",
        "  vTono = clamp((p.y + 2.0) / 4.0 + (aSemilla - 0.5) * 0.3, 0.0, 1.0);",
        "  vAlfa = (0.3 + 0.7 * e) * (0.7 + 0.3 * pulso) * (1.0 - vuelo * 0.2);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor1, uColor2, uColor3; uniform float uClaro;",
        "varying float vTono; varying float vDestello; varying float vAlfa;",
        "void main(){",
        "  float d = length(gl_PointCoord - 0.5);",
        "  float forma = mix(smoothstep(0.5, 0.0, d), smoothstep(0.5, 0.3, d), uClaro);",
        "  if (forma < 0.01) discard;",
        "  vec3 col = mix(mix(uColor1, uColor2, vTono), uColor3, vDestello);",
        "  gl_FragColor = vec4(col, forma * vAlfa * mix(0.62, 0.9, uClaro));",
        "}"
      ].join("\n")
    });

    var puntos = new THREE.Points(geo, material);
    var grupo = new THREE.Group(); grupo.add(puntos); ctx.escena.add(grupo);
    ctx.camara.position.set(0, 0, 7);

    // ---- qué forma toca: posición de la línea central de la pantalla entre los pasos de texto
    var zona = ctx.canvas.closest("[data-escena-zona]") || document.body;
    var pasos = op.pasos ? Array.prototype.slice.call(zona.querySelectorAll(op.pasos)) : [];
    function objetivoPorPasos() {
      if (pasos.length < 2) return ctx.scroll * (formas.length - 1);
      var vc = window.innerHeight * 0.5, prev = null;
      for (var k = 0; k < pasos.length; k++) {
        var rc = pasos[k].getBoundingClientRect(), c = rc.top + rc.height * 0.5;
        if (prev !== null && vc <= c) return Math.min(formas.length - 1, k - 1 + (vc - prev) / Math.max(1, c - prev));
        if (prev === null && vc <= c) return 0;
        prev = c;
      }
      return Math.min(formas.length - 1, pasos.length - 1);
    }

    var f = objetivoPorPasos(), tramo = -1;
    function ponerTramo(s) {
      if (s === tramo) return;
      tramo = s;
      var siguiente = Math.min(s + 1, formas.length - 1);
      desde.set(formas[s]); hasta.set(formas[siguiente]);
      geo.attributes.position.needsUpdate = true; geo.attributes.aHasta.needsUpdate = true;
      material.uniforms.uNieveA.value = esNieve[s] ? 1 : 0;
      material.uniforms.uNieveB.value = esNieve[siguiente] ? 1 : 0;
    }

    var sinEntrada = ctx.reducido || QA, nacio = 0;
    var escala = op.escala || 1, dx = op.x || 0, dy = op.y || 0;
    var plano = new THREE.Vector3();

    return {
      actualizar: function (t, dt) {
        material.uniforms.uTiempo.value = t;
        // entrada: espera a que se abra la cortina y a que el lienzo esté a la vista (actualizar solo corre entonces)
        if (sinEntrada) material.uniforms.uEntrada.value = 1;
        else if (!raiz.classList.contains("cine-entrando")) {
          if (!nacio) nacio = performance.now();
          material.uniforms.uEntrada.value = Math.min(1, (performance.now() - nacio) / 2600);
        }

        var meta = objetivoPorPasos();
        f = QA ? meta : ctx.mezclar(f, meta, 1 - Math.pow(0.006, dt));
        var s = Math.min(Math.floor(f), formas.length - 2 < 0 ? 0 : formas.length - 2);
        ponerTramo(Math.max(0, s));
        var frac = Math.max(0, Math.min(1, f - tramo));
        var m = Math.max(0, Math.min(1, (frac - 0.22) / 0.56));               // la forma se sostiene mientras se lee
        material.uniforms.uMezcla.value = m * m * (3 - 2 * m);

        var vertical = ctx.aspecto < 1;
        var esc = escala * (vertical ? Math.max(0.5, ctx.aspecto * 1.12) : Math.min(1, 0.55 + ctx.aspecto * 0.28));
        grupo.scale.setScalar(esc);
        grupo.position.set(vertical ? 0 : dx * Math.min(1, ctx.aspecto / 1.6), vertical ? 1.15 : dy, 0);
        // giro de "despiece": media vuelta mientras cambia de forma; de frente cuando se sostiene
        grupo.rotation.y = Math.sin(t * 0.3) * 0.26 + ctx.puntero.x * 0.4 + Math.sin(frac * PI) * 0.9;
        grupo.rotation.x = Math.sin(t * 0.23) * 0.08 - ctx.puntero.y * 0.22;

        var pl = ctx.punteroLocal;
        if (pl && pl.dentro) {
          var alto = 2 * Math.tan((ctx.camara.fov * PI / 180) / 2) * ctx.camara.position.z;
          plano.set(pl.x * alto * ctx.aspecto * 0.5, pl.y * alto * 0.5, 0);
          grupo.updateMatrixWorld(); grupo.worldToLocal(plano);
          material.uniforms.uPuntero.value.copy(plano);
        } else material.uniforms.uPuntero.value.set(99, 99, 0);
      },
      // el motor fija la densidad de píxeles después de crear la escena: el tamaño del punto se ajusta aquí
      alRedimensionar: function () {
        material.uniforms.uTamano.value = (op.tamano || 1) * ctx.renderer.getPixelRatio() * (claro ? 3.1 : 2.9);
      },
      destruir: function () { geo.dispose(); material.dispose(); }
    };
  });
})();
