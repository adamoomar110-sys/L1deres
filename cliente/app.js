// Estado de la aplicación
const appState = {
    plate: '',
    washType: '',
    phone: '',
    rating: 0,
    reservaId: null,
    whatsappNumber: ''
};

// Configuración de API DonWeb
const API_URL = '../api/';

// Simulador del Video Splash Screen
document.addEventListener('DOMContentLoaded', () => {
    // Obtener configuración de WhatsApp desde API DonWeb
    fetch(`${API_URL}configuracion.php`)
        .then(res => res.json())
        .then(data => {
            if (data && data.whatsapp_number) {
                appState.whatsappNumber = data.whatsapp_number;
            }
        })
        .catch(err => console.warn('Cargando config cliente:', err));

    // Simulamos un tiempo de carga del splash screen (video de inicio)
    setTimeout(() => {
        nextScreen('screen-welcome');
    }, 3000); // 3 segundos de splash screen

    // Configurar sistema de estrellas
    setupStars();
    
    // Intentar solicitar notificaciones tras el splash screen
});

// ============================================================
// GESTIÓN DE NOTIFICACIONES PUSH ONESIGNAL (WRAPPER CENTRALIZADO)
// ============================================================
async function solicitarPermisosNotificacionOneSignal(telefono = '') {
    if (window.oneSignalService) {
        await window.oneSignalService.requestPermission();
        if (telefono) {
            await window.oneSignalService.loginUser(telefono);
        }
    }
}
window.solicitarPermisosNotificacionOneSignal = solicitarPermisosNotificacionOneSignal;

// Lógica de Instalación de PWA (Android, iOS y Desktop)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btnInstall = document.getElementById('btn-install');
    if (btnInstall) {
        btnInstall.style.display = 'block';
        btnInstall.onclick = () => {
            btnInstall.style.display = 'none';
            solicitarPermisosNotificacionOneSignal();
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('El usuario instaló la PWA L1deres Turnos');
                }
                deferredPrompt = null;
            });
        };
    }
});

// Detectar iOS Safari para mostrar banner de instalación
document.addEventListener('DOMContentLoaded', () => {
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIos && !isStandalone) {
        const btnInstall = document.getElementById('btn-install');
        if (btnInstall) {
            btnInstall.style.display = 'block';
            btnInstall.innerHTML = "<i class='bx bx-export'></i> INSTALAR EN IPHONE / IPAD";
            btnInstall.onclick = () => {
                alert("Para instalar la App de Turnos en tu iPhone:\n1. Toca el botón Compartir (cuadrado con flecha abajo) en Safari.\n2. Seleccioná 'Añadir a pantalla de inicio'.");
            };
        }
    }
});

// Navegación entre pantallas
function nextScreen(screenId) {
    // Ocultar todas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Mostrar la indicada
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        if (screenId === 'screen-welcome') {
            setTimeout(updateClientTracks, 100);
        } else if (screenId === 'screen-plate' || screenId === 'screen-phone') {
            if (window.solicitarPermisosNotificacionOneSignal) {
                window.solicitarPermisosNotificacionOneSignal(appState.phone);
            }
        }
    } else {
        console.warn(`Pantalla '${screenId}' no encontrada, mostrando pantalla por defecto.`);
        const defaultScreen = document.getElementById('screen-welcome');
        if (defaultScreen) defaultScreen.classList.add('active');
    }
}

function prevScreen(screenId) {
    nextScreen(screenId);
}

// Validar campos antes de avanzar
async function validateAndNext(step, nextScreenId) {
    if (step === 'plate') {
        const plateInput = document.getElementById('input-plate').value.trim();
        const errorMsg = document.getElementById('error-plate');
        if (plateInput.length < 6) {
            errorMsg.style.display = 'block';
            return;
        }
        errorMsg.style.display = 'none';
        appState.plate = plateInput.toUpperCase();
        
        // Actualizar resumen
        document.getElementById('summary-plate').innerText = appState.plate;
        
        // --- LÓGICA DE PROMOCIONES Y PROGRAMA DE FIDELIDAD POR PATENTE ---
        const banner = document.getElementById('promo-banner');
        if (banner) {
            banner.style.display = 'none';

            try {
                // 1. Consultar lavados acumulados para la patente
                const res = await fetch(`${API_URL}reservas.php?patente=${encodeURIComponent(appState.plate)}`);
                const reservasPatente = await res.json();
                const countLavados = Array.isArray(reservasPatente) ? reservasPatente.length : 0;

                // 2. Obtener regla de fidelidad (defecto: cada 5 lavados)
                const fidCfg = JSON.parse(localStorage.getItem('aura_fidelidad_config') || '{"frecuencia":5, "premio":100}');
                const customPromos = JSON.parse(localStorage.getItem('aura_custom_promos') || '[]');

                // 3. Buscar si hay una promo específica para esta patente o general
                const promoPatente = customPromos.find(p => p.activa && (p.patente === appState.plate || p.patente === 'TODAS'));

                const modulo = (countLavados + 1) % fidCfg.frecuencia;
                const esGratisOFidelidad = modulo === 0;

                if (promoPatente) {
                    banner.style.display = 'block';
                    banner.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    banner.innerHTML = `
                        <i class='bx bx-gift' style="font-size: 1.2rem; vertical-align: middle;"></i>
                        ¡BENEFICIO EXCLUSIVO ACTIVADO! <br>
                        <span style="font-weight: 500; font-size: 0.85rem;">${promoPatente.titulo} (${promoPatente.descuento}% OFF)</span>
                    `;
                } else if (esGratisOFidelidad) {
                    banner.style.display = 'block';
                    banner.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
                    banner.innerHTML = `
                        <i class='bx bx-trophy' style="font-size: 1.2rem; vertical-align: middle;"></i>
                        ¡FELICITACIONES! ESTE ES TU LAVADO Nº ${countLavados + 1} <br>
                        <span style="font-weight: 500; font-size: 0.85rem;">¡Tenés un ${fidCfg.premio}% de Descuento Especial! 🎉</span>
                    `;
                } else {
                    const faltan = fidCfg.frecuencia - modulo;
                    banner.style.display = 'block';
                    banner.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
                    banner.innerHTML = `
                        <i class='bx bx-car' style="font-size: 1.2rem; vertical-align: middle;"></i>
                        PATENTE: ${appState.plate} — Club de Fidelidad F1 <br>
                        <span style="font-weight: 500; font-size: 0.82rem;">Llevás ${countLavados} lavados acumulados. Te faltan ${faltan} para tu lavado GRATIS 🚀</span>
                    `;
                }
            } catch (err) {
                console.warn('Error calculando promos por patente:', err);
            }
        }

        nextScreen(nextScreenId);
    } 
    else if (step === 'phone') {
        const phoneInput = document.getElementById('input-phone').value.trim();
        const errorMsg = document.getElementById('error-phone');
        if (phoneInput.length < 8) {
            errorMsg.style.display = 'block';
            return;
        }
        errorMsg.style.display = 'none';
        appState.phone = phoneInput;
        document.getElementById('summary-phone').innerText = appState.phone;

        // Disparar permiso y vincular teléfono en OneSignal
        if (window.solicitarPermisosNotificacionOneSignal) {
            window.solicitarPermisosNotificacionOneSignal(appState.phone);
        }
        errorMsg.style.display = 'none';
        appState.phone = '+54 ' + phoneInput;
        nextScreen(nextScreenId);
    }
}

// Mapeo de precios por servicio
const WASH_PRICES = {
    'Lavado Express Auto': 4500,
    'Lavado Express Camioneta': 6000,
    'Lavado Completo Auto': 8500,
    'Lavado Completo Camioneta': 11000
};

// Selección de tipo de lavado
function selectWash(type) {
    appState.washType = type;
    appState.price = WASH_PRICES[type] || 4500;
    
    const summaryTypeElem = document.getElementById('summary-type');
    if (summaryTypeElem) {
        summaryTypeElem.innerText = `${type} ($${appState.price.toLocaleString('es-AR')})`;
    }
    nextScreen('screen-phone');
}

// Abrir Modal Checkout Mercado Pago
function processPayment() {
    const modal = document.getElementById('mp-checkout-modal');
    if (!modal) return;

    const priceFormatted = (appState.price || 4500).toLocaleString('es-AR');
    
    const descElem = document.getElementById('mp-item-desc');
    const priceElem = document.getElementById('mp-item-price');
    const btnPriceElem = document.getElementById('mp-btn-price');
    
    if (descElem) descElem.innerText = appState.washType || 'Servicio de Lavado';
    if (priceElem) priceElem.innerText = `$ ${priceFormatted}`;
    if (btnPriceElem) btnPriceElem.innerText = priceFormatted;

    document.getElementById('mp-step-methods').style.display = 'block';
    document.getElementById('mp-step-processing').style.display = 'none';
    document.getElementById('mp-step-success').style.display = 'none';

    modal.style.display = 'flex';
}

function closeMPModal() {
    const modal = document.getElementById('mp-checkout-modal');
    if (modal) modal.style.display = 'none';
}

function selectMPMethod(labelElem) {
    document.querySelectorAll('.mp-method-option').forEach(el => el.classList.remove('active'));
    if (labelElem) labelElem.classList.add('active');
}

// --- LÓGICA DE REGISTRO Y PAGO DE SOCIOS FUNDADORES (1 A 200) ---
function startSocioCheckout(tipo) {
    appState.isSocioCheckout = true;
    appState.socioTipo = tipo === 'gold' ? 'gold' : 'black';
    appState.price = appState.socioTipo === 'black' ? 65000 : 45000;
    appState.washType = appState.socioTipo === 'black' ? 'Membresía Socio Fundador Black' : 'Membresía Socio Fundador Gold';

    const titleElem = document.getElementById('socio-checkout-title');
    const tipoSummary = document.getElementById('summary-socio-tipo');
    const montoSummary = document.getElementById('summary-socio-monto');

    if (titleElem) {
        titleElem.innerText = appState.socioTipo === 'black' ? 'REGISTRO SOCIO BLACK' : 'REGISTRO SOCIO GOLD';
    }
    if (tipoSummary) {
        tipoSummary.innerText = appState.socioTipo === 'black' ? 'Socio Fundador Black VIP' : 'Socio Fundador Gold VIP';
        tipoSummary.style.color = appState.socioTipo === 'black' ? '#fbbf24' : '#f59e0b';
    }
    if (montoSummary) {
        montoSummary.innerText = `$ ${appState.price.toLocaleString('es-AR')} / Año`;
    }

    const inputPatente = document.getElementById('input-socio-patente');
    if (inputPatente && appState.plate) {
        inputPatente.value = appState.plate;
    }

    nextScreen('screen-socio-checkout');
}

function processSocioPayment() {
    const nombre = document.getElementById('input-socio-nombre').value.trim();
    const patente = document.getElementById('input-socio-patente').value.trim().toUpperCase();
    const phone = document.getElementById('input-socio-phone').value.trim();
    const fechaNac = document.getElementById('input-socio-fecha-nac').value.trim();
    const errorElem = document.getElementById('error-socio-form');

    if (!nombre || patente.length < 6 || phone.length < 6 || !fechaNac) {
        if (errorElem) errorElem.style.display = 'block';
        return;
    }
    if (errorElem) errorElem.style.display = 'none';

    // Guardar datos en estado
    appState.socioNombre = nombre;
    appState.plate = patente;
    appState.phone = '+54 ' + phone;
    appState.socioFechaNac = fechaNac;

    // Actualizar resumen en pantalla de pago
    const pagoTipo = document.getElementById('pago-tipo-label');
    const pagoNombre = document.getElementById('pago-nombre-label');
    const pagoPatente = document.getElementById('pago-patente-label');
    const pagoMonto = document.getElementById('pago-monto-label');
    if (pagoTipo) {
        pagoTipo.innerText = appState.socioTipo === 'black' ? 'Socio Fundador Black VIP' : 'Socio Fundador Gold VIP';
        pagoTipo.style.color = appState.socioTipo === 'black' ? '#fbbf24' : '#f59e0b';
    }
    if (pagoNombre) pagoNombre.innerText = nombre;
    if (pagoPatente) pagoPatente.innerText = patente;
    if (pagoMonto) pagoMonto.innerText = `$ ${appState.price.toLocaleString('es-AR')}`;

    // Ir a pantalla de pago
    nextScreen('screen-socio-pago');
}

// Simula el pago con MP, registra en MySQL y muestra número de socio real
// TODO: Cuando llegue el link real de MercadoPago, reemplazar la simulación
//       por: window.location.href = 'https://mpago.la/TU_LINK_AQUI';
//       y manejar el retorno por URL con ?payment_status=approved
async function simularPagoMP() {
    const btn = document.getElementById('btn-simular-pago');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Procesando pago...';
    }

    // Simular tiempo de procesamiento de pago (2 segundos)
    await new Promise(r => setTimeout(r, 2000));

    let numeroAsignado = Math.floor(Math.random() * 190) + 1; // Fallback por si la API falla

    try {
        const res = await fetch(`${API_URL}socios_fundadores.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: appState.socioNombre,
                patente: appState.plate,
                telefono: appState.phone,
                fecha_nacimiento: appState.socioFechaNac,
                tipo_membresia: appState.socioTipo,
                monto_pagado: appState.price,
                metodo_pago: 'mercadopago',
                estado_pago: 'pagado'
            })
        });
        const data = await res.json();
        if (data && data.success && data.socio && data.socio.numero_socio) {
            // ✅ Registro exitoso: usar número real de MySQL
            numeroAsignado = data.socio.numero_socio;
        } else if (data && !data.success && data.error) {
            // Solo mostrar alerta para errores de negocio (patente duplicada, cupos llenos)
            // Los errores de infraestructura (sin DB) usan el número simulado silenciosamente
            const esErrorNegocio = data.error.includes('patente') || 
                                   data.error.includes('Cupos completados') ||
                                   data.error.includes('ya está registrada');
            if (esErrorNegocio) {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadopago/logo__small@2x.png" alt="MP" style="height:18px;"> PAGAR CON MERCADO PAGO';
                }
                alert('⚠️ ' + data.error);
                return;
            }
            // Error de infraestructura: continuar con número simulado sin interrumpir
            console.warn('Infraestructura no disponible, usando número simulado:', data.error);
        }

    } catch (e) {
        console.warn('API offline, usando número simulado:', e);
    }

    appState.assignedSocioNumber = numeroAsignado;
    const numFormatted = '#' + String(numeroAsignado).padStart(3, '0');

    // Actualizar credencial digital con datos reales
    const numElem = document.getElementById('socio-assigned-number');
    const cardName = document.getElementById('socio-card-name');
    const cardPlate = document.getElementById('socio-card-plate');
    const cardNumBig = document.getElementById('socio-card-num-big');
    const cardBadge = document.getElementById('socio-card-badge-type');
    const cardIcon = document.getElementById('socio-card-icon');

    if (numElem) numElem.innerText = numFormatted;
    if (cardName) cardName.innerText = appState.socioNombre.toUpperCase();
    if (cardPlate) cardPlate.innerText = appState.plate;
    if (cardNumBig) cardNumBig.innerText = numFormatted;
    if (cardBadge) {
        cardBadge.innerText = appState.socioTipo === 'black' ? 'SOCIO BLACK VIP' : 'SOCIO GOLD VIP';
        cardBadge.style.color = appState.socioTipo === 'black' ? '#fbbf24' : '#f59e0b';
        cardBadge.style.borderColor = appState.socioTipo === 'black' ? 'rgba(251,191,36,0.4)' : 'rgba(245,158,11,0.4)';
        cardBadge.style.background = appState.socioTipo === 'black' ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.15)';
    }
    if (cardIcon) {
        cardIcon.style.color = appState.socioTipo === 'black' ? '#fbbf24' : '#f59e0b';
    }

    // Ir a pantalla de bienvenida con número real
    nextScreen('screen-socio-welcome');
    appState.isSocioCheckout = false;
}


// Confirmar Pago en Mercado Pago
async function confirmMPPayment() {
    document.getElementById('mp-step-methods').style.display = 'none';
    document.getElementById('mp-step-processing').style.display = 'block';

    try {
        // Simulamos tiempo de respuesta del servidor de Mercado Pago
        await new Promise(r => setTimeout(r, 1800));

        if (appState.isSocioCheckout) {
            // REGISTRO DE SOCIO FUNDADOR EN BACKEND DONWEB MYSQL (1 A 200)
            let numeroAsignado = Math.floor(Math.random() * 190) + 1; // Fallback aleatorio 1-200
            
            try {
                const res = await fetch(`${API_URL}socios_fundadores.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: appState.socioNombre,
                        patente: appState.plate,
                        telefono: appState.phone,
                        fecha_nacimiento: appState.socioFechaNac,
                        tipo_membresia: appState.socioTipo,
                        monto_pagado: appState.price,
                        metodo_pago: 'mercadopago'
                    })
                });
                const data = await res.json();
                if (data && data.success && data.numero_socio) {
                    numeroAsignado = data.numero_socio;
                }
            } catch (e) {
                console.warn('Registro local de socio por API offline:', e);
            }

            appState.assignedSocioNumber = numeroAsignado;
            const numFormatted = '#' + String(numeroAsignado).padStart(3, '0');

            // Actualizar UI del carnet de socio
            const numElem = document.getElementById('socio-assigned-number');
            const cardName = document.getElementById('socio-card-name');
            const cardPlate = document.getElementById('socio-card-plate');
            const cardNumBig = document.getElementById('socio-card-num-big');
            const cardBadge = document.getElementById('socio-card-badge-type');

            if (numElem) numElem.innerText = numFormatted;
            if (cardName) cardName.innerText = appState.socioNombre.toUpperCase();
            if (cardPlate) cardPlate.innerText = appState.plate;
            if (cardNumBig) cardNumBig.innerText = numFormatted;
            if (cardBadge) {
                cardBadge.innerText = appState.socioTipo === 'black' ? 'SOCIO BLACK VIP' : 'SOCIO GOLD VIP';
                cardBadge.style.color = appState.socioTipo === 'black' ? '#fbbf24' : '#f59e0b';
            }
        } else {
            // Reserva de Lavado regular
            let tipoParaDB = 'express_auto';
            if (appState.washType === 'Lavado Express Camioneta') tipoParaDB = 'express_camioneta';
            else if (appState.washType === 'Lavado Completo Auto') tipoParaDB = 'completo_auto';
            else if (appState.washType === 'Lavado Completo Camioneta') tipoParaDB = 'completo_camioneta';

            try {
                const res = await fetch(`${API_URL}reservas.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patente: appState.plate,
                        tipo_servicio: tipoParaDB,
                        cliente_telefono: appState.phone,
                        estado: 'pendiente'
                    })
                });
                const data = await res.json();
                if (data && data.id) {
                    appState.reservaId = data.id;
                }
            } catch (e) {
                console.warn('Simulación de reserva local por API offline:', e);
            }
        }

        // Generar ID de transacción simulación MP
        const randomTx = Math.floor(100000 + Math.random() * 900000);
        const txElem = document.getElementById('mp-tx-id');
        if (txElem) txElem.innerText = randomTx;

        document.getElementById('mp-step-processing').style.display = 'none';
        document.getElementById('mp-step-success').style.display = 'block';
    } catch (e) {
        console.error(e);
        document.getElementById('mp-step-processing').style.display = 'none';
        document.getElementById('mp-step-methods').style.display = 'block';
        alert('Hubo un inconveniente con el medio de pago. Intentá nuevamente.');
    }
}

// Finalizar flujo y redirigir a la pantalla correspondiente
function finishMPFlow() {
    closeMPModal();
    if (appState.isSocioCheckout) {
        nextScreen('screen-socio-welcome');
        appState.isSocioCheckout = false;
    } else {
        nextScreen('screen-review');
    }
}

// Sistema de Reseñas (Estrellas)
function setupStars() {
    const stars = document.querySelectorAll('.star');
    const emojiContainer = document.getElementById('review-emoji');
    const commentInput = document.getElementById('review-comment');
    const btnSubmit = document.getElementById('btn-submit-review');

    const emojis = {
        '1': '😡',
        '2': '😞',
        '3': '😐',
        '4': '🙂',
        '5': '😍'
    };

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            appState.rating = value;
            
            // Pintar estrellas
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });

            // Mostrar y actualizar emoji
            if (emojiContainer) {
                emojiContainer.textContent = emojis[value] || '🙂';
                emojiContainer.style.display = 'block';
                // Animación de rebote (pop)
                emojiContainer.style.transform = 'scale(1.2)';
                setTimeout(() => emojiContainer.style.transform = 'scale(1)', 200);
            }

            // Mostrar campo de comentario y botón enviar
            if (commentInput) commentInput.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'block';
            
            // Mostrar botón de WhatsApp si hay número configurado
            const btnWhatsapp = document.getElementById('btn-whatsapp');
            if (btnWhatsapp && appState.whatsappNumber) {
                btnWhatsapp.style.display = 'block';
            }
        });
    });
}

async function finishFlow() {
    // Si queremos actualizar la reseña en la DB:
    if (appState.rating > 0) {
        const commentInput = document.getElementById('review-comment');
        const comentarioText = commentInput ? commentInput.value.substring(0, 200).trim() : '';

        try {
            await fetch(`${API_URL}resenas.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_nombre: appState.plate ? `Cliente Patente ${appState.plate}` : 'Cliente PWA',
                    estrellas: appState.rating,
                    comentario: comentarioText
                })
            });
        } catch(e){}
    }
    
    // Reiniciar con mensaje amigable
    const card = document.querySelector('#screen-review .card');
    if (card) {
        card.innerHTML = `
            <h2 class="racing-font" style="color: #10b981; font-size: 2rem;">\uD83C\uDFC1 ¡Gracias!</h2>
            <p style="font-size: 1.1rem; margin: 20px 0;">Tu reserva y reseña fueron registradas.<br>\uD83D\uDFE2 Nos vemos en el pit lane.</p>
            <p style="color: #64748b; font-size: 0.9rem;">Redirigiendo en 3 segundos...</p>
        `;
    }
    setTimeout(() => { window.location.reload(); }, 3000);
}

// Función para abrir WhatsApp
function contactWhatsApp() {
    if (appState.whatsappNumber) {
        let number = appState.whatsappNumber.replace(/\D/g, '');
        const message = encodeURIComponent(`Hola L1deres, mi vehículo patente ${appState.plate} acaba de ingresar al Lavado Automático.`);
        window.open(`https://wa.me/${number}?text=${message}`, '_blank');
    }
}

function handleReservaClick() {
    if (window.solicitarPermisosNotificacionOneSignal) {
        try {
            window.solicitarPermisosNotificacionOneSignal();
        } catch(e) {
            console.warn('Permisos Push OneSignal:', e);
        }
    }
    nextScreen('screen-plate');
}

// ============================================================
// SIMULADOR DE ZONA DE ESPERA EN VIVO PARA CLIENTE
// ============================================================
function initClientTrack() {
    const grid = document.getElementById('client-canvas-grid');
    if (!grid) return;

    if (grid.querySelectorAll('.grid-box').length === 0) {
        grid.innerHTML = `
            <div class="grid-box" data-box-number="11">Espera 1</div>
            <div class="grid-box" data-box-number="12">Espera 2</div>
            <div class="grid-box" data-box-number="17">Espera 3</div>
            <div class="grid-box" data-box-number="18">Espera 4</div>
            <div class="grid-box" data-box-number="23">Espera 5</div>
            <div class="grid-box" data-box-number="24">Espera 6</div>
            <div class="grid-box" data-box-number="29">Espera 7</div>
            <div class="grid-box" data-box-number="30">Espera 8</div>
        `;
    }

    initClientSponsors();
    initClientCarSync();
}

function updateClientTracks() {
    // Pista SVG deshabilitada; diseño en grilla limpia de Zona de Espera
}
// ============================================================
// SISTEMA DE AUTOS CLIENTE — Sincronización 1:1 en Tiempo Real
// ============================================================

let clientCarImageSrc = './f1_car_top_down.png?v=f1hd3';
const _clientCarImg = new Image();
_clientCarImg.crossOrigin = 'anonymous';
_clientCarImg.src = clientCarImageSrc;
_clientCarImg.onload = () => {
    clientCarImageSrc = _clientCarImg.src;
    document.querySelectorAll('#client-canvas-area .auto-icon').forEach(ic => { ic.src = clientCarImageSrc; });
};

const ESPERA_ZONES = [11, 12, 17, 18, 23, 24, 29, 30];
const LAVADO_ZONE = 4;
const SECADO_ZONES = [3];

async function fetchClientLiveState() {
    try {
        const res = await fetch(`${API_URL}configuracion.php`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.live_state) {
                renderClientCars(data.live_state);
            }
        }
    } catch (e) {
        console.warn('Error syncing client live state:', e);
    }
}

// Motor de Simulación Continua para la App del Cliente (Sincronizado 1:1 con Dashboard)
const clientSimCars = new Map();

function formatClientTime(segundos) {
    if (segundos <= 0) return "00:00";
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function clientGameLoop() {
    const now = Date.now();

    clientSimCars.forEach((state) => {
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

        // Cuenta regresiva MM:SS en vivo para cada vehículo
        if (state.timerBadge) {
            if (state.stateName === 'espera') {
                state.timerBadge.style.display = 'block';
                if (state.etaSalidaEspera) {
                    const remaining = Math.max(0, Math.ceil((state.etaSalidaEspera - now) / 1000));
                    state.timerBadge.textContent = formatClientTime(remaining);
                } else if (state.timerText) {
                    state.timerBadge.textContent = state.timerText;
                }
            } else if (state.stateName === 'terminado') {
                if (state.endTime) {
                    const remaining = Math.ceil((state.endTime - now) / 1000);
                    if (remaining > 0) {
                        state.timerBadge.textContent = formatClientTime(remaining);
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
                    state.timerBadge.textContent = formatClientTime(remaining);
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

    requestAnimationFrame(clientGameLoop);
}
requestAnimationFrame(clientGameLoop);

function renderClientCars(state) {
    const canvas = document.getElementById('client-canvas-area') || document.querySelector('.client-canvas-area');
    if (!canvas || !state) return;

    const activeCarIds = new Set();
    const ESPERA_ZONES = [11, 12, 17, 18, 23, 24, 29, 30];
    const LAVADO_ZONE = 4;
    const SECADO_ZONES = [3];

    // Limpiar celdas ocupadas antes
    canvas.querySelectorAll('.grid-box').forEach(box => {
        box.classList.remove('box-occupied-lavado', 'box-occupied-secado', 'box-occupied-completo');
    });

    function placeCar(boxNumber, timerText, colorGlow = '#38bdf8', rotateDeg = 0, typeClass = 'solo-lavado', carId = '', carObj = null, stateName = 'espera') {
        const box = document.querySelector(`#client-canvas-grid .grid-box[data-box-number="${boxNumber}"]`);
        if (!box) return;

        const uniqueId = carId.toString();
        activeCarIds.add(uniqueId);

        // Iluminación de celda ocupada
        let classOcupado = '';
        if (typeClass === 'solo-lavado') classOcupado = 'box-occupied-lavado';
        else if (typeClass === 'solo-secado') classOcupado = 'box-occupied-secado';
        else classOcupado = 'box-occupied-completo';
        box.classList.add(classOcupado);

        const boxRect = box.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const scale = canvasRect.width / canvas.offsetWidth || 1;

        const targetX = (boxRect.left - canvasRect.left) / scale + box.offsetWidth / 2;
        const targetY = (boxRect.top - canvasRect.top) / scale + box.offsetHeight / 2;

        let wrapper = canvas.querySelector(`.car-wrapper[data-id="${uniqueId}"]`);
        let icon, timerBadge;

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = `car-wrapper ${typeClass}`;
            wrapper.dataset.id = uniqueId;

            icon = document.createElement('img');
            icon.className = 'auto-icon';
            icon.src = clientCarImageSrc;

            timerBadge = document.createElement('div');
            timerBadge.className = 'car-timer';
            timerBadge.textContent = timerText;

            wrapper.appendChild(icon);
            wrapper.appendChild(timerBadge);
            canvas.appendChild(wrapper);

            let isOddLane = [0, 2, 4, 6].includes(state.espera ? state.espera.findIndex(e => e && e.id && e.id.toString() === uniqueId) : -1);
            let entryBoxNum = isOddLane ? 29 : 30;
            let entryCell = canvas.querySelector(`#client-canvas-grid .grid-box[data-box-number="${entryBoxNum}"]`);
            let startX = targetX;
            let startY = targetY + 150;

            if (entryCell) {
                let entryRect = entryCell.getBoundingClientRect();
                startX = (entryRect.left - canvasRect.left) / scale + entryCell.offsetWidth / 2;
                startY = (entryRect.top - canvasRect.top) / scale + entryCell.offsetHeight / 2 + 250;
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
            clientSimCars.set(uniqueId, simState);
            wrapper.style.left = `${simState.x}px`;
            wrapper.style.top = `${simState.y}px`;
        } else {
            icon = wrapper.querySelector('.auto-icon');
            timerBadge = wrapper.querySelector('.car-timer');
            let simState = clientSimCars.get(uniqueId);
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
                clientSimCars.set(uniqueId, simState);
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
    } 
    else if (Array.isArray(state.cars)) {
        state.cars.forEach((carInfo, idx) => {
            const slot = carInfo.slot;
            const type = (carInfo.tipo === 'completo_auto' || carInfo.tipo === 'completo_camioneta' || carInfo.tipo === 'lavado_secado') ? 'completo' : 'solo-lavado';
            const carKey = (carInfo.id || idx).toString();
            if (slot && slot.startsWith('espera_')) {
                const sIdx = parseInt(slot.split('_')[1]) || 0;
                if (ESPERA_ZONES[sIdx]) {
                    const totalMin = (sIdx + 1) * minPorTurno;
                    const timeStr = `${totalMin.toString().padStart(2, '0')}:00`;
                    placeCar(ESPERA_ZONES[sIdx], timeStr, '#fde047', 0, type, carKey, carInfo, 'espera');
                }
            } else if (slot === 'lavado') {
                const lavMin = minLavado.toString().padStart(2, '0');
                placeCar(LAVADO_ZONE, `${lavMin}:00`, '#38bdf8', 270, type, carKey, carInfo, 'lavado');
            } else if (slot && (slot.startsWith('secado_') || slot.startsWith('interior_'))) {
                const sIdx = parseInt(slot.split('_')[1]) || 0;
                if (SECADO_ZONES[sIdx]) {
                    const secMin = minSecado.toString().padStart(2, '0');
                    placeCar(SECADO_ZONES[sIdx], `${secMin}:00`, '#f59e0b', 270, type, carKey, carInfo, 'secado');
                }
            }
        });
    }

    // Limpiar autos inactivos con animación de salida hacia la derecha
    canvas.querySelectorAll('.car-wrapper').forEach(wrapper => {
        const id = wrapper.dataset.id;
        if (!activeCarIds.has(id)) {
            wrapper.style.left = '120%';
            wrapper.style.opacity = '0';
            clientSimCars.delete(id);
            setTimeout(() => {
                if (wrapper.parentNode) wrapper.remove();
            }, 1000);
        }
    });

    updateClientBadge(state);
}

function updateClientBadge(state) {
    const timeEl  = document.getElementById('client-status-time');
    const badgeEl = document.getElementById('client-status-badge');
    if (!timeEl || !badgeEl) return;

    let maxEta = Date.now();
    let autosEsperaCount = 0;

    if (state && Array.isArray(state.espera)) {
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

    if (autosEsperaCount === 0) {
        timeEl.textContent  = '00:00';
        badgeEl.className   = 'status-badge badge-libre';
        badgeEl.textContent = 'SIN DEMORA';
    } else {
        timeEl.textContent  = formatClientTime(remainingSegundos);
        badgeEl.className   = autosEsperaCount > 3 ? 'status-badge badge-alta' : 'status-badge badge-normal';
        badgeEl.textContent = `${autosEsperaCount} EN ESPERA`;
    }
}

function initClientCarSync() {
    fetchClientLiveState();
    setInterval(fetchClientLiveState, 4000);
}

// ============================================================
// REPRODUCTOR DE SPONSORS / PUBLICIDADES CON VIDEO & IMAGEN
// ============================================================
const DEFAULT_CLIENT_SPONSORS = [
    {
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-sports-car-driving-on-a-road-at-sunset-41481-large.mp4',
        title: 'L1deres AutoWash - F1 Performance',
        duration: 8
    },
    {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
        title: 'Shell Helix Ultra - Lubricante Oficial',
        duration: 7
    },
    {
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-car-wheel-turning-on-the-asphalt-41480-large.mp4',
        title: 'Pirelli P Zero - Tecnología de Competición',
        duration: 8
    },
    {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        title: 'Red Bull Racing - Performance',
        duration: 7
    }
];

let clientSponsorsList = [...DEFAULT_CLIENT_SPONSORS];
let clientSponsorIdx = 0;
let clientSponsorTimer = null;

async function fetchClientSponsors() {
    try {
        const res = await fetch(`${API_URL}configuracion.php`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.sponsors && data.sponsors.length > 0) {
                clientSponsorsList = data.sponsors;
            }
        }
    } catch (e) {
        console.warn('Usando sponsors locales de respaldo en cliente');
    }
}

function initClientSponsors() {
    const wrapper = document.getElementById('client-screen-media-wrapper');
    const titleEl = document.getElementById('client-sponsor-title');
    const progressEl = document.getElementById('client-sponsor-progress');
    if (!wrapper) return;

    fetchClientSponsors().then(() => {
        renderClientSlide();
    });

    function renderClientSlide() {
        if (clientSponsorTimer) clearTimeout(clientSponsorTimer);
        const list = clientSponsorsList.length > 0 ? clientSponsorsList : DEFAULT_CLIENT_SPONSORS;
        if (clientSponsorIdx >= list.length) clientSponsorIdx = 0;

        const cur = list[clientSponsorIdx];
        if (titleEl) titleEl.textContent = cur.title || 'L1deres AutoWash';
        
        wrapper.innerHTML = '';

        if (progressEl) {
            progressEl.style.transition = 'none';
            progressEl.style.width = '0%';
            setTimeout(() => {
                progressEl.style.transition = `width ${(cur.duration || 7)}s linear`;
                progressEl.style.width = '100%';
            }, 50);
        }

        if (cur.type === 'video') {
            const video = document.createElement('video');
            video.src = cur.url;
            video.autoplay = true;
            video.muted = true;
            video.loop = false;
            video.playsInline = true;
            video.className = 'screen-media-item';
            video.onended = () => { nextClientSlide(); };
            video.onerror = () => {
                wrapper.innerHTML = `<img src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80" class="screen-media-item" alt="${cur.title}">`;
            };
            wrapper.appendChild(video);
            video.play().catch(() => {});
        } else {
            const img = document.createElement('img');
            img.src = cur.url;
            img.alt = cur.title || 'Sponsor';
            img.className = 'screen-media-item';
            img.onerror = () => {
                img.src = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80';
            };
            wrapper.appendChild(img);
        }

        const duration = (cur.duration || 7) * 1000;
        clientSponsorTimer = setTimeout(nextClientSlide, duration);
    }

    function nextClientSlide() {
        const list = clientSponsorsList.length > 0 ? clientSponsorsList : DEFAULT_CLIENT_SPONSORS;
        clientSponsorIdx = (clientSponsorIdx + 1) % list.length;
        renderClientSlide();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initClientTrack, 300);
    window.addEventListener('resize', () => {
        setTimeout(updateClientTracks, 200);
    });
});

// Modal de Socios Fundadores VIP (Black & Gold)
function openSocioModal(tipo) {
    const modal = document.getElementById('socio-modal');
    if (!modal) return;

    const titleElem = document.getElementById('socio-modal-title');
    const badgeElem = document.getElementById('socio-modal-badge');
    const descElem = document.getElementById('socio-modal-desc');
    const btnWaElem = document.getElementById('socio-modal-wa');

    const numWa = appState.whatsappNumber || '5491160473754';

    if (tipo === 'Black') {
        if (titleElem) titleElem.innerHTML = `<i class='bx bx-crown' style='color:#fbbf24;'></i> SOCIO FUNDADOR BLACK`;
        if (badgeElem) {
            badgeElem.innerText = 'MEMBRESÍA VIP EXCLUSIVA';
            badgeElem.style.background = 'rgba(251, 191, 36, 0.2)';
            badgeElem.style.color = '#fbbf24';
            badgeElem.style.border = '1px solid rgba(251, 191, 36, 0.4)';
        }
        if (descElem) {
            descElem.innerHTML = `
                <ul style="text-align: left; font-size: 0.88rem; line-height: 1.6; padding-left: 18px; color: #cbd5e1; list-style-type: disc;">
                    <li style="margin-bottom: 6px;"><strong>Acceso prioritario VIP #1</strong> en Pit Lane sin fila de espera.</li>
                    <li style="margin-bottom: 6px;"><strong>30% OFF permanente</strong> en todos los lavados y detallados.</li>
                    <li style="margin-bottom: 6px;">Encerado cerámico de alta velocidad <strong>sin cargo en cada visita</strong>.</li>
                    <li style="margin-bottom: 6px;">Atención de Concierge personal y sorteos VIP.</li>
                </ul>
            `;
        }
        if (btnWaElem) {
            btnWaElem.href = `https://wa.me/${numWa}?text=Hola!%20Quiero%20asociarme%20como%20Socio%20Fundador%20Black%20en%20L1deres%20AutoWash.`;
        }
    } else {
        if (titleElem) titleElem.innerHTML = `<i class='bx bxs-award' style='color:#f59e0b;'></i> SOCIO FUNDADOR GOLD`;
        if (badgeElem) {
            badgeElem.innerText = 'MEMBRESÍA PREFERENCIAL GOLD';
            badgeElem.style.background = 'rgba(245, 158, 11, 0.2)';
            badgeElem.style.color = '#f59e0b';
            badgeElem.style.border = '1px solid rgba(245, 158, 11, 0.4)';
        }
        if (descElem) {
            descElem.innerHTML = `
                <ul style="text-align: left; font-size: 0.88rem; line-height: 1.6; padding-left: 18px; color: #cbd5e1; list-style-type: disc;">
                    <li style="margin-bottom: 6px;"><strong>Atención preferencial</strong> en boxes de preparación.</li>
                    <li style="margin-bottom: 6px;"><strong>20% OFF permanente</strong> en todos los servicios de lavado.</li>
                    <li style="margin-bottom: 6px;">Obsequio especial de <strong>perfumería F1 en cada visita</strong>.</li>
                    <li style="margin-bottom: 6px;">Avisos inmediatos por WhatsApp de turnos expresos.</li>
                </ul>
            `;
        }
        if (btnWaElem) {
            btnWaElem.href = `https://wa.me/${numWa}?text=Hola!%20Quiero%20asociarme%20como%20Socio%20Fundador%20Gold%20en%20L1deres%20AutoWash.`;
        }
    }

    modal.style.display = 'flex';
}

function closeSocioModal() {
    const modal = document.getElementById('socio-modal');
    if (modal) modal.style.display = 'none';
}


