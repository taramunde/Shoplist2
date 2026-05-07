let map, markers = {}, currentCar = 'kia';
let carsData = {
    kia: { name: 'Kia Rio', icon: '🚗', position: null, photo: null, notes: '', address: '', coords: '', datetime: '' },
    nissan: { name: 'Nissan Juke', icon: '🚙', position: null, photo: null, notes: '', address: '', coords: '', datetime: '' }
};

function initMap() {
    map = L.map('map', { zoomControl: true }).setView([40.4168, -3.7038], 15);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri', maxZoom: 19
    }).addTo(map);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    }).addTo(map);

    map.on('click', (e) => setPosition(e.latlng.lat, e.latlng.lng));

    // Centrar en ubicación actual al abrir
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => map.setView([pos.coords.latitude, pos.coords.longitude], 17),
            () => console.log('Sin permiso ubicación'),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }

    loadAllData();
    updateUI();
}

// Selector de coche
document.querySelectorAll('.car-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.car-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCar = btn.dataset.car;
        updateUI();
        const pos = carsData[currentCar].position;
        if (pos) map.setView([pos.lat, pos.lng], 18);
    });
});

function updateUI() {
    const data = carsData[currentCar];
    document.getElementById('carTitle').textContent = `📍 ${data.name}`;
    document.getElementById('coords').textContent = data.coords || '-- , --';
    document.getElementById('address').textContent = data.address || 'Aún no guardado';
    document.getElementById('datetime').textContent = data.datetime || '--';
    document.getElementById('notes').value = data.notes || '';
    
    const hasPos = !!data.position;
    document.getElementById('navigateBtn').disabled = !hasPos;
    document.getElementById('shareBtn').disabled = !hasPos;
    
    const photoPreview = document.getElementById('photoPreview');
    const placeholder = document.getElementById('photoPlaceholder');
    const viewBtn = document.getElementById('viewPhotoBtn');
    
    if (data.photo) {
        photoPreview.src = data.photo;
        photoPreview.style.display = 'block';
        placeholder.style.display = 'none';
        viewBtn.disabled = false;
    } else {
        photoPreview.style.display = 'none';
        placeholder.style.display = 'block';
        viewBtn.disabled = true;
    }
}

function setPosition(lat, lng) {
    const data = carsData[currentCar];
    data.position = { lat, lng };
    data.coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    data.datetime = new Date().toLocaleString('es-ES');

    // Actualizar marcador
    if (markers[currentCar]) map.removeLayer(markers[currentCar]);
    
    markers[currentCar] = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
            html: data.icon,
            className: 'car-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(map).bindPopup(`<b>${data.name}</b>`);

    markers[currentCar].on('dragend', e => {
        const p = e.target.getLatLng();
        setPosition(p.lat, p.lng);
    });

    map.setView([lat, lng], 18);
    updateUI();

    // Dirección
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`)
        .then(r => r.json())
        .then(d => {
            data.address = d.display_name || 'Dirección no encontrada';
            document.getElementById('address').textContent = data.address;
            saveAllData();
        })
        .catch(() => {
            data.address = 'Sin conexión';
            document.getElementById('address').textContent = data.address;
        });

    saveAllData();
}

// Guardar ubicación actual
document.getElementById('locateBtn').addEventListener('click', () => {
    const btn = document.getElementById('locateBtn');
    btn.textContent = '📡 Buscando...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        pos => {
            setPosition(pos.coords.latitude, pos.coords.longitude);
            btn.textContent = '📍 Guardar aquí';
            btn.disabled = false;
        },
        err => {
            alert('Error: ' + err.message);
            btn.textContent = '📍 Guardar aquí';
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
});

// Navegar
document.getElementById('navigateBtn').addEventListener('click', () => {
    const pos = carsData[currentCar].position;
    if (!pos) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${pos.lat},${pos.lng}&travelmode=walking`, '_blank');
});

// Compartir
document.getElementById('shareBtn').addEventListener('click', () => {
    const data = carsData[currentCar];
    if (!data.position) return;
    
    const { lat, lng } = data.position;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const text = `${data.name} aparcado aquí: ${data.address.split(',')[0]} ${mapsLink}`;
    
    document.getElementById('shareText').textContent = text;
    document.getElementById('whatsappLink').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    document.getElementById('telegramLink').href = `https://t.me/share/url?url=${encodeURIComponent(mapsLink)}&text=${encodeURIComponent(data.name + ' aparcado aquí')}`;
    document.getElementById('shareModal').classList.add('active');
});

document.getElementById('copyLinkBtn').addEventListener('click', () => {
    const data = carsData[currentCar];
    const link = `https://maps.google.com/?q=${data.position.lat},${data.position.lng}`;
    navigator.clipboard.writeText(link).then(() => {
        const btn = document.getElementById('copyLinkBtn');
        btn.textContent = '✓ Copiado';
        setTimeout(() => btn.textContent = 'Copiar enlace', 1500);
    });
});

document.querySelector('.close-share').addEventListener('click', () => {
    document.getElementById('shareModal').classList.remove('active');
});

// Foto
const cameraInput = document.getElementById('cameraInput');
document.getElementById('takePhotoBtn').onclick = () => cameraInput.click();
document.getElementById('photoContainer').onclick = () => {
    if (!carsData[currentCar].photo) cameraInput.click();
};

cameraInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        carsData[currentCar].photo = ev.target.result;
        updateUI();
        saveAllData();
    };
    reader.readAsDataURL(file);
});

// Ver foto
const viewBtn = document.getElementById('viewPhotoBtn');
viewBtn.onclick = () => openPhoto();
document.getElementById('photoPreview').onclick = () => openPhoto();

function openPhoto() {
    const photo = carsData[currentCar].photo;
    if (!photo) return;
    document.getElementById('modalImage').src = photo;
    document.getElementById('photoModal').classList.add('active');
    resetZoom();
}
document.querySelector('#photoModal .close').onclick = () => {
    document.getElementById('photoModal').classList.remove('active');
};

// Zoom foto (igual que antes)
let scale=1, lastScale=1, posX=0, posY=0, lastX=0, lastY=0;
const modalImg = document.getElementById('modalImage');
function resetZoom(){ scale=1; lastScale=1; posX=0; posY=0; updateTransform(); }
function updateTransform(){ modalImg.style.transform = `translate(${posX}px,${posY}px) scale(${scale})`; }
let initialDistance=0;
modalImg.addEventListener('touchstart', e => {
    if(e.touches.length===2){ initialDistance=Math.hypot(e.touches[0].pageX-e.touches[1].pageX, e.touches[0].pageY-e.touches[1].pageY); }
    else if(e.touches.length===1){ lastX=e.touches[0].pageX-posX; lastY=e.touches[0].pageY-posY; }
});
modalImg.addEventListener('touchmove', e => {
    e.preventDefault();
    if(e.touches.length===2){ const d=Math.hypot(e.touches[0].pageX-e.touches[1].pageX, e.touches[0].pageY-e.touches[1].pageY); scale=Math.min(Math.max(1,lastScale*(d/initialDistance)),4); updateTransform(); }
    else if(e.touches.length===1 && scale>1){ posX=e.touches[0].pageX-lastX; posY=e.touches[0].pageY-lastY; updateTransform(); }
});
modalImg.addEventListener('touchend', () => lastScale=scale);

// Notas y guardar
document.getElementById('notes').addEventListener('input', e => {
    carsData[currentCar].notes = e.target.value;
    saveAllData();
});
document.getElementById('saveBtn').onclick = () => {
    saveAllData();
    const b=document.getElementById('saveBtn'); b.textContent='✓ Guardado'; setTimeout(()=>b.textContent='💾 Guardar',1200);
};

// Borrar
document.getElementById('clearBtn').onclick = () => {
    if(!confirm(`¿Borrar ${carsData[currentCar].name}?`)) return;
    if(markers[currentCar]){ map.removeLayer(markers[currentCar]); delete markers[currentCar]; }
    carsData[currentCar] = { ...carsData[currentCar], position:null, photo:null, notes:'', address:'', coords:'', datetime:'' };
    updateUI();
    saveAllData();
};

// Ver ambos
document.getElementById('showBothBtn').onclick = () => {
    const bounds = [];
    Object.values(markers).forEach(m => bounds.push(m.getLatLng()));
    if(bounds.length===0){ alert('No hay coches guardados'); return; }
    if(bounds.length===1){ map.setView(bounds[0], 17); }
    else { map.fitBounds(bounds, {padding:[50,50]}); }
};

// Guardar/cargar
function saveAllData(){ localStorage.setItem('dosCoches', JSON.stringify(carsData)); }
function loadAllData(){
    const saved = localStorage.getItem('dosCoches');
    if(!saved) return;
    try {
        const parsed = JSON.parse(saved);
        carsData = { ...carsData, ...parsed };
        // Recrear marcadores
        Object.entries(carsData).forEach(([key, data]) => {
            if(data.position){
                const pos = data.position;
                markers[key] = L.marker([pos.lat, pos.lng], {
                    icon: L.divIcon({ html: data.icon, className: 'car-marker', iconSize:[40,40], iconAnchor:[20,20] })
                }).addTo(map).bindPopup(`<b>${data.name}</b><br>${data.address.split(',')[0]||''}`);
            }
        });
    } catch(e){ console.error(e); }
}

window.addEventListener('load', initMap);
