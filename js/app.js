const CLAVE_ALMACEN = "lista-compra:datos";

let lista = [];

const ordenCategorias = CATALOGO.map(g => g.categoria).concat("Otros");

// ---------- Persistencia ----------

function guardar() {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lista));
}

function cargarInicial() {
  const desdeUrl = leerListaDesdeUrl();
  if (desdeUrl && desdeUrl.length) {
    lista = desdeUrl;
    guardar();
    history.replaceState(null, "", window.location.pathname + window.location.search);
    mostrarAviso("Lista recibida. Ya puedes marcar lo que vayas comprando.");
    return;
  }
  const guardada = localStorage.getItem(CLAVE_ALMACEN);
  if (guardada) {
    try {
      lista = JSON.parse(guardada);
    } catch (e) {
      lista = [];
    }
  }
}

// ---------- Utilidades ----------

function buscarEnCatalogo(texto) {
  const t = texto.trim().toLowerCase();
  if (!t) return [];
  const resultados = [];
  CATALOGO.forEach(grupo => {
    grupo.productos.forEach(p => {
      if (p.nombre.toLowerCase().includes(t)) {
        resultados.push({ nombre: p.nombre, categoria: grupo.categoria, unidad: p.unidad });
      }
    });
  });
  return resultados.slice(0, 8);
}

function añadirProducto(nombre, categoria, unidad) {
  const existente = lista.find(it => it.n.toLowerCase() === nombre.toLowerCase() && it.c === categoria);
  if (existente) {
    existente.q = (parseFloat(existente.q) || 0) + 1;
  } else {
    lista.push({ n: nombre, c: categoria, q: 1, u: unidad || "ud", k: false });
  }
  guardar();
  render();
}

function eliminarProducto(indice) {
  lista.splice(indice, 1);
  guardar();
  render();
}

function actualizarProducto(indice, cambios) {
  Object.assign(lista[indice], cambios);
  guardar();
  render();
}

function vaciarLista() {
  if (!lista.length) return;
  if (confirm("¿Vaciar toda la lista? No se puede deshacer.")) {
    lista = [];
    guardar();
    render();
  }
}

// ---------- Render ----------

const elLista = document.getElementById("lista");
const elProgreso = document.getElementById("progreso");
const elVacio = document.getElementById("estado-vacio");

function render() {
  elLista.innerHTML = "";

  const total = lista.length;
  const comprados = lista.filter(it => it.k).length;
  elProgreso.textContent = total ? `${comprados}/${total}` : "";

  elVacio.style.display = total ? "none" : "block";

  const grupos = {};
  lista.forEach((item, indice) => {
    const cat = item.c || "Otros";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(indice);
  });

  const categoriasPresentes = Object.keys(grupos).sort(
    (a, b) => ordenCategorias.indexOf(a) - ordenCategorias.indexOf(b)
  );

  categoriasPresentes.forEach(cat => {
    const seccion = document.createElement("section");
    seccion.className = "categoria";

    const titulo = document.createElement("h2");
    titulo.className = "categoria__titulo";
    titulo.textContent = cat;
    seccion.appendChild(titulo);

    const ul = document.createElement("ul");
    ul.className = "articulos";

    grupos[cat].forEach(indice => {
      const item = lista[indice];
      const li = document.createElement("li");
      li.className = "articulo" + (item.k ? " articulo--hecho" : "");

      const nombre = document.createElement("span");
      nombre.className = "articulo__nombre";
      nombre.textContent = item.n;

      const cantidad = document.createElement("input");
      cantidad.type = "number";
      cantidad.min = "0";
      cantidad.step = "any";
      cantidad.className = "articulo__cantidad";
      cantidad.value = item.q;
      cantidad.setAttribute("aria-label", "Cantidad de " + item.n);
      cantidad.addEventListener("change", () => actualizarProducto(indice, { q: cantidad.value }));

      const unidad = document.createElement("select");
      unidad.className = "articulo__unidad";
      unidad.setAttribute("aria-label", "Unidad de " + item.n);
      UNIDADES.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        if (u === item.u) opt.selected = true;
        unidad.appendChild(opt);
      });
      unidad.addEventListener("change", () => actualizarProducto(indice, { u: unidad.value }));

      const borrar = document.createElement("button");
      borrar.type = "button";
      borrar.className = "articulo__borrar";
      borrar.textContent = "✕";
      if (item.k) {
        borrar.setAttribute("aria-label", "Quitar " + item.n + " de la lista");
        borrar.addEventListener("click", () => eliminarProducto(indice));
      } else {
        borrar.setAttribute("aria-label", "Marcar " + item.n + " como comprado o quitarlo");
        borrar.addEventListener("click", () => {
          const yaComprado = confirm("¿Ya has comprado " + item.n + "?");
          if (yaComprado) {
            actualizarProducto(indice, { k: true });
          } else {
            eliminarProducto(indice);
          }
        });
      }

      li.append(nombre, cantidad, unidad, borrar);
      ul.appendChild(li);
    });

    seccion.appendChild(ul);
    elLista.appendChild(seccion);
  });
}

// ---------- Buscador / alta de productos ----------

const elBuscar = document.getElementById("buscar");
const elSugerencias = document.getElementById("sugerencias");
const formAñadir = document.getElementById("form-añadir");

function renderSugerencias() {
  const resultados = buscarEnCatalogo(elBuscar.value);
  elSugerencias.innerHTML = "";
  if (!resultados.length) {
    elSugerencias.hidden = true;
    return;
  }
  resultados.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r.nombre;
    const span = document.createElement("span");
    span.className = "sugerencia__categoria";
    span.textContent = r.categoria;
    li.appendChild(span);
    li.addEventListener("click", () => {
      añadirProducto(r.nombre, r.categoria, r.unidad);
      elBuscar.value = "";
      elSugerencias.hidden = true;
      elBuscar.focus();
    });
    elSugerencias.appendChild(li);
  });
  elSugerencias.hidden = false;
}

elBuscar.addEventListener("input", renderSugerencias);
elBuscar.addEventListener("focus", renderSugerencias);
document.addEventListener("click", e => {
  if (!e.target.closest(".buscador")) elSugerencias.hidden = true;
});

formAñadir.addEventListener("submit", e => {
  e.preventDefault();
  const texto = elBuscar.value.trim();
  if (!texto) return;
  const coincidencia = buscarEnCatalogo(texto).find(
    r => r.nombre.toLowerCase() === texto.toLowerCase()
  );
  if (coincidencia) {
    añadirProducto(coincidencia.nombre, coincidencia.categoria, coincidencia.unidad);
  } else {
    añadirProducto(texto, "Otros", "ud");
  }
  elBuscar.value = "";
  elSugerencias.hidden = true;
});

// ---------- Acciones de compartir ----------

function resumenTexto() {
  const pendientes = lista.filter(it => !it.k);
  if (!pendientes.length) return "Lista de la compra (¡todo comprado!)";
  const lineas = pendientes.map(it => `- ${it.n}: ${it.q} ${it.u}`);
  return "Lista de la compra:\n" + lineas.join("\n");
}

function listaParaCompartir() {
  // El enlace siempre se genera "limpio": nadie recibe productos ya tachados,
  // aunque en este dispositivo sí se vean marcados como comprados.
  return lista.map(it => ({ ...it, k: false }));
}

document.getElementById("btn-compartir").addEventListener("click", async () => {
  if (!lista.length) {
    mostrarAviso("Añade algún producto antes de compartir.");
    return;
  }
  const url = generarEnlace(listaParaCompartir());
  await compartirEnlace(url, resumenTexto());
});

document.getElementById("btn-copiar").addEventListener("click", async () => {
  if (!lista.length) {
    mostrarAviso("Añade algún producto antes de copiar el enlace.");
    return;
  }
  const url = generarEnlace(listaParaCompartir());
  try {
    await navigator.clipboard.writeText(url);
    mostrarAviso("Enlace copiado.");
  } catch (e) {
    prompt("Copia el enlace manualmente:", url);
  }
});

document.getElementById("btn-vaciar").addEventListener("click", vaciarLista);

// ---------- Avisos ----------

let temporizadorAviso;
function mostrarAviso(texto) {
  const el = document.getElementById("aviso");
  el.textContent = texto;
  el.classList.add("aviso--visible");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove("aviso--visible"), 3200);
}

// ---------- Arranque ----------

cargarInicial();
render();
                                
