// Paletas de apodos y colores F1
const NOMBRES = ["Max", "Lewis", "Charles", "Lando", "Fernando", "Checo", "Carlos", "George", "Oscar", "Alex", "Pierre", "Yuki", "Valtteri", "Nico", "Esteban"];

function getDisplayNickname(nickname) {
    if (!nickname) return 'Vehículo';
    if (typeof nickname === 'string' && nickname.startsWith('{')) {
        try {
            const parsed = JSON.parse(nickname);
            return parsed.name || 'Vehículo';
        } catch(e) {
            return nickname;
        }
    }
    if (typeof nickname === 'object') {
        return nickname.name || 'Vehículo';
    }
    return nickname;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const ADJETIVOS = ["Red Bull", "Mercedes", "Ferrari", "McLaren", "Aston Martin", "Williams", "Alpine", "Sauber", "Haas", "Racing Bulls"];
const COLORES = ["#00f0ff", "#84cc16", "#ffb800", "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#14b8a6", "#ff2800", "#00a19c", "#0600ef"];

const DEFAULT_WASH_PACKAGES = [
    { id: 'combo-limpieza-total', title: 'Limpieza Total', icon: '🌀', price: 18000, category: 'combos', items: ['Lavado exterior espuma activa', 'Aspirado alfombras/butacas', 'Limpieza cristales/pantallas', 'Silicona y perfumado clásico'] },
    { id: 'combo-vip-gold', title: 'VIP Gold', icon: '🏆', price: 25000, category: 'combos', items: ['Lavado pH neutro artesanal', 'Descontaminado de pintura', 'Encerado Carnauba brasileña', 'Aspirado con vapor'] },
    { id: 'lavado-carroceria', title: 'Exterior Simple', icon: '🚗', price: 12000, category: 'lavados', items: ['Lavado shampoo pH balanceado', 'Secado manual microfibra', 'Acondicionado de neumáticos'] },
    { id: 'aspirado-interior', title: 'Interior Pro', icon: '💨', price: 10000, category: 'lavados', items: ['Aspirado butacas y paneles', 'Desinfección de contacto', 'Acondicionado de plásticos'] },
    { id: 'solo-aspirado', title: 'Solo Aspirado', icon: '💨', price: 5000, category: 'lavados', items: ['Aspirado básico interior'] },
    { id: 'lavado-express', title: 'Express', icon: '⚡', price: 8000, category: 'lavados', items: ['Lavado exterior a presión', 'Secado rápido', 'Brillo básico de cubiertas'] },
    { id: 'lavado-motor', title: 'Motor Vapor', icon: '🔥', price: 15000, category: 'especiales', items: ['Limpieza técnica a vapor', 'Desengrasantes biodegradables', 'Protector dieléctrico plásticos'] },
    { id: 'encerado-acrilico', title: 'Encerado', icon: '🛡️', price: 22000, category: 'estetica', items: ['Lavado artesanal descontaminante', 'Cera selladora acrílica manual', 'Efecto hidrofóbico extremo'] },
    { id: 'lavado-chasis', title: 'Chasis', icon: '🔩', price: 28000, category: 'especiales', items: ['Limpieza chasis inferior', 'Desengrasado pesado a vapor', 'Protector antioxidante metal'] },
    { id: 'pulido-opticas', title: 'Ópticas', icon: '💡', price: 16000, category: 'estetica', items: ['Lijado al agua multietapa', 'Pulido de policarbonato', 'Sellado UV de ópticas'] },
    { id: 'tratamiento-ceramico', title: 'Cerámico 9H', icon: '💎', price: 65000, category: 'estetica', items: ['Corrección de pintura 2 etapas', 'Sellador cerámico 9H importado', 'Protección contra rayones UV'], active: true }
];

let WASH_PACKAGES = [];
let WASH_NAMES = {};

function initWashPackages() {
    // Auto-fix para localStorage con emojis corruptos (cualquier variante)
    if (saved && (saved.includes('\u00c3\u00b0') || saved.includes('ðŸ') || saved.includes('Í°') || saved.includes('â\u0082¬'))) {
        saved = null;
    }

    if (saved) {
        WASH_PACKAGES = JSON.parse(saved);
        // Sincronizar paquetes nuevos que no estén en localStorage
        let updated = false;
        DEFAULT_WASH_PACKAGES.forEach(defPkg => {
            if (!WASH_PACKAGES.find(p => p.id === defPkg.id)) {
                WASH_PACKAGES.push(defPkg);
                updated = true;
            }
        });
        if (updated) {
        }
    } else {
        WASH_PACKAGES = [...DEFAULT_WASH_PACKAGES];
    }
    WASH_NAMES = {};
    WASH_PACKAGES.forEach(pkg => {
        WASH_NAMES[pkg.id] = `${pkg.title} ${pkg.icon}`;
    });
}
initWashPackages();

let selectedWashTypes = ['combo-limpieza-total'];
let selectedWashType = 'combo-limpieza-total';

// --- ESTADO GLOBAL ---
let activeVehicles = [];
let washHistory = [];
let empleados = [];
let insumos = [];
let config = {
    useSupabase: true,
    supabaseUrl: 'https://hacmhlyvyyysnvekvhya.supabase.co',
    supabaseKey: 'sb_publishable_oEB1MoOee7lM99mvHCu_aA_T98vg3NA',
    queueTable: 'lavadero_camera_queue',
    serviceTable: 'service_orders'
};

const savedConfig = localStorage.getItem('lavadero_config');
if (savedConfig) {
    try {
        const parsed = JSON.parse(savedConfig);
        config = { ...config, ...parsed };
    } catch (e) {
        console.error("Error parsing saved config", e);
    }
}
let isSimulationActive = false;
let simulationIntervalId = null;
let realtimeTickerId = null;

// --- DIBUJO DE AUTO SVG (ESTILO F1 VISTA SUPERIOR) ---
function getCarSvg(color) {
    return `
    <svg class="car-sprite f1-car-svg" width="60" height="120" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${color}88);">
        <!-- Llantas y Ejes -->
        <rect x="2" y="20" width="8" height="22" rx="3" fill="#111" />
        <rect x="50" y="20" width="8" height="22" rx="3" fill="#111" />
        <rect x="10" y="28" width="40" height="4" fill="#222" />

        <rect x="2" y="75" width="10" height="25" rx="3" fill="#111" />
        <rect x="48" y="75" width="10" height="25" rx="3" fill="#111" />
        <rect x="12" y="85" width="36" height="5" fill="#222" />

        <!-- Alerón Delantero (Front Wing) -->
        <path d="M4 12 L56 12 L54 18 L6 18 Z" fill="#111" />
        <path d="M4 8 L56 8 L56 12 L4 12 Z" fill="${color}" />
        
        <!-- Trompa (Nose) -->
        <path d="M26 18 L34 18 L38 45 L22 45 Z" fill="${color}" />
        <path d="M28 18 L32 18 L34 45 L26 45 Z" fill="rgba(255,255,255,0.15)" />

        <!-- Suspensión Frontal -->
        <line x1="10" y1="30" x2="24" y2="38" stroke="#333" stroke-width="2" />
        <line x1="50" y1="30" x2="36" y2="38" stroke="#333" stroke-width="2" />

        <!-- Chasis y Sidepods -->
        <path d="M14 45 L46 45 L46 75 L38 85 L22 85 L14 75 Z" fill="${color}" />
        <!-- Entradas de aire -->
        <path d="M14 45 L22 45 L22 55 L12 55 Z" fill="#000" />
        <path d="M38 45 L46 45 L48 55 L38 55 Z" fill="#000" />

        <!-- Halo y Cockpit -->
        <rect x="24" y="45" width="12" height="15" rx="5" fill="#000" />
        <path d="M22 55 C 22 45, 38 45, 38 55" fill="none" stroke="#222" stroke-width="2" />
        <line x1="30" y1="42" x2="30" y2="46" stroke="#222" stroke-width="2" />

        <!-- Cubierta del motor (Engine Cover) -->
        <path d="M24 75 L36 75 L32 100 L28 100 Z" fill="${color}" />

        <!-- Suspensión Trasera -->
        <line x1="12" y1="85" x2="26" y2="80" stroke="#333" stroke-width="2" />
        <line x1="48" y1="85" x2="34" y2="80" stroke="#333" stroke-width="2" />

        <!-- Alerón Trasero (Rear Wing) -->
        <rect x="12" y="100" width="36" height="12" rx="2" fill="#111" />
        <rect x="14" y="102" width="32" height="6" fill="${color}" />

        <!-- Luz de lluvia (ERS) -->
        <rect x="28" y="108" width="4" height="4" rx="2" fill="#ff0000" style="filter: drop-shadow(0 0 4px #ff0000);" />
    </svg>
    `;
}

// --- SELECTORES DOM ---

const elEtaDisplay = document.getElementById('eta-display');
const elRevenueReal = document.getElementById('revenue-real-display');
const elRevenueProj = document.getElementById('revenue-proj-display');
const elConnectionStatus = document.getElementById('connection-status-pill');

const elFormRegister = document.getElementById('form-register-car');
const elInputNickname = document.getElementById('input-nickname');
const elInputPlate = document.getElementById('input-plate');
const elInputPhone = document.getElementById('input-phone');
const elInputClientType = document.getElementById('input-client-type');
const elInputPaymentMethod = document.getElementById('input-payment-method');
const elInputColor = document.getElementById('input-color');
const elInputCategory = document.getElementById('input-category');
const elInputBudget = document.getElementById('input-budget');
const elColorHexLabel = document.getElementById('color-hex-label');

const elOperatorTableBody = document.getElementById('operator-table-body');
const elOperatorReservadosBody = document.getElementById('operator-reservados-tbody');
const elHistoryTableBody = document.getElementById('history-table-body');

const elHistoryTotalCount = document.getElementById('history-total-count');
const elHistoryTotalRevenue = document.getElementById('history-total-revenue');

// Modales & Tabs
const elBtnConfig = document.getElementById('btn-config');
const elBtnAddLavado = document.getElementById('btn-add-lavado');
const elBtnAddLavadoAspirado = document.getElementById('btn-add-lavado-aspirado');
const elBtnAddSoloAspirado = document.getElementById('btn-add-solo-aspirado');
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
                
                config.supabaseUrl = data.supabaseUrl;
                config.supabaseKey = data.supabaseKey;
                config.queueTable = data.queueTable || 'lavadero_camera_queue';
                config.serviceTable = data.serviceTable || 'service_orders';
                // console.log("Í°Å¸â€Å’ Configuración de Supabase cargada desde Vercel Environment Variables.");
                
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

// --- SUPABASE CLIENT INSTANCE FOR REALTIME ---
let supabaseClient = null;

function initSupabaseClient() {
    if (true && config.supabaseUrl && config.supabaseKey && window.supabase) {
        if (!supabaseClient) {
            supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
            setupRealtimeSubscriptions();
        }
    }
}

function setupRealtimeSubscriptions() {
    if (!supabaseClient) return;
    
    // Suscripción a la tabla de cola
    supabaseClient
      .channel('public:lavadero_camera_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: config.queueTable || 'lavadero_camera_queue' }, payload => {
          console.log('Realtime change in queue:', payload);
          // Llamar a sync manual por simplicidad para asegurar estado consistente
          syncFromSupabase();
      })
      .subscribe();

    // Suscripción a la tabla de servicios
    supabaseClient
      .channel('public:service_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: config.serviceTable || 'service_orders' }, payload => {
          console.log('Realtime change in services:', payload);
          syncFromSupabase();
      })
      .subscribe();
}

function loadLocalData() {
    // Config
    if (savedConfig) {
        // Mezclar configuración guardada con los defaults
        const loadedConfig = JSON.parse(savedConfig);
        config = { ...config, ...loadedConfig };
        // Sincronizar credenciales para que la pantalla 3D de React las pueda leer
        if (config.supabaseUrl && config.supabaseKey) {
        }
    }
    
    // Vehículos Activos
    if (savedVehicles) {
        activeVehicles = JSON.parse(savedVehicles);
    }

    // Historial
    if (savedHistory) {
        washHistory = JSON.parse(savedHistory);
    }

    // Aplicar a los inputs del modal
    elCheckUseSupabase.checked = config.useSupabase;
    elSupabaseUrl.value = config.supabaseUrl || '';
    elSupabaseKey.value = config.supabaseKey || '';
    elSupabaseTable.value = config.queueTable || 'lavadero_camera_queue';
    elSupabaseServiceTable.value = config.serviceTable || 'service_orders';

    if (true) {
        elSupabaseFields.classList.remove('hidden');
    }
}

// --- CONEXIÓN DE DATOS & SYNC SUPABASE ---
function updateConnectionStatus(msg, className) {
    console.log("Supabase Status:", msg);
}

async function syncFromSupabase() {
    if (!config.useSupabase || !config.supabaseUrl || !config.supabaseKey) return;
    
    isSyncing = true;
    updateConnectionStatus("Syncing...");

    try {
        const queueData = await fetchSupabase(`${config.queueTable}?select=*&order=entered_at.asc`);
        if (queueData && Array.isArray(queueData)) {
            activeVehicles = queueData.map(dbCar => {
                // Decodificar nickname JSON (encodado por tablet_ingreso)
                let extra = {};
                try {
                    if (dbCar.nickname && dbCar.nickname.startsWith('{')) {
                        extra = JSON.parse(dbCar.nickname);
                    }
                } catch(e) { /* nickname es texto plano, no JSON */ }

                const realNickname = extra.name || dbCar.nickname || 'Vehículo';
                const plate = extra.plate || dbCar.plate || '';
                const budget = extra.budget || dbCar.budget || 0;
                const description = extra.description || dbCar.description || '';

                // Resolver wash_type
                let washType = extra.wash_type || dbCar.wash_type || 'combo-limpieza-total';
                if (!WASH_NAMES[washType] && description) {
                    for (const key in WASH_NAMES) {
                        if (description.toLowerCase().includes(key.toLowerCase())) {
                            washType = key; break;
                        }
                    }
                }

                return {
                    id: dbCar.id,
                    tracking_id: dbCar.tracking_id || Math.floor(Math.random() * 100),
                    nickname: realNickname,
                    plate: plate,
                    color: dbCar.color || '#06b6d4',
                    zone: dbCar.zone || 'espera',
                    budget: budget,
                    wash_type: washType,
                    description: description,
                    entered_at: dbCar.entered_at || new Date().toISOString(),
                    created_at: dbCar.created_at || new Date().toISOString()
                };
            });
        }


        const historyData = await fetchSupabase(`${config.serviceTable}?status=eq.completed`);
        if (historyData && Array.isArray(historyData)) {
            const historyMap = historyData.map(h => ({
                id: h.vehicle_id || h.id,
                plate: h.description ? h.description.split(' - ')[0] : '???',
                nickname: h.description ? h.description.split(' - ')[1] : 'Historial',
                budget: h.budget,
                completed_at: h.appointment_date || h.created_at
            }));
            
            const combined = [...historyMap, ...localHist];
            const uniqueHistory = Array.from(new Map(combined.map(item => [item.id, item])).values());
            
            washHistory = uniqueHistory.sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at));
        }
        
        const empData = await fetchSupabase('lavadero_empleados');
        if (empData && Array.isArray(empData)) {
            empleados = empData;
        }
        
        const insData = await fetchSupabase('lavadero_insumos');
        if (insData && Array.isArray(insData)) {
            insumos = insData;
        }

        const gastosData = await fetchSupabase('lavadero_gastos');
        if (gastosData && Array.isArray(gastosData)) {
            if(typeof FINANZAS !== 'undefined') {
                FINANZAS.gastos = gastosData.map(g => ({
                    fecha: g.fecha,
                    detalle: g.detalle,
                    monto: g.monto,
                    estado: g.estado
                }));
            }
        }

        const sueldosData = await fetchSupabase('lavadero_sueldos');
        if (sueldosData && Array.isArray(sueldosData)) {
            if(typeof FINANZAS !== 'undefined') {
                FINANZAS.sueldos = sueldosData.map(s => ({
                    fecha: s.fecha,
                    empleado: s.empleado_nombre,
                    monto: s.monto
                }));
            }
        }
        
        if (typeof FINANZAS !== 'undefined' && ((gastosData && Array.isArray(gastosData)) || (sueldosData && Array.isArray(sueldosData)))) {
            if(typeof saveFinanzas === 'function') saveFinanzas();
            if(typeof renderFinanzas === 'function') renderFinanzas();
        }

        updateConnectionStatus("Connected");
        initSupabaseClient();
        if(typeof renderAll === 'function') renderAll();
    } catch (e) {
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


    // Si la sincronización remota está habilitada y se solicita sync
    if (true && syncRemote) {
        // En una app robusta, haríamos sincronizaciones granulares. Aquí reflejamos los cambios individuales
        // pero como plan de contingencia guardamos en local por si falla el API.
    }
}

// --- OPERACIONES DE VEHÍCULOS ---

// Agregar Vehículo
async function addVehicle(nickname, plate, color, budgetStr, washType, phone = '', clientType = 'normal', paymentMethod = 'efectivo', isPaid = false) {
    const budget = budgetStr ? parseFloat(budgetStr) : 0;
    const wType = washType || 'combo-limpieza-total';
    const washName = WASH_NAMES[wType] || 'Combo Limpieza Total';
    const uppercasePlate = plate.toUpperCase();
    
    if (true && uppercasePlate) {
        // Upsert client data
        fetchSupabase('lavadero_clientes', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
                patente: uppercasePlate,
                telefono: phone,
                color_auto: color,
                tipo_cliente: clientType
            })
        });
    }
        let initialZone = 'espera';
        if (wType === 'aspirado-interior') {
            const aspiradoCount = activeVehicles.filter(v => v.zone === 'aspirado').length;
            if (aspiradoCount < 2) {
                initialZone = 'aspirado';
            }
        }

        const newCar = {
            id: generateUUID(),
            tracking_id: Math.floor(Math.random() * 900) + 100,
            nickname,
            plate: uppercasePlate,
            phone,
            clientType,
            paymentMethod,
            isPaid,
            color,
            zone: initialZone,
            budget,
        wash_type: wType,
        description: `Servicio: ${washName}. Lavado estándar y detallado de carrocería.`,
        entered_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    };

    activeVehicles.push(newCar);

    if (true) {
        const nicknamePayload = JSON.stringify({
            name: newCar.nickname,
            isPaid: isPaid,
            paymentMethod: paymentMethod,
            plate: newCar.plate,
            budget: newCar.budget,
            wash_type: newCar.wash_type,
            description: newCar.description
        });
        
        // Registrar en lavadero_camera_queue de Supabase
        await fetchSupabase(config.queueTable, {
            method: 'POST',
            body: JSON.stringify({
                id: newCar.id,
                tracking_id: newCar.tracking_id,
                nickname: nicknamePayload,
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

    // Validación estricta: Solo 1 auto en la máquina de lavado a la vez
    if (targetZone === 'lavado') {
        const enLavado = activeVehicles.filter(v => v.zone === 'lavado').length;
        if (enLavado >= 1 && car.zone !== 'lavado') {
            if (typeof showFloatingToast === 'function') {
                showFloatingToast("¡Túnel ocupado! Sólo entra 1 auto a la vez.", "error");
            }
            return;
        }
    }

    car.zone = targetZone;
    car.entered_at = new Date().toISOString(); // Resetear temporizador de zona


    if (true) {
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

    if (true && car.plate && car.plate !== 'SIN PATENTE') {
        const clients = await fetchSupabase(`lavadero_clientes?patente=eq.${car.plate}`);
        if (clients && clients.length > 0) {
            const client = clients[0];
            const promoAplica = client.visitas_totales > 0 && (client.visitas_totales + 1) % 4 === 0;
            
            await fetchSupabase(`lavadero_clientes?id=eq.${client.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    visitas_totales: client.visitas_totales + 1,
                    lavados_realizados: client.lavados_realizados + 1,
                    ultima_visita: new Date().toISOString()
                })
            });

            await fetchSupabase(`lavadero_historial_servicios`, {
                method: 'POST',
                body: JSON.stringify({
                    cliente_id: client.id,
                    patente: car.plate,
                    tipo_servicio: car.wash_type,
                    forma_pago: car.paymentMethod || 'efectivo',
                    monto: car.budget,
                    promo_aplicada: promoAplica
                })
            });
            
            if (promoAplica) {
                showFloatingToast(`¡Atención! Lavado nro ${client.visitas_totales + 1} de ${car.plate}. ¡Aplica Promoción!`);
            }
        }
    }

    washHistory.unshift(historyItem); // Insertar al inicio
    activeVehicles.splice(index, 1);  // Remover de activos


    if (true) {
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

    if (true) {
        await fetchSupabase(`${config.queueTable}?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    renderAll();
}

// --- RENDERIZADO VISUAL ---

// Generar HTML del auto en su contenedor
function createVehicleElement(car, index = -1) {
    const container = document.createElement('div');
    
    // Layout F1 Pit Lane para Espera
    if (car.zone === 'espera') {
        container.className = 'f1-vehicle-slot';
        container.setAttribute('data-id', car.id);
        
        // Inyectamos clase al SVG
        const carSvg = getCarSvg(car.color).replace('<svg ', '<svg class="f1-car-svg" ');
        
        container.innerHTML = `
            ${carSvg}
            <div class="f1-driver-name">${getDisplayNickname(car.nickname).split(' ')[0]}</div>
            <div class="f1-timer-badge" data-timer-type="waiting" data-start="${car.entered_at}">+0 MIN</div>
            <div class="f1-pit-number">PIT ${index !== -1 ? index + 1 : '?'}</div>
        `;
    } else {
        container.className = 'vehicle-sprite-container';
        if (car.zone === 'lavado') {
            container.classList.add('in-wash-glow');
        }
        container.setAttribute('data-id', car.id);

        const carSvg = getCarSvg(car.color);
        
        let timerHtml = '';
        if (car.zone === 'lavado') {
            timerHtml = `
                <div class="timer-badge washing">
                    <span data-timer-type="washing" data-start="${car.entered_at}">07:00</span>
                </div>
                <div class="wash-progress-bar">
                    <div class="wash-progress-fill" data-progress-fill="${car.entered_at}" style="width: 0%"></div>
                </div>
            `;
        } else if (car.zone === 'aspirado') {
            timerHtml = `
                <div class="timer-badge washing">
                    <span data-timer-type="vacuuming" data-start="${car.entered_at}">07:00</span>
                </div>
                <div class="wash-progress-bar">
                    <div class="wash-progress-fill" data-progress-fill-vacuum="${car.entered_at}" style="width: 0%"></div>
                </div>
            `;
        } else if (car.zone === 'terminado') {
            timerHtml = `<span class="timer-badge finished">✔ LISTO</span>`;
        }

        container.innerHTML = `
            ${carSvg}
            <div class="vehicle-label">
                <div>${getDisplayNickname(car.nickname).split(' ')[0]}</div>
                ${timerHtml}
            </div>
        `;
    }

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
    // 1. El mapa visual interactivo está ahora encapsulado en un iframe.

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
    let etaMinutos = 0;
    const currentTime = Date.now();
    
    // Separar la cola en los que van a lavado (todos menos solo aspirado) y los que van solo a aspirado
    const esperaLavadoCount = activeVehicles.filter(v => v.zone === 'espera' && v.wash_type !== 'aspirado-interior').length;
    const esperaAspiradoCount = activeVehicles.filter(v => v.zone === 'espera' && v.wash_type === 'aspirado-interior').length;
    
    const lavadoCars = activeVehicles.filter(v => v.zone === 'lavado');
    const aspiradoCars = activeVehicles.filter(v => v.zone === 'aspirado');
    
    let etaLavado = 0;
    if (lavadoCars.length > 0) {
        let elapsedMins = (currentTime - new Date(lavadoCars[0].entered_at).getTime()) / 60000;
        let remainingLavado = Math.max(0, 7 - Math.floor(elapsedMins));
        etaLavado = remainingLavado + (esperaLavadoCount * 7);
    } else {
        etaLavado = esperaLavadoCount * 7;
    }

    let etaAspirado = 0;
    // Como entran 2 autos en aspirado, cada ciclo de 7 mins saca 2 autos
    // Los que están esperando se dividen por 2 (redondeando hacia arriba) para saber cuántos ciclos faltan
    let ciclosEsperaAspirado = Math.ceil(esperaAspiradoCount / 2);
    
    if (aspiradoCars.length > 0) {
        let elapsedMins = (currentTime - new Date(aspiradoCars[0].entered_at).getTime()) / 60000;
        let remainingAspirado = Math.max(0, 7 - Math.floor(elapsedMins));
        etaAspirado = remainingAspirado + (ciclosEsperaAspirado * 7);
    } else {
        etaAspirado = ciclosEsperaAspirado * 7;
    }

    // La demora final es el mayor tiempo de espera entre ambas líneas
    etaMinutos = Math.max(etaLavado, etaAspirado);
    const esperaCount = esperaLavadoCount + esperaAspiradoCount;

    // Calculate Densidad Cola
    const densidadDisplay = document.getElementById('densidad-display');
    const densidadIcon = document.getElementById('densidad-icon');
    if (densidadDisplay && densidadIcon) {
        if (esperaCount <= 4) {
            densidadDisplay.innerText = "Baja";
            densidadDisplay.className = "eta-value text-lime";
            densidadDisplay.style.color = "var(--color-lime)";
            densidadIcon.className = "text-lime";
        } else if (esperaCount <= 7) {
            densidadDisplay.innerText = "Media";
            densidadDisplay.className = "eta-value text-yellow";
            densidadDisplay.style.color = "var(--color-yellow)";
            densidadIcon.className = "text-yellow";
        } else {
            densidadDisplay.innerText = "Alta";
            densidadDisplay.className = "eta-value text-red";
            densidadDisplay.style.color = "var(--color-red)";
            densidadIcon.className = "text-red";
        }
    }

    if (etaMinutos === 0) {
        elEtaDisplay.innerText = "Sin Demoras ⚡";
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
    if (elOperatorReservadosBody) elOperatorReservadosBody.innerHTML = '';
    
    const hasActive = activeVehicles.some(c => c.zone !== 'reservado');
    const hasReserved = activeVehicles.some(c => c.zone === 'reservado');

    if (!hasActive) {
        elOperatorTableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="5" style="text-align: center; color: var(--color-text-dim); font-style: italic; padding: 2rem 0;">
                    Sin vehículos en circulación. Registra uno arriba para comenzar.
                </td>
            </tr>`;
    }
    
    if (!hasReserved && elOperatorReservadosBody) {
        elOperatorReservadosBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="5" style="text-align: center; color: var(--color-text-dim); font-style: italic; padding: 2rem 0;">
                    Sin vehículos reservados.
                </td>
            </tr>`;
    }

    if (activeVehicles.length === 0) return;

    activeVehicles.forEach(car => {
        const tr = document.createElement('tr');
        tr.id = `row-op-${car.id}`;
        
        tr.innerHTML = `
            <td>
                <div class="car-badge-name">
                    <span class="car-color-dot" style="background-color: ${car.color}; box-shadow: 0 0 6px ${car.color}"></span>
                    <div>
                        <div style="font-weight: 800; color: var(--color-text);">${getDisplayNickname(car.nickname)}</div>
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
                    <option value="reservado" ${car.zone === 'reservado' ? 'selected' : ''} style="color:var(--color-cyan)">★ Reservado</option>
                    <option value="pre_espera" ${car.zone === 'pre_espera' ? 'selected' : ''}>0. Ingreso Inteligente</option>
                    <option value="espera" ${car.zone === 'espera' ? 'selected' : ''}>1. Espera</option>
                    <option value="lavado" ${car.zone === 'lavado' ? 'selected' : ''}>2. Lavando</option>
                    <option value="aspirado" ${car.zone === 'aspirado' ? 'selected' : ''}>3. Aspirado</option>
                    <option value="terminado" ${car.zone === 'terminado' ? 'selected' : ''}>4. Terminado</option>
                </select>
            </td>
            <td>
                <div class="table-actions" style="flex-wrap: wrap;">
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
                let nextZone = 'terminado';
                if (car.zone === 'reservado') {
                    nextZone = 'pre_espera';
                } else if (car.zone === 'pre_espera') {
                    nextZone = 'espera';
                } else if (car.zone === 'espera') {
                    if (car.wash_type === 'aspirado-interior') {
                        nextZone = 'aspirado';
                    } else {
                        nextZone = 'lavado';
                    }
                } else if (car.zone === 'lavado') {
                    // Si el servicio incluye aspirado, pasar a aspirado. Si no, terminado.
                    const serviciosConAspirado = ['combo-limpieza-total', 'combo-vip-gold', 'aspirado-interior'];
                    if (serviciosConAspirado.includes(car.wash_type)) {
                        nextZone = 'aspirado';
                    } else {
                        nextZone = 'terminado';
                    }
                } else if (car.zone === 'aspirado') {
                    nextZone = 'terminado';
                }
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
            if (confirm(`¿Estás seguro de que deseas eliminar a ${getDisplayNickname(car.nickname)} de la cola?`)) {
                deleteVehicle(car.id);
            }
        });

        const wpBtn = tr.querySelector('.btn-whatsapp');
        if (wpBtn) {
            wpBtn.addEventListener('click', () => {
                const text = encodeURIComponent(`¡Hola! Tu vehículo ${getDisplayNickname(car.nickname)} ya está listo y brillante. Te esperamos en Lavadero Tech System.`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
            });
        }

        if (car.zone === 'reservado' && elOperatorReservadosBody) {
            elOperatorReservadosBody.appendChild(tr);
        } else {
            elOperatorTableBody.appendChild(tr);
        }
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
        const WASH_DURATION_SECS = 7 * 60; // 7 minutos en segundos

        // Calcular cuánto tiempo restante le queda al auto que se está lavando
        let remainingWashingSecs = 0;
        const washingEls = document.querySelectorAll('[data-timer-type="washing"]');
        if (washingEls.length > 0) {
            // Tomamos el primero que se está lavando
            const startStr = washingEls[0].getAttribute('data-start');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                remainingWashingSecs = Math.max(0, WASH_DURATION_SECS - elapsedSecs);
            }
        }

        // 1. Relojes en espera (Calculando ETA real acumulada)
        document.querySelectorAll('[data-timer-type="waiting"]').forEach((el, index) => {
            // El delay es el tiempo restante del vehiculo en lavado + (7 min por cada auto delante suyo) + 7 minutos para el auto mismo
            const waitTotalSecs = remainingWashingSecs + ((index + 1) * WASH_DURATION_SECS);
            
            const mins = Math.floor(waitTotalSecs / 60);
            const secs = waitTotalSecs % 60;
            
            // Mostrar ETA
            el.innerText = `~${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        });

        // 2. Relojes en lavado (cuenta regresiva real)
        document.querySelectorAll('[data-timer-type="washing"]').forEach(el => {
            const startStr = el.getAttribute('data-start');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                const remainingSecs = Math.max(0, WASH_DURATION_SECS - elapsedSecs);

                const mins = Math.floor(remainingSecs / 60);
                const secs = remainingSecs % 60;
                el.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        });

        // 3. Barra de progreso asumiendo un lavado real promedio de 15 minutos (900 seg)
        document.querySelectorAll('[data-progress-fill]').forEach(el => {
            const startStr = el.getAttribute('data-progress-fill');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                const percent = Math.min(100, Math.floor((elapsedSecs / WASH_DURATION_SECS) * 100));
                el.style.width = `${percent}%`;
            }
        });

        // 4. Relojes en aspirado
        document.querySelectorAll('[data-timer-type="vacuuming"]').forEach(el => {
            const startStr = el.getAttribute('data-start');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                const remainingSecs = Math.max(0, WASH_DURATION_SECS - elapsedSecs);

                const mins = Math.floor(remainingSecs / 60);
                const secs = remainingSecs % 60;
                el.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        });

        // 5. Barra de progreso aspirado
        document.querySelectorAll('[data-progress-fill-vacuum]').forEach(el => {
            const startStr = el.getAttribute('data-progress-fill-vacuum');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                const percent = Math.min(100, Math.floor((elapsedSecs / WASH_DURATION_SECS) * 100));
                el.style.width = `${percent}%`;
            }
        });
    }, 1000);
}

// --- BOTONES MANUALES DE TRÁFICO ---
if (elBtnAddLavado) {
    elBtnAddLavado.addEventListener('click', () => {
        const nick = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]}`;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const plate = `${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}${Math.floor(Math.random()*900+100)}${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}`;
        const color = COLORES[Math.floor(Math.random() * COLORES.length)];
        addVehicle(nick, plate, color, "12000", "lavado-carroceria");
        showFloatingToast("Lavado agregado a la cola");
    });
}

if (elBtnAddLavadoAspirado) {
    elBtnAddLavadoAspirado.addEventListener('click', () => {
        const nick = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]}`;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const plate = `${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}${Math.floor(Math.random()*900+100)}${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}`;
        const color = COLORES[Math.floor(Math.random() * COLORES.length)];
        addVehicle(nick, plate, color, "18000", "combo-limpieza-total");
        showFloatingToast("Lavado y Aspirado agregado a la cola");
    });
}

if (elBtnAddSoloAspirado) {
    elBtnAddSoloAspirado.addEventListener('click', () => {
        const nick = `${NOMBRES[Math.floor(Math.random() * NOMBRES.length)]} ${ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]}`;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const plate = `${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}${Math.floor(Math.random()*900+100)}${letters[Math.floor(Math.random()*26)]}${letters[Math.floor(Math.random()*26)]}`;
        const color = COLORES[Math.floor(Math.random() * COLORES.length)];
        addVehicle(nick, plate, color, "8000", "aspirado-interior");
        showFloatingToast("Solo Aspirado agregado a la cola");
    });
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
    config.supabaseUrl = elSupabaseUrl.value.trim();
    config.supabaseKey = elSupabaseKey.value.trim();
    config.queueTable = elSupabaseTable.value.trim() || 'lavadero_camera_queue';
    config.serviceTable = elSupabaseServiceTable.value.trim() || 'service_orders';

    localStorage.setItem('lavadero_config', JSON.stringify(config));
    
    // Cerrar modal
    elModalConfig.classList.remove('active');
    showFloatingToast("Configuración guardada.");

    // Aplicar
    if (true) {
        if (!config.supabaseUrl || !config.supabaseKey) {
            showFloatingToast("Error: Faltan credenciales de Supabase");
            
            elCheckUseSupabase.checked = false;
            elSupabaseFields.classList.add('hidden');
        } else {
            showFloatingToast("Conectando con Supabase...");
            await syncFromSupabase();
        }
    } else {
        // Volver a modo local
        elConnectionStatus.className = "connection-status";
        elConnectionStatus.querySelector('.status-label').innerText = "Modo Local";
        // Cargar lo que tengamos localmente
        if (savedVehicles) {
            activeVehicles = JSON.parse(savedVehicles);
        }
        renderAll();
    }
});

elBtnClearHistory.addEventListener('click', async () => {
    if (confirm("¿Estás completamente seguro de borrar todo el historial y estadísticas de recaudación?")) {
        washHistory = [];
        renderAll();
        
        if (true) {
            try {
                await fetchSupabase(`${config.serviceTable}?status=eq.completed`, { method: 'DELETE' });
                showFloatingToast("Historial borrado en local y en la nube.");
            } catch(e) {
                console.error(e);
                showFloatingToast("Historial borrado localmente.");
            }
        } else {
            showFloatingToast("Historial borrado.");
        }
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
            <div class="check-badge">Í¢Å“â€œ</div>
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

// Auto-fill logic for plates
if (elInputPlate) {
    let debounceTimer;
    elInputPlate.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const plate = e.target.value.trim().toUpperCase();
        if (plate.length >= 6) {
            debounceTimer = setTimeout(async () => {
                const clients = await fetchSupabase(`lavadero_clientes?patente=eq.${plate}`);
                if (clients && clients.length > 0) {
                    const client = clients[0];
                    if (client.telefono && elInputPhone) elInputPhone.value = client.telefono;
                    if (client.color_auto && elInputColor) {
                        elInputColor.value = client.color_auto;
                        if (elColorHexLabel) elColorHexLabel.innerText = client.color_auto;
                    }
                    if (client.tipo_cliente && elInputClientType) elInputClientType.value = client.tipo_cliente;
                    showFloatingToast(`Cliente recurrente encontrado: ${plate}. Visitas previas: ${client.visitas_totales}`);
                }
            }, 800);
        }
    });
}

// Formulario de Registro
elFormRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = elInputNickname.value.trim();
    const plate = elInputPlate.value.trim();
    const phone = elInputPhone ? elInputPhone.value.trim() : '';
    const clientType = elInputClientType ? elInputClientType.value : 'normal';
    const paymentMethod = elInputPaymentMethod ? elInputPaymentMethod.value : 'efectivo';
    const isPaid = document.getElementById('input-is-paid') ? document.getElementById('input-is-paid').checked : false;
    const color = elInputColor.value;
    const budget = elInputBudget.value;
    const washType = selectedWashTypes.join(',');

    addVehicle(nickname, plate, color, budget, washType, phone, clientType, paymentMethod, isPaid);

    // Resetear formulario
    elInputNickname.value = '';
    elInputPlate.value = '';
    elInputPhone.value = '';
    if(document.getElementById('input-is-paid')) document.getElementById('input-is-paid').checked = false;
    elInputBudget.value = '18000';
    renderWashMenu();
    
    // Enfocar apodo para el siguiente
    elInputNickname.focus();
    
    showFloatingToast(`Vehículo ${nickname} registrado.`);
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
    if (true) {
        syncFromSupabase();
        // Polling de sincronización cada 10 segundos
        setInterval(syncFromSupabase, 10000);
    }
});

// --- LÍ¯¿½GICA DE NAVEGACIÍ¯¿½N (SIDEBAR) ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remover active de todos los botones
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // Agregar active al botÍ¯¿½n clickeado
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
        
        // Ocultar acciones del header si no es el dashboard principal
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            if (targetView === 'view-lavadero') {
                headerActions.style.display = 'flex';
            } else {
                headerActions.style.display = 'none';
            }
        }

        // Si entramos a ciertas vistas, refrescamos
        if (targetView === 'view-empleados') renderEmpleados();
        if (targetView === 'view-insumos') renderInsumos();
        if (targetView === 'view-precios') renderPrecios();
    });
});

// --- LÍ¯¿½GICA DE EMPLEADOS ---
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
        
        if (true) {
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
    
    if (true) {
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
        if (true) {
            await fetchSupabase(`lavadero_empleados?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ hours: emp.hours })
            });
        }
        renderEmpleados();
        showFloatingToast('Horas actualizadas');
    }
};

// --- LÍ¯¿½GICA DE INSUMOS ---
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
            
            if (true) {
                await fetchSupabase(`lavadero_insumos?id=eq.${existingInsumo.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ stock: existingInsumo.stock })
                });
            }
            showFloatingToast(`Stock actualizado: ${existingInsumo.name}`);
        } else {
            const newIns = { id: Date.now(), name, stock: stockToAdd };
            insumos.push(newIns);
            
            if (true) {
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
        
        if (true) {
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
    
    if (true) {
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
        if (true) {
            await fetchSupabase(`lavadero_insumos?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ stock: ins.stock })
            });
        }
        renderInsumos();
        showFloatingToast('Stock actualizado');
    }
};

// --- LÍ¯¿½GICA DE PRECIOS ---
const tbodyPrecios = document.getElementById('precios-tbody');
const btnResetPrecios = document.getElementById('btn-reset-precios');

if (btnResetPrecios) {
    btnResetPrecios.addEventListener('click', () => {
        if(confirm('Í¯¿½Restaurar precios y paquetes a sus valores por defecto?')) {
            WASH_PACKAGES = JSON.parse(JSON.stringify(DEFAULT_WASH_PACKAGES));
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
            
            initWashPackages(); // Actualizar mapeos
            renderWashMenu(); // Refrescar menu del form
            
            if (true) {
                fetchSupabase('lavadero_precios', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                        id: WASH_PACKAGES[idx].id,
                        name: newTitle,
                        price: parseInt(newPrice),
                        category: 'Auto'
                    })
                });
            }
            
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

// Override de la renderizaciÍ¯¿½n del grid de lavados inicial
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

// --- LÍƒÆ’â€œGICA DE POSTULANTES ---
const tbodyPostulantes = document.getElementById('postulantes-tbody');

async function renderPostulantes() {
    if (!tbodyPostulantes) return;
    
    let applicants = [];
    
    if (true) {
        // Cargar desde Supabase externa
        try {
            const data = await fetchSupabase('applicants?select=*&status=eq.pending');
            if (data && Array.isArray(data)) {
                applicants = data;
            }
        } catch(e) { console.error('Error cargando postulantes', e); }
    } else {
        // Tratamos de leer de localStorage
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
                <div style="font-size:0.85em; color:var(--color-text-dim)">DNI: ${app.dni} Í¢â‚¬¢ ${app.age || '--'} años</div>
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
    let empList = savedEmp ? JSON.parse(savedEmp) : [];
    empList.push({ id: Date.now(), name: name, role: role });

    if (true) {
        await fetchSupabase(`applicants?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'hired' })
        });
    } else {
        let applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.map(a => {
            if (a.id === id) a.status = 'hired';
            return a;
        });
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
    
    if (true) {
        await fetchSupabase(`applicants?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'rejected' })
        });
    } else {
        let applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.filter(a => a.id !== id);
    }
    
    renderPostulantes();
}

// Escuchar cambios de pestaÍƒÆ’±a para renderizar postulantes
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
            <div class="check-badge">âœ“</div>
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
            
            // Revisar si hay autos del kiosko esperando
            let preEsperaCars = activeVehicles.filter(v => v.zone === 'pre_espera');
            if (preEsperaCars.length > 0) {
                preEsperaCars.sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                let nextCar = preEsperaCars[0];
                
                // Mover a espera
                updateVehicleZone(nextCar.id, 'espera');
                
                text.innerText = `VEHÍCULO KIOSCO: ${nextCar.plate || nextCar.nickname}`;
                
                setTimeout(() => {
                    if(window.closeScannerModal) window.closeScannerModal();
                    else modal.style.display = 'none';
                    if(typeof showFloatingToast === 'function') showFloatingToast("Vehículo de Kiosco ingresado a espera.");
                    feed.style.background = 'transparent';
                    text.innerText = "ESCANEAR CÁMARA (SIMULADOR)";
                }, 2000);
            } else {
                // Fallback normal si no hay autos del kiosko
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
                    feed.style.background = 'transparent';
                    text.innerText = "ESCANEAR CÁMARA (SIMULADOR)";
                }, 2500);
            }
        }, 3000);
    }, 500);
}


// --- GESTIÓN DE CATEGORÍAS DE VEHÍCULOS ---
const DEFAULT_VEHICLE_CATEGORIES = [
        { id: 'Auto', percentage: 0, icon: '🚗' },
        { id: 'SUV', percentage: 10, icon: 'ðŸš™' },
        { id: 'Camioneta', percentage: 20, icon: 'ðŸ›»' }
    ];

let VEHICLE_CATEGORIES = [];

function initVehicleCategories() {
    if (saved) {
        VEHICLE_CATEGORIES = JSON.parse(saved);
        // Migrate old data that used surcharge
        VEHICLE_CATEGORIES = VEHICLE_CATEGORIES.map(cat => {
            if (cat.percentage === undefined && cat.surcharge !== undefined) {
                // Convert old fixed surcharge to an approximate percentage or just 10/20
                if (cat.id === 'SUV') cat.percentage = 10;
                else if (cat.id === 'Camioneta') cat.percentage = 20;
                else cat.percentage = 0;
            }
            return cat;
        });
    } else {
        VEHICLE_CATEGORIES = [...DEFAULT_VEHICLE_CATEGORIES];
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
    if (saved) {
        FINANZAS = JSON.parse(saved);
    }
    renderFinanzas();
    populateEmpleadosSueldos();
}
function updateRevenueDisplay() {
    const elRevenue = document.getElementById('total-revenue-display');
    if (elRevenue) {
        // Calcular de washHistory si no está en FINANZAS o si así lo requiere la UI
        let sum = 0;
        washHistory.forEach(w => sum += Number(w.budget || 0));
        elRevenue.innerText = `$${sum.toLocaleString()}`;
    }
}

function saveFinanzas() {
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
    const unicos = [...new Set(empleados.map(e => e.name))];
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
            
            const newGasto = {
                fecha: new Date().toLocaleDateString('es-AR'),
                detalle,
                monto,
                estado
            };
            FINANZAS.gastos.push(newGasto);
            saveFinanzas();
            renderFinanzas();
            formGastos.reset();
            
            // Sync Supabase
            if (true) {
                fetchSupabase('lavadero_gastos', { method: 'POST', body: JSON.stringify(newGasto) });
            }
        });
    }
    
    const formSueldos = document.getElementById('form-sueldos');
    if(formSueldos) {
        formSueldos.addEventListener('submit', (e) => {
            e.preventDefault();
            const empleado = document.getElementById('sueldo-empleado').value;
            const monto = parseFloat(document.getElementById('sueldo-monto').value);
            
            const newSueldo = {
                fecha: new Date().toLocaleDateString('es-AR'),
                empleado_nombre: empleado,
                monto
            };
            FINANZAS.sueldos.push({
                fecha: newSueldo.fecha,
                empleado,
                monto
            });
            saveFinanzas();
            renderFinanzas();
            formSueldos.reset();
            
            // Sync Supabase
            if (true) {
                fetchSupabase('lavadero_sueldos', { method: 'POST', body: JSON.stringify(newSueldo) });
            }
        });
    }
    
    initFinanzas();
});

// Update updateRevenueDisplay to calculate net
const oldRev = window.updateRevenueDisplay ? window.updateRevenueDisplay.toString() : '';

// --- CROSS-TAB SYNC (ECOSISTEMA MULTI-PANTALLAS) ---

// --- GESTIÓN DE PROMOS (APP CLIENTE) ---
let APP_PROMOS = [];

function loadPromos() {
    if (saved) APP_PROMOS = JSON.parse(saved);
    renderAdminPromos();
}

function renderAdminPromos() {
    const tbody = document.getElementById('promos-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (APP_PROMOS.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-text-dim);">No hay promos publicadas.</td></tr>';
        return;
    }
    
    APP_PROMOS.forEach(promo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${promo.title}</strong></td>
            <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${promo.content}">${promo.content}</td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarPromo('${promo.id}')">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

const formPromo = document.getElementById('form-promo');
if (formPromo) {
    formPromo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('promo-title').value;
        const content = document.getElementById('promo-content').value;
        
        const newPromo = {
            id: Date.now().toString(),
            title: title,
            content: content,
            is_active: true
        };
        
        APP_PROMOS.push(newPromo);
        
        if (true) {
            await fetchSupabase('announcements', {
                method: 'POST',
                body: JSON.stringify(newPromo)
            });
        }
        
        renderAdminPromos();
        formPromo.reset();
        showFloatingToast('Promo publicada en la App Cliente');
    });
}

window.eliminarPromo = async function(id) {
    APP_PROMOS = APP_PROMOS.filter(p => p.id !== id);
    
    if (true) {
        await fetchSupabase(`announcements?id=eq.${id}`, { method: 'DELETE' });
    }
    renderAdminPromos();
    showFloatingToast('Promo eliminada');
};

document.addEventListener('DOMContentLoaded', loadPromos);

window.addEventListener('storage', (e) => {
    if (e.key === 'lavadero_active_vehicles' || e.key === 'lavadero_completed_history') {
        if (false) {
            if (savedVehicles) activeVehicles = JSON.parse(savedVehicles);
            
            if (savedHistory) washHistory = JSON.parse(savedHistory);
            
            if (typeof renderAll === 'function') {
                renderAll();
            }
            if (typeof renderStatusView === 'function') {
                renderStatusView(); // Para pantallas exclusivas
            }
        }
    }
});


// --- CCTV LOGIC ---
function updateCCTVClock() {
    const clockEl = document.getElementById('cctv-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('es-AR', { hour12: false }) + ' - ' + now.toLocaleDateString('es-AR');
    }
}
setInterval(updateCCTVClock, 1000);

function toggleFullscreen(cameraElement) {
    cameraElement.classList.toggle('fullscreen');
}

// --- AUTOMATIZACION DE COLA Y LAVADO ---
setInterval(() => {
    try {
        if (!activeVehicles) return;
        
        const currentTime = Date.now();
        const SERVICIOS_CON_ASPIRADO = ['combo-limpieza-total', 'combo-vip-gold', 'aspirado-interior'];
        
        let lavadoCars = activeVehicles.filter(v => v.zone === 'lavado');
        let aspiradoCars = activeVehicles.filter(v => v.zone === 'aspirado');
        
        for (let car of lavadoCars) {
            let elapsedMins = (currentTime - new Date(car.entered_at).getTime()) / 60000;
            if (elapsedMins >= 7) {
                if (SERVICIOS_CON_ASPIRADO.includes(car.wash_type)) {
                    updateVehicleZone(car.id, 'aspirado');
                } else {
                    updateVehicleZone(car.id, 'terminado');
                }
            }
        }
        
        for (let car of aspiradoCars) {
            let elapsedMins = (currentTime - new Date(car.entered_at).getTime()) / 60000;
            if (elapsedMins >= 7) {
                updateVehicleZone(car.id, 'terminado');
            }
        }
        
        lavadoCars = activeVehicles.filter(v => v.zone === 'lavado');
        if (lavadoCars.length === 0) {
            let esperaLavadoCars = activeVehicles.filter(v => v.zone === 'espera' && v.wash_type !== 'aspirado-interior');
            if (esperaLavadoCars.length > 0) {
                esperaLavadoCars.sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                updateVehicleZone(esperaLavadoCars[0].id, 'lavado');
            }
        }

        aspiradoCars = activeVehicles.filter(v => v.zone === 'aspirado');
        if (aspiradoCars.length < 2) {
            let esperaAspiradoCars = activeVehicles.filter(v => v.zone === 'espera' && v.wash_type === 'aspirado-interior');
            if (esperaAspiradoCars.length > 0) {
                esperaAspiradoCars.sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                updateVehicleZone(esperaAspiradoCars[0].id, 'aspirado');
            }
        }
    } catch (e) {
        console.error('Error en automatización:', e);
    }
}, 5000);
