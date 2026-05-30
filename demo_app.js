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
        timerHtml = `<span class="timer-badge finished">✔ LISTO</span>`;
    }

    container.innerHTML = `
        ${carSvg}
        <div class="vehicle-label">
            <div style="font-weight:900; letter-spacing: 0.05em; font-family: var(--font-sans);">${car.nickname}</div>
            ${timerHtml}
        </div>
    `;

    return container;
}

// Render General
function renderAll() {
    elTrackEspera.innerHTML = '';
    elTrackLavado.innerHTML = '';
    elTrackTerminado.innerHTML = '';
    
    const elTrackRetorno = document.getElementById('track-retorno');
    if (elTrackRetorno) {
        elTrackRetorno.innerHTML = '';
    }

    const esperaVehicles = activeVehicles.filter(v => v.zone === 'espera');
    const lavadoVehicles = activeVehicles.filter(v => v.zone === 'lavado');
    const terminadoVehicles = activeVehicles.filter(v => v.zone === 'terminado');
    const retornoVehicles = activeVehicles.filter(v => v.zone === 'retorno');

    // Actualizar contadores
    elCounterEspera.innerText = esperaVehicles.length;
    elCounterLavado.innerText = lavadoVehicles.length;
    elCounterTerminado.innerText = terminadoVehicles.length;

    // Renderizar espera
    if (esperaVehicles.length === 0) {
        elTrackEspera.innerHTML = `
            <div class="empty-lane-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <p>Línea Libre</p>
            </div>`;
    } else {
        esperaVehicles.forEach(car => {
            elTrackEspera.appendChild(createVehicleElement(car));
        });
    }

    // Renderizar lavado
    if (lavadoVehicles.length === 0) {
        elTrackLavado.innerHTML = `
            <div class="empty-lane-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <p>Box Vacío</p>
            </div>`;
    } else {
        lavadoVehicles.forEach(car => {
            elTrackLavado.appendChild(createVehicleElement(car));
        });
    }

    // Renderizar terminado
    if (terminadoVehicles.length === 0) {
        elTrackTerminado.innerHTML = `
            <div class="empty-lane-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p>Esperando Salidas</p>
            </div>`;
    } else {
        terminadoVehicles.forEach(car => {
            elTrackTerminado.appendChild(createVehicleElement(car));
        });
    }

    // Renderizar retorno de vehículos en tránsito
    if (elTrackRetorno && retornoVehicles.length > 0) {
        retornoVehicles.forEach(car => {
            elTrackRetorno.appendChild(createVehicleElement(car));
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
    const etaMinutos = (esperaCount * 15) + (lavadoCount > 0 ? 8 : 0);

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
            const totalWashingDemoSecs = 15 * 60; // 15 minutos de lavado nominales
            
            // Lavado rápido en demo: el lavado dura 10 segundos reales (900 seg demo)
            const demoWashedSecs = Math.min(totalWashingDemoSecs, elapsed * 90);
            const remainingSecs = Math.max(0, totalWashingDemoSecs - demoWashedSecs);
            
            const mm = Math.floor(remainingSecs / 60).toString().padStart(2, '0');
            const ss = (remainingSecs % 60).toString().padStart(2, '0');
            el.innerText = `${mm}:${ss}`;
        });

        // Actualizar barra de progreso de lavado
        document.querySelectorAll('.wash-progress-fill').forEach(el => {
            const start = Number(el.getAttribute('data-progress-fill'));
            const elapsed = Math.floor((now - start) / 1000);
            const percent = Math.min(100, Math.floor((elapsed / 10) * 100)); // 10 segundos reales para completar la barra
            el.style.width = `${percent}%`;
        });
    }, 100);
}

// --- SECUENCIA DE EVENTOS PREPROGRAMADA ---
const scriptEvents = [
    // t = 0: Estado Inicial
    {
        time: 0,
        action: () => {
            activeVehicles = [
                { id: "1", nickname: "Toro Rojo", color: "#ef4444", zone: "espera", entered_at: Date.now() },
                { id: "2", nickname: "Rayo Azul", color: "#00f0ff", zone: "lavado", entered_at: Date.now() }
            ];
            renderAll();
        }
    },
    // t = 2 segundos: Entra un auto a espera y Rayo Azul termina lavado
    {
        time: 2000,
        action: () => {
            // Rayo Azul pasa a terminado
            const rayo = activeVehicles.find(v => v.id === "2");
            if (rayo) {
                rayo.zone = "terminado";
                rayo.entered_at = Date.now();
            }
            // Entra Fénix Dorado a espera
            activeVehicles.push({ id: "3", nickname: "Fénix Dorado", color: "#ffb800", zone: "espera", entered_at: Date.now() });
            renderAll();
        }
    },
    // t = 4.5 segundos: Toro Rojo entra a lavado y Rayo Azul sale
    {
        time: 4500,
        action: () => {
            // Toro Rojo pasa a lavado
            const toro = activeVehicles.find(v => v.id === "1");
            if (toro) {
                toro.zone = "lavado";
                toro.entered_at = Date.now();
            }
            // Rayo Azul es retirado vía carril de retorno
            retirarVehiculo("2");
        }
    },
    // t = 7.5 segundos: Fénix Dorado entra a lavado y entra Lobo Negro a espera
    {
        time: 7500,
        action: () => {
            // Fénix Dorado pasa a lavado
            const fenix = activeVehicles.find(v => v.id === "3");
            if (fenix) {
                fenix.zone = "lavado";
                fenix.entered_at = Date.now();
            }
            // Entra Lobo Negro a espera
            activeVehicles.push({ id: "4", nickname: "Lobo Negro", color: "#a855f7", zone: "espera", entered_at: Date.now() });
            renderAll();
        }
    },
    // t = 10.5 segundos: Toro Rojo pasa a terminado
    {
        time: 10500,
        action: () => {
            // Toro Rojo pasa a terminado
            const toro = activeVehicles.find(v => v.id === "1");
            if (toro) {
                toro.zone = "terminado";
                toro.entered_at = Date.now();
            }
            // Entra Halcón Verde a espera
            activeVehicles.push({ id: "5", nickname: "Halcón Verde", color: "#84cc16", zone: "espera", entered_at: Date.now() });
            renderAll();
        }
    },
    // t = 13.5 segundos: Lobo Negro entra a lavado y Toro Rojo es retirado
    {
        time: 13500,
        action: () => {
            // Lobo Negro pasa a lavado
            const lobo = activeVehicles.find(v => v.id === "4");
            if (lobo) {
                lobo.zone = "lavado";
                lobo.entered_at = Date.now();
            }
            // Toro Rojo es retirado vía carril de retorno
            retirarVehiculo("1");
        }
    }
];

// Iniciar Secuencia
window.addEventListener('DOMContentLoaded', () => {
    startRealtimeTicker();
    
    // Programar todos los eventos
    scriptEvents.forEach(evt => {
        setTimeout(evt.action, evt.time);
    });

    // Loop infinito del demo cada 16 segundos para mantenerlo vivo si el usuario lo ve en vivo
    setInterval(() => {
        scriptEvents.forEach(evt => {
            if (evt.time > 0) {
                setTimeout(evt.action, evt.time);
            } else {
                evt.action();
            }
        });
    }, 16000);
});
