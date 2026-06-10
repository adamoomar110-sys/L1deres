const fs = require('fs');
let html = fs.readFileSync('cliente.html', 'utf-8');

// 1. Add Vehicle Category section
const catHtml = `
            <p style="font-size: 0.85rem; color: var(--color-cyan); font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">0. ¿Qué vehículo tienes?</p>
            <div id="config-cat-grid" class="wash-menu-grid" style="grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 2rem;">
                <!-- Dinámico -->
            </div>
`;
html = html.replace('<p style="font-size: 0.85rem; color: var(--color-cyan); font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">1. Elige tu Servicio</p>', catHtml + '\n            <p style="font-size: 0.85rem; color: var(--color-cyan); font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">1. Elige tu Servicio (Puedes elegir varios)</p>');

// 2. JS Modifications
const newJs = `
        let VEHICLE_CATEGORIES = [];
        const savedCatSettings = localStorage.getItem('lavadero_vehicle_categories');
        if (savedCatSettings) {
            VEHICLE_CATEGORIES = JSON.parse(savedCatSettings);
        } else {
            VEHICLE_CATEGORIES = [
                { id: 'Auto', percentage: 0, icon: '🚗' },
                { id: 'SUV', percentage: 20, icon: '🚙' },
                { id: 'Camioneta', percentage: 50, icon: '🛻' }
            ];
        }

        let pendingCats = '';
        let currentMultiplier = 1;

        function renderCatMenu() {
            const grid = document.getElementById('config-cat-grid');
            if(!grid) return;
            let h = '';
            VEHICLE_CATEGORIES.forEach(cat => {
                h += \`
                <div class="wash-menu-card" data-cat="\${cat.id}" onclick="selectCat(this, '\${cat.id}', \${cat.percentage})">
                    <div class="check-badge">✓</div>
                    <div class="wash-card-icon" style="font-size: 1.5rem;">\${cat.icon}</div>
                    <div class="wash-card-title" style="font-size: 0.65rem;">\${cat.id} \${cat.percentage >= 0 ? '+' : ''}\${cat.percentage}%</div>
                </div>
                \`;
            });
            grid.innerHTML = h;
            
            // Auto select URL parameter if present
            const urlCat = urlParams.get('cat');
            if (urlCat) {
                const catNode = document.querySelector(\`#config-cat-grid .wash-menu-card[data-cat="\${urlCat}"]\`);
                if (catNode) {
                    const found = VEHICLE_CATEGORIES.find(c => c.id === urlCat);
                    selectCat(catNode, urlCat, found ? found.percentage : 0);
                    document.getElementById('config-cat-grid').parentElement.style.display = 'none'; // hide step 0 if pre-filled
                }
            } else if (VEHICLE_CATEGORIES.length > 0) {
                // select first by default
                const first = document.querySelector(\`#config-cat-grid .wash-menu-card\`);
                if (first) selectCat(first, VEHICLE_CATEGORIES[0].id, VEHICLE_CATEGORIES[0].percentage);
            }
        }

        function selectCat(el, id, perc) {
            document.querySelectorAll('#config-cat-grid .wash-menu-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
            pendingCats = id;
            currentMultiplier = 1 + (perc / 100);
            renderConfigMenu(); // re-render prices
        }

        let pendingTypeIds = [];

        function renderConfigMenu() {
            const grid = document.getElementById('config-wash-grid');
            if(!grid) return;
            let html = '';
            for (const [id, details] of Object.entries(WASH_DETAILS)) {
                const adjustedPrice = Math.round(details.price * currentMultiplier);
                const isSelected = pendingTypeIds.includes(id) ? 'selected' : '';
                html += \`
                <div class="wash-menu-card \${isSelected}" data-type="\${id}" onclick="selectWash(this, '\${id}')">
                    <div class="check-badge">✓</div>
                    <div class="wash-card-title" style="font-size: 0.75rem; min-height: 2.5em; display:flex; align-items:center; justify-content:center;">\${details.name}</div>
                    <div class="wash-card-price" style="font-size: 0.9rem;">$\${adjustedPrice.toLocaleString('es-AR')}</div>
                </div>
                \`;
            }
            grid.innerHTML = html;
        }

        function selectWash(el, id) {
            if (pendingTypeIds.includes(id)) {
                pendingTypeIds = pendingTypeIds.filter(i => i !== id);
                el.classList.remove('selected');
            } else {
                pendingTypeIds.push(id);
                el.classList.add('selected');
            }
        }

        function confirmarConfiguracion() {
            if (!pendingCats) { alert('Por favor, selecciona qué vehículo tienes.'); return; }
            if (pendingTypeIds.length === 0) { alert('Por favor, selecciona al menos un tipo de lavado.'); return; }
            if (!pendingPay) { alert('Por favor, selecciona una forma de pago.'); return; }
            
            pendingType = pendingTypeIds.join(',');
            
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('cat', pendingCats);
            newUrl.searchParams.set('t', pendingType);
            newUrl.searchParams.set('pay', pendingPay);
            window.history.pushState({}, '', newUrl);

            type = pendingType;
            payment = pendingPay;
            
            configView.style.display = 'none';
            trackingView.style.display = 'block';
            
            document.getElementById('car-display-container').innerHTML = getCarSvg(color);
            initTrackingView();
        }
`;

html = html.replace(/function renderConfigMenu\(\) \{[\s\S]*?function confirmarConfiguracion\(\) \{[\s\S]*?initTrackingView\(\);\s*\}/, newJs);

// Find the line that calls `renderConfigMenu()` on load and add `renderCatMenu()`
html = html.replace('renderConfigMenu();', 'renderCatMenu(); renderConfigMenu();');
if(!html.includes('renderCatMenu();')) {
    html = html.replace(/if \(!type\) \{(.*?)\}/s, 'if (!type) { configView.style.display = "block"; trackingView.style.display = "none"; renderCatMenu(); renderConfigMenu(); }');
}

fs.writeFileSync('cliente.html', html);
