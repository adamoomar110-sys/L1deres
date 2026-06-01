// Paletas de apodos y colores para el generador
const NOMBRES = ["Rayo", "Toro", "Halcón", "Puma", "Tigre", "Furia", "Centella", "Cometa", "Flecha", "Viento", "Cobra", "Trueno", "Ciclón", "Pantera", "Lobo", "Apolo", "Fénix"];
const ADJETIVOS = ["Azul", "Rojo", "Gris", "Plata", "Verde", "Negro", "Dorado", "Feroz", "Veloz", "Oscuro", "Blanco", "Brillante", "Neon", "Rápido", "Relámpago"];
const COLORES = ["#00f0ff", "#84cc16", "#ffb800", "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];

const WASH_NAMES = {
    'combo-limpieza-total': 'Combo Limpieza Total 🌀',
    'combo-vip-gold': 'Combo VIP Gold 🏆',
    'lavado-carroceria': 'Lavado Exterior Simple 🚗',
    'aspirado-interior': 'Aspirado e Interior Pro 💨',
    'lavado-express': 'Lavado Express ⚡',
    'lavado-motor': 'Limpieza de Motor a Vapor 🔥',
    'encerado-acrilico': 'Encerado Acrílico Sellador 🛡️',
    'lavado-chasis': 'Limpieza de Chasis & Motor 🔩',
    'pulido-opticas': 'Restauración de Ópticas 💡',
    'tratamiento-ceramico': 'Tratamiento Cerámico 9H 💎'
};

// --- ESTADO GLOBAL ---
let activeVehicles = [];
let washHistory = [];
let config = {
    useSupabase: false,
    supabaseUrl: '',
    supabaseKey: '',
    queueTable: 'lavadero_camera_queue',
    serviceTable: 'service_orders'
};
let isSimulationActive = false;
let simulationIntervalId = null;
let realtimeTickerId = null;

// --- DIBUJO DE AUTO SVG (ESTILO ARCADE VISTA SUPERIOR) ---
function getCarSvg(color) {
    return `
    <svg class="car-sprite" width="60" height="110" viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 10px ${color}33);">
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
const elRevenueReal = document.getElementById('revenue-real-display');
const elRevenueProj = document.getElementById('revenue-proj-display');
const elConnectionStatus = document.getElementById('connection-status-pill');

const elFormRegister = document.getElementById('form-register-car');
const elInputNickname = document.getElementById('input-nickname');
const elInputPlate = document.getElementById('input-plate');
const elInputColor = document.getElementById('input-color');
const elInputBudget = document.getElementById('input-budget');
const elColorHexLabel = document.getElementById('color-hex-label');

const elOperatorTableBody = document.getElementById('operator-table-body');
const elHistoryTableBody = document.getElementById('history-table-body');

const elHistoryTotalCount = document.getElementById('history-total-count');
const elHistoryTotalRevenue = document.getElementById('history-total-revenue');

// Modales & Tabs
const elBtnConfig = document.getElementById('btn-config');
const elBtnSimulation = document.getElementById('btn-simulation');
const elModalConfig = document.getElementById('modal-config');
const elBtnCloseModal = document.getElementById('btn-close-modal');
const elCheckUseSupabase = document.getElementById('check-use-supabase');
const elSupabaseFields = document.getElementById('supabase-fields');
const elSupabaseUrl = document.getElementById('supabase-url');
const elSupabaseKey = document.getElementById('supabase-key');
const elSupabaseTable = document.getElementById('supabase-table');
const elSupabaseServiceTable = document.getElementById('supabase-service-table');
const elBtnSaveConfig = document.getElementById('btn-save-config');
const elBtnClearHistory = document.getElementById('btn-clear-history');

// --- CARGAR CONFIGURACIÓN REMOTA DESDE VERCEL ENV ---
async function loadRemoteConfig() {
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const data = await res.json();
            if (data.supabaseUrl && data.supabaseKey) {
                config.useSupabase = true;
                config.supabaseUrl = data.supabaseUrl;
                config.supabaseKey = data.supabaseKey;
                config.queueTable = data.queueTable || 'lavadero_camera_queue';
                config.serviceTable = data.serviceTable || 'service_orders';
                console.log("🔌 Configuración de Supabase cargada desde Vercel Environment Variables.");
                
                // Actualizar la interfaz para reflejar que está conectado externamente
                if (elConnectionStatus) {
                    elConnectionStatus.className = "connection-status supabase-active";
                    elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";
                }
            }
        }
    } catch (err) {
        console.warn("⚠️ No se pudo obtener la configuración remota (usando fallback local):", err);
    }
}

// --- CARGAR DATOS LOCALES ---
function loadLocalData() {
    // Config
    const savedConfig = localStorage.getItem('lavadero_config');
    if (savedConfig) {
        // Solo sobreescribir si no se cargó remotamente de Vercel
        const loadedConfig = JSON.parse(savedConfig);
        if (!config.useSupabase) {
            config = loadedConfig;
        } else {
            // Mantener las credenciales de Supabase del server pero recuperar otras preferencias si existieran
            config.useSupabase = true;
        }
    }
    
    // Vehículos Activos
    const savedVehicles = localStorage.getItem('lavadero_active_vehicles');
    if (savedVehicles) {
        activeVehicles = JSON.parse(savedVehicles);
    }

    // Historial
    const savedHistory = localStorage.getItem('lavadero_completed_history');
    if (savedHistory) {
        washHistory = JSON.parse(savedHistory);
    }

    // Aplicar a los inputs del modal
    elCheckUseSupabase.checked = config.useSupabase;
    elSupabaseUrl.value = config.supabaseUrl || '';
    elSupabaseKey.value = config.supabaseKey || '';
    elSupabaseTable.value = config.queueTable || 'lavadero_camera_queue';
    elSupabaseServiceTable.value = config.serviceTable || 'service_orders';

    if (config.useSupabase) {
        elSupabaseFields.classList.remove('hidden');
    }
}

// --- CONEXIÓN DE DATOS & SYNC SUPABASE ---
async function fetchSupabase(endpoint, options = {}) {
    if (!config.useSupabase || !config.supabaseUrl || !config.supabaseKey) return null;
    
    const url = `${config.supabaseUrl}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    const combinedOptions = {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, combinedOptions);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error en respuesta: ${response.status} - ${errText}`);
        }
        if (response.status === 204) return true;
        return await response.json();
    } catch (err) {
        console.error("❌ Fallo en API Supabase:", err);
        showFloatingToast(`Error de base de datos externa. Operando en modo local.`);
        return null;
    }
}

// Mostrar avisos flotantes estilo premium
function showFloatingToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.backgroundColor = 'rgba(255, 59, 48, 0.95)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.color = '#fff';
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '1rem';
    toast.style.zIndex = '10000';
    toast.style.fontFamily = 'var(--font-sans)';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '700';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(1rem)';
    toast.style.transition = 'all 0.3s ease';

    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(1rem)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Cargar estado de cola de Supabase si está activado
async function syncFromSupabase() {
    if (!config.useSupabase) return;
    
    // Cambiar visualización
    elConnectionStatus.className = "connection-status supabase-active";
    elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";

    const data = await fetchSupabase(`${config.queueTable}?select=*&order=entered_at.asc`);
    if (data && Array.isArray(data)) {
        // Mapear los datos de Supabase a nuestro modelo local
        activeVehicles = data.map(dbCar => {
            let washType = 'combo-limpieza-total';
            if (dbCar.description) {
                for (const key in WASH_NAMES) {
                    if (dbCar.description.toLowerCase().includes(key.toLowerCase()) || 
                        dbCar.description.toLowerCase().includes(WASH_NAMES[key].toLowerCase())) {
                        washType = key;
                        break;
                    }
                }
            }
            return {
                id: dbCar.id,
                tracking_id: dbCar.tracking_id || Math.floor(Math.random() * 100),
                nickname: dbCar.nickname || 'Vehículo Especial',
                plate: dbCar.plate || '',
                color: dbCar.color || '#06b6d4',
                zone: dbCar.zone || 'espera',
                budget: dbCar.budget || 0,
                wash_type: dbCar.wash_type || washType,
                description: dbCar.description || '',
                entered_at: dbCar.entered_at || new Date().toISOString(),
                created_at: dbCar.created_at || new Date().toISOString()
            };
        });
        saveStateLocally(false); // Guardar copia local sin re-escribir a Supabase
        renderAll();
    }
}

// Guardar estados
async function saveStateLocally(syncRemote = true) {
    localStorage.setItem('lavadero_active_vehicles', JSON.stringify(activeVehicles));
    localStorage.setItem('lavadero_completed_history', JSON.stringify(washHistory));

    // Si la sincronización remota está habilitada y se solicita sync
    if (config.useSupabase && syncRemote) {
        // En una app robusta, haríamos sincronizaciones granulares. Aquí reflejamos los cambios individuales
        // pero como plan de contingencia guardamos en local por si falla el API.
    }
}

// --- OPERACIONES DE VEHÍCULOS ---

// Agregar Vehículo
async function addVehicle(nickname, plate, color, budgetStr, washType) {
    const budget = budgetStr ? parseFloat(budgetStr) : 0;
    const wType = washType || 'combo-limpieza-total';
    const washName = WASH_NAMES[wType] || 'Combo Limpieza Total';
    const newCar = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        tracking_id: Math.floor(Math.random() * 900) + 100,
        nickname,
        plate: plate.toUpperCase(),
        color,
        zone: 'espera',
        budget,
        wash_type: wType,
        description: `Servicio: ${washName}. Lavado estándar y detallado de carrocería.`,
        entered_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    };

    activeVehicles.push(newCar);
    saveStateLocally(true);

    if (config.useSupabase) {
        // Registrar en lavadero_camera_queue de Supabase
        await fetchSupabase(config.queueTable, {
            method: 'POST',
            body: JSON.stringify({
                id: newCar.id,
                tracking_id: newCar.tracking_id,
                nickname: newCar.nickname,
                zone: newCar.zone,
                color: newCar.color,
                entered_at: newCar.entered_at
            })
        });

        // Crear una orden de servicio si la tabla está configurada
        await fetchSupabase(config.serviceTable, {
            method: 'POST',
            body: JSON.stringify({
                vehicle_id: newCar.id,
                provider_type: 'lavadero',
                status: 'pending',
                budget: newCar.budget,
                description: newCar.description,
                appointment_date: newCar.entered_at
            })
        });
    }

    renderAll();
}

// Cambiar Zona de un Vehículo
async function updateVehicleZone(id, targetZone) {
    const car = activeVehicles.find(v => v.id === id);
    if (!car) return;

    car.zone = targetZone;
    car.entered_at = new Date().toISOString(); // Resetear temporizador de zona

    saveStateLocally(true);

    if (config.useSupabase) {
        // Actualizar zona en cola de cámara
        await fetchSupabase(`${config.queueTable}?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                zone: targetZone,
                entered_at: car.entered_at
            })
        });
    }

    renderAll();
}

// Finalizar Trabajo y Liberar Unidad
async function finishVehicle(id) {
    const index = activeVehicles.findIndex(v => v.id === id);
    if (index === -1) return;

    const car = activeVehicles[index];
    
    // Crear registro de historial
    const historyItem = {
        id: car.id,
        nickname: car.nickname,
        plate: car.plate || 'SIN PATENTE',
        budget: car.budget || 0,
        completed_at: new Date().toISOString()
    };

    washHistory.unshift(historyItem); // Insertar al inicio
    activeVehicles.splice(index, 1);  // Remover de activos

    saveStateLocally(true);

    if (config.useSupabase) {
        // Eliminar de la cola de cámara
        await fetchSupabase(`${config.queueTable}?id=eq.${id}`, {
            method: 'DELETE'
        });

        // Actualizar la orden de servicio en Supabase
        // Buscamos orden pendiente del lavadero
        const orders = await fetchSupabase(`${config.serviceTable}?vehicle_id=eq.${id}&provider_type=eq.lavadero&status=eq.pending`);
        if (orders && orders.length > 0) {
            await fetchSupabase(`${config.serviceTable}?id=eq.${orders[0].id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed' })
            });
        }
    }

    renderAll();
}

// Eliminar vehículo (Cancelar lavado)
async function deleteVehicle(id) {
    const index = activeVehicles.findIndex(v => v.id === id);
    if (index === -1) return;
    
    activeVehicles.splice(index, 1);
    saveStateLocally(true);

    if (config.useSupabase) {
        await fetchSupabase(`${config.queueTable}?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    renderAll();
}

// --- RENDERIZADO VISUAL ---

// Generar HTML del auto en su contenedor
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
            <div>${car.nickname}</div>
            ${timerHtml}
        </div>
    `;

    // Interacción al hacer clic para abrir gestión rápida
    container.addEventListener('click', () => {
        highlightTableRow(car.id);
    });

    return container;
}

// Resaltar fila de la tabla de operaciones para llamar atención
function highlightTableRow(id) {
    const row = document.getElementById(`row-op-${id}`);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.backgroundColor = 'rgba(0, 240, 255, 0.15)';
        row.style.transition = 'background-color 0.15s ease';
        setTimeout(() => {
            row.style.backgroundColor = '';
        }, 1200);
    }
}

// Render General
function renderAll() {
    // 1. Limpiar carriles
    elTrackEspera.innerHTML = '';
    elTrackLavado.innerHTML = '';
    elTrackTerminado.innerHTML = '';

    const esperaVehicles = activeVehicles.filter(v => v.zone === 'espera');
    const lavadoVehicles = activeVehicles.filter(v => v.zone === 'lavado');
    const terminadoVehicles = activeVehicles.filter(v => v.zone === 'terminado');

    // Actualizar contadores
    elCounterEspera.innerText = esperaVehicles.length;
    elCounterLavado.innerText = lavadoVehicles.length;
    elCounterTerminado.innerText = terminadoVehicles.length;

    // Renderizar autos
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

    // 2. Renderizar tabla de operaciones
    renderOperatorTable();

    // 3. Renderizar historial
    renderHistory();

    // 4. Calcular Demora Estimada (ETA)
    calculateETA();

    // 5. Calcular Ganancias en Tiempo Real
    calculateRevenue();
}

// Calcular Demora Estimada
function calculateETA() {
    const esperaCount = activeVehicles.filter(v => v.zone === 'espera').length;
    const lavadoCount = activeVehicles.filter(v => v.zone === 'lavado').length;
    
    // 15 min por auto en espera + 8 min si hay alguno lavándose
    const etaMinutos = (esperaCount * 15) + (lavadoCount > 0 ? 8 : 0);

    if (etaMinutos === 0) {
        elEtaDisplay.innerText = "Sin Demoras 🎉";
        elEtaDisplay.className = "eta-value text-cyan";
    } else {
        elEtaDisplay.innerText = `~ ${etaMinutos} MINUTOS`;
        elEtaDisplay.className = "eta-value text-yellow";
    }
}

// Calcular Ganancias en Tiempo Real
function calculateRevenue() {
    if (!elRevenueReal || !elRevenueProj) return;

    // Real: Total de trabajos finalizados (historial)
    const realRevenue = washHistory.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    
    // Proyectado: Autos actualmente en la cola (activos)
    const projectedRevenue = activeVehicles.reduce((acc, curr) => acc + (curr.budget || 0), 0);

    elRevenueReal.innerText = `$${realRevenue.toLocaleString('es-AR')}`;
    elRevenueProj.innerText = `$${projectedRevenue.toLocaleString('es-AR')}`;
}

// Renderizar la tabla de mesa de control
function renderOperatorTable() {
    elOperatorTableBody.innerHTML = '';
    
    if (activeVehicles.length === 0) {
        elOperatorTableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="5" style="text-align: center; color: var(--color-text-dim); font-style: italic; padding: 2rem 0;">
                    Sin vehículos en circulación. Registra uno arriba para comenzar.
                </td>
            </tr>`;
        return;
    }

    activeVehicles.forEach(car => {
        const tr = document.createElement('tr');
        tr.id = `row-op-${car.id}`;
        
        tr.innerHTML = `
            <td>
                <div class="car-badge-name">
                    <span class="car-color-dot" style="background-color: ${car.color}; box-shadow: 0 0 6px ${car.color}"></span>
                    <div>
                        <div style="font-weight: 800; color: var(--color-text);">${car.nickname}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-dim); margin-top: 0.2rem; font-weight: 700;">${WASH_NAMES[car.wash_type] || 'Combo Limpieza Total'}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="plate-badge">${car.plate || 'SIN PATENTE'}</span>
            </td>
            <td>
                <span class="budget-val">$${Number(car.budget || 0).toLocaleString()}</span>
            </td>
            <td>
                <select class="select-zone-dropdown" data-car-id="${car.id}">
                    <option value="espera" ${car.zone === 'espera' ? 'selected' : ''}>1. Espera</option>
                    <option value="lavado" ${car.zone === 'lavado' ? 'selected' : ''}>2. Lavando</option>
                    <option value="terminado" ${car.zone === 'terminado' ? 'selected' : ''}>3. Terminado</option>
                </select>
            </td>
            <td>
                <div class="table-actions" style="flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-sm btn-qr-link" data-car-id="${car.id}" title="Copiar Link Cliente">
                        🔗 Link
                    </button>
                    ${car.zone === 'terminado' ? `
                        <button class="btn btn-primary btn-sm btn-finish-car" data-car-id="${car.id}">
                            Entregar
                        </button>
                        <button class="btn btn-sm btn-whatsapp" style="background-color:#25D366; color:#fff;" data-car-id="${car.id}">
                            WhatsApp
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-sm btn-advance-car" data-car-id="${car.id}">
                            Avanzar
                        </button>
                    `}
                    <button class="btn btn-danger btn-sm btn-delete-car btn-icon" data-car-id="${car.id}" title="Eliminar/Cancelar">
                        &times;
                    </button>
                </div>
            </td>
        `;

        // Listeners
        tr.querySelector('.select-zone-dropdown').addEventListener('change', (e) => {
            updateVehicleZone(car.id, e.target.value);
        });

        const advanceBtn = tr.querySelector('.btn-advance-car');
        if (advanceBtn) {
            advanceBtn.addEventListener('click', () => {
                const nextZone = car.zone === 'espera' ? 'lavado' : 'terminado';
                updateVehicleZone(car.id, nextZone);
            });
        }

        const finishBtn = tr.querySelector('.btn-finish-car');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                finishVehicle(car.id);
            });
        }

        tr.querySelector('.btn-delete-car').addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que deseas eliminar a ${car.nickname} de la cola?`)) {
                deleteVehicle(car.id);
            }
        });

        const qrBtn = tr.querySelector('.btn-qr-link');
        if (qrBtn) {
            qrBtn.addEventListener('click', () => {
                const colorHex = car.color.replace('#', '');
                let baseUrl = window.location.origin + window.location.pathname;
                baseUrl = baseUrl.replace('index.html', '');
                if(!baseUrl.endsWith('/')) baseUrl += '/';
                const url = `${baseUrl}cliente.html?n=${encodeURIComponent(car.nickname)}&c=${colorHex}&p=${encodeURIComponent(car.plate || 'SIN PATENTE')}&z=${car.zone}&t=${encodeURIComponent(car.wash_type || 'combo-limpieza-total')}`;
                navigator.clipboard.writeText(url).then(() => {
                    showFloatingToast("Enlace del cliente copiado al portapapeles.");
                });
            });
        }

        const wpBtn = tr.querySelector('.btn-whatsapp');
        if (wpBtn) {
            wpBtn.addEventListener('click', () => {
                const text = encodeURIComponent(`¡Hola! Tu vehículo ${car.nickname} ya está listo y brillante. Te esperamos en Lavadero Tech System.`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
            });
        }

        elOperatorTableBody.appendChild(tr);
    });
}

// Renderizar Historial de lavados terminados
function renderHistory() {
    elHistoryTableBody.innerHTML = '';
    
    // Calcular estadísticas
    elHistoryTotalCount.innerText = washHistory.length;
    
    const revenue = washHistory.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    elHistoryTotalRevenue.innerText = `$${revenue.toLocaleString()}`;

    if (washHistory.length === 0) {
        elHistoryTableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="4" style="text-align: center; color: var(--color-text-dim); padding: 1.5rem 0;">
                    No hay historial de lavados registrados.
                </td>
            </tr>`;
        return;
    }

    washHistory.forEach(item => {
        const tr = document.createElement('tr');
        const dateStr = new Date(item.completed_at).toLocaleDateString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${item.nickname}</td>
            <td><span class="plate-badge">${item.plate}</span></td>
            <td><span class="budget-val">$${Number(item.budget).toLocaleString()}</span></td>
        `;
        elHistoryTableBody.appendChild(tr);
    });
}

// --- TICKERS EN TIEMPO REAL (RELOJES Y PROGRESO) ---
function startRealtimeTicker() {
    if (realtimeTickerId) clearInterval(realtimeTickerId);

    realtimeTickerId = setInterval(() => {
        const now = new Date().getTime();

        // 1. Relojes en espera (cuenta hacia arriba)
        document.querySelectorAll('[data-timer-type="waiting"]').forEach(el => {
            const startStr = el.getAttribute('data-start');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const totalSecs = Math.max(0, Math.floor((now - start) / 1000));
                
                const mins = Math.floor(totalSecs / 60);
                const secs = totalSecs % 60;
                el.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        });

        // 2. Relojes y barra en lavado (cuenta regresiva de 15 minutos)
        document.querySelectorAll('[data-timer-type="washing"]').forEach(el => {
            const startStr = el.getAttribute('data-start');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                const totalWashingSecs = 15 * 60; // 15 minutos
                const remainingSecs = Math.max(0, totalWashingSecs - elapsedSecs);

                const mins = Math.floor(remainingSecs / 60);
                const secs = remainingSecs % 60;
                el.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        });

        document.querySelectorAll('[data-progress-fill]').forEach(el => {
            const startStr = el.getAttribute('data-progress-fill');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                const totalWashingSecs = 15 * 60;
                const percent = Math.min(100, Math.floor((elapsedSecs / totalWashingSecs) * 100));
                el.style.width = `${percent}%`;
            }
        });
    }, 1000);
}

// --- MODULO SIMULADOR DE TRÁFICO AUTOMÁTICO ---
function toggleSimulation() {
    isSimulationActive = !isSimulationActive;
    
    if (isSimulationActive) {
        elBtnSimulation.classList.add('active');
        elBtnSimulation.querySelector('.pulse-indicator').style.backgroundColor = 'var(--color-lime)';
        showFloatingToast("Simulador de tráfico activado. Eventos cada 12 segundos.");

        simulationIntervalId = setInterval(runSimulationStep, 12000);
        runSimulationStep(); // Ejecutar primer paso de inmediato
    } else {
        elBtnSimulation.classList.remove('active');
        elBtnSimulation.querySelector('.pulse-indicator').style.backgroundColor = '';
        showFloatingToast("Simulador de tráfico desactivado.");

        if (simulationIntervalId) {
            clearInterval(simulationIntervalId);
            simulationIntervalId = null;
        }
    }
}

function runSimulationStep() {
    const rand = Math.random();
    const numCars = activeVehicles.length;

    // Decisión de acción
    if (rand < 0.35 && numCars < 6) {
        // Acción: Agregar
        const nick = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]}`;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const plate = `${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}${Math.floor(Math.random()*900+100)}${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}`;
        const color = COLORES[Math.floor(Math.random() * COLORES.length)];
        const budget = Math.floor(Math.random() * 15000) + 10000;

        addVehicle(nick, plate, color, budget);
        console.log(`🤖 [SIMULADOR] Nuevo auto registrado: ${nick} (${plate})`);

    } else if (rand < 0.70 && numCars > 0) {
        // Acción: Mover
        const esperaCars = activeVehicles.filter(v => v.zone === 'espera');
        const lavadoCars = activeVehicles.filter(v => v.zone === 'lavado');

        if (lavadoCars.length > 0 && (esperaCars.length === 0 || Math.random() > 0.5)) {
            // Mover de lavado a terminado
            const target = lavadoCars[Math.floor(Math.random() * lavadoCars.length)];
            updateVehicleZone(target.id, 'terminado');
            console.log(`🤖 [SIMULADOR] Auto finalizó lavado: ${target.nickname}`);
        } else if (esperaCars.length > 0) {
            // Mover de espera a lavado
            const target = esperaCars[Math.floor(Math.random() * esperaCars.length)];
            updateVehicleZone(target.id, 'lavado');
            console.log(`🤖 [SIMULADOR] Auto entró a lavado: ${target.nickname}`);
        }

    } else if (rand < 0.90 && numCars > 0) {
        // Acción: Entregar/Retirar
        const terminadoCars = activeVehicles.filter(v => v.zone === 'terminado');
        if (terminadoCars.length > 0) {
            const target = terminadoCars[Math.floor(Math.random() * terminadoCars.length)];
            finishVehicle(target.id);
            console.log(`🤖 [SIMULADOR] Cliente retiró auto: ${target.nickname}`);
        }
    }
}

// --- CONFIGURACIÓN & MODAL ---

// Modal Toggle
elBtnConfig.addEventListener('click', () => {
    elModalConfig.classList.add('active');
    renderHistory(); // Re-render por si cambió algo
});

elBtnCloseModal.addEventListener('click', () => {
    elModalConfig.classList.remove('active');
});

elModalConfig.addEventListener('click', (e) => {
    if (e.target === elModalConfig) {
        elModalConfig.classList.remove('active');
    }
});

// Toggle campos de Supabase
elCheckUseSupabase.addEventListener('change', (e) => {
    if (e.target.checked) {
        elSupabaseFields.classList.remove('hidden');
    } else {
        elSupabaseFields.classList.add('hidden');
    }
});

// Tab Switch en Modal
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Desactivar todos los botones de tab y ocultar contenido
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

        // Activar el actual
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(targetTab).classList.remove('hidden');
    });
});

// Guardar Configuración
elBtnSaveConfig.addEventListener('click', async () => {
    config.useSupabase = elCheckUseSupabase.checked;
    config.supabaseUrl = elSupabaseUrl.value.trim();
    config.supabaseKey = elSupabaseKey.value.trim();
    config.queueTable = elSupabaseTable.value.trim() || 'lavadero_camera_queue';
    config.serviceTable = elSupabaseServiceTable.value.trim() || 'service_orders';

    localStorage.setItem('lavadero_config', JSON.stringify(config));
    
    // Cerrar modal
    elModalConfig.classList.remove('active');
    showFloatingToast("Configuración guardada.");

    // Aplicar
    if (config.useSupabase) {
        if (!config.supabaseUrl || !config.supabaseKey) {
            showFloatingToast("Error: Faltan credenciales de Supabase");
            config.useSupabase = false;
            elCheckUseSupabase.checked = false;
            elSupabaseFields.classList.add('hidden');
            localStorage.setItem('lavadero_config', JSON.stringify(config));
        } else {
            showFloatingToast("Conectando con Supabase...");
            await syncFromSupabase();
        }
    } else {
        // Volver a modo local
        elConnectionStatus.className = "connection-status";
        elConnectionStatus.querySelector('.status-label').innerText = "Modo Local";
        // Cargar lo que tengamos localmente
        const savedVehicles = localStorage.getItem('lavadero_active_vehicles');
        if (savedVehicles) {
            activeVehicles = JSON.parse(savedVehicles);
        }
        renderAll();
    }
});

// Limpiar historial
elBtnClearHistory.addEventListener('click', () => {
    if (confirm("¿Estás completamente seguro de borrar todo el historial y estadísticas de recaudación local?")) {
        washHistory = [];
        saveStateLocally(false);
        renderAll();
        showFloatingToast("Historial borrado.");
    }
});

// --- INICIALIZACIÓN ---

// Cambiar color label
elInputColor.addEventListener('input', (e) => {
    elColorHexLabel.innerText = e.target.value.toUpperCase();
});

// Formulario de Registro
const elInputWashType = document.getElementById('input-wash-type');

if (elInputWashType) {
    elInputWashType.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        elInputBudget.value = price;
    });
}

elFormRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = elInputNickname.value.trim();
    const plate = elInputPlate.value.trim();
    const color = elInputColor.value;
    const budget = elInputBudget.value;
    const washType = elInputWashType ? elInputWashType.value : 'combo-limpieza-total';

    addVehicle(nickname, plate, color, budget, washType);

    // Resetear formulario
    elInputNickname.value = '';
    elInputPlate.value = '';
    if (elInputWashType) elInputWashType.value = 'combo-limpieza-total';
    elInputBudget.value = '18000';
    
    // Enfocar apodo para el siguiente
    elInputNickname.focus();
    
    showFloatingToast(`Vehículo ${nickname} registrado.`);
});

// Toggle Botón Simulación
elBtnSimulation.addEventListener('click', () => {
    toggleSimulation();
});

// Arrancar Aplicación
window.addEventListener('DOMContentLoaded', async () => {
    // Intentar cargar primero la configuración de Vercel/Supabase remota
    await loadRemoteConfig();
    loadLocalData();
    renderAll();
    startRealtimeTicker();

    // Sincronizar de inmediato si Supabase está activo
    if (config.useSupabase) {
        syncFromSupabase();
        // Polling de sincronización cada 10 segundos
        setInterval(syncFromSupabase, 10000);
    }
});
