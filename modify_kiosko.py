import re

with open('kiosko.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update HTML structure
html_old = """        <!-- COLUMNA DERECHA: zona de espera -->
        <div class="kiosk-right">
            <div class="zona-espera-panel">
                <div class="zona-espera-title">Zona de Espera</div>
                <div class="queue-grid" id="queue-grid">
                    <!-- Dinámico -->
                </div>
            </div>
        </div>"""
html_new = """        <!-- COLUMNA DERECHA: zonas del lavadero -->
        <div class="kiosk-right">
            <div class="zona-espera-panel" style="max-height: calc(100vh - 120px); overflow-y: auto;">
                <div class="zona-espera-title">1. Ingreso Inteligente</div>
                <div class="queue-grid" id="grid-pre-espera"></div>
                <div class="zona-espera-title" style="margin-top: 1.5rem;">2. En Espera</div>
                <div class="queue-grid" id="grid-espera"></div>
                <div class="zona-espera-title" style="margin-top: 1.5rem;">3. Lavado / Aspirado</div>
                <div class="queue-grid" id="grid-lavado"></div>
                <div class="zona-espera-title" style="margin-top: 1.5rem;">4. Terminado</div>
                <div class="queue-grid" id="grid-terminado"></div>
            </div>
        </div>"""

if html_old in content:
    content = content.replace(html_old, html_new)
    print("Replaced HTML sidebar")
else:
    print("Could not find HTML sidebar to replace")

# 2. Add supabase polling to updateGlobalETA
js_old = """            function updateGlobalETA() {
                const vehiclesStr = localStorage.getItem('lavadero_active_vehicles');
                let count = 0;
                let vehicles = [];
                if (vehiclesStr) {
                    try {
                        const vs = JSON.parse(vehiclesStr);
                        if (Array.isArray(vs)) {
                            vehicles = vs;
                            count = vs.filter(v => v.zone === 'espera').length;
                        }
                    } catch(e) {}
                }
                const el = document.getElementById('global-eta');
                if (el) el.innerText = `Aprox. ${(count + 1) * 7} min`;

                renderQueuePanel(vehicles);
                renderStatusBar(vehicles);
                syncWashPrices();
            }
            updateGlobalETA();
            setInterval(updateGlobalETA, 5000);"""

js_new = """            async function updateGlobalETA() {
                let vehicles = [];
                
                // 1. Try to fetch from Supabase
                let fetchedFromSupabase = false;
                if (supabase) {
                    try {
                        const { data, error } = await supabase.from('lavadero_camera_queue').select('*').order('entered_at', { ascending: true });
                        if (!error && data) {
                            vehicles = data;
                            fetchedFromSupabase = true;
                            // Optionally update localStorage for fallback
                            localStorage.setItem('lavadero_active_vehicles', JSON.stringify(data));
                        }
                    } catch(e) {
                        console.warn('Supabase fetch failed, falling back to localStorage');
                    }
                }
                
                // 2. Fallback to localStorage
                if (!fetchedFromSupabase) {
                    const vehiclesStr = localStorage.getItem('lavadero_active_vehicles');
                    if (vehiclesStr) {
                        try {
                            const vs = JSON.parse(vehiclesStr);
                            if (Array.isArray(vs)) vehicles = vs;
                        } catch(e) {}
                    }
                }
                
                // Procesar nickname
                vehicles = vehicles.map(dbCar => {
                    let extra = {};
                    try {
                        if (dbCar.nickname && dbCar.nickname.startsWith('{')) extra = JSON.parse(dbCar.nickname);
                    } catch(e) {}
                    return {
                        ...dbCar,
                        nickname: extra.name || dbCar.nickname || 'Vehículo',
                        plate: extra.plate || dbCar.plate || ''
                    };
                });
                
                const count = vehicles.filter(v => v.zone === 'espera').length;
                const el = document.getElementById('global-eta');
                if (el) el.innerText = `Aprox. ${(count + 1) * 7} min`;

                renderQueuePanel(vehicles);
                renderStatusBar(vehicles);
                syncWashPrices();
            }
            updateGlobalETA();
            setInterval(updateGlobalETA, 5000);"""

if js_old in content:
    content = content.replace(js_old, js_new)
    print("Replaced updateGlobalETA")
else:
    print("Could not find updateGlobalETA to replace")


# 3. Update syncWashPrices to also fetch from Supabase
syncWash_old = """            function syncWashPrices() {
                const settingsStr = localStorage.getItem('lavadero_wash_settings');
                if (settingsStr) {
                    try {
                        const parsed = JSON.parse(settingsStr);
                        parsed.forEach(pkg => {
                            if (WASH_OPTIONS[pkg.id]) {
                                WASH_OPTIONS[pkg.id].price = pkg.price;
                                WASH_OPTIONS[pkg.id].name = pkg.title || WASH_OPTIONS[pkg.id].name;
                            }
                        });
                        
                        // Si estamos en el paso 3, actualizamos la vista
                        if (currentStep === 3) {
                            renderWashGrid();
                        }
                    } catch(e) {}
                }
            }"""

syncWash_new = """            async function syncWashPrices() {
                let parsed = null;
                
                if (supabase) {
                    try {
                        const { data, error } = await supabase.from('lavadero_precios').select('*');
                        if (!error && data) {
                            parsed = data.map(row => ({ id: row.id, title: row.name, price: row.price }));
                        }
                    } catch(e) {}
                }
                
                if (!parsed) {
                    const settingsStr = localStorage.getItem('lavadero_wash_settings');
                    if (settingsStr) {
                        try { parsed = JSON.parse(settingsStr); } catch(e) {}
                    }
                }
                
                if (parsed) {
                    parsed.forEach(pkg => {
                        if (WASH_OPTIONS[pkg.id]) {
                            WASH_OPTIONS[pkg.id].price = pkg.price;
                            if (pkg.title) WASH_OPTIONS[pkg.id].name = pkg.title;
                        }
                    });
                    
                    if (currentStep === 3) renderWashGrid();
                }
            }"""

if syncWash_old in content:
    content = content.replace(syncWash_old, syncWash_new)
    print("Replaced syncWashPrices")
else:
    print("Could not find syncWashPrices to replace")


# 4. Update renderQueuePanel to render multiple zones
renderQueue_old = """            function renderQueuePanel(vehicles) {
                const grid = document.getElementById('queue-grid');
                if (!grid) return;

                const waiting = vehicles.filter(v => v.zone === 'espera')
                    .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));

                if (waiting.length === 0) {
                    grid.innerHTML = `<div class="queue-empty-msg" style="grid-column:span 2">
                        <i class="fa-solid fa-car" style="font-size:2rem;display:block;margin-bottom:8px;opacity:0.3"></i>
                        Sin autos en espera
                    </div>`;
                    return;
                }

                let html = '';
                for (let i = 0; i < SLOT_COUNT; i++) {
                    if (i < waiting.length) {
                        const car = waiting[i];
                        const mins = (i + 1) * MINS_PER_CAR;
                        const colorHex = car.color || '#06b6d4';
                const name = car.nickname || `Auto ${i+1}`;
                        const plate = car.plate || '';
                        html += `
                        <div class="queue-car-card">
                            <div class="queue-car-name">${name}</div>
                            <div class="queue-car-time">${mins} min</div>
                            <div style="margin-top:0.5rem;display:flex;justify-content:center;gap:10px">
                                <div style="width:12px;height:12px;border-radius:50%;background:${colorHex}"></div>
                            </div>
                        </div>`;
                    } else {
                        html += `<div class="queue-car-card slot-empty"><div style="font-size:1.4rem;opacity:0.4">${i + 1}</div></div>`;
                    }
                }
                grid.innerHTML = html;
            }"""

renderQueue_new = """            function renderZoneGrid(gridId, vehicles, emptyMsg, slotCount = 0) {
                const grid = document.getElementById(gridId);
                if (!grid) return;
                
                if (vehicles.length === 0 && slotCount === 0) {
                    grid.innerHTML = `<div class="queue-empty-msg" style="grid-column:span 2; padding: 1rem; font-size:0.9rem">
                        <i class="fa-solid fa-car" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3"></i>
                        ${emptyMsg}
                    </div>`;
                    return;
                }
                
                let html = '';
                const totalSlots = Math.max(vehicles.length, slotCount);
                for (let i = 0; i < totalSlots; i++) {
                    if (i < vehicles.length) {
                        const car = vehicles[i];
                        const mins = (gridId === 'grid-espera') ? (i + 1) * MINS_PER_CAR : 0;
                        const colorHex = car.color || '#06b6d4';
                        const name = car.nickname || `Auto ${i+1}`;
                        html += `
                        <div class="queue-car-card">
                            <div class="queue-car-name">${name}</div>
                            ${mins > 0 ? `<div class="queue-car-time">${mins} min</div>` : ''}
                            <div style="margin-top:0.5rem;display:flex;justify-content:center;gap:10px">
                                <div style="width:12px;height:12px;border-radius:50%;background:${colorHex}"></div>
                            </div>
                        </div>`;
                    } else if (slotCount > 0) {
                        html += `<div class="queue-car-card slot-empty"><div style="font-size:1.4rem;opacity:0.4">${i + 1}</div></div>`;
                    }
                }
                grid.innerHTML = html;
            }

            function renderQueuePanel(vehicles) {
                const preEspera = vehicles.filter(v => v.zone === 'pre_espera').sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                const espera = vehicles.filter(v => v.zone === 'espera').sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                const lavadoAspirado = vehicles.filter(v => v.zone === 'lavado' || v.zone === 'aspirado').sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                const terminado = vehicles.filter(v => v.zone === 'terminado').sort((a, b) => new Date(b.entered_at) - new Date(a.entered_at));

                renderZoneGrid('grid-pre-espera', preEspera, 'Sin autos en ingreso', 4);
                renderZoneGrid('grid-espera', espera, 'Sin autos en espera', 8);
                renderZoneGrid('grid-lavado', lavadoAspirado, 'Sin autos procesándose');
                renderZoneGrid('grid-terminado', terminado, 'Sin autos terminados');
            }"""

if renderQueue_old in content:
    content = content.replace(renderQueue_old, renderQueue_new)
    print("Replaced renderQueuePanel")
else:
    print("Could not find renderQueuePanel to replace")


with open('kiosko.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("kiosko.html updated!")
