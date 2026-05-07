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

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => map.setView([pos.coords.latitude, pos.coords.longitude], 17),
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }

    loadAllData();
    updateUI();
}

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

document.getElementById('navigateBtn').addEventListener('click', () => {
    const pos = carsData[currentCar].position;
    if (!pos) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${pos.lat},${pos.lng}&travelmode=walking`, '_blank');
});

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

// FOTO CON COMPRESIÓN
const cameraInput = document.getElementById('cameraInput');
document.getElementById('takePhotoBtn').onclick = () => cameraInput.click();
document.getElementById('photoContainer').onclick = () => {
    if (!carsData[currentCar].photo) cameraInput.click();
};

cameraInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Mostrar cargando
    document.getElementById('photoPlaceholder').innerHTML = '<span>⏳</span><p>Procesando...</p>';
    
    compressImage(file, 1280, 0.75).then(dataUrl => {
        // Borra automáticamente la anterior al asignar la nueva
        carsData[currentCar].photo = dataUrl;
        updateUI();
        const ok = saveAllData();
        if (!ok) {
            alert('La foto es demasiado grande. Se ha guardado una versión comprimida.');
        }
    }).catch(err => {
        alert('Error al procesar foto');
        console.error(err);
        updateUI();
    });
});

// Función para comprimir imagen
function compressImage(file, maxSize = 1280, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = e => {
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > maxSize) {
                    height = Math.round(height * maxSize / width);
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round(width * maxSize / height);
                    height = maxSize;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // JPEG comprime mucho mejor que PNG
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

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

document.getElementById('notes').addEventListener('input', e => {
    carsData[currentCar].notes = e.target.value;
    saveAllData();
});
document.getElementById('saveBtn').onclick = () => {
    const ok = saveAllData();
    const b=document.getElementById('saveBtn');
    b.textContent = ok ? '✓ Guardado' : '⚠️ Error';
    setTimeout(()=>b.textContent='💾 Guardar',1200);
};

document.getElementById('clearBtn').onclick = () => {
    if(!confirm(`¿Borrar ${carsData[currentCar].name}?`)) return;
    if(markers[currentCar]){ map.removeLayer(markers[currentCar]); delete markers[currentCar]; }
    carsData[currentCar] = { ...carsData[currentCar], position:null, photo:null, notes:'', address:'', coords:'', datetime:'' };
    updateUI();
    saveAllData();
};

document.getElementById('showBothBtn').onclick = () => {
    const bounds = [];
    Object.values(markers).forEach(m => bounds.push(m.getLatLng()));
    if(bounds.length===0){ alert('No hay coches guardados'); return; }
    if(bounds.length===1){ map.setView(bounds[0], 17); }
    else { map.fitBounds(bounds, {padding:[50,50]}); }
};

function saveAllData(){
    try {
        localStorage.setItem('dosCoches', JSON.stringify(carsData));
        return true;
    } catch(e) {
        console.error('Error guardando:', e);
        // Si falla por espacio, intenta guardar sin fotos
        try {
            const backup = JSON.parse(JSON.stringify(carsData));
            backup.kia.photo = null;
            backup.nissan.photo = null;
            localStorage.setItem('dosCoches', JSON.stringify(backup));
            alert('Espacio lleno. Se guardó ubicación pero no la foto. Prueba con foto más pequeña.');
        } catch(e2) {}
        return false;
    }
}

function loadAllData(){
    const saved = localStorage.getItem('dosCoches');
    if(!saved) return;
    try {
        const parsed = JSON.parse(saved);
        carsData = { ...carsData, ...parsed };
        Object.entries(carsData).forEach(([key, data]) => {
            if(data.position){
                const pos = data.position;
                markers[key] = L.marker([pos.lat, pos.lng], {
                    icon: L.divIcon({ html: data.icon, className: 'car-marker', iconSize:[40,40], iconAnchor:[20,20] })
                }).addTo(map).bindPopup(`<b>${data.name}</b><br>${(data.address||'').split(',')[0]||''}`);
            }
        });
    } catch(e){ console.error(e); }
}

window.addEventListener('load', initMap);
    
