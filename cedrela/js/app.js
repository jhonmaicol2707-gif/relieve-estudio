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
                  horario: "horario", mapa: "mapa", sector: "sector", salaVentas: "sala de ventas",
                  constructora: "constructora", fiduciaria: "fiduciaria", licencia: "licencia", radicado: "radicado" };

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

  // ================================================================ PROPIO DE CEDRELA

  /** 481680000 → "$481.680.000" (miles con punto, como se escribe en Colombia) */
  function pesos(n) { return "$" + Math.round(Math.max(0, n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  /** 481680000 → "$481,7 millones" */
  function millones(n) { return "$" + (n / 1e6).toFixed(1).replace(".", ",") + " millones"; }
  function numeroDe(texto) { return parseFloat(String(texto || "").replace(/[^\d]/g, "")) || 0; }
  function tipologia(id) { return (S.tipologias || []).filter(function (t) { return t.id === id; })[0]; }
  /** Precio de una tipología: el real de datos.js o, si falta, la estimación con el m² de referencia. */
  function precioDe(t) {
    if (!t) return { valor: 0, real: false };
    if (t.precio) return { valor: numeroDe(t.precio), real: true };
    return { valor: t.area * ((S.precios || {}).referenciaM2 || 0), real: false };
  }
  /** Repone el href de un botón de WhatsApp después de cambiar su mensaje o su data-producto. */
  function refrescarWhatsapp(el, texto) {
    if (!el || !contacto.whatsapp) return;
    el.href = urlWhatsapp(texto != null ? texto : mensajeDe(el));
  }

  /** Tabla del precio del m² desde datos.js (el HTML trae las mismas filas para quien no tiene JavaScript). */
  function precios() {
    var cuerpo = document.querySelector("[data-precios]"), P = S.precios || {};
    if (!cuerpo || !(P.lista || []).length) return;
    cuerpo.textContent = "";
    P.lista.forEach(function (p) {
      var fila = document.createElement("tr");
      var th = document.createElement("th"); th.scope = "row"; th.textContent = p.lugar;
      var a = document.createElement("td"); a.textContent = p.e34 || "—";
      var b = document.createElement("td"); b.textContent = p.e56 || "—";
      fila.appendChild(th); fila.appendChild(a); fila.appendChild(b);
      cuerpo.appendChild(fila);
    });
    var fuente = document.querySelector("[data-precios-fuente]");
    if (fuente && P.fuente) { fuente.textContent = P.fuente; if (P.fuenteUrl) fuente.href = P.fuenteUrl; }
  }

  /** Leyenda de la portada: marca la figura que dibujan las partículas (evento l3d-figura del lienzo). */
  function leyenda() {
    var lienzo = document.querySelector(".zona .l3d-lienzo"), lista = document.querySelector("[data-leyenda]");
    if (!lienzo || !lista) return;
    function marcar(i) { L.todos("[data-figura]", lista).forEach(function (li) { li.classList.toggle("activa", +li.getAttribute("data-figura") === i); }); }
    lienzo.addEventListener("l3d-figura", function (e) { marcar(e.detail ? e.detail.indice : 0); });
    marcar(0);
  }

  /** Selector de tipologías: pestañas accesibles (flechas, Inicio, Fin) que cambian el plano 3D y la ficha. */
  var ESCALAS = { a: 0.86, b: 0.93, c: 1 };
  var avisarSimulador = null;   // lo pone simulador(): "Simular esta tipología" la lleva al simulador
  function selector() {
    var caja = document.querySelector("[data-selector]");
    if (!caja) return;
    var pestanas = L.todos("[role='tab']", caja), panel = caja.querySelector("[role='tabpanel']");
    var escena = caja.querySelector("[data-plano-escena]");
    var actual = "a", cambio = 0;
    function poner(id, conFoco) {
      var t = tipologia(id);
      if (!t) return;
      actual = id;
      pestanas.forEach(function (p) {
        var si = p.getAttribute("data-tipo") === id;
        p.setAttribute("aria-selected", si ? "true" : "false");
        p.tabIndex = si ? 0 : -1;
        if (si) { panel.setAttribute("aria-labelledby", p.id); if (conFoco) p.focus(); }
      });
      // el plano se funde, cambia de planta y vuelve (sin animación si se pidió menos movimiento)
      var mio = ++cambio;
      function cambiarPlano() {
        if (mio !== cambio) return;
        L.todos("[data-plano='suelo']", caja).forEach(function (u) { u.setAttribute("href", "#suelo-" + id); });
        L.todos("[data-plano='muros']", caja).forEach(function (u) { u.setAttribute("href", "#muros-" + id); });
        escena.style.setProperty("--escala", ESCALAS[id] || 1);
        escena.classList.remove("cambiando");
      }
      if (L.reducido) cambiarPlano();
      else { escena.classList.add("cambiando"); setTimeout(cambiarPlano, 300); }

      var p = precioDe(t);
      function texto(sel, valor) { var el = caja.querySelector(sel); if (el) el.textContent = valor; }
      texto("[data-plano-nombre]", t.nombre);
      texto("[data-ficha-nombre]", t.nombre);
      texto("[data-ficha-area]", t.area);
      texto("[data-ficha-alcobas]", t.alcobas);
      texto("[data-ficha-banos]", t.banos);
      var extras = caja.querySelector("[data-ficha-extras]");
      if (extras) {
        extras.textContent = "";
        (t.extras || []).forEach(function (x) { var li = document.createElement("li"); li.textContent = x; extras.appendChild(li); });
      }
      var precio = caja.querySelector("[data-ficha-precio]");
      if (precio) {
        precio.textContent = "";
        if (p.real) precio.textContent = pesos(p.valor);
        else { var pe = document.createElement("span"); pe.className = "pendiente"; pe.textContent = "Por confirmar"; precio.appendChild(pe); }
      }
      var est = caja.querySelector("[data-ficha-estimacion]");
      if (est) {
        est.hidden = p.real;
        est.textContent = "Con el m² de referencia de " + ((S.precios || {}).referenciaTexto || "Medellín") + ": ≈ " + millones(p.valor) + ". No es el precio del proyecto.";
      }
      var simular = caja.querySelector("[data-ficha-simular]");
      if (simular) simular.firstChild.textContent = "Simular el " + t.nombre + " ";
      var wa = caja.querySelector("[data-ficha-wa]");
      if (wa) { wa.setAttribute("data-producto", t.nombre + " (" + t.area + " m²)"); refrescarWhatsapp(wa); }
    }
    pestanas.forEach(function (p, i) {
      p.addEventListener("click", function () { poner(p.getAttribute("data-tipo")); });
      p.addEventListener("keydown", function (e) {
        var n = pestanas.length, j = null;
        if (e.key === "ArrowRight") j = (i + 1) % n;
        else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = n - 1;
        if (j === null) return;
        e.preventDefault();
        poner(pestanas[j].getAttribute("data-tipo"), true);
      });
    });
    var simular = caja.querySelector("[data-ficha-simular]");
    if (simular) simular.addEventListener("click", function () { if (avisarSimulador) avisarSimulador(actual); });
    poner("a");
  }

  /** Simulador: separación, cuota inicial a cuotas durante la obra y cuota del crédito (sistema francés,
   *  tasa efectiva anual → mensual). Orientativo: sin seguros ni gastos. */
  function simulador() {
    var caja = document.querySelector("[data-simulador]");
    if (!caja) return;
    var C = S.simulador || {};
    function campo(n) { return caja.querySelector("[data-sim='" + n + "']"); }
    function salida(n, v) { L.todos("[data-sim-out='" + n + "']", caja).forEach(function (el) { el.textContent = v; }); }
    var tipo = campo("tipo"), precio = campo("precio"), separacion = campo("separacion"), inicial = campo("inicial"),
        meses = campo("meses"), plazo = campo("plazo"), tasa = campo("tasa");
    var origen = caja.querySelector("[data-sim-origen]"), wa = caja.querySelector("[data-sim-wa]");

    // valores de partida desde datos.js
    if (C.separacion != null) separacion.value = pesos(C.separacion).slice(1);
    if (C.cuotaInicial) inicial.value = String(C.cuotaInicial);
    if (C.meses) meses.value = C.meses;
    if (C.plazo) plazo.value = String(C.plazo);
    if (C.tasa) tasa.value = C.tasa;
    var nota = caja.querySelector("[data-sim-tasa-nota]"), fuente = caja.querySelector("[data-sim-tasa-fuente]");
    if (nota && C.tasaNota) nota.textContent = C.tasaNota;
    if (fuente) { if (C.tasaFuenteUrl) fuente.href = C.tasaFuenteUrl; else fuente.hidden = true; }

    function ponerTipo(id) {
      var t = tipologia(id);
      if (!t) return;
      tipo.value = id;
      var p = precioDe(t);
      precio.value = pesos(p.valor).slice(1);
      if (origen) origen.textContent = p.real ? "Precio de lista del " + t.nombre + "." :
        "Estimación con el m² de referencia (" + ((S.precios || {}).referenciaTexto || "Medellín") + "). Escribe el precio real si lo tienes.";
      calcular();
    }

    function calcular() {
      var P = numeroDe(precio.value), sep = numeroDe(separacion.value);
      var pct = Math.min(100, Math.max(0, parseFloat(inicial.value) || 0));
      var m = Math.max(1, Math.round(parseFloat(meses.value) || 1));
      var anos = Math.max(1, parseFloat(plazo.value) || 20), n = anos * 12;
      var ea = Math.max(0, parseFloat(String(tasa.value).replace(",", ".")) || 0) / 100;
      var ci = P * pct / 100, credito = P - ci;
      var mensualObra = Math.max(0, ci - sep) / m;
      var i = Math.pow(1 + ea, 1 / 12) - 1;
      var cuota = credito <= 0 ? 0 : (i > 0 ? credito * i / (1 - Math.pow(1 + i, -n)) : credito / n);
      salida("cuota", pesos(cuota));
      salida("plazo", anos + " años");
      salida("separacion", pesos(sep));
      salida("inicialPct", pct + " %");
      salida("inicial", pesos(ci));
      salida("mensualObra", pesos(mensualObra));
      salida("meses", m);
      salida("creditoPct", (100 - pct) + " %");
      salida("credito", pesos(credito));
      var bi = caja.querySelector("[data-sim-barra='inicial']"), bc = caja.querySelector("[data-sim-barra='credito']");
      if (bi) bi.style.setProperty("--w", pct + "%");
      if (bc) bc.style.setProperty("--w", (100 - pct) + "%");
      var t = tipologia(tipo.value);
      var lineas = [
        "Hola, Cedrela. Hice esta simulación en la web:",
        "Tipología: " + (t ? t.nombre + " (" + t.area + " m²)" : "otro precio"),
        "Precio: " + pesos(P),
        "Separación: " + pesos(sep),
        "Cuota inicial (" + pct + " %): " + pesos(ci) + " en " + m + " meses (" + pesos(mensualObra) + " al mes)",
        "Crédito o leasing (" + (100 - pct) + " %): " + pesos(credito) + " a " + anos + " años, tasa " + String(ea * 100).replace(".", ",") + " % E.A.",
        "Cuota estimada: " + pesos(cuota) + " al mes",
        "Quiero confirmar precio, disponibilidad y condiciones."
      ];
      refrescarWhatsapp(wa, lineas.join("\n"));
    }

    // los importes se escriben con puntos de miles al salir del campo (mientras se escribe, no se mueve el cursor)
    L.todos("[data-moneda]", caja).forEach(function (el) {
      el.addEventListener("blur", function () { el.value = pesos(numeroDe(el.value)).slice(1); });
    });
    precio.addEventListener("input", function () {
      tipo.value = "";
      if (origen) origen.textContent = "Precio escrito por ti.";
    });
    tipo.addEventListener("change", function () { if (tipo.value) ponerTipo(tipo.value); else calcular(); });
    [precio, separacion, inicial, meses, plazo, tasa].forEach(function (el) {
      el.addEventListener("input", calcular); el.addEventListener("change", calcular);
    });
    caja.querySelector("[data-sim-form]").addEventListener("submit", function (e) { e.preventDefault(); });
    avisarSimulador = ponerTipo;
    ponerTipo("a");
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
    L.seguro(precios, "precios");
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formulario, "formulario");
    L.seguro(compra, "compra");
    L.seguro(anio, "anio");
    L.seguro(leyenda, "leyenda");
    L.seguro(simulador, "simulador");
    L.seguro(selector, "selector");
    L.seguro(barraMovil, "barraMovil");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
