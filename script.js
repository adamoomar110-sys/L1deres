// ============================================================
// L1DERES AUTOWASH — LANDING PAGE LOGIC (Aura v1.5)
// Sincronización en tiempo real con DonWeb API MySQL y Pista Espejo
// ============================================================
// API URL DonWeb
const API_URL = 'api/';

// Global Landing Config
let landingConfig = {
    precio_express_auto: 10000,
    precio_express_camioneta: 12000,
    precio_completo_auto: 15000,
    precio_completo_camioneta: 18000,
    whatsapp_number: '5491123456789',
    dias_atencion: 'Lunes a Sábados',
    hora_apertura: '08:00',
    hora_cierre: '20:00',
    atiende_domingos: false,
    atiende_feriados: false,
    mensaje_feriados: ''
};

// Sponsors State
let landingSponsorsList = [];
let currentLandingSponsorIndex = 0;
let landingSponsorTimer = null;

// ============================================================
// 1. CARGA DE CONFIGURACIÓN Y HORARIOS EN TIEMPO REAL (API DONWEB)
// ============================================================
async function loadLandingConfig() {
    // 1. Cargar de localStorage como respaldo
    const localSaved = localStorage.getItem('aura_lavadero_config');
    if (localSaved) {
        try {
            landingConfig = { ...landingConfig, ...JSON.parse(localSaved) };
        } catch(e){}
    }

    // 2. Cargar desde API DonWeb MySQL
    try {
        const res = await fetch(`${API_URL}configuracion.php`);
        if (res.ok) {
            const data = await res.json();
            if (data && !data.error) {
                landingConfig = { ...landingConfig, ...data };
                if (data.live_state) {
                    renderLandingCars(data.live_state);
                }
            }
        }
    } catch (err) {
        console.warn('Cargando valores estándar para Landing Page:', err);
    }

    updateLandingUI();
}

function updateLandingUI() {
    // 1. Precios en Servicios
    const precioExpressAutoEl = document.getElementById('price-express-auto-display');
    const precioExpressCamionetaEl = document.getElementById('price-express-camioneta-display');
    const precioCompletoAutoEl = document.getElementById('price-completo-auto-display');
    const precioCompletoCamionetaEl = document.getElementById('price-completo-camioneta-display');

    if (precioExpressAutoEl) precioExpressAutoEl.textContent = `$${landingConfig.precio_express_auto || 10000}`;
    if (precioExpressCamionetaEl) precioExpressCamionetaEl.textContent = `$${landingConfig.precio_express_camioneta || 12000}`;
    if (precioCompletoAutoEl) precioCompletoAutoEl.textContent = `$${landingConfig.precio_completo_auto || 15000}`;
    if (precioCompletoCamionetaEl) precioCompletoCamionetaEl.textContent = `$${landingConfig.precio_completo_camioneta || 18000}`;

    // 2. WhatsApp
    if (landingConfig.whatsapp_number) {
        const cleanNumber = landingConfig.whatsapp_number.replace(/\D/g, '');
        const btnWa = document.getElementById('btn-contact-wa');
        const phoneText = document.getElementById('contact-phone-text');
        
        if (btnWa) btnWa.href = `https://wa.me/${cleanNumber}?text=${encodeURIComponent('Hola L1deres AutoWash, quiero hacer una consulta.')}`;
        if (phoneText) phoneText.textContent = `+${cleanNumber}`;
    }

    // 3. Horarios y Días de Atención
    const scheduleTextEl = document.getElementById('contact-schedule-text');
    if (scheduleTextEl) {
        const dias = landingConfig.dias_atencion || 'Lunes a Sábados';
        const aper = landingConfig.hora_apertura || '08:00';
        const cier = landingConfig.hora_cierre || '20:00';
        scheduleTextEl.textContent = `${dias} de ${aper} a ${cier} hs`;
    }

    // 4. Domingos y Feriados Badge
    const holidaysBadgeEl = document.getElementById('contact-holidays-badge');
    if (holidaysBadgeEl) {
        let msg = '';
        if (landingConfig.mensaje_feriados) {
            msg = `<i class='bx bx-info-circle'></i> ${landingConfig.mensaje_feriados}`;
        } else {
            const parts = [];
            if (landingConfig.atiende_domingos) parts.push('Abierto los Domingos');
            else parts.push('Cerrado los Domingos');

            if (landingConfig.atiende_feriados) parts.push('Abierto Feriados');
            else parts.push('Cerrado Feriados');

            msg = `<i class='bx bx-calendar-star'></i> ${parts.join(' · ')}`;
        }
        holidaysBadgeEl.innerHTML = msg;
    }
}

// ============================================================
// 2. DIBUJO DE PISTA Y LÍNEAS SVG DE NEÓN (IDÉNTICO AL DASHBOARD)
// ============================================================
function initLandingTrackGrid() {
    const canvasGrid = document.getElementById('landing-canvas-grid');
    if (!canvasGrid) return;

    // Si ya existen los boxes en el HTML, dibujar directamente la pista SVG
    if (canvasGrid.children.length > 0) {
        setTimeout(drawLandingSVGTracks, 100);
        return;
    }

    // Título de Terminado (columnas 1 y 2)
    const titleTerminado = document.createElement('div');
    titleTerminado.className = 'zone-title';
    titleTerminado.textContent = 'Terminado';
    titleTerminado.style.gridColumn = '1 / span 2';
    titleTerminado.style.gridRow = '1';
    canvasGrid.appendChild(titleTerminado);

    // Título de Zona de Espera (columnas 5 y 6)
    const titleEspera = document.createElement('div');
    titleEspera.className = 'zone-title';
    titleEspera.textContent = 'Zona de Espera';
    titleEspera.style.gridColumn = '5 / span 2';
    titleEspera.style.gridRow = '1';
    canvasGrid.appendChild(titleEspera);

    // Título de Lavado (columna 4)
    const titleLavado = document.createElement('div');
    titleLavado.className = 'zone-title';
    titleLavado.textContent = 'Lavado';
    titleLavado.style.gridColumn = '4';
    titleLavado.style.gridRow = '1';
    canvasGrid.appendChild(titleLavado);

    // Título de Interior (columna 3)
    const titleSecado = document.createElement('div');
    titleSecado.className = 'zone-title';
    titleSecado.textContent = 'Interior';
    titleSecado.style.gridColumn = '3';
    titleSecado.style.gridRow = '1';
    canvasGrid.appendChild(titleSecado);

    const totalBoxes = 48; // 8 x 6
    for (let i = 0; i < totalBoxes; i++) {
        const boxNumber = i + 1;
        const row = Math.floor(i / 6) + 2; 
        const col = (i % 6) + 1;

        if (boxNumber === 35 || boxNumber === 36) {
            if (boxNumber === 35) {
                const reserva = document.createElement('div');
                reserva.className = 'reserva-online';
                reserva.textContent = 'Zona Reserva Online';
                reserva.style.gridRow = row;
                reserva.style.gridColumn = '5 / span 2';
                canvasGrid.appendChild(reserva);
            }
            continue;
        }

        const box = document.createElement('div');
        box.className = 'grid-box';
        box.dataset.boxNumber = boxNumber;

        const textReplacements = {
            25: '1', 19: '2', 13: '3', 7: '4',
            11: '1', 12: '2', 17: '3', 18: '4',
            23: '5', 24: '6', 29: '7', 30: '8',
            4: '1',
            3: '1'
        };

        if (textReplacements.hasOwnProperty(boxNumber)) {
            box.textContent = textReplacements[boxNumber];
            box.style.gridRow = row;
            box.style.gridColumn = col;
            canvasGrid.appendChild(box);
        }
    }

    setTimeout(drawLandingSVGTracks, 150);
}

function drawLandingSVGTracks() {
    const trackInterior = document.getElementById('landing-track-interior');
    const trackLavado = document.getElementById('landing-track-lavado');
    const baseInterior = document.getElementById('landing-base-interior');
    const baseLavado = document.getElementById('landing-base-lavado');
    const railsInterior = document.getElementById('landing-rails-interior');
    const slotInterior = document.getElementById('landing-slot-interior');
    const railsLavado = document.getElementById('landing-rails-lavado');
    const slotLavado = document.getElementById('landing-slot-lavado');
    const area = document.getElementById('landing-canvas-area');

    if (!trackInterior || !trackLavado || !area) return;

    function getBoxCenter(boxNumber) {
        const box = area.querySelector(`.grid-box[data-box-number="${boxNumber}"]`);
        if (!box) return { x: 0, y: 0 };
        const boxRect = box.getBoundingClientRect();
        const canvasRect = area.getBoundingClientRect();
        return {
            x: boxRect.left - canvasRect.left + (boxRect.width / 2),
            y: boxRect.top - canvasRect.top + (boxRect.height / 2)
        };
    }

    // Pista Solo Interior (Circuito Interno)
    // Espera Izq: 29 (bot) -> 11 (top). Terminado Único: 7 (top) -> 25 (bot).
    const eIzqBot = getBoxCenter(29);
    const eIzqTop = getBoxCenter(11);
    
    // Pista Lavado (Circuito Externo)
    // Espera Der: 30 (bot) -> 12 (top). Lavado: 4. Terminado Único: 7 (top) -> 25 (bot).
    const eDerBot = getBoxCenter(30);
    const eDerTop = getBoxCenter(12);
    const lavado = getBoxCenter(4);
    
    // Terminado (único carril)
    const tTop = getBoxCenter(7);
    const tBot = getBoxCenter(25);

    if (eIzqBot.x === 0 || eDerBot.x === 0 || tTop.x === 0) return;

    let R = 45; // Radio de curva para las esquinas

    // Path Interno (Interior) - Dobla en la Fila 3
    let pathIzq = `
        M ${eIzqBot.x} ${eIzqBot.y + 300} 
        L ${eIzqTop.x} ${eIzqTop.y + R} 
        Q ${eIzqTop.x} ${eIzqTop.y} ${eIzqTop.x - R} ${eIzqTop.y}
        L ${tTop.x + R} ${eIzqTop.y}
        Q ${tTop.x} ${eIzqTop.y} ${tTop.x} ${eIzqTop.y + R}
        L ${tBot.x} ${tBot.y + 300}
    `.replace(/\s+/g, ' ').trim();

    // Path Externo (Lavado) - Sube hasta la Fila 2 y luego dobla
    let pathDer = `
        M ${eDerBot.x} ${eDerBot.y + 300} 
        L ${eDerTop.x} ${lavado.y + R} 
        Q ${eDerTop.x} ${lavado.y} ${eDerTop.x - R} ${lavado.y}
        L ${tTop.x + R} ${lavado.y}
        Q ${tTop.x} ${lavado.y} ${tTop.x} ${lavado.y + R}
        L ${tBot.x} ${tBot.y + 300}
    `.replace(/\s+/g, ' ').trim();

    trackInterior.setAttribute('d', pathIzq);
    trackLavado.setAttribute('d', pathDer);
    
    if (baseInterior) baseInterior.setAttribute('d', pathIzq);
    if (baseLavado) baseLavado.setAttribute('d', pathDer);
    if (railsInterior) railsInterior.setAttribute('d', pathIzq);
    if (slotInterior) slotInterior.setAttribute('d', pathIzq);
    if (railsLavado) railsLavado.setAttribute('d', pathDer);
    if (slotLavado) slotLavado.setAttribute('d', pathDer);
}

// ============================================================
// 3. RENDERIZADO Y ANIMACIÓN DE AUTOS EN TIEMPO REAL (PATENTES OCULTAS)
// ============================================================
// Procesamiento de transparencia para autos de la Landing Page
// Procesamiento de transparencia para autos de la Landing Page
let landingCarImageSrc = 'f1_car_top_down.png?v=f1hd3';
const _landingCarImg = new Image();
_landingCarImg.crossOrigin = 'anonymous';
_landingCarImg.src = landingCarImageSrc;
_landingCarImg.onload = () => {
    landingCarImageSrc = _landingCarImg.src;
    document.querySelectorAll('#landing-canvas-area .auto-icon').forEach(img => img.src = landingCarImageSrc);
};
_landingCarImg.onerror = () => {
    if (!_landingCarImg.src.includes('../')) {
        _landingCarImg.src = '../f1_car_top_down.png?v=f1hd3';
    }
};

async function fetchLandingLiveState() {
    try {
        const res = await fetch(`${API_URL}configuracion.php`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.live_state) {
                renderLandingCars(data.live_state);
            }
        }
    } catch (e) {
        console.warn('Error fetching live state:', e);
    }
}

// Motor de Simulación Continua para Landing Page (Idéntico al Dashboard)
const landingSimCars = new Map();

function formatLandingTime(segundos) {
    if (segundos <= 0) return "00:00";
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function landingGameLoop() {
    const now = Date.now();

    landingSimCars.forEach((state) => {
        let currentTargetX = state.targetX;
        let currentTargetY = state.targetY;

        // Lógica ortogonal tipo Scalextric (Subir/Bajar y Doblar)
        if (Math.abs(state.targetX - state.x) > 10 && Math.abs(state.targetY - state.y) > 10) {
            if (state.y > state.targetY) {
                currentTargetX = state.x;
            } else if (state.y < state.targetY) {
                currentTargetY = state.y;
            }
        }

        const dx = currentTargetX - state.x;
        const dy = currentTargetY - state.y;

        state.x += dx * 0.08;
        state.y += dy * 0.08;

        let targetAngle = state.desiredAngle !== undefined ? state.desiredAngle : 0;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        }

        let diff = targetAngle - state.angle;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        state.angle += diff * 0.12;

        state.wrapper.style.left = `${state.x}px`;
        state.wrapper.style.top = `${state.y}px`;

        if (state.icon) {
            state.icon.style.transform = `rotate(${state.angle}deg)`;
        }

        // Actualizar reloj de tiempo en cada auto (MM:SS cuenta regresiva real)
        if (state.timerBadge) {
            if (state.stateName === 'espera') {
                state.timerBadge.style.display = 'block';
                if (state.etaSalidaEspera) {
                    const remaining = Math.max(0, Math.ceil((state.etaSalidaEspera - now) / 1000));
                    state.timerBadge.textContent = formatLandingTime(remaining);
                } else if (state.timerText) {
                    state.timerBadge.textContent = state.timerText;
                }
            } else if (state.stateName === 'terminado') {
                if (state.endTime) {
                    const remaining = Math.ceil((state.endTime - now) / 1000);
                    if (remaining > 0) {
                        state.timerBadge.textContent = formatLandingTime(remaining);
                        state.timerBadge.style.display = 'block';
                    } else {
                        state.timerBadge.textContent = '¡Listo!';
                        state.timerBadge.style.display = 'block';
                    }
                } else {
                    state.timerBadge.textContent = '¡Listo!';
                    state.timerBadge.style.display = 'block';
                }
            } else if (state.endTime) {
                const remaining = Math.ceil((state.endTime - now) / 1000);
                if (remaining > 0) {
                    state.timerBadge.textContent = formatLandingTime(remaining);
                    state.timerBadge.style.display = 'block';
                } else {
                    state.timerBadge.style.display = 'none';
                }
            } else if (state.timerText) {
                state.timerBadge.textContent = state.timerText;
                state.timerBadge.style.display = 'block';
            }
        }
    });

    requestAnimationFrame(landingGameLoop);
}
requestAnimationFrame(landingGameLoop);

function renderLandingCars(state) {
    const area = document.getElementById('landing-canvas-area');
    if (!area || !state) return;

    const cRect = area.getBoundingClientRect();
    if (cRect.width === 0) return;

    const activeCarIds = new Set();
    const ESPERA_ZONES = [11, 12, 17, 18, 23, 24, 29, 30];
    const LAVADO_ZONE = 4;
    const SECADO_ZONES = [3];
    const TERMINADO_ZONES = [25, 19, 13, 7];

    // Limpiar clases visuales de boxes ocupados
    area.querySelectorAll('.grid-box').forEach(box => {
        box.classList.remove('box-occupied-lavado', 'box-occupied-secado', 'box-occupied-completo');
    });

    function placeCar(boxNumber, timerText, colorGlow = '#38bdf8', rotateDeg = 0, typeClass = 'solo-lavado', carId = '', carObj = null, stateName = 'espera') {
        const box = area.querySelector(`[data-box-number="${boxNumber}"]`);
        if (!box) return;

        const uniqueId = carId.toString();
        activeCarIds.add(uniqueId);

        // Marcar celda como ocupada
        let classOcupado = '';
        if (typeClass === 'solo-lavado') classOcupado = 'box-occupied-lavado';
        else if (typeClass === 'solo-secado') classOcupado = 'box-occupied-secado';
        else classOcupado = 'box-occupied-completo';
        box.classList.add(classOcupado);

        const bRect = box.getBoundingClientRect();
        const targetX = (bRect.left - cRect.left) + bRect.width / 2;
        const targetY = (bRect.top - cRect.top) + bRect.height / 2;

        let wrapper = area.querySelector(`.car-wrapper[data-id="${uniqueId}"]`);
        let icon, timerBadge;

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = `car-wrapper ${typeClass}`;
            wrapper.dataset.id = uniqueId;

            icon = document.createElement('img');
            icon.className = 'auto-icon';
            icon.src = landingCarImageSrc;

            timerBadge = document.createElement('div');
            timerBadge.className = 'car-timer';
            timerBadge.textContent = timerText;

            wrapper.appendChild(icon);
            wrapper.appendChild(timerBadge);
            area.appendChild(wrapper);

            // Nacer por debajo del carril de entrada (Cajas 7 y 8 de espera)
            let isOddLane = [0, 2, 4, 6].includes(state.espera ? state.espera.findIndex(e => e && e.id && e.id.toString() === uniqueId) : -1);
            let entryBoxNum = isOddLane ? 29 : 30;
            let entryCell = area.querySelector(`[data-box-number="${entryBoxNum}"]`);
            let startX = targetX;
            let startY = targetY + 150;

            if (entryCell) {
                let entryRect = entryCell.getBoundingClientRect();
                startX = (entryRect.left - cRect.left) + (entryRect.width / 2);
                startY = (entryRect.top - cRect.top) + (entryRect.height / 2) + 250;
            }

            let simState = {
                x: startX,
                y: startY,
                targetX: targetX,
                targetY: targetY,
                angle: rotateDeg,
                desiredAngle: rotateDeg,
                wrapper: wrapper,
                icon: icon,
                timerBadge: timerBadge,
                etaSalidaEspera: carObj ? carObj.etaSalidaEspera : null,
                endTime: carObj ? carObj.endTime : null,
                timerText: timerText,
                stateName: stateName
            };
            landingSimCars.set(uniqueId, simState);
            wrapper.style.left = `${simState.x}px`;
            wrapper.style.top = `${simState.y}px`;
        } else {
            icon = wrapper.querySelector('.auto-icon');
            timerBadge = wrapper.querySelector('.car-timer');
            let simState = landingSimCars.get(uniqueId);
            if (!simState) {
                simState = {
                    x: targetX,
                    y: targetY,
                    targetX: targetX,
                    targetY: targetY,
                    angle: rotateDeg,
                    desiredAngle: rotateDeg,
                    wrapper: wrapper,
                    icon: icon,
                    timerBadge: timerBadge,
                    etaSalidaEspera: carObj ? carObj.etaSalidaEspera : null,
                    endTime: carObj ? carObj.endTime : null,
                    timerText: timerText,
                    stateName: stateName
                };
                landingSimCars.set(uniqueId, simState);
            } else {
                simState.targetX = targetX;
                simState.targetY = targetY;
                simState.desiredAngle = rotateDeg;
                if (carObj && carObj.etaSalidaEspera) simState.etaSalidaEspera = carObj.etaSalidaEspera;
                if (carObj && carObj.endTime) simState.endTime = carObj.endTime;
                simState.timerText = timerText;
                simState.stateName = stateName;
            }

            wrapper.className = `car-wrapper ${typeClass}`;
        }
    }

    // Tiempos reales desde la configuración del dashboard
    const msLavado = state.tiempo_lavado_ms || 120000;
    const msSecado = state.tiempo_secado_ms || 180000;
    const minLavado = Math.round(msLavado / 60000);
    const minSecado = Math.round(msSecado / 60000);
    const minPorTurno = minLavado + minSecado;

    if (state.espera || state.lavado || state.secado || state.terminado) {
        if (Array.isArray(state.espera)) {
            state.espera.forEach((item, index) => {
                if (item && ESPERA_ZONES[index]) {
                    const totalMin = (index + 1) * minPorTurno;
                    const timeStr = `${totalMin.toString().padStart(2, '0')}:00`;
                    const type = (item.tipo === 'completo_auto' || item.tipo === 'completo_camioneta' || item.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
                    placeCar(ESPERA_ZONES[index], timeStr, '#fde047', 0, type, item.id || `esp-${index}`, item, 'espera');
                }
            });
        }

        if (state.lavado) {
            const item = state.lavado;
            const type = (item.tipo === 'completo_auto' || item.tipo === 'completo_camioneta' || item.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
            const lavMin = minLavado.toString().padStart(2, '0');
            placeCar(LAVADO_ZONE, `${lavMin}:00`, '#38bdf8', 270, type, item.id || 'lavado-1', item, 'lavado');
        }

        if (Array.isArray(state.secado)) {
            state.secado.forEach((item, index) => {
                if (item && SECADO_ZONES[index]) {
                    const type = (item.tipo === 'completo_auto' || item.tipo === 'completo_camioneta' || item.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
                    const secMin = minSecado.toString().padStart(2, '0');
                    placeCar(SECADO_ZONES[index], `${secMin}:00`, '#f59e0b', 270, type, item.id || `sec-${index}`, item, 'secado');
                }
            });
        }

        if (Array.isArray(state.terminado)) {
            state.terminado.forEach((item, index) => {
                if (item && TERMINADO_ZONES[index]) {
                    const type = (item.tipo === 'completo_auto' || item.tipo === 'completo_camioneta' || item.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
                    placeCar(TERMINADO_ZONES[index], '¡Listo!', '#34d399', 180, type, item.id || `term-${index}`, item, 'terminado');
                }
            });
        }
    } 
    else if (Array.isArray(state.cars)) {
        state.cars.forEach((c, idx) => {
            const type = (c.tipo === 'completo_auto' || c.tipo === 'completo_camioneta' || c.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
            const carKey = (c.id || idx).toString();
            if (c.slot && c.slot.startsWith('espera_')) {
                const sIdx = parseInt(c.slot.split('_')[1]) || 0;
                if (ESPERA_ZONES[sIdx]) {
                    const totalMin = (sIdx + 1) * minPorTurno;
                    const timeStr = `${totalMin.toString().padStart(2, '0')}:00`;
                    placeCar(ESPERA_ZONES[sIdx], timeStr, '#fde047', 0, type, carKey, c, 'espera');
                }
            } else if (c.slot === 'lavado') {
                const lavMin = minLavado.toString().padStart(2, '0');
                placeCar(LAVADO_ZONE, `${lavMin}:00`, '#38bdf8', 270, type, carKey, c, 'lavado');
            } else if (c.slot && (c.slot.startsWith('secado_') || c.slot.startsWith('interior_'))) {
                const sIdx = parseInt(c.slot.split('_')[1]) || 0;
                if (SECADO_ZONES[sIdx]) {
                    const secMin = minSecado.toString().padStart(2, '0');
                    placeCar(SECADO_ZONES[sIdx], `${secMin}:00`, '#f59e0b', 270, type, carKey, c, 'secado');
                }
            } else if (c.slot && c.slot.startsWith('terminado_')) {
                const sIdx = parseInt(c.slot.split('_')[1]) || 0;
                if (TERMINADO_ZONES[sIdx]) {
                    placeCar(TERMINADO_ZONES[sIdx], '¡Listo!', '#34d399', 180, type, carKey, c, 'terminado');
                }
            }
        });
    }

    // Limpiar autos inactivos con animación de salida hacia la derecha
    area.querySelectorAll('.car-wrapper').forEach(wrapper => {
        const id = wrapper.dataset.id;
        if (!activeCarIds.has(id)) {
            wrapper.style.left = '120%';
            wrapper.style.opacity = '0';
            landingSimCars.delete(id);
            setTimeout(() => {
                if (wrapper.parentNode) wrapper.remove();
            }, 1000);
        }
    });

    // Actualizar telemetría de la cabecera (Demora Total Estimada)
    const waitTimeEl = document.getElementById('live-wait-time');
    const landingWaitTimeEl = document.getElementById('landing-status-time');
    const landingBadgeEl = document.getElementById('landing-status-badge');

    let maxEta = Date.now();
    let autosEsperaCount = 0;

    if (Array.isArray(state.espera)) {
        state.espera.forEach(a => {
            if (a) {
                autosEsperaCount++;
                if (a.etaSalidaEspera && a.etaSalidaEspera > maxEta) {
                    maxEta = a.etaSalidaEspera;
                }
            }
        });
    }

    let remainingSegundos = Math.ceil((maxEta - Date.now()) / 1000);
    if (remainingSegundos < 0 || autosEsperaCount === 0) remainingSegundos = 0;

    const timeStr = formatLandingTime(remainingSegundos);

    if (waitTimeEl) waitTimeEl.textContent = timeStr;
    if (landingWaitTimeEl) landingWaitTimeEl.textContent = timeStr;

    if (landingBadgeEl) {
        landingBadgeEl.className = 'status-badge';
        if (autosEsperaCount === 0) {
            landingBadgeEl.textContent = 'Sin Demora';
            landingBadgeEl.classList.add('badge-libre');
        } else if (autosEsperaCount <= 4) {
            landingBadgeEl.textContent = 'Demora Normal';
            landingBadgeEl.classList.add('badge-normal');
        } else if (autosEsperaCount <= 6) {
            landingBadgeEl.textContent = 'Demora Alta';
            landingBadgeEl.classList.add('badge-alta');
        } else {
            landingBadgeEl.textContent = 'Cap. Máxima';
            landingBadgeEl.classList.add('badge-critica');
        }
    }
}

// ============================================================
// 4. PANTALLA DIGITAL DE SPONSORS / PUBLICIDAD EN LANDING
// ============================================================
function initLandingSponsors() {
    landingSponsorsList = [
        { id: 'sp-1', title: 'Pirelli P Zero', subtitle: 'Neumáticos de ultra alto rendimiento', type: 'image', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80' },
        { id: 'sp-2', title: 'Mobil 1 Super Synthetic', subtitle: 'Protección extrema para tu motor', type: 'image', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' },
        { id: 'sp-3', title: 'Brembo Racing', subtitle: 'Sistemas de frenos de alta precisión', type: 'image', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' }
    ];

    renderLandingSponsorSlide();
}

function renderLandingSponsorSlide() {
    const wrapper = document.getElementById('landing-screen-media-wrapper');
    const titleEl = document.getElementById('landing-sponsor-title');
    const subEl = document.getElementById('landing-sponsor-subtitle');

    if (!wrapper || landingSponsorsList.length === 0) return;

    const current = landingSponsorsList[currentLandingSponsorIndex];
    if (!current) return;

    if (titleEl) titleEl.textContent = current.title;
    if (subEl) subEl.textContent = current.subtitle || 'Sponsor Oficial';

    wrapper.innerHTML = `<img src="${current.url}" alt="${current.title}" style="width:100%; height:100%; object-fit:cover;">`;

    clearTimeout(landingSponsorTimer);
    landingSponsorTimer = setTimeout(() => {
        currentLandingSponsorIndex = (currentLandingSponsorIndex + 1) % landingSponsorsList.length;
        renderLandingSponsorSlide();
    }, 6000);
}

// ============================================================
// 5. POLING EN TIEMPO REAL VÍA DONWEB API
// ============================================================
function setupRealtimeSubscriptions() {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}configuracion.php`);
            if (res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                    landingConfig = { ...landingConfig, ...data };
                    updateLandingUI();
                    if (data.live_state) {
                        renderLandingCars(data.live_state);
                    }
                }
            }
        } catch (e) {}
    }, 4000);
}

function handleContactForm(e) {
    e.preventDefault();
    alert('¡Gracias por tu mensaje! Te responderemos a la brevedad por WhatsApp.');
    e.target.reset();
}

// ============================================================
// 6. INICIALIZACIÓN GLOBAL Y REDIBUJO CONTINUO DE PISTA
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadLandingConfig();
    initLandingTrackGrid();
    initLandingSponsors();
    fetchLandingLiveState();
    setupRealtimeSubscriptions();

    // Redibujar pista dinámicamente
    setInterval(drawLandingSVGTracks, 400);
    window.addEventListener('resize', drawLandingSVGTracks);
    window.addEventListener('load', drawLandingSVGTracks);

    // Fallback de sincronización periódica
    setInterval(() => {
        loadLandingConfig();
        fetchLandingLiveState();
    }, 5000);
});

// ============================================================
// 7. MANEJO DEL MENÚ LATERAL DESPLEGABLE (SIDEBAR DRAWER)
// ============================================================
function openSidebar() {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-menu');
    if (sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSidebar();
        closeDirectBookingModal();
    }
});

// --- Modal de Reserva Directa (Modo Cliente) ---
function openDirectBookingModal() {
    const modal = document.getElementById('direct-booking-modal');
    if (!modal) return;
    document.getElementById('booking-step-1').style.display = 'block';
    document.getElementById('booking-step-2').style.display = 'none';
    document.getElementById('modal-booking-error').style.display = 'none';
    document.getElementById('modal-input-plate').value = '';
    document.getElementById('modal-input-phone').value = '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeDirectBookingModal() {
    const modal = document.getElementById('direct-booking-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

async function submitDirectBooking() {
    const plateInput = document.getElementById('modal-input-plate');
    const serviceSelect = document.getElementById('modal-select-service');
    const phoneInput = document.getElementById('modal-input-phone');
    const errorDiv = document.getElementById('modal-booking-error');
    const btnConfirm = document.getElementById('modal-btn-confirm');

    const plate = (plateInput ? plateInput.value : '').trim().toUpperCase();
    const service = serviceSelect ? serviceSelect.value : 'express_auto';
    const phone = (phoneInput ? phoneInput.value : '').trim();

    if (!plate || plate.length < 5) {
        errorDiv.textContent = 'Por favor ingresá una patente válida (Ej: AA123BB).';
        errorDiv.style.display = 'block';
        return;
    }

    errorDiv.style.display = 'none';
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> INGRESANDO TURNO...";

    const serviceNames = {
        'express_auto': 'Lavado Express Auto',
        'express_camioneta': 'Lavado Express Camioneta',
        'completo_auto': 'Lavado Completo Auto (VIP)',
        'completo_camioneta': 'Lavado Completo Camioneta (VIP)'
    };

    try {
        const response = await fetch('api/reservas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente_nombre: 'Cliente Web',
                cliente_telefono: phone ? '+54 ' + phone : '',
                patente: plate,
                modelo_auto: service.includes('camioneta') ? 'Camioneta' : 'Auto',
                tipo_servicio: service,
                precio: 0,
                estado: 'pendiente'
            })
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
            throw new Error(resData.error || 'Error al procesar la reserva.');
        }

        document.getElementById('ticket-patente').textContent = plate;
        document.getElementById('ticket-servicio').textContent = serviceNames[service] || service;

        document.getElementById('booking-step-1').style.display = 'none';
        document.getElementById('booking-step-2').style.display = 'block';

        // Actualizar circuito en vivo inmediatamente
        if (typeof updateLandingMirror === 'function') {
            updateLandingMirror();
        }
    } catch (err) {
        errorDiv.textContent = err.message || 'Error al conectar con el servidor.';
        errorDiv.style.display = 'block';
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = "<i class='bx bx-check-circle' style='font-size: 1.3rem;'></i> CONFIRMAR MI TURNO";
    }
}

window.openDirectBookingModal = openDirectBookingModal;
window.closeDirectBookingModal = closeDirectBookingModal;
window.submitDirectBooking = submitDirectBooking;

// --- Visor de Convenios, Empresas & Apps (Estilo Noticias LED) ---
let convenioItems = [];
let convenioCurrentIndex = 0;
let convenioProgressInterval = null;
let convenioIsPlaying = true;
const CONVENIO_DURATION = 5000; // 5 segundos por noticia

async function initConveniosTicker() {
    try {
        const res = await fetch('api/sponsors.php');
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                convenioItems = data.filter(item => parseInt(item.activo) !== 0);
            }
        }
    } catch (e) {
        console.warn('Error al cargar convenios:', e);
    }

    if (!convenioItems || convenioItems.length === 0) {
        convenioItems = [
            { nombre: 'Socio Fundador Black', categoria: 'Socio Fundador', descripcion: 'Acceso prioritario VIP #1 en Pit Lane sin fila, 30% OFF en todos los lavados y encerado cerámico sin cargo.', logo_url: 'bx bx-crown', enlace: 'https://wa.me/5491123456789?text=Hola,%20quiero%20ser%20Socio%20Fundador%20Black' },
            { nombre: 'Socio Fundador Gold', categoria: 'Socio Fundador', descripcion: 'Atención preferencial en boxes, 20% OFF en todos los lavados y obsequio de perfumería en cada visita.', logo_url: 'bx bxs-award', enlace: 'https://wa.me/5491123456789?text=Hola,%20quiero%20ser%20Socio%20Fundador%20Gold' },
            { nombre: 'Uber, Cabify & DiDi Pro', categoria: 'Apps de Viajes', descripcion: '20% de descuento exclusivo en lavado completo para conductores de aplicaciones registradas.', logo_url: 'bx bxs-taxi', enlace: 'https://wa.me/5491123456789?text=Hola,%20soy%20conductor%20de%20app%20de%20viajes' },
            { nombre: 'Country Club Los Lagartos', categoria: 'Barrios Cerrados', descripcion: 'Atención prioritaria en Pit Lane y tarifa preferencial para residentes de Los Lagartos C.C. y zona.', logo_url: 'bx bx-home-alt', enlace: 'https://wa.me/5491123456789?text=Hola,%20soy%20residente%20de%20Los%20Lagartos' },
            { nombre: 'Empresas & Flotas Corporativas', categoria: 'Corporativo', descripcion: 'Planes de mantenimiento mensual con Factura A y facturación consolidada para flotas de empresas.', logo_url: 'bx bx-building-house', enlace: 'https://wa.me/5491123456789?text=Hola,%20quiero%20informacion%20para%20flota%20empresa' },
            { nombre: 'Remises & Taxis Pilar', categoria: 'Servicio Público', descripcion: 'Lavado express acelerado y combos especiales para unidades de agencias de remises y taxis de Pilar.', logo_url: 'bx bx-car', enlace: 'https://wa.me/5491123456789?text=Hola,%20soy%20remisero%20de%20Pilar' },
            { nombre: 'Mercado Pago & Bancos', categoria: 'Medios de Pago', descripcion: 'Promociones especiales y cuotas sin interés abonando con Mercado Pago y bancos adheridos.', logo_url: 'bx bx-credit-card', enlace: '#' },
            { nombre: 'Aseguradoras Partner', categoria: 'Beneficios', descripcion: 'Descuentos del 15% presentando póliza activa de La Caja, Sancor Seguros o Federación Patronal.', logo_url: 'bx bx-shield-quarter', enlace: '#' }
        ];
    }

    renderConvenioDots();
    showConvenioSlide(0);
    startConvenioAutoplay();
}

function renderConvenioDots() {
    const dotsContainer = document.getElementById('convenio-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = convenioItems.map((_, idx) => `
        <span onclick="goToConvenioSlide(${idx})" style="width: 8px; height: 8px; border-radius: 50%; background: ${idx === 0 ? '#38bdf8' : 'rgba(255,255,255,0.2)'}; cursor: pointer; transition: all 0.3s;" id="convenio-dot-${idx}"></span>
    `).join('');
}

function showConvenioSlide(index) {
    if (!convenioItems || convenioItems.length === 0) return;
    convenioCurrentIndex = (index + convenioItems.length) % convenioItems.length;
    const item = convenioItems[convenioCurrentIndex];

    const slideContent = document.getElementById('convenio-slide-content');
    const titleEl = document.getElementById('convenio-title');
    const catEl = document.getElementById('convenio-cat-badge');
    const descEl = document.getElementById('convenio-desc');
    const iconBox = document.getElementById('convenio-icon-box');
    const linkEl = document.getElementById('convenio-action-link');

    if (slideContent) {
        slideContent.style.opacity = '0';
        slideContent.style.transform = 'translateY(6px)';
    }

    setTimeout(() => {
        if (titleEl) titleEl.textContent = item.nombre;
        if (catEl) catEl.textContent = item.categoria || 'Convenio';
        if (descEl) descEl.textContent = item.descripcion || '';
        if (iconBox) {
            const iconClass = item.logo_url && item.logo_url.startsWith('bx') ? item.logo_url : 'bx bx-star';
            iconBox.innerHTML = `<i class='${iconClass}'></i>`;
        }
        if (linkEl) {
            linkEl.href = item.enlace && item.enlace !== '#' ? item.enlace : 'https://wa.me/5491123456789?text=' + encodeURIComponent('Hola, me interesa el convenio de ' + item.nombre);
        }

        // Actualizar indicadores (dots)
        convenioItems.forEach((_, idx) => {
            const dot = document.getElementById(`convenio-dot-${idx}`);
            if (dot) {
                dot.style.background = idx === convenioCurrentIndex ? '#38bdf8' : 'rgba(255,255,255,0.2)';
                dot.style.transform = idx === convenioCurrentIndex ? 'scale(1.3)' : 'scale(1)';
            }
        });

        if (slideContent) {
            slideContent.style.opacity = '1';
            slideContent.style.transform = 'translateY(0)';
        }
    }, 150);

    resetConvenioProgressBar();
}

function startConvenioAutoplay() {
    stopConvenioAutoplay();
    convenioIsPlaying = true;
    updatePauseBtnIcon();

    let startTime = Date.now();
    const progressBar = document.getElementById('convenio-progress-bar');

    convenioProgressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / CONVENIO_DURATION) * 100, 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (elapsed >= CONVENIO_DURATION) {
            nextConvenioSlide();
        }
    }, 50);
}

function stopConvenioAutoplay() {
    if (convenioProgressInterval) clearInterval(convenioProgressInterval);
    convenioIsPlaying = false;
    updatePauseBtnIcon();
}

function resetConvenioProgressBar() {
    const progressBar = document.getElementById('convenio-progress-bar');
    if (progressBar) progressBar.style.width = '0%';
}

function nextConvenioSlide() {
    showConvenioSlide(convenioCurrentIndex + 1);
    if (convenioIsPlaying) startConvenioAutoplay();
}

function prevConvenioSlide() {
    showConvenioSlide(convenioCurrentIndex - 1);
    if (convenioIsPlaying) startConvenioAutoplay();
}

function goToConvenioSlide(idx) {
    showConvenioSlide(idx);
    if (convenioIsPlaying) startConvenioAutoplay();
}

function toggleConvenioPlay() {
    if (convenioIsPlaying) {
        stopConvenioAutoplay();
    } else {
        startConvenioAutoplay();
    }
}

function updatePauseBtnIcon() {
    const btn = document.getElementById('btn-pause-convenio');
    if (btn) {
        btn.innerHTML = convenioIsPlaying ? "<i class='bx bx-pause'></i>" : "<i class='bx bx-play'></i>";
    }
}

window.nextConvenioSlide = nextConvenioSlide;
window.prevConvenioSlide = prevConvenioSlide;
window.goToConvenioSlide = goToConvenioSlide;
window.toggleConvenioPlay = toggleConvenioPlay;

document.addEventListener('DOMContentLoaded', () => {
    initConveniosTicker();
    initCamaraViewer();
});

// --- Visor de Cámara Real de Espera en Vivo (Polled cada 3 min) ---
let camaraCountdownSeconds = 180;
let camaraCountdownTimer = null;

async function fetchCamaraSnapshot() {
    const imgEl = document.getElementById('camara-real-img');
    const placeholderEl = document.getElementById('camara-placeholder');
    const timeEl = document.getElementById('camara-timestamp');

    try {
        const res = await fetch('api/camara.php');
        if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.has_camera && data.image_url) {
                if (imgEl) {
                    imgEl.src = data.image_url;
                    imgEl.style.display = 'block';
                }
                if (placeholderEl) placeholderEl.style.display = 'none';
                if (timeEl && data.timestamp) {
                    timeEl.textContent = 'Foto: ' + (data.timestamp.split(' ')[1] || data.timestamp);
                }
            } else {
                if (imgEl && !imgEl.src) imgEl.style.display = 'none';
                if (placeholderEl && (!imgEl || imgEl.style.display === 'none')) {
                    placeholderEl.style.display = 'block';
                }
            }
        }
    } catch (err) {
        console.warn('Error al consultar cámara:', err);
    }
}

function startCamaraCountdown() {
    if (camaraCountdownTimer) clearInterval(camaraCountdownTimer);
    camaraCountdownSeconds = 180;

    const timerEl = document.getElementById('camara-live-timer');

    camaraCountdownTimer = setInterval(() => {
        camaraCountdownSeconds--;
        if (camaraCountdownSeconds <= 0) {
            camaraCountdownSeconds = 180;
            fetchCamaraSnapshot();
        }

        if (timerEl) {
            const m = Math.floor(camaraCountdownSeconds / 60).toString().padStart(2, '0');
            const s = (camaraCountdownSeconds % 60).toString().padStart(2, '0');
            timerEl.textContent = `Actualiza en ${m}:${s}`;
        }
    }, 1000);
}

function initCamaraViewer() {
    fetchCamaraSnapshot();
    startCamaraCountdown();
}
