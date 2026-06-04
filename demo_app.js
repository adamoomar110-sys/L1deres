// Paletas de colores
const COLORES = ["#00f0ff", "#84cc16", "#ffb800", "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];

// --- ESTADO GLOBAL SIMPLIFICADO ---
let activeVehicles = [];

// --- DIBUJO DE AUTO SVG (ESTILO ARCADE VISTA SUPERIOR) ---
function getCarSvg(color) {
    return `
    <svg class="car-sprite" width="60" height="110" viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 10px ${color}55);">
        <!-- Spoiler -->
        <rect x="5" y="92" width="50" height="8" rx="2" fill="#18181b" />
        <rect x="10" y="90" width="8" height="6" fill="#27272a" />
        <rect x="42" y="90" width="8" height="6" fill="#27272a" />
        
        <!-- Ruedas -->
        <rect x="0" y="16" width="6" height="16" rx="2" fill="#09090b" />
        <rect x="54" y="16" width="6" height="16" rx="2" fill="#09090b" />
        <rect x="0" y="74" width="6" height="16" rx="2" fill="#09090b" />
        <rect x="54" y="74" width="6" height="16" rx="2" fill="#09090b" />

        <!-- Cuerpo Principal del Auto -->
        <rect x="6" y="8" width="48" height="88" rx="14" fill="${color}" />
        
        <!-- Franja de Carreras -->
        <rect x="26" y="8" width="8" height="88" fill="white" fill-opacity="0.15" />
        
        <!-- Parabrisas Delantero -->
        <path d="M12 36 C 12 36, 16 26, 30 26 C 44 26, 48 36, 48 36 L 42 42 L 18 42 Z" fill="#09090b" />
        
        <!-- Ventanillas Laterales -->
        <path d="M10 44 L 14 46 L 14 66 L 10 70 Z" fill="#09090b" />
        <path d="M50 44 L 46 46 L 46 66 L 50 70 Z" fill="#09090b" />
        
        <!-- Luneta Trasera -->
        <path d="M16 74 L 44 74 L 41 82 L 19 82 Z" fill="#09090b" />
        
        <!-- Capó / Detalles Delanteros -->
        <rect x="14" y="16" width="32" height="6" rx="1" fill="#18181b" fill-opacity="0.4" />
        
        <!-- Faros Delanteros -->
        <rect x="12" y="6" width="8" height="4" rx="1" fill="#fef08a" />
        <rect x="40" y="6" width="8" height="4" rx="1" fill="#fef08a" />
        
        <!-- Faros Traseros (Freno) -->
        <rect x="10" y="94" width="6" height="2" fill="#f87171" />
        <rect x="44" y="94" width="6" height="2" fill="#f87171" />
    </svg>
    `;
}

// --- SELECTORES DOM ---
const elTrackEspera = document.getElementById('track-espera');
const elTrackLavado = document.getElementById('track-lavado');
const elTrackTerminado = document.getElementById('track-terminado');

const elCounterEspera = document.getElementById('counter-espera');
const elCounterLavado = document.getElementById('counter-lavado');
const elCounterTerminado = document.getElementById('counter-terminado');

const elEtaDisplay = document.getElementById('eta-display');

// Generar HTML del auto
function createVehicleElement(car) {
    const container = document.createElement('div');
    container.className = 'vehicle-sprite-container';
    container.id = 'vehicle-' + car.id;
    if (car.zone === 'lavado') {
        container.classList.add('in-wash-glow');
    }
    container.setAttribute('data-id', car.id);

    // Sprite SVG
    const carSvg = getCarSvg(car.color);
    
    // Detalles del timer
    let timerHtml = '';
    if (car.zone === 'espera') {
        timerHtml = `<span class="timer-badge waiting" data-timer-type="waiting" data-start="${car.entered_at}">00:00</span>`;
    } else if (car.zone === 'lavado') {
        timerHtml = `
            <div class="timer-badge washing">
                <span data-timer-type="washing" data-start="${car.entered_at}">15:00</span>
            </div>
            <div class="wash-progress-bar">
                <div class="wash-progress-fill" data-progress-fill="${car.entered_at}" style="width: 0%"></div>
            </div>
        `;
    } else if (car.zone === 'terminado') {
        timerHtml = `<span class="timer-badge finished">🚀 LISTO</span>`;
    }

    // Rotación específica por zona para simular el circuito
    let rot = 0;
    if (car.zone === 'espera') rot = 180;
    if (car.zone === 'lavado') rot = 90;
    if (car.zone === 'retorno') rot = -90;

    // Posición exacta XY
    container.style.left = (car.pos_x !== undefined ? car.pos_x : 50) + '%';
    container.style.top = (car.pos_y !== undefined ? car.pos_y : 50) + '%';
    container.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(0.95)`;
    container.style.position = 'absolute';
    container.style.width = '80px';
    container.style.transition = 'left 0.1s linear, top 0.1s linear, transform 0.5s ease-in-out';
    container.style.pointerEvents = 'auto';

    // Para evitar que el texto se rote, invertimos la rotación en el label
    container.innerHTML = `
        ${carSvg}
        <div class="vehicle-label" style="transform: rotate(${-rot}deg); margin-top: ${rot===180?'-1rem':'0'};">
            <div style="font-weight:900; letter-spacing: 0.05em; font-family: var(--font-sans);">${car.nickname}</div>
            ${timerHtml}
        </div>
    `;

    return container;
}

// Render General
function renderAll() {
    const esperaVehicles = activeVehicles.filter(v => v.zone === 'espera');
    const lavadoVehicles = activeVehicles.filter(v => v.zone === 'lavado');
    const terminadoVehicles = activeVehicles.filter(v => v.zone === 'terminado');

    // Actualizar contadores
    elCounterEspera.innerText = esperaVehicles.length;
    elCounterLavado.innerText = lavadoVehicles.length;
    elCounterTerminado.innerText = terminadoVehicles.length;

    // Renderizar placeholders visuales en las pistas (solo background)
    elTrackEspera.innerHTML = esperaVehicles.length === 0 ? `
        <div class="empty-lane-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p>Línea Libre</p>
        </div>` : '';

    elTrackLavado.innerHTML = lavadoVehicles.length === 0 ? `
        <div class="empty-lane-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <p>Box Vacío</p>
        </div>` : '';

    elTrackTerminado.innerHTML = terminadoVehicles.length === 0 ? `
        <div class="empty-lane-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p>Esperando Salidas</p>
        </div>` : '';

    const elTrackRetorno = document.getElementById('track-retorno');
    if (elTrackRetorno) elTrackRetorno.innerHTML = '';

    // Actualizar o crear vehículos en el global-track
    const globalTrack = document.getElementById('global-track');
    if (globalTrack) {
        // Eliminar del DOM los que ya no están en activeVehicles
        Array.from(globalTrack.children).forEach(child => {
            const id = child.getAttribute('data-id');
            if (!activeVehicles.find(v => v.id === id)) {
                globalTrack.removeChild(child);
            }
        });

        // Crear o actualizar
        activeVehicles.forEach(car => {
            let el = document.getElementById('vehicle-' + car.id);
            if (!el) {
                globalTrack.appendChild(createVehicleElement(car));
            } else {
                // Actualizar posicion y rotacion
                let rot = 0;
                if (car.zone === 'espera') rot = 180;
                if (car.zone === 'lavado') rot = 90;
                if (car.zone === 'retorno') rot = -90;
                
                el.style.left = (car.pos_x !== undefined ? car.pos_x : 50) + '%';
                el.style.top = (car.pos_y !== undefined ? car.pos_y : 50) + '%';
                el.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(0.95)`;
                
                if (car.zone === 'lavado') el.classList.add('in-wash-glow');
                else el.classList.remove('in-wash-glow');
            }
        });
    }

    calculateETA();
}

// Helper para animar la salida por el carril de retorno
function retirarVehiculo(id) {
    const car = activeVehicles.find(v => v.id === id);
    if (car) {
        car.zone = 'retorno';
        car.entered_at = Date.now();
        renderAll();
        
        // Se elimina definitivamente de la simulación tras completar la animación (2.2 segundos)
        setTimeout(() => {
            activeVehicles = activeVehicles.filter(v => v.id !== id);
            renderAll();
        }, 2200);
    }
}

function calculateETA() {
    const esperaCount = activeVehicles.filter(v => v.zone === 'espera').length;
    const lavadoCount = activeVehicles.filter(v => v.zone === 'lavado').length;
    const etaMinutos = (esperaCount * 11) + (lavadoCount > 0 ? 11 : 0);

    if (etaMinutos === 0) {
        elEtaDisplay.innerText = "Sin Demoras 🎉";
        elEtaDisplay.className = "eta-value text-cyan";
    } else {
        elEtaDisplay.innerText = `~ ${etaMinutos} MINUTOS`;
        elEtaDisplay.className = "eta-value text-yellow";
    }
}

// Bucle en tiempo real para simular movimiento y segunderos rápidos
function startRealtimeTicker() {
    setInterval(() => {
        const now = Date.now();
        
        // Simulación de Movimiento Exacto (Posiciones XY)
        let needsRender = false;
        activeVehicles.forEach(car => {
            if (car.pos_x === undefined) car.pos_x = 16;
            if (car.pos_y === undefined) car.pos_y = 10; // Inicio arriba
            
            // Lógica de avance continuo según la zona
            if (car.zone === 'espera') {
                car.pos_x = 16; // Columna izquierda
                if (car.pos_y < 85) { car.pos_y += 0.4; needsRender = true; }
            } else if (car.zone === 'lavado') {
                car.pos_y = 50; // Centro vertical
                // Entra desde la izquierda hacia el centro
                if (car.pos_x < 50) { car.pos_x += 0.8; needsRender = true; }
            } else if (car.zone === 'terminado') {
                // Sale hacia arriba por la columna derecha
                car.pos_x = 84; 
                // Inicia desde abajo si recién llega
                if (car.pos_y > 85 && car.pos_y === 50) car.pos_y = 85;
                if (car.pos_y > 15) { car.pos_y -= 0.6; needsRender = true; }
            } else if (car.zone === 'retorno') {
                // Se retira por el techo hacia la izquierda
                car.pos_y = 5;
                car.pos_x -= 1.5; 
                needsRender = true;
            }
        });
        
        if (needsRender) renderAll();

        // Actualizar segunderos en fila de espera
        document.querySelectorAll('[data-timer-type="waiting"]').forEach(el => {
            const start = Number(el.getAttribute('data-start'));
            const elapsed = Math.floor((now - start) / 1000);
            
            // Hacemos que el segundero corra más rápido en el demo para dinamismo
            const demoSeconds = elapsed * 12; // 1 segundo real = 12 segundos demo
            const mm = Math.floor(demoSeconds / 60).toString().padStart(2, '0');
            const ss = (demoSeconds % 60).toString().padStart(2, '0');
            el.innerText = `${mm}:${ss}`;
        });

        // Actualizar cuenta regresiva de lavado
        document.querySelectorAll('[data-timer-type="washing"]').forEach(el => {
            const start = Number(el.getAttribute('data-start'));
            const elapsed = Math.floor((now - start) / 1000);
            const totalWashingDemoSecs = 11 * 60; // 11 minutos de lavado nominales
            
            // Lavado rápido en demo: el lavado dura 11 segundos reales (660 seg demo)
            const demoWashedSecs = Math.min(totalWashingDemoSecs, elapsed * 60);
            const remainingSecs = Math.max(0, totalWashingDemoSecs - demoWashedSecs);
            
            const mm = Math.floor(remainingSecs / 60).toString().padStart(2, '0');
            const ss = (remainingSecs % 60).toString().padStart(2, '0');
            el.innerText = `${mm}:${ss}`;
        });

        // Actualizar barra de progreso de lavado
        document.querySelectorAll('.wash-progress-fill').forEach(el => {
            const start = Number(el.getAttribute('data-progress-fill'));
            const elapsed = Math.floor((now - start) / 1000);
            const percent = Math.min(100, Math.floor((elapsed / 11) * 100)); // 11 segundos reales para completar la barra
            el.style.width = `${percent}%`;
        });
    }, 100);
}

// --- GESTOR DINÁMICO DE COLA ---
let autoIdCounter = 1;
const NOMBRES = ["Rayo", "Toro", "Halcón", "Puma", "Tigre", "Furia", "Centella", "Cometa"];
const ADJETIVOS = ["Azul", "Rojo", "Gris", "Plata", "Verde", "Negro", "Dorado"];

function generarAutoRandom() {
    const color = COLORES[Math.floor(Math.random() * COLORES.length)];
    const nombre = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]}`;
    return {
        id: (autoIdCounter++).toString(),
        nickname: nombre,
        color: color,
        zone: 'espera',
        entered_at: Date.now()
    };
}

function processQueueLogic() {
    const now = Date.now();
    const lavadoVehicles = activeVehicles.filter(v => v.zone === 'lavado');
    const esperaVehicles = activeVehicles.filter(v => v.zone === 'espera');
    const terminadoVehicles = activeVehicles.filter(v => v.zone === 'terminado');

    // 1. Limpiar terminados después de unos segundos
    terminadoVehicles.forEach(car => {
        const elapsed = (now - car.entered_at) / 1000;
        if (elapsed > 4) { // Se queda 4 segundos en terminado antes de salir
            retirarVehiculo(car.id);
        }
    });

    // 2. Mover de lavado a terminado si ya pasaron 11 segundos reales
    lavadoVehicles.forEach(car => {
        const elapsed = (now - car.entered_at) / 1000;
        if (elapsed >= 11) {
            car.zone = 'terminado';
            car.entered_at = Date.now();
            renderAll();
        }
    });

    // 3. Mover de espera a lavado SOLAMENTE si lavado está completamente vacío
    if (activeVehicles.filter(v => v.zone === 'lavado').length === 0) {
        if (esperaVehicles.length > 0) {
            // Ordenar por tiempo de llegada (el más antiguo primero)
            esperaVehicles.sort((a, b) => a.entered_at - b.entered_at);
            const nextCar = esperaVehicles[0];
            nextCar.zone = 'lavado';
            nextCar.entered_at = Date.now();
            renderAll();
        }
    }

    // 4. Agregar autos aleatorios a la cola si hay pocos (máximo 4 en espera)
    if (activeVehicles.filter(v => v.zone === 'espera').length < 4 && Math.random() < 0.2) {
        activeVehicles.push(generarAutoRandom());
        renderAll();
    }
}

// Iniciar Secuencia
window.addEventListener('DOMContentLoaded', () => {
    // Autos iniciales
    activeVehicles.push(generarAutoRandom());
    activeVehicles.push(generarAutoRandom());
    
    startRealtimeTicker();
    
    // Loop de lógica de cola cada 1 segundo
    setInterval(processQueueLogic, 1000);
});
