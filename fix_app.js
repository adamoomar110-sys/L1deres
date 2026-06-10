const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf-8');

const dynamicCategoriesCode = `
// --- GESTIÓN DE CATEGORÍAS DE VEHÍCULOS ---
const DEFAULT_VEHICLE_CATEGORIES = [
    { id: 'Auto', percentage: 0, icon: '🚗' },
    { id: 'SUV', percentage: 20, icon: '🚙' },
    { id: 'Camioneta', percentage: 50, icon: '🛻' }
];

let VEHICLE_CATEGORIES = [];

function initVehicleCategories() {
    const saved = localStorage.getItem('lavadero_vehicle_categories');
    if (saved) {
        VEHICLE_CATEGORIES = JSON.parse(saved);
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
            opt.innerText = \`\${cat.icon} \${cat.id} (\${cat.percentage >= 0 ? '+' : ''}\${cat.percentage}%)\`;
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
        tr.innerHTML = \`
            <td><strong>\${cat.id}</strong></td>
            <td>\${cat.percentage >= 0 ? '+' : ''}\${cat.percentage}%</td>
            <td>\${cat.icon}</td>
            <td>
                <button class="btn btn-secondary btn-sm text-red" onclick="deleteVehicleCategory(\${index})">Eliminar</button>
            </td>
        \`;
        tbody.appendChild(tr);
    });
}

window.addVehicleCategory = function() {
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
    if(window.calculateBudget) window.calculateBudget();
}

window.deleteVehicleCategory = function(index) {
    if(VEHICLE_CATEGORIES.length <= 1) {
        alert('Debe quedar al menos una categoría.');
        return;
    }
    VEHICLE_CATEGORIES.splice(index, 1);
    localStorage.setItem('lavadero_vehicle_categories', JSON.stringify(VEHICLE_CATEGORIES));
    renderVehicleCategoriesTable();
    updateCategorySelects();
    if(window.calculateBudget) window.calculateBudget();
}

// Override calculateBudget to use dynamic multipliers
window.calculateBudget = function() {
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
`;

// Inject into app.js
if (!js.includes('VEHICLE_CATEGORIES')) {
    js += '\n' + dynamicCategoriesCode + '\n';
    js += 'setTimeout(() => { initVehicleCategories(); }, 500);\n';
    fs.writeFileSync('app.js', js);
}
