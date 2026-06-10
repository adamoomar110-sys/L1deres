const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf-8');

// 1. DEFAULT_WASH_PACKAGES
content = content.replace(/^( {4}\{ id: '[^']+'.+?\})$/gm, '$1, active: true');

// 2. selectedWashType -> selectedWashTypes
content = content.replace("let selectedWashType = 'combo-limpieza-total';", "let selectedWashTypes = ['combo-limpieza-total'];");

// 3. elInputCategory
content = content.replace(
  "const elInputColor = document.getElementById('input-color');",
  "const elInputColor = document.getElementById('input-color');\nconst elInputCategory = document.getElementById('input-category');"
);

// 4. elFormRegister
content = content.replace(
  "const washType = selectedWashType;",
  "const washType = selectedWashTypes.join(',');"
).replace(
  "selectedWashType = 'combo-limpieza-total';",
  "selectedWashTypes = ['combo-limpieza-total'];"
).replace(
  "renderWashMenu();",
  "if(window.renderWashMenuOverride) window.renderWashMenuOverride(); else renderWashMenu();"
);

// 5. calculateETA
const calcEtaRegex = /function calculateETA\(\) \{[\s\S]*?\}\n/m;
const newCalcEta = `function calculateETA() {
    const esperaVehicles = activeVehicles.filter(v => v.zone === 'espera');
    const lavadoVehicles = activeVehicles.filter(v => v.zone === 'lavado');
    
    let etaMinutos = 0;

    esperaVehicles.forEach(car => {
        if (car.wash_type && car.wash_type.includes('express')) etaMinutos += 5;
        else if (car.wash_type && (car.wash_type.includes('interior') || car.wash_type.includes('aspirado'))) etaMinutos += 5;
        else if (car.wash_type && (car.wash_type.includes('chasis') || car.wash_type.includes('motor'))) etaMinutos += 20;
        else if (car.wash_type && car.wash_type.includes('ceramico')) etaMinutos += 45;
        else etaMinutos += 15;
    });

    if (lavadoVehicles.length > 0) {
        etaMinutos += 8;
    }

    if (etaMinutos === 0) {
        elEtaDisplay.innerText = "Sin Demoras ⚡";
        elEtaDisplay.className = "eta-value text-cyan";
    } else {
        elEtaDisplay.innerText = \`~ \${etaMinutos} MIN\`;
        elEtaDisplay.className = "eta-value text-yellow";
    }

    const elDensidadDisplay = document.getElementById('densidad-display');
    const elDensidadIcon = document.getElementById('densidad-icon');
    
    if (elDensidadDisplay && elDensidadIcon) {
        if (etaMinutos <= 15) {
            elDensidadDisplay.innerText = "Baja";
            elDensidadDisplay.className = "eta-value text-lime";
            elDensidadIcon.className = "text-lime";
        } else if (etaMinutos <= 45) {
            elDensidadDisplay.innerText = "Media";
            elDensidadDisplay.className = "eta-value text-yellow";
            elDensidadIcon.className = "text-yellow";
        } else {
            elDensidadDisplay.innerText = "Alta";
            elDensidadDisplay.className = "eta-value text-red";
            elDensidadIcon.className = "text-red";
        }
    }
}
`;
if(content.match(calcEtaRegex)) {
    content = content.replace(calcEtaRegex, newCalcEta);
}

// 6. renderWashMenuOverride
const menuOverride = `
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
        
        card.innerHTML = \`
            <div class="check-badge">✓</div>
            <div class="wash-icon">\${pkg.icon}</div>
            <div class="wash-details">
                <div class="wash-title">\${pkg.title}</div>
                <div class="wash-price">$\${pkg.price.toLocaleString('es-AR')}</div>
            </div>
        \`;
        
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
`;

content += menuOverride;

// 7. add openScannerModal mock and prices
const scannerModal = `
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
            }, 2500);
            
        }, 3000);
    }, 500);
}
`;
content += scannerModal;

fs.writeFileSync('app.js', content);
