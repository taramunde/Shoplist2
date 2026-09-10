// Codifica y decodifica el estado de la lista en la propia URL,
// para poder compartirla como un enlace sin necesidad de servidor.
//
// Formato guardado por artículo (claves cortas para que el enlace no sea kilométrico):
//   n = nombre, c = categoría, q = cantidad, u = unidad, k = comprado (true/false)

function codificarLista(items) {
  const compacto = items.map(it => [it.n, it.c, it.q, it.u, it.k ? 1 : 0]);
  const json = JSON.stringify(compacto);
  const utf8 = unescape(encodeURIComponent(json));
  const base64 = btoa(utf8);
  // Variante "url-safe" del base64, para que no rompa el enlace.
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodificarLista(texto) {
  try {
    let base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const utf8 = atob(base64);
    const json = decodeURIComponent(escape(utf8));
    const compacto = JSON.parse(json);
    return compacto.map(([n, c, q, u, k]) => ({ n, c, q, u, k: !!k }));
  } catch (e) {
    console.error("No se ha podido leer el enlace de la lista:", e);
    return null;
  }
}

function generarEnlace(items) {
  const datos = codificarLista(items);
  const url = new URL(window.location.href);
  url.hash = "l=" + datos;
  return url.toString();
}

function leerListaDesdeUrl() {
  const hash = window.location.hash;
  const match = hash.match(/l=([^&]+)/);
  if (!match) return null;
  return decodificarLista(match[1]);
}

async function compartirEnlace(url, resumen) {
  if (navigator.share) {
    try {
      await navigator.share({ title: "Lista de la compra", text: resumen, url });
      return "compartido";
    } catch (e) {
      if (e.name === "AbortError") return "cancelado";
      // Si el share nativo falla, seguimos con el enlace de WhatsApp de respaldo.
    }
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(resumen + "\n" + url), "_blank");
  return "whatsapp";
}
