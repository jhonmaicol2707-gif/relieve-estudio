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
                  matricula: "matrícula profesional", instagram: "Instagram" };

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

  // ================================================================ PROPIO DE NÁCAR

  /** 490700 → "$490.700" (miles con punto, como se escribe en Colombia) */
  function pesos(n) { return "$" + miles(n); }
  function miles(n) { return Math.round(Math.max(0, n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  /** Rango: 85000–120000 → "$85.000 – $120.000"; sin tope → "desde $85.000" */
  function rango(a, b) { return b && b !== a ? pesos(a) + " – " + pesos(b) : "desde " + pesos(a); }
  /** 150 → "2 h 30 min" */
  function duracion(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + " h" : "") + (h && m ? " " : "") + (m ? m + " min" : "");
  }
  function servicios() { return S.servicios || []; }
  function porId(id) { return servicios().filter(function (s) { return s.id === id; })[0]; }

  /** Tabla de servicios desde datos.js: duración, rango de referencia, fuente (con enlace), precio propio o
   *  "Por confirmar" y botón "Añadir" que marca ese servicio en el reservador. El HTML trae un resumen sin
   *  botones para quien no tiene JavaScript. */
  function precios() {
    var cuerpo = document.querySelector("[data-precios]"), F = S.fuentes || {};
    if (!cuerpo || !servicios().length) return;
    cuerpo.textContent = "";
    servicios().forEach(function (p) {
      var fila = document.createElement("tr");
      fila.setAttribute("data-grupo", p.grupo || "");
      var th = document.createElement("th"); th.scope = "row"; th.textContent = p.servicio;
      if (p.min) { var sm = document.createElement("small"); sm.textContent = "≈ " + duracion(p.min); th.appendChild(sm); }
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
      var b = document.createElement("button");
      b.type = "button"; b.className = "pedir";
      b.setAttribute("data-anadir", p.id); b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", "Añadir " + p.servicio.charAt(0).toLowerCase() + p.servicio.slice(1) + " a mi cita");
      b.textContent = "Añadir a mi cita";
      accion.appendChild(b);
      [th, ref, fu, propio, accion].forEach(function (c) { fila.appendChild(c); });
      cuerpo.appendChild(fila);
    });
    var nota = document.querySelector("[data-precios-nota]");
    if (nota && S.preciosNota) nota.textContent = S.preciosNota;
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

  /** Reservador: servicios (desde datos.js, por grupos) + día (próximos días hábiles) + franja → resumen con
   *  duración y rango sumados, y el botón de WhatsApp con el mensaje escrito. Sin JS se ven unas opciones
   *  básicas y el botón lleva al contacto. */
  function reservador() {
    var form = document.querySelector("[data-reserva]");
    if (!form) return;
    var R = S.reserva || {}, marca = S.marca || "";
    var cajaServ = form.querySelector("[data-reserva-servicios]"), cajaDias = form.querySelector("[data-reserva-dias]");
    var cajaFranjas = form.querySelector("[data-reserva-franjas]"), lista = form.querySelector("[data-reserva-lista]");
    var wa = form.querySelector("[data-reserva-wa]"), nombre = form.querySelector("#r-nombre");
    var ejemplo = form.querySelector("[data-reserva-ejemplo]");
    if (ejemplo) ejemplo.hidden = !!R.confirmada;
    function salida(n, v) { var el = form.querySelector("[data-reserva-out='" + n + "']"); if (el) el.textContent = v; }

    // 1. Servicios por grupo
    if (cajaServ && servicios().length) {
      cajaServ.textContent = "";
      cajaServ.className = "";
      var grupos = [];
      servicios().forEach(function (s) { if (grupos.indexOf(s.grupo) < 0) grupos.push(s.grupo); });
      var NOMBRES_GRUPO = { "Mirada": "Cejas, pestañas y piel" };
      grupos.forEach(function (g) {
        var bloque = document.createElement("div"); bloque.className = "reserva__grupo"; bloque.setAttribute("data-grupo", g);
        var t = document.createElement("p"); t.className = "reserva__grupo-titulo"; t.textContent = NOMBRES_GRUPO[g] || g;
        var opciones = document.createElement("div"); opciones.className = "reserva__opciones";
        servicios().filter(function (s) { return s.grupo === g; }).forEach(function (s) {
          var l = document.createElement("label"); l.className = "opcion";
          var i = document.createElement("input"); i.type = "checkbox"; i.name = "servicio"; i.value = s.id;
          var sp = document.createElement("span"); sp.textContent = s.servicio;
          var sm = document.createElement("small"); sm.textContent = "≈ " + duracion(s.min);
          sp.appendChild(sm); l.appendChild(i); l.appendChild(sp); opciones.appendChild(l);
        });
        bloque.appendChild(t); bloque.appendChild(opciones); cajaServ.appendChild(bloque);
      });
    }

    // 2. Días: los próximos `adelante` días que el estudio abre (desde mañana)
    var DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    var DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    var MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    if (cajaDias) {
      cajaDias.textContent = "";
      var abre = R.dias || [1, 2, 3, 4, 5, 6], hoy = new Date();
      for (var k = 1; k <= (R.adelante || 14); k++) {
        var d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + k);
        if (abre.indexOf(d.getDay()) < 0) continue;
        var largo = DIAS_LARGOS[d.getDay()] + " " + d.getDate() + " de " + MESES_LARGOS[d.getMonth()];
        var l = document.createElement("label"); l.className = "dia";
        var i = document.createElement("input"); i.type = "radio"; i.name = "dia"; i.value = largo;
        i.setAttribute("aria-label", largo);
        var s1 = document.createElement("small"); s1.textContent = DIAS[d.getDay()];
        var b = document.createElement("b"); b.textContent = d.getDate();
        var s2 = document.createElement("span"); s2.textContent = MESES[d.getMonth()];
        [i, s1, b, s2].forEach(function (x) { l.appendChild(x); });
        l.querySelectorAll("small, b, span").forEach(function (x) { x.setAttribute("aria-hidden", "true"); });
        cajaDias.appendChild(l);
      }
    }

    // 3. Franjas
    if (cajaFranjas && (R.franjas || []).length) {
      cajaFranjas.textContent = "";
      R.franjas.forEach(function (f) {
        var l = document.createElement("label"); l.className = "opcion opcion--franja";
        var i = document.createElement("input"); i.type = "radio"; i.name = "franja"; i.value = f.nombre + " (" + f.ayuda + ")";
        var sp = document.createElement("span"); sp.textContent = f.nombre;
        var sm = document.createElement("small"); sm.textContent = f.ayuda;
        l.appendChild(i); l.appendChild(sp); l.appendChild(sm); cajaFranjas.appendChild(l);
      });
    }

    function elegido(name) { var el = form.querySelector("input[name='" + name + "']:checked"); return el ? el.value : ""; }
    function marcados() {
      return L.todos("input[name='servicio']:checked", form).map(function (i) { return porId(i.value); }).filter(Boolean);
    }

    function calcular() {
      var sel = marcados(), dia = elegido("dia"), franja = elegido("franja");
      var min = 0, desde = 0, hasta = 0, abierto = false;
      lista.textContent = "";
      if (!sel.length) {
        var v = document.createElement("li"); v.className = "ticket__vacio"; v.textContent = "Aún no has elegido servicios."; lista.appendChild(v);
      }
      sel.forEach(function (s) {
        min += s.min || 0; desde += s.desde || 0;
        if (s.hasta) hasta += s.hasta; else { hasta += s.desde || 0; abierto = true; }
        var li = document.createElement("li"), a = document.createElement("span"), b = document.createElement("span");
        a.textContent = s.servicio; b.textContent = "≈ " + duracion(s.min);
        li.appendChild(a); li.appendChild(b); lista.appendChild(li);
      });
      salida("dia", dia ? dia.charAt(0).toUpperCase() + dia.slice(1) : "Sin elegir");
      salida("franja", franja || "Sin elegir");
      salida("duracion", sel.length ? "≈ " + duracion(min) : "—");
      var textoRango = sel.length ? pesos(desde) + " – " + pesos(hasta) + (abierto ? " o más" : "") : "—";
      salida("rango", textoRango);
      var faltan = [];
      if (!sel.length) faltan.push("un servicio");
      if (!dia) faltan.push("el día");
      if (!franja) faltan.push("la franja");
      salida("falta", faltan.length ? "Te falta elegir " + faltan.join(", ").replace(/, ([^,]*)$/, " y $1") + "." : "");
      // botones "Añadir a mi cita" de la tabla
      L.todos("[data-anadir]").forEach(function (bt) {
        var si = sel.some(function (s) { return s.id === bt.getAttribute("data-anadir"); });
        bt.setAttribute("aria-pressed", si ? "true" : "false");
        bt.textContent = si ? "En mi cita ✓" : "Añadir a mi cita";
      });
      if (!wa || !contacto.whatsapp) return;
      var n = nombre && nombre.value.trim();
      var lineas = ["Hola, " + marca + "." + (n ? " Soy " + n + "." : "") + " Quiero reservar una cita:"];
      if (sel.length) sel.forEach(function (s) { lineas.push("• " + s.servicio); });
      else lineas.push("• (aún no sé qué servicio, ¿me orientan?)");
      lineas.push("Día: " + (dia || "el que tengan libre"));
      lineas.push("Franja: " + (franja || "cualquiera"));
      if (sel.length) lineas.push("Duración aprox.: " + duracion(min) + " · Referencia: " + textoRango);
      lineas.push("¿Me confirman la hora exacta y el precio?");
      wa.href = urlWhatsapp(lineas.join("\n"));
    }

    form.addEventListener("change", calcular);
    if (nombre) nombre.addEventListener("input", calcular);
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    // marcar desde fuera: tabla de precios ("Añadir a mi cita") y enlaces de los mundos (data-reservar-grupo)
    function marcar(id, valor) {
      var i = form.querySelector("input[name='servicio'][value='" + id + "']");
      if (i) { i.checked = valor; calcular(); }
    }
    document.addEventListener("click", function (e) {
      var bt = e.target.closest && e.target.closest("[data-anadir]");
      if (bt) {
        var id = bt.getAttribute("data-anadir");
        marcar(id, bt.getAttribute("aria-pressed") !== "true");
        return;
      }
      var enlace = e.target.closest && e.target.closest("[data-reservar-grupo]");
      if (enlace) {
        var bloque = form.querySelector(".reserva__grupo[data-grupo='" + enlace.getAttribute("data-reservar-grupo") + "']");
        if (bloque) setTimeout(function () {
          var primero = bloque.querySelector("input");
          if (primero) primero.focus({ preventScroll: true });
          bloque.classList.add("reserva__grupo--foco");
          setTimeout(function () { bloque.classList.remove("reserva__grupo--foco"); }, 1600);
        }, L.reducido ? 0 : 700);
      }
    });
    calcular();
  }

  /** Barra fija del móvil: aparece al salir de la portada y se esconde en el reservador y el contacto
   *  (allí ya están los botones grandes). */
  function barraMovil() {
    var ocultar = ["reservar", "contacto"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var zona = document.getElementById("inicio"), pendiente = false;
    function mirar() {
      pendiente = false;
      var vh = window.innerHeight;
      var trasPortada = zona ? zona.getBoundingClientRect().bottom < vh * 0.9 : window.pageYOffset > vh * 0.75;
      var dentro = ocultar.some(function (s) { var r = s.getBoundingClientRect(); return r.top < vh * 0.85 && r.bottom > vh * 0.3; });
      var pasadoCierre = ocultar.length && ocultar[ocultar.length - 1].getBoundingClientRect().top < vh * 0.85;
      raiz.classList.toggle("barra-visible", trasPortada && !dentro && !pasadoCierre && !raiz.classList.contains("menu-abierto"));
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(mirar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    mirar();
  }

  function iniciar() {
    L.seguro(precios, "precios");
    L.seguro(reservador, "reservador");      // antes de enlaces(): enlaces() pone el número; calcular() escribe el mensaje
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formulario, "formulario");
    L.seguro(compra, "compra");
    L.seguro(anio, "anio");
    L.seguro(filtros, "filtros");
    L.seguro(function () {                  // tras enlaces(): repone el mensaje completo del reservador
      var f = document.querySelector("[data-reserva]");
      if (f) f.dispatchEvent(new Event("change"));
    }, "reservaMensaje");
    L.seguro(barraMovil, "barraMovil");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
