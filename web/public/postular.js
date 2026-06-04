document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-preview');
    const canvas = document.getElementById('canvas-preview');
    const btnStartCamera = document.getElementById('btn-start-camera');
    const btnTakePhoto = document.getElementById('btn-take-photo');
    const btnRetakePhoto = document.getElementById('btn-retake-photo');
    const inputSelfie = document.getElementById('selfie_base64');
    const formPostular = document.getElementById('form-postular');
    const formMessage = document.getElementById('form-message');
    const btnSubmit = document.getElementById('btn-submit');

    let stream = null;

    // Inicializar Supabase si está configurado en localStorage (del admin panel)
    const supabaseUrl = localStorage.getItem('lavadero_supabase_url') || '';
    const supabaseKey = localStorage.getItem('lavadero_supabase_key') || '';
    
    let supabase = null;
    if (supabaseUrl && supabaseKey && window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        showMessage('Advertencia: El sistema no está conectado a la base de datos externa. Los datos se guardarán temporalmente.', 'error');
    }

    function showMessage(msg, type) {
        formMessage.textContent = msg;
        formMessage.className = 'form-feedback ' + type;
    }

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            video.style.display = 'block';
            canvas.style.display = 'none';
            btnStartCamera.style.display = 'none';
            btnTakePhoto.style.display = 'block';
            btnRetakePhoto.style.display = 'none';
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            showMessage('No se pudo acceder a la cámara. Por favor, da los permisos necesarios.', 'error');
        }
    }

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
        btnRetakePhoto.style.display = 'block';
    }

    btnStartCamera.addEventListener('click', startCamera);
    btnTakePhoto.addEventListener('click', takePhoto);
    btnRetakePhoto.addEventListener('click', startCamera);

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
