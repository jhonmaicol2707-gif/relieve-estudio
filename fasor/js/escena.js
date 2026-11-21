/* escena.js — escena(s) 3D de este sitio. Punto de partida: ajusta formas, cantidades y movimiento
 * para que la escena cuente algo de ESTE negocio. Los colores llegan de --l3d-1…4 (css/sitio.css). */

/* Escena "circuito" — un tablero en perspectiva con pistas ortogonales hechas de puntos (como cableado o una
 * placa) que corren desde los bordes hasta una carga central. Con el scroll de su zona la corriente avanza: las
 * pistas se encienden de fuera hacia dentro, viajan pulsos de luz y, al final, la carga se ilumina.
 * Con poca carga las pistas encendidas parpadean (la falla); con carga completa quedan firmes.
 * Encaja con: electricistas, energía solar, ingenierías, redes y cableado, domótica, tecnología industrial.
 *
 * data-opciones (todas opcionales):
 *   pistas:   nº de pistas (por defecto 22)
 *   cantidad: nº máximo de puntos en calidad alta (por defecto 9000)
 *   tamano:   tamaño del punto (por defecto 1)
 *   escala:   tamaño del tablero (por defecto 1)
 *   x, y:     desplazamiento en pantallas anchas (por defecto 0)
 *   movil:    {x, y, s} posición y escala en pantallas verticales, o una lista [{x,y,s}, …] con una posición por
 *             tramo del scroll (la 1.ª al empezar la zona, la última al acabar; se interpola entre ellas) para
 *             dejar la placa donde no la tapen el texto ni las tarjetas de cada paso
 *   inclinacion: grados que se tumba el tablero hacia atrás (por defecto 52)
 *   carga:    [inicio, fin] carga al principio y al final de la zona, de 0 a 1 (por defecto [0.12, 1])
 *   modo:     "scroll" (la zona manda; por defecto si hay [data-escena-zona] o data-escena-scroll) |
 *             "ciclo" (se carga y descarga sola cada `ciclo` segundos, por defecto 9)
 *   fondo:    "claro" | "oscuro" — si no, se detecta del color de fondo de la página
 * Colores: --l3d-1 (pista encendida) → --l3d-2 (cerca de la carga), --l3d-3 (pulsos y carga), --l3d-4 (pista apagada).
 * Evento: el lienzo emite "l3d-carga" (detail.valor, de 0 a 1) cuando cambia la carga, para un medidor en el HTML.
 */
(function () {
  "use strict";
  if (!window.L3D) return;

  L3D.registrar("circuito", function (ctx) {
    var THREE = ctx.THREE, op = ctx.opciones;
    var maxPuntos = ctx.cantidad(op.cantidad || 9000, 6000, 3500);
    var nPistas = Math.max(6, Math.min(40, op.pistas || 22));
    var ANCHO = 6.4, ALTO = 4.4, PASO = 0.2, R_CARGA = 0.5;
    function azar(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    function detectarClaro() {
      if (op.fondo) return op.fondo === "claro";
      var m = (getComputedStyle(document.body).backgroundColor || "").match(/[\d.]+/g);
      if (!m || (m.length > 3 && parseFloat(m[3]) === 0)) return false;
      return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.55;
    }
    var claro = detectarClaro();

    // ---- pistas: del borde a la carga central, en tramos rectos con chaflanes de 45° (como una placa)
    function pista(k) {
      var lado = k % 4, f = azar(k * 9.1 + 1) * 2 - 1, pts = [];
      var x, y;
      if (lado === 0) { x = -ANCHO / 2; y = f * ALTO / 2; }
      else if (lado === 1) { x = ANCHO / 2; y = f * ALTO / 2; }
      else if (lado === 2) { x = f * ANCHO / 2; y = ALTO / 2; }
      else { x = f * ANCHO / 2; y = -ALTO / 2; }
      x = Math.round(x / PASO) * PASO; y = Math.round(y / PASO) * PASO;
      pts.push([x, y]);
      // punto de llegada en el anillo de la carga, en la dirección de la que viene
      var ang = Math.atan2(y, x) + (azar(k * 3.3) - 0.5) * 0.5;
      var fx = Math.cos(ang) * R_CARGA, fy = Math.sin(ang) * R_CARGA;
      var guarda = 0, horizontal = lado < 2;
      while ((Math.abs(x - fx) > 0.05 || Math.abs(y - fy) > 0.05) && guarda++ < 40) {
        var dx = fx - x, dy = fy - y;
        // tramo recto por el eje que toca, con largo al azar; después un chaflán de 45°
        if (horizontal && Math.abs(dx) > 0.05) {
          var largoX = Math.abs(dx) * (0.35 + azar(k * 5 + guarda) * 0.5);
          if (Math.abs(dx) < 0.6) largoX = Math.abs(dx);
          x += Math.sign(dx) * largoX; pts.push([x, y]);
          var cy = Math.min(Math.abs(dy), 0.3 + azar(k + guarda * 7) * 0.3);
          if (cy > 0.05) { x += Math.sign(dx) * cy * (Math.abs(fx - x) > cy ? 1 : 0); y += Math.sign(dy) * cy; pts.push([x, y]); }
        } else if (Math.abs(dy) > 0.05) {
          var largoY = Math.abs(dy) * (0.35 + azar(k * 6 + guarda) * 0.5);
          if (Math.abs(dy) < 0.6) largoY = Math.abs(dy);
          y += Math.sign(dy) * largoY; pts.push([x, y]);
          var cx = Math.min(Math.abs(dx), 0.3 + azar(k + guarda * 11) * 0.3);
          if (cx > 0.05) { y += Math.sign(dy) * cx * (Math.abs(fy - y) > cx ? 1 : 0); x += Math.sign(dx) * cx; pts.push([x, y]); }
        } else {
          x = fx; pts.push([x, y]);
        }
        horizontal = !horizontal;
      }
      pts.push([fx, fy]);
      return pts;
    }

    var pistas = [], total = 0;
    for (var k = 0; k < nPistas; k++) {
      var p = pista(k), largo = 0;
      for (var j = 1; j < p.length; j++) largo += Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]);
      pistas.push({ p: p, largo: largo }); total += largo;
    }
    // densidad de puntos para no pasar de maxPuntos (dejando sitio a los nodos y a la carga)
    var anilloN = 140, reserva = anilloN + nPistas * 2 + 220;
    var paso = Math.max(0.018, total / Math.max(1000, maxPuntos - reserva));

    var pos = [], aS = [], aPista = [], aTipo = [];
    pistas.forEach(function (t, i) {
      var recorrido = 0;
      for (var j = 1; j < t.p.length; j++) {
        var a = t.p[j - 1], b = t.p[j], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
        var n = Math.max(1, Math.round(seg / paso));
        for (var m = 0; m < n; m++) {
          var u = m / n;
          pos.push(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 0);
          aS.push((recorrido + seg * u) / t.largo); aPista.push(azar(i * 13 + 7)); aTipo.push(0);
        }
        recorrido += seg;
      }
      // nodos: el pad del borde (tipo 1)
      pos.push(t.p[0][0], t.p[0][1], 0); aS.push(0); aPista.push(azar(i * 13 + 7)); aTipo.push(1);
    });
    // la carga: un anillo de puntos y un brillo central (tipo 2 y 3)
    for (var r = 0; r < anilloN; r++) {
      var an = r / anilloN * 6.2832;
      pos.push(Math.cos(an) * R_CARGA, Math.sin(an) * R_CARGA, 0); aS.push(1); aPista.push(azar(r + 3)); aTipo.push(2);
    }
    pos.push(0, 0, 0.32); aS.push(1); aPista.push(0.5); aTipo.push(3);       // el brillo flota sobre el tablero
    // retícula tenue del tablero (tipo 4): da profundidad a la perspectiva
    for (var gx = -ANCHO / 2; gx <= ANCHO / 2 + 0.01; gx += 0.4)
      for (var gy = -ALTO / 2; gy <= ALTO / 2 + 0.01; gy += 0.4) { pos.push(gx, gy, 0); aS.push(0); aPista.push(azar(gx * 31 + gy * 17)); aTipo.push(4); }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1));
    geo.setAttribute("aPista", new THREE.Float32BufferAttribute(aPista, 1));
    geo.setAttribute("aTipo", new THREE.Float32BufferAttribute(aTipo, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

    function colores() {
      return {
        c1: ctx.color("--l3d-1", claro ? "#b45309" : "#ffd23f"),
        c2: ctx.color("--l3d-2", claro ? "#c2410c" : "#ff8a3d"),
        c3: ctx.color("--l3d-3", claro ? "#1c1917" : "#ffffff"),
        c4: ctx.color("--l3d-4", claro ? "#a8a29e" : "#4b5563")
      };
    }
    var c = colores();
    var material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      blending: claro ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: {
        uTiempo: { value: 0 }, uCarga: { value: 0 }, uEntrada: { value: 0 },
        uTamano: { value: (op.tamano || 1) * ctx.renderer.getPixelRatio() * 3.1 },
        uClaro: { value: claro ? 1 : 0 },
        uColor1: { value: c.c1 }, uColor2: { value: c.c2 }, uColor3: { value: c.c3 }, uColor4: { value: c.c4 }
      },
      vertexShader: [
        "attribute float aS, aPista, aTipo;",
        "uniform float uTiempo, uCarga, uEntrada, uTamano;",
        "varying float vLuz; varying float vPulso; varying float vTono; varying float vAlfa; varying float vTipo;",
        "void main(){",
        "  vec3 p = position;",
        "  float t = uTiempo;",
        // la entrada dibuja las pistas desde el borde (apagadas)
        "  float dibujada = step(aS, uEntrada * 1.15 - aPista * 0.15);",
        // ¿le llegó la corriente? avanza del borde (aS=0) a la carga (aS=1), cada pista a su ritmo
        "  float frente = uCarga * 1.25 - aPista * 0.25;",
        "  float luz = smoothstep(frente, frente - 0.04, aS);",
        "  if (aTipo > 1.5 && aTipo < 3.5) luz = smoothstep(0.86, 1.0, uCarga);",               // la carga, al final
        "  if (aTipo > 0.5 && aTipo < 1.5) luz = step(0.02, uCarga);",           // pads del borde: enseguida
        // con poca carga lo encendido parpadea (la falla); con carga completa, firme
        "  float falla = 1.0 - smoothstep(0.35, 0.8, uCarga);",
        "  float parpadeo = step(0.55, fract(sin(floor(t * 9.0 + aPista * 40.0) * 12.9898) * 43758.5453));",
        "  luz *= mix(1.0, 0.25 + 0.75 * parpadeo, falla);",
        // pulsos que viajan por las pistas encendidas
        "  float pulsoPos = fract(t * (0.22 + aPista * 0.18) + aPista * 7.0);",
        "  float pulso = smoothstep(0.045, 0.0, abs(aS - pulsoPos)) * luz * step(aTipo, 0.5);",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  if (aTipo > 3.5) luz = 0.0;",
        "  float base = aTipo > 3.5 ? 0.9 : (aTipo > 2.5 ? 30.0 : (aTipo > 1.5 ? 1.35 : (aTipo > 0.5 ? 2.6 : 1.2)));",
        "  float brillo = (aTipo > 2.5 && aTipo < 3.5) ? (0.2 + 0.8 * luz) * (0.92 + 0.08 * sin(t * 3.0)) : 1.0;",
        "  gl_PointSize = uTamano * base * brillo * (1.0 + pulso * 1.6) * (7.0 / -mv.z);",
        "  vLuz = luz; vPulso = pulso; vTono = aS; vTipo = aTipo;",
        "  vAlfa = aTipo > 3.5 ? uEntrada * 0.45 : dibujada * (aTipo > 2.5 ? luz : 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor1, uColor2, uColor3, uColor4; uniform float uClaro;",
        "varying float vLuz; varying float vPulso; varying float vTono; varying float vAlfa; varying float vTipo;",
        "void main(){",
        "  float d = length(gl_PointCoord - 0.5);",
        "  float forma = (vTipo > 2.5 && vTipo < 3.5) ? pow(smoothstep(0.5, 0.0, d), 2.2) : mix(smoothstep(0.5, 0.0, d), smoothstep(0.5, 0.3, d), uClaro);",
        "  vec3 encendido = mix(uColor1, uColor2, smoothstep(0.4, 1.0, vTono));",
        "  vec3 col = mix(uColor4, encendido, vLuz);",
        "  col = mix(col, uColor3, vPulso * 0.85);",
        "  if (vTipo > 2.5 && vTipo < 3.5) col = mix(uColor1, uColor3, 0.55);",
        "  float a = mix(mix(0.3, 0.42, uClaro), 0.95, vLuz);",
        "  gl_FragColor = vec4(col, forma * a * vAlfa);",
        "}"
      ].join("\n")
    });

    var puntos = new THREE.Points(geo, material);
    var grupo = new THREE.Group(); grupo.add(puntos); ctx.escena.add(grupo);
    ctx.camara.position.set(0, 0, 7);
    var inclinacion = (op.inclinacion == null ? 52 : op.inclinacion) * Math.PI / 180;

    var rango = op.carga || [0.12, 1];
    var raizDoc = document.documentElement;
    var zonaPropia = ctx.canvas.hasAttribute("data-escena-scroll") || !!ctx.canvas.closest("[data-escena-zona]");
    var modo = op.modo || (zonaPropia ? "scroll" : "ciclo");
    var ciclo = op.ciclo || 9;
    var sinEntrada = ctx.reducido || raizDoc.classList.contains("l3d-qa");
    var nacio = null, carga = rango[0], avisada = -1;

    return {
      alCambiarTema: function () {
        setTimeout(function () {
          claro = detectarClaro();
          material.blending = claro ? THREE.NormalBlending : THREE.AdditiveBlending;
          material.needsUpdate = true;
          material.uniforms.uClaro.value = claro ? 1 : 0;
          var cc = colores();
          material.uniforms.uColor1.value = cc.c1; material.uniforms.uColor2.value = cc.c2;
          material.uniforms.uColor3.value = cc.c3; material.uniforms.uColor4.value = cc.c4;
        }, 850);
      },
      actualizar: function (t, dt) {
        material.uniforms.uTiempo.value = t;
        if (nacio === null && !raizDoc.classList.contains("cine-entrando")) nacio = performance.now();
        var vida = nacio === null ? 0 : (performance.now() - nacio) / 1000;
        material.uniforms.uEntrada.value = sinEntrada ? 1 : Math.min(1, vida / 2.2);

        // carga objetivo: el progreso de la zona (o un ciclo que carga y descarga)
        var objetivo;
        if (modo === "scroll") objetivo = ctx.mezclar(rango[0], rango[1], Math.min(1, ctx.scroll * 1.15));
        else objetivo = ctx.mezclar(rango[0], rango[1], 0.5 - 0.5 * Math.cos(t * 6.2832 / ciclo));
        if (!sinEntrada && vida < 2.2) objetivo = Math.min(objetivo, rango[0]);
        carga += (objetivo - carga) * (sinEntrada ? 1 : Math.min(1, dt * 3.5));
        material.uniforms.uCarga.value = carga;
        var redondeada = Math.round(carga * 100);
        if (redondeada !== avisada) {
          avisada = redondeada;
          try { ctx.canvas.dispatchEvent(new CustomEvent("l3d-carga", { detail: { valor: carga } })); } catch (e) {}
        }

        var vertical = ctx.aspecto < 1;
        var s = (op.escala || 1) * (vertical ? Math.max(0.42, ctx.aspecto * 1.05) : 1);
        var px = op.x || 0, py = op.y || 0;
        if (vertical) {
          var mv = op.movil || {};
          if (Array.isArray(mv)) {
            // una posición por tramo del scroll, con paso suave entre una y otra
            var n = mv.length, f = Math.min(1, Math.max(0, ctx.scroll)) * Math.max(0, n - 1);
            var i0 = Math.min(n - 1, Math.floor(f)), i1 = Math.min(n - 1, i0 + 1), k = f - i0;
            k = k * k * (3 - 2 * k);
            var A = mv[i0] || {}, B = mv[i1] || {};
            mv = { x: ctx.mezclar(A.x || 0, B.x || 0, k), y: ctx.mezclar(A.y || 0, B.y || 0, k), s: ctx.mezclar(A.s || 1, B.s || 1, k) };
          }
          px = mv.x || 0; py = mv.y || 0; s *= mv.s || 1;
        }
        grupo.scale.setScalar(s);
        grupo.position.set(px, py, 0);
        grupo.rotation.x = -inclinacion + Math.sin(t * 0.25) * 0.04 - ctx.puntero.y * 0.12;
        grupo.rotation.z = Math.sin(t * 0.18) * 0.05 + ctx.puntero.x * 0.12;
        grupo.rotation.y = ctx.puntero.x * 0.1;
      },
      destruir: function () { geo.dispose(); material.dispose(); }
    };
  });
})();
