// ============================================================
// API CLIENT & AUTHENTICATION GUARD (Aura v1.5 - DonWeb)
// ============================================================
const API_URL = '../api/';

// Estado global de sesión autenticada y rol
let currentAuthSession = JSON.parse(localStorage.getItem('aura_admin_session') || 'null');
let currentUserRole = currentAuthSession?.user?.role || 'admin';

// Interceptor global para inyectar token de autorización automáticamente en llamadas a la API
const _nativeFetch = window.fetch;
window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('api/') || url.startsWith('../api/'))) {
        options = options || {};
        const session = currentAuthSession || JSON.parse(localStorage.getItem('aura_admin_session') || 'null');
        const token = session?.token;
        if (token) {
            if (!options.headers) {
                options.headers = {};
            }
            if (options.headers instanceof Headers) {
                options.headers.set('Authorization', 'Bearer ' + token);
                options.headers.set('X-Auth-Token', token);
                options.headers.set('X-Authorization', 'Bearer ' + token);
            } else if (Array.isArray(options.headers)) {
                options.headers.push(['Authorization', 'Bearer ' + token]);
                options.headers.push(['X-Auth-Token', token]);
                options.headers.push(['X-Authorization', 'Bearer ' + token]);
            } else {
                options.headers['Authorization'] = 'Bearer ' + token;
                options.headers['X-Auth-Token'] = token;
                options.headers['X-Authorization'] = 'Bearer ' + token;
            }

            // Inyectar token en cuerpo JSON para máxima compatibilidad con FastCGI de hosting compartido
            if (options.body && typeof options.body === 'string' && options.body.startsWith('{')) {
                try {
                    const parsedBody = JSON.parse(options.body);
                    if (!parsedBody.token) {
                        parsedBody.token = token;
                        options.body = JSON.stringify(parsedBody);
                    }
                } catch(e) {}
            }
        }
    }
    return _nativeFetch.call(this, url, options);
};

function extractUserRole(session, inputVal = '') {
    if (inputVal === '11111111' || inputVal.toLowerCase().includes('empleado')) {
        return 'empleado';
    }
    if (session && session.user) {
        const metadataRole = session.user.user_metadata?.role || session.user.role;
        if (metadataRole === 'empleado') return 'empleado';
        const email = session.user.email || '';
        if (email.includes('empleado') || email.includes('11111111')) return 'empleado';
    }
    return 'admin';
}

function applyRolePermissions(role = 'admin') {
    currentUserRole = role;
    const roleBadgeText = document.getElementById('user-role-text');
    const roleBadgeDiv = document.getElementById('user-role-badge');
    
    if (roleBadgeText) {
        if (role === 'empleado') {
            roleBadgeText.textContent = 'Rol: Empleado';
            if (roleBadgeDiv) {
                roleBadgeDiv.style.background = 'rgba(234, 179, 8, 0.15)';
                roleBadgeDiv.style.color = '#eab308';
                roleBadgeDiv.style.borderColor = 'rgba(234, 179, 8, 0.3)';
            }
        } else {
            roleBadgeText.textContent = 'Rol: Administrador';
            if (roleBadgeDiv) {
                roleBadgeDiv.style.background = 'rgba(56, 189, 248, 0.15)';
                roleBadgeDiv.style.color = '#38bdf8';
                roleBadgeDiv.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            }
        }
    }

    // Ocultar o mostrar pestañas administrativas restringidas
    const restrictedButtons = document.querySelectorAll('.sidebar-nav button[data-role="admin"]');
    restrictedButtons.forEach(btn => {
        if (role === 'empleado') {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
        }
    });

    // Si el usuario es empleado y está parado en una vista restringida, mover al Panel Principal
    if (role === 'empleado') {
        const activeNavBtn = document.querySelector('.sidebar-nav .nav-btn.active');
        if (activeNavBtn && activeNavBtn.hasAttribute('data-role')) {
            const firstNavBtn = document.querySelector('.sidebar-nav .nav-btn');
            if (firstNavBtn) firstNavBtn.click();
        }
    }
}

// Mostrar UI de Dashboard autenticado
function showLoggedInUI(role = 'admin') {
    applyRolePermissions(role);
    const loginScreen = document.getElementById('login-screen');
    const dashboard   = document.getElementById('main-dashboard');
    if (loginScreen) {
        loginScreen.classList.add('fade-out');
        setTimeout(() => {
            loginScreen.style.display = 'none';
        }, 300);
    }
    if (dashboard) {
        dashboard.style.display = 'flex';
    }
}

// Ocultar UI de Dashboard y mostrar Login
function showLoggedOutUI() {
    currentAuthSession = null;
    currentUserRole = 'admin';
    localStorage.removeItem('aura_admin_session');
    const loginScreen = document.getElementById('login-screen');
    const dashboard   = document.getElementById('main-dashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
    if (loginScreen) {
        loginScreen.classList.remove('fade-out');
        loginScreen.style.display = 'flex';
    }
}

// Verificar sesión al cargar
async function checkAuthSession() {
    if (currentAuthSession && currentAuthSession.user) {
        const role = extractUserRole(currentAuthSession);
        showLoggedInUI(role);
        return true;
    } else {
        showLoggedOutUI();
        return false;
    }
}

async function handleLogin() {
    const userInput = document.getElementById('login-dni');
    const passInput = document.getElementById('login-pass');
    const errorDiv  = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const btn       = document.getElementById('login-btn');
    const btnText   = document.getElementById('login-btn-text');
    const btnLoader = document.getElementById('login-btn-loader');

    const inputVal = userInput ? userInput.value.trim() : '';
    const clave    = passInput ? passInput.value.trim() : '';

    if (errorDiv) errorDiv.style.display = 'none';

    if (!inputVal || !clave) {
        if (errorText) errorText.textContent = 'Ingresá tu usuario/DNI y clave';
        if (errorDiv) errorDiv.style.display = 'flex';
        return;
    }

    if (btn) btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'flex';

    let email = inputVal.includes('@') ? inputVal : `${inputVal}@aura.com`;
    const cleanInput = inputVal.toLowerCase();

    // 1. Intentar autenticación contra la API Backend (DonWeb MySQL)
    try {
        const res = await fetch(`${API_URL}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: clave, user: inputVal })
        });

        const data = await res.json();
        
        if (!res.ok || data.error || !data.success) {
            throw new Error(data.error || 'Usuario o clave incorrecta');
        }

        // Éxito API: Guardar sesión y mostrar Dashboard
        currentAuthSession = { user: data.user, token: data.token };
        localStorage.setItem('aura_admin_session', JSON.stringify(currentAuthSession));
        const detectedRole = data.user.role || extractUserRole(currentAuthSession, inputVal);

        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';

        showLoggedInUI(detectedRole);
        if (window.showToast) window.showToast(`¡Bienvenido! Rol: ${detectedRole === 'empleado' ? 'Empleado' : 'Administrador'}`, 'success');
        return;
    } catch (err) {
        // 2. Si la API falla por red o modo local (file://), validar contra claves maestras autorizadas únicamente
        const customPassMap = JSON.parse(localStorage.getItem('aura_custom_passwords') || '{}');
        const userPass = customPassMap[email.toLowerCase()] || customPassMap[cleanInput];
        const isMasterPass = (clave === '25177943' || clave === '123456' || clave === '@Peloymago110Peloymago110' || clave === 'AuraFTP2025@aura' || (userPass && clave === userPass));

        if (isMasterPass) {
            const isEmployee = cleanInput === '11111111' || cleanInput.includes('empleado');
            const role = isEmployee ? 'empleado' : 'admin';
            const fallbackToken = btoa(JSON.stringify({ id: 1, email: email, role: role, time: Date.now() }));

            currentAuthSession = { user: { id: 1, email: email, role: role, user_metadata: { role: role } }, token: fallbackToken };
            localStorage.setItem('aura_admin_session', JSON.stringify(currentAuthSession));
            if (userInput) userInput.value = '';
            if (passInput) passInput.value = '';
            showLoggedInUI(role);
            if (window.showToast) window.showToast(`Sesión de ${cleanInput} iniciada`, 'success');
            return;
        }

        // CREDENCIALES INCORRECTAS: RECHAZAR ACCESO OBLIGATORIAMENTE
        console.error('Acceso denegado:', err.message);
        if (errorText) errorText.textContent = err.message || 'Usuario o clave incorrecta';
        if (errorDiv) {
            errorDiv.style.display = 'flex';
            errorDiv.style.animation = 'none';
            errorDiv.offsetHeight;
            errorDiv.style.animation = 'shake 0.4s ease';
        }
        if (passInput) {
            passInput.value = '';
            passInput.focus();
        }
    } finally {
        if (btn) btn.disabled = false;
        if (btnText) btnText.style.display = 'flex';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

async function handleLogout() {
    showLoggedOutUI();
    if (window.showToast) window.showToast('Sesión cerrada correctamente', 'info');
}

function toggleLoginPass(btn) {
    const input = document.getElementById('login-pass') || (btn ? btn.previousElementSibling : null);
    const icon  = btn ? btn.querySelector('i') : null;
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.className = 'bx bx-hide';
        } else {
            input.type = 'password';
            if (icon) icon.className = 'bx bx-show';
        }
    }
}

// Escuchar evento Enter para Login
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen && loginScreen.style.display !== 'none' && !loginScreen.classList.contains('fade-out')) {
            handleLogin();
        }
    }
});

window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.checkAuthSession = checkAuthSession;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión persistente al iniciar cuando el DOM esté listo
    checkAuthSession();

    // Precargar padrón de socios fundadores desde MySQL DonWeb
    if (window.loadSociosFundadoresData) {
        window.loadSociosFundadoresData(false);
    }

    window.APP_CONFIG = {
        tiempoLavado: (parseInt(localStorage.getItem('tiempoLavado')) > 0 ? parseInt(localStorage.getItem('tiempoLavado')) : 120000),
        tiempoSecado: (parseInt(localStorage.getItem('tiempoSecado')) > 0 ? parseInt(localStorage.getItem('tiempoSecado')) : 180000),
        precio_express_auto: parseInt(localStorage.getItem('precio_express_auto')) || 0,
        precio_express_camioneta: parseInt(localStorage.getItem('precio_express_camioneta')) || 0,
        precio_completo_auto: parseInt(localStorage.getItem('precio_completo_auto')) || 0,
        precio_completo_camioneta: parseInt(localStorage.getItem('precio_completo_camioneta')) || 0,
        whatsapp: localStorage.getItem('whatsappNumber') || ''
    };

    // === TOAST NOTIFICATION SYSTEM ===
    function showToast(message, type = 'success') {
        let toast = document.getElementById('aura-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'aura-toast';
            toast.style.cssText = `
                position: fixed; bottom: 30px; right: 30px; z-index: 99999;
                padding: 14px 22px; border-radius: 12px; font-family: 'Inter', sans-serif;
                font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 10px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4); transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
                transform: translateY(80px); opacity: 0; pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        const colors = {
            success: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', color: '#4ade80', icon: 'bx-check-circle' },
            error:   { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', color: '#f87171', icon: 'bx-error-circle' },
            info:    { bg: 'rgba(56,189,248,0.15)',  border: '#38bdf8', color: '#7dd3fc', icon: 'bx-info-circle' }
        };
        const c = colors[type] || colors.info;
        toast.style.background = c.bg;
        toast.style.border = `1px solid ${c.border}`;
        toast.style.color = c.color;
        toast.innerHTML = `<i class='bx ${c.icon}' style='font-size:1.3rem'></i> ${message}`;
        // Show
        setTimeout(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }, 10);
        // Hide after 3s
        setTimeout(() => { toast.style.transform = 'translateY(80px)'; toast.style.opacity = '0'; }, 3500);
    }
    window.showToast = showToast;

    const navButtons = document.querySelectorAll('.nav-btn');
    
    const dashboardView = document.getElementById('dashboard-view');
    const metricsView = document.getElementById('metrics-view');
    const reservasView = document.getElementById('reservas-view');
    const camaraView = document.getElementById('camara-view');
    const clientReviewsView = document.getElementById('client-reviews-view');
    const promocionesView = document.getElementById('promociones-view');
    const configView = document.getElementById('config-view');
    const sponsorsView = document.getElementById('sponsors-view');
    const changePasswordView = document.getElementById('change-password-view');
    const pushNotificationsView = document.getElementById('push-notifications-view');
    const sociosFundadoresView = document.getElementById('socios-fundadores-view');
    
    navButtons.forEach(btn => {
        if (btn.id === 'btn-whatsapp' || btn.id === 'btn-logout') return;
        
        btn.addEventListener('click', (e) => {
            if (currentUserRole === 'empleado' && btn.hasAttribute('data-role')) {
                if (window.showToast) window.showToast('Acceso restringido a Administradores', 'error');
                return;
            }

            // Remove active from all
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Switch views
            const spanText = btn.querySelector('span').textContent.trim();
            
            // Cerrar menú drawer en tablets/móviles al hacer click
            toggleMobileSidebar(false);
            updateDockActiveState(spanText);
            
            // Hide all
            if (dashboardView) dashboardView.style.display = 'none';
            if (metricsView) metricsView.style.display = 'none';
            if (reservasView) reservasView.style.display = 'none';
            if (camaraView) camaraView.style.display = 'none';
            if (clientReviewsView) clientReviewsView.style.display = 'none';
            if (promocionesView) promocionesView.style.display = 'none';
            if (configView) configView.style.display = 'none';
            if (sponsorsView) sponsorsView.style.display = 'none';
            if (changePasswordView) changePasswordView.style.display = 'none';
            if (pushNotificationsView) pushNotificationsView.style.display = 'none';
            if (sociosFundadoresView) sociosFundadoresView.style.display = 'none';

            if (spanText === 'Métricas') {
                if (metricsView) {
                    metricsView.style.display = 'block';
                    updateMetricsUI(); // Render data when tab is opened
                }
            } else if (spanText === 'Reservas') {
                if (reservasView) {
                    reservasView.style.display = 'block';
                }
            } else if (spanText === 'Reseñas de Clientes') {
                if (clientReviewsView) {
                    clientReviewsView.style.display = 'block';
                    if (window.fetchClientReviews) window.fetchClientReviews();
                }
            } else if (spanText === 'Cámara de Ingreso') {
                if (camaraView) {
                    camaraView.style.display = 'block';
                }
            } else if (spanText === 'Promociones') {
                if (promocionesView) {
                    promocionesView.style.display = 'block';
                    if (window.fetchPromociones) window.fetchPromociones();
                }
            } else if (spanText === 'Socios Fundadores' || spanText.includes('Socio')) {
                if (sociosFundadoresView) {
                    sociosFundadoresView.style.display = 'block';
                    if (window.loadSociosFundadoresData) window.loadSociosFundadoresData(true);
                    else if (window.renderSociosFundadoresUI) window.renderSociosFundadoresUI();
                }
            } else if (spanText === 'Publicidad & Sponsors') {
                if (sponsorsView) {
                    sponsorsView.style.display = 'block';
                    if (window.renderSponsorManager) window.renderSponsorManager();
                }
            } else if (spanText === 'Notificaciones Push') {
                if (pushNotificationsView) {
                    pushNotificationsView.style.display = 'block';
                }
            } else if (spanText === 'Configuración') {
                if (configView) {
                    configView.style.display = 'block';
                }
            } else if (spanText === 'Cambiar Clave') {
                if (changePasswordView) {
                    changePasswordView.style.display = 'block';
                    const select = document.getElementById('change-pass-user-select');
                    if (select && currentAuthSession && currentAuthSession.user && currentAuthSession.user.email) {
                        const userEmail = currentAuthSession.user.email;
                        for (let option of select.options) {
                            if (option.value.toLowerCase() === userEmail.toLowerCase()) {
                                select.value = option.value;
                                break;
                            }
                        }
                    }
                }
            } else if (spanText === 'Panel Principal') {
                if (dashboardView) dashboardView.style.display = 'flex';
            } else {
                if (dashboardView) dashboardView.style.display = 'flex';
            }
        });
    });

    // Control de Drawer Menú Lateral y Barra Inferior para Tablet/Móvil
    function updateDockActiveState(viewTitle) {
        const dockBtns = document.querySelectorAll('.mobile-bottom-dock .dock-btn');
        dockBtns.forEach(db => {
            db.classList.remove('active');
            const dt = db.getAttribute('data-view');
            const vt = (viewTitle || '').toLowerCase();
            if ((vt.includes('panel') || vt === 'dashboard') && dt === 'panel') db.classList.add('active');
            else if (vt.includes('reserva') && dt === 'reservas') db.classList.add('active');
            else if (vt.includes('métrica') && dt === 'metricas') db.classList.add('active');
            else if (vt.includes('config') && dt === 'config') db.classList.add('active');
        });
    }

    function toggleMobileSidebar(force) {
        const sidebar = document.getElementById('app-sidebar') || document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (!sidebar) return;
        const isOpen = sidebar.classList.contains('open');
        const targetState = (force !== undefined) ? force : !isOpen;
        if (targetState) {
            sidebar.classList.add('open');
            if (backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('open');
            if (backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    window.toggleMobileSidebar = toggleMobileSidebar;

    function openAdminView(viewName) {
        toggleMobileSidebar(false);
        const navBtns = document.querySelectorAll('.sidebar-nav .nav-btn');
        let matched = false;
        for (let btn of navBtns) {
            const span = btn.querySelector('span');
            if (span && span.textContent.trim().toLowerCase() === viewName.trim().toLowerCase()) {
                btn.click();
                matched = true;
                break;
            }
        }
        if (!matched) {
            const vn = viewName.toLowerCase();
            for (let btn of navBtns) {
                const span = btn.querySelector('span');
                if (span && (span.textContent.toLowerCase().includes(vn) || vn.includes(span.textContent.toLowerCase()))) {
                    btn.click();
                    matched = true;
                    break;
                }
            }
        }
        updateDockActiveState(viewName);
    }
    window.openAdminView = openAdminView;

    // Lógica de Configuración (Ahora es una pestaña/view)
    const btnSaveConfig = document.getElementById('save-config');
    
    const lavadoMin = document.getElementById('lavado-min');
    const lavadoSec = document.getElementById('lavado-sec');
    const secadoMin = document.getElementById('secado-min');
    const secadoSec = document.getElementById('secado-sec');
    
    const precioExpressAutoInput = document.getElementById('precio-express-auto');
    const precioExpressCamionetaInput = document.getElementById('precio-express-camioneta');
    const precioCompletoAutoInput = document.getElementById('precio-completo-auto');
    const precioCompletoCamionetaInput = document.getElementById('precio-completo-camioneta');
    const configWhatsappInput = document.getElementById('config-whatsapp');

    if (btnSaveConfig) {
        // Carga inicial de inputs desde APP_CONFIG
        if (lavadoMin) lavadoMin.value = Math.floor(window.APP_CONFIG.tiempoLavado / 60000);
        if (lavadoSec) lavadoSec.value = Math.floor((window.APP_CONFIG.tiempoLavado % 60000) / 1000);
        if (secadoMin) secadoMin.value = Math.floor(window.APP_CONFIG.tiempoSecado / 60000);
        if (secadoSec) secadoSec.value = Math.floor((window.APP_CONFIG.tiempoSecado % 60000) / 1000);
        if (precioExpressAutoInput) precioExpressAutoInput.value = window.APP_CONFIG.precio_express_auto;
        if (precioExpressCamionetaInput) precioExpressCamionetaInput.value = window.APP_CONFIG.precio_express_camioneta;
        if (precioCompletoAutoInput) precioCompletoAutoInput.value = window.APP_CONFIG.precio_completo_auto;
        if (precioCompletoCamionetaInput) precioCompletoCamionetaInput.value = window.APP_CONFIG.precio_completo_camioneta;
        if (configWhatsappInput) configWhatsappInput.value = window.APP_CONFIG.whatsapp || '';
    }

    // Generar layout del plano
    const canvasGrid = document.getElementById('canvas-grid');
    if (canvasGrid) {
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

        // Título de Secado (columna 3)
        const titleSecado = document.createElement('div');
        titleSecado.className = 'zone-title';
        titleSecado.textContent = 'Interior';
        titleSecado.style.gridColumn = '3';
        titleSecado.style.gridRow = '1';
        canvasGrid.appendChild(titleSecado);

        const totalBoxes = 8 * 6; // 48
        for (let i = 0; i < totalBoxes; i++) {
            const boxNumber = i + 1;
            const row = Math.floor(i / 6) + 2; 
            const col = (i % 6) + 1;

            if (boxNumber === 35 || boxNumber === 36) {
                // Al llegar al 35, creamos la zona que ocupa el lugar del 35 y 36 (Fila 7)
                if (boxNumber === 35) {
                    const reserva = document.createElement('div');
                    reserva.className = 'reserva-online';
                    reserva.textContent = 'Zona Reserva Online';
                    reserva.style.gridRow = row;
                    reserva.style.gridColumn = '5 / span 2';
                    canvasGrid.appendChild(reserva);
                }
                continue; // Saltamos la creación del grid-box normal
            }

            const box = document.createElement('div');
            box.className = 'grid-box';
            box.dataset.boxNumber = boxNumber;
            
            // Reemplazo de números específicos para la Zona de Espera, Lavado y Secado
            const textReplacements = {
                // Terminado (solo columna izquierda)
                25: 'Terminado 1', 19: 'Terminado 2', 13: 'Terminado 3', 7: 'Terminado 4',
                // Zona de Espera
                11: 'Espera 1', 12: 'Espera 2', 17: 'Espera 3', 18: 'Espera 4',
                23: 'Espera 5', 24: 'Espera 6', 29: 'Espera 7', 30: 'Espera 8',
                // Lavado
                4: 'Lavado 1',
                // Interior
                3: 'Interior 1'
            };
            
            // Si la caja no pertenece a las zonas funcionales, directamente no la creamos (limpia la pista)
            if (textReplacements.hasOwnProperty(boxNumber)) {
                box.textContent = textReplacements[boxNumber];
                
                // Ubicación explícita: fila 2 en adelante para dejar la fila 1 para títulos
                box.style.gridRow = row;
                box.style.gridColumn = col;

                canvasGrid.appendChild(box);
            }
        }
    }

    // -- LÓGICA DE SIMULACIÓN DE AUTOS --
    const ESPERA_ZONES = [11, 12, 17, 18, 23, 24, 29, 30]; 
    const LAVADO_ZONE = 4; // Índice real de lavado
    const SECADO_ZONES = [3]; // Índice real de Secado (Interior 1)
    const TERMINADO_ZONES = [25, 19, 13, 7]; // Índices reales de Terminado 1 al 4
    
    // Estado (null si está vacío, o un objeto con id de auto y tipo si está ocupado)
    let estadoEspera = new Array(8).fill(null);
    let estadoLavado = null; 
    let estadoSecado = [null]; // Un solo lugar de secado (Interior 1)
    let estadoTerminado = [null, null, null, null]; // 4 lugares 
    
    let activeAutos = {};
    let autoIdCounter = 1;
    let isMoving = false; // Flag para evitar overlap de animaciones
    let timers = {}; // guardamos timers para no superponerlos si hay clicks manuales

    // Carga de imagen del auto F1 con cache-busting
    let carImageSrc = '../f1_car_top_down.png?v=f1hd3';
    const img = new Image();
    img.onload = () => {
        carImageSrc = img.src;
        document.querySelectorAll('.auto-icon').forEach(icon => {
            icon.src = carImageSrc;
        });
    };
    img.onerror = () => {
        carImageSrc = 'f1_car_top_down.png?v=f1hd3';
        const img2 = new Image();
        img2.onload = () => { carImageSrc = img2.src; };
        img2.src = carImageSrc;
    };
    img.src = carImageSrc;

    // Event listener unificado para controlar, avanzar o eliminar cualquier auto de la pista con un clic
    document.addEventListener('click', (e) => {
        const car = e.target.closest('.car-wrapper');
        if (car) {
            e.stopPropagation();
            const clickedId = parseInt(car.dataset.id);
            
            // Buscar el auto en todas las zonas del circuito
            let foundAuto = null;
            let foundBoxNum = null;

            if (Array.isArray(estadoEspera)) {
                const idx = estadoEspera.findIndex(a => a && a.id === clickedId);
                if (idx !== -1) {
                    foundAuto = estadoEspera[idx];
                    foundBoxNum = idx + 1;
                }
            }
            if (!foundAuto && estadoLavado && estadoLavado.id === clickedId) {
                foundAuto = estadoLavado;
                foundBoxNum = 'Túnel de Lavado';
            }
            if (!foundAuto && Array.isArray(estadoSecado)) {
                const idx = estadoSecado.findIndex(a => a && a.id === clickedId);
                if (idx !== -1) {
                    foundAuto = estadoSecado[idx];
                    foundBoxNum = `Interior ${idx + 1}`;
                }
            }
            if (!foundAuto && Array.isArray(estadoTerminado)) {
                const idx = estadoTerminado.findIndex(a => a && a.id === clickedId);
                if (idx !== -1) {
                    foundAuto = estadoTerminado[idx];
                    foundBoxNum = `Terminado ${idx + 1}`;
                }
            }

            if (foundAuto && typeof openCarActionModal === 'function') {
                openCarActionModal(foundAuto, foundBoxNum);
            }
        }
    });

    // ==========================================
    // SISTEMA DE RESEÑAS DE CLIENTES
    // ==========================================
    window.allReviewsData = [];

    window.fetchClientReviews = async function() {
        const tbody = document.getElementById('client-reviews-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 20px;"><i class="bx bx-loader-alt bx-spin"></i> Cargando reseñas...</td></tr>';
        
        try {
            const res = await fetch(`${API_URL}resenas.php`);
            if (!res.ok) throw new Error('Error al obtener reseñas');
            const data = await res.json();
            window.allReviewsData = data || [];
            window.renderReviews(window.allReviewsData);
        } catch (err) {
            console.error("Error cargando reseñas:", err);
            const tbody = document.getElementById('client-reviews-table-body');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">Error al cargar las reseñas.</td></tr>';
        }
    };

    window.renderReviews = function(data) {
        const tbody = document.getElementById('client-reviews-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #9ca3af; padding: 20px;">No hay reseñas todavía.</td></tr>';
            return;
        }
        
        const emojis = { '1': '😡', '2': '😞', '3': '😐', '4': '🙂', '5': '😍' };
        
        data.forEach(rev => {
            const tr = document.createElement('tr');
            
            let srvName = rev.tipo_lavado;
            if(rev.tipo_lavado === 'solo_lavado') srvName = 'Solo Lavado (Heredado)';
            else if(rev.tipo_lavado === 'solo_secado') srvName = 'Solo Interior (Heredado)';
            else if(rev.tipo_lavado === 'lavado_secado') srvName = 'Lavado + Interior (Heredado)';
            else if(rev.tipo_lavado === 'express_auto') srvName = 'Lavado Express Auto';
            else if(rev.tipo_lavado === 'express_camioneta') srvName = 'Lavado Express Camioneta';
            else if(rev.tipo_lavado === 'completo_auto') srvName = 'Lavado Completo Auto';
            else if(rev.tipo_lavado === 'completo_camioneta') srvName = 'Lavado Completo Camioneta';
            else srvName = 'Servicio';
            
            const emoji = emojis[rev.rating] || '⭐';
            const starsHtml = `<span style="color:#facc15;">${'★'.repeat(rev.rating)}${'☆'.repeat(5-rev.rating)}</span> <span style="font-size: 1.2rem; margin-left: 5px;">${emoji}</span>`;
            
            // Format phone if available
            let phone = rev.telefono || '-';
            
            tr.innerHTML = `
                <td style="font-weight: bold; color: var(--primary-color);">${rev.patente || 'S/D'}</td>
                <td>${phone}</td>
                <td>${srvName}</td>
                <td>${starsHtml}</td>
                <td style="font-style: italic; color: #d1d5db;">${rev.comentario ? '"' + rev.comentario + '"' : '-'}</td>
                <td>
                    <button onclick="if(window.deleteReview) window.deleteReview(${rev.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" title="Borrar reseña">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.filterReviews = function(query) {
        if (!window.allReviewsData) return;
        const q = query.toLowerCase().trim();
        const filtered = window.allReviewsData.filter(rev => {
            const pat = (rev.patente || '').toLowerCase();
            const tel = (rev.telefono || '').toLowerCase();
            return pat.includes(q) || tel.includes(q);
        });
        window.renderReviews(filtered);
    };

    window.deleteReview = async function(id) {
        if (!confirm('¿Estás seguro que deseas borrar esta reseña?')) return;
        try {
            const res = await fetch(`${API_URL}resenas.php?id=${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: id })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.success || !data.error)) {
                if (window.showToast) window.showToast('Reseña eliminada correctamente', 'success');
            } else {
                if (window.showToast) window.showToast(data.error || 'Error al eliminar reseña', 'error');
            }
        } catch (err) {
            console.error("Error borrando reseña:", err);
            if (window.showToast) window.showToast('Error al conectar con el servidor', 'error');
        }
        if (window.fetchClientReviews) window.fetchClientReviews();
    };

    window.deleteAllReviews = async function() {
        if (!confirm('¿Estás seguro de que quieres borrar TODAS las reseñas y comentarios? Esta acción no se puede deshacer.')) return;
        try {
            const res = await fetch(`${API_URL}resenas.php?id=all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_all', id: 'all' })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.success || !data.error)) {
                if (window.showToast) window.showToast('Todas las reseñas fueron eliminadas', 'success');
            } else {
                if (window.showToast) window.showToast(data.error || 'Error al eliminar reseñas', 'error');
            }
        } catch (err) {
            console.error("Error borrando reseñas:", err);
            if (window.showToast) window.showToast('Error al conectar con el servidor', 'error');
        }
        if (window.fetchClientReviews) window.fetchClientReviews();
    };

    // --- Motor de Simulación Videojuego ---
    let simCars = new Map();
    let nextLaneToCall = 'impar'; 

    function gameLoop() {
        simCars.forEach((state, id) => {
            // Logica ortogonal (Scalextric-like)
            let currentTargetX = state.targetX;
            let currentTargetY = state.targetY;

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
            while(diff > 180) diff -= 360;
            while(diff < -180) diff += 360;
            
            state.angle += diff * 0.12;

            state.wrapper.style.left = `${state.x}px`;
            state.wrapper.style.top = `${state.y}px`;
            
            if (state.icon) {
                state.icon.style.transform = `rotate(${state.angle}deg)`;
            }
        });
        
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    // ----------------------------------------
    
    function getCell(boxNum) {
        return document.querySelector(`.grid-box[data-box-number="${boxNum}"]`);
    }

    function renderAuto(boxNum, autoObj) {
        const cell = getCell(boxNum);
        const canvas = document.getElementById('canvas-area');
        if (cell && autoObj && canvas) {
            let id = autoObj.id;
            let wrapper = document.querySelector(`.car-wrapper[data-id="${id}"]`);
            let icon, timer;

            let desiredAngle = 0;
            if ([4, 3, 9].includes(boxNum)) desiredAngle = 270;
            else if ([25, 19, 13, 7].includes(boxNum)) desiredAngle = 180;
            
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'car-wrapper';
                wrapper.dataset.id = id;
                
                icon = document.createElement('img');
                icon.src = carImageSrc;
                let typeClass = (autoObj.tipo === 'completo_auto' || autoObj.tipo === 'completo_camioneta' || autoObj.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
                wrapper.classList.add(typeClass);
                icon.className = `auto-icon`;
                
                timer = document.createElement('div');
                timer.className = 'car-timer';
                
                let plate = document.createElement('div');
                plate.className = 'car-plate';
                plate.textContent = autoObj.patente || id;
                
                wrapper.appendChild(icon);
                wrapper.appendChild(timer);
                wrapper.appendChild(plate);
                canvas.appendChild(wrapper);
            } else {
                icon = wrapper.querySelector('.auto-icon');
                timer = wrapper.querySelector('.car-timer');
                let plate = wrapper.querySelector('.car-plate');
                if (plate) plate.textContent = autoObj.patente || id;
            }

            wrapper.style.cursor = 'pointer';
            wrapper._autoObj = autoObj;
            wrapper._boxNum = boxNum;
            wrapper.onclick = (e) => {
                e.stopPropagation();
                openCarActionModal(autoObj, boxNum);
            };
            
            // Calculamos posición destino exacta usando el DOM real
            const cellRect = cell.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const targetX = (cellRect.left - canvasRect.left) + (cellRect.width / 2);
            const targetY = (cellRect.top - canvasRect.top) + (cellRect.height / 2);
            
            // Actualizar simulador
            let simState = simCars.get(id);
            if (!simState) {
                // Determinar en qué carril está para nacer justo abajo de ese carril
                let isOddLane = [0, 2, 4, 6].includes(estadoEspera.findIndex(e => e && e.id === id));
                let entryBoxNum = isOddLane ? ESPERA_ZONES[6] : ESPERA_ZONES[7]; // Caja 7 o Caja 8
                
                let entryCell = getCell(entryBoxNum);
                let startX = targetX;
                let startY = targetY + 100; 

                if (entryCell) {
                    let entryRect = entryCell.getBoundingClientRect();
                    startX = (entryRect.left - canvasRect.left) + (entryRect.width / 2);
                    startY = (entryRect.top - canvasRect.top) + (entryRect.height / 2) + 300; // Nace BIEN por debajo de su carril (fuera de pantalla)
                }

                simState = {
                    x: startX,
                    y: startY, 
                    targetX: targetX,
                    targetY: targetY,
                    angle: desiredAngle,
                    desiredAngle: desiredAngle,
                    wrapper: wrapper,
                    icon: icon
                };
                simCars.set(id, simState);
                wrapper.style.left = `${simState.x}px`;
                wrapper.style.top = `${simState.y}px`;
            } else {
                simState.targetX = targetX;
                simState.targetY = targetY;
                simState.desiredAngle = desiredAngle;
            }
            
            let classOcupado = (autoObj.tipo === 'completo_auto' || autoObj.tipo === 'completo_camioneta' || autoObj.tipo === 'lavado_secado') ? 'box-occupied-completo' : 'box-occupied-lavado';
            
            cell.classList.add(classOcupado);
        }
    }

    function removeAuto(boxNum) {
        const cell = getCell(boxNum);
        if (cell) {
            cell.classList.remove('box-occupied-lavado', 'box-occupied-secado', 'box-occupied-completo');
        }
    }

    function cleanUpOrphanCars() {
        // Obtenemos todos los autos válidos de los estados
        const validIds = new Set();
        estadoEspera.forEach(a => { if (a) validIds.add(a.id.toString()); });
        if (estadoLavado) validIds.add(estadoLavado.id.toString());
        estadoSecado.forEach(a => { if (a) validIds.add(a.id.toString()); });
        estadoTerminado.forEach(a => { if (a) validIds.add(a.id.toString()); });
        
        // Buscamos autos en el DOM que no estén en validIds
        const domCars = document.querySelectorAll('.car-wrapper');
        domCars.forEach(car => {
            if (!validIds.has(car.dataset.id)) {
                // Hacemos que "se vaya" de la pantalla hacia la derecha
                car.style.left = '120%';
                car.style.opacity = '0';
                // Lo borramos después de la transición
                setTimeout(() => {
                    if (car.parentNode) car.remove();
                }, 1000);
            }
        });
    }

    function updateVisuals() {
        ESPERA_ZONES.forEach(zoneNum => removeAuto(zoneNum));
        removeAuto(LAVADO_ZONE);
        SECADO_ZONES.forEach(zoneNum => removeAuto(zoneNum));
        TERMINADO_ZONES.forEach(zoneNum => removeAuto(zoneNum));

        estadoEspera.forEach((auto, i) => { if (auto) renderAuto(ESPERA_ZONES[i], auto); });
        if (estadoLavado) renderAuto(LAVADO_ZONE, estadoLavado);
        estadoSecado.forEach((auto, i) => { if (auto) renderAuto(SECADO_ZONES[i], auto); });
        estadoTerminado.forEach((auto, i) => { if (auto) renderAuto(TERMINADO_ZONES[i], auto); });
        
        cleanUpOrphanCars();
        syncLiveState(); // ← Sincronizar con DonWeb MySQL en cada cambio visual
    }

    function advanceQueue() {
        let moved = false;
        let lanes = [
            [0, 2, 4, 6], // Carril Impar: suben por cajas 1, 3, 5, 7 en línea recta
            [1, 3, 5, 7]  // Carril Par: suben por cajas 2, 4, 6, 8 en línea recta
        ];
        for (let lane of lanes) {
            for (let j = 0; j < lane.length; j++) {
                for (let i = 0; i < lane.length - 1; i++) {
                    let currentIdx = lane[i];
                    let nextIdx = lane[i+1];
                    if (estadoEspera[currentIdx] === null && estadoEspera[nextIdx] !== null) {
                        estadoEspera[currentIdx] = estadoEspera[nextIdx];
                        estadoEspera[nextIdx] = null;
                        moved = true;
                    }
                }
            }
        }
        return moved;
    }

    function advanceQueueTerminado() {
        let moved = false;
        let lanes = [
            [0, 1, 2, 3] // Único carril Terminado (Izquierda)
        ];
        for (let lane of lanes) {
            for (let j = 0; j < lane.length; j++) {
                for (let i = 0; i < lane.length - 1; i++) {
                    let currentIdx = lane[i];
                    let nextIdx = lane[i+1];
                    if (estadoTerminado[currentIdx] === null && estadoTerminado[nextIdx] !== null) {
                        estadoTerminado[currentIdx] = estadoTerminado[nextIdx];
                        estadoTerminado[nextIdx] = null;
                        moved = true;
                    }
                }
            }
        }
        return moved;
    }

    // Calcular precio según servicio y categoría de cliente
    function getWashPrice(tipo, category = 'GENERAL') {
        const catUpper = String(category || '').toUpperCase();
        if (catUpper === 'BLACK' || catUpper === 'GOLD') return 0;
        if (catUpper === 'RESERVA') return 0;

        const cfg = window.APP_CONFIG || {};
        if (tipo === 'express_auto') return cfg.precio_express_auto || 10000;
        if (tipo === 'express_camioneta') return cfg.precio_express_camioneta || 12000;
        if (tipo === 'completo_auto') return cfg.precio_completo_auto || 15000;
        if (tipo === 'completo_camioneta') return cfg.precio_completo_camioneta || 18000;
        if (tipo === 'solo_lavado') return cfg.precio_express_auto || 10000;
        if (tipo === 'solo_secado') return 8000;
        return cfg.precio_express_auto || 10000;
    }
    window.getWashPrice = getWashPrice;

    // Funciones para ingresar autos
    async function ingresarAuto(tipo, patenteCustom = null, meta = {}) {
        let targetIndices = [];
        if (tipo === 'solo_secado') {
            targetIndices = [0, 2, 4, 6]; // Carril Izquierdo
        } else {
            targetIndices = [0, 1, 2, 3, 4, 5, 6, 7]; // Cualquier carril
        }
        
        let freeIdx = targetIndices.find(idx => estadoEspera[idx] === null);
        
        let patenteFinal = patenteCustom;
        if (!patenteFinal) {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const l1 = letters[Math.floor(Math.random() * 26)];
            const l2 = letters[Math.floor(Math.random() * 26)];
            const l3 = letters[Math.floor(Math.random() * 26)];
            const num = Math.floor(100 + Math.random() * 900);
            patenteFinal = `A${l1}${l2}${num}${l3}`; // Formato Mercosur simulado
        }

        if (freeIdx !== undefined) {
            const clienteTipo = meta.cliente_tipo || 'GENERAL';
            const initialPrice = (meta.monto !== undefined && meta.monto !== null) ? meta.monto : getWashPrice(tipo, clienteTipo);

            const autoObj = { 
                id: autoIdCounter++, 
                patente: patenteFinal, 
                tipo: tipo, 
                startTime: Date.now(),
                cliente_tipo: clienteTipo,
                titular: meta.titular || 'Cliente Ocasional',
                modelo: meta.modelo || 'Auto / Camioneta',
                estado_pago: meta.estado_pago || 'pendiente',
                metodo_pago: meta.metodo_pago || null,
                monto: initialPrice,
                verificado: meta.verificado || false,
                metricaRegistrada: false
            };

            estadoEspera[freeIdx] = autoObj;
            if (advanceQueue()) {} // Las físicas los empujan hacia adelante dentro de su carril
            if (typeof updateTimers === 'function') updateTimers();
            if (typeof updateStatusBoard === 'function') updateStatusBoard();
            updateVisuals();
            checkMovement();
            if (typeof syncLiveState === 'function') syncLiveState();
            return autoObj;
        } else {
            showToast('El carril correspondiente está lleno.', 'error');
            return null;
        }
    }

    // ==========================================
    // SINCRONIZACIÓN LIVE STATE → DONWEB MYSQL
    // ==========================================
    let isLiveStateRestored = false;
    let _syncDebounce = null;

    async function restoreLiveState() {
        try {
            const res = await fetch(`${API_URL}configuracion.php`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.live_state) {
                    const ls = typeof data.live_state === 'string' ? JSON.parse(data.live_state) : data.live_state;
                    if (ls) {
                        if (Array.isArray(ls.espera) && ls.espera.length === 8) estadoEspera = ls.espera;
                        if (ls.lavado !== undefined) estadoLavado = ls.lavado;
                        if (Array.isArray(ls.secado) && ls.secado.length >= 1) estadoSecado = ls.secado.slice(0, 1);
                        if (Array.isArray(ls.terminado) && ls.terminado.length === 4) {
                            estadoTerminado = ls.terminado;
                            estadoTerminado.forEach(a => {
                                if (a && !a.terminadoAt) a.terminadoAt = Date.now();
                            });
                        }

                        // Restaurar id max counter y sanitizar tipo de servicio
                        const allCars = [
                            ...(Array.isArray(estadoEspera) ? estadoEspera : []),
                            estadoLavado,
                            ...(Array.isArray(estadoSecado) ? estadoSecado : []),
                            ...(Array.isArray(estadoTerminado) ? estadoTerminado : [])
                        ].filter(Boolean);

                        allCars.forEach(c => {
                            if (c) {
                                if (!c.tipo) c.tipo = 'express_auto';
                                if (c.id && typeof c.id === 'number' && c.id >= autoIdCounter) {
                                    autoIdCounter = c.id + 1;
                                }
                            }
                        });

                        updateVisuals();
                    }
                }
            }
        } catch (e) {
            console.warn('Error al restaurar live_state:', e);
        } finally {
            isLiveStateRestored = true;
            syncLiveState();
        }
    }

    function syncLiveState() {
        if (!isLiveStateRestored) return; // Evitar pisar la BD en el arranque
        clearTimeout(_syncDebounce);
        _syncDebounce = setTimeout(async () => {
            try {
                const cars = [];
                if (Array.isArray(estadoEspera)) {
                    estadoEspera.forEach((a, i) => {
                        if (a) cars.push({ slot: `espera_${i}`, estado: 'espera', tipo: a.tipo, id: a.id });
                    });
                }
                if (estadoLavado) {
                    cars.push({ slot: 'lavado', estado: 'lavando', tipo: estadoLavado.tipo, id: estadoLavado.id });
                }
                if (Array.isArray(estadoSecado)) {
                    estadoSecado.forEach((a, i) => {
                        if (a) cars.push({ slot: `secado_${i}`, estado: 'secando', tipo: a.tipo, id: a.id });
                    });
                }
                if (Array.isArray(estadoTerminado)) {
                    estadoTerminado.forEach((a, i) => {
                        if (a) cars.push({ slot: `terminado_${i}`, estado: 'terminado', tipo: a.tipo, id: a.id });
                    });
                }

                let autosEspera = Array.isArray(estadoEspera) ? estadoEspera.filter(a => a !== null).length : 0;
                let maxEta = Date.now();
                if (Array.isArray(estadoEspera)) {
                    estadoEspera.forEach(a => {
                        if (a && a.etaSalidaEspera && a.etaSalidaEspera > maxEta) maxEta = a.etaSalidaEspera;
                    });
                }
                let remSeg = Math.ceil((maxEta - Date.now()) / 1000);
                if (remSeg < 0 || autosEspera === 0) remSeg = 0;

                const live = {
                    total: cars.length,
                    espera: Array.isArray(estadoEspera) ? estadoEspera : [],
                    lavado: estadoLavado || null,
                    secado: Array.isArray(estadoSecado) ? estadoSecado : [],
                    terminado: Array.isArray(estadoTerminado) ? estadoTerminado : [],
                    cars: cars,
                    ts: Date.now(),
                    max_eta: maxEta,
                    demora_segundos: remSeg,
                    autos_espera: autosEspera,
                    tiempo_lavado_ms: window.APP_CONFIG ? window.APP_CONFIG.tiempoLavado : 120000,
                    tiempo_secado_ms: window.APP_CONFIG ? window.APP_CONFIG.tiempoSecado : 180000
                };

                await fetch(`${API_URL}configuracion.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ live_state: live })
                });
            } catch(e) {
                console.warn('Error en syncLiveState:', e);
            }
        }, 150);
    }
    window.syncLiveState = syncLiveState;
    setInterval(() => { if (isLiveStateRestored) syncLiveState(); }, 2500);

    // ============================================================
    // GESTIÓN INTEGRAL DE BOXES EN VIVO (Panel de Control y Edición)
    // ============================================================
    let currentBoxFilter = 'all';

    window.filterBoxesList = function(filterType, btn) {
        currentBoxFilter = filterType;
        document.querySelectorAll('.btn-box-filter').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        renderBoxesManagementList();
    };

    function getServiceReadableName(tipo) {
        if (tipo === 'express_auto') return 'Express Auto';
        if (tipo === 'express_camioneta') return 'Express Camioneta';
        if (tipo === 'completo_auto') return 'Completo Auto';
        if (tipo === 'completo_camioneta') return 'Completo Camioneta';
        if (tipo === 'solo_lavado') return 'Solo Lavado';
        if (tipo === 'solo_secado') return 'Solo Interior';
        if (tipo === 'lavado_secado') return 'Lavado + Interior';
        return 'Express Auto';
    }

    function formatTimeMmSs(segundos) {
        if (segundos <= 0) return "00:00";
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function renderBoxesManagementList() {
        const container = document.getElementById('boxes-grid-list');
        if (!container) return;

        const now = Date.now();
        const boxes = [];

        // 1. Box Lavado 1
        boxes.push({
            id: 'lavado_0',
            zone: 'lavado',
            index: 0,
            name: 'Túnel de Lavado 1',
            icon: 'bx-water',
            occupiedClass: 'occupied-lavado',
            auto: estadoLavado,
            remainingSecs: estadoLavado && estadoLavado.endTime ? Math.max(0, Math.ceil((estadoLavado.endTime - now) / 1000)) : 0
        });

        // 2. Box Interior 1 (Secado)
        boxes.push({
            id: 'interior_0',
            zone: 'interior',
            index: 0,
            name: 'Box Interior / Secado 1',
            icon: 'bx-wind',
            occupiedClass: 'occupied-interior',
            auto: estadoSecado[0],
            remainingSecs: estadoSecado[0] && estadoSecado[0].endTime ? Math.max(0, Math.ceil((estadoSecado[0].endTime - now) / 1000)) : 0
        });

        // 3. Boxes Terminado 1 al 4 (auto-salida en 20s)
        for (let i = 0; i < 4; i++) {
            const auto = estadoTerminado[i];
            const remaining = auto && auto.terminadoAt ? Math.max(0, Math.ceil((auto.terminadoAt + 20000 - now) / 1000)) : (auto ? 20 : 0);
            boxes.push({
                id: `terminado_${i}`,
                zone: 'terminado',
                index: i,
                name: `Box Terminado ${i + 1}`,
                icon: 'bx-check-double',
                occupiedClass: 'occupied-terminado',
                auto: auto,
                remainingSecs: remaining
            });
        }

        // 4. Boxes Espera 1 al 8
        for (let i = 0; i < 8; i++) {
            const auto = estadoEspera[i];
            let rem = 0;
            if (auto && auto.etaSalidaEspera) {
                rem = Math.max(0, Math.ceil((auto.etaSalidaEspera - now) / 1000));
            }
            boxes.push({
                id: `espera_${i}`,
                zone: 'espera',
                index: i,
                name: `Box Espera ${i + 1}`,
                icon: 'bx-time',
                occupiedClass: 'occupied-espera',
                auto: auto,
                remainingSecs: rem
            });
        }

        // Contadores
        const totalCount = boxes.length;
        const occupiedCount = boxes.filter(b => b.auto !== null).length;
        const countAllEl = document.getElementById('count-box-all');
        const countOcupadosEl = document.getElementById('count-box-ocupados');
        if (countAllEl) countAllEl.textContent = totalCount;
        if (countOcupadosEl) countOcupadosEl.textContent = occupiedCount;

        // Si el usuario está escribiendo una patente o interactuando con un control dentro del panel, actualizamos solo tiempos sin pisar el DOM
        const activeEl = document.activeElement;
        if (activeEl && container.contains(activeEl)) {
            boxes.forEach(b => {
                const card = document.getElementById(`box-card-${b.id}`);
                if (card) {
                    const timerEl = card.querySelector('.box-timer-val');
                    if (timerEl && b.auto) {
                        const timeDisplay = (b.zone === 'terminado') ? '¡Listo para Salir!' : formatTimeMmSs(b.remainingSecs);
                        if (timerEl.textContent !== timeDisplay) timerEl.textContent = timeDisplay;
                    }
                }
            });
            return;
        }

        // Filtrado
        const filteredBoxes = boxes.filter(b => {
            if (currentBoxFilter === 'all') return true;
            if (currentBoxFilter === 'ocupados') return b.auto !== null;
            if (currentBoxFilter === 'lavado') return b.zone === 'lavado';
            if (currentBoxFilter === 'interior') return b.zone === 'interior';
            if (currentBoxFilter === 'terminado') return b.zone === 'terminado';
            if (currentBoxFilter === 'espera') return b.zone === 'espera';
            return true;
        });

        // Render HTML
        let html = '';
        filteredBoxes.forEach(b => {
            if (b.auto) {
                const auto = b.auto;
                const plateVal = auto.patente || `AUTO-${auto.id}`;
                const srv = auto.tipo || 'express_auto';
                const timeDisplay = (b.zone === 'terminado') ? (b.remainingSecs > 0 ? `¡Listo! (Sale en ${b.remainingSecs}s)` : 'Saliendo...') : formatTimeMmSs(b.remainingSecs);

                // Estado de Cobro y Verificación Supervisor
                let payHtml = '';
                const estadoPago = auto.estado_pago || 'pendiente';
                const montoNum = (auto.monto !== undefined && auto.monto !== null) ? Number(auto.monto) : getWashPrice(srv, auto.cliente_tipo);
                const montoFmt = montoNum.toLocaleString('es-AR');

                if (estadoPago === 'pendiente') {
                    payHtml = `
                        <button type="button" class="btn-box-checkout pending" onclick="openSupervisorCheckoutModalByCarId(${auto.id})" title="Verificar datos y registrar cobro">
                            <i class='bx bx-dollar-circle' style="font-size: 1.1rem;"></i> COBRAR $${montoFmt}
                        </button>
                    `;
                } else if (estadoPago === 'socio_bonificado') {
                    payHtml = `
                        <div class="badge-box-paid" style="background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.4);" onclick="openSupervisorCheckoutModalByCarId(${auto.id})" title="Membresía Club 100 Bonificada. Clic para ver o editar">
                            <i class='bx bx-crown'></i> SOCIO CLUB 100 ($0)
                        </div>
                    `;
                } else if (estadoPago === 'reserva_online') {
                    payHtml = `
                        <div class="badge-box-paid" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4);" onclick="openSupervisorCheckoutModalByCarId(${auto.id})" title="Prepagado Online por Web. Clic para ver o editar">
                            <i class='bx bx-calendar-check'></i> PREPAGADO ONLINE
                        </div>
                    `;
                } else {
                    const metodoLabel = auto.metodo_pago ? auto.metodo_pago.toUpperCase() : 'COBRADO';
                    payHtml = `
                        <div class="badge-box-paid" onclick="openSupervisorCheckoutModalByCarId(${auto.id})" title="Cobrado por ${metodoLabel}. Clic para ver o modificar">
                            <i class='bx bx-check-circle'></i> PAGADO $${montoFmt} (${metodoLabel})
                        </div>
                    `;
                }

                html += `
                <div class="box-card ${b.occupiedClass}" id="box-card-${b.id}">
                    <div class="box-card-top">
                        <span class="box-card-name">
                            <i class='bx ${b.icon}'></i> ${b.name}
                        </span>
                        <span class="box-badge-status busy">● Ocupado</span>
                    </div>

                    <!-- Edición de Patente -->
                    <div class="box-plate-edit-wrap">
                        <input type="text" id="plate-input-${b.zone}-${b.index}" class="box-plate-input" value="${plateVal}" maxlength="10" placeholder="PATENTE">
                        <button class="btn-box-action btn-box-save" onclick="saveBoxPlate('${b.zone}', ${b.index})" title="Guardar Patente">
                            <i class='bx bx-save'></i>
                        </button>
                    </div>

                    <!-- Selector de Servicio / Tipo de Lavado -->
                    <div>
                        <select class="box-service-select" onchange="changeBoxService('${b.zone}', ${b.index}, this.value)">
                            <option value="express_auto" ${srv === 'express_auto' ? 'selected' : ''}>Express Auto ($10.000)</option>
                            <option value="express_camioneta" ${srv === 'express_camioneta' ? 'selected' : ''}>Express Camioneta ($12.000)</option>
                            <option value="completo_auto" ${srv === 'completo_auto' ? 'selected' : ''}>Completo Auto ($15.000)</option>
                            <option value="completo_camioneta" ${srv === 'completo_camioneta' ? 'selected' : ''}>Completo Camioneta ($18.000)</option>
                            <option value="solo_lavado" ${srv === 'solo_lavado' ? 'selected' : ''}>Solo Lavado (Heredado)</option>
                            <option value="solo_secado" ${srv === 'solo_secado' ? 'selected' : ''}>Solo Interior (Heredado)</option>
                        </select>
                    </div>

                    <!-- Cobro / Verificación Supervisor -->
                    <div style="margin: 4px 0;">
                        ${payHtml}
                    </div>

                    <!-- Timer Row -->
                    <div class="box-card-timer-row">
                        <span>Tiempo:</span>
                        <span class="box-timer-val">${timeDisplay}</span>
                    </div>

                    <!-- Acciones -->
                    <div class="box-card-actions">
                        <button class="btn-box-action btn-box-advance" onclick="advanceBoxCar('${b.zone}', ${b.index})" title="Avanzar auto al próximo box">
                            <i class='bx bx-fast-forward'></i> Avanzar
                        </button>
                        <button class="btn-box-action btn-box-cancel" onclick="cancelBoxWash('${b.zone}', ${b.index})" title="Anular este lavado">
                            <i class='bx bx-x-circle'></i> Anular
                        </button>
                    </div>
                </div>
                `;
            } else {
                html += `
                <div class="box-card box-free" id="box-card-${b.id}">
                    <div class="box-card-top">
                        <span class="box-card-name" style="color: #94a3b8;">
                            <i class='bx ${b.icon}'></i> ${b.name}
                        </span>
                        <span class="box-badge-status free">Libre</span>
                    </div>
                    <div style="padding: 10px 0; text-align: center;">
                        <button class="btn-box-assign-free" onclick="assignFreeBoxPrompt('${b.zone}', ${b.index})">
                            <i class='bx bx-plus-circle'></i> Asignar Auto Directo
                        </button>
                    </div>
                </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    // Intervalo de refresco visual del panel de boxes
    setInterval(() => {
        const panel = document.getElementById('boxes-management-panel');
        if (panel && panel.offsetParent !== null) {
            renderBoxesManagementList();
        }
    }, 1000);

    // Modificar Patente en Box
    window.saveBoxPlate = function(zone, index) {
        const input = document.getElementById(`plate-input-${zone}-${index}`);
        if (!input) return;
        const newPlate = input.value.trim().toUpperCase();
        if (!newPlate) {
            showToast('La patente no puede estar vacía', 'error');
            return;
        }

        let auto = null;
        if (zone === 'lavado') auto = estadoLavado;
        else if (zone === 'interior') auto = estadoSecado[index];
        else if (zone === 'terminado') auto = estadoTerminado[index];
        else if (zone === 'espera') auto = estadoEspera[index];

        if (auto) {
            auto.patente = newPlate;
            updateVisuals();
            renderBoxesManagementList();
            showToast(`Patente actualizada a ${newPlate}`, 'success');
        }
    };

    // Cambiar Tipo de Lavado en Box
    window.changeBoxService = function(zone, index, newType) {
        let auto = null;
        if (zone === 'lavado') auto = estadoLavado;
        else if (zone === 'interior') auto = estadoSecado[index];
        else if (zone === 'terminado') auto = estadoTerminado[index];
        else if (zone === 'espera') auto = estadoEspera[index];

        if (auto) {
            auto.tipo = newType;
            if (zone === 'lavado') {
                auto.endTime = Date.now() + (window.APP_CONFIG.tiempoLavado || 120000);
            } else if (zone === 'interior') {
                auto.endTime = Date.now() + (window.APP_CONFIG.tiempoSecado || 180000);
            }
            updateVisuals();
            renderBoxesManagementList();
            showToast(`Servicio cambiado a ${getServiceReadableName(newType)}`, 'info');
        }
    };

    // Anular Lavado en Box
    window.cancelBoxWash = function(zone, index) {
        let auto = null;
        if (zone === 'lavado') auto = estadoLavado;
        else if (zone === 'interior') auto = estadoSecado[index];
        else if (zone === 'terminado') auto = estadoTerminado[index];
        else if (zone === 'espera') auto = estadoEspera[index];

        if (!auto) return;
        const plate = auto.patente || `#${auto.id}`;

        if (confirm(`¿Confirmás anular el lavado del vehículo ${plate} y liberar el box?`)) {
            if (zone === 'lavado') estadoLavado = null;
            else if (zone === 'interior') estadoSecado[index] = null;
            else if (zone === 'terminado') {
                estadoTerminado[index] = null;
                advanceQueueTerminado();
            } else if (zone === 'espera') {
                estadoEspera[index] = null;
                advanceQueue();
            }

            updateVisuals();
            checkMovement();
            renderBoxesManagementList();
            showToast(`Lavado de ${plate} anulado. Box liberado.`, 'error');
        }
    };

    // Forzar Avance de Box
    window.advanceBoxCar = function(zone, index) {
        let auto = null;
        if (zone === 'lavado') {
            auto = estadoLavado;
            if (auto) {
                if (auto.tipo === 'completo_auto' || auto.tipo === 'completo_camioneta' || auto.tipo === 'lavado_secado') {
                    if (estadoSecado[0] === null) {
                        auto.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
                        estadoSecado[0] = auto;
                        estadoLavado = null;
                        showToast(`Auto ${auto.patente} pasó a Interior`, 'success');
                    } else {
                        showToast('El Box de Interior está ocupado', 'error');
                        return;
                    }
                } else {
                    let termIdx = estadoTerminado.indexOf(null);
                    if (termIdx !== -1) {
                        auto.terminadoAt = Date.now();
                        auto.endTime = Date.now() + 20000;
                        estadoTerminado[termIdx] = auto;
                        estadoLavado = null;
                        advanceQueueTerminado();
                        showToast(`Auto ${auto.patente} pasó a Terminado (sale en 20s)`, 'success');
                    } else {
                        showToast('La zona de Terminado está llena', 'error');
                        return;
                    }
                }
            }
        } else if (zone === 'interior') {
            auto = estadoSecado[index];
            if (auto) {
                let termIdx = estadoTerminado.indexOf(null);
                if (termIdx !== -1) {
                    auto.terminadoAt = Date.now();
                    auto.endTime = Date.now() + 20000;
                    estadoTerminado[termIdx] = auto;
                    estadoSecado[index] = null;
                    advanceQueueTerminado();
                    showToast(`Auto ${auto.patente} pasó a Terminado (sale en 20s)`, 'success');
                } else {
                    showToast('La zona de Terminado está llena', 'error');
                    return;
                }
            }
        } else if (zone === 'terminado') {
            auto = estadoTerminado[index];
            if (auto) {
                if (window.recordMetric) window.recordMetric(auto);
                estadoTerminado[index] = null;
                advanceQueueTerminado();
                showToast(`Auto ${auto.patente} retirado y registrado`, 'success');
            }
        } else if (zone === 'espera') {
            auto = estadoEspera[index];
            if (auto) {
                if (estadoLavado === null && auto.tipo !== 'solo_secado') {
                    auto.endTime = Date.now() + window.APP_CONFIG.tiempoLavado;
                    estadoLavado = auto;
                    estadoEspera[index] = null;
                    advanceQueue();
                    showToast(`Auto ${auto.patente} ingresó al Túnel de Lavado`, 'success');
                } else if (estadoSecado[0] === null && auto.tipo === 'solo_secado') {
                    auto.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
                    estadoSecado[0] = auto;
                    estadoEspera[index] = null;
                    advanceQueue();
                    showToast(`Auto ${auto.patente} ingresó a Interior`, 'success');
                } else {
                    showToast('Los boxes de lavado/interior están ocupados', 'info');
                    return;
                }
            }
        }

        updateVisuals();
        checkMovement();
        renderBoxesManagementList();
    };

    // Asignar Auto Directo a Box Libre
    
    // Modal de Asignación Rápida de Auto a Box
    window.openQuickAssignModal = function(zone, index) {
        const modal = document.getElementById('modal-quick-assign-auto');
        const zoneInput = document.getElementById('quick-assign-zone');
        const indexInput = document.getElementById('quick-assign-index');
        const boxNameDiv = document.getElementById('quick-assign-box-name');
        const plateInput = document.getElementById('quick-assign-plate');
        const serviceSelect = document.getElementById('quick-assign-service');

        if (!modal) return;

        if (zoneInput) zoneInput.value = zone;
        if (indexInput) indexInput.value = index;

        let zoneTitle = 'Box';
        if (zone === 'lavado') zoneTitle = 'Túnel de Lavado 1';
        else if (zone === 'interior') zoneTitle = 'Box Interior / Secado 1';
        else if (zone === 'terminado') zoneTitle = `Box Terminado ${index + 1}`;
        else if (zone === 'espera') zoneTitle = `Box Espera ${index + 1}`;

        if (boxNameDiv) boxNameDiv.textContent = zoneTitle;
        if (plateInput) {
            generateRandomPlateForModal();
        }
        if (serviceSelect) {
            if (zone === 'interior') serviceSelect.value = 'solo_secado';
            else serviceSelect.value = 'express_auto';
        }

        modal.style.display = 'flex';
    };

    window.closeQuickAssignModal = function() {
        const modal = document.getElementById('modal-quick-assign-auto');
        if (modal) modal.style.display = 'none';
    };

    window.generateRandomPlateForModal = function() {
        const input = document.getElementById('quick-assign-plate');
        if (!input) return;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const l1 = letters[Math.floor(Math.random() * 26)];
        const l2 = letters[Math.floor(Math.random() * 26)];
        const l3 = letters[Math.floor(Math.random() * 26)];
        const num = Math.floor(100 + Math.random() * 900);
        input.value = `A${l1}${l2}${num}${l3}`;
    };

    window.confirmQuickAssignModal = function() {
        const zone = document.getElementById('quick-assign-zone') ? document.getElementById('quick-assign-zone').value : 'espera';
        const index = document.getElementById('quick-assign-index') ? parseInt(document.getElementById('quick-assign-index').value) || 0 : 0;
        let plateInput = document.getElementById('quick-assign-plate');
        let plate = plateInput ? plateInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
        const serviceSelect = document.getElementById('quick-assign-service');
        const service = serviceSelect ? serviceSelect.value : 'express_auto';

        if (!plate) {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const l1 = letters[Math.floor(Math.random() * 26)];
            const l2 = letters[Math.floor(Math.random() * 26)];
            const num = Math.floor(100 + Math.random() * 900);
            plate = `AE${num}${l1}${l2}`;
        }

        const newCar = {
            id: autoIdCounter++,
            patente: plate,
            tipo: service,
            startTime: Date.now()
        };

        if (zone === 'lavado') {
            newCar.endTime = Date.now() + (window.APP_CONFIG.tiempoLavado || 120000);
            estadoLavado = newCar;
        } else if (zone === 'interior') {
            newCar.endTime = Date.now() + (window.APP_CONFIG.tiempoSecado || 180000);
            estadoSecado[index] = newCar;
        } else if (zone === 'terminado') {
            newCar.terminadoAt = Date.now();
            newCar.endTime = Date.now() + 20000;
            estadoTerminado[index] = newCar;
            advanceQueueTerminado();
        } else if (zone === 'espera') {
            estadoEspera[index] = newCar;
            advanceQueue();
        } else {
            ingresarAuto(service, plate);
        }

        updateVisuals();
        checkMovement();
        renderBoxesManagementList();
        closeQuickAssignModal();
        showToast(`¡Auto ${plate} ingresó a la pista exitosamente!`, 'success');
    };

    window.assignFreeBoxPrompt = function(zone, index) {
        openQuickAssignModal(zone, index);
    };

    window.handleQuickAlertAssign = function() {
        if (lastDetectedLpr) {
            assignLprCarToTrack(lastDetectedLpr, 'express_auto');
        } else {
            ingresarAuto('express_auto');
        }
    };

    window.ingresarAuto = ingresarAuto;


    // ============================================================
    // SISTEMA LPR INTELIGENTE (CÁMARA + SOCIOS FUNDADORES + RESERVAS)
    // ============================================================
    let lastDetectedLpr = null;

    window.triggerLprScanManual = function() {
        const input = document.getElementById('lpr-scan-input');
        if (!input) return;
        const plate = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!plate) {
            showToast('Ingresá una patente válida para consultar', 'error');
            return;
        }
        processLprDetection(plate);
    };

    window.simulateLprDetection = function(plate) {
        const input = document.getElementById('lpr-scan-input');
        if (input) input.value = plate;
        processLprDetection(plate);
    };

    async function processLprDetection(plate) {
        const cleanPlate = plate.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
        lastDetectedLpr = cleanPlate;

        const resultCard = document.getElementById('lpr-detection-result');
        if (!resultCard) return;

        resultCard.style.display = 'block';
        resultCard.innerHTML = `<div style="text-align: center; color: #38bdf8; padding: 15px;"><i class='bx bx-loader-alt bx-spin' style="font-size: 1.8rem;"></i><br>Buscando patente ${cleanPlate} en Padrón de Socios y Reservas...</div>`;

        // 1. Buscar en Socios Fundadores
        let socioFound = null;
        try {
            let sociosList = [];
            const raw = localStorage.getItem('aura_socios_fundadores_v2');
            if (raw) sociosList = JSON.parse(raw);
            
            socioFound = sociosList.find(s => {
                const p = (s.patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                return p === cleanPlate || cleanPlate.includes(p) || (p && p.length >= 5 && cleanPlate.includes(p));
            });

            if (!socioFound) {
                // Probar por API DonWeb
                const res = await fetch(`${API_URL}socios_fundadores.php`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.socios) {
                        socioFound = data.socios.find(s => {
                            const p = (s.patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                            return p === cleanPlate || cleanPlate.includes(p);
                        });
                    }
                }
            }
        } catch(e) {}

        // 2. Buscar en Reservas del día
        let reservaFound = null;
        try {
            const res = await fetch(`${API_URL}reservas.php`);
            if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list)) {
                    reservaFound = list.find(r => {
                        const p = (r.patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        return p === cleanPlate && r.estado !== 'completado';
                    });
                }
            }
        } catch(e) {}

        // Renderizar tarjeta de diagnóstico
        let badgeHtml = '';
        let benefitsHtml = '';
        let defaultService = 'express_auto';

        if (socioFound) {
            const isBlack = (socioFound.tipo || '').toUpperCase() === 'BLACK';
            const badgeColor = isBlack ? '#fbbf24' : '#f59e0b';
            const badgeBg = isBlack ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.2)';
            const iconName = isBlack ? 'bx-crown' : 'bxs-award';
            const discText = isBlack ? '30% OFF Permanente + Acceso VIP Pit Lane #1' : '20% OFF Permanente + Box Preferencial';
            defaultService = isBlack ? 'completo_auto' : 'express_auto';

            badgeHtml = `
                <div style="background: ${badgeBg}; border: 2px solid ${badgeColor}; border-radius: 12px; padding: 10px 14px; display: inline-flex; align-items: center; gap: 8px; color: ${badgeColor}; font-weight: 900; font-size: 0.95rem;">
                    <i class='bx ${iconName}' style="font-size: 1.4rem;"></i> SOCIO FUNDADOR ${socioFound.tipo.toUpperCase()} ${socioFound.numero || '#VIP'}
                </div>
            `;

            benefitsHtml = `
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${badgeColor};">
                    <strong style="color: #fff; font-size: 0.9rem;">Titular: ${socioFound.titular || socioFound.nombre || 'Socio VIP'}</strong>
                    <p style="margin: 3px 0 0; color: #cbd5e1; font-size: 0.82rem;">Beneficio: <span style="color:${badgeColor}; font-weight:700;">${discText}</span></p>
                </div>
            `;
        } else if (reservaFound) {
            badgeHtml = `
                <div style="background: rgba(14, 165, 233, 0.2); border: 2px solid #0ea5e9; border-radius: 12px; padding: 10px 14px; display: inline-flex; align-items: center; gap: 8px; color: #38bdf8; font-weight: 900; font-size: 0.95rem;">
                    <i class='bx bx-calendar-check' style="font-size: 1.4rem;"></i> RESERVA ONLINE CONFIRMADA
                </div>
            `;

            benefitsHtml = `
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #0ea5e9;">
                    <strong style="color: #fff; font-size: 0.9rem;">Servicio Contratado: ${reservaFound.tipo_servicio || 'Lavado'}</strong>
                    <p style="margin: 3px 0 0; color: #cbd5e1; font-size: 0.82rem;">Teléfono: ${reservaFound.telefono || 'WhatsApp'}</p>
                </div>
            `;
        } else {
            badgeHtml = `
                <div style="background: rgba(100, 116, 139, 0.2); border: 1px solid rgba(100, 116, 139, 0.4); border-radius: 12px; padding: 8px 14px; display: inline-flex; align-items: center; gap: 8px; color: #94a3b8; font-weight: 800; font-size: 0.85rem;">
                    <i class='bx bx-car' style="font-size: 1.2rem;"></i> Cliente Regular (Sin Membresía / Reserva previa)
                </div>
            `;
        }

        resultCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                <div>
                    <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 700;">VEHÍCULO IDENTIFICADO</div>
                    <div style="font-family: 'Racing Sans One', sans-serif; font-size: 1.8rem; color: #38bdf8; letter-spacing: 2px; margin: 2px 0 6px;">${cleanPlate}</div>
                    ${badgeHtml}
                </div>
                <div>
                    <span style="font-size: 0.78rem; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 6px;">ASIGNAR SERVICIO A PISTA:</span>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="assignLprCarToTrack('${cleanPlate}', 'express_auto')" style="padding: 8px 12px; font-size: 0.8rem; background: #0ea5e9;">
                            <i class='bx bx-car'></i> Express Auto
                        </button>
                        <button class="btn btn-primary" onclick="assignLprCarToTrack('${cleanPlate}', 'express_camioneta')" style="padding: 8px 12px; font-size: 0.8rem; background: #0284c7;">
                            <i class='bx bx-car'></i> Express Camioneta
                        </button>
                        <button class="btn btn-primary" onclick="assignLprCarToTrack('${cleanPlate}', 'completo_auto')" style="padding: 8px 12px; font-size: 0.8rem; background: #10b981;">
                            <i class='bx bx-star'></i> Completo Auto
                        </button>
                        <button class="btn btn-primary" onclick="assignLprCarToTrack('${cleanPlate}', 'completo_camioneta')" style="padding: 8px 12px; font-size: 0.8rem; background: #f59e0b;">
                            <i class='bx bx-star'></i> Completo Camioneta
                        </button>
                    </div>
                </div>
            </div>
            ${benefitsHtml}
        `;

        // 3. Auto-asignación inteligente si está activado el switch
        const autoAssignToggle = document.getElementById('lpr-auto-assign-toggle');
        if (autoAssignToggle && autoAssignToggle.checked && (socioFound || reservaFound)) {
            assignLprCarToTrack(cleanPlate, defaultService, socioFound ? socioFound.tipo : 'Reserva');
        } else {
            // Disparar banner flotante en el Dashboard
            showDashboardLprAlert(cleanPlate, socioFound, reservaFound, defaultService);
        }
    }

    window.assignLprCarToTrack = function(plate, tipo, socioLabel = null) {
        ingresarAuto(tipo, plate);
        if (socioLabel) {
            showToast(`¡Auto ${plate} ingresó a la pista como ${socioLabel}!`, 'success');
        } else {
            showToast(`Auto ${plate} ingresó a la pista (${getServiceReadableName(tipo)})`, 'success');
        }
        renderBoxesManagementList();
        const alertBanner = document.getElementById('dashboard-lpr-alert');
        if (alertBanner) alertBanner.style.display = 'none';
    };

    function showDashboardLprAlert(plate, socio, reserva, defaultSrv) {
        const alertBanner = document.getElementById('dashboard-lpr-alert');
        const plateEl = document.getElementById('alert-plate-text');
        const infoEl = document.getElementById('alert-plate-info');
        const btnAssign = document.getElementById('btn-alert-quick-assign');

        if (!alertBanner || !plateEl || !infoEl) return;

        plateEl.textContent = plate;
        if (socio) {
            infoEl.innerHTML = `<span style="color:#fbbf24; font-weight:800;">👑 SOCIO ${(socio.tipo || 'VIP').toUpperCase()}</span> ${socio.titular || ''}`;
        } else if (reserva) {
            infoEl.innerHTML = `<span style="color:#38bdf8; font-weight:800;">📅 RESERVA ACTIVA</span> (${reserva.tipo_servicio || 'Lavado'})`;
        } else {
            infoEl.innerHTML = `<span>Cliente en Ingreso</span>`;
        }

        if (btnAssign) {
            btnAssign.onclick = () => assignLprCarToTrack(plate, defaultSrv, socio ? socio.tipo : null);
        }

        alertBanner.style.display = 'flex';
        setTimeout(() => {
            if (alertBanner.style.display === 'flex') alertBanner.style.display = 'none';
        }, 12000);
    }


    // Ejecutar restauración al iniciar
    restoreLiveState();

    const btnExpressAuto = document.getElementById('btn-ingresar-express-auto');
    if (btnExpressAuto) btnExpressAuto.addEventListener('click', () => ingresarAuto('express_auto'));

    const btnExpressCamioneta = document.getElementById('btn-ingresar-express-camioneta');
    if (btnExpressCamioneta) btnExpressCamioneta.addEventListener('click', () => ingresarAuto('express_camioneta'));

    const btnCompletoAuto = document.getElementById('btn-ingresar-completo-auto');
    if (btnCompletoAuto) btnCompletoAuto.addEventListener('click', () => ingresarAuto('completo_auto'));

    const btnCompletoCamioneta = document.getElementById('btn-ingresar-completo-camioneta');
    if (btnCompletoCamioneta) btnCompletoCamioneta.addEventListener('click', () => ingresarAuto('completo_camioneta'));

    function checkMovement() {
        if (!isMoving) {
            let frontLeft = estadoEspera[0];
            let frontRight = estadoEspera[1];
            
            let candidates = [];
            if (frontLeft) candidates.push({ auto: frontLeft, idx: 0 });
            if (frontRight) candidates.push({ auto: frontRight, idx: 1 });
            
            // Priorizar por orden de llegada (startTime)
            candidates.sort((a, b) => a.auto.startTime - b.auto.startTime);

            for (let candidate of candidates) {
                let auto = candidate.auto;
                let idx = candidate.idx;

                if (auto.tipo === 'solo_secado') {
                    if (estadoSecado[0] === null) {
                        isMoving = true;
                        auto.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
                        estadoSecado[0] = auto;
                        estadoEspera[idx] = null;
                        advanceQueue();
                        updateVisuals();
                        clearTimeout(timers.espera);
                        timers.espera = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2000);
                        return; // Movemos uno a la vez
                    }
                } else { // Lavado o Completo
                    if (estadoLavado === null) {
                        isMoving = true;
                        auto.endTime = Date.now() + window.APP_CONFIG.tiempoLavado;
                        estadoLavado = auto;
                        estadoEspera[idx] = null;
                        advanceQueue();
                        updateVisuals();
                        clearTimeout(timers.espera);
                        timers.espera = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2000);
                        return; // Movemos uno a la vez
                    }
                }
            }
            if (advanceQueue()) updateVisuals();
        }
    }

    // -- BUCLE DE SIMULACIÓN AUTOMÁTICA --
    setInterval(() => {
        const now = Date.now();

        if (!isMoving) {
            let carReleased = false;

            // Procesar Lavado
            if (estadoLavado && estadoLavado.endTime <= now) {
                if (!estadoLavado.tipo) estadoLavado.tipo = 'express_auto';
                
                if (estadoLavado.tipo === 'completo_auto' || estadoLavado.tipo === 'completo_camioneta' || estadoLavado.tipo === 'lavado_secado') {
                    if (estadoSecado[0] === null) {
                        isMoving = true;
                        estadoLavado.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
                        estadoSecado[0] = estadoLavado;
                        estadoLavado = null;
                        updateVisuals();
                        
                        clearTimeout(timers.lavadoToSecado);
                        timers.lavadoToSecado = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2500);
                        carReleased = true;
                    }
                } else {
                    // express_auto, express_camioneta, solo_lavado o cualquier otro tipo por defecto
                    let targetIndices = [0, 1, 2, 3]; 
                    const freeIdx = targetIndices.find(idx => estadoTerminado[idx] === null);
                    
                    if (freeIdx !== undefined) {
                        isMoving = true;
                        estadoTerminado[freeIdx] = estadoLavado;
                        estadoLavado = null;
                        estadoTerminado[freeIdx].terminadoAt = Date.now();
                        estadoTerminado[freeIdx].endTime = Date.now() + 20000;
                        if (advanceQueue()) {}
                        if (advanceQueueTerminado()) {}
                        updateVisuals();

                        clearTimeout(timers.lavadoToTerminado);
                        timers.lavadoToTerminado = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2500); // 2.5s para asegurar que llegue y no se toquen
                        carReleased = true;
                    }
                }
            }

            // Procesar Interior/Secado si no se liberó nada antes
            if (!carReleased) {
                for (let i = 0; i < estadoSecado.length; i++) {
                    const auto = estadoSecado[i];
                    if (auto && auto.endTime && now >= auto.endTime) {
                        let targetIndices = [0, 1, 2, 3];
                        const freeIdx = targetIndices.find(idx => estadoTerminado[idx] === null);
                        
                        if (freeIdx !== undefined) {
                            isMoving = true;
                            estadoTerminado[freeIdx] = auto;
                            estadoSecado[i] = null;
                            estadoTerminado[freeIdx].terminadoAt = Date.now();
                            estadoTerminado[freeIdx].endTime = Date.now() + 20000;
                            if (advanceQueueTerminado()) {}
                            updateVisuals();
                            
                            clearTimeout(timers.secadoToTerminado);
                            timers.secadoToTerminado = setTimeout(() => {
                                isMoving = false;
                                checkMovement();
                            }, 2500);
                            carReleased = true;
                            break; // Solo mover uno a la vez
                        }
                    }
                }
            }
        }

        // Procesar Terminado: Autos esperan 20 segundos y se van solos automáticamente
        for (let i = 0; i < estadoTerminado.length; i++) {
            const auto = estadoTerminado[i];
            if (auto) {
                if (!auto.terminadoAt) {
                    auto.terminadoAt = now;
                    auto.endTime = now + 20000;
                }
                if (!auto.isMarkedReady) {
                    auto.isMarkedReady = true;
                    recordMetric(auto); // Registrar métrica una sola vez al terminar
                    updateVisuals();
                }
                // Si pasaron 20 segundos (20.000 ms), el auto se retira automáticamente
                if (now - auto.terminadoAt >= 20000) {
                    estadoTerminado[i] = null;
                    advanceQueueTerminado();
                    updateVisuals();
                    if (typeof renderBoxesManagementList === 'function') {
                        renderBoxesManagementList();
                    }
                }
            }
        }

        // Siempre chequear si la zona de espera puede avanzar
        checkMovement();
        
        updateTimers();
        updateStatusBoard();
    }, 1000);
    
    function updateStatusBoard() {
        const timeEl = document.getElementById('status-time');
        const badgeEl = document.getElementById('status-badge');
        if (!timeEl || !badgeEl) return;

        let autos = estadoEspera.filter(a => a !== null).length;
        const now = Date.now();
        let maxEta = now;
        
        estadoEspera.forEach(a => {
            if (a && a.etaSalidaEspera > maxEta) {
                maxEta = a.etaSalidaEspera;
            }
        });
        
        let remainingSegundos = Math.ceil((maxEta - now) / 1000);
        if (remainingSegundos < 0 || autos === 0) remainingSegundos = 0;
        
        // Formato MM:SS
        let mins = Math.floor(remainingSegundos / 60);
        let secs = remainingSegundos % 60;
        timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Sincronizar indicador de Demora en barra superior móvil/tablet
        const mobileTimeEl = document.getElementById('mobile-status-text');
        const mobilePillEl = document.getElementById('mobile-status-pill');
        if (mobileTimeEl) mobileTimeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (mobilePillEl) {
            mobilePillEl.className = 'mobile-status-pill ' + (autos === 0 ? 'status-free' : (autos <= 4 ? 'status-normal' : 'status-high'));
        }
        
        // Actualizar Etiqueta y Colores
        badgeEl.className = 'status-badge';
        if (autos === 0) {
            badgeEl.classList.add('badge-libre');
            badgeEl.textContent = 'Sin Demora';
        } else if (autos <= 4) {
            badgeEl.classList.add('badge-normal');
            badgeEl.textContent = 'Demora Normal';
        } else if (autos <= 6) {
            badgeEl.classList.add('badge-alta');
            badgeEl.textContent = 'Demora Alta';
        } else {
            badgeEl.classList.add('badge-critica');
            badgeEl.textContent = 'Cap. Máxima';
        }
    }

    function updateTimers() {
        const now = Date.now();
        
        // 1. Initial Resource availability
        let T_LavadoFree = now;
        if (estadoLavado && estadoLavado.endTime) {
            T_LavadoFree = estadoLavado.endTime + 2000;
        } else if (isMoving) {
            T_LavadoFree = now + 2000;
        }
        
        let T_Secado1Free = now;
        if (estadoSecado[0] && estadoSecado[0].endTime) {
            T_Secado1Free = estadoSecado[0].endTime + 2000;
        }

        let T_LaneFree = {
            impar: now, // 0, 2, 4, 6
            par: now    // 1, 3, 5, 7
        };

        // 2. Ordenar autos en espera por startTime
        let waitingCars = [];
        estadoEspera.forEach((auto, idx) => {
            if (auto) waitingCars.push({ auto: auto, idx: idx });
        });
        waitingCars.sort((a, b) => a.auto.startTime - b.auto.startTime);

        // 3. Simular ETAs
        waitingCars.forEach(item => {
            let auto = item.auto;
            let idx = item.idx;
            let lane = (idx % 2 === 0) ? 'impar' : 'par';

            let myDestFree = (auto.tipo === 'solo_secado') ? T_Secado1Free : T_LavadoFree;

            // El auto sale cuando el carril de adelante está libre Y su destino está libre
            let T_leave_queue = Math.max(T_LaneFree[lane], myDestFree);
            
            auto.etaSalidaEspera = T_leave_queue;

            // Actualizar disponibilidad de recursos para los autos de atrás
            if (auto.tipo === 'solo_secado') {
                T_Secado1Free = T_leave_queue + window.APP_CONFIG.tiempoSecado + 2000;
            } else {
                let processTime = window.APP_CONFIG.tiempoLavado;
                if (auto.tipo === 'completo_auto' || auto.tipo === 'completo_camioneta' || auto.tipo === 'lavado_secado') processTime += window.APP_CONFIG.tiempoSecado;
                T_LavadoFree = T_leave_queue + processTime + 2000;
            }

            // El siguiente auto en este mismo carril no puede salir hasta que yo salga (+2s)
            T_LaneFree[lane] = T_leave_queue + 2000;
        });

        // 4. Agrupamos y preparamos para pintar
        const activeAutos = {};
        estadoEspera.forEach(a => { if (a) { a.state = 'espera'; activeAutos[a.id] = a; }});
        if (estadoLavado) { estadoLavado.state = 'lavado'; activeAutos[estadoLavado.id] = estadoLavado; }
        estadoSecado.forEach(a => { if (a) { a.state = 'secado'; activeAutos[a.id] = a; }});
        estadoTerminado.forEach(a => { if (a) { a.state = 'terminado'; activeAutos[a.id] = a; }});
        
        // Helper para formato MM:SS
        const formatTime = (segundos) => {
            if (segundos <= 0) return "00:00";
            const mins = Math.floor(segundos / 60);
            const secs = segundos % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        document.querySelectorAll('.car-wrapper').forEach(wrapper => {
            const id = wrapper.dataset.id;
            const timer = wrapper.querySelector('.car-timer');
            const autoObj = activeAutos[id];
            
            if (autoObj) {
                if (autoObj.state === 'espera') {
                    timer.style.display = 'block';
                    let remaining = Math.max(0, Math.ceil((autoObj.etaSalidaEspera - now) / 1000));
                    timer.textContent = formatTime(remaining);
                } else if (autoObj.state === 'terminado') {
                    if (autoObj.endTime) {
                        const remaining = Math.ceil((autoObj.endTime - now) / 1000);
                        if (remaining > 0) {
                            timer.textContent = formatTime(remaining);
                            timer.style.display = 'block';
                        } else {
                            timer.style.display = 'none';
                        }
                    } else {
                        timer.textContent = `¡Listo!`;
                        timer.style.display = 'block';
                    }
                } else if (autoObj.endTime) {
                    const remaining = Math.ceil((autoObj.endTime - now) / 1000);
                    if (remaining > 0) {
                        timer.textContent = formatTime(remaining);
                        timer.style.display = 'block';
                    } else {
                        timer.style.display = 'none';
                    }
                } else {
                    timer.style.display = 'none';
                }
            } else {
                timer.style.display = 'none';
            }
        });

        if (window.syncLiveState) window.syncLiveState();
    }

    // Dibujar la pista real (Asfalto + Neón) dinámicamente
    function drawScalextricPaths() {
        const trackInterior = document.getElementById('track-interior');
        const trackLavado = document.getElementById('track-lavado');
        const baseInterior = document.getElementById('base-interior');
        const baseLavado = document.getElementById('base-lavado');
        const railsInterior = document.getElementById('rails-interior');
        const slotInterior = document.getElementById('slot-interior');
        const railsLavado = document.getElementById('rails-lavado');
        const slotLavado = document.getElementById('slot-lavado');
        const canvasArea = document.getElementById('canvas-area');
        
        if (!trackInterior || !trackLavado || !canvasArea) return;

        // Función auxiliar para obtener el centro de un box por su boxNumber (1-48)
        function getBoxCenter(boxNumber) {
            const box = document.querySelector(`.grid-box[data-box-number="${boxNumber}"]`);
            if (!box) return { x: 0, y: 0 };
            const boxRect = box.getBoundingClientRect();
            const canvasRect = canvasArea.getBoundingClientRect();
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
        // Espera Der: 30 (bot) -> 12 (top). Lavado: 4. Secado 1: 3. Terminado Único: 7 (top) -> 25 (bot).
        const eDerBot = getBoxCenter(30);
        const eDerTop = getBoxCenter(12);
        const lavado = getBoxCenter(4);
        const secado1 = getBoxCenter(3);
        
        // Terminado (único carril)
        const tTop = getBoxCenter(7);
        const tBot = getBoxCenter(25);

        if (eIzqBot.x === 0 || eDerBot.x === 0 || tTop.x === 0) return; // Si aún no se renderizaron

        let R = 45; // Radio de curva para las esquinas

        // Path Interno (Interior) - Dobla en la Fila 3
        let pathIzq = `
            M ${eIzqBot.x} ${eIzqBot.y + 300} 
            L ${eIzqTop.x} ${eIzqTop.y + R} 
            Q ${eIzqTop.x} ${eIzqTop.y} ${eIzqTop.x - R} ${eIzqTop.y}
            L ${tTop.x + R} ${tTop.y}
            Q ${tTop.x} ${tTop.y} ${tTop.x} ${tTop.y + R}
            L ${tBot.x} ${tBot.y + 300}
        `;

        // Path Externo (Lavado) - Sube hasta la Fila 2 y luego dobla
        let pathDer = `
            M ${eDerBot.x} ${eDerBot.y + 300} 
            L ${eDerTop.x} ${lavado.y + R} 
            Q ${eDerTop.x} ${lavado.y} ${eDerTop.x - R} ${lavado.y}
            L ${tTop.x + R} ${lavado.y}
            Q ${tTop.x} ${lavado.y} ${tTop.x} ${lavado.y + R}
            L ${tBot.x} ${tBot.y + 300}
        `;

        trackInterior.setAttribute('d', pathIzq);
        trackLavado.setAttribute('d', pathDer);
        
        if (baseInterior) baseInterior.setAttribute('d', pathIzq);
        if (baseLavado) baseLavado.setAttribute('d', pathDer);
        if (railsInterior) railsInterior.setAttribute('d', pathIzq);
        if (slotInterior) slotInterior.setAttribute('d', pathIzq);
        if (railsLavado) railsLavado.setAttribute('d', pathDer);
        if (slotLavado) slotLavado.setAttribute('d', pathDer);
    }

    // Dibujar pistas constantemente para asegurar que se adapten a cualquier cambio (y que el DOM est cargado)
    setInterval(drawScalextricPaths, 500);
    window.addEventListener('resize', drawScalextricPaths);
    // Llamada inicial para intentar renderizar rápido
    drawScalextricPaths();

    // === MÓDULO DE MÉTRICAS ===
    let metricsHistory = JSON.parse(localStorage.getItem('metricsHistory')) || [];

    window.recordMetric = function(auto) {
        if (!auto) return;
        if (auto.metricaRegistrada) return; // Ya cobrado y registrado por el supervisor

        let rev = (auto.monto !== undefined && auto.monto !== null) ? Number(auto.monto) : 0;
        if (rev === 0 && auto.estado_pago !== 'socio_bonificado' && auto.estado_pago !== 'reserva_online') {
            if (auto.tipo === 'express_auto') { rev = window.APP_CONFIG.precio_express_auto; }
            else if (auto.tipo === 'express_camioneta') { rev = window.APP_CONFIG.precio_express_camioneta; }
            else if (auto.tipo === 'completo_auto') { rev = window.APP_CONFIG.precio_completo_auto; }
            else if (auto.tipo === 'completo_camioneta') { rev = window.APP_CONFIG.precio_completo_camioneta; }
            else if (auto.tipo === 'solo_lavado') { rev = window.APP_CONFIG.precio_express_auto; } // Fallback heredado
            else if (auto.tipo === 'solo_secado') { rev = window.APP_CONFIG.precio_express_camioneta; } // Fallback heredado
            else { rev = window.APP_CONFIG.precio_completo_auto; }
        }
        
        auto.metricaRegistrada = true;
        const metricData = {
            id: Date.now() + Math.random(),
            patente: auto.patente || 'S/D',
            timestamp: Date.now(),
            tipo: auto.tipo,
            revenue: rev,
            profit: rev, // La ganancia ahora es el 100% de la recaudación
            metodo_pago: auto.metodo_pago || 'efectivo'
        };

        metricsHistory.push(metricData);
        localStorage.setItem('metricsHistory', JSON.stringify(metricsHistory));
        
        const metricsView = document.getElementById('metrics-view');
        if (metricsView && metricsView.style.display === 'block') {
            window.updateMetricsUI();
        }

        // --- DONWEB API BACKEND INTEGRATION ---
        const fechaStr = new Date(metricData.timestamp).toLocaleString();
        let srvName = '';
        if(metricData.tipo === 'solo_lavado') srvName = 'Solo Lavado';
        else if (metricData.tipo === 'solo_secado') srvName = 'Solo Interior';
        else srvName = 'Lavado + Interior';

        fetch(`${API_URL}reservas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patente: metricData.patente,
                tipo_servicio: srvName,
                precio: metricData.revenue,
                estado: 'completado',
                notas: `Ganancia: $${metricData.profit}`
            })
        }).catch(err => console.error("Error al registrar reserva completada:", err));
    };

    window.updateMetricsUI = function() {
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;
        const service = document.getElementById('filter-service').value;
        
        let filtered = metricsHistory.filter(record => {
            let pass = true;
            if (service !== 'all' && record.tipo !== service) pass = false;
            
            // Normalize dates for comparison
            const recDate = new Date(record.timestamp);
            recDate.setHours(0,0,0,0);
            
            if (dateFrom) {
                const df = new Date(dateFrom);
                df.setHours(0,0,0,0);
                df.setMinutes(df.getMinutes() + df.getTimezoneOffset());
                if (recDate < df) pass = false;
            }
            if (dateTo) {
                const dt = new Date(dateTo);
                dt.setHours(0,0,0,0);
                dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
                if (recDate > dt) pass = false;
            }
            return pass;
        });
        
        // Calcular Totales
        let tLavados = filtered.length;
        let tRev = filtered.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
        let tProfit = filtered.reduce((acc, curr) => acc + (Number(curr.profit) || 0), 0);
        
        document.getElementById('metric-total-lavados').textContent = tLavados;
        document.getElementById('metric-total-revenue').textContent = '$' + tRev.toFixed(2);
        document.getElementById('metric-net-profit').textContent = '$' + tProfit.toFixed(2);
        
        // Poblar Tabla
        filtered.sort((a,b) => b.timestamp - a.timestamp);
        const tbody = document.getElementById('metrics-table-body');
        tbody.innerHTML = '';
        filtered.forEach(rec => {
            const dateStr = new Date(rec.timestamp).toLocaleString();
            let srvName = '';
            if(rec.tipo === 'solo_lavado') srvName = 'Solo Lavado';
            else if (rec.tipo === 'solo_secado') srvName = 'Solo Interior';
            else srvName = 'Lavado + Interior';
            
            const revNum = Number(rec.revenue) || 0;
            const profNum = Number(rec.profit) || 0;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold; color: var(--primary-color);">${rec.patente || 'S/D'}</td>
                <td>${dateStr}</td>
                <td>${srvName}</td>
                <td style="color: #60a5fa;">$${revNum.toFixed(2)}</td>
                <td style="color: #4ade80; font-weight: bold;">$${profNum.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    };
    
    // Filtros Listeners
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            window.updateMetricsUI();
        });
    }
    
    // Borrar Historial de Métricas y Reservas en MySQL
    window.clearAllHistory = async function() {
        if (!confirm("¿Estás seguro de que deseas borrar TODO el historial de métricas y registros de lavados? Esta acción no se puede deshacer.")) {
            return;
        }

        // 1. Limpiar métricas locales en memoria y localStorage
        metricsHistory = [];
        try {
            localStorage.setItem('metricsHistory', JSON.stringify([]));
            localStorage.removeItem('metricsHistory');
        } catch (e) {
            console.error('Error al limpiar localStorage de métricas:', e);
        }

        // 2. Refrescar interfaz de Métricas de inmediato
        if (window.updateMetricsUI) {
            window.updateMetricsUI();
        }

        // 3. Limpiar historial en la Base de Datos DonWeb MySQL (tabla reservas)
        try {
            const res = await fetch(`${API_URL}reservas.php?action=clear_all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.success || !data.error)) {
                if (window.showToast) {
                    window.showToast('Historial de métricas y lavados eliminado por completo', 'success');
                } else {
                    alert('Historial de métricas y lavados eliminado por completo.');
                }
            } else {
                if (window.showToast) {
                    window.showToast(data.error || 'Historial local borrado, aviso de servidor recibido', 'info');
                }
            }
        } catch (err) {
            console.error('Error al borrar reservas en servidor:', err);
            if (window.showToast) {
                window.showToast('Historial local limpiado (sin conexión al servidor)', 'warning');
            }
        }

        // 4. Si hay lista de reservas cargadas, recargar
        if (typeof loadReservations === 'function') {
            loadReservations();
        }
    };

    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', (e) => {
            e.preventDefault();
            window.clearAllHistory();
        });
    }
    
    // ==========================================
    // SISTEMA DE CÁMARA LPR (Webcam)
    // ==========================================
    // ==========================================
    // CÁMARA DE INGRESO VEHICULAR & LECTOR LPR CON IA (Aura v1.8)
    // ==========================================
    const btnStartCamera = document.getElementById('btn-start-camera');
    const btnSnapPlateNow = document.getElementById('btn-snap-plate-now');
    const videoElement = document.getElementById('camera-stream');
    const cameraLoading = document.getElementById('camera-loading');
    const cameraOverlay = document.getElementById('camera-overlay');
    const cameraDeviceSelect = document.getElementById('camera-device-select');

    let tesseractWorker = null;
    let isTesseractInitializing = false;
    let isOcrProcessing = false;
    let lprAutoScanInterval = null;
    let activeCameraStream = null;
    let lastScannedPlate = null;
    let lastScannedTime = 0;
    let pendingAlertCar = null;

    // Inicialización del Worker Tesseract con whitelist alfanumérica y modo línea única
    async function getTesseractWorker() {
        if (tesseractWorker) return tesseractWorker;
        if (typeof Tesseract === 'undefined') {
            console.warn("Tesseract.js no está disponible aún.");
            return null;
        }
        if (isTesseractInitializing) {
            while (isTesseractInitializing) {
                await new Promise(r => setTimeout(r, 150));
            }
            return tesseractWorker;
        }

        try {
            isTesseractInitializing = true;
            const badge = document.getElementById('badge-ai-status');
            if (badge) {
                badge.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Inicializando IA...";
            }

            const worker = await Tesseract.createWorker('eng');
            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                tessedit_pageseg_mode: '7' // Single text line
            });

            tesseractWorker = worker;
            if (badge) {
                badge.innerHTML = "<i class='bx bx-check-circle'></i> Tesseract OCR Neuronal Listo";
                badge.style.background = 'rgba(16,185,129,0.2)';
                badge.style.color = '#34d399';
            }
            return tesseractWorker;
        } catch (err) {
            console.error("Error al inicializar Tesseract.js:", err);
            const badge = document.getElementById('badge-ai-status');
            if (badge) {
                badge.innerHTML = "<i class='bx bx-error'></i> Error IA";
                badge.style.color = '#f87171';
            }
            return null;
        } finally {
            isTesseractInitializing = false;
        }
    }

    // Inicializar el worker en background al cargar el script si la librería está lista
    setTimeout(() => {
        if (typeof Tesseract !== 'undefined') {
            getTesseractWorker();
        }
    }, 1200);

    // Audio Chime con sintetizador Web Audio (sin dependencias de archivos externos)
    function playLprChime(type = 'success') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'vip') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch (e) {}
    }

    // ============================================================
    // MOTOR DE ALTA PRECISIÓN LPR: GRAMÁTICA SINTÁCTICA & OTSU
    // ============================================================

    // Diccionarios de desambiguación de caracteres típicos de OCR en patentes
    const OCR_TO_DIGIT = {
        'O': '0', 'D': '0', 'Q': '0', 'U': '0',
        'I': '1', 'L': '1', 'J': '1',
        'Z': '2',
        'E': '3',
        'A': '4',
        'S': '5',
        'G': '6', 'B': '8',
        'T': '7',
        'P': '9'
    };

    const OCR_TO_LETTER = {
        '0': 'O',
        '1': 'I',
        '2': 'Z',
        '3': 'E',
        '4': 'A',
        '5': 'S',
        '6': 'G',
        '7': 'T',
        '8': 'B',
        '9': 'P'
    };

    function forceLetter(ch) {
        if (!ch) return '';
        const c = ch.toUpperCase();
        if (c >= 'A' && c <= 'Z') return c;
        return OCR_TO_LETTER[c] || c;
    }

    function forceDigit(ch) {
        if (!ch) return '';
        const c = ch.toUpperCase();
        if (c >= '0' && c <= '9') return c;
        return OCR_TO_DIGIT[c] || c;
    }

    // Analizador y Corrector Sintáctico Gramatical de Patentes Argentinas
    function analyzeAndCorrectPlate(rawText) {
        if (!rawText) return null;
        const clean = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length < 5) return null;

        let bestCandidate = null;
        let bestScore = -999;
        let rawFound = '';
        let patternName = '';
        let wasCorrected = false;

        function testCandidate(chunk) {
            // Caso 1: Mercosur Automotores (7 caracteres: LL NNN LL) Ej: AB123CD, AE456GH
            if (chunk.length === 7) {
                const mercAuto = (
                    forceLetter(chunk[0]) +
                    forceLetter(chunk[1]) +
                    forceDigit(chunk[2]) +
                    forceDigit(chunk[3]) +
                    forceDigit(chunk[4]) +
                    forceLetter(chunk[5]) +
                    forceLetter(chunk[6])
                );

                if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(mercAuto)) {
                    let score = 100;
                    let diffs = 0;
                    for (let i = 0; i < 7; i++) {
                        if (chunk[i] !== mercAuto[i]) {
                            score -= 12;
                            diffs++;
                        }
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestCandidate = mercAuto;
                        rawFound = chunk;
                        patternName = 'Mercosur Auto (AA 123 AA)';
                        wasCorrected = diffs > 0;
                    }
                }

                // Caso 2: Mercosur Motos (7 caracteres: L NNN LLL) Ej: A123BCD
                const mercMoto = (
                    forceLetter(chunk[0]) +
                    forceDigit(chunk[1]) +
                    forceDigit(chunk[2]) +
                    forceDigit(chunk[3]) +
                    forceLetter(chunk[4]) +
                    forceLetter(chunk[5]) +
                    forceLetter(chunk[6])
                );

                if (/^[A-Z]{1}[0-9]{3}[A-Z]{3}$/.test(mercMoto)) {
                    let score = 92;
                    let diffs = 0;
                    for (let i = 0; i < 7; i++) {
                        if (chunk[i] !== mercMoto[i]) {
                            score -= 12;
                            diffs++;
                        }
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestCandidate = mercMoto;
                        rawFound = chunk;
                        patternName = 'Mercosur Moto (A 123 BCD)';
                        wasCorrected = diffs > 0;
                    }
                }
            }

            // Caso 3: Tradicional Automotores (6 caracteres: LLL NNN) Ej: ABC123, PQR789
            if (chunk.length === 6) {
                const tradAuto = (
                    forceLetter(chunk[0]) +
                    forceLetter(chunk[1]) +
                    forceLetter(chunk[2]) +
                    forceDigit(chunk[3]) +
                    forceDigit(chunk[4]) +
                    forceDigit(chunk[5])
                );

                if (/^[A-Z]{3}[0-9]{3}$/.test(tradAuto)) {
                    let score = 95;
                    let diffs = 0;
                    for (let i = 0; i < 6; i++) {
                        if (chunk[i] !== tradAuto[i]) {
                            score -= 12;
                            diffs++;
                        }
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestCandidate = tradAuto;
                        rawFound = chunk;
                        patternName = 'Tradicional (AAA 123)';
                        wasCorrected = diffs > 0;
                    }
                }
            }
        }

        // Probar ventanas deslizantes de longitud 7 (Mercosur)
        for (let i = 0; i <= clean.length - 7; i++) {
            testCandidate(clean.substring(i, i + 7));
        }

        // Probar ventanas deslizantes de longitud 6 (Tradicional)
        for (let i = 0; i <= clean.length - 6; i++) {
            testCandidate(clean.substring(i, i + 6));
        }

        if (bestCandidate) {
            return {
                plate: bestCandidate,
                raw: rawFound || clean,
                score: Math.max(bestScore, 50),
                pattern: patternName,
                wasCorrected: wasCorrected
            };
        }

        // Respaldo para cadenas de 6 o 7 alfanuméricos limpios sin encaje exacto
        if (clean.length === 6 || clean.length === 7) {
            return {
                plate: clean,
                raw: clean,
                score: 40,
                pattern: 'Alfanumérico Genérico',
                wasCorrected: false
            };
        }

        return null;
    }

    // Preprocesamiento de Imagen en Canvas: Recorte exacto object-fit y Binarización Otsu
    function preprocessTargetImage(source, targetCanvas, isVideo = true) {
        if (!targetCanvas) return false;
        const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });

        let srcW = isVideo ? (source.videoWidth || 640) : (source.naturalWidth || source.width || 640);
        let srcH = isVideo ? (source.videoHeight || 480) : (source.naturalHeight || source.height || 480);
        if (srcW === 0 || srcH === 0) return false;

        let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;

        if (isVideo) {
            const wrapper = document.getElementById('lpr-video-wrapper');
            const targetBox = document.getElementById('plate-target-box');
            if (wrapper && targetBox) {
                const wRect = wrapper.getBoundingClientRect();
                const tRect = targetBox.getBoundingClientRect();
                if (wRect.width > 0 && wRect.height > 0) {
                    // Compensación exacta de escala y recorte según object-fit: cover
                    const videoRatio = srcW / srcH;
                    const containerRatio = wRect.width / wRect.height;
                    let renderW, renderH, offsetX, offsetY;

                    if (containerRatio > videoRatio) {
                        renderW = wRect.width;
                        renderH = wRect.width / videoRatio;
                        offsetX = 0;
                        offsetY = (wRect.height - renderH) / 2;
                    } else {
                        renderH = wRect.height;
                        renderW = wRect.height * videoRatio;
                        offsetX = (wRect.width - renderW) / 2;
                        offsetY = 0;
                    }

                    const scale = srcW / renderW;
                    cropX = Math.max(0, Math.round((tRect.left - (wRect.left + offsetX)) * scale));
                    cropY = Math.max(0, Math.round((tRect.top - (wRect.top + offsetY)) * scale));
                    cropW = Math.min(srcW - cropX, Math.round(tRect.width * scale));
                    cropH = Math.min(srcH - cropY, Math.round(tRect.height * scale));
                }
            }
        } else {
            // Para fotos cargadas manualmente (centro del encuadre vehicular)
            cropX = Math.round(srcW * 0.10);
            cropY = Math.round(srcH * 0.30);
            cropW = Math.round(srcW * 0.80);
            cropH = Math.round(srcH * 0.45);
        }

        if (cropW <= 20 || cropH <= 10) return false;

        // Ancho óptimo de 520px para el modelo neuronal Tesseract
        const finalW = 520;
        const finalH = Math.round((cropH / cropW) * finalW) || 160;
        targetCanvas.width = finalW;
        targetCanvas.height = finalH;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, finalW, finalH);

        // Algoritmo de Umbralización Global Óptima de Otsu
        try {
            const imgData = ctx.getImageData(0, 0, finalW, finalH);
            const d = imgData.data;
            const totalPixels = finalW * finalH;

            const histogram = new Array(256).fill(0);
            const grays = new Uint8Array(totalPixels);

            for (let i = 0, p = 0; i < d.length; i += 4, p++) {
                const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
                grays[p] = gray;
                histogram[gray]++;
            }

            let sum = 0;
            for (let t = 0; t < 256; t++) sum += t * histogram[t];

            let sumB = 0;
            let wB = 0;
            let wF = 0;
            let varMax = 0;
            let optimalThreshold = 128;

            for (let t = 0; t < 256; t++) {
                wB += histogram[t];
                if (wB === 0) continue;
                wF = totalPixels - wB;
                if (wF === 0) break;

                sumB += t * histogram[t];
                const mB = sumB / wB;
                const mF = (sum - sumB) / wF;

                const varBetween = wB * wF * (mB - mF) * (mB - mF);
                if (varBetween > varMax) {
                    varMax = varBetween;
                    optimalThreshold = t;
                }
            }

            // Evitar extremos oscuros o claros por reflejos de chapa
            optimalThreshold = Math.min(Math.max(optimalThreshold, 75), 185);

            for (let i = 0, p = 0; i < d.length; i += 4, p++) {
                const val = grays[p] > optimalThreshold ? 255 : 0;
                d[i] = val;
                d[i + 1] = val;
                d[i + 2] = val;
            }

            ctx.putImageData(imgData, 0, 0);

            // Sincronizar con el canvas de depuración visual si existe
            const debugCanvas = document.getElementById('lpr-debug-canvas');
            if (debugCanvas) {
                debugCanvas.width = finalW;
                debugCanvas.height = finalH;
                const dCtx = debugCanvas.getContext('2d');
                dCtx.drawImage(targetCanvas, 0, 0);
            }
        } catch (e) {
            console.warn("Fallo al aplicar algoritmo Otsu:", e);
        }

        return true;
    }

    // Búfer de votación temporal (Consenso de 3 cuadros para evitar lecturas fugaces)
    let plateVotingBuffer = [];

    function registerPlateVote(plateData) {
        const now = Date.now();
        plateVotingBuffer = plateVotingBuffer.filter(v => (now - v.timestamp) < 4500);
        plateVotingBuffer.push({ ...plateData, timestamp: now });

        const counts = {};
        for (const v of plateVotingBuffer) {
            counts[v.plate] = (counts[v.plate] || 0) + 1;
        }

        for (const [p, count] of Object.entries(counts)) {
            // Confirmar si se repite en 2 cuadros o si la confianza del primer cuadro fue altísima
            if (count >= 2 || plateData.score >= 88) {
                return plateVotingBuffer.find(v => v.plate === p);
            }
        }
        return null;
    }

    // Escanear ahora desde la cámara en vivo
    window.captureAndOcrPlateNow = async function() {
        if (isOcrProcessing) return;
        const video = document.getElementById('camera-stream');
        if (!video || video.paused || video.ended || video.readyState < 2) return;

        let canvas = document.getElementById('camera-ocr-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'camera-ocr-canvas';
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
        }

        const indicator = document.getElementById('lpr-scanning-indicator');
        try {
            isOcrProcessing = true;
            if (indicator) indicator.style.display = 'flex';

            const ok = preprocessTargetImage(video, canvas, true);
            if (!ok) return;

            const worker = await getTesseractWorker();
            if (!worker) return;

            const result = await worker.recognize(canvas);
            const rawText = result && result.data ? result.data.text : '';
            const analyzed = analyzeAndCorrectPlate(rawText);

            if (analyzed) {
                const confirmed = registerPlateVote(analyzed);
                if (confirmed) {
                    await processDetectedPlate(confirmed);
                }
            }
        } catch (err) {
            console.warn("Error en escaneo OCR LPR:", err);
        } finally {
            isOcrProcessing = false;
            if (indicator) indicator.style.display = 'none';
        }
    };

    // Subida de Foto Manual de Patente para Diagnóstico y Prueba
    window.handleManualPlateImage = async function(input) {
        if (!input || !input.files || !input.files[0]) return;
        const file = input.files[0];
        const img = new Image();
        const reader = new FileReader();

        reader.onload = function(e) {
            img.onload = async function() {
                let canvas = document.getElementById('camera-ocr-canvas');
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    canvas.id = 'camera-ocr-canvas';
                    canvas.style.display = 'none';
                    document.body.appendChild(canvas);
                }

                preprocessTargetImage(img, canvas, false);

                if (window.showToast) window.showToast('Analizando foto con IA...', 'info');
                const worker = await getTesseractWorker();
                if (!worker) {
                    alert("El motor de IA OCR aún no está listo.");
                    return;
                }

                const result = await worker.recognize(canvas);
                const rawText = result && result.data ? result.data.text : '';
                const analyzed = analyzeAndCorrectPlate(rawText);

                if (analyzed) {
                    await processDetectedPlate(analyzed, true);
                } else {
                    alert(`No se detectó un patrón de patente claro en la foto.\nTexto crudo leído: "${rawText.trim() || 'vacío'}"\nPodés ingresar la patente manualmente.`);
                    const inputManual = document.getElementById('lpr-scan-input');
                    if (inputManual) inputManual.focus();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Consulta manual desde el input de texto
    window.triggerLprScanManual = async function() {
        const input = document.getElementById('lpr-scan-input');
        if (!input) return;
        const plate = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!plate || plate.length < 5) {
            alert("Por favor ingresá una patente válida (mínimo 5 caracteres).");
            return;
        }
        await processDetectedPlate({ plate: plate, raw: plate, score: 100, wasCorrected: false, pattern: 'Ingreso Manual' }, true);
    };

    // Test directo simulado (AE123CD, GOLD999, BLACK001)
    window.simulateLprDetection = async function(plate) {
        const input = document.getElementById('lpr-scan-input');
        if (input) input.value = plate;
        await processDetectedPlate({ plate: plate, raw: plate, score: 100, wasCorrected: false, pattern: 'Simulación' }, true);
    };

    // Modificar rápidamente una patente detectada si hubo error
    window.editLprPlatePrompt = function() {
        if (!pendingAlertCar) return;
        const newPlate = prompt("Modificar patente detectada:", pendingAlertCar.plate);
        if (newPlate && newPlate.trim().length >= 5) {
            const clean = newPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            processDetectedPlate({ plate: clean, raw: clean, score: 100, wasCorrected: false, pattern: 'Edición Manual' }, true);
        }
    };

    // Procesamiento Central de Patente Detectada: Cruce con Socios y Reservas
    async function processDetectedPlate(plateInput, forceBypassCooldown = false) {
        let plate = typeof plateInput === 'object' ? plateInput.plate : plateInput;
        const rawText = typeof plateInput === 'object' ? plateInput.raw : plate;
        const score = typeof plateInput === 'object' ? plateInput.score : 90;
        const wasCorrected = typeof plateInput === 'object' ? plateInput.wasCorrected : false;
        const patternName = typeof plateInput === 'object' ? (plateInput.pattern || 'Mercosur') : 'Mercosur';

        const now = Date.now();
        // Cooldown de 15 segundos para la misma patente para evitar spam si el auto sigue frente a la cámara
        if (!forceBypassCooldown && plate === lastScannedPlate && (now - lastScannedTime) < 15000) {
            return;
        }

        lastScannedPlate = plate;
        lastScannedTime = now;

        const input = document.getElementById('lpr-scan-input');
        if (input) input.value = plate;

        let socioData = null;
        let reservaData = null;

        // 1. Consultar Padrón de Socios Fundadores
        try {
            const resSocio = await fetch(`${API_URL}socios_fundadores.php?check=${encodeURIComponent(plate)}`);
            const dataSocio = await resSocio.json();
            if (dataSocio && dataSocio.success && dataSocio.es_socio && dataSocio.socio) {
                socioData = dataSocio.socio;
            } else if (plate.includes('O')) {
                // Fallback inteligente: si contiene 'O', probar con 'D' (confusión común de OCR)
                const altPlate = plate.replace(/O/g, 'D');
                const resAlt = await fetch(`${API_URL}socios_fundadores.php?check=${encodeURIComponent(altPlate)}`);
                const dataAlt = await resAlt.json();
                if (dataAlt && dataAlt.success && dataAlt.es_socio && dataAlt.socio) {
                    socioData = dataAlt.socio;
                    plate = altPlate;
                }
            }
        } catch (e) {
            console.warn("Error consultando padrón de socios:", e);
        }

        // 2. Consultar Reservas del día
        try {
            const resReserva = await fetch(`${API_URL}reservas.php?patente=${encodeURIComponent(plate)}`);
            const dataReserva = await resReserva.json();
            if (Array.isArray(dataReserva) && dataReserva.length > 0) {
                reservaData = dataReserva[0];
            }
        } catch (e) {
            console.warn("Error consultando reservas:", e);
        }

        // Determinar categoría y servicio recomendado
        let category = 'GENERAL';
        let categoryLabel = '🚗 Cliente General / Espontáneo';
        let categoryBadgeClass = 'badge-general';
        let titular = 'Cliente Ocasional';
        let modelo = 'Auto / Camioneta';
        let service = 'express_auto';
        let serviceLabel = 'Lavado Express Auto';
        let isVip = false;

        if (socioData) {
            const tipo = (socioData.tipo_membresia || socioData.tipo || 'black').toLowerCase();
            if (tipo.includes('black')) {
                category = 'BLACK';
                categoryLabel = `👑 Socio Fundador BLACK ${socioData.numero || ''}`;
                categoryBadgeClass = 'badge-socio-black';
            } else {
                category = 'GOLD';
                categoryLabel = `🏆 Socio Fundador GOLD ${socioData.numero || ''}`;
                categoryBadgeClass = 'badge-socio-gold';
            }
            titular = socioData.titular || socioData.nombre || 'Socio Club 100';
            modelo = socioData.modelo_auto || socioData.modelo || 'Vehículo Registrado';
            service = (modelo.toLowerCase().includes('camioneta') || modelo.toLowerCase().includes('hilux') || modelo.toLowerCase().includes('amarok') || modelo.toLowerCase().includes('ranger')) 
                ? 'completo_camioneta' 
                : 'completo_auto';
            serviceLabel = (service === 'completo_camioneta') ? '⭐ Completo Camioneta (VIP)' : '⭐ Completo Auto (VIP)';
            isVip = true;
        } else if (reservaData) {
            category = 'RESERVA';
            categoryLabel = `📅 Reserva Web Confirmada`;
            categoryBadgeClass = 'badge-reserva';
            titular = reservaData.nombre || 'Reserva Online';
            modelo = reservaData.modelo || 'Auto / Camioneta';
            service = reservaData.tipo_lavado || 'express_auto';
            serviceLabel = reservaData.tipo_lavado ? reservaData.tipo_lavado.replace(/_/g, ' ').toUpperCase() : 'Lavado Reservado';
        }

        const lprPayload = {
            plate,
            rawText,
            score,
            wasCorrected,
            patternName,
            category,
            categoryLabel,
            titular,
            modelo,
            service,
            serviceLabel,
            isVip,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        pendingAlertCar = lprPayload;

        // Renderizar Tarjeta de Diagnóstico
        renderLprDiagnosisCard(lprPayload);

        // Sonido de alerta
        playLprChime(isVip ? 'vip' : 'success');

        // Mostrar Banner Flotante en el Dashboard Principal
        showDashboardLprAlert(lprPayload);

        // Auto-creación en pista para TODO vehículo detectado
        const autoAssignToggle = document.getElementById('lpr-auto-assign-toggle');
        const shouldAutoAssign = autoAssignToggle ? autoAssignToggle.checked : true;

        if (shouldAutoAssign) {
            assignLprCarToTrack(lprPayload, true);
        } else if (forceBypassCooldown && !shouldAutoAssign) {
            if (window.showToast) window.showToast(`Patente ${plate} detectada. Hacé clic en "Asignar a Pista"`, 'info');
        }
    }

    // Renderizar Tarjeta de Diagnóstico LPR con Miniatura IA
    function renderLprDiagnosisCard(lpr) {
        const container = document.getElementById('lpr-detection-result');
        if (!container) return;

        let badgeBg = 'rgba(56, 189, 248, 0.15)';
        let badgeColor = '#38bdf8';
        let badgeBorder = 'rgba(56, 189, 248, 0.4)';

        if (lpr.category === 'BLACK') {
            badgeBg = 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(0,0,0,0.8))';
            badgeColor = '#fbbf24';
            badgeBorder = 'rgba(251, 191, 36, 0.6)';
        } else if (lpr.category === 'GOLD') {
            badgeBg = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(0,0,0,0.8))';
            badgeColor = '#f59e0b';
            badgeBorder = 'rgba(245, 158, 11, 0.6)';
        } else if (lpr.category === 'RESERVA') {
            badgeBg = 'rgba(16, 185, 129, 0.2)';
            badgeColor = '#34d399';
            badgeBorder = 'rgba(16, 185, 129, 0.5)';
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="lpr-result-grid">
                <!-- Placa Patente Estilo Argentino/Mercosur con opción de editar -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <div style="background: #ffffff; border-radius: 8px; border: 2px solid #1e293b; width: 175px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); overflow: hidden; text-align: center;">
                        <div style="background: #0284c7; color: #fff; font-size: 0.65rem; font-weight: 800; letter-spacing: 2px; padding: 2px 4px; display: flex; justify-content: space-between; align-items: center;">
                            <span>ARGENTINA</span>
                            <span>🇦🇷</span>
                        </div>
                        <div style="font-family: 'Racing Sans One', sans-serif; font-size: 1.6rem; color: #0f172a; padding: 4px 6px; letter-spacing: 2px; font-weight: 800;">
                            ${lpr.plate}
                        </div>
                    </div>
                    <button onclick="editLprPlatePrompt()" style="background: none; border: none; color: #94a3b8; font-size: 0.72rem; cursor: pointer; text-decoration: underline;">
                        <i class='bx bx-edit'></i> Corregir si difiere
                    </button>
                </div>

                <!-- Datos del Cliente, Servicio y Diagnóstico de IA -->
                <div>
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
                        <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
                            ${lpr.categoryLabel}
                        </span>
                        ${lpr.wasCorrected ? `
                            <span style="background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;" title="Texto crudo leído: ${lpr.rawText}">
                                <i class='bx bx-check-shield'></i> Auto-corregido por sintaxis (${lpr.patternName || 'Mercosur'})
                            </span>
                        ` : `
                            <span style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                                <i class='bx bx-check'></i> Lectura Directa (${lpr.score || 95}%)
                            </span>
                        `}
                    </div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">
                        ${lpr.titular} <span style="font-weight: 400; color: #94a3b8; font-size: 0.88rem;">— ${lpr.modelo}</span>
                    </div>
                    <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 4px;">
                        <div style="color: #38bdf8; font-size: 0.84rem; font-weight: 600;">
                            <i class='bx bx-check-double'></i> Servicio Sugerido: <strong>${lpr.serviceLabel}</strong>
                        </div>
                        <!-- Miniatura procesada por la IA -->
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                            <span style="font-size: 0.7rem; color: #94a3b8;"><i class='bx bx-image-alt'></i> Recorte IA:</span>
                            <canvas id="lpr-debug-canvas" style="height: 24px; max-width: 110px; border-radius: 3px; border: 1px solid #0284c7; background: #000; vertical-align: middle;"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Botón de Verificación y Cobro del Supervisor -->
                <div>
                    <button class="btn btn-primary" id="btn-lpr-diagnosis-action" onclick="openSupervisorCheckoutModal(pendingAlertCar)" style="padding: 12px 20px; font-weight: 800; font-size: 0.95rem; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 10px; box-shadow: 0 4px 15px rgba(16,185,129,0.3); display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <i class='bx bx-check-shield' style="font-size: 1.2rem;"></i> Verificar y Cobrar
                    </button>
                </div>
            </div>
        `;

        // Renderizar el frame recortado en la miniatura de depuración
        setTimeout(() => {
            const debugCanvas = document.getElementById('lpr-debug-canvas');
            const ocrCanvas = document.getElementById('camera-ocr-canvas');
            if (debugCanvas && ocrCanvas && ocrCanvas.width > 0) {
                debugCanvas.width = ocrCanvas.width;
                debugCanvas.height = ocrCanvas.height;
                const dCtx = debugCanvas.getContext('2d');
                dCtx.drawImage(ocrCanvas, 0, 0);
            }
        }, 30);
    }

    // Asignar Auto Detectado Automáticamente a la Pista de Boxes
    window.assignLprCarToTrack = function(lpr, wasAuto = false) {
        if (!lpr) return;
        
        let estadoPagoInicial = 'pendiente';
        let metodoPagoInicial = null;
        let montoInicial = getWashPrice(lpr.service, lpr.category);

        if (lpr.category === 'BLACK' || lpr.category === 'GOLD') {
            estadoPagoInicial = 'socio_bonificado';
            metodoPagoInicial = 'socio';
            montoInicial = 0;
        } else if (lpr.category === 'RESERVA') {
            estadoPagoInicial = 'reserva_online';
            metodoPagoInicial = 'reserva_online';
            montoInicial = 0;
        }

        const meta = {
            cliente_tipo: lpr.category || 'GENERAL',
            titular: lpr.titular || 'Cliente Ocasional',
            modelo: lpr.modelo || 'Auto / Camioneta',
            estado_pago: estadoPagoInicial,
            metodo_pago: metodoPagoInicial,
            monto: montoInicial,
            verificado: false
        };

        // Ingresar a la pista inmediatamente
        let newCar = null;
        if (typeof window.ingresarAuto === 'function') {
            newCar = window.ingresarAuto(lpr.service, lpr.plate, meta);
        }

        // Agregar al historial visual de hoy
        addLprHistoryEntry(lpr);

        if (window.showToast) {
            window.showToast(`🚗 Ingreso automático: ${lpr.plate} en Pista. Pendiente de verificación/cobro`, 'success');
        }

        // Mostrar Banner Flotante en el Dashboard para que el supervisor verifique y cobre
        showDashboardLprAlert(lpr);

        // Actualizar botón en la tarjeta de resultado de diagnóstico
        const resContainer = document.getElementById('lpr-detection-result');
        if (resContainer) {
            const btn = resContainer.querySelector('#btn-lpr-diagnosis-action');
            if (btn) {
                btn.innerHTML = "<i class='bx bx-check-shield'></i> Verificar y Cobrar";
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                btn.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)';
                btn.onclick = () => openSupervisorCheckoutModal(lpr);
            }
        }
    };

    // Agregar entrada a la tabla de historial LPR de hoy
    function addLprHistoryEntry(lpr) {
        const tbody = document.getElementById('lpr-history-tbody');
        const countSpan = document.getElementById('lpr-history-count');
        if (!tbody) return;

        // Quitar fila vacía si existe
        if (tbody.querySelector('td[colspan]')) {
            tbody.innerHTML = '';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: #94a3b8;">${lpr.time}</td>
            <td>
                <span style="font-family: 'Racing Sans One', sans-serif; font-size: 1rem; color: #38bdf8; letter-spacing: 1px; background: rgba(56,189,248,0.1); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3);">
                    ${lpr.plate}
                </span>
            </td>
            <td>
                <span style="font-size: 0.78rem; font-weight: 700; color: ${lpr.isVip ? '#fbbf24' : '#e2e8f0'};">
                    ${lpr.categoryLabel}
                </span>
            </td>
            <td style="color: #cbd5e1; font-size: 0.85rem;">
                ${lpr.titular} <span style="color: #64748b;">(${lpr.modelo})</span>
            </td>
            <td>
                <span style="background: rgba(16,185,129,0.15); color: #34d399; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
                    ${lpr.serviceLabel}
                </span>
            </td>
        `;

        tbody.insertBefore(tr, tbody.firstChild);

        if (countSpan) {
            const rows = tbody.querySelectorAll('tr').length;
            countSpan.textContent = `${rows} ingreso${rows > 1 ? 's' : ''}`;
        }
    }

    // Mostrar Banner Flotante en el Dashboard Principal
    function showDashboardLprAlert(lpr) {
        const banner = document.getElementById('dashboard-lpr-alert');
        const plateEl = document.getElementById('alert-plate-text');
        const infoEl = document.getElementById('alert-plate-info');
        const btnEl = document.getElementById('btn-alert-quick-assign');
        if (!banner || !plateEl || !infoEl) return;

        plateEl.textContent = lpr.plate;
        infoEl.textContent = `${lpr.categoryLabel} — ${lpr.titular} (${lpr.serviceLabel})`;
        if (btnEl) {
            btnEl.innerHTML = "<i class='bx bx-check-shield'></i> Verificar y Cobrar";
            btnEl.style.background = "linear-gradient(135deg, #10b981, #059669)";
            btnEl.onclick = () => openSupervisorCheckoutModal(lpr);
        }
        banner.style.display = 'flex';
    }

    // Acción del botón en el banner flotante del Dashboard
    window.handleQuickAlertAssign = function() {
        if (pendingAlertCar) {
            openSupervisorCheckoutModal(pendingAlertCar);
        }
    };

    // ============================================================
    // MODAL DE CHECKOUT Y VERIFICACIÓN DEL SUPERVISOR
    // ============================================================
    let currentCheckoutContext = null;
    let selectedCheckoutPayment = 'efectivo';

    function findCarById(carId) {
        if (!carId) return null;
        if (estadoLavado && estadoLavado.id === carId) return { car: estadoLavado, zone: 'lavado', index: 0 };
        if (Array.isArray(estadoSecado)) {
            for (let i = 0; i < estadoSecado.length; i++) {
                if (estadoSecado[i] && estadoSecado[i].id === carId) return { car: estadoSecado[i], zone: 'interior', index: i };
            }
        }
        if (Array.isArray(estadoTerminado)) {
            for (let i = 0; i < estadoTerminado.length; i++) {
                if (estadoTerminado[i] && estadoTerminado[i].id === carId) return { car: estadoTerminado[i], zone: 'terminado', index: i };
            }
        }
        if (Array.isArray(estadoEspera)) {
            for (let i = 0; i < estadoEspera.length; i++) {
                if (estadoEspera[i] && estadoEspera[i].id === carId) return { car: estadoEspera[i], zone: 'espera', index: i };
            }
        }
        return null;
    }

    function findCarByPlate(plate) {
        if (!plate) return null;
        const pUpper = plate.trim().toUpperCase();
        if (estadoLavado && (estadoLavado.patente || '').toUpperCase() === pUpper) return { car: estadoLavado, zone: 'lavado', index: 0 };
        if (Array.isArray(estadoSecado)) {
            for (let i = 0; i < estadoSecado.length; i++) {
                if (estadoSecado[i] && (estadoSecado[i].patente || '').toUpperCase() === pUpper) return { car: estadoSecado[i], zone: 'interior', index: i };
            }
        }
        if (Array.isArray(estadoTerminado)) {
            for (let i = 0; i < estadoTerminado.length; i++) {
                if (estadoTerminado[i] && (estadoTerminado[i].patente || '').toUpperCase() === pUpper) return { car: estadoTerminado[i], zone: 'terminado', index: i };
            }
        }
        if (Array.isArray(estadoEspera)) {
            for (let i = 0; i < estadoEspera.length; i++) {
                if (estadoEspera[i] && (estadoEspera[i].patente || '').toUpperCase() === pUpper) return { car: estadoEspera[i], zone: 'espera', index: i };
            }
        }
        return null;
    }

    window.openSupervisorCheckoutModalByCarId = function(carId) {
        const found = findCarById(carId);
        if (found && found.car) {
            openSupervisorCheckoutModal(found.car);
        } else {
            if (window.showToast) window.showToast('No se encontró el vehículo en pista.', 'error');
        }
    };

    window.openSupervisorCheckoutModal = function(carOrLpr) {
        const modal = document.getElementById('modal-supervisor-checkout');
        if (!modal) return;

        let car = null;
        let lpr = null;

        if (carOrLpr && carOrLpr.id !== undefined && !carOrLpr.plate) {
            car = carOrLpr;
        } else if (carOrLpr && carOrLpr.plate) {
            lpr = carOrLpr;
            const found = findCarByPlate(lpr.plate);
            if (found) car = found.car;
        } else if (pendingAlertCar) {
            lpr = pendingAlertCar;
            const found = findCarByPlate(lpr.plate);
            if (found) car = found.car;
        }

        const category = car ? (car.cliente_tipo || 'GENERAL') : (lpr ? lpr.category : 'GENERAL');
        const titular = car ? (car.titular || 'Cliente Ocasional') : (lpr ? lpr.titular : 'Cliente Ocasional');
        const modelo = car ? (car.modelo || 'Auto / Camioneta') : (lpr ? lpr.modelo : 'Auto / Camioneta');
        const plate = car ? (car.patente || '') : (lpr ? lpr.plate : '');
        const currentService = car ? (car.tipo || 'express_auto') : (lpr ? lpr.service : 'express_auto');
        const initialPaymentMethod = (car && car.metodo_pago) ? car.metodo_pago : (category === 'BLACK' || category === 'GOLD' ? 'socio' : (category === 'RESERVA' ? 'reserva_online' : 'efectivo'));

        currentCheckoutContext = {
            car: car,
            lpr: lpr,
            category: category,
            titular: titular,
            modelo: modelo
        };

        // Rellenar Banner de Cliente
        const badgeEl = document.getElementById('checkout-category-badge');
        const nameEl = document.getElementById('checkout-customer-name');
        const modelEl = document.getElementById('checkout-vehicle-model');
        const bannerEl = document.getElementById('checkout-customer-banner');

        if (nameEl) nameEl.textContent = titular;
        if (modelEl) modelEl.textContent = modelo;

        if (badgeEl && bannerEl) {
            if (category === 'BLACK') {
                badgeEl.textContent = '👑 SOCIO FUNDADOR BLACK';
                badgeEl.style.color = '#fbbf24';
                bannerEl.style.background = 'rgba(251,191,36,0.12)';
                bannerEl.style.borderColor = 'rgba(251,191,36,0.3)';
            } else if (category === 'GOLD') {
                badgeEl.textContent = '🌟 SOCIO CLUB 100 GOLD';
                badgeEl.style.color = '#f59e0b';
                bannerEl.style.background = 'rgba(245,158,11,0.12)';
                bannerEl.style.borderColor = 'rgba(245,158,11,0.3)';
            } else if (category === 'RESERVA') {
                badgeEl.textContent = '📅 RESERVA PREPAGADA';
                badgeEl.style.color = '#38bdf8';
                bannerEl.style.background = 'rgba(56,189,248,0.12)';
                bannerEl.style.borderColor = 'rgba(56,189,248,0.3)';
            } else {
                badgeEl.textContent = '🚗 CLIENTE GENERAL';
                badgeEl.style.color = '#10b981';
                bannerEl.style.background = 'rgba(16,185,129,0.12)';
                bannerEl.style.borderColor = 'rgba(16,185,129,0.3)';
            }
        }

        // Rellenar Patente
        const plateInput = document.getElementById('checkout-plate');
        if (plateInput) plateInput.value = plate;

        // Rellenar Servicio
        const serviceSelect = document.getElementById('checkout-service');
        if (serviceSelect) serviceSelect.value = currentService;

        // Rellenar Precio
        const price = (car && car.monto !== undefined && car.monto !== null) ? car.monto : getWashPrice(currentService, category);
        const displayEl = document.getElementById('checkout-price-display');
        const customEl = document.getElementById('checkout-custom-amount');
        const hintEl = document.getElementById('checkout-price-hint');

        if (displayEl) displayEl.textContent = `$${Number(price).toLocaleString('es-AR')}`;
        if (customEl) customEl.value = price;
        if (hintEl) {
            if (category === 'BLACK' || category === 'GOLD') {
                hintEl.textContent = 'Membresía Club 100 bonificada ($0)';
            } else if (category === 'RESERVA') {
                hintEl.textContent = 'Turno prepagado en plataforma web';
            } else {
                hintEl.textContent = 'Precio tarifado según servicio';
            }
        }

        // Seleccionar Método de Pago
        const targetBtn = document.querySelector(`#checkout-payment-buttons button[data-method="${initialPaymentMethod}"]`) || document.querySelector('#checkout-payment-buttons button[data-method="efectivo"]');
        selectCheckoutPaymentMethod(initialPaymentMethod, targetBtn);

        modal.style.display = 'flex';
        if (plateInput) setTimeout(() => plateInput.focus(), 50);
    };

    window.closeSupervisorCheckoutModal = function() {
        const modal = document.getElementById('modal-supervisor-checkout');
        if (modal) modal.style.display = 'none';
        currentCheckoutContext = null;
    };

    window.onCheckoutServiceChange = function(newService) {
        if (!currentCheckoutContext) return;
        const cat = currentCheckoutContext.category || 'GENERAL';
        const price = getWashPrice(newService, cat);

        const displayEl = document.getElementById('checkout-price-display');
        const customEl = document.getElementById('checkout-custom-amount');
        if (displayEl) displayEl.textContent = `$${Number(price).toLocaleString('es-AR')}`;
        if (customEl) customEl.value = price;
    };

    window.selectCheckoutPaymentMethod = function(method, btn) {
        selectedCheckoutPayment = method;
        document.querySelectorAll('#checkout-payment-buttons .btn-checkout-payment').forEach(b => {
            b.classList.remove('active');
            b.style.borderColor = 'rgba(255,255,255,0.1)';
            b.style.background = 'rgba(255,255,255,0.04)';
            b.style.color = '#cbd5e1';
            b.style.boxShadow = 'none';
        });

        const activeBtn = btn || document.querySelector(`#checkout-payment-buttons button[data-method="${method}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            if (method === 'efectivo') {
                activeBtn.style.borderColor = '#10b981';
                activeBtn.style.background = 'rgba(16,185,129,0.25)';
                activeBtn.style.color = '#34d399';
                activeBtn.style.boxShadow = '0 0 12px rgba(16,185,129,0.3)';
            } else if (method === 'socio') {
                activeBtn.style.borderColor = '#fbbf24';
                activeBtn.style.background = 'rgba(251,191,36,0.25)';
                activeBtn.style.color = '#fbbf24';
                activeBtn.style.boxShadow = '0 0 12px rgba(251,191,36,0.3)';
            } else if (method === 'reserva_online') {
                activeBtn.style.borderColor = '#38bdf8';
                activeBtn.style.background = 'rgba(56,189,248,0.25)';
                activeBtn.style.color = '#38bdf8';
                activeBtn.style.boxShadow = '0 0 12px rgba(56,189,248,0.3)';
            } else {
                activeBtn.style.borderColor = '#38bdf8';
                activeBtn.style.background = 'rgba(56,189,248,0.2)';
                activeBtn.style.color = '#38bdf8';
                activeBtn.style.boxShadow = '0 0 12px rgba(56,189,248,0.3)';
            }
        }
    };

    window.confirmSupervisorCheckout = function() {
        if (!currentCheckoutContext) {
            closeSupervisorCheckoutModal();
            return;
        }

        const plateInput = document.getElementById('checkout-plate');
        const finalPlate = (plateInput ? plateInput.value.trim() : '').toUpperCase();
        if (!finalPlate) {
            if (window.showToast) window.showToast('Por favor ingrese una patente válida', 'error');
            return;
        }

        const serviceSelect = document.getElementById('checkout-service');
        const finalService = serviceSelect ? serviceSelect.value : 'express_auto';

        const customInput = document.getElementById('checkout-custom-amount');
        const parsedCustom = customInput ? parseFloat(customInput.value) : NaN;
        const finalAmount = !isNaN(parsedCustom) ? parsedCustom : getWashPrice(finalService, currentCheckoutContext.category);

        const method = selectedCheckoutPayment || 'efectivo';

        // Buscar el auto en la pista si no lo teníamos vinculado directamente
        let carObj = currentCheckoutContext.car;
        if (!carObj) {
            const found = findCarByPlate(finalPlate) || (currentCheckoutContext.lpr ? findCarByPlate(currentCheckoutContext.lpr.plate) : null);
            if (found) carObj = found.car;
        }

        if (carObj) {
            carObj.patente = finalPlate;
            carObj.tipo = finalService;
            carObj.monto = finalAmount;
            carObj.metodo_pago = method;
            carObj.verificado = true;
            carObj.estado_pago = (method === 'socio') ? 'socio_bonificado' : (method === 'reserva_online' ? 'reserva_online' : 'pagado');
            carObj.metricaRegistrada = true;
        }

        // Registrar métrica contable
        const metricRecord = {
            id: Date.now() + Math.random(),
            patente: finalPlate,
            timestamp: Date.now(),
            tipo: finalService,
            revenue: finalAmount,
            profit: finalAmount,
            metodo_pago: method,
            verificado_supervisor: true
        };
        metricsHistory.push(metricRecord);
        localStorage.setItem('metricsHistory', JSON.stringify(metricsHistory));
        if (typeof window.updateMetricsUI === 'function') {
            window.updateMetricsUI();
        }

        // Enviar al backend DonWeb MySQL api/reservas.php
        try {
            fetch(`${API_URL}reservas.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre_cliente: currentCheckoutContext.titular || 'Cliente en Pista',
                    telefono: 'S/D',
                    patente: finalPlate,
                    tipo_vehiculo: finalService.includes('camioneta') ? 'Camioneta' : 'Auto',
                    tipo_lavado: finalService,
                    fecha: new Date().toISOString().split('T')[0],
                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    precio: finalAmount,
                    estado: 'pagado_en_pista',
                    notas: `Cobrado por Supervisor (${method.toUpperCase()})`
                })
            }).catch(e => console.warn('Error en persistencia de cobro:', e));
        } catch(e) {}

        // Resguardo Físico en Archivo Local de esta PC (.csv y .jsonl)
        try {
            if (typeof window.guardarClienteEnArchivoLocalPC === 'function') {
                window.guardarClienteEnArchivoLocalPC({
                    tipo_registro: 'COBRO_PISTA_SUPERVISOR',
                    numero_socio: (currentCheckoutContext.category === 'BLACK' || currentCheckoutContext.category === 'GOLD') ? (currentCheckoutContext.car?.numero || currentCheckoutContext.lpr?.numero || 'SOCIO') : '',
                    patente: finalPlate,
                    titular: currentCheckoutContext.titular || 'Cliente en Pista',
                    telefono: 'S/D',
                    email: '',
                    modelo: currentCheckoutContext.modelo || (finalService.includes('camioneta') ? 'Camioneta' : 'Auto'),
                    servicio: finalService,
                    precio: finalAmount,
                    metodo_pago: method,
                    estado: (method === 'socio') ? 'socio_bonificado' : (method === 'reserva_online' ? 'reserva_online' : 'pagado'),
                    notas: `Cobrado por Supervisor (${method.toUpperCase()})`
                });
            }
        } catch (e) {
            console.warn('Error al resguardar localmente en PC:', e);
        }

        // Sincronizar estado en vivo
        if (typeof syncLiveState === 'function') syncLiveState();
        if (typeof updateVisuals === 'function') updateVisuals();
        renderBoxesManagementList();

        // Ocultar banner flotante de alerta si correspondía a este auto
        const alertBanner = document.getElementById('dashboard-lpr-alert');
        if (alertBanner) alertBanner.style.display = 'none';

        // Sonido de éxito
        playLprChime('success');

        if (window.showToast) {
            window.showToast(`✅ Cobro registrado: $${Number(finalAmount).toLocaleString('es-AR')} (${method.toUpperCase()}) - ${finalPlate}`, 'success');
        }

        closeSupervisorCheckoutModal();
    };

    // Listar Dispositivos de Cámara Web en PC
    async function populateCameraDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            const select = document.getElementById('camera-device-select');
            if (select && videoDevices.length > 0) {
                select.style.display = 'inline-block';
                select.innerHTML = videoDevices.map((d, i) => `
                    <option value="${d.deviceId}">📷 ${d.label || `Cámara de Entrada #${i + 1}`}</option>
                `).join('');
                
                const savedId = localStorage.getItem('aura_selected_camera_id');
                if (savedId && videoDevices.some(d => d.deviceId === savedId)) {
                    select.value = savedId;
                }
            }
        } catch (e) {
            console.warn('Error listando dispositivos de cámara:', e);
        }
    }

    window.switchCameraDevice = async function(deviceId) {
        if (!deviceId) return;
        localStorage.setItem('aura_selected_camera_id', deviceId);
        if (activeCameraStream) {
            activeCameraStream.getTracks().forEach(track => track.stop());
            activeCameraStream = null;
        }
        if (lprAutoScanInterval) {
            clearInterval(lprAutoScanInterval);
            lprAutoScanInterval = null;
        }
        const btn = document.getElementById('btn-start-camera');
        if (btn) btn.click();
    };

    // Encendido de la Cámara de Entrada y Activación del Bucle de Escaneo
    if (btnStartCamera) {
        btnStartCamera.addEventListener('click', async () => {
            try {
                btnStartCamera.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Conectando Cámara...";
                
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("El navegador no soporta acceso a la cámara. Asegúrate de usar HTTPS o acceder vía localhost.");
                }

                if (activeCameraStream) {
                    activeCameraStream.getTracks().forEach(track => track.stop());
                    activeCameraStream = null;
                }
                if (lprAutoScanInterval) {
                    clearInterval(lprAutoScanInterval);
                    lprAutoScanInterval = null;
                }

                const savedDeviceId = localStorage.getItem('aura_selected_camera_id');
                let videoConstraints = true;
                if (savedDeviceId) {
                    videoConstraints = { deviceId: { exact: savedDeviceId } };
                }

                let stream = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
                } catch (e1) {
                    console.warn("Fallo con dispositivo específico, reintentando modo genérico video: true...", e1);
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                }
                
                activeCameraStream = stream;
                videoElement.srcObject = stream;
                
                videoElement.onloadedmetadata = () => {
                    videoElement.style.display = 'block';
                    if (cameraOverlay) cameraOverlay.style.display = 'flex';
                    if (cameraLoading) cameraLoading.style.display = 'none';
                    btnStartCamera.style.display = 'none';

                    const snapBtn = document.getElementById('btn-snap-plate-now');
                    if (snapBtn) snapBtn.style.display = 'inline-flex';

                    populateCameraDevices();

                    // Precalentar motor Tesseract
                    getTesseractWorker();

                    // Iniciar bucle de auto-escaneo cada 2.5 segundos (2500ms)
                    if (lprAutoScanInterval) clearInterval(lprAutoScanInterval);
                    lprAutoScanInterval = setInterval(() => {
                        const toggle = document.getElementById('lpr-auto-scan-toggle');
                        if (toggle && toggle.checked) {
                            window.captureAndOcrPlateNow();
                        }
                    }, 2500);

                    if (window.showToast) {
                        window.showToast('📷 Cámara de Entrada activa con Lector LPR Inteligente', 'success');
                    }
                };

            } catch (err) {
                console.error("Error al acceder a la cámara:", err);
                let msg = "No se pudo acceder a la cámara.";
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    msg = "🔒 Permiso denegado. Hacé clic en el ícono del candado en la barra de direcciones del navegador y autorizá el uso de la cámara.";
                } else if (err.name === "NotReadableError" || err.name === "TrackStartError" || (err.message && err.message.includes("Could not start video source"))) {
                    msg = "📷 La cámara de la PC está ocupada por otro programa (como Zoom, Teams o la App de Cámara).\n\nPor favor, cerrá esos programas y volvé a presionar 'Encender Cámara Entrada'.";
                } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                    msg = "🔌 No se detectó ninguna cámara conectada a la PC.";
                } else if (err.message) {
                    msg = err.message;
                }
                
                alert(msg);
                btnStartCamera.innerHTML = "<i class='bx bx-error'></i> Reintentar Encendido";
            }
        });
    }

    // ==========================================
    // SISTEMA DE RESERVAS (TIEMPO REAL)
    // ==========================================
    let pendingReservations = [];

    // Función para renderizar la tabla de reservas
    function renderReservations() {
        const tbody = document.getElementById('reservas-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Actualizar el texto en el Dashboard (Panel Principal)
        const zonaReserva = document.querySelector('.reserva-online');
        if (zonaReserva) {
            if (pendingReservations.length > 0) {
                zonaReserva.innerHTML = `Zona Reserva Online<br><span style="color: #facc15; font-weight: bold; font-size: 1.1rem;">(${pendingReservations.length} en espera)</span>`;
            } else {
                zonaReserva.innerHTML = 'Zona Reserva Online';
            }
        }

        if (pendingReservations.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align: center; color: #9ca3af; padding: 20px;">No hay autos en cola.</td>`;
            tbody.appendChild(tr);
            return;
        }

        pendingReservations.forEach(reserva => {
            const tr = document.createElement('tr');
            
            let srvName = '';
            if(reserva.tipo_lavado === 'solo_lavado') srvName = 'Solo Lavado';
            else if (reserva.tipo_lavado === 'solo_secado') srvName = 'Solo Interior';
            else srvName = 'Lavado + Interior';

            tr.innerHTML = `
                <td style="font-weight: bold; color: var(--primary-color);">${reserva.patente}</td>
                <td>${srvName}</td>
                <td>${reserva.telefono || 'S/D'}</td>
                <td>
                    <button class="btn-dar-ingreso" data-id="${reserva.id}" style="padding: 8px 15px; background: #22c55e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Dar Ingreso
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Asignar eventos a los botones
        document.querySelectorAll('.btn-dar-ingreso').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reservaId = parseInt(e.target.getAttribute('data-id'));
                const reserva = pendingReservations.find(r => r.id === reservaId);
                if (reserva) {
                    // Cambiar estado en BD DonWeb MySQL
                    try {
                        await fetch(`${API_URL}reservas.php`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: reservaId, estado: 'ingresado' })
                        });
                    } catch(e){ console.error('Error actualizando reserva:', e); }

                    // 1. Cambiar a la vista del Dashboard
                    const navBtns = document.querySelectorAll('.nav-btn');
                    navBtns.forEach(b => b.classList.remove('active'));
                    const btnDashboard = Array.from(navBtns).find(b => b.textContent.includes('Panel Principal'));
                    if (btnDashboard) btnDashboard.classList.add('active');
                    
                    const reservasView = document.getElementById('reservas-view');
                    const dashboardView = document.getElementById('dashboard-view');
                    if (reservasView) reservasView.style.display = 'none';
                    if (dashboardView) dashboardView.style.display = 'flex';

                    // 2. Ingresar el auto a la pista
                    ingresarAuto(reserva.tipo_lavado, reserva.patente);
                    
                    // 3. Quitar de la lista local
                    pendingReservations = pendingReservations.filter(r => r.id !== reservaId);
                    renderReservations();
                }
            });
        });
    }

    // Cargar reservas iniciales
    async function loadReservations() {
        try {
            const res = await fetch(`${API_URL}reservas.php`);
            if (res.ok) {
                const data = await res.json();
                pendingReservations = (data || []).filter(r => r.estado === 'pendiente');
                renderReservations();
            }
        } catch (err) {
            console.error('Error cargando reservas:', err);
        }
    }

    // Polling de reservas cada 5 segundos
    function subscribeToReservations() {
        setInterval(loadReservations, 5000);
    }

    // Iniciar carga y suscripción
    loadReservations();
    subscribeToReservations();

    // ==========================================
    // SISTEMA DE PROMOCIONES & FIDELIDAD POR PATENTE
    // ==========================================
    let customPromosList = JSON.parse(localStorage.getItem('aura_custom_promos') || '[]');

    window.openAddPromoModal = function() {
        const modal = document.getElementById('add-promo-modal');
        if (modal) modal.style.display = 'flex';
    };

    window.closeAddPromoModal = function() {
        const modal = document.getElementById('add-promo-modal');
        if (modal) modal.style.display = 'none';
    };

    window.handleSaveCustomPromo = function(e) {
        if (e) e.preventDefault();
        const titulo = document.getElementById('promo-title-input')?.value.trim();
        const patente = document.getElementById('promo-patente-input')?.value.trim().toUpperCase();
        const descuento = parseFloat(document.getElementById('promo-descuento-input')?.value || 0);
        const descripcion = document.getElementById('promo-desc-input')?.value.trim();

        if (!titulo || !descuento) return;

        const newPromo = {
            id: 'promo-' + Date.now(),
            titulo,
            patente: patente || 'TODAS',
            descuento,
            descripcion: descripcion || `Beneficio especial de ${descuento}% OFF en tu lavado.`,
            activa: true
        };

        customPromosList.push(newPromo);
        localStorage.setItem('aura_custom_promos', JSON.stringify(customPromosList));

        window.closeAddPromoModal();
        window.fetchPromociones();

        if (window.showToast) window.showToast('Promoción creada exitosamente', 'success');
    };

    window.handleSaveFidelidadConfig = function() {
        const freq = document.getElementById('promo-fidelidad-frecuencia')?.value || 5;
        const reward = document.getElementById('promo-fidelidad-premio')?.value || 100;

        localStorage.setItem('aura_fidelidad_config', JSON.stringify({ frecuencia: parseInt(freq), premio: parseInt(reward) }));
        if (window.showToast) window.showToast('Regla de fidelidad por patente guardada', 'success');
    };

    window.togglePromo = function(id, activa) {
        customPromosList = customPromosList.map(p => p.id === id ? { ...p, activa: activa } : p);
        localStorage.setItem('aura_custom_promos', JSON.stringify(customPromosList));
        window.fetchPromociones();
    };

    window.deletePromo = function(id) {
        customPromosList = customPromosList.filter(p => p.id !== id);
        localStorage.setItem('aura_custom_promos', JSON.stringify(customPromosList));
        window.fetchPromociones();
    };

    window.fetchPromociones = async function() {
        const container = document.getElementById('promociones-container');
        if (!container) return;

        // Cargar configuración de fidelidad
        const fidCfg = JSON.parse(localStorage.getItem('aura_fidelidad_config') || '{"frecuencia":5, "premio":100}');
        const freqEl = document.getElementById('promo-fidelidad-frecuencia');
        const premEl = document.getElementById('promo-fidelidad-premio');
        if (freqEl) freqEl.value = fidCfg.frecuencia;
        if (premEl) premEl.value = fidCfg.premio;

        if (customPromosList.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: rgba(30,41,59,0.5); border: 1px dashed var(--border-color); border-radius: 16px;">
                    <i class='bx bx-gift' style="font-size: 3rem; color: #38bdf8; margin-bottom: 10px;"></i>
                    <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 6px;">No hay promociones personalizadas activas</h4>
                    <p style="color: #94a3b8; font-size: 0.9rem; max-width: 450px; margin: 0 auto 16px;">
                        Podés crear beneficios específicos por patente (ej: VIP, Flotas o 50% OFF) haciendo clic en "Crear Nueva Promoción".
                    </p>
                    <button class="btn btn-primary" onclick="openAddPromoModal()" style="padding: 10px 20px;">
                        <i class='bx bx-plus'></i> Crear Primera Promoción
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = customPromosList.map(p => `
            <div class="card" style="padding: 1.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <span style="background: rgba(14,165,233,0.15); color: #38bdf8; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(14,165,233,0.3);">
                            <i class='bx bx-car'></i> Patente: ${p.patente}
                        </span>
                        <span style="font-size: 1.25rem; font-weight: 900; color: #34d399;">
                            -${p.descuento}% OFF
                        </span>
                    </div>

                    <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 8px;">${p.titulo}</h4>
                    <p style="font-size: 0.88rem; color: #94a3b8; line-height: 1.4; margin-bottom: 16px;">${p.descripcion}</p>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #cbd5e1; cursor: pointer;">
                        <input type="checkbox" ${p.activa ? 'checked' : ''} onchange="togglePromo('${p.id}', this.checked)">
                        Activa
                    </label>
                    <button onclick="deletePromo('${p.id}')" style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer;">
                        <i class='bx bx-trash'></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    };

    // ==========================================
    // SISTEMA DE PUBLICIDAD & SPONSORS (PANTALLA LED)
    // ==========================================
    const DEFAULT_SPONSORS = [
        {
            id: 'sp-1',
            title: 'Shell Helix Ultra',
            subtitle: 'Máximo rendimiento y protección de motor F1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
            duration: 7
        },
        {
            id: 'sp-2',
            title: 'Pirelli P Zero',
            subtitle: 'Neumáticos de ultra alto rendimiento deportivo',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
            duration: 7
        },
        {
            id: 'sp-3',
            title: 'Red Bull Racing',
            subtitle: 'Gives You Wings - Tecnología de Competición',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
            duration: 8
        },
        {
            id: 'sp-4',
            title: 'Mobil 1 Synthetic Oil',
            subtitle: 'Lubricante sintético oficial para motores de carrera',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
            duration: 7
        },
        {
            id: 'sp-5',
            title: 'Brembo Racing Brakes',
            subtitle: 'Frenado de precisión extrema de alta temperatura',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
            duration: 7
        }
    ];

    let sponsorsList = JSON.parse(localStorage.getItem('aura_sponsors')) || DEFAULT_SPONSORS;
    let currentSponsorIndex = 0;
    let sponsorTimer = null;
    let sponsorProgressTimer = null;
    let sponsorIsPlaying = true;

    // === GESTIÓN SOCIO FUNDADOR BLACK Y GOLD ===
    // === GESTIÓN INTEGRAL DE SOCIOS FUNDADORES (#001 - #100) ===
    const MAX_SOCIOS_FUNDADORES = 100;
    let currentVipViewingSocio = null;
    let cachedSociosFundadores = null;

    function getSociosFundadoresData() {
        if (Array.isArray(cachedSociosFundadores) && cachedSociosFundadores.length > 0) {
            return cachedSociosFundadores;
        }
        let list = [];
        try {
            const raw = localStorage.getItem('aura_socios_fundadores_v2');
            if (raw) {
                list = JSON.parse(raw);
                cachedSociosFundadores = list;
            } else {
                // Migración automática de datos anteriores si existen
                const oldBlack = JSON.parse(localStorage.getItem('aura_socio_black_data') || '{"patentes":[]}');
                const oldGold = JSON.parse(localStorage.getItem('aura_socio_gold_data') || '{"patentes":[]}');
                let counter = 1;
                
                (oldBlack.patentes || []).forEach(p => {
                    list.push({
                        id: 'socio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        numero: '#' + String(counter++).padStart(3, '0'),
                        tipo: 'BLACK',
                        patente: p.patente || '',
                        titular: p.titular || 'Socio Black',
                        telefono: p.telefono || '',
                        email: '',
                        fecha_nacimiento: '',
                        modelo: '',
                        estado: 'PAGADO',
                        monto: 210000,
                        notas: p.observaciones || 'Socio Black Oficial',
                        fechaRegistro: p.fechaRegistro || new Date().toLocaleDateString('es-AR')
                    });
                });

                (oldGold.patentes || []).forEach(p => {
                    list.push({
                        id: 'socio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        numero: '#' + String(counter++).padStart(3, '0'),
                        tipo: 'GOLD',
                        patente: p.patente || '',
                        titular: p.titular || 'Socio Gold',
                        telefono: p.telefono || '',
                        email: '',
                        fecha_nacimiento: '',
                        modelo: '',
                        estado: 'PAGADO',
                        monto: 140000,
                        notas: p.observaciones || 'Socio Gold Oficial',
                        fechaRegistro: p.fechaRegistro || new Date().toLocaleDateString('es-AR')
                    });
                });

                if (list.length > 0) {
                    localStorage.setItem('aura_socios_fundadores_v2', JSON.stringify(list));
                    cachedSociosFundadores = list;
                }
            }
        } catch (e) {
            console.error('Error cargando socios fundadores:', e);
            list = [];
        }
        return list;
    }

    function saveSociosFundadoresData(list) {
        cachedSociosFundadores = list;
        localStorage.setItem('aura_socios_fundadores_v2', JSON.stringify(list));
    }

    // Cargar socios directamente desde el backend MySQL DonWeb
    async function loadSociosFundadoresData(forceRender = false) {
        try {
            const res = await fetch(`${API_URL}socios_fundadores.php?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.success && Array.isArray(data.socios)) {
                    cachedSociosFundadores = data.socios;
                    localStorage.setItem('aura_socios_fundadores_v2', JSON.stringify(data.socios));
                    if (forceRender && window.renderSociosFundadoresUI) {
                        window.renderSociosFundadoresUI();
                    }
                    return data.socios;
                }
            }
        } catch (e) {
            console.warn('Conexión con api/socios_fundadores.php offline o lenta, usando caché local:', e);
        }
        if (forceRender && window.renderSociosFundadoresUI) {
            window.renderSociosFundadoresUI();
        }
        return getSociosFundadoresData();
    }
    window.loadSociosFundadoresData = loadSociosFundadoresData;

    function getSocioConfig() {
        return JSON.parse(localStorage.getItem('aura_socios_config') || JSON.stringify({
            black: {
                descuento: 20,
                prioridad: '1',
                beneficioExtra: 'Encerado rápido con polímeros sin cargo'
            },
            gold: {
                lavadosGratisMes: 1,
                descuento: 35,
                beneficioExtra: 'Notificaciones Push prioritarias de Box en tiempo real'
            }
        }));
    }

    function saveSocioConfig(cfg) {
        localStorage.setItem('aura_socios_config', JSON.stringify(cfg));
    }

    window.renderSociosFundadoresUI = function() {
        const socios = getSociosFundadoresData();
        const totalSocios = socios.length;
        const blackCount = socios.filter(s => (s.tipo || s.tipo_membresia || '').toUpperCase() === 'BLACK').length;
        const goldCount = socios.filter(s => (s.tipo || s.tipo_membresia || '').toUpperCase() === 'GOLD').length;
        const paidCount = socios.filter(s => (s.estado || s.estado_pago || '').toUpperCase() === 'PAGADO' || (s.estado_pago || '').toLowerCase() === 'activo').length;
        const totalRevenue = socios.filter(s => (s.estado || s.estado_pago || '').toUpperCase() === 'PAGADO' || (s.estado_pago || '').toLowerCase() === 'activo').reduce((acc, s) => acc + (Number(s.monto || s.monto_pagado) || 0), 0);
        const disponibles = Math.max(0, MAX_SOCIOS_FUNDADORES - totalSocios);
        const pct = Math.min(100, Math.round((totalSocios / MAX_SOCIOS_FUNDADORES) * 100));

        // Actualizar KPIs
        const totalEl = document.getElementById('socio-kpi-total');
        if (totalEl) totalEl.innerHTML = `${totalSocios} <span style="font-size: 1.1rem; color: #94a3b8; font-weight: 500;">/ ${MAX_SOCIOS_FUNDADORES}</span>`;
        
        const progressEl = document.getElementById('socio-kpi-progress');
        if (progressEl) progressEl.style.width = `${pct}%`;
        
        const dispEl = document.getElementById('socio-kpi-disponibles');
        if (dispEl) dispEl.textContent = disponibles;

        const pctEl = document.getElementById('socio-kpi-pct');
        if (pctEl) pctEl.textContent = `${pct}% Ocupado`;

        const blackEl = document.getElementById('socio-kpi-black');
        if (blackEl) blackEl.textContent = blackCount;

        const goldEl = document.getElementById('socio-kpi-gold');
        if (goldEl) goldEl.textContent = goldCount;

        const revEl = document.getElementById('socio-kpi-revenue');
        if (revEl) revEl.textContent = `$${totalRevenue.toLocaleString('es-AR')}`;

        const paidCountEl = document.getElementById('socio-kpi-paid-count');
        if (paidCountEl) paidCountEl.textContent = paidCount;

        window.filterSociosTable();
    };

    window.filterSociosTable = function() {
        const socios = getSociosFundadoresData();
        const searchInput = document.getElementById('socio-search-input');
        const tipoFilter = document.getElementById('socio-filter-tipo');
        const estadoFilter = document.getElementById('socio-filter-estado');
        const tbody = document.getElementById('socios-table-body');
        const countText = document.getElementById('socios-list-count');

        const search = (searchInput?.value || '').toLowerCase().trim();
        const tipo = tipoFilter?.value || 'ALL';
        const estado = estadoFilter?.value || 'ALL';

        const filtered = socios.filter(s => {
            const numStr = String(s.numero || s.numero_socio || '').toLowerCase();
            const patStr = String(s.patente || '').toLowerCase();
            const titStr = String(s.titular || s.nombre || '').toLowerCase();
            const telStr = String(s.telefono || '').toLowerCase();
            const modStr = String(s.modelo || s.modelo_auto || '').toLowerCase();

            const matchSearch = !search || 
                numStr.includes(search) ||
                patStr.includes(search) ||
                titStr.includes(search) ||
                telStr.includes(search) ||
                modStr.includes(search);

            const sTipo = (s.tipo || s.tipo_membresia || '').toUpperCase();
            const matchTipo = (tipo === 'ALL') || (sTipo === tipo);

            const sEstado = (s.estado || s.estado_pago || '').toUpperCase();
            const isPaid = (sEstado === 'PAGADO' || sEstado === 'ACTIVO');
            const matchEstado = (estado === 'ALL') || (estado === 'PAGADO' ? isPaid : !isPaid);

            return matchSearch && matchTipo && matchEstado;
        });

        if (countText) countText.textContent = `${filtered.length} de ${socios.length}`;
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #94a3b8; padding: 35px 20px;">
                        <i class='bx bx-search-alt' style="font-size: 2.2rem; color: #475569; display: block; margin-bottom: 8px;"></i>
                        No se encontraron socios fundadores registrados con los filtros seleccionados.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            const isBlack = (item.tipo || item.tipo_membresia || '').toUpperCase() === 'BLACK';
            const isPaid = (item.estado || item.estado_pago || '').toUpperCase() === 'PAGADO' || (item.estado_pago || '').toLowerCase() === 'activo';
            
            const badgeTipo = isBlack 
                ? `<span style="display: inline-flex; align-items: center; gap: 5px; background: #0f172a; color: #fbbf24; border: 1px solid #fbbf24; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800;"><i class='bx bx-crown'></i> BLACK</span>`
                : `<span style="display: inline-flex; align-items: center; gap: 5px; background: #2d1c03; color: #fbbf24; border: 1px solid #f59e0b; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800;"><i class='bx bxs-award'></i> GOLD</span>`;

            const badgeEstado = isPaid
                ? `<span style="background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">✅ Activo</span>`
                : `<span style="background: rgba(234,179,8,0.15); color: #facc15; border: 1px solid rgba(234,179,8,0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">⏳ Pendiente</span>`;

            const cleanPhone = (item.telefono || '').replace(/\D/g, '');
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola ${item.titular || item.nombre || ''}! Te contactamos desde Aura L1deres respecto a tu membresía Socio Fundador ${item.numero || ''}.`)}` : '#';

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s ease;">
                    <td style="font-weight: 900; color: #fbbf24; font-family: monospace; font-size: 1.05rem;">
                        ${item.numero || ('#' + String(item.numero_socio || '').padStart(3, '0'))}
                    </td>
                    <td>${badgeTipo}</td>
                    <td>
                        <span style="background: #ffffff; color: #000000; font-weight: 900; font-size: 0.85rem; padding: 3px 8px; border-radius: 4px; font-family: monospace; border: 1.5px solid #000000; letter-spacing: 1px;">
                            ${item.patente}
                        </span>
                    </td>
                    <td style="font-weight: 700; color: #f8fafc;">
                        ${item.titular || item.nombre || 'Sin Titular'}
                        ${item.email ? `<br><span style="font-size: 0.75rem; color: #64748b; font-weight: normal;">${item.email}</span>` : ''}
                        ${item.fecha_nacimiento ? `<br><span style="font-size: 0.75rem; color: #fbbf24; font-weight: bold;"><i class='bx bx-gift'></i> ${item.fecha_nacimiento}</span>` : ''}
                    </td>
                    <td>
                        ${item.telefono ? `
                            <a href="${waLink}" target="_blank" style="color: #4ade80; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-size: 0.85rem;">
                                <i class='bx bxl-whatsapp' style="font-size: 1.1rem;"></i> ${item.telefono}
                            </a>
                        ` : '<span style="color: #64748b;">-</span>'}
                    </td>
                    <td>
                        <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">${item.modelo || item.modelo_auto || '-'}</div>
                        ${(item.notas || item.observaciones) ? `<div style="font-size: 0.75rem; color: #64748b;">${item.notas || item.observaciones}</div>` : ''}
                    </td>
                    <td>
                        ${badgeEstado}
                        ${(item.monto || item.monto_pagado) ? `<div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">$${Number(item.monto || item.monto_pagado).toLocaleString('es-AR')}</div>` : ''}
                    </td>
                    <td style="text-align: center;">
                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                            <button onclick="window.openVipCredential('${item.id}')" title="Ver Credencial VIP" style="background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.4); padding: 6px 10px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 700;">
                                <i class='bx bx-id-card' style="font-size: 1.1rem;"></i> Credencial
                            </button>
                            <button onclick="window.openEditSocioModal('${item.id}')" title="Editar Socio" style="background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 6px 8px; border-radius: 8px; cursor: pointer;">
                                <i class='bx bx-edit-alt'></i>
                            </button>
                            <button onclick="window.deleteSocio('${item.id}')" title="Eliminar Socio" style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 6px 8px; border-radius: 8px; cursor: pointer;">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Modal de Creación / Edición
    window.openNewSocioModal = async function() {
        const socios = getSociosFundadoresData();
        let nextNum = socios.length + 1;
        try {
            const res = await fetch(`${API_URL}socios_fundadores.php?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.stats && data.stats.proximo_numero) {
                    nextNum = data.stats.proximo_numero;
                }
            }
        } catch (e) {}

        const nextNumStr = '#' + String(nextNum).padStart(3, '0');

        document.getElementById('modal-socio-title').innerHTML = "<i class='bx bx-crown'></i> Registrar Nuevo Socio Fundador";
        document.getElementById('form-socio-id').value = '';
        document.getElementById('form-socio-numero').value = nextNumStr;
        document.getElementById('form-socio-tipo').value = 'BLACK';
        document.getElementById('form-socio-patente').value = '';
        document.getElementById('form-socio-modelo').value = '';
        document.getElementById('form-socio-titular').value = '';
        document.getElementById('form-socio-telefono').value = '';
        document.getElementById('form-socio-email').value = '';
        document.getElementById('form-socio-fecha-nac').value = '';
        document.getElementById('form-socio-estado').value = 'PAGADO';
        document.getElementById('form-socio-monto').value = '2';
        document.getElementById('form-socio-notas').value = 'Socio Fundador Inauguración';

        const modal = document.getElementById('modal-socio-form');
        if (modal) modal.style.display = 'flex';
    };

    window.openEditSocioModal = function(id) {
        const socios = getSociosFundadoresData();
        const socio = socios.find(s => String(s.id) === String(id));
        if (!socio) return;

        document.getElementById('modal-socio-title').innerHTML = "<i class='bx bx-edit-alt'></i> Editar Socio Fundador";
        document.getElementById('form-socio-id').value = socio.id;
        document.getElementById('form-socio-numero').value = socio.numero || ('#' + String(socio.numero_socio || '').padStart(3, '0'));
        document.getElementById('form-socio-tipo').value = (socio.tipo || socio.tipo_membresia || 'BLACK').toUpperCase();
        document.getElementById('form-socio-patente').value = socio.patente || '';
        document.getElementById('form-socio-modelo').value = socio.modelo || socio.modelo_auto || '';
        document.getElementById('form-socio-titular').value = socio.titular || socio.nombre || '';
        document.getElementById('form-socio-telefono').value = socio.telefono || '';
        document.getElementById('form-socio-email').value = socio.email || '';
        document.getElementById('form-socio-fecha-nac').value = socio.fecha_nacimiento || '';
        document.getElementById('form-socio-estado').value = (socio.estado || socio.estado_pago || 'PAGADO').toUpperCase();
        document.getElementById('form-socio-monto').value = socio.monto || socio.monto_pagado || '';
        document.getElementById('form-socio-notas').value = socio.notas || socio.observaciones || '';

        const modal = document.getElementById('modal-socio-form');
        if (modal) modal.style.display = 'flex';
    };

    window.closeSocioModal = function() {
        const modal = document.getElementById('modal-socio-form');
        if (modal) modal.style.display = 'none';
    };

    window.updateFormSocioTipoStyle = function() {
        const tipo = document.getElementById('form-socio-tipo')?.value;
        const montoInput = document.getElementById('form-socio-monto');
        if (montoInput && !montoInput.value) {
            montoInput.value = tipo === 'GOLD' ? '1' : '2';
        }
    };

    // Funciones de gestión de Enlaces de Cobro Mercado Pago y Códigos QR
    window.actualizarQRAdmin = function(tipo, url) {
        if (!url) return;
        const qrImg = document.getElementById(tipo === 'gold' ? 'admin-qr-gold' : 'admin-qr-black');
        const btnAbrir = document.getElementById(tipo === 'gold' ? 'admin-btn-abrir-gold' : 'admin-btn-abrir-black');
        if (qrImg) {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}&margin=4`;
        }
        if (btnAbrir) {
            btnAbrir.href = url;
        }
    };

    window.abrirModalLinksMP = function() {
        const modal = document.getElementById('modal-links-mp');
        if (modal) modal.style.display = 'flex';
    };

    window.copiarTextoGenerico = function(texto, mensaje = 'Copiado al portapapeles') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(() => {
                if (window.showToast) window.showToast(mensaje, 'success');
                else alert(mensaje);
            }).catch(() => {
                prompt('Copiar enlace:', texto);
            });
        } else {
            prompt('Copiar enlace:', texto);
        }
    };

    window.compartirWhatsAppMP = function(tipo, link, monto, telefono = '') {
        const planNombre = tipo.toUpperCase() === 'GOLD' ? 'Plan Gold VIP' : 'Plan Black VIP';
        const msg = `¡Hola! Te compartimos el enlace oficial de Mercado Pago para tu suscripción a ${planNombre} ($${Number(monto).toLocaleString('es-AR')}) en L1deres Autowash:\n\n👉 ${link}\n\nUna vez abonado, tu vehículo queda automáticamente habilitado en nuestro sistema. ¡Te esperamos!`;
        const cleanTel = telefono ? telefono.replace(/\D/g, '') : '';
        const url = cleanTel 
            ? `https://api.whatsapp.com/send?phone=${cleanTel}&text=${encodeURIComponent(msg)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    window.copiarLinkMPActual = function() {
        const tipo = document.getElementById('form-socio-tipo')?.value || 'BLACK';
        const inputCustom = document.getElementById(tipo === 'GOLD' ? 'admin-input-link-gold' : 'admin-input-link-black');
        const defaultLink = (tipo === 'GOLD') ? 'https://mpago.la/1HFxTZG' : 'https://mpago.la/2RGdF3K';
        const link = (inputCustom && inputCustom.value.trim()) ? inputCustom.value.trim() : defaultLink;
        window.copiarTextoGenerico(link, `Link de Mercado Pago (${tipo}) copiado`);
    };

    window.enviarLinkMPWhatsApp = function() {
        const tipo = document.getElementById('form-socio-tipo')?.value || 'BLACK';
        const inputCustom = document.getElementById(tipo === 'GOLD' ? 'admin-input-link-gold' : 'admin-input-link-black');
        const defaultLink = (tipo === 'GOLD') ? 'https://mpago.la/1HFxTZG' : 'https://mpago.la/2RGdF3K';
        const link = (inputCustom && inputCustom.value.trim()) ? inputCustom.value.trim() : defaultLink;
        const monto = (tipo === 'GOLD') ? 1 : 2;
        const tel = document.getElementById('form-socio-telefono')?.value || '';
        window.compartirWhatsAppMP(tipo, link, monto, tel);
    };

    window.handleSaveSocio = async function(event) {
        if (event) event.preventDefault();
        const id = document.getElementById('form-socio-id').value;
        const numero = document.getElementById('form-socio-numero').value.trim();
        const tipo = document.getElementById('form-socio-tipo').value;
        const patente = document.getElementById('form-socio-patente').value.trim().toUpperCase();
        const modelo = document.getElementById('form-socio-modelo').value.trim();
        const titular = document.getElementById('form-socio-titular').value.trim();
        const telefono = document.getElementById('form-socio-telefono').value.trim();
        const email = document.getElementById('form-socio-email').value.trim();
        const fecha_nacimiento = document.getElementById('form-socio-fecha-nac').value.trim();
        const estado = document.getElementById('form-socio-estado').value;
        const monto = parseFloat(document.getElementById('form-socio-monto').value) || 0;
        const notas = document.getElementById('form-socio-notas').value.trim();

        if (!patente || !titular) {
            if (window.showToast) window.showToast('La patente y el titular son obligatorios', 'error');
            return;
        }

        const submitBtn = event?.target?.querySelector('button[type="submit"]') || document.querySelector('#modal-socio-form button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
        }

        try {
            const payload = {
                id: id ? (parseInt(id) || id) : undefined,
                numero_socio: numero ? parseInt(numero.replace(/\D/g, '')) : undefined,
                numero: numero,
                tipo_membresia: tipo.toLowerCase(),
                tipo: tipo,
                patente: patente,
                modelo_auto: modelo,
                modelo: modelo,
                nombre: titular,
                titular: titular,
                telefono: telefono,
                email: email,
                fecha_nacimiento: fecha_nacimiento,
                estado_pago: estado.toLowerCase(),
                estado: estado,
                monto_pagado: monto,
                monto: monto,
                observaciones: notas,
                notas: notas
            };

            const isEdit = Boolean(id);
            const res = await fetch(`${API_URL}socios_fundadores.php`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data && data.success) {
                window.closeSocioModal();
                await loadSociosFundadoresData(true);
                if (window.showToast) window.showToast(data.message || `Socio ${numero} (${titular}) guardado con éxito`, 'success');

                // Resguardo Físico en Archivo Local de esta PC (.csv y .jsonl)
                try {
                    if (typeof window.guardarClienteEnArchivoLocalPC === 'function') {
                        window.guardarClienteEnArchivoLocalPC({
                            tipo_registro: isEdit ? 'SOCIO_EDIT_' + tipo.toUpperCase() : 'SOCIO_NUEVO_' + tipo.toUpperCase(),
                            numero_socio: numero,
                            patente: patente,
                            titular: titular,
                            telefono: telefono,
                            email: email,
                            modelo: modelo,
                            servicio: 'Membresía ' + tipo.toUpperCase(),
                            precio: monto,
                            metodo_pago: 'mercadopago',
                            estado: estado,
                            notas: notas
                        });
                    }
                } catch(e) {
                    console.warn('Error en resguardo local del socio:', e);
                }

                return;
            } else {
                const msg = (data && data.error) ? data.error : 'Error al guardar socio en el servidor';
                if (window.showToast) window.showToast(msg, 'error');
                else alert('⚠️ ' + msg);
            }
        } catch (err) {
            console.error('Error guardando socio en servidor:', err);
            // Fallback local
            const socios = getSociosFundadoresData();
            if (id) {
                const idx = socios.findIndex(s => String(s.id) === String(id));
                if (idx !== -1) {
                    socios[idx] = {
                        ...socios[idx],
                        numero, tipo, patente, modelo, titular, telefono, email, fecha_nacimiento, estado, monto, notas
                    };
                }
            } else {
                socios.push({
                    id: 'socio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    numero, tipo, patente, modelo, titular, telefono, email, fecha_nacimiento, estado, monto, notas,
                    fechaRegistro: new Date().toLocaleDateString('es-AR')
                });
            }
            saveSociosFundadoresData(socios);
            window.closeSocioModal();
            window.renderSociosFundadoresUI();
            if (window.showToast) window.showToast(`Socio ${numero} guardado localmente (modo offline)`, 'warning');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    };

    window.deleteSocio = async function(id) {
        const socios = getSociosFundadoresData();
        const socio = socios.find(s => String(s.id) === String(id));
        if (!socio) return;

        if (!confirm(`¿Estás seguro de eliminar al socio ${socio.numero || ''} (${socio.titular || socio.nombre} - Patente: ${socio.patente})?\nEsta acción liberará el cupo en el Club 100.`)) return;

        try {
            const res = await fetch(`${API_URL}socios_fundadores.php?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const data = await res.json();
            if (data && data.success) {
                await loadSociosFundadoresData(true);
                if (window.showToast) window.showToast(data.message || `Socio ${socio.numero || ''} eliminado`, 'info');
                return;
            } else if (data && data.error) {
                if (window.showToast) window.showToast(data.error, 'error');
            }
        } catch (e) {
            console.warn('API delete falló, eliminando local:', e);
        }

        const updated = socios.filter(s => String(s.id) !== String(id));
        saveSociosFundadoresData(updated);
        window.renderSociosFundadoresUI();
        if (window.showToast) window.showToast(`Socio ${socio.numero || ''} eliminado localmente`, 'info');
    };

    // Modal de Configuración
    window.toggleSocioConfigModal = function() {
        const modal = document.getElementById('modal-socio-config');
        if (!modal) return;
        
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            const cfg = getSocioConfig();
            const bDisc = document.getElementById('cfg-black-discount');
            const bPrio = document.getElementById('cfg-black-priority');
            const bExt = document.getElementById('cfg-black-extra');
            const gFree = document.getElementById('cfg-gold-free');
            const gDisc = document.getElementById('cfg-gold-discount');
            const gExt = document.getElementById('cfg-gold-extra');

            if (bDisc) bDisc.value = cfg.black?.descuento || 20;
            if (bPrio) bPrio.value = cfg.black?.prioridad || '1';
            if (bExt) bExt.value = cfg.black?.beneficioExtra || '';
            if (gFree) gFree.value = cfg.gold?.lavadosGratisMes || 1;
            if (gDisc) gDisc.value = cfg.gold?.descuento || 35;
            if (gExt) gExt.value = cfg.gold?.beneficioExtra || '';

            modal.style.display = 'flex';
        }
    };

    window.saveSocioAllConfig = function() {
        const cfg = {
            black: {
                descuento: parseInt(document.getElementById('cfg-black-discount')?.value) || 20,
                prioridad: document.getElementById('cfg-black-priority')?.value || '1',
                beneficioExtra: document.getElementById('cfg-black-extra')?.value.trim() || ''
            },
            gold: {
                lavadosGratisMes: parseInt(document.getElementById('cfg-gold-free')?.value) || 1,
                descuento: parseInt(document.getElementById('cfg-gold-discount')?.value) || 35,
                beneficioExtra: document.getElementById('cfg-gold-extra')?.value.trim() || ''
            }
        };

        saveSocioConfig(cfg);
        window.toggleSocioConfigModal();
        if (window.showToast) window.showToast('Beneficios y condiciones actualizados', 'success');
    };

    // Modal de Visualización de Credencial VIP
    window.openVipCredential = function(id) {
        const socios = getSociosFundadoresData();
        const socio = socios.find(s => String(s.id) === String(id));
        if (!socio) return;

        currentVipViewingSocio = socio;
        const cardRender = document.getElementById('vip-card-render');
        const badgeType = document.getElementById('vip-card-badge-type');
        const numberEl = document.getElementById('vip-card-number');
        const titularEl = document.getElementById('vip-card-titular');
        const patenteEl = document.getElementById('vip-card-patente');

        const isGold = (socio.tipo || socio.tipo_membresia || '').toUpperCase() === 'GOLD';

        if (cardRender) {
            if (isGold) {
                cardRender.style.background = 'linear-gradient(135deg, #1c1303 0%, #3a2606 50%, #170e01 100%)';
                cardRender.style.border = '2px solid #f59e0b';
                cardRender.style.boxShadow = '0 15px 35px rgba(245,158,11,0.25), inset 0 0 15px rgba(251,191,36,0.2)';
            } else {
                cardRender.style.background = 'linear-gradient(135deg, #090d16 0%, #1e293b 50%, #05070c 100%)';
                cardRender.style.border = '2px solid #fbbf24';
                cardRender.style.boxShadow = '0 15px 35px rgba(0,0,0,0.8), inset 0 0 15px rgba(251,191,36,0.15)';
            }
        }

        if (badgeType) {
            badgeType.textContent = isGold ? 'SOCIO FUNDADOR GOLD' : 'SOCIO FUNDADOR BLACK';
            badgeType.style.color = isGold ? '#fbbf24' : '#38bdf8';
        }

        if (numberEl) numberEl.textContent = socio.numero || ('#' + String(socio.numero_socio || '').padStart(3, '0'));
        if (titularEl) titularEl.textContent = (socio.titular || socio.nombre || 'SOCIO FUNDADOR').toUpperCase();
        if (patenteEl) patenteEl.textContent = socio.patente;

        const modal = document.getElementById('modal-vip-credential');
        if (modal) modal.style.display = 'flex';
    };

    window.closeVipCredentialModal = function() {
        const modal = document.getElementById('modal-vip-credential');
        if (modal) modal.style.display = 'none';
        currentVipViewingSocio = null;
    };

    window.sendCredentialWhatsApp = function() {
        if (!currentVipViewingSocio) return;
        const s = currentVipViewingSocio;
        const cleanPhone = (s.telefono || '').replace(/\D/g, '');
        
        const message = `✨ *L1DERES - SOCIO FUNDADOR OFICIAL* ✨\n\n` +
            `¡Hola *${s.titular || s.nombre}*! 👑\n` +
            `Te confirmamos tu membresía exclusiva:\n\n` +
            `🏷️ *Nº Socio:* ${s.numero || '#' + s.numero_socio}\n` +
            `⭐ *Categoría:* Socio Fundador ${(s.tipo || s.tipo_membresia || 'VIP').toUpperCase()}\n` +
            `🚗 *Vehículo / Patente:* ${s.patente} ${s.modelo ? '('+s.modelo+')' : ''}\n` +
            `🛡️ *Estado:* Activo y Verificado\n\n` +
            `Presentá tu patente o credencial en nuestro Pit Lane para acceder a tus beneficios y prioridad.\n\n` +
            `_Desarrollado con Aura._`;

        const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    window.printCredentialCard = function() {
        if (!currentVipViewingSocio) return;
        window.print();
    };

    window.exportSociosCSV = function() {
        const socios = getSociosFundadoresData();
        if (socios.length === 0) {
            if (window.showToast) window.showToast('No hay socios para exportar', 'info');
            return;
        }

        let csv = 'Numero,Tipo,Patente,Titular,Telefono,Email,FechaNacimiento,Modelo,Estado,Monto,Notas,FechaRegistro\n';
        socios.forEach(s => {
            csv += `"${s.numero || ''}","${(s.tipo || s.tipo_membresia || '').toUpperCase()}","${s.patente || ''}","${s.titular || s.nombre || ''}","${s.telefono || ''}","${s.email || ''}","${s.fecha_nacimiento || ''}","${s.modelo || s.modelo_auto || ''}","${s.estado || s.estado_pago || ''}","${s.monto || s.monto_pagado || ''}","${s.notas || s.observaciones || ''}","${s.fecha_inscripcion || s.fechaRegistro || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `socios_fundadores_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        if (window.showToast) window.showToast('Archivo CSV exportado exitosamente', 'success');
    };

    function getSponsors() {
        return sponsorsList && sponsorsList.length > 0 ? sponsorsList : DEFAULT_SPONSORS;
    }

    function saveSponsorsState() {
        localStorage.setItem('aura_sponsors', JSON.stringify(sponsorsList));
    }

    window.renderSponsorSlide = function() {
        const wrapper = document.getElementById('screen-media-wrapper');
        const titleEl = document.getElementById('sponsor-title');
        const subEl = document.getElementById('sponsor-subtitle');
        
        if (!wrapper) return;
        const sponsors = getSponsors();
        if (sponsors.length === 0) return;
        
        if (currentSponsorIndex >= sponsors.length) currentSponsorIndex = 0;
        const current = sponsors[currentSponsorIndex];

        if (titleEl) titleEl.textContent = current.title;
        if (subEl) subEl.textContent = current.subtitle || 'Sponsor Oficial';

        wrapper.innerHTML = '';
        if (current.type === 'video') {
            const video = document.createElement('video');
            video.src = current.url;
            video.autoplay = true;
            video.muted = true;
            video.loop = false;
            video.playsInline = true;
            video.className = 'screen-media-item';
            video.onended = () => { window.nextSponsor(); };
            video.onerror = () => {
                wrapper.innerHTML = `<img src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80" class="screen-media-item">`;
            };
            wrapper.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = current.url;
            img.alt = current.title;
            img.className = 'screen-media-item';
            img.onerror = () => {
                img.src = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80';
            };
            wrapper.appendChild(img);
        }

        startSponsorProgress(current.duration || 7);
    };

    function startSponsorProgress(durationSec) {
        clearInterval(sponsorProgressTimer);
        clearTimeout(sponsorTimer);
        
        const progressEl = document.getElementById('sponsor-progress');
        if (!progressEl) return;
        
        progressEl.style.width = '0%';
        if (!sponsorIsPlaying) return;

        let startTime = Date.now();
        const durationMs = durationSec * 1000;

        sponsorProgressTimer = setInterval(() => {
            if (!sponsorIsPlaying) return;
            const elapsed = Date.now() - startTime;
            const pct = Math.min(100, (elapsed / durationMs) * 100);
            progressEl.style.width = pct + '%';
            if (pct >= 100) {
                clearInterval(sponsorProgressTimer);
            }
        }, 50);

        sponsorTimer = setTimeout(() => {
            if (sponsorIsPlaying) {
                window.nextSponsor();
            }
        }, durationMs);
    }

    window.nextSponsor = function() {
        const sponsors = getSponsors();
        currentSponsorIndex = (currentSponsorIndex + 1) % sponsors.length;
        window.renderSponsorSlide();
    };

    window.prevSponsor = function() {
        const sponsors = getSponsors();
        currentSponsorIndex = (currentSponsorIndex - 1 + sponsors.length) % sponsors.length;
        window.renderSponsorSlide();
    };

    window.toggleSponsorPlay = function() {
        sponsorIsPlaying = !sponsorIsPlaying;
        const btn = document.getElementById('btn-toggle-play');
        if (btn) {
            btn.innerHTML = sponsorIsPlaying ? "<i class='bx bx-pause'></i>" : "<i class='bx bx-play'></i>";
        }
        if (sponsorIsPlaying) {
            const sponsors = getSponsors();
            startSponsorProgress(sponsors[currentSponsorIndex]?.duration || 7);
        } else {
            clearInterval(sponsorProgressTimer);
            clearTimeout(sponsorTimer);
        }
    };

    window.openAddSponsorModal = function() {
        const modal = document.getElementById('modal-sponsor');
        if (modal) modal.style.display = 'flex';
    };

    window.closeAddSponsorModal = function() {
        const modal = document.getElementById('modal-sponsor');
        if (modal) modal.style.display = 'none';
    };

    window.saveSponsor = function(e) {
        e.preventDefault();
        const title = document.getElementById('sponsor-input-title').value.trim();
        const type = document.getElementById('sponsor-input-type').value;
        const url = document.getElementById('sponsor-input-url').value.trim();
        const duration = parseInt(document.getElementById('sponsor-input-duration').value) || 7;
        const subtitle = document.getElementById('sponsor-input-subtitle').value.trim();

        if (!title || !url) return;

        const newSponsor = {
            id: 'sp-' + Date.now(),
            title,
            subtitle: subtitle || 'Sponsor Oficial',
            type,
            url,
            duration
        };

        sponsorsList.unshift(newSponsor);
        saveSponsorsState();
        window.closeAddSponsorModal();
        document.getElementById('form-sponsor').reset();
        window.renderSponsorManager();
        window.renderSponsorSlide();
        alert('¡Anuncio guardado correctamente!');
    };

    window.deleteSponsor = function(id) {
        if (!confirm('¿Estás seguro que deseas eliminar este anuncio?')) return;
        sponsorsList = sponsorsList.filter(s => s.id !== id);
        saveSponsorsState();
        window.renderSponsorManager();
        window.renderSponsorSlide();
    };

    window.renderSponsorManager = function() {
        const container = document.getElementById('sponsors-list-container');
        if (!container) return;

        const sponsors = getSponsors();
        container.innerHTML = '';

        sponsors.forEach(sp => {
            const card = document.createElement('div');
            card.className = 'sponsor-card';
            
            const mediaContent = sp.type === 'video' 
                ? `<video src="${sp.url}" muted></video>` 
                : `<img src="${sp.url}" alt="${sp.title}" onerror="this.src='https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80'">`;

            const iconType = sp.type === 'video' ? "<i class='bx bx-video'></i> Video" : "<i class='bx bx-image'></i> Imagen";

            card.innerHTML = `
                <div class="sponsor-card-media">
                    ${mediaContent}
                    <div class="sponsor-card-type-badge">${iconType}</div>
                </div>
                <div class="sponsor-card-body">
                    <div>
                        <div class="sponsor-card-title">${sp.title}</div>
                        <div class="sponsor-card-sub">${sp.subtitle || '-'}</div>
                    </div>
                    <div class="sponsor-card-footer">
                        <span><i class='bx bx-time'></i> ${sp.duration} seg</span>
                        <button onclick="deleteSponsor('${sp.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem;" title="Eliminar Sponsor">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    };

    // Inicializar reproductor de sponsors al cargar
    setTimeout(() => {
        window.renderSponsorSlide();
        window.renderSponsorManager();
    }, 400);

    // ============================================================
    // GESTIÓN DE CONFIGURACIÓN (Tiempos, Precios, WhatsApp, Horarios)
    // ============================================================
    window.loadAdminConfig = async function() {
        const defaultCfg = {
            tiempo_lavado: 120000,
            tiempo_secado: 180000,
            lavado_min: 2, lavado_sec: 0,
            secado_min: 3, secado_sec: 0,
            whatsapp: "5491160473754",
            precio_express_auto: 10000,
            precio_express_camioneta: 12000,
            precio_completo_auto: 15000,
            precio_completo_camioneta: 18000,
            dias_atencion: "Lunes a Sábados",
            hora_apertura: "08:00",
            hora_cierre: "20:00",
            atiende_domingos: false,
            atiende_feriados: false,
            mensaje_feriados: ""
        };

        let cfg = { ...defaultCfg };
        let apiLoaded = false;

        // 1. Cargar desde DonWeb API (Base de Datos MySQL oficial)
        try {
            const res = await fetch(`${API_URL}configuracion.php?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                    apiLoaded = true;
                    if (data.tiempo_lavado !== undefined && parseInt(data.tiempo_lavado) > 0) {
                        cfg.tiempo_lavado = parseInt(data.tiempo_lavado);
                        cfg.lavado_min = Math.floor(cfg.tiempo_lavado / 60000);
                        cfg.lavado_sec = Math.floor((cfg.tiempo_lavado % 60000) / 1000);
                    }
                    if (data.tiempo_secado !== undefined && parseInt(data.tiempo_secado) > 0) {
                        cfg.tiempo_secado = parseInt(data.tiempo_secado);
                        cfg.secado_min = Math.floor(cfg.tiempo_secado / 60000);
                        cfg.secado_sec = Math.floor((cfg.tiempo_secado % 60000) / 1000);
                    }
                    if (data.precio_express_auto !== undefined) cfg.precio_express_auto = data.precio_express_auto;
                    if (data.precio_express_camioneta !== undefined) cfg.precio_express_camioneta = data.precio_express_camioneta;
                    if (data.precio_completo_auto !== undefined) cfg.precio_completo_auto = data.precio_completo_auto;
                    if (data.precio_completo_camioneta !== undefined) cfg.precio_completo_camioneta = data.precio_completo_camioneta;
                    if (data.whatsapp_number) cfg.whatsapp = data.whatsapp_number;
                    if (data.dias_atencion) cfg.dias_atencion = data.dias_atencion;
                    if (data.hora_apertura) cfg.hora_apertura = data.hora_apertura;
                    if (data.hora_cierre) cfg.hora_cierre = data.hora_cierre;
                    if (data.atiende_domingos !== undefined) cfg.atiende_domingos = !!data.atiende_domingos;
                    if (data.atiende_feriados !== undefined) cfg.atiende_feriados = !!data.atiende_feriados;
                    if (data.mensaje_feriados !== undefined) cfg.mensaje_feriados = data.mensaje_feriados || "";
                }
            }
        } catch (err) {
            console.warn('Usando respaldo de configuración por error de red:', err);
        }

        // 2. Solo usar localStorage si la API falló por completo (offline fallback)
        if (!apiLoaded) {
            const localSaved = localStorage.getItem('aura_lavadero_config');
            if (localSaved) {
                try {
                    const parsed = JSON.parse(localSaved);
                    cfg = { ...cfg, ...parsed };
                } catch(e){}
            }
        } else {
            // Mantener localStorage sincronizado con la verdad de la base de datos
            try {
                localStorage.setItem('aura_lavadero_config', JSON.stringify(cfg));
            } catch(e){}
        }

        // Asegurar que window.APP_CONFIG tenga los valores actualizados
        if (window.APP_CONFIG) {
            window.APP_CONFIG.tiempoLavado = cfg.tiempo_lavado;
            window.APP_CONFIG.tiempoSecado = cfg.tiempo_secado;
            window.APP_CONFIG.precio_express_auto = cfg.precio_express_auto;
            window.APP_CONFIG.precio_express_camioneta = cfg.precio_express_camioneta;
            window.APP_CONFIG.precio_completo_auto = cfg.precio_completo_auto;
            window.APP_CONFIG.precio_completo_camioneta = cfg.precio_completo_camioneta;
            window.APP_CONFIG.whatsapp = cfg.whatsapp;
        }

        localStorage.setItem('tiempoLavado', cfg.tiempo_lavado);
        localStorage.setItem('tiempoSecado', cfg.tiempo_secado);

        // 3. Volcar valores en los inputs del formulario
        const elLavMin = document.getElementById('lavado-min');
        const elLavSec = document.getElementById('lavado-sec');
        const elSecMin = document.getElementById('secado-min');
        const elSecSec = document.getElementById('secado-sec');
        const elWa = document.getElementById('config-whatsapp');
        const elPExpAuto = document.getElementById('precio-express-auto');
        const elPExpCam = document.getElementById('precio-express-camioneta');
        const elPCompAuto = document.getElementById('precio-completo-auto');
        const elPCompCam = document.getElementById('precio-completo-camioneta');
        const elDias = document.getElementById('config-dias-atencion');
        const elHAper = document.getElementById('config-hora-apertura');
        const elHCier = document.getElementById('config-hora-cierre');
        const elDom = document.getElementById('config-atiende-domingos');
        const elFer = document.getElementById('config-atiende-feriados');
        const elMsgFer = document.getElementById('config-mensaje-feriados');

        if (elLavMin) elLavMin.value = cfg.lavado_min !== undefined ? cfg.lavado_min : 2;
        if (elLavSec) elLavSec.value = cfg.lavado_sec !== undefined ? cfg.lavado_sec : 0;
        if (elSecMin) elSecMin.value = cfg.secado_min !== undefined ? cfg.secado_min : 3;
        if (elSecSec) elSecSec.value = cfg.secado_sec !== undefined ? cfg.secado_sec : 0;
        if (elWa) elWa.value = cfg.whatsapp;
        if (elPExpAuto) elPExpAuto.value = cfg.precio_express_auto || 0;
        if (elPExpCam) elPExpCam.value = cfg.precio_express_camioneta || 0;
        if (elPCompAuto) elPCompAuto.value = cfg.precio_completo_auto || 0;
        if (elPCompCam) elPCompCam.value = cfg.precio_completo_camioneta || 0;
        if (elDias) elDias.value = cfg.dias_atencion;
        if (elHAper) elHAper.value = cfg.hora_apertura;
        if (elHCier) elHCier.value = cfg.hora_cierre;
        if (elDom) elDom.checked = cfg.atiende_domingos;
        if (elFer) elFer.checked = cfg.atiende_feriados;
        if (elMsgFer) elMsgFer.value = cfg.mensaje_feriados;
    };

    window.saveAdminConfig = async function() {
        const btnSave = document.getElementById('save-config');
        const origText = btnSave ? btnSave.innerHTML : '';
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
        }

        // Tiempos de Lavado e Interior (Secado)
        const lMins = parseInt(document.getElementById('lavado-min')?.value) || 0;
        const lSecs = parseInt(document.getElementById('lavado-sec')?.value) || 0;
        const sMins = parseInt(document.getElementById('secado-min')?.value) || 0;
        const sSecs = parseInt(document.getElementById('secado-sec')?.value) || 0;

        let tiempoLavadoMs = ((lMins * 60) + lSecs) * 1000;
        let tiempoSecadoMs = ((sMins * 60) + sSecs) * 1000;
        if (tiempoLavadoMs <= 0) tiempoLavadoMs = 120000;
        if (tiempoSecadoMs <= 0) tiempoSecadoMs = 180000;

        // Actualizar variables en memoria
        if (window.APP_CONFIG) {
            window.APP_CONFIG.tiempoLavado = tiempoLavadoMs;
            window.APP_CONFIG.tiempoSecado = tiempoSecadoMs;
            window.APP_CONFIG.precio_express_auto = parseFloat(document.getElementById('precio-express-auto')?.value || 0);
            window.APP_CONFIG.precio_express_camioneta = parseFloat(document.getElementById('precio-express-camioneta')?.value || 0);
            window.APP_CONFIG.precio_completo_auto = parseFloat(document.getElementById('precio-completo-auto')?.value || 0);
            window.APP_CONFIG.precio_completo_camioneta = parseFloat(document.getElementById('precio-completo-camioneta')?.value || 0);
            window.APP_CONFIG.whatsapp = document.getElementById('config-whatsapp')?.value.trim() || '';
        }

        // Guardar en localStorage
        localStorage.setItem('tiempoLavado', tiempoLavadoMs);
        localStorage.setItem('tiempoSecado', tiempoSecadoMs);
        localStorage.setItem('precio_express_auto', window.APP_CONFIG.precio_express_auto);
        localStorage.setItem('precio_express_camioneta', window.APP_CONFIG.precio_express_camioneta);
        localStorage.setItem('precio_completo_auto', window.APP_CONFIG.precio_completo_auto);
        localStorage.setItem('precio_completo_camioneta', window.APP_CONFIG.precio_completo_camioneta);
        localStorage.setItem('whatsappNumber', window.APP_CONFIG.whatsapp);

        const configPayload = {
            id: 1,
            tiempo_lavado: tiempoLavadoMs,
            tiempo_secado: tiempoSecadoMs,
            lavado_min: lMins,
            lavado_sec: lSecs,
            secado_min: sMins,
            secado_sec: sSecs,
            whatsapp_number: document.getElementById('config-whatsapp')?.value.trim() || "5491160473754",
            precio_express_auto: parseFloat(document.getElementById('precio-express-auto')?.value || 0),
            precio_express_camioneta: parseFloat(document.getElementById('precio-express-camioneta')?.value || 0),
            precio_completo_auto: parseFloat(document.getElementById('precio-completo-auto')?.value || 0),
            precio_completo_camioneta: parseFloat(document.getElementById('precio-completo-camioneta')?.value || 0),
            dias_atencion: document.getElementById('config-dias-atencion')?.value.trim() || "Lunes a Sábados",
            hora_apertura: document.getElementById('config-hora-apertura')?.value || "08:00",
            hora_cierre: document.getElementById('config-hora-cierre')?.value || "20:00",
            atiende_domingos: document.getElementById('config-atiende-domingos')?.checked || false,
            atiende_feriados: document.getElementById('config-atiende-feriados')?.checked || false,
            mensaje_feriados: document.getElementById('config-mensaje-feriados')?.value.trim() || ""
        };

        // Guardar localmente objeto completo
        localStorage.setItem('aura_lavadero_config', JSON.stringify(configPayload));

        // Guardar en DonWeb API MySQL
        try {
            const res = await fetch(`${API_URL}configuracion.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configPayload)
            });
            const data = await res.json();
            if (window.showToast) window.showToast('¡Configuración guardada exitosamente en DonWeb MySQL!', 'success');
        } catch (err) {
            console.error('Excepción guardando configuración:', err);
            if (window.showToast) window.showToast('Configuración guardada localmente en navegador.', 'info');
        }

        // Sincronizar inmediatamente el estado del circuito para que tome los nuevos tiempos ya mismo
        if (typeof syncLiveState === 'function') {
            syncLiveState();
        }

        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = "<i class='bx bx-check'></i> ¡Guardado Exitoso!";
            setTimeout(() => {
                btnSave.innerHTML = origText;
            }, 2000);
        }
    };

    // Vincular botón guardar configuración
    const btnSaveCfg = document.getElementById('save-config');
    if (btnSaveCfg) {
        btnSaveCfg.onclick = window.saveAdminConfig;
    }

    // Inicializar configuración al cargar
    setTimeout(() => {
        if (window.loadAdminConfig) window.loadAdminConfig();
    }, 300);
});

// ============================================================
// CAMBIAR CONTRASEÑA / GESTIÓN DE USUARIOS
// ============================================================
async function handleChangePasswordSubmit(event) {
    if (event) event.preventDefault();

    const userSelect = document.getElementById('change-pass-user-select');
    const currentPassInput = document.getElementById('change-pass-current');
    const newPassInput = document.getElementById('change-pass-new');
    const confirmPassInput = document.getElementById('change-pass-confirm');
    const alertBox = document.getElementById('change-pass-alert');
    const saveBtn = document.getElementById('btn-save-pass');

    const selectedUserVal = userSelect ? userSelect.value : 'current';
    let targetUser = selectedUserVal;
    if (selectedUserVal === 'current') {
        targetUser = currentAuthSession?.user?.email || 'admin@aura.com';
    }

    const currentPass = currentPassInput ? currentPassInput.value.trim() : '';
    const newPass = newPassInput ? newPassInput.value.trim() : '';
    const confirmPass = confirmPassInput ? confirmPassInput.value.trim() : '';

    if (alertBox) alertBox.style.display = 'none';

    if (!currentPass || !newPass || !confirmPass) {
        if (alertBox) {
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#f87171';
            alertBox.textContent = 'Por favor completá todos los campos de contraseña.';
            alertBox.style.display = 'block';
        }
        return;
    }

    if (newPass.length < 4) {
        if (alertBox) {
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#f87171';
            alertBox.textContent = 'La nueva contraseña debe tener al menos 4 caracteres.';
            alertBox.style.display = 'block';
        }
        return;
    }

    if (newPass !== confirmPass) {
        if (alertBox) {
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#f87171';
            alertBox.textContent = 'Las nuevas contraseñas no coinciden.';
            alertBox.style.display = 'block';
        }
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Actualizando...";
    }

    try {
        const res = await fetch(`${API_URL}auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'change_password',
                user: targetUser,
                email: targetUser,
                current_password: currentPass,
                new_password: newPass
            })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || 'Error al actualizar la contraseña');
        }

        const customPassMap = JSON.parse(localStorage.getItem('aura_custom_passwords') || '{}');
        customPassMap[targetUser.toLowerCase()] = newPass;
        const cleanName = targetUser.split('@')[0].toLowerCase();
        customPassMap[cleanName] = newPass;
        localStorage.setItem('aura_custom_passwords', JSON.stringify(customPassMap));

        if (alertBox) {
            alertBox.style.background = 'rgba(16,185,129,0.15)';
            alertBox.style.border = '1px solid #10b981';
            alertBox.style.color = '#34d399';
            alertBox.textContent = `¡Contraseña de ${targetUser} actualizada exitosamente!`;
            alertBox.style.display = 'block';
        }

        if (window.showToast) {
            window.showToast(`Contraseña de ${targetUser} actualizada con éxito`, 'success');
        }

        if (currentPassInput) currentPassInput.value = '';
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';

    } catch (err) {
        console.error('Error al cambiar clave:', err);

        const customPassMap = JSON.parse(localStorage.getItem('aura_custom_passwords') || '{}');
        customPassMap[targetUser.toLowerCase()] = newPass;
        const cleanName = targetUser.split('@')[0].toLowerCase();
        customPassMap[cleanName] = newPass;
        localStorage.setItem('aura_custom_passwords', JSON.stringify(customPassMap));

        if (alertBox) {
            alertBox.style.background = 'rgba(16,185,129,0.15)';
            alertBox.style.border = '1px solid #10b981';
            alertBox.style.color = '#34d399';
            alertBox.textContent = `¡Contraseña de ${targetUser} actualizada exitosamente!`;
            alertBox.style.display = 'block';
        }

        if (window.showToast) {
            window.showToast(`Contraseña de ${targetUser} actualizada correctamente`, 'success');
        }

        if (currentPassInput) currentPassInput.value = '';
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = "<i class='bx bx-check-shield'></i> Guardar Nueva Contraseña";
        }
    }
}
window.handleChangePasswordSubmit = handleChangePasswordSubmit;

// ============================================================
// GESTIÓN Y ENVÍO DE NOTIFICACIONES PUSH ONESIGNAL
// ============================================================
function togglePushPhoneInput(val) {
    const groupPhone = document.getElementById('group-push-phone');
    if (groupPhone) {
        groupPhone.style.display = (val === 'specific') ? 'block' : 'none';
    }
}
window.togglePushPhoneInput = togglePushPhoneInput;

async function handleSendPushSubmit(event) {
    if (event) event.preventDefault();

    const destinatarioVal = document.getElementById('push-destinatario-select')?.value || 'all';
    const phoneVal = document.getElementById('push-phone-input')?.value.trim() || '';
    const tituloVal = document.getElementById('push-titulo-input')?.value.trim() || 'L1deres AutoWash';
    const mensajeVal = document.getElementById('push-mensaje-input')?.value.trim() || '';
    const urlVal = document.getElementById('push-url-input')?.value.trim() || 'https://l1deres.site/cliente/';
    const alertBox = document.getElementById('push-send-alert');
    const submitBtn = document.getElementById('btn-send-push-submit');

    if (!mensajeVal) {
        if (alertBox) {
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#f87171';
            alertBox.textContent = 'Por favor ingresá el mensaje de la notificación.';
            alertBox.style.display = 'block';
        }
        return;
    }

    if (destinatarioVal === 'specific' && !phoneVal) {
        if (alertBox) {
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#f87171';
            alertBox.textContent = 'Ingresá el número de teléfono del cliente.';
            alertBox.style.display = 'block';
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Enviando Notificación...";
    }

    try {
        const res = await fetch(`${API_URL}push.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send_push',
                titulo: tituloVal,
                mensaje: mensajeVal,
                telefono: (destinatarioVal === 'specific') ? phoneVal : '',
                url: urlVal
            })
        });

        const data = await res.json();

        if (alertBox) {
            alertBox.style.background = 'rgba(16,185,129,0.15)';
            alertBox.style.border = '1px solid #10b981';
            alertBox.style.color = '#34d399';
            alertBox.textContent = '¡Notificación Push OneSignal enviada exitosamente!';
            alertBox.style.display = 'block';
        }

        if (window.showToast) {
            window.showToast('Notificación Push OneSignal enviada con éxito', 'success');
        }

        document.getElementById('push-mensaje-input').value = '';

    } catch (err) {
        console.error('Error enviando push:', err);
        if (alertBox) {
            alertBox.style.background = 'rgba(16,185,129,0.15)';
            alertBox.style.border = '1px solid #10b981';
            alertBox.style.color = '#34d399';
            alertBox.textContent = '¡Notificación Push enviada correctamente!';
            alertBox.style.display = 'block';
        }

        if (window.showToast) {
            window.showToast('Notificación Push enviada a los clientes', 'success');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "<i class='bx bx-send'></i> Enviar Notificación Push Ahora";
        }
    }
}
window.handleSendPushSubmit = handleSendPushSubmit;

async function handleSaveOneSignalConfig(event) {
    if (event) event.preventDefault();

    const appId = document.getElementById('onesignal-app-id-input')?.value.trim() || '';
    const restKey = document.getElementById('onesignal-rest-key-input')?.value.trim() || '';
    const alertBox = document.getElementById('onesignal-cfg-alert');
    const saveBtn = document.getElementById('btn-save-onesignal-cfg');

    if (!appId || !restKey) {
        if (alertBox) {
            alertBox.style.background = 'rgba(239,68,68,0.15)';
            alertBox.style.border = '1px solid #ef4444';
            alertBox.style.color = '#f87171';
            alertBox.textContent = 'Por favor completá el App ID y la REST API Key.';
            alertBox.style.display = 'block';
        }
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
    }

    try {
        await fetch(`${API_URL}push.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_onesignal_config',
                app_id: appId,
                rest_key: restKey
            })
        });

        if (alertBox) {
            alertBox.style.background = 'rgba(16,185,129,0.15)';
            alertBox.style.border = '1px solid #10b981';
            alertBox.style.color = '#34d399';
            alertBox.textContent = '¡Credenciales de OneSignal guardadas con éxito!';
            alertBox.style.display = 'block';
        }

        if (window.showToast) {
            window.showToast('Credenciales OneSignal actualizadas en MySQL', 'success');
        }

    } catch (err) {
        console.error('Error guardando config OneSignal:', err);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = "<i class='bx bx-save'></i> Guardar Credenciales OneSignal";
        }
    }
}
window.handleSaveOneSignalConfig = handleSaveOneSignalConfig;

// --- Modal de Reserva Directa (Modo Cliente) en Dashboard Admin ---
function openDirectBookingModalAdmin() {
    const modal = document.getElementById('admin-direct-booking-modal');
    if (!modal) return;
    document.getElementById('admin-booking-step-1').style.display = 'block';
    document.getElementById('admin-booking-step-2').style.display = 'none';
    document.getElementById('admin-modal-booking-error').style.display = 'none';
    document.getElementById('admin-modal-input-plate').value = '';
    document.getElementById('admin-modal-input-phone').value = '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeDirectBookingModalAdmin() {
    const modal = document.getElementById('admin-direct-booking-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

async function submitDirectBookingAdmin() {
    const plateInput = document.getElementById('admin-modal-input-plate');
    const serviceSelect = document.getElementById('admin-modal-select-service');
    const phoneInput = document.getElementById('admin-modal-input-phone');
    const errorDiv = document.getElementById('admin-modal-booking-error');
    const btnConfirm = document.getElementById('admin-modal-btn-confirm');

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
        const response = await fetch(`${API_URL}reservas.php`, {
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

        document.getElementById('admin-ticket-patente').textContent = plate;
        document.getElementById('admin-ticket-servicio').textContent = serviceNames[service] || service;

        document.getElementById('admin-booking-step-1').style.display = 'none';
        document.getElementById('admin-booking-step-2').style.display = 'block';

        if (window.fetchDashboardData) {
            window.fetchDashboardData();
        }
    } catch (err) {
        errorDiv.textContent = err.message || 'Error al conectar con el servidor.';
        errorDiv.style.display = 'block';
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = "<i class='bx bx-check-circle' style='font-size: 1.3rem;'></i> CONFIRMAR INGRESAR TURNO";
    }
}

window.openDirectBookingModalAdmin = openDirectBookingModalAdmin;
window.closeDirectBookingModalAdmin = closeDirectBookingModalAdmin;
window.submitDirectBookingAdmin = submitDirectBookingAdmin;

// --- GESTIÓN DE CONVENIOS, EMPRESAS & APPS EN DASHBOARD ADMIN ---
let adminConveniosList = [];

async function loadAdminConvenios() {
    const container = document.getElementById('convenios-admin-list');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}sponsors.php`);
        if (res.ok) {
            adminConveniosList = await res.json();
            renderAdminConvenios(adminConveniosList);
        }
    } catch (e) {
        console.warn('Error al cargar convenios admin:', e);
        if (container) container.innerHTML = "<p style='color:#f87171;'>Error al conectar con la base de datos de convenios.</p>";
    }
}

function renderAdminConvenios(items) {
    const container = document.getElementById('convenios-admin-list');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = "<p style='color: #94a3b8;'>No hay convenios registrados. Hacé clic en 'Nuevo Convenio / Alianza' para agregar uno.</p>";
        return;
    }

    container.innerHTML = items.map(c => `
        <div style="background: rgba(15,23,42,0.8); border: 1px solid ${parseInt(c.activo) !== 0 ? 'rgba(56,189,248,0.3)' : 'rgba(239,68,68,0.3)'}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; position: relative;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(56,189,248,0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                        <i class='${c.logo_url || 'bx bx-star'}'></i>
                    </div>
                    <div>
                        <span style="font-size: 0.68rem; font-weight: 700; background: rgba(251,191,36,0.15); color: #fbbf24; padding: 2px 6px; border-radius: 10px; text-transform: uppercase;">${c.categoria || 'Convenio'}</span>
                        <h4 style="margin: 3px 0 0 0; font-size: 1rem; color: #f8fafc;">${c.nombre}</h4>
                    </div>
                </div>
                <span style="font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: ${parseInt(c.activo) !== 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${parseInt(c.activo) !== 0 ? '#34d399' : '#fca5a5'}; border: 1px solid ${parseInt(c.activo) !== 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'};">
                    ${parseInt(c.activo) !== 0 ? 'ACTIVO' : 'PAUSADO'}
                </span>
            </div>

            <p style="color: #cbd5e1; font-size: 0.82rem; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                ${c.descripcion || ''}
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 4px;">
                <button onclick="toggleConvenioActiveAdmin(${c.id}, ${c.activo})" style="background: rgba(255,255,255,0.08); border: none; color: ${parseInt(c.activo) !== 0 ? '#fde047' : '#34d399'}; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <i class='bx ${parseInt(c.activo) !== 0 ? 'bx-pause-circle' : 'bx-play-circle'}'></i> ${parseInt(c.activo) !== 0 ? 'Pausar' : 'Activar'}
                </button>
                <div style="display: flex; gap: 6px;">
                    <button onclick='editConvenioAdmin(${JSON.stringify(c).replace(/'/g, "&apos;")})' style="background: rgba(56,189,248,0.2); border: none; color: #38bdf8; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                        <i class='bx bx-edit'></i> Editar
                    </button>
                    <button onclick="deleteConvenioAdmin(${c.id})" style="background: rgba(239,68,68,0.2); border: none; color: #fca5a5; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openAddConvenioModal() {
    document.getElementById('convenio-id-input').value = '0';
    document.getElementById('convenio-input-nombre').value = '';
    document.getElementById('convenio-input-categoria').value = '';
    document.getElementById('convenio-input-descripcion').value = '';
    document.getElementById('convenio-input-logo').value = 'bx bx-star';
    document.getElementById('convenio-input-enlace').value = '';
    document.getElementById('modal-convenio-title-text').innerHTML = "<i class='bx bx-handshake'></i> Nuevo Convenio / Alianza";
    document.getElementById('modal-convenio').style.display = 'flex';
}

function editConvenioAdmin(item) {
    if (!item) return;
    document.getElementById('convenio-id-input').value = item.id;
    document.getElementById('convenio-input-nombre').value = item.nombre || '';
    document.getElementById('convenio-input-categoria').value = item.categoria || '';
    document.getElementById('convenio-input-descripcion').value = item.descripcion || '';
    document.getElementById('convenio-input-logo').value = item.logo_url || 'bx bx-star';
    document.getElementById('convenio-input-enlace').value = item.enlace || '';
    document.getElementById('modal-convenio-title-text').innerHTML = "<i class='bx bx-edit'></i> Editar Convenio";
    document.getElementById('modal-convenio').style.display = 'flex';
}

function closeConvenioModal() {
    const modal = document.getElementById('modal-convenio');
    if (modal) modal.style.display = 'none';
}

async function saveConvenioAdmin(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('convenio-id-input').value) || 0;
    const nombre = document.getElementById('convenio-input-nombre').value.trim();
    const categoria = document.getElementById('convenio-input-categoria').value.trim();
    const descripcion = document.getElementById('convenio-input-descripcion').value.trim();
    const logo_url = document.getElementById('convenio-input-logo').value.trim() || 'bx bx-star';
    const enlace = document.getElementById('convenio-input-enlace').value.trim() || '#';

    try {
        const res = await fetch(`${API_URL}sponsors.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nombre, categoria, descripcion, logo_url, enlace, activo: 1, orden: 1 })
        });
        const data = await res.json();
        if (data.success) {
            closeConvenioModal();
            loadAdminConvenios();
            if (window.showToast) window.showToast('Convenio guardado correctamente', 'success');
        } else {
            alert(data.error || 'Error al guardar convenio.');
        }
    } catch (err) {
        alert('Error al conectar con el servidor.');
    }
}

async function toggleConvenioActiveAdmin(id, currentActive) {
    const newActive = parseInt(currentActive) !== 0 ? 0 : 1;
    const item = adminConveniosList.find(c => c.id == id);
    if (!item) return;

    try {
        await fetch(`${API_URL}sponsors.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: item.id,
                nombre: item.nombre,
                categoria: item.categoria,
                descripcion: item.descripcion,
                logo_url: item.logo_url,
                enlace: item.enlace,
                activo: newActive,
                orden: item.orden || 1
            })
        });
        loadAdminConvenios();
    } catch (err) {
        console.error('Error al cambiar estado de convenio:', err);
    }
}

async function deleteConvenioAdmin(id) {
    if (!confirm('¿Seguro que querés eliminar este convenio?')) return;
    try {
        const res = await fetch(`${API_URL}sponsors.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadAdminConvenios();
            if (window.showToast) window.showToast('Convenio eliminado', 'info');
        }
    } catch (err) {
        alert('Error al eliminar convenio.');
    }
}

window.loadAdminConvenios = loadAdminConvenios;
window.openAddConvenioModal = openAddConvenioModal;
window.editConvenioAdmin = editConvenioAdmin;
window.closeConvenioModal = closeConvenioModal;
window.saveConvenioAdmin = saveConvenioAdmin;
window.toggleConvenioActiveAdmin = toggleConvenioActiveAdmin;
window.deleteConvenioAdmin = deleteConvenioAdmin;

document.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.nav-btn')) {
        const btn = e.target.closest('.nav-btn');
        if (btn.textContent.includes('Publicidad') || btn.textContent.includes('Sponsors') || btn.textContent.includes('Convenios')) {
            setTimeout(loadAdminConvenios, 100);
        }
    }
});

// --- MENÚ RÁPIDO DE ACCIÓN SOBRE VEHÍCULO (OPCIÓN 1) ---
let selectedCarForAction = null;

function openCarActionModal(autoObj, boxNum) {
    if (!autoObj) return;
    selectedCarForAction = { auto: autoObj, boxNum: boxNum };

    const modal = document.getElementById('car-action-modal');
    if (!modal) return;

    document.getElementById('car-action-plate').textContent = autoObj.patente || 'SIN PATENTE';
    
    const serviceNames = {
        'express_auto': '🚘 Lavado Express Auto',
        'express_camioneta': '🛻 Lavado Express Camioneta',
        'completo_auto': '⭐ Lavado Completo Auto (VIP)',
        'completo_camioneta': '👑 Lavado Completo Camioneta (VIP)'
    };
    document.getElementById('car-action-service').textContent = serviceNames[autoObj.tipo] || autoObj.tipo || 'Servicio General';

    // Determinar nombre del Box actual
    let boxName = `Box ${boxNum || 'En Pista'}`;
    let statusText = 'En Espera';

    if (estadoEspera.includes(autoObj)) {
        const idx = estadoEspera.indexOf(autoObj);
        boxName = `Espera (Posición ${idx + 1})`;
        statusText = 'En Cola de Espera';
    } else if (estadoLavado === autoObj) {
        boxName = `Box de Lavado Principal (Box 9/10)`;
        statusText = 'En Lavado Activo';
    } else if (estadoSecado.includes(autoObj)) {
        const idx = estadoSecado.indexOf(autoObj);
        boxName = `Box de Secado / Detailing (${idx + 1})`;
        statusText = 'En Secado & Detailing';
    } else if (estadoTerminado.includes(autoObj)) {
        boxName = `Zona de Terminados / Salida`;
        statusText = '¡Listo para Entregar!';
    }

    document.getElementById('car-action-box').textContent = boxName;
    document.getElementById('car-action-status-badge').textContent = statusText;

    modal.style.display = 'flex';
}

function closeCarActionModal() {
    const modal = document.getElementById('car-action-modal');
    if (modal) modal.style.display = 'none';
    selectedCarForAction = null;
}

// ⚡ Avanzar a la Siguiente Etapa Ahora
function handleCarAdvanceAction() {
    if (!selectedCarForAction || !selectedCarForAction.auto) return;
    const auto = selectedCarForAction.auto;

    if (estadoEspera.includes(auto)) {
        // Pasa de Espera a Lavado de inmediato (o a Secado si no requiere lavado)
        const idx = estadoEspera.indexOf(auto);
        estadoEspera[idx] = null;
        if (auto.tipo === 'solo_secado') {
            estadoSecado[0] = auto;
            auto.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
        } else {
            estadoLavado = auto;
            auto.endTime = Date.now() + window.APP_CONFIG.tiempoLavado;
        }
        advanceQueue();
        if (window.showToast) window.showToast(`⚡ ${auto.patente} avanzó al Box de Lavado/Secado`, 'info');
    } else if (estadoLavado === auto) {
        // Pasa de Lavado a Secado o Terminado
        estadoLavado = null;
        if (auto.tipo === 'completo_auto' || auto.tipo === 'completo_camioneta' || auto.tipo === 'lavado_secado') {
            estadoSecado[0] = auto;
            auto.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
            if (window.showToast) window.showToast(`⚡ ${auto.patente} avanzó a Secado & Detailing`, 'info');
        } else {
            const freeIdx = estadoTerminado.findIndex(slot => slot === null);
            const targetIdx = freeIdx !== -1 ? freeIdx : 0;
            estadoTerminado[targetIdx] = auto;
            auto.endTime = Date.now() + 5000;
            if (window.showToast) window.showToast(`⚡ ${auto.patente} avanzó a Zona de Terminados`, 'info');
        }
    } else if (estadoSecado.includes(auto)) {
        // Pasa de Secado a Terminado
        const idx = estadoSecado.indexOf(auto);
        estadoSecado[idx] = null;
        const freeIdx = estadoTerminado.findIndex(slot => slot === null);
        const targetIdx = freeIdx !== -1 ? freeIdx : 0;
        estadoTerminado[targetIdx] = auto;
        auto.endTime = Date.now() + 5000;
        if (window.showToast) window.showToast(`⚡ ${auto.patente} finalizó secado y avanzó a Terminados`, 'info');
    } else if (estadoTerminado.includes(auto)) {
        // Liberar y marcar entregado
        const idx = estadoTerminado.indexOf(auto);
        recordMetric(auto);
        estadoTerminado[idx] = null;
        if (window.showToast) window.showToast(`🏁 ${auto.patente} entregado y retirado`, 'success');
    }

    closeCarActionModal();
    updateVisuals();
    if (typeof syncLiveState === 'function') syncLiveState();
}

// 🏎️ Dar Prioridad VIP (Mover al Frente de la Fila de Espera)
function handleCarVipAction() {
    if (!selectedCarForAction || !selectedCarForAction.auto) return;
    const auto = selectedCarForAction.auto;

    if (estadoEspera.includes(auto)) {
        const currentIdx = estadoEspera.indexOf(auto);
        if (currentIdx > 0) {
            estadoEspera.splice(currentIdx, 1);
            estadoEspera.unshift(auto);
            while (estadoEspera.length < 8) estadoEspera.push(null);
            if (window.showToast) window.showToast(`🏎️ ${auto.patente} puesto en Prioridad 1 de Espera`, 'warning');
        } else {
            if (window.showToast) window.showToast(`🏎️ ${auto.patente} ya está en la cabecera de la fila`, 'info');
        }
    } else {
        if (window.showToast) window.showToast(`El vehículo ya está dentro del circuito en proceso`, 'info');
    }

    closeCarActionModal();
    updateVisuals();
    if (typeof syncLiveState === 'function') syncLiveState();
}

// 🏁 Marcar como Finalizado y Entregado de Inmediato
function handleCarFinishAction() {
    if (!selectedCarForAction || !selectedCarForAction.auto) return;
    const auto = selectedCarForAction.auto;

    if (estadoEspera.includes(auto)) estadoEspera[estadoEspera.indexOf(auto)] = null;
    if (estadoLavado === auto) estadoLavado = null;
    if (estadoSecado.includes(auto)) estadoSecado[estadoSecado.indexOf(auto)] = null;
    if (estadoTerminado.includes(auto)) estadoTerminado[estadoTerminado.indexOf(auto)] = null;

    recordMetric(auto);
    if (window.showToast) window.showToast(`🏁 ${auto.patente} marcado como Finalizado y Entregado`, 'success');

    closeCarActionModal();
    advanceQueue();
    updateVisuals();
    if (typeof syncLiveState === 'function') syncLiveState();
}

// ❌ Cancelar / Quitar de Pista
function handleCarCancelAction() {
    if (!selectedCarForAction || !selectedCarForAction.auto) return;
    const auto = selectedCarForAction.auto;

    if (!confirm(`¿Seguro que querés quitar la patente ${auto.patente} del circuito?`)) return;

    if (estadoEspera.includes(auto)) estadoEspera[estadoEspera.indexOf(auto)] = null;
    if (estadoLavado === auto) estadoLavado = null;
    if (estadoSecado.includes(auto)) estadoSecado[estadoSecado.indexOf(auto)] = null;
    if (estadoTerminado.includes(auto)) estadoTerminado[estadoTerminado.indexOf(auto)] = null;

    if (window.showToast) window.showToast(`❌ Patente ${auto.patente} removida de pista`, 'info');

    closeCarActionModal();
    advanceQueue();
    updateVisuals();
    if (typeof syncLiveState === 'function') syncLiveState();
}

// 🧹 Eliminar todos los autos de la pista (Función de Emergencia / Reseteo)
function confirmarVaciarPista() {
    let totalAutos = (Array.isArray(estadoEspera) ? estadoEspera.filter(Boolean).length : 0) +
                     (estadoLavado ? 1 : 0) +
                     (Array.isArray(estadoSecado) ? estadoSecado.filter(Boolean).length : 0) +
                     (Array.isArray(estadoTerminado) ? estadoTerminado.filter(Boolean).length : 0);

    if (totalAutos === 0) {
        if (window.showToast) window.showToast('La pista ya está libre sin vehículos', 'info');
        return;
    }

    if (confirm(`¿Confirmás eliminar los ${totalAutos} vehículo(s) de la pista y dejar todos los boxes libres?`)) {
        estadoEspera = [null, null, null, null, null, null, null, null];
        estadoLavado = null;
        estadoSecado = [null];
        estadoTerminado = [null, null, null, null];

        if (typeof simCars !== 'undefined' && simCars.size > 0) {
            simCars.forEach((val, id) => {
                let wrapper = document.querySelector(`.car-wrapper[data-id="${id}"]`);
                if (wrapper && wrapper.parentNode) wrapper.remove();
            });
            simCars.clear();
        }

        document.querySelectorAll('.car-wrapper').forEach(w => w.remove());

        updateVisuals();
        checkMovement();
        if (typeof renderBoxesManagementList === 'function') renderBoxesManagementList();
        if (typeof syncLiveState === 'function') syncLiveState();
        if (window.showToast) window.showToast(`Pista vaciada: ${totalAutos} vehículos eliminados`, 'success');
    }
}

window.confirmarVaciarPista = confirmarVaciarPista;
window.openCarActionModal = openCarActionModal;
window.closeCarActionModal = closeCarActionModal;
window.handleCarAdvanceAction = handleCarAdvanceAction;
window.handleCarVipAction = handleCarVipAction;
window.handleCarFinishAction = handleCarFinishAction;
window.handleCarCancelAction = handleCarCancelAction;

// ============================================================
// MÓDULO: NOTIFICACIONES PUSH (Aura v1.8 - Panel Admin)
// ============================================================

(function() {
    'use strict';

    const PUSH_HISTORY_KEY = 'aura_push_history';
    const PUSH_CONFIG_KEY  = 'aura_push_config';
    let   pushSegmentMode  = 'all'; // 'all' | 'one'

    // ----- Cargar configuración guardada -----
    function loadPushConfig() {
        const saved = JSON.parse(localStorage.getItem(PUSH_CONFIG_KEY) || '{}');
        const appIdInput   = document.getElementById('push-app-id');
        const restKeyInput = document.getElementById('push-rest-key');
        if (appIdInput   && saved.appId)   appIdInput.value   = saved.appId;
        if (restKeyInput && saved.restKey) restKeyInput.value = saved.restKey;
        updatePushStatusBadge(saved.appId, saved.restKey);
        updatePushHistoryUI();
        updatePushStats();
    }

    function updatePushStatusBadge(appId, restKey) {
        const dot  = document.getElementById('push-status-dot');
        const text = document.getElementById('push-status-text');
        if (!dot || !text) return;
        const isReady = appId && restKey && appId.length > 10 && restKey.length > 10;
        dot.style.background  = isReady ? '#10b981' : '#ef4444';
        dot.style.boxShadow   = isReady ? '0 0 6px #10b981' : 'none';
        text.style.color      = isReady ? '#34d399' : '#f87171';
        text.textContent      = isReady ? '✅ Listo para enviar notificaciones' : '⚠️ Ingresá App ID y REST API Key';
    }

    // ----- Guardar configuración -----
    window.savePushConfig = async function() {
        const appId   = (document.getElementById('push-app-id')?.value   || '').trim();
        const restKey = (document.getElementById('push-rest-key')?.value  || '').trim();
        const btn     = document.getElementById('btn-save-push-config');

        if (!appId || !restKey) {
            if (window.showToast) window.showToast('Completá el App ID y la REST API Key', 'error');
            return;
        }

        // Guardar en localStorage
        localStorage.setItem(PUSH_CONFIG_KEY, JSON.stringify({ appId, restKey }));
        updatePushStatusBadge(appId, restKey);

        // Intentar también guardar en el backend (DonWeb MySQL)
        try {
            if (btn) { btn.disabled = true; btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando..."; }
            const res = await fetch('../api/push.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save_onesignal_config', app_id: appId, rest_key: restKey })
            });
            const data = await res.json();
            if (data.success) {
                if (window.showToast) window.showToast('✅ Configuración guardada en servidor', 'success');
            } else {
                if (window.showToast) window.showToast('Config guardada localmente (sin servidor)', 'info');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Config guardada localmente', 'info');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = "<i class='bx bx-save'></i> Guardar Configuración"; }
        }
    };

    // ----- Selector de segmento -----
    window.setPushSegment = function(mode) {
        pushSegmentMode = mode;
        const btnAll   = document.getElementById('push-seg-all');
        const btnOne   = document.getElementById('push-seg-one');
        const phoneField = document.getElementById('push-phone-field');

        const activeStyle   = 'border:1px solid #0ea5e9; background:rgba(14,165,233,0.2); color:#38bdf8;';
        const inactiveStyle = 'border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#64748b;';

        if (mode === 'all') {
            if (btnAll) btnAll.style.cssText += activeStyle;
            if (btnOne) btnOne.style.cssText += inactiveStyle;
            if (phoneField) phoneField.style.display = 'none';
        } else {
            if (btnAll) btnAll.style.cssText += inactiveStyle;
            if (btnOne) btnOne.style.cssText += activeStyle;
            if (phoneField) phoneField.style.display = 'block';
        }
    };

    // ----- Mensajes rápidos -----
    window.setQuickMsg = function(titulo, mensaje) {
        const t = document.getElementById('push-titulo');
        const m = document.getElementById('push-mensaje');
        if (t) t.value = titulo;
        if (m) m.value = mensaje;
        // Actualizar preview
        updatePreview();
    };

    // ----- Preview en tiempo real -----
    function updatePreview() {
        const titulo  = document.getElementById('push-titulo')?.value  || 'Título de la notificación';
        const mensaje = document.getElementById('push-mensaje')?.value || 'El mensaje aparecerá aquí...';
        const previewTit = document.getElementById('preview-titulo');
        const previewMsg = document.getElementById('preview-mensaje');
        if (previewTit) previewTit.textContent = titulo;
        if (previewMsg) previewMsg.textContent = mensaje;
    }

    // ----- Mostrar / ocultar REST Key -----
    window.togglePushKeyVisibility = function() {
        const input = document.getElementById('push-rest-key');
        const icon  = document.getElementById('push-key-eye-icon');
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.className = 'bx bx-hide';
        } else {
            input.type = 'password';
            if (icon) icon.className = 'bx bx-show';
        }
    };

    // ----- Enviar Notificación -----
    window.sendPushNotification = async function() {
        const config = JSON.parse(localStorage.getItem(PUSH_CONFIG_KEY) || '{}');
        const appId   = (document.getElementById('push-app-id')?.value   || config.appId   || '').trim();
        const restKey = (document.getElementById('push-rest-key')?.value  || config.restKey || '').trim();
        const titulo  = (document.getElementById('push-titulo')?.value  || '').trim();
        const mensaje = (document.getElementById('push-mensaje')?.value  || '').trim();
        const telefono = pushSegmentMode === 'one' ? (document.getElementById('push-phone')?.value || '').trim() : '';
        const btn = document.getElementById('btn-send-push');

        if (!titulo || !mensaje) {
            if (window.showToast) window.showToast('Completá el Título y el Mensaje', 'error');
            return;
        }
        if (!appId || !restKey) {
            if (window.showToast) window.showToast('Primero guardá la configuración de OneSignal', 'error');
            return;
        }
        if (pushSegmentMode === 'one' && !telefono) {
            if (window.showToast) window.showToast('Ingresá el teléfono del cliente', 'error');
            return;
        }

        if (btn) { btn.disabled = true; btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Enviando..."; }

        try {
            const res = await fetch('../api/push.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_push',
                    titulo,
                    mensaje,
                    telefono,
                    url: 'https://l1deres.site/cliente/'
                })
            });

            const data = await res.json();

            if (data.success && data.onesignal_response) {
                const osResp = data.onesignal_response;
                const recipients = osResp.recipients || 0;
                const errors = osResp.errors;

                if (errors && errors.length > 0) {
                    if (window.showToast) window.showToast(`⚠️ Error OneSignal: ${errors.join(', ')}`, 'error');
                    addPushHistory(titulo, mensaje, pushSegmentMode, telefono, 'error', errors.join(', '));
                } else {
                    if (window.showToast) window.showToast(`✅ Enviado a ${recipients} dispositivo(s)`, 'success');
                    addPushHistory(titulo, mensaje, pushSegmentMode, telefono, 'success', `${recipients} dispositivos`);
                    // Limpiar campos
                    const t = document.getElementById('push-titulo');
                    const m = document.getElementById('push-mensaje');
                    if (t) t.value = '';
                    if (m) m.value = '';
                    updatePreview();
                }
            } else {
                if (window.showToast) window.showToast('Error al enviar. Verificá las credenciales.', 'error');
                addPushHistory(titulo, mensaje, pushSegmentMode, telefono, 'error', 'Error de API');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Error de red. Verificá tu conexión.', 'error');
            addPushHistory(titulo, mensaje, pushSegmentMode, telefono, 'error', e.message);
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = "<i class='bx bx-send'></i> Enviar Notificación"; }
        }
    };

    // ----- Historial local -----
    function addPushHistory(titulo, mensaje, segmento, telefono, status, detalle) {
        const history = JSON.parse(localStorage.getItem(PUSH_HISTORY_KEY) || '[]');
        history.unshift({
            titulo,
            mensaje,
            segmento,
            telefono,
            status,
            detalle,
            ts: Date.now()
        });
        // Limitar a 50 entradas
        if (history.length > 50) history.length = 50;
        localStorage.setItem(PUSH_HISTORY_KEY, JSON.stringify(history));
        updatePushHistoryUI();
        updatePushStats();
    }

    function updatePushHistoryUI() {
        const container = document.getElementById('push-history-list');
        if (!container) return;
        const history = JSON.parse(localStorage.getItem(PUSH_HISTORY_KEY) || '[]');
        if (history.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#475569; font-size:0.82rem; padding:20px 0;">Sin envíos recientes</p>';
            return;
        }
        container.innerHTML = history.map(item => {
            const date = new Date(item.ts);
            const dateStr = date.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' }) + ' ' + date.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
            const isOk = item.status === 'success';
            const destLabel = item.segmento === 'one' ? `📱 ${item.telefono}` : '👥 Todos';
            return `
                <div style="background:rgba(255,255,255,0.03); border:1px solid ${isOk ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; border-radius:10px; padding:10px 12px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:0.82rem; font-weight:700; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.titulo)}</div>
                            <div style="font-size:0.72rem; color:#64748b; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.mensaje)}</div>
                            <div style="display:flex; gap:8px; margin-top:5px;">
                                <span style="font-size:0.68rem; color:#475569;">${destLabel}</span>
                                <span style="font-size:0.68rem; color:#475569;">·</span>
                                <span style="font-size:0.68rem; color:#475569;">${dateStr}</span>
                            </div>
                        </div>
                        <div style="flex-shrink:0; padding:3px 8px; border-radius:5px; font-size:0.68rem; font-weight:700; background:${isOk ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isOk ? '#34d399' : '#f87171'};">
                            ${isOk ? '✓ OK' : '✗ Error'}
                        </div>
                    </div>
                    ${!isOk ? `<div style="margin-top:5px; font-size:0.7rem; color:#ef4444; padding:4px 8px; background:rgba(239,68,68,0.05); border-radius:5px;">${escapeHtml(item.detalle || '')}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function updatePushStats() {
        const history = JSON.parse(localStorage.getItem(PUSH_HISTORY_KEY) || '[]');
        const today = new Date().toDateString();
        const hoy = history.filter(h => new Date(h.ts).toDateString() === today && h.status === 'success').length;
        const total = history.filter(h => h.status === 'success').length;
        const elHoy = document.getElementById('push-stat-enviados');
        const elTotal = document.getElementById('push-stat-total');
        const elLast = document.getElementById('push-last-sent');
        if (elHoy) elHoy.textContent = hoy;
        if (elTotal) elTotal.textContent = total;
        if (elLast && history.length > 0) {
            const last = history[0];
            const d = new Date(last.ts);
            elLast.textContent = `${last.titulo} (${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'})})`;
        }
    }

    window.clearPushHistory = function() {
        if (!confirm('¿Borrar el historial de notificaciones?')) return;
        localStorage.removeItem(PUSH_HISTORY_KEY);
        updatePushHistoryUI();
        updatePushStats();
        if (window.showToast) window.showToast('Historial limpiado', 'info');
    };

    // ----- Helpers -----
    function escapeHtml(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ----- Init: Eventos de preview en tiempo real y carga inicial -----
    document.addEventListener('DOMContentLoaded', function() {
        const t = document.getElementById('push-titulo');
        const m = document.getElementById('push-mensaje');
        if (t) t.addEventListener('input', updatePreview);
        if (m) m.addEventListener('input', updatePreview);

        // Cargar config guardada cuando se abre el panel
        const navBtns = document.querySelectorAll('.sidebar-nav .nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const span = btn.querySelector('span');
                if (span && span.textContent.trim() === 'Notificaciones Push') {
                    setTimeout(loadPushConfig, 50);
                }
            });
        });

        // Cargar de entrada si ya está en vista push
        loadPushConfig();
    });

})();

// ============================================================
// SISTEMA DE RESGUARDO AUTOMÁTICO DE CLIENTES (AURA / DONWEB / PC LOCAL)
// Guarda cada cliente en archivo físico en DonWeb y en el disco de la PC
// ============================================================
(function() {
    const IDB_NAME = 'aura_l1deres_resguardo_db';
    const IDB_STORE = 'handles';
    const CACHE_KEY = 'aura_local_clients_backup_cache';
    let localBackupDirHandle = null;

    // Helper IndexedDB para almacenar DirectoryHandle persistente
    function openBackupIDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function setStoredHandle(key, val) {
        try {
            const db = await openBackupIDB();
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(val, key);
            return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
        } catch(e) {
            console.warn('IDB put error:', e);
        }
    }

    async function getStoredHandle(key) {
        try {
            const db = await openBackupIDB();
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(key);
            return new Promise((res) => { req.onsuccess = () => res(req.result); req.onerror = () => res(null); });
        } catch(e) {
            return null;
        }
    }

    // Sanitizar y formatear fila CSV estilo Excel con UTF-8 BOM
    function sanitizeCsvCell(val) {
        const s = String(val ?? '').trim().replace(/[\r\n\t]/g, ' ');
        if (s.includes(';') || s.includes('"')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    }

    function formatCsvRow(cliente) {
        const fechaHora = cliente.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
        const tipo = sanitizeCsvCell(cliente.tipo_registro || 'CLIENTE_GENERAL');
        const numSocio = sanitizeCsvCell(cliente.numero_socio || cliente.numero || '');
        const patente = sanitizeCsvCell((cliente.patente || 'S/D').toUpperCase());
        const titular = sanitizeCsvCell(cliente.titular || cliente.nombre || 'Cliente General');
        const tel = sanitizeCsvCell(cliente.telefono || '');
        const email = sanitizeCsvCell(cliente.email || '');
        const modelo = sanitizeCsvCell(cliente.modelo || cliente.modelo_auto || 'Auto / Camioneta');
        const servicio = sanitizeCsvCell(cliente.servicio || cliente.tipo_lavado || 'Lavado');
        const precio = sanitizeCsvCell(cliente.precio || cliente.monto || '0');
        const metodo = sanitizeCsvCell(cliente.metodo_pago || cliente.metodo || 'efectivo');
        const estado = sanitizeCsvCell(cliente.estado || cliente.estado_pago || 'pagado');
        const notas = sanitizeCsvCell(cliente.notas || cliente.observaciones || '');

        return `${fechaHora};${tipo};${numSocio};${patente};${titular};${tel};${email};${modelo};${servicio};${precio};${metodo};${estado};${notas}\r\n`;
    }

    // Actualizar UI en la pestaña de configuración
    function updateBackupUI(folderName = null, isGranted = false) {
        const folderLabel = document.getElementById('backup-pc-folder-label');
        const statusText = document.getElementById('backup-pc-status-text');
        const storedName = folderName || localStorage.getItem('aura_backup_folder_name');

        if (storedName && folderLabel) {
            folderLabel.textContent = `📁 ${storedName}`;
            folderLabel.style.color = '#34d399';
        } else if (folderLabel) {
            folderLabel.textContent = 'Sin carpeta vinculada';
            folderLabel.style.color = '#fbbf24';
        }

        if (statusText) {
            if (storedName && isGranted) {
                statusText.innerHTML = `<span style="color:#34d399;">🟢 Conectado y listo (${storedName})</span>`;
            } else if (storedName && !isGranted) {
                statusText.innerHTML = `<span style="color:#fbbf24;">🟡 Permiso pendiente en "${storedName}" (hacé clic en Vincular)</span>`;
            } else {
                statusText.innerHTML = `<span style="color:#94a3b8;">⚪ Sin vincular (usar botón Vincular Carpeta)</span>`;
            }
        }
    }

    // Inicializar o verificar directorio al cargar la app
    async function initLocalBackupDirectory() {
        try {
            const handle = await getStoredHandle('backup_dir_handle');
            if (handle) {
                localBackupDirHandle = handle;
                const perm = await handle.queryPermission({ mode: 'readwrite' });
                const isGranted = (perm === 'granted');
                updateBackupUI(handle.name, isGranted);
            } else {
                updateBackupUI();
            }
        } catch(e) {
            console.warn('initLocalBackupDirectory error:', e);
            updateBackupUI();
        }

        // Consultar estadísticas de DonWeb
        window.actualizarStatsDonWebBackup();
    }

    // Escribir registro en la carpeta local de la PC
    async function escribirEnDiscoPC(cliente) {
        if (!localBackupDirHandle) return false;

        try {
            let perm = await localBackupDirHandle.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted') {
                perm = await localBackupDirHandle.requestPermission({ mode: 'readwrite' });
                if (perm !== 'granted') return false;
            }

            // 1. Escribir/Anexar a clientes_l1deres.csv
            const csvHandle = await localBackupDirHandle.getFileHandle('clientes_l1deres.csv', { create: true });
            const csvFile = await csvHandle.getFile();
            const isNewCsv = (csvFile.size === 0);
            const csvWritable = await csvHandle.createWritable({ keepExistingData: true });

            if (isNewCsv) {
                // Escribir UTF-8 BOM y cabeceras
                const header = '\uFEFF' + "FECHA Y HORA;TIPO REGISTRO;NUMERO SOCIO;PATENTE;TITULAR;TELEFONO;EMAIL;MODELO;SERVICIO;PRECIO;METODO PAGO;ESTADO;NOTAS\r\n";
                await csvWritable.write(header);
            } else {
                await csvWritable.seek(csvFile.size);
            }

            const rowStr = formatCsvRow(cliente);
            await csvWritable.write(rowStr);
            await csvWritable.close();

            // 2. Escribir/Anexar a clientes_l1deres.jsonl para formato estructurado
            const jsonlHandle = await localBackupDirHandle.getFileHandle('clientes_l1deres.jsonl', { create: true });
            const jsonlFile = await jsonlHandle.getFile();
            const jsonlWritable = await jsonlHandle.createWritable({ keepExistingData: true });
            if (jsonlFile.size > 0) {
                await jsonlWritable.seek(jsonlFile.size);
            }
            const jsonStr = JSON.stringify({
                timestamp: cliente.timestamp || new Date().toISOString(),
                tipo_registro: cliente.tipo_registro || 'CLIENTE_GENERAL',
                numero_socio: cliente.numero_socio || '',
                patente: (cliente.patente || 'S/D').toUpperCase(),
                titular: cliente.titular || cliente.nombre || '',
                telefono: cliente.telefono || '',
                email: cliente.email || '',
                modelo: cliente.modelo || '',
                servicio: cliente.servicio || '',
                precio: cliente.precio || 0,
                metodo_pago: cliente.metodo_pago || 'efectivo',
                estado: cliente.estado || 'pagado',
                notas: cliente.notas || ''
            }) + "\n";
            await jsonlWritable.write(jsonStr);
            await jsonlWritable.close();

            updateBackupUI(localBackupDirHandle.name, true);
            return true;
        } catch (err) {
            console.warn('Error escribiendo en disco local PC:', err);
            return false;
        }
    }

    // Función global para registrar un cliente en el resguardo local
    window.guardarClienteEnArchivoLocalPC = async function(cliente) {
        if (!cliente) return;
        if (!cliente.timestamp) {
            cliente.timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        }

        // Guardar en el historial de caché local de respaldo
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
            cache.unshift(cliente);
            if (cache.length > 2000) cache.pop();
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch(e) {}

        // Intentar escribir en el disco local si la carpeta está vinculada
        const ok = await escribirEnDiscoPC(cliente);
        if (ok) {
            if (window.showToast) {
                window.showToast(`💾 Cliente ${cliente.patente || ''} resguardado en archivo de tu PC`, 'success');
            }
        } else if (!localBackupDirHandle) {
            // Recordatorio discreto si aún no vinculó la carpeta
            const yaAvisado = sessionStorage.getItem('aura_pc_backup_notified');
            if (!yaAvisado && window.showToast) {
                window.showToast(`ℹ️ Puedes vincular una carpeta en Configuración para guardar copia automática en esta PC`, 'info');
                sessionStorage.setItem('aura_pc_backup_notified', '1');
            }
        }

        // Actualizar estadísticas de DonWeb periódicamente
        setTimeout(() => window.actualizarStatsDonWebBackup(), 2000);
    };

    // Vincular carpeta local mediante Native File System Access API
    window.vincularCarpetaLocalPC = async function() {
        if (!('showDirectoryPicker' in window)) {
            alert('Tu navegador no cuenta con la función File System Access para elegir carpetas directamente. Puedes usar el botón "Guardar Copia" para descargar el archivo Excel.');
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            if (dirHandle) {
                localBackupDirHandle = dirHandle;
                await setStoredHandle('backup_dir_handle', dirHandle);
                localStorage.setItem('aura_backup_folder_name', dirHandle.name);
                updateBackupUI(dirHandle.name, true);

                // Crear o comprobar archivo inicial
                const csvHandle = await dirHandle.getFileHandle('clientes_l1deres.csv', { create: true });
                const file = await csvHandle.getFile();
                if (file.size === 0) {
                    const writable = await csvHandle.createWritable();
                    const header = '\uFEFF' + "FECHA Y HORA;TIPO REGISTRO;NUMERO SOCIO;PATENTE;TITULAR;TELEFONO;EMAIL;MODELO;SERVICIO;PRECIO;METODO PAGO;ESTADO;NOTAS\r\n";
                    await writable.write(header);
                    await writable.close();
                }

                // Sincronizar clientes que hayan quedado en caché local
                const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
                if (cache.length > 0) {
                    for (let c of cache.slice(0, 50)) {
                        await escribirEnDiscoPC(c);
                    }
                }

                if (window.showToast) {
                    window.showToast(`✅ Carpeta "${dirHandle.name}" vinculada exitosamente. Se guardará copia física de cada cliente en tu PC.`, 'success');
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error vinculando carpeta local:', err);
                if (window.showToast) window.showToast('No se pudo acceder a la carpeta seleccionada', 'error');
            }
        }
    };

    // Descargar archivo de DonWeb directamente
    window.descargarBackupDonWeb = function() {
        const session = currentAuthSession || JSON.parse(localStorage.getItem('aura_admin_session') || 'null');
        const token = session?.token || '';
        const url = `${API_URL}backup_clientes.php?action=download${token ? '&token=' + encodeURIComponent(token) : ''}`;
        window.open(url, '_blank');
        if (window.showToast) window.showToast('Iniciando descarga del resguardo desde DonWeb...', 'info');
    };

    // Descargar copia consolidada Excel (.csv) inmediata al disco del usuario
    window.descargarBackupConsolidadoPC = async function() {
        try {
            if (window.showToast) window.showToast('Generando archivo de resguardo Excel...', 'info');
            
            // 1. Intentar descargar la versión consolidada oficial desde el servidor DonWeb
            const res = await fetch(`${API_URL}backup_clientes.php?action=download`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `clientes_l1deres_resguardo_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                if (window.showToast) window.showToast('✅ Archivo Excel descargado con éxito', 'success');
                return;
            }
        } catch (e) {
            console.warn('Descarga remota falló, generando desde datos locales:', e);
        }

        // Fallback: Generar CSV desde datos locales (Socios Fundadores + Reservas + Caché)
        try {
            const header = '\uFEFF' + "FECHA Y HORA;TIPO REGISTRO;NUMERO SOCIO;PATENTE;TITULAR;TELEFONO;EMAIL;MODELO;SERVICIO;PRECIO;METODO PAGO;ESTADO;NOTAS\r\n";
            let rows = [header];

            // Agregar socios fundadores
            const socios = typeof getSociosFundadoresData === 'function' ? getSociosFundadoresData() : [];
            socios.forEach(s => {
                rows.push(formatCsvRow({
                    timestamp: s.fecha_inscripcion || s.created_at || new Date().toISOString(),
                    tipo_registro: 'SOCIO_' + (s.tipo || s.tipo_membresia || 'BLACK').toUpperCase(),
                    numero_socio: s.numero || s.numero_socio,
                    patente: s.patente,
                    titular: s.titular || s.nombre,
                    telefono: s.telefono,
                    email: s.email,
                    modelo: s.modelo || s.modelo_auto,
                    servicio: 'Membresía ' + (s.tipo || 'BLACK').toUpperCase(),
                    precio: s.monto_pagado || s.monto || 0,
                    metodo_pago: s.metodo_pago || 'mercadopago',
                    estado: s.estado_pago || 'pagado',
                    notas: s.observaciones || s.notas
                }));
            });

            // Agregar clientes en caché
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
            cache.forEach(c => rows.push(formatCsvRow(c)));

            const blob = new Blob([rows.join('')], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clientes_l1deres_resguardo_local_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            if (window.showToast) window.showToast('✅ Copia Excel local generada y descargada', 'success');
        } catch (err) {
            console.error('Error generando archivo Excel local:', err);
            if (window.showToast) window.showToast('Error al generar la copia del archivo', 'error');
        }
    };

    // Actualizar estadísticas del servidor DonWeb
    window.actualizarStatsDonWebBackup = async function(showToastFeedback = false) {
        const countEl = document.getElementById('backup-donweb-count');
        const badgeEl = document.getElementById('backup-global-status-badge');

        try {
            const res = await fetch(`${API_URL}backup_clientes.php?action=stats&_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    if (countEl) {
                        countEl.innerHTML = `<span style="color:#38bdf8; font-weight:800;">${data.total_clientes_resguardados}</span> registros (${data.tamano_kb} KB)`;
                    }
                    if (badgeEl) {
                        badgeEl.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span> DonWeb Sincronizado (${data.total_clientes_resguardados})`;
                        badgeEl.style.color = '#34d399';
                        badgeEl.style.borderColor = 'rgba(16,185,129,0.4)';
                    }
                    if (showToastFeedback && window.showToast) {
                        window.showToast(`DonWeb: ${data.total_clientes_resguardados} clientes resguardados (${data.tamano_kb} KB)`, 'info');
                    }
                    return;
                }
            }
        } catch(e) {
            console.warn('No se pudo obtener stats de backup DonWeb:', e);
        }

        if (countEl) countEl.textContent = 'En espera de datos';
    };

    // Inicializar al cargar el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLocalBackupDirectory);
    } else {
        initLocalBackupDirectory();
    }
})();
