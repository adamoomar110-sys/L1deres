import os

filepath = r"C:\Users\trabajo ia\.gemini\antigravity-ide\scratch\lavadero-de-lujo\index.html"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

insertion = """
                <!-- LISTA DE SEGUIMIENTO OPERATIVO -->
                <div class="operator-queue-list">
                    <h4 class="form-title">Vehículos en Gestión Activa</h4>
                    <div class="table-container">
                        <table class="operator-table">
                            <thead>
                                <tr>
                                    <th>Vehículo</th>
                                    <th>Patente</th>
                                    <th>Presupuesto</th>
                                    <th>Zona Actual</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody id="operator-table-body">
                                <!-- Las filas de gestión se insertarán aquí dinámicamente -->
                                <tr class="empty-table-row">
                                    <td colspan="5" style="text-align: center; color: var(--color-text-dim); font-style: italic; padding: 2rem 0;">
                                        Sin vehículos en circulación. Registra uno arriba para comenzar.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
        </div> <!-- Fin view-lavadero -->

        <!-- VISTA ECOSISTEMA MULTI-PANTALLAS -->
        <div id="view-ecosistema" class="view-section hidden">
            <div class="panel-header" style="margin-bottom: 2rem;">
                <div class="panel-title-group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    <h3>Gestión del Ecosistema de Pantallas</h3>
                </div>
                <p style="color: var(--color-text-dim); margin-top: 0.5rem;">Abra las pantallas en distintos dispositivos o pestañas para simular el sistema completo en red.</p>
            </div>
            
            <div class="operator-layout" style="grid-template-columns: repeat(2, 1fr);">
                <div class="operator-queue-list" style="text-align: center; padding: 3rem 2rem;">
                    <h2 style="color: var(--color-lime); font-family: var(--font-display); margin-bottom: 1rem;">1. Cartelería de Precios</h2>
                    <p style="color: var(--color-text-dim); margin-bottom: 2rem;">Pantalla pública sugerida para la entrada exterior. Muestra lista de precios actualizados.</p>
                    <a href="tv_precios.html" target="_blank" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem; display: inline-block; text-decoration: none;">Abrir en TV 🖥️</a>
                </div>
                
                <div class="operator-queue-list" style="text-align: center; padding: 3rem 2rem;">
                    <h2 style="color: var(--color-cyan); font-family: var(--font-display); margin-bottom: 1rem;">2. Tablet Recepción</h2>
                    <p style="color: var(--color-text-dim); margin-bottom: 2rem;">Punto de ingreso y cobro. Con escáner IA y selector de métodos de pago.</p>
                    <a href="tablet_ingreso.html" target="_blank" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem; display: inline-block; text-decoration: none;">Abrir en Tablet 📱</a>
                </div>
                
                <div class="operator-queue-list" style="text-align: center; padding: 3rem 2rem;">
                    <h2 style="color: var(--color-yellow); font-family: var(--font-display); margin-bottom: 1rem;">3. Tablet Taller Operativo</h2>
                    <p style="color: var(--color-text-dim); margin-bottom: 2rem;">Estación de trabajo para operarios. Permite avanzar los autos y marcar extras.</p>
                    <a href="tablet_taller.html" target="_blank" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem; display: inline-block; text-decoration: none;">Abrir en Tablet 📱</a>
                </div>
                
                <div class="operator-queue-list" style="text-align: center; padding: 3rem 2rem;">
                    <h2 style="color: #fff; font-family: var(--font-display); margin-bottom: 1rem;">4. TV Sala de Espera (Café)</h2>
                    <p style="color: var(--color-text-dim); margin-bottom: 2rem;">Monitor público tipo aeropuerto para que los clientes sigan el estado de su turno.</p>
                    <a href="tv_espera.html" target="_blank" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem; display: inline-block; text-decoration: none;">Abrir en TV 🖥️</a>
                </div>
            </div>
        </div>
        
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

        <!-- VISTA POSTULANTES -->
        <div id="view-postulantes" class="view-section hidden">
            <div class="panel-header" style="margin-bottom: 2rem;">
                <div class="panel-title-group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <h3>Gestión de Postulantes</h3>
                </div>
                <button id="btn-share-postular" class="btn btn-secondary btn-sm" onclick="copyPostularLink()" title="Copiar link para WhatsApp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Compartir Enlace
                </button>
            </div>
            <div class="operator-layout" style="grid-template-columns: 1fr;">
                <div class="operator-queue-list">
                    <h4 class="form-title">Candidatos Pendientes</h4>
                    <div class="table-container">
                        <table class="operator-table">
                            <thead>
                                <tr>
                                    <th>Selfie</th>
                                    <th>Nombre y DNI</th>
                                    <th>Contacto & Zona</th>
                                    <th>Experiencia & Disponibilidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="postulantes-tbody">
                                <!-- Filas de postulantes dinámicas -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- VISTA EMPLEADOS -->
        <div id="view-empleados" class="view-section hidden">
"""

# Insert this before line 242 (index 241)
lines.insert(241, insertion)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)
