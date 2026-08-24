/**
 * ============================================================
 * ONESIGNAL CENTRALIZED INTEGRATION WRAPPER (Aura v1.8)
 * SDK Track: Stable (v16 - 160609)
 * App ID: 263bf04a-ad7a-4d11-842d-210cea51387c
 * ============================================================
 */

class OneSignalService {
    constructor() {
        this.appId = "263bf04a-ad7a-4d11-842d-210cea51387c";
        this.isInitialized = false;
        this.verificationDialogShown = false;
        this.observerRetained = null;
    }

    /**
     * Inicializa el SDK de OneSignal y configura el observador de suscripción
     */
    async init() {
        if (this.isInitialized) return;
        window.OneSignalDeferred = window.OneSignalDeferred || [];

        const self = this;
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                // Consultar si hay App ID personalizado configurado en el backend PHP
                try {
                    const res = await fetch('../api/push.php');
                    const data = await res.json();
                    if (data && data.onesignal_app_id && data.onesignal_app_id.length > 10) {
                        self.appId = data.onesignal_app_id;
                    }
                } catch (e) {
                    console.warn("OneSignal Config Fetch Warning:", e);
                }

                await OneSignal.init({
                    appId: self.appId,
                    allowLocalhostAsSecureOrigin: true
                });

                self.isInitialized = true;
                console.log("✅ OneSignal SDK v16 Inicializado con App ID:", self.appId);

                // Configurar Observador de Suscripción para Verificación
                self.setupPushSubscriptionObserver(OneSignal);

            } catch (err) {
                console.error("❌ Error inicializando OneSignal SDK:", err);
            }
        });
    }

    /**
     * Observador de estado de suscripción Push (Requisito de Verificación)
     */
    setupPushSubscriptionObserver(OneSignal) {
        const self = this;

        // Retener el observador para evitar deasignación en memoria
        this.observerRetained = function(event) {
            const currentSubId = OneSignal.User.PushSubscription.id;
            self.checkSubscriptionIdAndShowDialog(OneSignal, currentSubId);
        };

        // Escuchar cambios de suscripción
        OneSignal.User.PushSubscription.addEventListener("change", this.observerRetained);

        // Evaluar también de forma inmediata al iniciar
        const initialSubId = OneSignal.User.PushSubscription.id;
        this.checkSubscriptionIdAndShowDialog(OneSignal, initialSubId);
    }

    /**
     * Muestra el Diálogo de Verificación exactamente 1 vez cuando se asigna un ID real
     */
    checkSubscriptionIdAndShowDialog(OneSignal, subId) {
        if (this.verificationDialogShown) return;

        // Validar que el ID sea real (no vacío y no local-placeholder)
        const isRealId = subId && typeof subId === 'string' && subId.trim() !== '' && !subId.startsWith('local-');
        const isOptedIn = OneSignal.User.PushSubscription.optedIn;

        if (isRealId || isOptedIn) {
            this.verificationDialogShown = true;
            this.showVerificationDialog(OneSignal);
        }
    }

    /**
     * Muestra el Modal de Verificación nativo en pantalla
     */
    showVerificationDialog(OneSignal) {
        let modal = document.getElementById('onesignal-verification-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'onesignal-verification-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 999999;
                background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px);
                display: flex; align-items: center; justify-content: center; padding: 20px;
            `;

            modal.innerHTML = `
                <div style="background: #0f172a; border: 1px solid #38bdf8; border-radius: 20px; padding: 28px 24px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: onesignalPop 0.4s ease;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(56,189,248,0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px;">
                        <i class='bx bx-check-shield'></i>
                    </div>
                    <h3 style="font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 12px;">
                        Your OneSignal SDK integration is complete!
                    </h3>
                    <p style="font-size: 0.92rem; color: #94a3b8; line-height: 1.5; margin-bottom: 24px;">
                        You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.
                    </p>
                    <button id="onesignal-dialog-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(14,165,233,0.4);">
                        Got it
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            const btn = document.getElementById('onesignal-dialog-btn');
            btn.onclick = async () => {
                modal.remove();
                await this.requestPermission();
            };
        }
    }

    /**
     * Solicita permisos nativos de notificaciones de forma inmediata e infalible
     */
    async requestPermission() {
        // 1. Disparo nativo inmediato del navegador
        if ('Notification' in window && Notification.permission !== 'granted') {
            try {
                const nativeResult = await Notification.requestPermission();
                console.log("🔔 Resultado nativo del navegador:", nativeResult);
            } catch (e) {
                console.warn("Aviso permisos nativos:", e);
            }
        }

        // 2. Disparo a través del SDK OneSignal
        return new Promise((resolve) => {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
                try {
                    const permission = await OneSignal.Notifications.requestPermission();
                    console.log("✅ Permisos OneSignal otorgados:", permission);
                    resolve(permission);
                } catch (e) {
                    console.warn("OneSignal Request Warning:", e);
                    resolve(false);
                }
            });
        });
    }

    /**
     * Vincula el usuario con un identificador externo (Teléfono o Email)
     */
    async loginUser(externalId) {
        if (!externalId) return;
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                await OneSignal.login(externalId);
                await OneSignal.User.addTag("telefono", externalId);
                console.log("👤 Usuario vinculado en OneSignal:", externalId);
            } catch (e) {
                console.error("Error identificando usuario OneSignal:", e);
            }
        });
    }

    /**
     * Agrega un Tag al perfil del usuario
     */
    async addTag(key, value) {
        window.OneSignalDeferred.push(async function(OneSignal) {
            try {
                await OneSignal.User.addTag(key, value);
            } catch (e) {
                console.error("Error agregando tag:", e);
            }
        });
    }

    /**
     * Obtiene el Subscription ID actual del dispositivo
     */
    async getSubscriptionId() {
        return new Promise((resolve) => {
            window.OneSignalDeferred.push(async function(OneSignal) {
                resolve(OneSignal.User.PushSubscription.id || null);
            });
        });
    }
}

// Instancia global centralizada
window.oneSignalService = new OneSignalService();
document.addEventListener('DOMContentLoaded', () => {
    window.oneSignalService.init();
});
