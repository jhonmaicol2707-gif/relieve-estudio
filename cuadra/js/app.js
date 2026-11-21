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
 *   <form data-formulario data-whatsapp-saludo="Hola, …">   <span data-anio>
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
                  proveedor: "proveedor DIAN", nit: "NIT",
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


  /** Año del pie siempre al día: <span data-anio></span> */
  function anio() {
    L.todos("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  // ================================================================ PROPIO DE CUADRA

  /** 163900 → "$163.900" (miles con punto, como se escribe en Colombia) */
  function pesos(n) { return "$" + Math.round(Math.max(0, n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function rango(a, b) { return b && b !== a ? pesos(a) + " – " + pesos(b) : "desde " + pesos(a); }
  function planes_() { return S.planes || []; }
  function planPorId(id) { return planes_().filter(function (p) { return p.id === id; })[0]; }
  function nuevo(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto != null) el.textContent = texto;
    return el;
  }

  /** Planes desde datos.js: para quién, rango de referencia del mercado con sus fuentes (enlaces), qué incluye,
   *  precio de Cuadra o "Por confirmar" y botón que lleva a la agenda con ese plan ya sugerido.
   *  El HTML trae un resumen para quien no tiene JavaScript. */
  function planes() {
    var caja = document.querySelector("[data-planes]"), F = S.fuentes || {};
    if (!caja || !planes_().length) return;
    caja.textContent = "";
    planes_().forEach(function (p) {
      var art = nuevo("article", "plan" + (p.destacado ? " plan--destacado" : ""));
      art.setAttribute("data-plan", p.id);
      if (p.destacado) art.appendChild(nuevo("p", "plan__sello", "Recomendado para pymes"));
      art.appendChild(nuevo("h3", "", p.nombre));
      art.appendChild(nuevo("p", "plan__para", p.para));
      var precio = nuevo("div", "plan__precio");
      precio.appendChild(nuevo("small", "", "Precio " + (S.marca || "")));
      if (p.propio) {
        var b = nuevo("b", "", /^\d+$/.test(String(p.propio)) ? pesos(+p.propio) : String(p.propio));
        precio.appendChild(b);
        precio.appendChild(nuevo("span", "", " /mes"));
      } else precio.appendChild(nuevo("b", "pendiente", "Por confirmar"));
      art.appendChild(precio);
      var ref = nuevo("div", "plan__ref");
      ref.appendChild(nuevo("small", "", "Mercado colombiano"));
      ref.appendChild(nuevo("b", "", rango(p.desde, p.hasta)));
      ref.appendChild(nuevo("span", "", " /mes"));
      var fu = nuevo("p", "plan__fuente");
      fu.appendChild(document.createTextNode(p.refs + ". Fuente: "));
      (p.fuentes || []).forEach(function (k, i) {
        var f = F[k];
        if (!f) return;
        if (i) fu.appendChild(document.createTextNode(" · "));
        var a = nuevo("a", "", f.nombre); a.href = f.url; a.target = "_blank"; a.rel = "noopener";
        fu.appendChild(a);
      });
      ref.appendChild(fu);
      art.appendChild(ref);
      var lista = nuevo("ul", "plan__incluye"); lista.setAttribute("role", "list");
      (p.incluye || []).forEach(function (t) { lista.appendChild(nuevo("li", "", t)); });
      art.appendChild(lista);
      var boton = nuevo("a", "boton " + (p.destacado ? "boton--principal" : "boton--fantasma") + " boton--ancho", "Agendar demo de este plan");
      boton.href = "#demo"; boton.setAttribute("data-elegir-plan", p.id);
      boton.setAttribute("aria-label", "Agendar demo del plan " + p.nombre);
      art.appendChild(boton);
      caja.appendChild(art);
    });
    var nota = document.querySelector("[data-planes-nota]");
    if (nota && S.planesNota) nota.textContent = S.planesNota;
  }

  /** Pestañas accesibles (patrón WAI-ARIA): <div role="tablist" data-pestanas> con <button role="tab" aria-controls>.
   *  Clic o flechas ← → / Inicio / Fin. Sin JS se ve el primer panel y el resto queda oculto (se ven al tocar). */
  function pestanas() {
    L.todos("[data-pestanas]").forEach(function (lista) {
      var tabs = L.todos("[role='tab']", lista);
      function activar(tab, enfocar) {
        tabs.forEach(function (t) {
          var si = t === tab, panel = document.getElementById(t.getAttribute("aria-controls"));
          t.setAttribute("aria-selected", si ? "true" : "false");
          t.tabIndex = si ? 0 : -1;
          if (panel) {
            panel.hidden = !si;
            if (si) { panel.classList.remove("panel-entra"); void panel.offsetWidth; panel.classList.add("panel-entra"); }
          }
        });
        if (enfocar) tab.focus();
        lista.style.setProperty("--activa", tabs.indexOf(tab));
        lista.dispatchEvent(new CustomEvent("pestana", { detail: tab }));
      }
      lista._activar = activar;
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { activar(t, false); });
        t.addEventListener("keydown", function (e) {
          var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (j == null) return;
          e.preventDefault();
          activar(tabs[(j + tabs.length) % tabs.length], true);
        });
      });
      lista.style.setProperty("--n", tabs.length);
      lista.style.setProperty("--activa", 0);
    });
  }

  /** Agenda de demos: perfil (empresa o contador) → negocio y volumen de facturas (sugiere un plan) o número de
   *  clientes → día (próximos días hábiles) y franja → resumen y WhatsApp con la solicitud escrita. */
  function agenda() {
    var form = document.querySelector("[data-demo]");
    if (!form) return;
    var D = S.demo || {}, marca = S.marca || "";
    var wa = form.querySelector("[data-demo-wa]"), nombre = form.querySelector("#d-nombre");
    var ejemplo = form.querySelector("[data-demo-ejemplo]");
    if (ejemplo) ejemplo.hidden = !!D.confirmada;
    function salida(n, v) { var el = form.querySelector("[data-demo-out='" + n + "']"); if (el) el.textContent = v; }

    function opciones(caja, name, items, marcado) {
      if (!caja || !items.length) return;
      caja.textContent = "";
      items.forEach(function (it, k) {
        var l = nuevo("label", "opcion"), i = document.createElement("input");
        i.type = "radio"; i.name = name; i.value = it.valor; i.checked = it.valor === marcado || (!marcado && k === 0);
        l.appendChild(i); l.appendChild(nuevo("span", "", it.texto)); caja.appendChild(l);
      });
    }

    // Negocios (select), volumen (con su plan) y clientes del contador
    var sel = form.querySelector("[data-demo-negocios]");
    if (sel && (D.negocios || []).length) {
      sel.textContent = "";
      D.negocios.forEach(function (n) { sel.appendChild(nuevo("option", "", n)); });
    }
    opciones(form.querySelector("[data-demo-volumen]"), "volumen",
      (D.volumen || []).map(function (v) { return { valor: v.id, texto: v.nombre }; }), "v2");
    opciones(form.querySelector("[data-demo-clientes]"), "clientes",
      (D.clientesContador || []).map(function (c) { return { valor: c, texto: c }; }));

    // Días: los próximos `adelante` días hábiles (desde mañana)
    var DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    var DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    var MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    var cajaDias = form.querySelector("[data-demo-dias]");
    if (cajaDias) {
      cajaDias.textContent = "";
      var abre = D.dias || [1, 2, 3, 4, 5], hoy = new Date();
      for (var k = 1; k <= (D.adelante || 10); k++) {
        var d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + k);
        if (abre.indexOf(d.getDay()) < 0) continue;
        var largo = DIAS_LARGOS[d.getDay()] + " " + d.getDate() + " de " + MESES_LARGOS[d.getMonth()];
        var l = nuevo("label", "dia"), i = document.createElement("input");
        i.type = "radio"; i.name = "dia"; i.value = largo; i.setAttribute("aria-label", largo);
        l.appendChild(i);
        [nuevo("small", "", DIAS[d.getDay()]), nuevo("b", "", d.getDate()), nuevo("span", "", MESES[d.getMonth()])].forEach(function (x) {
          x.setAttribute("aria-hidden", "true"); l.appendChild(x);
        });
        cajaDias.appendChild(l);
      }
    }
    var cajaFranjas = form.querySelector("[data-demo-franjas]");
    if (cajaFranjas && (D.franjas || []).length) {
      cajaFranjas.textContent = "";
      D.franjas.forEach(function (f) {
        var l = nuevo("label", "opcion opcion--franja"), i = document.createElement("input");
        i.type = "radio"; i.name = "franja"; i.value = f.nombre + " (" + f.ayuda + ")";
        l.appendChild(i); l.appendChild(nuevo("span", "", f.nombre)); l.appendChild(nuevo("small", "", f.ayuda));
        cajaFranjas.appendChild(l);
      });
    }

    function elegido(name) { var el = form.querySelector("input[name='" + name + "']:checked"); return el ? el.value : ""; }
    function volumenPorId(id) { return (D.volumen || []).filter(function (v) { return v.id === id; })[0]; }

    function calcular() {
      var perfil = elegido("perfil") || "Empresa", empresa = perfil === "Empresa";
      L.todos("[data-solo-perfil]", form).forEach(function (b) { b.hidden = b.getAttribute("data-solo-perfil") !== perfil; });
      var dia = elegido("dia"), franja = elegido("franja");
      var vol = volumenPorId(elegido("volumen")), clientes = elegido("clientes");
      var negocio = sel ? sel.value : "";
      var plan = empresa && vol ? planPorId(vol.plan) : null;

      salida("perfil", empresa ? "Empresa" + (negocio ? " · " + negocio : "") : "Contador");
      salida("detalle-rotulo", empresa ? "Facturas al mes" : "Clientes");
      salida("detalle", empresa ? (vol ? vol.nombre : "—") : (clientes || "—"));
      salida("dia", dia ? dia.charAt(0).toUpperCase() + dia.slice(1) : "Sin elegir");
      salida("franja", franja || "Sin elegir");
      var cajaPlan = form.querySelector("[data-demo-plan]");
      if (cajaPlan) cajaPlan.hidden = !plan;
      if (plan) { salida("plan", plan.nombre); salida("rango", "mercado: " + rango(plan.desde, plan.hasta) + " /mes"); }
      var faltan = [];
      if (!dia) faltan.push("el día");
      if (!franja) faltan.push("la franja");
      salida("falta", faltan.length ? "Te falta elegir " + faltan.join(" y ") + "." : "Listo: abre WhatsApp y envía la solicitud.");
      form.classList.toggle("agenda--lista", !faltan.length);
      L.todos("[data-plan]").forEach(function (a) { a.classList.toggle("plan--sugerido", !!plan && a.getAttribute("data-plan") === plan.id); });

      if (!wa || !contacto.whatsapp) return;
      var n = nombre && nombre.value.trim();
      var lineas = ["Hola, " + marca + "." + (n ? " Soy " + n + "." : "") + " Quiero agendar una demo:"];
      if (empresa) {
        lineas.push("• Perfil: empresa" + (negocio ? " (" + negocio.toLowerCase() + ")" : ""));
        if (vol) lineas.push("• Facturas al mes: " + vol.nombre.toLowerCase());
        if (plan) lineas.push("• Plan que me sugiere la web: " + plan.nombre);
      } else {
        lineas.push("• Perfil: contador(a)");
        if (clientes) lineas.push("• Llevo " + clientes.toLowerCase());
      }
      lineas.push("• Día: " + (dia || "el que tengan libre"));
      lineas.push("• Franja: " + (franja || "cualquiera"));
      lineas.push("¿Me confirman la hora exacta?");
      wa.href = urlWhatsapp(lineas.join("\n"));
    }

    form.addEventListener("change", calcular);
    if (nombre) nombre.addEventListener("input", calcular);
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    // Desde fuera: "Agenda una demo para contadores" (data-elegir-perfil) y botones de los planes (data-elegir-plan)
    function marcar(name, valor) {
      var i = form.querySelector("input[name='" + name + "'][value='" + valor + "']");
      if (i) { i.checked = true; calcular(); }
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-elegir-perfil], [data-elegir-plan]");
      if (!a) return;
      var perfil = a.getAttribute("data-elegir-perfil"), planId = a.getAttribute("data-elegir-plan");
      if (perfil) marcar("perfil", perfil);
      if (planId) {
        marcar("perfil", "Empresa");
        var v = (D.volumen || []).filter(function (x) { return x.plan === planId; })[0];
        if (v) marcar("volumen", v.id);
      }
    });
    // Las pestañas Empresas/Contadores también cambian el perfil de la agenda
    var lista = document.querySelector("[data-pestanas='perfil']");
    if (lista) lista.addEventListener("pestana", function (e) {
      var p = e.detail.getAttribute("data-perfil");
      if (p) marcar("perfil", p);
    });
    calcular();
  }

  /** Barra fija del móvil: aparece al salir de la portada y se esconde en la agenda y el contacto. */
  function barraMovil() {
    var ocultar = ["demo", "contacto"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
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
    L.seguro(planes, "planes");
    L.seguro(pestanas, "pestanas");
    L.seguro(agenda, "agenda");              // antes de enlaces(): enlaces() pone el número; calcular() escribe el mensaje
    L.seguro(enlaces, "enlaces");
    L.seguro(datos, "datos");
    L.seguro(pendientes, "pendientes");
    L.seguro(formulario, "formulario");
    L.seguro(anio, "anio");
    L.seguro(function () {                  // tras enlaces(): repone el mensaje completo de la agenda
      var f = document.querySelector("[data-demo]");
      if (f) f.dispatchEvent(new Event("change"));
    }, "agendaMensaje");
    L.seguro(barraMovil, "barraMovil");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
