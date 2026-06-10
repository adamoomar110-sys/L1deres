// Paletas de apodos y colores para el generador
const NOMBRES = ["Rayo", "Toro", "Halcón", "Puma", "Tigre", "Furia", "Centella", "Cometa", "Flecha", "Viento", "Cobra", "Trueno", "Ciclón", "Pantera", "Lobo", "Apolo", "Fénix"];
const ADJETIVOS = ["Azul", "Rojo", "Gris", "Plata", "Verde", "Negro", "Dorado", "Feroz", "Veloz", "Oscuro", "Blanco", "Brillante", "Neon", "Rápido", "Relámpago"];
const COLORES = ["#00f0ff", "#84cc16", "#ffb800", "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];

const DEFAULT_WASH_PACKAGES = [
    { id: 'combo-limpieza-total', title: 'Limpieza Total', icon: 'ðŸŒ€', price: 18000, category: 'combos', items: ['Lavado exterior espuma activa', 'Aspirado alfombras/butacas', 'Limpieza cristales/pantallas', 'Silicona y perfumado clásico'] },
    { id: 'combo-vip-gold', title: 'VIP Gold', icon: 'ðŸ†', price: 25000, category: 'combos', items: ['Lavado pH neutro artesanal', 'Descontaminado de pintura', 'Encerado Carnauba brasileña', 'Aspirado con vapor'] },
    { id: 'lavado-carroceria', title: 'Exterior Simple', icon: 'ðŸš—', price: 12000, category: 'lavados', items: ['Lavado shampoo pH balanceado', 'Secado manual microfibra', 'Acondicionado de neumáticos'] },
    { id: 'aspirado-interior', title: 'Interior Pro', icon: 'ðŸ’¨', price: 10000, category: 'lavados', items: ['Aspirado butacas y paneles', 'Desinfección de contacto', 'Acondicionado de plásticos'] },
    { id: 'lavado-express', title: 'Express', icon: 'âš¡', price: 8000, category: 'lavados', items: ['Lavado exterior a presión', 'Secado rápido', 'Brillo básico de cubiertas'] },
    { id: 'lavado-motor', title: 'Motor Vapor', icon: 'ðŸ”¥', price: 15000, category: 'especiales', items: ['Limpieza técnica a vapor', 'Desengrasantes biodegradables', 'Protector dieléctrico plásticos'] },
    { id: 'encerado-acrilico', title: 'Encerado', icon: 'ðŸ›¡ï¸', price: 22000, category: 'estetica', items: ['Lavado artesanal descontaminante', 'Cera selladora acrílica manual', 'Efecto hidrofóbico extremo'] },
    { id: 'lavado-chasis', title: 'Chasis', icon: 'ðŸ”©', price: 28000, category: 'especiales', items: ['Limpieza chasis inferior', 'Desengrasado pesado a vapor', 'Protector antioxidante metal'] },
    { id: 'pulido-opticas', title: 'Ópticas', icon: 'ðŸ’¡', price: 16000, category: 'estetica', items: ['Lijado al agua multietapa', 'Pulido de policarbonato', 'Sellado UV de ópticas'] },
    { id: 'tratamiento-ceramico', title: 'Cerámico 9H', icon: 'ðŸ’Ž', price: 65000, category: 'estetica', items: ['Corrección de pintura 2 etapas', 'Sellador cerámico 9H importado', 'Protección contra rayones UV'], active: true }
];

let WASH_PACKAGES = [];
let WASH_NAMES = {};

function initWashPackages() {
    const saved = localStorage.getItem('lavadero_wash_settings');
    if (saved) {
        WASH_PACKAGES = JSON.parse(saved);
    } else {
        WASH_PACKAGES = [...DEFAULT_WASH_PACKAGES];
        localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
    }
    WASH_NAMES = {};
    WASH_PACKAGES.forEach(pkg => {
        WASH_NAMES[pkg.id] = `${pkg.title} ${pkg.icon}`;
    });
}
initWashPackages();

let selectedWashTypes = ['combo-limpieza-total'];

// --- ESTADO GLOBAL ---
let activeVehicles = [];
let washHistory = [];
let empleados = [];
let insumos = [];
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
const elInputCategory = document.getElementById('input-category');
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
                console.log("ðŸ”Œ Configuración de Supabase cargada desde Vercel Environment Variables.");
                
                // Actualizar la interfaz para reflejar que está conectado externamente
                if (elConnectionStatus) {
                    elConnectionStatus.className = "connection-status supabase-active";
                    elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";
                }
            }
        }
    } catch (err) {
        console.warn("âš ï¸ No se pudo obtener la configuración remota (usando fallback local):", err);
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
async function syncFromSupabase() {
    if (!config.useSupabase || !config.supabaseUrl || !config.supabaseKey) return;
    
    isSyncing = true;
    updateConnectionStatus("Syncing...");

    try {
        // 1. Cargar cola de cámara
        const queueData = await fetchSupabase(config.queueTable);
        if (queueData && Array.isArray(queueData)) {
            activeVehicles = queueData;
            localStorage.setItem('lavadero_active_vehicles', JSON.stringify(activeVehicles));
        }

        // 2. Cargar órdenes completadas (Historial)
        const historyData = await fetchSupabase(`${config.serviceTable}?status=eq.completed`);
        if (historyData && Array.isArray(historyData)) {
            const historyMap = historyData.map(h => ({
                id: h.vehicle_id || h.id,
                plate: h.description ? h.description.split(' - ')[0] : '???',
                nickname: h.description ? h.description.split(' - ')[1] : 'Historial',
                budget: h.budget,
                completed_at: h.appointment_date || h.created_at
            }));
            
            // Unir local con remoto sin duplicados
            const localHist = JSON.parse(localStorage.getItem('lavadero_completed_history') || '[]');
            const combined = [...historyMap, ...localHist];
            const uniqueHistory = Array.from(new Map(combined.map(item => [item.id, item])).values());
            
            washHistory = uniqueHistory.sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at));
            localStorage.setItem('lavadero_completed_history', JSON.stringify(washHistory));
        }
        
        // 3. Cargar Empleados
        const empData = await fetchSupabase('lavadero_empleados');
        if (empData && Array.isArray(empData)) {
            empleados = empData;
            localStorage.setItem('lavadero_empleados', JSON.stringify(empleados));
        }
        
        // 4. Cargar Insumos
        const insData = await fetchSupabase('lavadero_insumos');
        if (insData && Array.isArray(insData)) {
            insumos = insData;
            localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
        }

        updateConnectionStatus("Connected");
        renderAll();
    } catch (e) {
        console.error("Error sincronizando de Supabase:", e);
        updateConnectionStatus("Error", "bg-danger");
    } finally {
        isSyncing = false;
    }
}

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
        console.error("âŒ Fallo en API Supabase:", err);
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
    
    // Mostrar modal QR al registrar
    showQrModal(newCar);
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
        timerHtml = `<span class="timer-badge finished">âœ” LISTO</span>`;
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
        elEtaDisplay.innerText = "Sin Demoras ðŸŽ‰";
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
                        ðŸ”— Link
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
                showQrModal(car);
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
    
    const filterDate = document.getElementById('filter-history-date')?.value;
    const filterName = document.getElementById('filter-history-name')?.value.toLowerCase();
    
    let filtered = washHistory;
    
    if (filterDate) {
        // filterDate is YYYY-MM-DD. We compare against item.completed_at ISO string start.
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.completed_at).toISOString().split('T')[0];
            return itemDate === filterDate;
        });
    }
    
    if (filterName) {
        filtered = filtered.filter(item => 
            (item.nickname && item.nickname.toLowerCase().includes(filterName)) ||
            (item.plate && item.plate.toLowerCase().includes(filterName))
        );
    }
    
    // Calcular estadísticas sobre los resultados FILTRADOS
    elHistoryTotalCount.innerText = filtered.length;
    
    const revenue = filtered.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    elHistoryTotalRevenue.innerText = `$${revenue.toLocaleString()}`;

    if (filtered.length === 0) {
        elHistoryTableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="4" style="text-align: center; color: var(--color-text-dim); padding: 1.5rem 0;">
                    No hay resultados para esta búsqueda.
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(item => {
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

document.getElementById('filter-history-date')?.addEventListener('change', renderHistory);
document.getElementById('filter-history-name')?.addEventListener('input', renderHistory);

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
        console.log(`ðŸ¤– [SIMULADOR] Nuevo auto registrado: ${nick} (${plate})`);

    } else if (rand < 0.70 && numCars > 0) {
        // Acción: Mover
        const esperaCars = activeVehicles.filter(v => v.zone === 'espera');
        const lavadoCars = activeVehicles.filter(v => v.zone === 'lavado');

        if (lavadoCars.length > 0 && (esperaCars.length === 0 || Math.random() > 0.5)) {
            // Mover de lavado a terminado
            const target = lavadoCars[Math.floor(Math.random() * lavadoCars.length)];
            updateVehicleZone(target.id, 'terminado');
            console.log(`ðŸ¤– [SIMULADOR] Auto finalizó lavado: ${target.nickname}`);
        } else if (esperaCars.length > 0) {
            // Mover de espera a lavado
            const target = esperaCars[Math.floor(Math.random() * esperaCars.length)];
            updateVehicleZone(target.id, 'lavado');
            console.log(`ðŸ¤– [SIMULADOR] Auto entró a lavado: ${target.nickname}`);
        }

    } else if (rand < 0.90 && numCars > 0) {
        // Acción: Entregar/Retirar
        const terminadoCars = activeVehicles.filter(v => v.zone === 'terminado');
        if (terminadoCars.length > 0) {
            const target = terminadoCars[Math.floor(Math.random() * terminadoCars.length)];
            finishVehicle(target.id);
            console.log(`ðŸ¤– [SIMULADOR] Cliente retiró auto: ${target.nickname}`);
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

// Función para renderizar el menú interactivo
function renderWashMenu() {
    const grid = document.getElementById('wash-menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    WASH_PACKAGES.forEach(pkg => {
        const card = document.createElement('div');
        card.className = `wash-menu-card ${pkg.id === selectedWashType ? 'selected' : ''}`;
        card.setAttribute('data-id', pkg.id);
        card.setAttribute('data-price', pkg.price);

        card.innerHTML = `
            <div class="check-badge">âœ“</div>
            <div class="wash-card-icon">${pkg.icon}</div>
            <div class="wash-card-title">${pkg.title}</div>
            <div class="wash-card-price">$${pkg.price.toLocaleString('es-AR')}</div>
        `;

        card.addEventListener('click', () => {
            selectedWashType = pkg.id;
            elInputBudget.value = pkg.price;
            if(window.renderWashMenuOverride) window.renderWashMenuOverride(); else renderWashMenu(); // Re-render to update selected class
        });

        grid.appendChild(card);
    });
}

// Formulario de Registro
elFormRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = elInputNickname.value.trim();
    const plate = elInputPlate.value.trim();
    const color = elInputColor.value;
    const budget = elInputBudget.value;
    const washType = selectedWashTypes.join(',');

    addVehicle(nickname, plate, color, budget, washType);

    // Resetear formulario
    elInputNickname.value = '';
    elInputPlate.value = '';
    selectedWashTypes = ['combo-limpieza-total'];
    elInputBudget.value = '18000';
    renderWashMenu();
    
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
    renderWashMenu();
    renderAll();
    startRealtimeTicker();

    // Sincronizar de inmediato si Supabase está activo
    if (config.useSupabase) {
        syncFromSupabase();
        // Polling de sincronización cada 10 segundos
        setInterval(syncFromSupabase, 10000);
    }
});

// --- Lï¿½GICA DE NAVEGACIï¿½N (SIDEBAR) ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remover active de todos los botones
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // Agregar active al botï¿½n clickeado
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');

        // Ocultar todas las vistas
        document.querySelectorAll('.view-section').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });

        // Mostrar la vista objetivo
        const targetView = targetBtn.getAttribute('data-target');
        const viewEl = document.getElementById(targetView);
        if (viewEl) {
            viewEl.classList.remove('hidden');
            viewEl.classList.add('active');
        }

        // Si entramos a ciertas vistas, refrescamos
        if (targetView === 'view-empleados') renderEmpleados();
        if (targetView === 'view-insumos') renderInsumos();
        if (targetView === 'view-precios') renderPrecios();
    });
});

// --- Lï¿½GICA DE EMPLEADOS ---
const formEmpleado = document.getElementById('form-empleado');
const tbodyEmpleados = document.getElementById('empleados-tbody');

if (formEmpleado) {
    formEmpleado.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('emp-name').value;
        const hours = document.getElementById('emp-hours').value;
        const role = document.getElementById('emp-role').value;
        
        const newEmp = { 
            id: Date.now(), 
            date: new Date().toISOString().split('T')[0],
            name, 
            hours: parseInt(hours),
            role 
        };
        
        empleados.push(newEmp);
        localStorage.setItem('lavadero_empleados', JSON.stringify(empleados));
        
        if (config.useSupabase) {
            await fetchSupabase('lavadero_empleados', {
                method: 'POST',
                body: JSON.stringify(newEmp)
            });
        }
        
        document.getElementById('emp-name').value = '';
        document.getElementById('emp-hours').value = '8';
        renderEmpleados();
        showFloatingToast('Jornada registrada exitosamente');
    });
}

function renderEmpleados() {
    const saved = localStorage.getItem('lavadero_empleados');
    if (saved) empleados = JSON.parse(saved);
    
    if (!tbodyEmpleados) return;
    tbodyEmpleados.innerHTML = '';
    
    const filterDate = document.getElementById('filter-emp-date')?.value;
    const filterName = document.getElementById('filter-emp-name')?.value.toLowerCase();
    
    let filtered = empleados;
    if (filterDate) {
        filtered = filtered.filter(e => e.date === filterDate);
    }
    if (filterName) {
        filtered = filtered.filter(e => e.name.toLowerCase().includes(filterName));
    }
    
    if (filtered.length === 0) {
        tbodyEmpleados.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-dim);">No hay registros</td></tr>';
        return;
    }

    // Sort by newest first
    filtered.sort((a, b) => b.id - a.id).forEach(emp => {
        const tr = document.createElement('tr');
        const displayDate = emp.date ? new Date(emp.date + 'T00:00:00').toLocaleDateString() : '-';
        tr.innerHTML = `
            <td>${displayDate}</td>
            <td>${emp.name}</td>
            <td><span class="plate-badge">${emp.role}</span></td>
            <td>${emp.hours || 0} hs</td>
            <td class="print-visible">
                <button class="btn btn-primary btn-sm" onclick="editarEmpleado(${emp.id})" style="margin-right: 5px;">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarEmpleado(${emp.id})">Eliminar</button>
            </td>
        `;
        tbodyEmpleados.appendChild(tr);
    });
}

// Escuchar cambios en los filtros
document.getElementById('filter-emp-date')?.addEventListener('change', renderEmpleados);
document.getElementById('filter-emp-name')?.addEventListener('input', renderEmpleados);

window.eliminarEmpleado = async function(id) {
    empleados = empleados.filter(e => e.id !== id);
    localStorage.setItem('lavadero_empleados', JSON.stringify(empleados));
    
    if (config.useSupabase) {
        await fetchSupabase(`lavadero_empleados?id=eq.${id}`, {
            method: 'DELETE'
        });
    }
    
    renderEmpleados();
};

window.editarEmpleado = async function(id) {
    const emp = empleados.find(e => e.id === id);
    if (!emp) return;
    const newHours = prompt(`Modificar horas de ${emp.name} (actual: ${emp.hours}):`, emp.hours);
    if (newHours !== null && newHours.trim() !== '' && !isNaN(newHours)) {
        emp.hours = parseInt(newHours);
        localStorage.setItem('lavadero_empleados', JSON.stringify(empleados));
        if (config.useSupabase) {
            await fetchSupabase(`lavadero_empleados?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ hours: emp.hours })
            });
        }
        renderEmpleados();
        showFloatingToast('Horas actualizadas');
    }
};

// --- Lï¿½GICA DE INSUMOS ---
const formInsumo = document.getElementById('form-insumo');
const tbodyInsumos = document.getElementById('insumos-tbody');

if (formInsumo) {
    formInsumo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('ins-name').value.trim();
        const stockToAdd = parseInt(document.getElementById('ins-stock').value) || 0;
        
        // Buscar si ya existe
        const existingInsumo = insumos.find(i => i.name.toLowerCase() === name.toLowerCase());
        
        if (existingInsumo) {
            existingInsumo.stock += stockToAdd;
            localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
            
            if (config.useSupabase) {
                await fetchSupabase(`lavadero_insumos?id=eq.${existingInsumo.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ stock: existingInsumo.stock })
                });
            }
            showFloatingToast(`Stock actualizado: ${existingInsumo.name}`);
        } else {
            const newIns = { id: Date.now(), name, stock: stockToAdd };
            insumos.push(newIns);
            localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
            
            if (config.useSupabase) {
                await fetchSupabase('lavadero_insumos', {
                    method: 'POST',
                    body: JSON.stringify(newIns)
                });
            }
            showFloatingToast('Nuevo insumo agregado');
        }
        
        document.getElementById('ins-name').value = '';
        document.getElementById('ins-stock').value = '10';
        renderInsumos();
        showFloatingToast('Insumo agregado');
    });
}

function renderInsumos() {
    const saved = localStorage.getItem('lavadero_insumos');
    if (saved) insumos = JSON.parse(saved);
    
    // Semilla de Insumos Predeterminados (15)
    if (insumos.length === 0) {
        const predefinidos = [
            "Shampoo pH Neutro", "Cera de Carnauba", "Silicona Interior", 
            "Limpia Motores", "Acondicionador de Plásticos", "Desengrasante Multiuso", 
            "Limpia Vidrios", "Cepillos de Limpieza", "Paños de Microfibra", 
            "Revividor de Neumáticos", "Ambientador Líquido", "APC (All Purpose Cleaner)",
            "Limpia Llantas", "Esponjas de Lavado", "Sellador Acrílico"
        ];
        
        predefinidos.forEach((nombre, idx) => {
            insumos.push({ id: Date.now() + idx, name: nombre, stock: 123 });
        });
        localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
        
        if (config.useSupabase) {
            // Mandar todos a Supabase en bloque o iterando
            // Simplificado para no hacer 15 peticiones juntas, asume local por ahora si falla
            insumos.forEach(async (ins) => {
                fetchSupabase('lavadero_insumos', { method: 'POST', body: JSON.stringify(ins) });
            });
        }
    }

    // Llenar datalist para autocompletado
    const datalist = document.getElementById('insumos-list');
    if (datalist) {
        datalist.innerHTML = '';
        const nombresUnicos = [...new Set(insumos.map(i => i.name))];
        nombresUnicos.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            datalist.appendChild(option);
        });
    }

    if (!tbodyInsumos) return;
    tbodyInsumos.innerHTML = '';
    
    const filterName = document.getElementById('filter-ins-name')?.value.toLowerCase();
    
    let filtered = insumos;
    if (filterName) {
        filtered = filtered.filter(i => i.name.toLowerCase().includes(filterName));
    }
    
    if (filtered.length === 0) {
        tbodyInsumos.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-text-dim);">No hay insumos registrados</td></tr>';
        return;
    }

    filtered.forEach(ins => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ins.name}</td>
            <td><span class="badge ${ins.stock < 5 ? 'bg-danger' : 'bg-success'}">${ins.stock} unid.</span></td>
            <td class="print-visible">
                <button class="btn btn-primary btn-sm" onclick="editarInsumo(${ins.id})" style="margin-right: 5px;">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarInsumo(${ins.id})">Eliminar</button>
            </td>
        `;
        tbodyInsumos.appendChild(tr);
    });
}

document.getElementById('filter-ins-name')?.addEventListener('input', renderInsumos);

window.eliminarInsumo = async function(id) {
    insumos = insumos.filter(i => i.id !== id);
    localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
    
    if (config.useSupabase) {
        await fetchSupabase(`lavadero_insumos?id=eq.${id}`, {
            method: 'DELETE'
        });
    }
    
    renderInsumos();
};

window.editarInsumo = async function(id) {
    const ins = insumos.find(i => i.id === id);
    if (!ins) return;
    const newStock = prompt(`Modificar stock exacto de ${ins.name} (actual: ${ins.stock}):`, ins.stock);
    if (newStock !== null && newStock.trim() !== '' && !isNaN(newStock)) {
        ins.stock = parseInt(newStock);
        localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
        if (config.useSupabase) {
            await fetchSupabase(`lavadero_insumos?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ stock: ins.stock })
            });
        }
        renderInsumos();
        showFloatingToast('Stock actualizado');
    }
};

// --- Lï¿½GICA DE PRECIOS ---
const tbodyPrecios = document.getElementById('precios-tbody');
const btnResetPrecios = document.getElementById('btn-reset-precios');

if (btnResetPrecios) {
    btnResetPrecios.addEventListener('click', () => {
        if(confirm('ï¿½Restaurar precios y paquetes a sus valores por defecto?')) {
            WASH_PACKAGES = JSON.parse(JSON.stringify(DEFAULT_WASH_PACKAGES));
            localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
            initWashPackages();
            renderPrecios();
            renderWashMenu(); // Refrescar el grid de la vista lavadero
            showFloatingToast('Precios restaurados');
        }
    });
}

function renderPrecios() {
    if (!tbodyPrecios) return;
    tbodyPrecios.innerHTML = '';
    
    WASH_PACKAGES.forEach((pkg, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:var(--font-mono);font-size:0.8rem;">${pkg.id}</td>
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span style="font-size:1.2rem;">${pkg.icon}</span>
                    <input type="text" class="precio-input-name" data-index="${index}" value="${pkg.title}" style="background:transparent;border:1px solid rgba(255,255,255,0.1);color:#fff;padding:0.25rem;border-radius:4px;width:120px;">
                </div>
            </td>
            <td>
                $&nbsp;<input type="number" class="precio-input-val" data-index="${index}" value="${pkg.price}" style="background:transparent;border:1px solid rgba(255,255,255,0.1);color:var(--color-lime);font-weight:bold;padding:0.25rem;border-radius:4px;width:80px;">
            </td>
            <td><span class="plate-badge">${pkg.duration}</span></td>
            <td><button class="btn btn-primary btn-sm btn-save-precio" data-index="${index}">Guardar</button></td>
        `;
        tbodyPrecios.appendChild(tr);
    });

    document.querySelectorAll('.btn-save-precio').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-index');
            const row = e.target.closest('tr');
            const newTitle = row.querySelector('.precio-input-name').value;
            const newPrice = row.querySelector('.precio-input-val').value;
            
            WASH_PACKAGES[idx].title = newTitle;
            WASH_PACKAGES[idx].price = parseInt(newPrice);
            
            localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
            initWashPackages(); // Actualizar mapeos
            renderWashMenu(); // Refrescar menï¿½ del form
            showFloatingToast('Precio actualizado correctamente');
            
            e.target.innerText = '?';
            e.target.style.backgroundColor = 'var(--color-lime)';
            setTimeout(() => {
                e.target.innerText = 'Guardar';
                e.target.style.backgroundColor = '';
            }, 1500);
        });
    });
}

// Override de la renderizaciï¿½n del grid de lavados inicial
function renderWashMenu() {
    const grid = document.getElementById('wash-menu-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    WASH_PACKAGES.forEach(pkg => {
        const card = document.createElement('div');
        card.className = 'wash-option-card ' + (selectedWashType === pkg.id ? 'selected' : '');
        card.setAttribute('data-id', pkg.id);
        
        card.innerHTML = `
            <div class="wash-icon">${pkg.icon}</div>
            <div class="wash-details">
                <div class="wash-title">${pkg.title}</div>
                <div class="wash-price">$${pkg.price}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.wash-option-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedWashType = pkg.id;
            
            if (elInputBudget) {
                elInputBudget.value = pkg.price;
                elInputBudget.classList.add('pulse-highlight');
                setTimeout(() => elInputBudget.classList.remove('pulse-highlight'), 500);
            }
        });
        
        grid.appendChild(card);
    });
}
// Llamar a renderWashMenu en el boot inicial para asegurar que cargue lo de localStorage
setTimeout(renderWashMenu, 500);

// --- LÃƒ“GICA DE POSTULANTES ---
const tbodyPostulantes = document.getElementById('postulantes-tbody');

async function renderPostulantes() {
    if (!tbodyPostulantes) return;
    
    let applicants = [];
    
    if (config.useSupabase) {
        // Cargar desde Supabase externa
        try {
            const data = await fetchSupabase('applicants?select=*&status=eq.pending');
            if (data && Array.isArray(data)) {
                applicants = data;
            }
        } catch(e) { console.error('Error cargando postulantes', e); }
    } else {
        // Tratamos de leer de localStorage
        const applicantsStr = localStorage.getItem('lavadero_applicants');
        applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.filter(a => a.status === 'pending');
    }

    tbodyPostulantes.innerHTML = '';

    if (applicants.length === 0) {
        tbodyPostulantes.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-dim);padding:2rem;">No hay postulantes pendientes en este momento.</td></tr>';
        return;
    }

    applicants.forEach(app => {
        const tr = document.createElement('tr');
        const imgSrc = app.selfie_url && app.selfie_url.length > 50 ? app.selfie_url : 'https://ui-avatars.com/api/?name='+encodeURIComponent(app.full_name)+'&background=06b6d4&color=fff';

        tr.innerHTML = `
            <td>
                <img src="${imgSrc}" alt="Selfie de ${app.full_name}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--color-cyan);">
            </td>
            <td>
                <div style="font-weight:bold; color:var(--color-cyan)">${app.full_name}</div>
                <div style="font-size:0.85em; color:var(--color-text-dim)">DNI: ${app.dni} â€¢ ${app.age || '--'} años</div>
            </td>
            <td>
                <div><a href="https://wa.me/${app.phone}" target="_blank" style="color:var(--color-lime); text-decoration:none;">${app.phone}</a></div>
                <div style="font-size:0.85em; color:var(--color-text-dim)">${app.zone || '--'}</div>
            </td>
            <td>
                <div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${app.app_experience || 'Sin experiencia'}">${app.app_experience || 'Sin experiencia'}</div>
                <div style="font-size:0.85em; color:var(--color-yellow)">Disp: ${app.availability || '--'}</div>
            </td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="contratarPostulante('${app.id}', '${app.full_name}')" title="Contratar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rechazarPostulante('${app.id}')" title="Rechazar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </td>
        `;
        tbodyPostulantes.appendChild(tr);
    });
}

window.contratarPostulante = async function(id, name) {
    const role = prompt(`¿Qué rol le asignarás a ${name}? (Ej: Lavador, Detallador, Encargado)`, 'Lavador');
    if (role === null) return; // Cancelado

    // Mover a empleados
    const savedEmp = localStorage.getItem('lavadero_empleados');
    let empList = savedEmp ? JSON.parse(savedEmp) : [];
    empList.push({ id: Date.now(), name: name, role: role });
    localStorage.setItem('lavadero_empleados', JSON.stringify(empList));

    if (config.useSupabase) {
        await fetchSupabase(`applicants?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'hired' })
        });
    } else {
        const applicantsStr = localStorage.getItem('lavadero_applicants');
        let applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.map(a => {
            if (a.id === id) a.status = 'hired';
            return a;
        });
        localStorage.setItem('lavadero_applicants', JSON.stringify(applicants));
    }

    renderPostulantes();
    if(typeof renderEmpleados === 'function') renderEmpleados();
    
    if(typeof showFloatingToast === 'function') {
        showFloatingToast(`${name} contratado como ${role}!`);
    } else {
        alert(`${name} fue contratado como ${role}!`);
    }
}

window.rechazarPostulante = async function(id) {
    if(!confirm('¿Seguro que quieres rechazar y eliminar a este postulante?')) return;
    
    if (config.useSupabase) {
        await fetchSupabase(`applicants?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'rejected' })
        });
    } else {
        const applicantsStr = localStorage.getItem('lavadero_applicants');
        let applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.filter(a => a.id !== id);
        localStorage.setItem('lavadero_applicants', JSON.stringify(applicants));
    }
    
    renderPostulantes();
}

// Escuchar cambios de pestaÃƒ±a para renderizar postulantes
document.addEventListener('DOMContentLoaded', () => {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.target === 'view-postulantes') {
                renderPostulantes();
            }
        });
    });
});

// --- FUNCIONES NUEVAS: QR Y COMPARTIR ---
function showQrModal(car) {
    const colorHex = car.color.replace('#', '');
    let baseUrl = window.location.origin + window.location.pathname;
    baseUrl = baseUrl.replace('index.html', '');
    if(!baseUrl.endsWith('/')) baseUrl += '/';
    
    // Calcular pos (Posición en la fila)
    const esperaCars = activeVehicles.filter(v => v.zone === 'espera');
    let pos = esperaCars.findIndex(v => v.id === car.id) + 1;
    if (pos <= 0) pos = 1;

    const url = `${baseUrl}cliente.html?n=${encodeURIComponent(car.nickname)}&c=${colorHex}&p=${encodeURIComponent(car.plate || 'SIN PATENTE')}&z=${car.zone}&t=${encodeURIComponent(car.wash_type || 'combo-limpieza-total')}&pos=${pos}`;
    
    const qrModal = document.getElementById('modal-ticket-qr');
    if(!qrModal) return;

    const qrImage = document.getElementById('qr-image');
    const qrLinkText = document.getElementById('qr-link-text');
    const btnCopy = document.getElementById('btn-copy-ticket');

    // Usar API de QR pública para generar la imagen
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=00f0ff&bgcolor=18181b`;
    qrLinkText.innerText = url;
    
    btnCopy.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
            showFloatingToast("Enlace del cliente copiado al portapapeles.");
        });
    };

    qrModal.style.display = 'flex';
}

function copyPostularLink() {
    let baseUrl = window.location.origin + window.location.pathname;
    baseUrl = baseUrl.replace('index.html', '');
    if(!baseUrl.endsWith('/')) baseUrl += '/';
    const url = baseUrl + 'postular.html';
    
    navigator.clipboard.writeText(url).then(() => {
        showFloatingToast("Enlace de postulación copiado para WhatsApp.");
    });
}

window.renderWashMenuOverride = function() {
    const grid = document.getElementById('wash-menu-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    WASH_PACKAGES.forEach(pkg => {
        if(pkg.active === false) return;
        
        const card = document.createElement('div');
        const isSelected = selectedWashTypes.includes(pkg.id);
        card.className = 'wash-option-card wash-menu-card ' + (isSelected ? 'selected' : '');
        card.setAttribute('data-id', pkg.id);
        
        card.innerHTML = `
            <div class="check-badge">✓</div>
            <div class="wash-icon">${pkg.icon}</div>
            <div class="wash-details">
                <div class="wash-title">${pkg.title}</div>
                <div class="wash-price">$${pkg.price.toLocaleString('es-AR')}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            if (selectedWashTypes.includes(pkg.id)) {
                selectedWashTypes = selectedWashTypes.filter(id => id !== pkg.id);
            } else {
                selectedWashTypes.push(pkg.id);
            }
            
            window.renderWashMenuOverride();
            
            let total = 0;
            selectedWashTypes.forEach(id => {
                const found = WASH_PACKAGES.find(w => w.id === id);
                if (found) total += found.price;
            });
            
            if (elInputBudget) {
                elInputBudget.value = total;
                elInputBudget.classList.add('pulse-highlight');
                setTimeout(() => elInputBudget.classList.remove('pulse-highlight'), 500);
            }
        });
        
        grid.appendChild(card);
    });
}
setTimeout(() => { if(window.renderWashMenuOverride) window.renderWashMenuOverride(); }, 500);

window.openScannerModal = function() {
    const modal = document.getElementById('modal-scanner-ia');
    const feed = document.querySelector('.scanner-feed');
    const text = document.getElementById('scanner-text');
    
    if(!modal) return;
    
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('active');
    
    setTimeout(() => {
        feed.classList.add('scanning-active');
        text.innerText = "ANALIZANDO VEHÍCULO...";
        
        setTimeout(() => {
            text.innerText = "¡VEHÍCULO DETECTADO!";
            feed.classList.remove('scanning-active');
            feed.style.background = 'radial-gradient(circle at center, rgba(0,240,255,0.2) 0%, #000 100%)';
            
            const mockCars = [
                { nick: "Audi A3", plate: "AF432RT", color: "#ffffff", cat: "Auto", img: "assets/car_auto.png" },
                { nick: "Toyota Hilux", plate: "AD991ZZ", color: "#a8a8a8", cat: "Camioneta", img: "assets/car_camioneta.png" },
                { nick: "VW Taos", plate: "AE123CD", color: "#1e3a8a", cat: "SUV", img: "assets/car_suv.png" },
                { nick: "Ford Focus", plate: "AC876HG", color: "#dc2626", cat: "Auto", img: "assets/car_auto.png" },
                { nick: "RAM 1500", plate: "AE112QQ", color: "#000000", cat: "Camioneta", img: "assets/car_camioneta.png" }
            ];
            const randCar = mockCars[Math.floor(Math.random() * mockCars.length)];
            
            document.getElementById('input-nickname').value = randCar.nick;
            document.getElementById('input-plate').value = randCar.plate;
            document.getElementById('input-color').value = randCar.color;
            if(document.getElementById('input-category')) {
                document.getElementById('input-category').value = randCar.cat;
            }
            if(document.getElementById('color-hex-label')) {
                document.getElementById('color-hex-label').innerText = randCar.color;
            }

            const realImg = document.getElementById('scanner-real-image');
            if (realImg) {
                realImg.src = randCar.img;
                realImg.style.display = 'block';
                void realImg.offsetWidth;
                realImg.style.opacity = '1';
            }
            
            if(window.calculateBudget) { window.calculateBudget(); }
            
            setTimeout(() => {
                if(window.closeScannerModal) window.closeScannerModal();
                else modal.style.display = 'none';
                if(typeof showFloatingToast === 'function') showFloatingToast("Datos del vehículo cargados por IA.");
                if (realImg) {
                    realImg.style.opacity = '0';
                    setTimeout(() => { realImg.style.display = 'none'; }, 500);
                }
            }, 2500);
            
        }, 3000);
    }, 500);
}


// --- GESTIÓN DE CATEGORÍAS DE VEHÍCULOS ---
const DEFAULT_VEHICLE_CATEGORIES = [
        { id: 'Auto', surcharge: 0, icon: '🚗' },
        { id: 'SUV', surcharge: 2000, icon: '🚙' },
        { id: 'Camioneta', surcharge: 5000, icon: '🛻' }
    ];

let VEHICLE_CATEGORIES = [];

function initVehicleCategories() {
    const saved = localStorage.getItem('lavadero_vehicle_categories');
    if (saved) {
        VEHICLE_CATEGORIES = JSON.parse(saved);
    } else {
        VEHICLE_CATEGORIES = [...DEFAULT_VEHICLE_CATEGORIES];
        localStorage.setItem('lavadero_vehicle_categories', JSON.stringify(VEHICLE_CATEGORIES));
    }
    renderVehicleCategoriesTable();
    updateCategorySelects();
}

function updateCategorySelects() {
    const select = document.getElementById('input-category');
    if (select) {
        select.innerHTML = '';
        VEHICLE_CATEGORIES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.innerText = `${cat.icon} ${cat.id} (${cat.percentage >= 0 ? '+' : ''}${cat.percentage}%)`;
            select.appendChild(opt);
        });
    }
}

function renderVehicleCategoriesTable() {
    const tbody = document.getElementById('categorias-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    VEHICLE_CATEGORIES.forEach((cat, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cat.id}</strong></td>
            <td>${cat.percentage >= 0 ? '+' : ''}${cat.percentage}%</td>
            <td>${cat.icon}</td>
            <td>
                <button class="btn btn-secondary btn-sm text-red" onclick="deleteVehicleCategory(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.addVehicleCategory = function() {
    const id = document.getElementById('new-cat-id').value.trim();
    const perc = parseInt(document.getElementById('new-cat-perc').value) || 0;
    const icon = document.getElementById('new-cat-icon').value.trim() || '🚗';
    
    if (!id) {
        alert('Debe ingresar un nombre para la categoría.');
        return;
    }
    
    if (VEHICLE_CATEGORIES.some(c => c.id.toLowerCase() === id.toLowerCase())) {
        alert('La categoría ya existe.');
        return;
    }
    
    VEHICLE_CATEGORIES.push({ id, percentage: perc, icon });
    localStorage.setItem('lavadero_vehicle_categories', JSON.stringify(VEHICLE_CATEGORIES));
    
    document.getElementById('new-cat-id').value = '';
    document.getElementById('new-cat-perc').value = '0';
    
    renderVehicleCategoriesTable();
    updateCategorySelects();
    if(window.calculateBudget) window.calculateBudget();
}

window.deleteVehicleCategory = function(index) {
    if(VEHICLE_CATEGORIES.length <= 1) {
        alert('Debe quedar al menos una categoría.');
        return;
    }
    VEHICLE_CATEGORIES.splice(index, 1);
    localStorage.setItem('lavadero_vehicle_categories', JSON.stringify(VEHICLE_CATEGORIES));
    renderVehicleCategoriesTable();
    updateCategorySelects();
    if(window.calculateBudget) window.calculateBudget();
}

// Override calculateBudget to use dynamic multipliers
window.calculateBudget = function() {
    let totalBase = 0;
    if (typeof selectedWashTypes !== 'undefined') {
        selectedWashTypes.forEach(id => {
            const found = WASH_PACKAGES.find(w => w.id === id);
            if (found) totalBase += found.price;
        });
    }
    
    let multiplier = 1;
    const catInput = document.getElementById('input-category');
    if (catInput && VEHICLE_CATEGORIES) {
        const catId = catInput.value;
        const cat = VEHICLE_CATEGORIES.find(c => c.id === catId);
        if (cat) {
            multiplier = 1 + (cat.percentage / 100);
        }
    }
    
    const finalBudget = Math.round(totalBase * multiplier);
    
    const inputBudget = document.getElementById('input-budget');
    if (inputBudget) {
        inputBudget.value = finalBudget;
        inputBudget.classList.add('pulse-highlight');
        setTimeout(() => inputBudget.classList.remove('pulse-highlight'), 500);
    }
}

setTimeout(() => { initVehicleCategories(); }, 500);



const ARG_CARS_DB = {
    "Ninguna": { "Desconocido": "Auto" },
    "Volkswagen": {
        "Gol": "Auto", "Polo": "Auto", "Up!": "Auto", "Vento": "Auto", "Amarok": "Camioneta", "Nivus": "SUV", "Taos": "SUV", "T-Cross": "SUV", "Saveiro": "Camioneta"
    },
    "Toyota": {
        "Etios": "Auto", "Yaris": "Auto", "Corolla": "Auto", "Hilux": "Camioneta", "Corolla Cross": "SUV", "SW4": "SUV", "RAV4": "SUV"
    },
    "Ford": {
        "Ka": "Auto", "Fiesta": "Auto", "Focus": "Auto", "Ranger": "Camioneta", "Territory": "SUV", "EcoSport": "SUV", "Maverick": "Camioneta", "Bronco": "SUV"
    },
    "Peugeot": {
        "208": "Auto", "2008": "SUV", "3008": "SUV", "Partner": "Camioneta", "308": "Auto"
    },
    "Chevrolet": {
        "Onix": "Auto", "Cruze": "Auto", "Tracker": "SUV", "S10": "Camioneta", "Spin": "SUV", "Montana": "Camioneta"
    },
    "Fiat": {
        "Cronos": "Auto", "Argo": "Auto", "Toro": "Camioneta", "Pulse": "SUV", "Strada": "Camioneta", "Mobi": "Auto", "Fiorino": "Camioneta"
    },
    "Renault": {
        "Sandero": "Auto", "Logan": "Auto", "Kangoo": "Camioneta", "Duster": "SUV", "Alaskan": "Camioneta", "Stepway": "Auto", "Oroch": "Camioneta"
    },
    "Jeep": {
        "Renegade": "SUV", "Compass": "SUV", "Commander": "SUV"
    },
    "Nissan": {
        "Kicks": "SUV", "Frontier": "Camioneta", "Versa": "Auto", "Sentra": "Auto"
    }
};

function populateBrands() {
    const brandSelect = document.getElementById('input-brand');
    if (!brandSelect) return;
    brandSelect.innerHTML = '<option value="">Selecciona Marca</option>';
    Object.keys(ARG_CARS_DB).forEach(brand => {
        const opt = document.createElement('option');
        opt.value = brand;
        opt.innerText = brand;
        brandSelect.appendChild(opt);
    });
}

function populateModels() {
    const brandSelect = document.getElementById('input-brand');
    const modelSelect = document.getElementById('input-model');
    if (!brandSelect || !modelSelect) return;
    
    modelSelect.innerHTML = '<option value="">Selecciona Modelo</option>';
    const brand = brandSelect.value;
    if (brand && ARG_CARS_DB[brand]) {
        Object.keys(ARG_CARS_DB[brand]).forEach(model => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.innerText = model;
            modelSelect.appendChild(opt);
        });
    }
}

function autoSelectCategory() {
    const brandSelect = document.getElementById('input-brand');
    const modelSelect = document.getElementById('input-model');
    const catSelect = document.getElementById('input-category');
    if (!brandSelect || !modelSelect || !catSelect) return;
    
    const brand = brandSelect.value;
    const model = modelSelect.value;
    
    if (brand && model && ARG_CARS_DB[brand] && ARG_CARS_DB[brand][model]) {
        const size = ARG_CARS_DB[brand][model];
        // Encontrar el option en input-category que coincide con el ID
        Array.from(catSelect.options).forEach(opt => {
            if (opt.value === size) {
                opt.selected = true;
            }
        });
        if(window.calculateBudget) calculateBudget();
    }
}

// Inicializar selectores
document.addEventListener('DOMContentLoaded', () => {
    populateBrands();
});


// ================= FINANZAS Y ADMINISTRACION =================
let FINANZAS = {
    gastos: [],
    sueldos: []
};

function initFinanzas() {
    const saved = localStorage.getItem('lavadero_finanzas');
    if (saved) {
        FINANZAS = JSON.parse(saved);
    }
    renderFinanzas();
    populateEmpleadosSueldos();
}

function saveFinanzas() {
    localStorage.setItem('lavadero_finanzas', JSON.stringify(FINANZAS));
    updateRevenueDisplay();
}

function renderFinanzas() {
    const gastosTbody = document.getElementById('gastos-tbody');
    const sueldosTbody = document.getElementById('sueldos-tbody');
    
    if(gastosTbody) {
        gastosTbody.innerHTML = '';
        FINANZAS.gastos.forEach(g => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${g.fecha}</td>
                <td>${g.detalle}</td>
                <td>$${g.monto.toLocaleString('es-AR')}</td>
                <td style="color: ${g.estado === 'Pagado' ? 'var(--color-lime)' : 'var(--color-yellow)'}">${g.estado}</td>
            `;
            gastosTbody.appendChild(tr);
        });
    }
    
    if(sueldosTbody) {
        sueldosTbody.innerHTML = '';
        FINANZAS.sueldos.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.fecha}</td>
                <td>${s.empleado}</td>
                <td>$${s.monto.toLocaleString('es-AR')}</td>
            `;
            sueldosTbody.appendChild(tr);
        });
    }
    
    updateRevenueDisplay();
}

function populateEmpleadosSueldos() {
    const select = document.getElementById('sueldo-empleado');
    if(!select) return;
    select.innerHTML = '<option value="">Seleccione empleado...</option>';
    
    // Extraer empleados unicos del registro de horas
    const unicos = [...new Set(EMPLOYEE_RECORDS.map(e => e.name))];
    unicos.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp;
        opt.innerText = emp;
        select.appendChild(opt);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const formGastos = document.getElementById('form-gastos');
    if(formGastos) {
        formGastos.addEventListener('submit', (e) => {
            e.preventDefault();
            const detalle = document.getElementById('gasto-detalle').value;
            const monto = parseFloat(document.getElementById('gasto-monto').value);
            const estado = document.getElementById('gasto-estado').value;
            
            FINANZAS.gastos.push({
                fecha: new Date().toLocaleDateString('es-AR'),
                detalle,
                monto,
                estado
            });
            saveFinanzas();
            renderFinanzas();
            formGastos.reset();
        });
    }
    
    const formSueldos = document.getElementById('form-sueldos');
    if(formSueldos) {
        formSueldos.addEventListener('submit', (e) => {
            e.preventDefault();
            const empleado = document.getElementById('sueldo-empleado').value;
            const monto = parseFloat(document.getElementById('sueldo-monto').value);
            
            FINANZAS.sueldos.push({
                fecha: new Date().toLocaleDateString('es-AR'),
                empleado,
                monto
            });
            saveFinanzas();
            renderFinanzas();
            formSueldos.reset();
        });
    }
    
    initFinanzas();
});

// Update updateRevenueDisplay to calculate net
const oldRev = window.updateRevenueDisplay ? window.updateRevenueDisplay.toString() : '';
