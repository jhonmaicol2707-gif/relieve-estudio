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
                  urgencias: "urgencias", visita: "valor de la visita", nit: "NIT" };

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

  // ================================================================ PROPIO DE ALISIO

  /** 490700 → "$490.700" (miles con punto, como se escribe en Colombia) */
  function pesos(n) { return "$" + miles(n); }
  function miles(n) { return Math.round(Math.max(0, n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function numeroDe(texto) { return parseFloat(String(texto == null ? "" : texto).replace(",", ".")) || 0; }
  /** Repone el href de un botón de WhatsApp después de cambiar su mensaje. */
  function refrescarWhatsapp(el, texto) {
    if (!el || !contacto.whatsapp) return;
    el.href = urlWhatsapp(texto != null ? texto : mensajeDe(el));
  }

  /** Tabla de servicios desde datos.js: referencia EPM, precio propio (o "Por confirmar") y botón "Pedir".
   *  El HTML trae las mismas filas, sin botones, para quien no tiene JavaScript. Va antes de enlaces(). */
  function precios() {
    var cuerpo = document.querySelector("[data-precios]"), P = S.precios || {};
    if (!cuerpo || !(P.lista || []).length) return;
    cuerpo.textContent = "";
    P.lista.forEach(function (p) {
      var fila = document.createElement("tr");
      fila.setAttribute("data-equipo", p.equipo || "");
      var th = document.createElement("th"); th.scope = "row"; th.textContent = p.servicio;
      var ref = document.createElement("td"); ref.setAttribute("data-rotulo", "Referencia EPM 2026");
      ref.textContent = p.referencia ? pesos(p.referencia) : "—";
      var propio = document.createElement("td"); propio.setAttribute("data-rotulo", S.marca || "Precio");
      if (p.propio) propio.textContent = pesos(numeroDe(p.propio));
      else { var pe = document.createElement("span"); pe.className = "pendiente"; pe.textContent = "Por confirmar"; propio.appendChild(pe); }
      var accion = document.createElement("td");
      var a = document.createElement("a");
      a.className = "pedir"; a.href = "#contacto";
      a.setAttribute("data-enlace", "whatsapp"); a.setAttribute("data-respaldo", "#contacto");
      a.setAttribute("data-producto", p.servicio);
      a.setAttribute("data-mensaje", "Hola, " + (S.marca || "") + ". Quiero cotizar: {producto}.");
      a.setAttribute("aria-label", "Pedir " + p.servicio.toLowerCase() + " por WhatsApp");
      a.textContent = "Pedir";
      accion.appendChild(a);
      fila.appendChild(th); fila.appendChild(ref); fila.appendChild(propio); fila.appendChild(accion);
      cuerpo.appendChild(fila);
    });
    function texto(sel, valor, url) {
      var el = document.querySelector(sel);
      if (el && valor) el.textContent = valor;
      if (el && url) el.href = url;
    }
    texto("[data-precios-fuente]", P.fuente, P.fuenteUrl);
    texto("[data-precios-nota]", P.nota);
    texto("[data-precios-equipo]", P.equipo);
    var fe = document.querySelector("[data-precios-equipo-fuente]");
    if (fe) { if (P.equipoUrl) fe.href = P.equipoUrl; else fe.hidden = true; }
  }

  /** Filtros de la tabla por equipo (el diagnóstico, "Cualquiera", se ve siempre). */
  function filtros() {
    var caja = document.querySelector("[data-filtros]"), cuerpo = document.querySelector("[data-precios]");
    if (!caja || !cuerpo) return;
    var botones = L.todos("[data-filtro]", caja);
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filtro");
        botones.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        L.todos("tr", cuerpo).forEach(function (tr) {
          var e = tr.getAttribute("data-equipo");
          tr.hidden = !!f && e !== f && e !== "Cualquiera";
        });
      });
    });
  }

  /** Leyenda de la portada: marca la figura que dibujan las partículas (evento l3d-figura del lienzo). */
  function leyenda() {
    var lienzo = document.querySelector(".zona .l3d-lienzo"), lista = document.querySelector("[data-leyenda]");
    if (!lienzo || !lista) return;
    function marcar(i) { L.todos("[data-figura]", lista).forEach(function (li) { li.classList.toggle("activa", +li.getAttribute("data-figura") === i); }); }
    lienzo.addEventListener("l3d-figura", function (e) { marcar(e.detail ? e.detail.indice : 0); });
    marcar(0);
  }

  /** Calculadora de BTU (regla de Midea Colombia, configurable en datos.js → btu).
   *  base = área × porM2; + sol y techo como % de la base; + porPersona por persona por encima de personasBase;
   *  + porAparato por aparato. Se redondea a 100 y se elige el primer tamaño comercial que lo cubre. */
  function calculadora() {
    var caja = document.querySelector("[data-calculadora]");
    if (!caja) return;
    var B = S.btu || {};
    var porM2 = B.porM2 || 600, tamanos = B.tamanos || [9000, 12000, 18000, 24000, 36000];
    var min = tamanos[0], max = tamanos[tamanos.length - 1];
    function campo(n) { return caja.querySelector("[data-calc='" + n + "']"); }
    function salida(n, v) { L.todos("[data-calc-out='" + n + "']", caja).forEach(function (el) { el.textContent = v; }); }
    function fila(n, visible) { var el = caja.querySelector("[data-calc-fila='" + n + "']"); if (el) el.hidden = !visible; }
    var largo = campo("largo"), ancho = campo("ancho"), sol = campo("sol"), techo = campo("techo");
    var cuentas = { personas: { el: campo("personas"), min: 1, max: 12 }, aparatos: { el: campo("aparatos"), min: 0, max: 10 } };
    var wa = caja.querySelector("[data-calc-wa]");
    var fuente = caja.querySelector("[data-calc-fuente]");
    if (fuente && B.fuenteUrl) fuente.href = B.fuenteUrl;
    function pos(v) { return Math.min(100, Math.max(0, (v - min) / (max - min) * 100)); }
    function valor(n) { return parseInt(cuentas[n].el.textContent, 10) || 0; }

    function calcular() {
      var l = Math.max(0, numeroDe(largo.value)), a = Math.max(0, numeroDe(ancho.value));
      var area = Math.round(l * a * 10) / 10;
      var personas = valor("personas"), aparatos = valor("aparatos");
      var base = area * porM2;
      var extraPersonas = Math.max(0, personas - (B.personasBase || 2)) * (B.porPersona || 600);
      var extraAparatos = aparatos * (B.porAparato || 400);
      var extraSol = sol.checked ? base * (B.sol || 0.1) : 0;
      var extraTecho = techo.checked ? base * (B.techo || 0.1) : 0;
      var total = Math.round((base + extraPersonas + extraAparatos + extraSol + extraTecho) / 100) * 100;
      var equipo = 0;
      for (var i = 0; i < tamanos.length; i++) if (tamanos[i] >= total) { equipo = tamanos[i]; break; }
      var areaTxt = String(area).replace(".", ",");
      salida("area", areaTxt); salida("area2", areaTxt);
      salida("base", miles(base));
      salida("personasBtu", "+" + miles(extraPersonas)); fila("personas", extraPersonas > 0);
      salida("aparatosBtu", "+" + miles(extraAparatos)); fila("aparatos", extraAparatos > 0);
      salida("solBtu", "+" + miles(extraSol)); fila("sol", extraSol > 0);
      salida("techoBtu", "+" + miles(extraTecho)); fila("techo", extraTecho > 0);
      salida("total", miles(total) + " BTU");
      var explicacion;
      if (!area) { salida("equipo", "—"); explicacion = "Escribe el largo y el ancho del cuarto."; }
      else if (equipo) {
        salida("equipo", miles(equipo));
        explicacion = "Tu cuarto pide unos " + miles(total) + " BTU: el equipo comercial que lo cubre es de " + miles(equipo) + ".";
      } else {
        salida("equipo", miles(max) + "+");
        explicacion = "Unos " + miles(total) + " BTU: es un espacio grande, puede necesitar más de un equipo o un sistema mayor. Pide una visita.";
      }
      salida("explicacion", explicacion);
      var barra = caja.querySelector("[data-calc-barra]"), aguja = caja.querySelector("[data-calc-aguja]");
      if (barra) barra.style.setProperty("--x", pos(equipo || max).toFixed(1) + "%");
      if (aguja) aguja.style.setProperty("--x", pos(total).toFixed(1) + "%");
      L.todos("[data-btu]", caja).forEach(function (li) { li.classList.toggle("activa", +li.getAttribute("data-btu") === equipo); });
      L.todos("[data-calc-menos]", caja).forEach(function (b) { var n = b.getAttribute("data-calc-menos"); b.disabled = valor(n) <= cuentas[n].min; });
      L.todos("[data-calc-mas]", caja).forEach(function (b) { var n = b.getAttribute("data-calc-mas"); b.disabled = valor(n) >= cuentas[n].max; });
      refrescarWhatsapp(wa, [
        "Hola, " + (S.marca || "") + ". Usé la calculadora de BTU de la web:",
        "Cuarto: " + String(l).replace(".", ",") + " × " + String(a).replace(".", ",") + " m (" + areaTxt + " m²)",
        "Personas: " + personas + " · Aparatos que dan calor: " + aparatos,
        "Sol fuerte o ventanas grandes: " + (sol.checked ? "sí" : "no") + " · Techo alto: " + (techo.checked ? "sí" : "no"),
        "Estimado: " + miles(total) + " BTU → equipo de " + (equipo ? miles(equipo) : "más de " + miles(max)) + " BTU",
        "Quiero cotizar el equipo y la instalación."
      ].join("\n"));
    }
    function mover(n, paso) {
      var c = cuentas[n];
      c.el.textContent = Math.min(c.max, Math.max(c.min, valor(n) + paso));
      calcular();
    }
    L.todos("[data-calc-menos]", caja).forEach(function (b) { b.addEventListener("click", function () { mover(b.getAttribute("data-calc-menos"), -1); }); });
    L.todos("[data-calc-mas]", caja).forEach(function (b) { b.addEventListener("click", function () { mover(b.getAttribute("data-calc-mas"), 1); }); });
    [largo, ancho, sol, techo].forEach(function (el) { el.addEventListener("input", calcular); el.addEventListener("change", calcular); });
    caja.querySelector("[data-calc-form]").addEventListener("submit", function (e) { e.preventDefault(); });
    calcular();
  }

  /** Diagnóstico por síntomas: pestañas accesibles (flechas, Inicio, Fin). Sin JS se ven todos los paneles. */
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
        // en móvil el panel queda debajo de los botones: se acerca a la vista
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
      refrescarWhatsapp(wa, cubre(m) ? "Hola, " + marca + ". Estoy en " + m + " y necesito un técnico para mi aire acondicionado."
                                     : "Hola, " + marca + ". Estoy en " + m + ". ¿Llegan hasta allá?");
      if (select && !desdeFormulario) select.value = m;
    }
    botones.forEach(function (b) { b.addEventListener("click", function () { poner(b.getAttribute("data-municipio")); }); });
    // estado inicial: Medellín marcado, sin tocar el formulario (que el visitante elija su municipio)
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
    L.seguro(leyenda, "leyenda");
    L.seguro(calculadora, "calculadora");
    L.seguro(diagnostico, "diagnostico");
    L.seguro(cobertura, "cobertura");
    L.seguro(barraMovil, "barraMovil");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
