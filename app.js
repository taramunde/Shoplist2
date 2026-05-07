// Mi Coche Aparcado - 100% gratuito con Leaflet + Esri Satellite
let map, marker, currentPosition = null;
let currentPhoto = null;

// Inicializar mapa
function initMap() {
    // Centro inicial: Madrid
    map = L.map('map', {
        zoomControl: true
    }).setView([40.4168, -3.7038], 15);

    // Capa satélite gratuita de Esri
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19
    }).addTo(map);

    // Capa de etiquetas (calles)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    }).addTo(map);

    map.on('click', (e) => {
        setPosition(e.latlng.lat, e.latlng.lng, false);
    });

    loadSavedData();
}

// Guardar ubicación actual
document.getElementById('locateBtn').addEventListener('click', () => {
    const btn = document.getElementById('locateBtn');
    btn.textContent = '📡 Buscando...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización');
        btn.textContent = '📍 Guardar ubicación actual';
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setPosition(pos.coords.latitude, pos.coords.longitude, true);
            btn.textContent = '📍 Guardar ubicación actual';
            btn.disabled = false;
        },
        (err) => {
            alert('No se pudo obtener ubicación: ' + err.message);
            btn.textContent = '📍 Guardar ubicación actual';
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
});

function setPosition(lat, lng, centerMap) {
    currentPosition = { lat, lng };
    
    if (marker) map.removeLayer(marker);
    
    marker = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
            html: '🚗',
            className: 'car-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(map);

    marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setPosition(pos.lat, pos.lng, false);
    });

    if (centerMap) map.setView([lat, lng], 18);

    document.getElementById('coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById('datetime').textContent = new Date().toLocaleString('es-ES');
    document.getElementById('navigateBtn').disabled = false;

    // Obtener dirección con Nominatim (gratis)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`)
        .then(r => r.json())
        .then(data => {
            const addr = data.display_name || 'Dirección no encontrada';
            document.getElementById('address').textContent = addr;
        })
        .catch(() => {
            document.getElementById('address').textContent = 'Sin conexión para dirección';
        });

    saveData();
}

// Navegar
document.getElementById('navigateBtn').addEventListener('click', () => {
    if (!currentPosition) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentPosition.lat},${currentPosition.lng}&travelmode=walking`;
    window.open(url, '_blank');
});

// Foto
const cameraInput = document.getElementById('cameraInput');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const photoContainer = document.getElementById('photoContainer');
const photoPreview = document.getElementById('photoPreview');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const viewPhotoBtn = document.getElementById('viewPhotoBtn');

takePhotoBtn.addEventListener('click', () => cameraInput.click());
photoContainer.addEventListener('click', () => {
    if (!currentPhoto) cameraInput.click();
});

cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        currentPhoto = ev.target.result;
        photoPreview.src = currentPhoto;
        photoPreview.style.display = 'block';
        photoPlaceholder.style.display = 'none';
        viewPhotoBtn.disabled = false;
        saveData();
    };
    reader.readAsDataURL(file);
});

// Ver foto con zoom
viewPhotoBtn.addEventListener('click', openModal);
photoPreview.addEventListener('click', openModal);

function openModal() {
    if (!currentPhoto) return;
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = currentPhoto;
    modal.classList.add('active');
    resetZoom();
}

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('photoModal').classList.remove('active');
});

// Zoom con pellizco y arrastre
let scale = 1, lastScale = 1, posX = 0, posY = 0, lastX = 0, lastY = 0;
const modalImg = document.getElementById('modalImage');

function resetZoom() {
    scale = 1; lastScale = 1; posX = 0; posY = 0; lastX = 0; lastY = 0;
    updateTransform();
}

function updateTransform() {
    modalImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// Touch events para zoom
let initialDistance = 0;
modalImg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        initialDistance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );
    } else if (e.touches.length === 1) {
        lastX = e.touches[0].pageX - posX;
        lastY = e.touches[0].pageY - posY;
    }
});

modalImg.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
        const distance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );
        scale = Math.min(Math.max(1, lastScale * (distance / initialDistance)), 4);
        updateTransform();
    } else if (e.touches.length === 1 && scale > 1) {
        posX = e.touches[0].pageX - lastX;
        posY = e.touches[0].pageY - lastY;
        updateTransform();
    }
});

modalImg.addEventListener('touchend', () => {
    lastScale = scale;
});

// Doble tap para zoom
let lastTap = 0;
modalImg.addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
        scale = scale > 1 ? 1 : 2;
        lastScale = scale;
        posX = 0; posY = 0;
        updateTransform();
    }
    lastTap = now;
});

// Guardar datos
function saveData() {
    const data = {
        position: currentPosition,
        photo: currentPhoto,
        notes: document.getElementById('notes').value,
        address: document.getElementById('address').textContent,
        coords: document.getElementById('coords').textContent,
        datetime: document.getElementById('datetime').textContent
    };
    localStorage.setItem('cocheAparcado', JSON.stringify(data));
}

document.getElementById('saveBtn').addEventListener('click', () => {
    saveData();
    const btn = document.getElementById('saveBtn');
    const original = btn.textContent;
    btn.textContent = '✓ Guardado';
    setTimeout(() => btn.textContent = original, 1500);
});

document.getElementById('notes').addEventListener('input', saveData);

// Cargar datos
function loadSavedData() {
    const saved = localStorage.getItem('cocheAparcado');
    if (!saved) return;
    
    try {
        const data = JSON.parse(saved);
        if (data.position) {
            setPosition(data.position.lat, data.position.lng, true);
        }
        if (data.photo) {
            currentPhoto = data.photo;
            photoPreview.src = currentPhoto;
            photoPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';
            viewPhotoBtn.disabled = false;
        }
        if (data.notes) document.getElementById('notes').value = data.notes;
        if (data.address) document.getElementById('address').textContent = data.address;
        if (data.coords) document.getElementById('coords').textContent = data.coords;
        if (data.datetime) document.getElementById('datetime').textContent = data.datetime;
    } catch (e) {
        console.error('Error cargando datos', e);
    }
}

// Borrar
document.getElementById('clearBtn').addEventListener('click', () => {
    if (!confirm('¿Borrar ubicación del coche?')) return;
    
    localStorage.removeItem('cocheAparcado');
    if (marker) map.removeLayer(marker);
    currentPosition = null;
    currentPhoto = null;
    photoPreview.style.display = 'none';
    photoPlaceholder.style.display = 'block';
    viewPhotoBtn.disabled = true;
    document.getElementById('notes').value = '';
    document.getElementById('coords').textContent = '-- , --';
    document.getElementById('address').textContent = 'Aún no guardada';
    document.getElementById('datetime').textContent = '--';
    document.getElementById('navigateBtn').disabled = true;
    map.setView([40.4168, -3.7038], 15);
});

// Iniciar
window.addEventListener('load', initMap);

