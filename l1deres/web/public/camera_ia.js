// camera_ia.js - Unificación de Cámara y Procesamiento IA (Visión Artificial)

let cameraStream = null;
let isProcessingCamera = false;

/**
 * Enciende la cámara física y la muestra en el video.
 */
async function startCameraIA(videoId, iconId, textId) {
    const video = document.getElementById(videoId);
    const text = document.getElementById(textId);
    const icon = document.getElementById(iconId);
    
    if (isProcessingCamera) return;

    try {
        if(icon) icon.innerText = "⏳";
        if(text) text.innerText = "Iniciando...";
        
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if(video) {
            video.srcObject = cameraStream;
            video.style.display = 'block';
            video.play();
        }
        
        if(icon) icon.style.display = 'none';
        if(text) {
            text.innerText = "TOCAR PARA CAPTURAR (IA)";
            text.style.background = 'rgba(0,0,0,0.5)';
            text.style.borderRadius = '5px';
            text.style.color = '#fff';
        }
    } catch (err) {
        console.error("Error cámara:", err);
        if(typeof showToast === 'function') showToast("No se pudo acceder a la cámara", "error");
        if(icon) {
            icon.innerText = "📷";
            icon.style.display = 'block';
        }
        if(text) text.innerText = "Error de cámara";
    }
}

/**
 * Captura un fotograma, detiene la cámara y llama a la API de IA.
 * Luego pasa los datos a un callback.
 */
async function captureAndProcessIA(videoElement, canvasElement, textId, scanLineId, onCaptureCallback) {
    if (!cameraStream) return;
    
    isProcessingCamera = true;
    const text = document.getElementById(textId);
    const scanLine = document.getElementById(scanLineId);
    
    if(text) text.innerText = "PROCESANDO IA...";
    if(scanLine) scanLine.style.display = 'block';

    // Congelar fotograma
    videoElement.pause();
    
    const scale = 2; // Mejorar calidad para OCR de Gemini
    canvasElement.width = videoElement.videoWidth * scale;
    canvasElement.height = videoElement.videoHeight * scale;
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    const base64Image = canvasElement.toDataURL('image/jpeg', 0.8);
    const base64Data = base64Image.split(',')[1]; // Remover metadata

    // Detener cámara para ahorrar batería
    stopCameraIA();

    let resultData = { plate: null, color: null, model: null, success: false };

    try {
        // Enviar imagen al backend de Next.js que procesa con Gemini Vision IA
        const response = await fetch('/api/scan-vehicle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        resultData.plate = data.plate ? data.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() : null;
        resultData.model = `${data.brand || ''} ${data.model || ''}`.trim() || null;
        resultData.color = data.color ? data.color.toUpperCase() : null;
        resultData.success = true;

    } catch (e) {
        console.error("Error en IA Gemini:", e);
    }

    if(scanLine) scanLine.style.display = 'none';
    if(text) {
        text.innerText = "ENCENDER CÁMARA";
        text.style.background = 'transparent';
        text.style.color = 'var(--color-text-dim)';
    }
    
    // Ocultar video y mostrar icon
    videoElement.style.display = 'none';
    const icon = document.getElementById(videoElement.id.replace('video', 'icon'));
    if (icon) icon.style.display = 'block';

    isProcessingCamera = false;

    // Retornar datos a la aplicación principal
    if (onCaptureCallback) {
        onCaptureCallback(resultData);
    }
}

function stopCameraIA() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}
