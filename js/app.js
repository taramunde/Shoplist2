/* ============================================================
   LISTA DE LA COMPRA — Lógica de la aplicación
   ============================================================ */

// ============================================================
//  CONFIGURACIÓN
// ============================================================
const DEPARTAMENTOS = [
    { nombre: "Frutas y Verduras",       icono: "🥬" },
    { nombre: "Lácteos y Huevos",        icono: "🥛" },
    { nombre: "Carnes, Aves y Pescados", icono: "🥩" },
    { nombre: "Panadería y Repostería",  icono: "🥖" },
    { nombre: "Bebidas",                 icono: "🥤" },
    { nombre: "Conservas y Enlatados",   icono: "🥫" },
    { nombre: "Congelados",              icono: "🧊" },
    { nombre: "Despensa",                icono: "🍝" },
    { nombre: "Limpieza del Hogar",      icono: "🧽" },
    { nombre: "Higiene y Belleza",       icono: "🧴" },
    { nombre: "Otros",                   icono: "📦" }
];

// Unidades disponibles (agrupadas mentalmente por tipo)
const UNIDADES = [
    { valor: "",             label: "— sin unidad —" },
    // Peso
    { valor: "g",            label: "gramos (g)" },
    { valor: "kg",           label: "kilos (kg)" },
    // Volumen
    { valor: "ml",           label: "mililitros (ml)" },
    { valor: "cl",           label: "centilitros (cl)" },
    { valor: "l",            label: "litros (L)" },
    // Recuento
    { valor: "ud",           label: "unidades (ud)" },
    { valor: "docena",       label: "docena" },
    { valor: "media-docena", label: "media docena" },
    // Envases y formatos
    { valor: "brick",        label: "brick" },
    { valor: "botella",      label: "botella" },
    { valor: "lata",         label: "lata" },
    { valor: "bote",         label: "bote" },
    { valor: "tarro",        label: "tarro" },
    { valor: "paquete",      label: "paquete" },
    { valor: "bolsa",        label: "bolsa" },
    { valor: "caja",         label: "caja" },
    { valor: "bandeja",      label: "bandeja" },
    { valor: "racion",       label: "ración" }
];

const STORAGE_KEY = 'listaCompra2026';

// ============================================================
//  ESTADO
// ============================================================
let lista = [];
const collapsedDepts = new Set();
let toastTimer;

// ============================================================
//  UTILIDADES
// ============================================================
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function iconoDepto(nombre) {
    const d = DEPARTAMENTOS.find(x => x.nombre === nombre);
    return d ? d.icono : '📦';
}

// Devuelve "2 kg", "1 docena", "500", "" etc.
function formatearCantidad(item) {
    const cant = (item.cantidad !== undefined && item.cantidad !== null)
        ? String(item.cantidad).trim() : '';
    const uni  = (item.unidad || '').trim();
    if (!cant && !uni) return '';
    if (cant && !uni)  return cant;
    if (!cant && uni)  return uni;
    return `${cant} ${uni}`;
}

// ============================================================
//  ENCODE / DECODE (URL-safe + UTF-8)
// ============================================================
function encodeLista(arr) {
    // Formato compacto variable:
    //   [nombre, depto, comprado]                          (sin cantidad)
    //   [nombre, depto, comprado, cantidad, unidad]        (con cantidad)
    const compacto = arr.map(i => {
        const cant = i.cantidad !== undefined && i.cantidad !== null ? String(i.cantidad) : '';
        const uni  = i.unidad || '';
        if (cant || uni) {
            return [i.nombre, i.departamento, i.comprado ? 1 : 0, cant, uni];
        }
        return [i.nombre, i.departamento, i.comprado ? 1 : 0];
    });
    const json = JSON.stringify(compacto);
    try {
        return LZString.compressToEncodedURIComponent(json);
    } catch (e) {
        return 'b64_' + b64UrlEncode(json);
    }
}

function decodeLista(str) {
    if (!str) return null;
    try {
        let json;
        if (str.startsWith('b64_')) {
            json = b64UrlDecode(str.slice(4));
        } else {
            json = LZString.decompressFromEncodedURIComponent(str);
        }
        if (!json) return null;
        const arr = JSON.parse(json);
        if (!Array.isArray(arr)) return null;

        return arr.map(([nombre, departamento, comprado, cantidad, unidad]) => ({
            id: uid(),
            nombre: String(nombre),
            departamento: departamento || 'Otros',
            comprado: !!comprado,
            cantidad: cantidad || '',
            unidad: unidad || ''
        }));
    } catch (e) {
        console.error('Error decodificando lista:', e);
        return null;
    }
}

function b64UrlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlDecode(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

// ============================================================
//  PERSISTENCIA
// ============================================================
function guardarLista() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
        console.warn('No se pudo guardar:', e);
    }
}

function cargarLista() {
    try {
        const guardada = localStorage.getItem(STORAGE_KEY);
        if (guardada) lista = JSON.parse(guardada) || [];
    } catch (e) {
        lista = [];
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has('d')) {
        const compartida = decodeLista(params.get('d'));
        if (compartida && compartida.length) {
            const mensaje = lista.length > 0
                ? `📥 Has recibido una lista compartida con ${compartida.length} productos.\n\n` +
                  `Aceptar → REEMPLAZA tu lista actual\n` +
                  `Cancelar → se mantiene tu lista actual`
                : `📥 Has recibido una lista con ${compartida.length} productos.\n\n¿Quieres cargarla?`;
            if (confirm(mensaje)) {
                lista = compartida;
                guardarLista();
            }
        } else {
            alert('⚠️ El enlace compartido no es válido o está dañado.');
        }
        history.replaceState({}, document.title, window.location.pathname);
    }
}

// ============================================================
//  RENDER
// ============================================================
function renderizarLista() {
    const container = document.getElementById('lista-container');
    const empty = document.getElementById('empty-state');

    if (lista.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        actualizarContador();
        return;
    }
    empty.classList.add('hidden');

    // Agrupar por departamento
    const grupos = {};
    for (const item of lista) {
        const d = item.departamento || 'Otros';
        if (!grupos[d]) grupos[d] = [];
        grupos[d].push(item);
    }

    const deptos = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es'));

    let html = '';
    for (const depto of deptos) {
        const items = grupos[depto];
        const comprados = items.filter(i => i.comprado).length;
        const icono = iconoDepto(depto);
        const collapsed = collapsedDepts.has(depto) ? 'collapsed' : '';

        html += `
        <div class="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
            <div class="departamento-header px-5 py-4 bg-zinc-800/60 hover:bg-zinc-800 flex items-center justify-between gap-3"
                 data-depto="${encodeURIComponent(depto)}">
                <div class="flex items-center gap-x-3 flex-wrap">
                    <span class="text-xl">${icono}</span>
                    <span class="font-medium">${escapeHtml(depto)}</span>
                    <span class="text-[11px] bg-white/10 px-2 py-0.5 rounded-full">${items.length}</span>
                </div>
                <div class="flex items-center gap-x-3">
                    <span class="text-emerald-400 text-sm">${comprados}/${items.length}</span>
                    <span class="arrow text-zinc-400 ${collapsed}">▼</span>
                </div>
            </div>
            <div class="departamento-body ${collapsed}">
                ${items.map(item => {
                    const cantTxt = formatearCantidad(item);
                    const badge = cantTxt
                        ? `<span class="text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 font-medium">${escapeHtml(cantTxt)}</span>`
                        : '';
                    return `
                    <div class="flex items-center gap-x-3 px-5 py-3 border-b border-zinc-800 last:border-b-0 group">
                        <input type="checkbox" ${item.comprado ? 'checked' : ''}
                               data-action="toggle" data-id="${item.id}"
                               class="w-5 h-5 accent-emerald-500 cursor-pointer shrink-0">
                        <div class="flex-1 min-w-0 flex items-center gap-x-2 ${item.comprado ? 'item-comprado' : ''}">
                            <span class="truncate">${escapeHtml(item.nombre)}</span>
                            ${badge}
                        </div>
                        <button data-action="delete" data-id="${item.id}" title="Eliminar"
                                class="text-red-400 hover:text-red-300 text-lg px-2 opacity-50 hover:opacity-100">✕</button>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    container.innerHTML = html;

    // Listeners de plegado
    container.querySelectorAll('.departamento-header').forEach(el => {
        el.addEventListener('click', () => {
            const body = el.nextElementSibling;
            const arrow = el.querySelector('.arrow');
            const isCollapsed = body.classList.toggle('collapsed');
            arrow.classList.toggle('collapsed', isCollapsed);
            const depto = decodeURIComponent(el.dataset.depto);
            if (isCollapsed) collapsedDepts.add(depto);
            else collapsedDepts.delete(depto);
        });
    });

    // Delegación de eventos
    container.querySelectorAll('[data-action="toggle"]').forEach(cb => {
        cb.addEventListener('change', () => marcarComprado(cb.dataset.id));
    });
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => eliminarItem(btn.dataset.id));
    });

    actualizarContador();
}

function actualizarContador() {
    const total = lista.length;
    const comprados = lista.filter(i => i.comprado).length;
    document.getElementById('contador-text').textContent = `${comprados} / ${total}`;
    document.getElementById('total-items').innerHTML =
        `<span class="text-emerald-400">${comprados}</span> comprados · ${total} total`;
}

// ============================================================
//  ACCIONES
// ============================================================
function agregarProducto() {
    const inputNombre = document.getElementById('producto-input');
    const inputCant   = document.getElementById('cantidad-input');
    const selectUni   = document.getElementById('unidad-select');
    const selectDepto = document.getElementById('departamento-select');

    const nombre = inputNombre.value.trim();
    if (!nombre) { inputNombre.focus(); return; }

    const departamento = selectDepto.value || 'Otros';
    const cantidadRaw  = inputCant.value.trim();
    const cantidad     = cantidadRaw === '' ? '' : cantidadRaw;
    const unidad       = selectUni.value || '';

    lista.unshift({
        id: uid(),
        nombre,
        departamento,
        comprado: false,
        cantidad,
        unidad
    });

    // Reset form (mantenemos el departamento para añadir varios del mismo)
    inputNombre.value = '';
    inputCant.value = '';
    selectUni.value = '';
    inputNombre.focus();

    guardarLista();
    renderizarLista();

    const txt = formatearCantidad({ cantidad, unidad });
    mostrarToast(`✅ ${nombre}${txt ? ' (' + txt + ')' : ''} → ${departamento}`);
}

function marcarComprado(id) {
    const item = lista.find(i => i.id === id);
    if (!item) return;
    item.comprado = !item.comprado;
    guardarLista();
    renderizarLista();
    if (lista.length > 0 && lista.every(i => i.comprado)) {
        setTimeout(() => mostrarToast('🎉 ¡Lista completa!'), 400);
    }
}

function eliminarItem(id) {
    const item = lista.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    lista = lista.filter(i => i.id !== id);
    guardarLista();
    renderizarLista();
}

function limpiarComprados() {
    const n = lista.filter(i => i.comprado).length;
    if (n === 0) { mostrarToast('No hay productos comprados'); return; }
    if (!confirm(`¿Eliminar ${n} producto(s) ya comprado(s)?`)) return;
    lista = lista.filter(i => !i.comprado);
    guardarLista();
    renderizarLista();
    mostrarToast('🧹 Limpieza realizada');
}

function nuevaLista() {
    if (lista.length > 0 && !confirm('¿Crear una lista nueva? Se perderá la actual.')) return;
    lista = [];
    collapsedDepts.clear();
    guardarLista();
    renderizarLista();
    mostrarToast('🆕 Lista nueva');
}

// ============================================================
//  COMPARTIR
// ============================================================
function generarShareUrl() {
    const encoded = encodeLista(lista);
    const base = window.location.origin + window.location.pathname;
    return `${base}?d=${encodeURIComponent(encoded)}`;
}

function mostrarCompartir() {
    if (lista.length === 0) {
        mostrarToast('Añade productos primero');
        return;
    }
    document.getElementById('share-url').textContent = generarShareUrl();
    document.getElementById('qr-preview').classList.add('hidden');
    document.getElementById('qr-preview').classList.remove('flex');

    const modal = document.getElementById('modal-compartir');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function cerrarModal() {
    const modal = document.getElementById('modal-compartir');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function copiarEnlace() {
    const url = generarShareUrl();
    const ok = () => mostrarToast('📋 Enlace copiado');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, () => fallbackCopy(url, ok));
    } else {
        fallbackCopy(url, ok);
    }
}

function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        cb();
    } catch (e) {
        alert('No se pudo copiar. Copia manualmente:\n\n' + text);
    }
    ta.remove();
}

function compartirWhatsApp() {
    const url = generarShareUrl();
    const texto = `🛒 Mi lista de la compra:\n${url}\n\nÁbrela y ayúdame a comprar 🙌`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

function compartirComoTexto() {
    const grupos = {};
    lista.forEach(i => {
        if (!grupos[i.departamento]) grupos[i.departamento] = [];
        grupos[i.departamento].push(i);
    });

    let texto = `🛒 *Mi Lista de la Compra*\n\n`;

    Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es')).forEach(depto => {
        texto += `*${depto}*\n`;
        grupos[depto].forEach(item => {
            const cant = formatearCantidad(item);
            const check = item.comprado ? '✅' : '⬜';
            if (cant) {
                texto += `${check} ${cant} · ${item.nombre}\n`;
            } else {
                texto += `${check} ${item.nombre}\n`;
            }
        });
        texto += `\n`;
    });

    texto += `_Compartido desde mi app de Lista de la Compra_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

function generarQR() {
    const url = generarShareUrl();
    const img = document.getElementById('qr-image');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&color=10b981&bgcolor=ffffff&data=${encodeURIComponent(url)}`;
    const preview = document.getElementById('qr-preview');
    preview.classList.remove('hidden');
    preview.classList.add('flex');
}

// ============================================================
//  ESTADÍSTICAS
// ============================================================
function mostrarEstadisticas() {
    if (lista.length === 0) return;
    const comprados = lista.filter(i => i.comprado).length;
    const porDepto = {};
    lista.forEach(i => {
        porDepto[i.departamento] = (porDepto[i.departamento] || 0) + 1;
    });

    // Totales por unidad
    const porUnidad = {};
    lista.forEach(i => {
        if (i.unidad) {
            const key = i.unidad;
            porUnidad[key] = (porUnidad[key] || 0) + (parseFloat(i.cantidad) || 0);
        }
    });

    let txt = '📊 ESTADÍSTICAS\n\n';
    txt += `Total: ${lista.length} productos\n`;
    txt += `Comprados: ${comprados} (${Math.round(comprados / lista.length * 100)}%)\n\n`;
    txt += 'Por departamento:\n';
    Object.keys(porDepto).sort((a, b) => a.localeCompare(b, 'es'))
        .forEach(d => { txt += `• ${d}: ${porDepto[d]}\n`; });

    const unidadesKeys = Object.keys(porUnidad);
    if (unidadesKeys.length > 0) {
        txt += '\nTotales por unidad:\n';
        unidadesKeys.sort().forEach(u => {
            txt += `• ${porUnidad[u]} ${u}\n`;
        });
    }

    alert(txt);
}

// ============================================================
//  TOAST
// ============================================================
function mostrarToast(texto) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').innerHTML = texto;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

// ============================================================
//  INICIALIZACIÓN
// ============================================================
function inicializar() {
    // Aviso si se abre en local
    if (window.location.protocol === 'file:' || window.location.protocol === 'content:') {
        document.getElementById('local-warning').classList.remove('hidden');
    }

    // Rellenar select de unidades
    const selectUni = document.getElementById('unidad-select');
    UNIDADES.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.valor;
        opt.textContent = u.label;
        selectUni.appendChild(opt);
    });

    // Rellenar select de departamentos
    const selectDepto = document.getElementById('departamento-select');
    DEPARTAMENTOS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.nombre;
        opt.textContent = `${d.icono}  ${d.nombre}`;
        selectDepto.appendChild(opt);
    });

    // ---- Eventos ----
    // Enter en input nombre → añadir
    document.getElementById('producto-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') agregarProducto();
    })
