import os
import re

filepath_html = r"C:\Users\trabajo ia\.gemini\antigravity-ide\scratch\lavadero-de-lujo\index.html"
with open(filepath_html, "r", encoding="utf-8") as f:
    html_content = f.read()

# 1. ADD SIDEBAR LINK
nav_ecosistema = """                <button class="nav-btn" data-target="view-ecosistema" title="Ecosistema">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    <span>Ecosistema</span>
                </button>"""

nav_cctv = """
                <button class="nav-btn" data-target="view-camaras" title="Cámaras CCTV">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    <span>Cámaras</span>
                </button>"""

html_content = html_content.replace(nav_ecosistema, nav_ecosistema + nav_cctv)


# 2. ADD CCTV VIEW SECTION (We insert it before MODAL DE TICKET / QR)
cctv_view = """
        <!-- VISTA CAMARAS CCTV -->
        <div id="view-camaras" class="view-section hidden">
            <div class="panel-header" style="margin-bottom: 1rem;">
                <div class="panel-title-group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    <h3>Centro de Monitoreo (CCTV)</h3>
                </div>
                <div style="color: var(--color-lime); font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 2px; display: flex; align-items: center; gap: 0.5rem;">
                    <div class="rec-dot"></div> LIVE / <span id="cctv-clock">00:00:00</span>
                </div>
            </div>
            
            <div class="cctv-grid">
                <!-- Camara 1: Entrada IA -->
                <div class="cctv-camera" onclick="toggleFullscreen(this)">
                    <div class="cctv-feed entrada-feed">
                        <div class="scanlines"></div>
                        <div class="cctv-overlay">
                            <span class="cctv-label">CAM 01 - RECEPCIÓN (IA ACTIVA)</span>
                        </div>
                        <!-- Bounding Box IA Simulator -->
                        <div class="cctv-ai-box">
                            <span class="cctv-ai-label">PATENTE: AB123CD (98%)</span>
                        </div>
                    </div>
                </div>
                
                <!-- Camara 2: Lavado -->
                <div class="cctv-camera" onclick="toggleFullscreen(this)">
                    <div class="cctv-feed taller-feed">
                        <div class="scanlines"></div>
                        <div class="cctv-overlay">
                            <span class="cctv-label">CAM 02 - ZONA HÚMEDA</span>
                        </div>
                    </div>
                </div>

                <!-- Camara 3: Secado -->
                <div class="cctv-camera" onclick="toggleFullscreen(this)">
                    <div class="cctv-feed secado-feed">
                        <div class="scanlines"></div>
                        <div class="cctv-overlay">
                            <span class="cctv-label">CAM 03 - SECADO / ESTÉTICA</span>
                        </div>
                    </div>
                </div>

                <!-- Camara 4: Café -->
                <div class="cctv-camera" onclick="toggleFullscreen(this)">
                    <div class="cctv-feed cafe-feed">
                        <div class="scanlines"></div>
                        <div class="cctv-overlay">
                            <span class="cctv-label">CAM 04 - SALA DE ESPERA</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
"""

# Insert before `<!-- MODAL DE TICKET / QR -->`
html_content = html_content.replace('<!-- MODAL DE TICKET / QR -->', cctv_view + '\n    <!-- MODAL DE TICKET / QR -->')

with open(filepath_html, "w", encoding="utf-8") as f:
    f.write(html_content)


# 3. ADD CSS STYLES
filepath_css = r"C:\Users\trabajo ia\.gemini\antigravity-ide\scratch\lavadero-de-lujo\style.css"
with open(filepath_css, "r", encoding="utf-8") as f:
    css_content = f.read()

cctv_styles = """
/* ================= CCTV MODULE ================= */
.cctv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1rem;
    width: 100%;
    height: 100%;
}

.cctv-camera {
    background-color: #000;
    border: 2px solid #27272a;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    aspect-ratio: 16/9;
    cursor: pointer;
    transition: all 0.3s ease;
}

.cctv-camera:hover {
    border-color: var(--color-cyan);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
}

.cctv-camera.fullscreen {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 9999;
    border-radius: 0;
    border: none;
}

.cctv-feed {
    width: 100%;
    height: 100%;
    position: absolute;
    background-size: cover;
    background-position: center;
    filter: sepia(0.2) contrast(1.1) brightness(0.8);
}

/* Backgrounds of feeds - Using simple CSS gradients to simulate spaces for now */
.entrada-feed { background: radial-gradient(circle at center, #1a202c, #000); }
.taller-feed { background: radial-gradient(circle at center, #111827, #000); }
.secado-feed { background: radial-gradient(circle at center, #18181b, #000); }
.cafe-feed { background: radial-gradient(circle at center, #27272a, #000); }

.cctv-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 10;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.cctv-label {
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-family: monospace;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    border: 1px solid rgba(255,255,255,0.2);
}

.rec-dot {
    width: 12px;
    height: 12px;
    background-color: #ef4444;
    border-radius: 50%;
    animation: blink-rec 1s infinite;
}

@keyframes blink-rec {
    0% { opacity: 1; box-shadow: 0 0 10px #ef4444; }
    50% { opacity: 0.2; box-shadow: none; }
    100% { opacity: 1; box-shadow: 0 0 10px #ef4444; }
}

/* IA Box Animation */
.cctv-ai-box {
    position: absolute;
    top: 40%; left: 30%; width: 25%; height: 25%;
    border: 2px solid var(--color-cyan);
    box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.3);
    pointer-events: none;
    z-index: 15;
    animation: ai-scan-move 8s infinite alternate ease-in-out;
}

.cctv-ai-label {
    position: absolute;
    top: -25px; left: -2px;
    background: var(--color-cyan);
    color: #000;
    font-weight: bold;
    font-size: 0.7rem;
    padding: 2px 6px;
    font-family: var(--font-display);
    white-space: nowrap;
}

@keyframes ai-scan-move {
    0% { top: 40%; left: 30%; transform: scale(1); }
    25% { top: 35%; left: 45%; transform: scale(1.1); border-color: var(--color-lime); }
    50% { top: 50%; left: 40%; transform: scale(0.9); border-color: var(--color-yellow); }
    75% { top: 45%; left: 55%; transform: scale(1.05); border-color: var(--color-cyan); }
    100% { top: 40%; left: 30%; transform: scale(1); }
}
"""

with open(filepath_css, "a", encoding="utf-8") as f:
    f.write("\n" + cctv_styles)


# 4. ADD JS CLOCK & FULLSCREEN
filepath_js = r"C:\Users\trabajo ia\.gemini\antigravity-ide\scratch\lavadero-de-lujo\app.js"
with open(filepath_js, "r", encoding="utf-8") as f:
    js_content = f.read()

cctv_js = """
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
"""

with open(filepath_js, "a", encoding="utf-8") as f:
    f.write("\n" + cctv_js)

print("CCTV Injected")
