document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-preview');
    const canvas = document.getElementById('canvas-preview');
    const btnStartCamera = document.getElementById('btn-start-camera');
    const btnSwitchCamera = document.getElementById('btn-switch-camera');
    const btnTakePhoto = document.getElementById('btn-take-photo');
    const btnRetakePhoto = document.getElementById('btn-retake-photo');
    const inputSelfie = document.getElementById('selfie_base64');
    const formPostular = document.getElementById('form-postular');
    const formMessage = document.getElementById('form-message');
    const btnSubmit = document.getElementById('btn-submit');

    let stream = null;

    // Inicializar Supabase leyendo de /api/config o localStorage
    let supabase = null;
    fetch('/api/config').then(r => r.json()).then(data => {
        let sUrl = data.supabaseUrl || localStorage.getItem('lavadero_supabase_url') || '';
        let sKey = data.supabaseKey || localStorage.getItem('lavadero_supabase_key') || '';
        if (sUrl && sKey && window.supabase) {
            supabase = window.supabase.createClient(sUrl, sKey);
        } else {
            showMessage('Advertencia: Base de datos no conectada. Guardando localmente.', 'error');
        }
    }).catch(e => {
        let sUrl = localStorage.getItem('lavadero_supabase_url') || '';
        let sKey = localStorage.getItem('lavadero_supabase_key') || '';
        if (sUrl && sKey && window.supabase) {
            supabase = window.supabase.createClient(sUrl, sKey);
        }
    });

    function showMessage(msg, type) {
        formMessage.textContent = msg;
        formMessage.className = 'form-feedback ' + type;
    }

    let videoDevices = [];
    let currentDeviceIndex = 0;

    async function getVideoDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log("enumerateDevices not supported.");
            return;
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length > 1) {
                btnSwitchCamera.style.display = 'block';
            }
        } catch(e) {
            console.error("Error al enumerar dispositivos", e);
        }
    }

    async function startCamera(deviceId = null) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        let constraints = { video: { facingMode: { ideal: 'user' } } };
        if (deviceId) {
            constraints = { video: { deviceId: { exact: deviceId } } };
        }

        try {
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (fallbackErr) {
                console.warn("Fallo con constraints iniciales, intentando video: true", fallbackErr);
                if (!deviceId) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } else {
                    throw fallbackErr;
                }
            }
            video.srcObject = stream;
            video.style.display = 'block';
            canvas.style.display = 'none';
            btnStartCamera.style.display = 'none';
            btnTakePhoto.style.display = 'block';
            btnRetakePhoto.style.display = 'none';
            
            // Una vez que tenemos permiso, enumeramos las cámaras para ver si hay más de una
            if (videoDevices.length === 0) {
                await getVideoDevices();
            }
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            showMessage('Error de cámara: ' + (err.name || err.message || 'Desconocido') + '. Verifica permisos o si otra app la está usando.', 'error');
        }
    }

    btnSwitchCamera.addEventListener('click', () => {
        if (videoDevices.length <= 1) return;
        currentDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
        startCamera(videoDevices[currentDeviceIndex].deviceId);
    });

    function takePhoto() {
        if (!stream) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        inputSelfie.value = dataUrl;

        // Detener la cámara
        stream.getTracks().forEach(track => track.stop());
        stream = null;

        video.style.display = 'none';
        canvas.style.display = 'block';
        btnTakePhoto.style.display = 'none';
        btnSwitchCamera.style.display = 'none';
        btnRetakePhoto.style.display = 'block';
    }

    btnStartCamera.addEventListener('click', startCamera);
    btnTakePhoto.addEventListener('click', takePhoto);
    btnRetakePhoto.addEventListener('click', startCamera);

    const fallbackInput = document.getElementById('fallback-camera-input');
    const btnUploadPhoto = document.getElementById('btn-upload-photo');

    if (btnUploadPhoto && fallbackInput) {
        btnUploadPhoto.addEventListener('click', () => {
            fallbackInput.click();
        });

        fallbackInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = 400; // Ancho fijo para mantener la proporción
                    canvas.height = 400 * (img.height / img.width);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    inputSelfie.value = canvas.toDataURL('image/jpeg', 0.8);
                    
                    video.style.display = 'none';
                    canvas.style.display = 'block';
                    btnTakePhoto.style.display = 'none';
                    btnSwitchCamera.style.display = 'none';
                    btnStartCamera.style.display = 'none';
                    btnRetakePhoto.style.display = 'block';
                    
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                        stream = null;
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    formPostular.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!inputSelfie.value) {
            showMessage('Por favor, tómate una selfie antes de enviar.', 'error');
            return;
        }

        const applicantData = {
            full_name: document.getElementById('full_name').value,
            dni: document.getElementById('dni').value,
            phone: document.getElementById('phone').value,
            age: parseInt(document.getElementById('age').value),
            zone: document.getElementById('zone').value,
            app_experience: document.getElementById('app_experience').value,
            availability: document.getElementById('availability').value,
            selfie_url: inputSelfie.value // Temporalmente guardamos Base64. Idealmente subir a Supabase Storage y guardar la URL.
        };

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';

        try {
            if (supabase) {
                // Si existe conexión a supabase, tratar de subir la selfie a Storage (opcional/avanzado)
                // Aquí por simplicidad, asumimos que selfie_url (base64 o string larga) va directo a BD 
                // (Ojo: Base64 en un texto largo puede ser pesado, pero es funcional para empezar)
                
                const { data, error } = await supabase
                    .from('applicants')
                    .insert([applicantData]);

                if (error) throw error;
            } else {
                // Modo fallback local
                const applicants = JSON.parse(localStorage.getItem('lavadero_applicants') || '[]');
                applicants.push({ ...applicantData, id: Date.now().toString(), status: 'pending', created_at: new Date().toISOString() });
                localStorage.setItem('lavadero_applicants', JSON.stringify(applicants));
            }

            showMessage('¡Postulación enviada con éxito! Nos pondremos en contacto contigo pronto.', 'success');
            formPostular.reset();
            inputSelfie.value = '';
            canvas.style.display = 'none';
            btnRetakePhoto.style.display = 'none';
            btnSwitchCamera.style.display = 'none';
            btnStartCamera.style.display = 'block';

        } catch (error) {
            console.error('Error al enviar postulación:', error);
            showMessage('Ocurrió un error al enviar tu postulación. Inténtalo de nuevo.', 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar Postulación';
        }
    });
});
