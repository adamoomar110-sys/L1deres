// Paletas de apodos y colores F1
const NOMBRES = ["Max", "Lewis", "Charles", "Lando", "Fernando", "Checo", "Carlos", "George", "Oscar", "Alex", "Pierre", "Yuki", "Valtteri", "Nico", "Esteban"];

function getDisplayNickname(nickname) {
    if (!nickname) return 'Vehículo';
    if (typeof nickname === 'string' && nickname.startsWith('{')) {
        try {
            const parsed = JSON.parse(nickname);
            return parsed.name || 'Vehículo';
        } catch (e) {
            return nickname;
        }
    }
    if (typeof nickname === 'object') {
        return nickname.name || 'Vehículo';
    }
    return nickname;
}
const ADJETIVOS = ["Red Bull", "Mercedes", "Ferrari", "McLaren", "Aston Martin", "Williams", "Alpine", "Sauber", "Haas", "Racing Bulls"];
const COLORES = ["#00f0ff", "#84cc16", "#ffb800", "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#14b8a6", "#ff2800", "#00a19c", "#0600ef"];

const MAIN_CATEGORIES = [
    { id: 'lavado', title: 'Lavado', icon: '💦', base_price: 0 },
    { id: 'secado', title: 'Secado', icon: '💨', base_price: 5000 },
    { id: 'lavado_secado', title: 'Lavado y Secado', icon: '✨', base_price: 5000 }
];

const DEFAULT_WASH_OPTIONS = [
    { id: 'lavado-autos', title: 'Lavado Autos', icon: '🚗', price: 10000, category: 'lavados', items: ['Lavado exterior Autos'] },
    { id: 'lavado-utilitarios', title: 'Lavado Utilitarios', icon: '🚙', price: 12000, category: 'lavados', items: ['Lavado exterior Utilitarios'] },
    { id: 'lavado-pickup', title: 'Lavado Pick-up', icon: '🛻', price: 15000, category: 'lavados', items: ['Lavado exterior Pick-up'] },

    { id: 'completo-autos', title: 'Lavado + Interior Autos', icon: '🚗', price: 15000, category: 'combos', items: ['Lavado y aspirado Autos'] },
    { id: 'completo-utilitarios', title: 'Lavado + Interior Utilitarios', icon: '🚙', price: 18000, category: 'combos', items: ['Lavado y aspirado Utilitarios'] },
    { id: 'completo-pickup', title: 'Lavado + Interior Pick-up', icon: '🛻', price: 22000, category: 'combos', items: ['Lavado y aspirado Pick-up'] },

    { id: 'interior-autos', title: 'Interior Autos', icon: '🚗', price: 5000, category: 'interior', items: ['Aspirado Autos'] },
    { id: 'interior-utilitarios', title: 'Interior Utilitarios', icon: '🚙', price: 7000, category: 'interior', items: ['Aspirado Utilitarios'] },
    { id: 'interior-pickup', title: 'Interior Pick-up', icon: '🛻', price: 9000, category: 'interior', items: ['Aspirado Pick-up'] },

    // Retrocompatibilidad con órdenes viejas
    { id: 'lavado-simple', title: 'Lavado Simple', icon: '💦', price: 10000, category: 'lavados', items: [] },
    { id: 'lavado-especial', title: 'Lavado Especial', icon: '⭐', price: 15000, category: 'lavados', items: [] },
    { id: 'lavado-vip', title: 'Lavado VIP', icon: '👑', price: 20000, category: 'lavados', items: [] },
    { id: 'completo-simple', title: 'Completo Simple', icon: '💦', price: 15000, category: 'combos', items: [] },
    { id: 'completo-especial', title: 'Completo Especial', icon: '⭐', price: 20000, category: 'combos', items: [] },
    { id: 'completo-vip', title: 'Completo VIP', icon: '👑', price: 25000, category: 'combos', items: [] },
    { id: 'interior-solo', title: 'Solo Interior', icon: '💨', price: 8000, category: 'interior', items: [] }
];

let WASH_PACKAGES = [];
let WASH_NAMES = {};

function initWashPackages() {
    let saved = localStorage.getItem('lavadero_wash_settings');
    // Auto-fix para localStorage con emojis corruptos (cualquier variante)
    if (saved && (saved.includes('\u00c3\u00b0') || saved.includes('�x') || saved.includes('ð') || saved.includes('�\u0082�'))) {
        localStorage.removeItem('lavadero_wash_settings');
        saved = null;
    }

    if (saved) {
        WASH_PACKAGES = JSON.parse(saved);
        // Sincronizar paquetes nuevos que no est�n en localStorage
        let updated = false;
        DEFAULT_WASH_OPTIONS.forEach(defPkg => {
            if (!WASH_PACKAGES.find(p => p.id === defPkg.id)) {
                WASH_PACKAGES.push(defPkg);
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
        }
    } else {
        WASH_PACKAGES = [...DEFAULT_WASH_OPTIONS];
        localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
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
let insumos = [];
let config = {
    useSupabase: true,
    supabaseUrl: 'https://hacmhlyvyyysnvekvhya.supabase.co',
    supabaseKey: 'sb_publishable_oEB1MoOee7lM99mvHCu_aA_T98vg3NA',
    queueTable: 'lavadero_camera_queue',
    serviceTable: 'service_orders'
};
let isSimulationActive = false;

// --- CONTROL DE ERROR SUPABASE ---
let supabaseErrorShown = false;       // Evita spam de toasts
let supabaseOfflineBannerShown = false; // Evita crear múltiples banners

function showSupabaseOfflineBanner() {
    if (supabaseOfflineBannerShown) return;
    supabaseOfflineBannerShown = true;
    const banner = document.createElement('div');
    banner.id = 'supabase-offline-banner';
    banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
        'background:linear-gradient(90deg,#b45309,#d97706)', 'color:#fff',
        'padding:10px 20px', 'display:flex', 'align-items:center',
        'justify-content:space-between', 'font-family:var(--font-sans,sans-serif)',
        'font-size:0.85rem', 'font-weight:600', 'box-shadow:0 2px 12px rgba(0,0,0,0.4)',
        'gap:12px'
    ].join(';');
    banner.innerHTML = `
        <span>⚠️ <strong>Supabase sin conexión</strong> — El sistema está operando en modo local. Los datos se sincronizarán automáticamente cuando el servicio se restaure.</span>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            <a href="https://status.supabase.com" target="_blank"
               style="background:rgba(255,255,255,0.2);color:#fff;text-decoration:none;
                      padding:4px 10px;border-radius:6px;font-size:0.78rem;white-space:nowrap">
               Ver estado del servicio
            </a>
            <button onclick="checkSupabaseAndHideBanner()"
               style="background:rgba(255,255,255,0.2);color:#fff;border:none;
                      padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78rem;white-space:nowrap">
               🔄 Reintentar
            </button>
            <button onclick="document.getElementById('supabase-offline-banner').remove();supabaseOfflineBannerShown=false;"
               style="background:transparent;color:#fff;border:none;
                      font-size:1.1rem;cursor:pointer;padding:0 4px;line-height:1">✕</button>
        </div>
    `;
    document.body.prepend(banner);
}

async function checkSupabaseAndHideBanner() {
    const btn = document.querySelector('#supabase-offline-banner button');
    if (btn) btn.textContent = '⏳ Verificando...';
    try {
        const res = await fetch(`${config.supabaseUrl}/rest/v1/`, {
            headers: { 'apikey': config.supabaseKey }
        });
        if (res.ok || res.status === 400) {
            // 400 = connected but query issue, still means Supabase is UP
            const banner = document.getElementById('supabase-offline-banner');
            if (banner) banner.remove();
            supabaseOfflineBannerShown = false;
            supabaseErrorShown = false;
            showFloatingToast('✅ Supabase reconectado. Sincronizando datos...');
            await syncFromSupabase();
        } else {
            if (btn) btn.textContent = '🔄 Reintentar';
        }
    } catch {
        if (btn) btn.textContent = '🔄 Reintentar';
        showFloatingToast('❌ Supabase sigue sin responder. Revisá status.supabase.com');
    }
}
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
const elHistoryTableBody = document.getElementById('history-table-body');

const elHistoryTotalCount = document.getElementById('history-total-count');
const elHistoryTotalRevenue = document.getElementById('history-total-revenue');

// Modales & Tabs
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

// --- CARGAR CONFIGURACI N REMOTA DESDE VERCEL ENV ---
async function loadRemoteConfig() {
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const data = await res.json();
            if (data.supabaseUrl && data.supabaseKey) {
                const prevUrl = localStorage.getItem('supabase_url') || '';
                const prevKey = localStorage.getItem('supabase_key') || '';
                const credentialsChanged = prevUrl !== data.supabaseUrl || prevKey !== data.supabaseKey;

                config.useSupabase = true;
                config.supabaseUrl = data.supabaseUrl;
                config.supabaseKey = data.supabaseKey;
                config.queueTable = data.queueTable || 'lavadero_camera_queue';
                config.serviceTable = data.serviceTable || 'service_orders';

                // Sincronizar credenciales para que las pantallas externas e iframe las puedan leer inmediatamente
                localStorage.setItem('supabase_url', data.supabaseUrl);
                localStorage.setItem('supabase_key', data.supabaseKey);
                localStorage.setItem('lavadero_config', JSON.stringify(config));

                // Si cambiaron las credenciales con respecto a las que tenía el iframe, lo recargamos
                if (credentialsChanged) {
                    console.log("Supabase credentials updated, reloading iframe...");
                    const iframe = document.querySelector('iframe');
                    if (iframe) {
                        iframe.src = iframe.src;
                    }
                }

                // Actualizar la interfaz para reflejar que está conectado externamente
                if (elConnectionStatus) {
                    elConnectionStatus.className = "connection-status supabase-active";
                    elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";
                }
                return;
            }
        }
    } catch (err) {
        console.warn("⚠️ No se pudo obtener la configuración remota (usando fallback local):", err);
    }

    // FALLBACK: Si no pudimos obtener la configuración de la API (o no es válida),
    // pero config.useSupabase está activo, persistimos las credenciales fallback
    // en localStorage para que el iframe pueda conectarse.
    if (config.useSupabase && config.supabaseUrl && config.supabaseKey) {
        const prevUrl = localStorage.getItem('supabase_url') || '';
        const prevKey = localStorage.getItem('supabase_key') || '';
        const credentialsChanged = prevUrl !== config.supabaseUrl || prevKey !== config.supabaseKey;

        localStorage.setItem('supabase_url', config.supabaseUrl);
        localStorage.setItem('supabase_key', config.supabaseKey);
        localStorage.setItem('lavadero_config', JSON.stringify(config));

        if (credentialsChanged) {
            console.log("Supabase fallback credentials synced, reloading iframe...");
            const iframe = document.querySelector('iframe');
            if (iframe) {
                iframe.src = iframe.src;
            }
        }

        if (elConnectionStatus) {
            elConnectionStatus.className = "connection-status supabase-active";
            elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";
        }
    }
}


// --- CARGAR DATOS LOCALES ---

// --- SUPABASE CLIENT INSTANCE FOR REALTIME ---
let supabaseClient = null;

function initSupabaseClient() {
    if (config.useSupabase && config.supabaseUrl && config.supabaseKey && window.supabase) {
        if (!supabaseClient) {
            supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
            setupRealtimeSubscriptions();
        }
    }
}

function setupRealtimeSubscriptions() {
    if (!supabaseClient) return;

    // Suscripci�n a la tabla de cola
    supabaseClient
        .channel('public:lavadero_camera_queue')
        .on('postgres_changes', { event: '*', schema: 'public', table: config.queueTable || 'lavadero_camera_queue' }, payload => {
            console.log('Realtime change in queue:', payload);
            // Llamar a sync manual por simplicidad para asegurar estado consistente
            syncFromSupabase();
        })
        .subscribe();

    // Suscripci�n a la tabla de servicios
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
    const savedConfig = localStorage.getItem('lavadero_config');
    if (savedConfig) {
        // Mezclar configuraci�n guardada con los defaults
        const loadedConfig = JSON.parse(savedConfig);
        config = { ...config, ...loadedConfig };
        // Sincronizar credenciales para que la pantalla 3D de React las pueda leer
        if (config.supabaseUrl && config.supabaseKey) {
            localStorage.setItem('supabase_url', config.supabaseUrl);
            localStorage.setItem('supabase_key', config.supabaseKey);
        }
    }

    // Veh�culos Activos
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

// --- CONEXI�N DE DATOS & SYNC SUPABASE ---
function updateConnectionStatus(msg, className = '') {
    console.log("Supabase Status:", msg);
    if (!elConnectionStatus) return;

    const label = elConnectionStatus.querySelector('.status-label');
    if (!label) return;

    if (msg === "Connected") {
        elConnectionStatus.className = "connection-status supabase-active";
        label.innerText = "Supabase Sincronizado";
    } else if (msg === "Error" || className === "bg-danger") {
        elConnectionStatus.className = "connection-status";
        label.innerText = "Modo Local";
    } else if (msg === "Syncing...") {
        elConnectionStatus.className = "connection-status";
        label.innerText = "Sincronizando...";
    }
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
                } catch (e) { /* nickname es texto plano, no JSON */ }

                const realNickname = extra.name || dbCar.nickname || 'Veh�culo';
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
            saveStateLocally(false);
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

            const localHist = JSON.parse(localStorage.getItem('lavadero_completed_history') || '[]');
            const combined = [...historyMap, ...localHist];
            const uniqueHistory = Array.from(new Map(combined.map(item => [item.id, item])).values());

            washHistory = uniqueHistory.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
            localStorage.setItem('lavadero_completed_history', JSON.stringify(washHistory));
        }

        const insData = await fetchSupabase('lavadero_insumos');
        if (insData && Array.isArray(insData)) {
            insumos = insData;
            localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));
        }

        updateConnectionStatus("Connected");
        initSupabaseClient();
        if (typeof renderAll === 'function') renderAll();
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
        // Si hay respuesta exitosa, limpiar estado de error
        if (supabaseErrorShown) {
            supabaseErrorShown = false;
        }
        return await response.json();
    } catch (err) {
        console.error('🔴 Fallo en API Supabase:', err);
        // Mostrar mensaje solo una vez por sesión de error
        if (!supabaseErrorShown) {
            supabaseErrorShown = true;
            const esErrorDeRed = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('fetch'));
            if (esErrorDeRed) {
                showFloatingToast('⚠️ Supabase sin conexión — posible incidencia del servicio. Ver status.supabase.com', 8000, '#b45309');
                showSupabaseOfflineBanner();
            } else {
                showFloatingToast(`⚠️ Error de Supabase: ${err.message}. Operando en modo local.`, 6000, '#b45309');
                showSupabaseOfflineBanner();
            }
        }
        return null;
    }
}

function showFloatingToast(message, duration = 4000, bgColor = 'rgba(255, 59, 48, 0.95)') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.maxWidth = '380px';
    toast.style.backgroundColor = bgColor;
    toast.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    toast.style.color = '#fff';
    toast.style.padding = '0.9rem 1.4rem';
    toast.style.borderRadius = '1rem';
    toast.style.zIndex = '10000';
    toast.style.fontFamily = 'var(--font-sans, sans-serif)';
    toast.style.fontSize = '0.83rem';
    toast.style.fontWeight = '600';
    toast.style.lineHeight = '1.5';
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
    }, duration);
}

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
async function addVehicle(nickname, plate, color, budgetStr, washType, phone = '', clientType = 'normal', paymentMethod = 'transferencia', isPaid = false) {
    const budget = budgetStr ? parseFloat(budgetStr) : 0;
    const wType = washType || 'combo-limpieza-total';
    const washName = WASH_NAMES[wType] || 'Combo Limpieza Total';
    const uppercasePlate = plate.toUpperCase();

    if (config.useSupabase && uppercasePlate) {
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

    const newCar = {
        id: crypto.randomUUID(),
        tracking_id: Math.floor(Math.random() * 900) + 100,
        nickname,
        plate: uppercasePlate,
        phone,
        clientType,
        paymentMethod,
        isPaid,
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

    // Mostrar modal QR al registrar
    showQrModal(newCar);
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

    if (config.useSupabase && car.plate && car.plate !== 'SIN PATENTE') {
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
                    forma_pago: car.paymentMethod || 'transferencia',
                    monto: car.budget,
                    promo_aplicada: promoAplica
                })
            });

            if (promoAplica) {
                showFloatingToast(`�Atenci�n! Lavado nro ${client.visitas_totales + 1} de ${car.plate}. �Aplica Promoci�n!`);
            }
        }
    }

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
        } else if (car.zone === 'terminado') {
            timerHtml = `<span class="timer-badge finished">�S LISTO</span>`;
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
    // La aplicación de React (/pantalla_lavado) lee directamente de Supabase o localStorage.

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
        elEtaDisplay.innerText = "Sin Demoras �";
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
                if (car.zone === 'espera') {
                    nextZone = 'lavado';
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
                const text = encodeURIComponent(`¡¡Hola! Tu vehículo ${getDisplayNickname(car.nickname)} ya está listo y brillante. Te esperamos en Lavadero Tech System.`);
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
        const WASH_DURATION_SECS = 15 * 60; // 15 minutos en segundos

        // Calcular cu�nto tiempo restante le queda al auto que se est� lavando
        let remainingWashingSecs = 0;
        const washingEls = document.querySelectorAll('[data-timer-type="washing"]');
        if (washingEls.length > 0) {
            // Tomamos el primero que se est� lavando
            const startStr = washingEls[0].getAttribute('data-start');
            if (startStr) {
                const start = new Date(startStr).getTime();
                const elapsedSecs = Math.max(0, Math.floor((now - start) / 1000));
                remainingWashingSecs = Math.max(0, WASH_DURATION_SECS - elapsedSecs);
            }
        }

        // 1. Relojes en espera (Calculando ETA real acumulada)
        document.querySelectorAll('[data-timer-type="waiting"]').forEach((el, index) => {
            // El delay es el tiempo restante del vehiculo en lavado + (15 min por cada auto delante suyo)
            const waitTotalSecs = remainingWashingSecs + (index * WASH_DURATION_SECS);

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
    }, 1000);
}

// --- CONFIGURACI�N & MODAL ---

// Modal Toggle

if (elBtnCloseModal) elBtnCloseModal.addEventListener('click', () => {
    elModalConfig.classList.remove('active');
});

if (elModalConfig) elModalConfig.addEventListener('click', (e) => {
    if (e.target === elModalConfig) {
        elModalConfig.classList.remove('active');
    }
});

// Toggle campos de Supabase
if (elCheckUseSupabase) {
    elCheckUseSupabase.addEventListener('change', (e) => {
        if (e.target.checked) {
            elSupabaseFields.classList.remove('hidden');
        } else {
            elSupabaseFields.classList.add('hidden');
        }
    });
}

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
if (elBtnSaveConfig) elBtnSaveConfig.addEventListener('click', async () => {
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

if (elBtnClearHistory) elBtnClearHistory.addEventListener('click', async () => {
    if (confirm("�Est�s completamente seguro de borrar todo el historial y estad�sticas de recaudaci�n?")) {
        washHistory = [];
        saveStateLocally(false);
        renderAll();

        if (config.useSupabase) {
            try {
                await fetchSupabase(`${config.serviceTable}?status=eq.completed`, { method: 'DELETE' });
                showFloatingToast("Historial borrado en local y en la nube.");
            } catch (e) {
                console.error(e);
                showFloatingToast("Historial borrado localmente.");
            }
        } else {
            showFloatingToast("Historial borrado.");
        }
    }
});

// --- INICIALIZACI�N ---

// Cambiar color label
if (elInputColor) elInputColor.addEventListener('input', (e) => {
    elColorHexLabel.innerText = e.target.value.toUpperCase();
});

// Función para renderizar el menú interactivo
function renderWashMenu() {
    const grid = document.getElementById('wash-menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    WASH_PACKAGES.forEach(pkg => {
        if (pkg.activo === false) return; // Ocultar si está desactivado
        const card = document.createElement('div');
        card.className = `wash-menu-card ${pkg.id === selectedWashType ? 'selected' : ''}`;
        card.setAttribute('data-id', pkg.id);
        card.setAttribute('data-price', pkg.price);

        card.innerHTML = `
            <div class="check-badge">â��S</div>
            <div class="wash-card-icon">${pkg.icon}</div>
            <div class="wash-card-title">${pkg.title}</div>
            <div class="wash-card-price">$${pkg.price.toLocaleString('es-AR')}</div>
        `;

        card.addEventListener('click', () => {
            selectedWashType = pkg.id;
            elInputBudget.value = pkg.price;
            if (window.renderWashMenuOverride) window.renderWashMenuOverride(); else renderWashMenu(); // Re-render to update selected class
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
        if (plate.length >= 6 && config.useSupabase) {
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
if (elFormRegister) elFormRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = elInputNickname.value.trim();
    const plate = elInputPlate.value.trim();
    const phone = elInputPhone ? elInputPhone.value.trim() : '';
    const clientType = elInputClientType ? elInputClientType.value : 'normal';
    const paymentMethod = elInputPaymentMethod ? elInputPaymentMethod.value : 'transferencia';
    const isPaid = document.getElementById('input-is-paid') ? document.getElementById('input-is-paid').checked : false;
    const color = elInputColor.value;
    const budget = elInputBudget.value;
    const washType = selectedWashTypes.join(',');

    addVehicle(nickname, plate, color, budget, washType, phone, clientType, paymentMethod, isPaid);

    // Resetear formulario
    elInputNickname.value = '';
    elInputPlate.value = '';
    elInputPhone.value = '';
    if (document.getElementById('input-is-paid')) document.getElementById('input-is-paid').checked = false;
    elInputBudget.value = '18000';
    renderWashMenu();

    // Enfocar apodo para el siguiente
    elInputNickname.focus();

    showFloatingToast(`Vehículo ${nickname} registrado.`);
});

// Arrancar Aplicación
window.addEventListener('DOMContentLoaded', async () => {
    // Cargar primero la configuración local
    loadLocalData();
    // Intentar cargar primero la configuración de Vercel/Supabase remota
    await loadRemoteConfig();
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
        if (targetView === 'view-insumos') renderInsumos();
        if (targetView === 'view-precios') renderPrecios();
    });
});

// --- Lï¿½GICA DE INSUMOS ---
const formInsumo = document.getElementById('form-insumo');
const tbodyInsumos = document.getElementById('insumos-tbody');

if (formInsumo) {
    if (formInsumo) formInsumo.addEventListener('submit', async (e) => {
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
            const newIns = { id: crypto.randomUUID(), name, stock: stockToAdd };
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
            insumos.push({ id: crypto.randomUUID(), name: nombre, stock: 123 });
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

window.eliminarInsumo = async function (id) {
    insumos = insumos.filter(i => i.id !== id);
    localStorage.setItem('lavadero_insumos', JSON.stringify(insumos));

    if (config.useSupabase) {
        await fetchSupabase(`lavadero_insumos?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    renderInsumos();
};

window.editarInsumo = async function (id) {
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
        if (confirm('¿Restaurar precios y paquetes a sus valores por defecto?')) {
            WASH_PACKAGES = JSON.parse(JSON.stringify(DEFAULT_WASH_OPTIONS));
            localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
            initWashPackages();
            renderPrecios();
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
            <td><span class="plate-badge">${pkg.category || 'general'}</span></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" class="precio-input-activo" data-index="${index}" ${pkg.activo !== false ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </td>
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
            const newActivo = row.querySelector('.precio-input-activo').checked;

            WASH_PACKAGES[idx].title = newTitle;
            WASH_PACKAGES[idx].price = parseInt(newPrice);
            WASH_PACKAGES[idx].activo = newActivo;

            localStorage.setItem('lavadero_wash_settings', JSON.stringify(WASH_PACKAGES));
            initWashPackages(); // Actualizar mapeos
            renderWashMenu(); // Refrescar menu del form

            if (config.useSupabase) {
                fetchSupabase('lavadero_precios', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                        id: WASH_PACKAGES[idx].id,
                        name: newTitle,
                        price: parseInt(newPrice),
                        category: WASH_PACKAGES[idx].category || 'Auto',
                        activo: newActivo
                    })
                });
            }

            showFloatingToast('Precio y estado actualizados correctamente');

            e.target.innerText = '✓';
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
        if (pkg.activo === false) return; // Ocultar si está desactivado
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

// --- LÒ��SGICA DE POSTULANTES ---
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
        } catch (e) { console.error('Error cargando postulantes', e); }
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
        const imgSrc = app.selfie_url && app.selfie_url.length > 50 ? app.selfie_url : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(app.full_name) + '&background=06b6d4&color=fff';

        tr.innerHTML = `
            <td>
                <img src="${imgSrc}" alt="Selfie de ${app.full_name}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--color-cyan);">
            </td>
            <td>
                <div style="font-weight:bold; color:var(--color-cyan)">${app.full_name}</div>
                <div style="font-size:0.85em; color:var(--color-text-dim)">DNI: ${app.dni} â��¢ ${app.age || '--'} años</div>
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

window.contratarPostulante = async function (id, name) {
    const role = prompt(`¿Qué rol le asignarás a ${name}? (Ej: Lavador, Detallador, Encargado)`, 'Lavador');
    if (role === null) return; // Cancelado

    // Mover a empleados
    const savedEmp = localStorage.getItem('lavadero_empleados');
    let empList = savedEmp ? JSON.parse(savedEmp) : [];
    empList.push({ id: crypto.randomUUID(), name: name, role: role });
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
    if (typeof renderEmpleados === 'function') renderEmpleados();

    if (typeof showFloatingToast === 'function') {
        showFloatingToast(`${name} contratado como ${role}!`);
    } else {
        alert(`${name} fue contratado como ${role}!`);
    }
}

window.rechazarPostulante = async function (id) {
    if (!confirm('¿Seguro que quieres rechazar y eliminar a este postulante?')) return;

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

// Escuchar cambios de pestaÒ�±a para renderizar postulantes
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
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    // Calcular pos (Posición en la fila)
    const esperaCars = activeVehicles.filter(v => v.zone === 'espera');
    let pos = esperaCars.findIndex(v => v.id === car.id) + 1;
    if (pos <= 0) pos = 1;

    const url = `${baseUrl}cliente.html?n=${encodeURIComponent(car.nickname)}&c=${colorHex}&p=${encodeURIComponent(car.plate || 'SIN PATENTE')}&z=${car.zone}&t=${encodeURIComponent(car.wash_type || 'combo-limpieza-total')}&pos=${pos}&id=${car.id}`;

    const qrModal = document.getElementById('modal-ticket-qr');
    if (!qrModal) return;

    const qrImage = document.getElementById('qr-image');
    const qrLinkText = document.getElementById('qr-link-text');
    const btnCopy = document.getElementById('btn-copy-ticket');

    // Usar API de QR pública para generar la imagen
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=00f0ff&bgcolor=18181b`;
    // Make link clickable and QR image clickable
    qrLinkText.innerHTML = `<a href="${url}" target="_blank" style="color: var(--color-cyan); text-decoration: underline; word-break: break-all;">${url}</a>`;
    qrImage.style.cursor = 'pointer';
    qrImage.onclick = () => window.open(url, '_blank');

    btnCopy.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
            showFloatingToast("Enlace del cliente copiado al portapapeles.");
        });
    };

    qrModal.style.display = 'flex';
}


window.renderWashMenuOverride = function () {
    const grid = document.getElementById('wash-menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    WASH_PACKAGES.forEach(pkg => {
        if (pkg.active === false) return;

        const card = document.createElement('div');
        const isSelected = selectedWashTypes.includes(pkg.id);
        card.className = 'wash-option-card wash-menu-card ' + (isSelected ? 'selected' : '');
        card.setAttribute('data-id', pkg.id);

        card.innerHTML = `
            <div class="check-badge">�S</div>
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
setTimeout(() => { if (window.renderWashMenuOverride) window.renderWashMenuOverride(); }, 500);

window.openScannerModal = function () {
    const modal = document.getElementById('modal-scanner-ia');
    const btnCapture = document.getElementById('btn-capture-scan');
    
    if (!modal) return;
    
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('active');
    
    if (btnCapture) {
        btnCapture.style.display = 'inline-block';
        btnCapture.innerText = "📸 Capturar Foto";
    }

    startCameraIA('scanner-video', 'scanner-icon', 'scanner-text');
};

window.closeScannerModal = function () {
    const modal = document.getElementById('modal-scanner-ia');
    const btnCapture = document.getElementById('btn-capture-scan');
    
    stopCameraIA();
    
    if (btnCapture) btnCapture.style.display = 'none';
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
};

document.getElementById('btn-capture-scan')?.addEventListener('click', async () => {
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    const btnCapture = document.getElementById('btn-capture-scan');

    if (!video || !canvas) return;

    btnCapture.style.display = 'none';
    
    captureAndProcessIA(video, canvas, 'scanner-text', 'scanner-laser', function(result) {
        if (result.success) {
            document.getElementById('scanner-text').innerText = "¡VEHÍCULO DETECTADO CON ÉÉXITO!";
            
            if (result.model) {
                document.getElementById('input-nickname').value = result.model;
            }
            if (result.plate) {
                document.getElementById('input-plate').value = result.plate;
            }
            if (result.color) {
                document.getElementById('input-color').value = result.color;
            }
            
            if (window.calculateBudget) { window.calculateBudget(); }
            
            setTimeout(() => {
                window.closeScannerModal();
                if (typeof showFloatingToast === 'function') showFloatingToast("Análisis IA Visual exitoso");
            }, 2000);
        } else {
            document.getElementById('scanner-text').innerText = "ERROR EN IA VISUAL.";
            setTimeout(() => {
                window.closeScannerModal();
                if (typeof showFloatingToast === 'function') showFloatingToast("No se pudo detectar el vehículo.", "error");
            }, 2000);
        }
    });
});


// --- GESTIÓN DE CATEGORÍAS DE VEHÍCULOS ---
const DEFAULT_VEHICLE_CATEGORIES = [
    { id: 'Auto', percentage: 0, icon: '🚗' },
    { id: 'Camioneta', percentage: 20, icon: '🚐' }
];

let VEHICLE_CATEGORIES = [];

function initVehicleCategories() {
    let saved = localStorage.getItem('lavadero_vehicle_categories');
    
    // Si los datos están corruptos o incluyen 'SUV', forzamos el reinicio a los defaults
    if (saved && (saved.includes('xa') || saved.includes('x:') || saved.includes('SUV'))) {
        localStorage.removeItem('lavadero_vehicle_categories');
        saved = null;
    }

    if (saved) {
        VEHICLE_CATEGORIES = JSON.parse(saved);
        // Migrate old data that used surcharge
        VEHICLE_CATEGORIES = VEHICLE_CATEGORIES.map(cat => {
            if (cat.percentage === undefined && cat.surcharge !== undefined) {
                // Convert old fixed surcharge to an approximate percentage or just 10/20
                if (cat.id === 'Camioneta') cat.percentage = 20;
                else cat.percentage = 0;
            }
            return cat;
        });
        localStorage.setItem('lavadero_vehicle_categories', JSON.stringify(VEHICLE_CATEGORIES));
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
            opt.innerText = `${cat.icon} ${cat.id}`;
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

window.addVehicleCategory = function () {
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
    if (window.calculateBudget) window.calculateBudget();
}

window.deleteVehicleCategory = function (index) {
    if (VEHICLE_CATEGORIES.length <= 1) {
        alert('Debe quedar al menos una categoría.');
        return;
    }
    VEHICLE_CATEGORIES.splice(index, 1);
    localStorage.setItem('lavadero_vehicle_categories', JSON.stringify(VEHICLE_CATEGORIES));
    renderVehicleCategoriesTable();
    updateCategorySelects();
    if (window.calculateBudget) window.calculateBudget();
}

// Override calculateBudget to use dynamic multipliers
window.calculateBudget = function () {
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
        "Gol": "Auto", "Polo": "Auto", "Up!": "Auto", "Vento": "Auto", "Amarok": "Camioneta", "Nivus": "Camioneta", "Taos": "Camioneta", "T-Cross": "Camioneta", "Saveiro": "Camioneta"
    },
    "Toyota": {
        "Etios": "Auto", "Yaris": "Auto", "Corolla": "Auto", "Hilux": "Camioneta", "Corolla Cross": "Camioneta", "SW4": "Camioneta", "RAV4": "Camioneta"
    },
    "Ford": {
        "Ka": "Auto", "Fiesta": "Auto", "Focus": "Auto", "Ranger": "Camioneta", "Territory": "Camioneta", "EcoSport": "Camioneta", "Maverick": "Camioneta", "Bronco": "Camioneta"
    },
    "Peugeot": {
        "208": "Auto", "2008": "Camioneta", "3008": "Camioneta", "Partner": "Camioneta", "308": "Auto"
    },
    "Chevrolet": {
        "Onix": "Auto", "Cruze": "Auto", "Tracker": "Camioneta", "S10": "Camioneta", "Spin": "Camioneta", "Montana": "Camioneta"
    },
    "Fiat": {
        "Cronos": "Auto", "Argo": "Auto", "Toro": "Camioneta", "Pulse": "Camioneta", "Strada": "Camioneta", "Mobi": "Auto", "Fiorino": "Camioneta"
    },
    "Renault": {
        "Sandero": "Auto", "Logan": "Auto", "Kangoo": "Camioneta", "Duster": "Camioneta", "Alaskan": "Camioneta", "Stepway": "Auto", "Oroch": "Camioneta"
    },
    "Jeep": {
        "Renegade": "Camioneta", "Compass": "Camioneta", "Commander": "Camioneta"
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
        if (window.calculateBudget) calculateBudget();
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
    localStorage.setItem('lavadero_finanzas', JSON.stringify(FINANZAS));
    updateRevenueDisplay();
}

function renderFinanzas() {
    const gastosTbody = document.getElementById('gastos-tbody');
    const sueldosTbody = document.getElementById('sueldos-tbody');

    if (gastosTbody) {
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

    if (sueldosTbody) {
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
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione empleado...</option>';

    // Extraer empleados unicos del registro
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
    if (formGastos) {
        if (formGastos) formGastos.addEventListener('submit', (e) => {
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
            // if (config.useSupabase) {
            //     fetchSupabase('lavadero_gastos', { method: 'POST', body: JSON.stringify(newGasto) });
            // }
        });
    }

    const formSueldos = document.getElementById('form-sueldos');
    if (formSueldos) {
        if (formSueldos) formSueldos.addEventListener('submit', (e) => {
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
            // if (config.useSupabase) {
            //     fetchSupabase('lavadero_sueldos', { method: 'POST', body: JSON.stringify(newSueldo) });
            // }
        });
    }

    initFinanzas();
});

// Update updateRevenueDisplay to calculate net
const oldRev = window.updateRevenueDisplay ? window.updateRevenueDisplay.toString() : '';

// --- CROSS-TAB SYNC (ECOSISTEMA MULTI-PANTALLAS) ---

// --- GESTI�N DE PROMOS (APP CLIENTE) ---
let APP_PROMOS = [];

function loadPromos() {
    const saved = localStorage.getItem('lavadero_promos');
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
    if (formPromo) formPromo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('promo-title').value;
        const content = document.getElementById('promo-content').value;

        const newPromo = {
            id: crypto.randomUUID(),
            title: title,
            content: content,
            is_active: true
        };

        APP_PROMOS.push(newPromo);
        localStorage.setItem('lavadero_promos', JSON.stringify(APP_PROMOS));

        if (config.useSupabase) {
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

window.eliminarPromo = async function (id) {
    APP_PROMOS = APP_PROMOS.filter(p => p.id !== id);
    localStorage.setItem('lavadero_promos', JSON.stringify(APP_PROMOS));

    if (config.useSupabase) {
        await fetchSupabase(`announcements?id=eq.${id}`, { method: 'DELETE' });
    }
    renderAdminPromos();
    showFloatingToast('Promo eliminada');
};

document.addEventListener('DOMContentLoaded', loadPromos);

window.addEventListener('storage', (e) => {
    if (e.key === 'lavadero_active_vehicles' || e.key === 'lavadero_completed_history') {
        if (!config.useSupabase) {
            const savedVehicles = localStorage.getItem('lavadero_active_vehicles');
            if (savedVehicles) activeVehicles = JSON.parse(savedVehicles);

            const savedHistory = localStorage.getItem('lavadero_completed_history');
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
                if (car.category === 'lavado_secado' || car.category === 'secado' || SERVICIOS_CON_ASPIRADO.includes(car.wash_type)) {
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
            let esperaCars = activeVehicles.filter(v => v.zone === 'espera');
            if (esperaCars.length > 0) {
                esperaCars.sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                updateVehicleZone(esperaCars[0].id, 'lavado');
            }
        }
    } catch (e) {
        console.error('Error en automatizaci�n:', e);
    }
}, 5000);
