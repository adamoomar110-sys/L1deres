const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Add Sidebar Button
const sidebarBtn = `
                <button class="nav-btn" data-target="view-finanzas" title="Finanzas">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>Finanzas</span>
                </button>
                <button class="nav-btn" data-target="view-precios" title="Precios">`;

html = html.replace(/<button class="nav-btn" data-target="view-precios" title="Precios">/, sidebarBtn);

// 2. Add view-finanzas section
const newView = `
        <!-- VISTA FINANZAS Y ADMINISTRACION -->
        <div id="view-finanzas" class="view-section hidden">
            <div class="panel-header" style="margin-bottom: 2rem;">
                <div class="panel-title-group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <h3>Administración y Finanzas</h3>
                </div>
            </div>

            <div class="operator-layout" style="grid-template-columns: 1fr 1fr;">
                <!-- SECCION GASTOS -->
                <div class="operator-queue-list">
                    <form id="form-gastos" class="operator-form">
                        <h4 class="form-title" style="color: var(--color-yellow)">Registrar Gasto o Deuda</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Concepto / Detalle</label>
                                <input type="text" id="gasto-detalle" placeholder="Ej: Shampoo x20L, Factura Luz" required>
                            </div>
                            <div class="form-group">
                                <label>Monto ($)</label>
                                <input type="number" id="gasto-monto" required min="1">
                            </div>
                            <div class="form-group">
                                <label>Estado</label>
                                <select id="gasto-estado" style="width: 100%" class="select-zone-dropdown">
                                    <option value="Pagado">Pagado</option>
                                    <option value="Deuda">Deuda Pendiente</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-secondary w-full" style="color: var(--color-yellow); border-color: var(--color-yellow)">+ Cargar Gasto</button>
                    </form>

                    <div class="table-container" style="margin-top: 1rem; max-height: 250px;">
                        <table class="operator-table" id="table-gastos">
                            <thead><tr><th>Fecha</th><th>Detalle</th><th>Monto</th><th>Estado</th></tr></thead>
                            <tbody id="gastos-tbody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- SECCION SUELDOS -->
                <div class="operator-queue-list">
                    <form id="form-sueldos" class="operator-form">
                        <h4 class="form-title" style="color: var(--color-cyan)">Pago de Sueldos</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Empleado</label>
                                <select id="sueldo-empleado" required class="select-zone-dropdown" style="width: 100%">
                                    <option value="">Seleccione empleado...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Monto a Pagar ($)</label>
                                <input type="number" id="sueldo-monto" required min="1">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary w-full">+ Registrar Pago</button>
                    </form>

                    <div class="table-container" style="margin-top: 1rem; max-height: 250px;">
                        <table class="operator-table" id="table-sueldos">
                            <thead><tr><th>Fecha</th><th>Empleado</th><th>Monto Pagado</th></tr></thead>
                            <tbody id="sueldos-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="eta-card" style="margin-top: 2rem; display: flex; justify-content: center; background-color: rgba(16, 185, 129, 0.1); border-color: var(--color-lime);">
                <div class="eta-info" style="text-align: center;">
                    <span class="eta-label" style="font-size: 1.2rem;">Ganancia Neta (Ingresos - Gastos - Sueldos Pagados)</span>
                    <span id="ganancia-neta-display" class="eta-value" style="font-size: 3rem; color: var(--color-lime)">$0</span>
                </div>
            </div>
        </div>
`;

// Insert the new view before the </main> or at the end of view-sections
html = html.replace('<!-- PANEL DE OPERACIÓN Y GESTIÓN -->', newView + '\n        <!-- PANEL DE OPERACIÓN Y GESTIÓN -->');

fs.writeFileSync('index.html', html);

let appJs = fs.readFileSync('app.js', 'utf-8');

const logicCode = `
// ================= FINANZAS Y ADMINISTRACION =================
let FINANZAS = {
    gastos: [],
    sueldos: []
};

function initFinanzas() {
    const saved = localStorage.getItem('lavadero_finanzas');
    if (saved) {
        FINANZAS = JSON.parse(saved);
    }
    renderFinanzas();
    populateEmpleadosSueldos();
}

function saveFinanzas() {
    localStorage.setItem('lavadero_finanzas', JSON.stringify(FINANZAS));
    updateRevenueDisplay();
}

function renderFinanzas() {
    const gastosTbody = document.getElementById('gastos-tbody');
    const sueldosTbody = document.getElementById('sueldos-tbody');
    
    if(gastosTbody) {
        gastosTbody.innerHTML = '';
        FINANZAS.gastos.forEach(g => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td>\${g.fecha}</td>
                <td>\${g.detalle}</td>
                <td>$\${g.monto.toLocaleString('es-AR')}</td>
                <td style="color: \${g.estado === 'Pagado' ? 'var(--color-lime)' : 'var(--color-yellow)'}">\${g.estado}</td>
            \`;
            gastosTbody.appendChild(tr);
        });
    }
    
    if(sueldosTbody) {
        sueldosTbody.innerHTML = '';
        FINANZAS.sueldos.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td>\${s.fecha}</td>
                <td>\${s.empleado}</td>
                <td>$\${s.monto.toLocaleString('es-AR')}</td>
            \`;
            sueldosTbody.appendChild(tr);
        });
    }
    
    updateRevenueDisplay();
}

function populateEmpleadosSueldos() {
    const select = document.getElementById('sueldo-empleado');
    if(!select) return;
    select.innerHTML = '<option value="">Seleccione empleado...</option>';
    
    // Extraer empleados unicos del registro de horas
    const unicos = [...new Set(EMPLOYEE_RECORDS.map(e => e.name))];
    unicos.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp;
        opt.innerText = emp;
        select.appendChild(opt);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const formGastos = document.getElementById('form-gastos');
    if(formGastos) {
        formGastos.addEventListener('submit', (e) => {
            e.preventDefault();
            const detalle = document.getElementById('gasto-detalle').value;
            const monto = parseFloat(document.getElementById('gasto-monto').value);
            const estado = document.getElementById('gasto-estado').value;
            
            FINANZAS.gastos.push({
                fecha: new Date().toLocaleDateString('es-AR'),
                detalle,
                monto,
                estado
            });
            saveFinanzas();
            renderFinanzas();
            formGastos.reset();
        });
    }
    
    const formSueldos = document.getElementById('form-sueldos');
    if(formSueldos) {
        formSueldos.addEventListener('submit', (e) => {
            e.preventDefault();
            const empleado = document.getElementById('sueldo-empleado').value;
            const monto = parseFloat(document.getElementById('sueldo-monto').value);
            
            FINANZAS.sueldos.push({
                fecha: new Date().toLocaleDateString('es-AR'),
                empleado,
                monto
            });
            saveFinanzas();
            renderFinanzas();
            formSueldos.reset();
        });
    }
    
    initFinanzas();
});

// Update updateRevenueDisplay to calculate net
const oldRev = window.updateRevenueDisplay ? window.updateRevenueDisplay.toString() : '';
`;

if (!appJs.includes('FINANZAS = {')) {
    appJs += '\n' + logicCode;
}

// Modify updateRevenueDisplay to update ganancia-neta-display
const oldUpdateRev = `function updateRevenueDisplay() {
    const realDisplay = document.getElementById('revenue-real-display');
    const projDisplay = document.getElementById('revenue-proj-display');
    
    const realTotal = vehicles.filter(v => v.lane === 'terminado').reduce((acc, curr) => acc + curr.budget, 0);
    const projTotal = vehicles.filter(v => v.lane !== 'terminado').reduce((acc, curr) => acc + curr.budget, 0);
    
    if (realDisplay) realDisplay.innerText = '$' + realTotal.toLocaleString('es-AR');
    if (projDisplay) projDisplay.innerText = '$' + projTotal.toLocaleString('es-AR');
}`;

const newUpdateRev = `function updateRevenueDisplay() {
    const realDisplay = document.getElementById('revenue-real-display');
    const projDisplay = document.getElementById('revenue-proj-display');
    const netaDisplay = document.getElementById('ganancia-neta-display');
    
    const realTotal = vehicles.filter(v => v.lane === 'terminado').reduce((acc, curr) => acc + curr.budget, 0);
    const projTotal = vehicles.filter(v => v.lane !== 'terminado').reduce((acc, curr) => acc + curr.budget, 0);
    
    if (realDisplay) realDisplay.innerText = '$' + realTotal.toLocaleString('es-AR');
    if (projDisplay) projDisplay.innerText = '$' + projTotal.toLocaleString('es-AR');
    
    // Calcular ganancia neta
    if (netaDisplay && typeof FINANZAS !== 'undefined') {
        const gastosPagados = FINANZAS.gastos.filter(g => g.estado === 'Pagado').reduce((acc, curr) => acc + curr.monto, 0);
        const sueldosPagados = FINANZAS.sueldos.reduce((acc, curr) => acc + curr.monto, 0);
        const neta = realTotal - gastosPagados - sueldosPagados;
        netaDisplay.innerText = '$' + neta.toLocaleString('es-AR');
        netaDisplay.style.color = neta >= 0 ? 'var(--color-lime)' : '#ef4444'; // Red if negative
    }
}`;

appJs = appJs.replace(oldUpdateRev, newUpdateRev);

// Fix populateEmpleadosSueldos being called from saveEmployeeRecord
appJs = appJs.replace(/saveEmployeeRecord\(\);/, 'saveEmployeeRecord();\n    if(typeof populateEmpleadosSueldos === "function") populateEmpleadosSueldos();');

fs.writeFileSync('app.js', appJs);
console.log('Finanzas UI and Logic created.');
