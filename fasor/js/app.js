/* app.js — CONTROLADOR: une los datos (js/datos.js) con la página (index.html).
 * El movimiento genérico (revelados, escenas 3D, menú, capa cinematográfica) ya lo hacen js/motor.js y js/cine.js.
 * Aquí va solo lo propio de este sitio. Cada función se lanza con L3D.seguro() para que un fallo
 * en una parte no deje el resto de la página sin funcionar.
 *
 * Atributos que entiende (todos se rellenan desde datos.js; cambiar un dato no exige tocar el HTML):
 *   <a data-enlace="whatsapp|telefono|email|mapa|instagram…" data-mensaje="…" data-respaldo="#contacto">
 *     (mensaje con {producto} y data-producto en el botón o su tarjeta; plantilla común en SITIO.mensajes.whatsapp)
 *   <span data-dato="direccion" data-pendiente="Dirección por confirmar" data-prefijo="" data-sufijo="">
 *   <span data-si-falta="telefono">…solo se ve mientras falte ese dato…</span>
 *   <p data-pendientes="whatsapp,telefono,direccion" data-pendientes-texto="Faltan datos del negocio:" hidden>
 *   <form data-formulario data-whatsapp-saludo="Hola, …">   <a data-comprar="ID_VARIANTE">   <span data-anio>
 *     (dentro del formulario, data-no-mensaje en un campo lo deja fuera del texto de WhatsApp/correo: casillas de
 *      autorización de datos, aceptación de condiciones)
 */
(function () {
  "use strict";
  var S = window.SITIO || {}, L = window.L3D;
  if (!L) return;
  var contacto = S.contacto || {};
  var raiz = document.documentElement;

  var NOMBRES = { whatsapp: "WhatsApp", telefono: "teléfono", email: "correo", direccion: "dirección",
                  horario: "horario", mapa: "mapa", garantia: "garantía", certificacion: "certificación",
                  urgencias: "urgencias", visita: "valor de la visita", nit: "NIT",
                  matricula: "matrícula profesional" };

  function valorDe(tipo) { return contacto[tipo] || (S.redes || {})[tipo] || ""; }

  function urlWhatsapp(texto) {
    return "https://wa.me/" + String(contacto.whatsapp || "").replace(/\D/g, "") + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  /** Mensaje de WhatsApp de un botón: su data-mensaje o, si no tiene, la plantilla de datos.js
   *  (SITIO.mensajes.whatsapp). {producto} se cambia por el data-producto del botón o de su tarjeta:
   *  <article data-producto="Nintendo Switch 2"> … <a data-enlace="whatsapp" data-respaldo="#contacto">Pregunta</a> */
  function mensajeDe(el) {
    var plantilla = el.getAttribute("data-mensaje") || ((S.mensajes || {}).whatsapp) || "";
    var conProducto = el.closest("[data-producto]");
    var producto = conProducto ? conProducto.getAttribute("data-producto") : "";
    return plantilla.replace(/\{producto\}/g, producto).replace(/\s{2,}/g, " ").trim();
  }

  /** Enlaces de contacto. Con el dato: se rellenan y se MUESTRAN (aunque el HTML los traiga con hidden).
   *  Sin el dato: si llevan data-respaldo (la acción principal) se quedan visibles y llevan a ese bloque;
   *  si no, se ocultan en lugar de quedar rotos. */
  function enlaces() {
    L.todos("[data-enlace]").forEach(function (el) {
      var tipo = el.getAttribute("data-enlace"), valor = valorDe(tipo);
      if (!valor) {
        var respaldo = el.getAttribute("data-respaldo");
        if (respaldo) { el.href = respaldo; el.hidden = false; el.removeAttribute("target"); }
        else el.hidden = true;
        return;
      }
      el.hidden = false;
      if (tipo === "telefono") el.href = "tel:" + valor.replace(/[^\d+]/g, "");
      else if (tipo === "email") el.href = "mailto:" + valor;
      else if (tipo === "whatsapp") {
        el.href = urlWhatsapp(mensajeDe(el));
        el.target = "_blank"; el.rel = "noopener";
      } else { el.href = valor; el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  /** Textos que salen de datos.js. Sin dato: el texto de data-pendiente (hueco visible, clase .pendiente)
   *  o, si no lo tiene, se oculta. */
  function datos() {
    L.todos("[data-dato]").forEach(function (el) {
      var valor = valorDe(el.getAttribute("data-dato"));
      var pendiente = el.getAttribute("data-pendiente");
      if (valor) {
        el.textContent = (el.getAttribute("data-prefijo") || "") + valor + (el.getAttribute("data-sufijo") || "");
        el.classList.remove("pendiente"); el.hidden = false;
      } else if (pendiente) {
        el.textContent = pendiente; el.classList.add("pendiente"); el.hidden = false;
      } else el.hidden = true;
    });
    L.todos("[data-si-falta]").forEach(function (el) { el.hidden = !!valorDe(el.getAttribute("data-si-falta")); });
  }

  /** Franja de muestra: enumera los datos imprescindibles que faltan. Con todos rellenos no aparece.
   *  Escribe --franja (su alto) en <html> para que la portada lo descuente. */
  function pendientes() {
    var el = document.querySelector("[data-pendientes]");
    if (!el) return;
    var claves = (el.getAttribute("data-pendientes") || "whatsapp").split(",").map(function (k) { return k.trim(); });
    var faltan = claves.filter(function (k) { return k && !valorDe(k); }).map(function (k) { return NOMBRES[k] || k; });
    if (!faltan.length) { el.hidden = true; raiz.style.setProperty("--franja", "0px"); return; }
    el.textContent = "";
    var fuerte = document.createElement("strong");
    fuerte.textContent = "Muestra ";
    el.appendChild(fuerte);
    el.appendChild(document.createTextNode((el.getAttribute("data-pendientes-texto") || "Faltan datos del negocio:") + " " + faltan.join(", ") + "."));
    el.hidden = false;
    function medir() { raiz.style.setProperty("--franja", el.offsetHeight + "px"); }
    medir();
    window.addEventListener("resize", medir, { passive: true });
  }

  /** Formulario de contacto: valida, evita envíos dobles y dice con claridad qué ha pasado.
   *  Sin destino (S.formulario.destino) abre WhatsApp o el correo con el mensaje ya escrito: funciona sin servidor.
   *  Si no hay ningún canal, el visitante ve un mensaje normal y quien construye, un aviso en la consola. */
  function formulario() {
    L.todos("[data-formulario]").forEach(function (form) {
      var estado = form.querySelector("[data-formulario-estado]");
      function decir(texto, tipo) { if (estado) { estado.textContent = texto; estado.setAttribute("data-tipo", tipo || ""); } }
      form.addEventListener("submit", function (e) {
        if (!form.checkValidity()) return;                  // el navegador muestra qué falta
        e.preventDefault();
        var trampa = form.querySelector("[name='web']");    // campo oculto anti-robots: si viene relleno, se ignora
        if (trampa && trampa.value) return;
        var datosForm = new FormData(form);
        var destino = (S.formulario || {}).destino;
        if (!destino) {
          var lineas = [];
          var saludo = form.getAttribute("data-whatsapp-saludo");
          if (saludo) lineas.push(saludo);
          // fuera del mensaje: la trampa anti-robots y los campos con data-no-mensaje (p. ej. la casilla de autorización)
          var fuera = { web: true };
          L.todos("[data-no-mensaje]", form).forEach(function (c) { if (c.name) fuera[c.name] = true; });
          datosForm.forEach(function (v, k) { if (!fuera[k] && String(v).trim()) lineas.push(k + ": " + String(v).trim()); });
          var mensaje = lineas.join("\n");
          if (contacto.whatsapp) {
            window.open(urlWhatsapp(mensaje), "_blank", "noopener");
            decir("Abrimos tu WhatsApp con el mensaje escrito. Solo falta que lo envíes.", "ok");
          } else if (contacto.email) {
            window.location.href = "mailto:" + contacto.email + "?subject=" + encodeURIComponent("Contacto desde la web") + "&body=" + encodeURIComponent(mensaje);
            decir("Abrimos tu correo con el mensaje escrito. Solo falta que lo envíes.", "ok");
          } else {
            console.warn("[app] El formulario no tiene destino: rellena contacto.whatsapp, contacto.email o formulario.destino en js/datos.js");
            decir(form.getAttribute("data-sin-canal") || "Este formulario aún no está activo. Muy pronto podrás escribirnos desde aquí.", "error");
          }
          return;
        }
        var boton = form.querySelector("[type='submit']");
        if (boton) boton.disabled = true;
        decir("Enviando…", "");
        fetch(destino, { method: (S.formulario.metodo || "POST"), body: datosForm, headers: { Accept: "application/json" } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); decir("Mensaje enviado. Te responderemos pronto.", "ok"); })
          .catch(function () { decir("No se pudo enviar. Inténtalo de nuevo o escríbenos por otro canal.", "error"); })
          .then(function () { if (boton) boton.disabled = false; });
      });
    });
  }

  /** Botones de compra de Shopify: <a data-comprar="ID_VARIANTE" data-cantidad="1">.
   *  Llevan al carrito de la tienda con el producto ya añadido (enlace oficial de carrito, sin claves). */
  function compra() {
    var dominio = (S.shopify || {}).dominio;
    L.todos("[data-comprar]").forEach(function (el) {
      var variante = el.getAttribute("data-comprar");
      if (!dominio || !variante) { el.hidden = true; return; }
      el.hidden = false;
      el.href = "https://" + dominio.replace(/^https?:\/\//, "").replace(/\/$/, "") + "/cart/" + variante + ":" + (el.getAttribute("data-cantidad") || "1");
    });
  }

  /** Año del pie siempre al día: <span data-anio></span> */
  function anio() {
    L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  // ================================================================ PROPIO DE FASOR

  /** 490700 → "$490.700" (miles con punto, como se escribe en Colombia) */
  function pesos(n) { return "$" + miles(n); }
  function miles(n) { return Math.round(Math.max(0, n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  /** Rango corto para el desglose: 85000–120000 → "$85.000 – $120.000" */
  function rango(a, b) { return b && b !== a ? pesos(a) + " – " + pesos(b) : pesos(a); }
  /** Repone el href de un botón de WhatsApp después de cambiar su mensaje. */
  function refrescarWhatsapp(el, texto) {
    if (!el || !contacto.whatsapp) return;
    el.href = urlWhatsapp(texto != null ? texto : mensajeDe(el));
  }

  /** Tabla de servicios desde datos.js: rango de referencia, fuente (con enlace), precio propio o "Por confirmar"
   *  y botón "Pedir". El HTML trae un resumen sin botones para quien no tiene JavaScript. Va antes de enlaces(). */
  function precios() {
    var cuerpo = document.querySelector("[data-precios]"), P = S.precios || {}, F = S.fuentes || {};
    if (!cuerpo || !(P.lista || []).length) return;
    cuerpo.textContent = "";
    P.lista.forEach(function (p) {
      var fila = document.createElement("tr");
      fila.setAttribute("data-grupo", p.grupo || "");
      var th = document.createElement("th"); th.scope = "row"; th.textContent = p.servicio;
      var ref = document.createElement("td"); ref.setAttribute("data-rotulo", "Referencia 2026");
      ref.textContent = p.desde ? rango(p.desde, p.hasta) : "—";
      var fu = document.createElement("td"); fu.setAttribute("data-rotulo", "Fuente"); fu.className = "tabla-precios__fuente";
      var f = F[p.fuente];
      if (f) {
        var a = document.createElement("a"); a.href = f.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = f.nombre;
        fu.appendChild(a);
      } else fu.textContent = p.fuente || "—";
      var propio = document.createElement("td"); propio.setAttribute("data-rotulo", S.marca || "Precio");
      if (p.propio) propio.textContent = /^\d+$/.test(String(p.propio)) ? pesos(+p.propio) : String(p.propio);
      else { var pe = document.createElement("span"); pe.className = "pendiente"; pe.textContent = "Por confirmar"; propio.appendChild(pe); }
      var accion = document.createElement("td");
      var b = document.createElement("a");
      b.className = "pedir"; b.href = "#contacto";
      b.setAttribute("data-enlace", "whatsapp"); b.setAttribute("data-respaldo", "#contacto");
      b.setAttribute("data-producto", p.servicio);
      b.setAttribute("data-mensaje", "Hola, " + (S.marca || "") + ". Quiero cotizar: {producto}.");
      b.setAttribute("aria-label", "Pedir " + p.servicio.charAt(0).toLowerCase() + p.servicio.slice(1) + " por WhatsApp");
      b.textContent = "Pedir";
      accion.appendChild(b);
      [th, ref, fu, propio, accion].forEach(function (c) { fila.appendChild(c); });
      cuerpo.appendChild(fila);
    });
    var nota = document.querySelector("[data-precios-nota]");
    if (nota && P.nota) nota.textContent = P.nota;
  }

  /** Filtros de la tabla por grupo. */
  function filtros() {
    var caja = document.querySelector("[data-filtros]"), cuerpo = document.querySelector("[data-precios]");
    if (!caja || !cuerpo) return;
    var botones = L.todos("[data-filtro]", caja);
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filtro");
        botones.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        L.todos("tr", cuerpo).forEach(function (tr) { tr.hidden = !!f && tr.getAttribute("data-grupo") !== f; });
      });
    });
  }

  /** Medidor de la portada: sigue la carga del circuito (evento l3d-carga del lienzo, de 0 a 1). */
  function medidor() {
    var lienzo = document.querySelector(".zona .l3d-lienzo"), caja = document.querySelector("[data-medidor]");
    if (!lienzo || !caja) return;
    var valor = caja.querySelector("[data-medidor-valor]"), barra = caja.querySelector("[data-medidor-barra]");
    var estados = L.todos("[data-estado]", caja), ultimo = -1;
    lienzo.addEventListener("l3d-carga", function (e) {
      var v = Math.max(0, Math.min(1, e.detail ? +e.detail.valor || 0 : 0));
      var pct = Math.round(v * 100);
      if (pct === ultimo) return;
      ultimo = pct;
      if (valor) valor.textContent = pct;
      if (barra) barra.style.setProperty("--x", pct + "%");
      var estado = v < 0.4 ? "falla" : v < 0.86 ? "revision" : "estable";
      caja.setAttribute("data-nivel", estado);
      estados.forEach(function (li) { li.classList.toggle("activa", li.getAttribute("data-estado") === estado); });
    });
  }

  /** Cotizador por puntos (rangos de Presucosto en datos.js → cotizador). Suma mínimo y máximo de cada punto,
   *  con o sin materiales; la urgencia multiplica por (1 + recargo mínimo) y (1 + recargo máximo). */
  function cotizador() {
    var caja = document.querySelector("[data-cotizador]");
    if (!caja) return;
    var C = S.cotizador || {}, puntos = C.puntos || [];
    var porId = {};
    puntos.forEach(function (p) { porId[p.id] = p; });
    var filas = L.todos("[data-punto]", caja).filter(function (li) { return porId[li.getAttribute("data-punto")]; });
    var materiales = caja.querySelector("[data-coti='materiales']"), urgente = caja.querySelector("[data-coti='urgente']");
    var desglose = caja.querySelector("[data-coti-desglose]"), barras = caja.querySelector("[data-coti-barras]");
    var wa = caja.querySelector("[data-coti-wa]"), fuente = caja.querySelector("[data-coti-fuente]");
    if (fuente && C.fuenteUrl) fuente.href = C.fuenteUrl;
    var MAX = 20;
    function cuenta(li) { return parseInt(li.querySelector("[data-coti-cuenta]").textContent, 10) || 0; }
    function salida(n, v) { var el = caja.querySelector("[data-coti-out='" + n + "']"); if (el) el.textContent = v; }

    function calcular() {
      var con = materiales.checked, urg = urgente.checked, u = C.urgencia || [0.5, 1];
      var total = [0, 0], n = 0, lineas = [], partes = [];
      if (desglose) desglose.textContent = "";
      filas.forEach(function (li) {
        var p = porId[li.getAttribute("data-punto")], c = cuenta(li), r = con ? p.con : p.mo;
        li.querySelector("[data-coti-menos]").disabled = c <= 0;
        li.querySelector("[data-coti-mas]").disabled = c >= MAX;
        li.classList.toggle("con-cuenta", c > 0);
        if (!c) return;
        var a = r[0] * c, b = r[1] * c;
        total[0] += a; total[1] += b; n += c;
        partes.push({ nombre: p.nombre, a: a, b: b });
        lineas.push(c + " × " + p.nombre + ": " + rango(a, b));
        if (desglose) {
          var d = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
          dt.textContent = c + " × " + p.nombre; dd.textContent = rango(a, b);
          d.appendChild(dt); d.appendChild(dd); desglose.appendChild(d);
        }
      });
      var baseMax = total[1];
      if (urg && n) {
        var ua = total[0] * u[0], ub = total[1] * u[1];
        if (desglose) {
          var d2 = document.createElement("div"), t2 = document.createElement("dt"), v2 = document.createElement("dd");
          t2.textContent = "Recargo de urgencia (+" + Math.round(u[0] * 100) + " % a +" + Math.round(u[1] * 100) + " %)";
          v2.textContent = "+" + rango(ua, ub);
          d2.appendChild(t2); d2.appendChild(v2); desglose.appendChild(d2);
        }
        total[0] += ua; total[1] += ub;
      }
      // redondeo a miles, como se cotiza
      total = [Math.round(total[0] / 1000) * 1000, Math.round(total[1] / 1000) * 1000];
      if (n) {
        salida("desde", pesos(total[0])); salida("hasta", pesos(total[1]));
        salida("resumen", n + (n === 1 ? " punto " : " puntos ") + (con ? "con materiales" : "solo mano de obra") + (urg ? ", con recargo de urgencia." : "."));
      } else {
        salida("desde", "$0"); salida("hasta", "$0");
        salida("resumen", "Suma al menos un punto con el botón +.");
      }
      caja.classList.toggle("coti--vacio", !n);
      // barras: cuánto pesa cada tipo de punto en el máximo
      if (barras) {
        barras.textContent = "";
        partes.forEach(function (p, i) {
          var s = document.createElement("i");
          s.style.setProperty("--w", (baseMax ? p.b / baseMax * 100 : 0).toFixed(2) + "%");
          s.setAttribute("data-tono", String(i % 5));
          barras.appendChild(s);
        });
      }
      refrescarWhatsapp(wa, n ? [
        "Hola, " + (S.marca || "") + ". Armé esta cotización en la web:"
      ].concat(lineas, [
        (con ? "Con materiales" : "Solo mano de obra") + (urg ? " · urgente" : ""),
        "Rango de referencia: " + pesos(total[0]) + " – " + pesos(total[1]),
        "¿Me confirman el precio y cuándo pueden venir?"
      ]).join("\n") : "Hola, " + (S.marca || "") + ". Quiero cotizar puntos eléctricos para mi casa.");
    }
    function mover(li, paso) {
      var out = li.querySelector("[data-coti-cuenta]");
      out.textContent = Math.min(MAX, Math.max(0, cuenta(li) + paso));
      calcular();
    }
    filas.forEach(function (li) {
      li.querySelector("[data-coti-menos]").addEventListener("click", function () { mover(li, -1); });
      li.querySelector("[data-coti-mas]").addEventListener("click", function () { mover(li, 1); });
    });
    [materiales, urgente].forEach(function (el) { el.addEventListener("change", calcular); });
    caja.querySelector("[data-coti-form]").addEventListener("submit", function (e) { e.preventDefault(); });
    calcular();
  }

  /** Guía "¿Qué hago si…?": pestañas accesibles (flechas, Inicio, Fin). Sin JS se ven todos los paneles. */
  function diagnostico() {
    var caja = document.querySelector("[data-diagnostico]");
    if (!caja) return;
    var pestanas = L.todos("[role='tab']", caja);
    function panelDe(p) { return document.getElementById(p.getAttribute("aria-controls")); }
    function poner(boton, conFoco) {
      pestanas.forEach(function (p) {
        var si = p === boton;
        p.setAttribute("aria-selected", si ? "true" : "false");
        p.tabIndex = si ? 0 : -1;
        var panel = panelDe(p);
        if (panel) panel.hidden = !si;
      });
      if (conFoco) boton.focus();
    }
    pestanas.forEach(function (p, i) {
      p.addEventListener("click", function () {
        poner(p);
        var panel = panelDe(p);
        if (panel && window.innerWidth < 960) panel.scrollIntoView({ behavior: L.reducido ? "auto" : "smooth", block: "nearest" });
      });
      p.addEventListener("keydown", function (e) {
        var n = pestanas.length, j = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + n) % n;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = n - 1;
        if (j === null) return;
        e.preventDefault();
        poner(pestanas[j], true);
      });
    });
  }

  /** Cobertura: la línea del valle (sur → norte) sale de datos.js. Tocar un municipio escribe el mensaje de
   *  WhatsApp con ese municipio y lo deja elegido en el formulario. */
  function cobertura() {
    var caja = document.querySelector("[data-cobertura]");
    if (!caja) return;
    var lista = caja.querySelector("[data-cobertura-lista]"), datosC = S.cobertura || [];
    var ejemplo = document.querySelector("[data-cobertura-ejemplo]");
    if (ejemplo) ejemplo.hidden = !!S.coberturaConfirmada;
    if (datosC.length) {
      lista.textContent = "";
      datosC.forEach(function (c) {
        var li = document.createElement("li"), b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("data-municipio", c.municipio);
        if (!c.cubre) b.classList.add("no-cubre");
        var i = document.createElement("i"), s = document.createElement("span"), sm = document.createElement("small");
        s.textContent = c.municipio; sm.textContent = c.cubre ? "Atiende" : "Consultar";
        b.appendChild(i); b.appendChild(s); b.appendChild(sm); li.appendChild(b); lista.appendChild(li);
      });
    }
    var botones = L.todos("[data-municipio]", lista), elegido = caja.querySelector("[data-cobertura-elegido]");
    var wa = caja.querySelector("[data-cobertura-wa]"), select = document.querySelector("[data-municipios]");
    function cubre(m) { var c = datosC.filter(function (x) { return x.municipio === m; })[0]; return !c || c.cubre; }
    function poner(m, desdeFormulario) {
      botones.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-municipio") === m ? "true" : "false"); });
      if (elegido) elegido.textContent = m;
      var marca = S.marca || "";
      refrescarWhatsapp(wa, cubre(m) ? "Hola, " + marca + ". Estoy en " + m + " y necesito un electricista."
                                     : "Hola, " + marca + ". Estoy en " + m + ". ¿Llegan hasta allá?");
      if (select && !desdeFormulario) select.value = m;
    }
    botones.forEach(function (b) { b.addEventListener("click", function () { poner(b.getAttribute("data-municipio")); }); });
    var inicial = botones.filter(function (b) { return b.getAttribute("data-municipio") === "Medellín"; })[0] || botones[0];
    if (inicial) {
      botones.forEach(function (b) { b.setAttribute("aria-pressed", b === inicial ? "true" : "false"); });
      if (elegido) elegido.textContent = inicial.getAttribute("data-municipio");
    }
    if (select) select.addEventListener("change", function () { if (select.value && select.value !== "Otro") poner(select.value, true); });
  }

  /** Barra fija del móvil: aparece al salir de la zona de la portada y se esconde al llegar al contacto. */
  function barraMovil() {
    var cierre = document.getElementById("contacto"), zona = document.getElementById("inicio");
    var pendiente = false;
    function mirar() {
      pendiente = false;
      var vh = window.innerHeight;
      var trasPortada = zona ? zona.getBoundingClientRect().bottom < vh * 0.9 : window.pageYOffset > vh * 0.75;
      var enCierre = cierre && cierre.getBoundingClientRect().top < vh * 0.85;
      raiz.classList.toggle("barra-visible", trasPortada && !enCierre && !raiz.classList.contains("menu-abierto"));
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(mirar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    mirar();
  }

  function iniciar() {
    L.seguro(precios, "precios");          // antes de enlaces(): crea los botones "Pedir"
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formulario, "formulario");
    L.seguro(compra, "compra");
    L.seguro(anio, "anio");
    L.seguro(filtros, "filtros");
    L.seguro(medidor, "medidor");
    L.seguro(cotizador, "cotizador");
    L.seguro(diagnostico, "diagnostico");
    L.seguro(cobertura, "cobertura");
    L.seguro(barraMovil, "barraMovil");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
