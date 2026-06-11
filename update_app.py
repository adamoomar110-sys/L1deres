import os

filepath = r"C:\Users\trabajo ia\.gemini\antigravity-ide\scratch\lavadero-de-lujo\app.js"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update form-gastos submit listener
old_gastos = """            FINANZAS.gastos.push({
                fecha: new Date().toLocaleDateString('es-AR'),
                detalle,
                monto,
                estado
            });
            saveFinanzas();
            renderFinanzas();
            formGastos.reset();"""

new_gastos = """            const newGasto = {
                fecha: new Date().toLocaleDateString('es-AR'),
                detalle,
                monto,
                estado
            };
            FINANZAS.gastos.push(newGasto);
            saveFinanzas();
            renderFinanzas();
            formGastos.reset();
            
            // Sync Supabase
            if (config.useSupabase) {
                fetchSupabase('lavadero_gastos', { method: 'POST', body: JSON.stringify(newGasto) });
            }"""

content = content.replace(old_gastos, new_gastos)

# 2. Update form-sueldos submit listener
old_sueldos = """            FINANZAS.sueldos.push({
                fecha: new Date().toLocaleDateString('es-AR'),
                empleado,
                monto
            });
            saveFinanzas();
            renderFinanzas();
            formSueldos.reset();"""

new_sueldos = """            const newSueldo = {
                fecha: new Date().toLocaleDateString('es-AR'),
                empleado_nombre: empleado,
                monto
            };
            FINANZAS.sueldos.push({
                fecha: newGasto ? newGasto.fecha : new Date().toLocaleDateString('es-AR'), // fallback visual
                empleado,
                monto
            });
            saveFinanzas();
            renderFinanzas();
            formSueldos.reset();
            
            // Sync Supabase
            if (config.useSupabase) {
                fetchSupabase('lavadero_sueldos', { method: 'POST', body: JSON.stringify(newSueldo) });
            }"""

# Actually let's fix that little bug in newSueldo local representation
new_sueldos = """            const newSueldo = {
                fecha: new Date().toLocaleDateString('es-AR'),
                empleado_nombre: empleado,
                monto
            };
            FINANZAS.sueldos.push({
                fecha: newSueldo.fecha,
                empleado,
                monto
            });
            saveFinanzas();
            renderFinanzas();
            formSueldos.reset();
            
            // Sync Supabase
            if (config.useSupabase) {
                fetchSupabase('lavadero_sueldos', { method: 'POST', body: JSON.stringify(newSueldo) });
            }"""

content = content.replace(old_sueldos, new_sueldos)

# 3. Enhance syncFromSupabase()
old_sync = """async function syncFromSupabase() {
    if (!config.useSupabase) return;
    
    // Cambiar visualización
    elConnectionStatus.className = "connection-status supabase-active";
    elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";

    const data = await fetchSupabase(`${config.queueTable}?select=*&order=entered_at.asc`);
    if (data && Array.isArray(data)) {
        // Mapear los datos de Supabase a nuestro modelo local
        activeVehicles = data.map(dbCar => {
            let washType = 'combo-limpieza-total';
            if (dbCar.description) {
                for (const key in WASH_NAMES) {
                    if (dbCar.description.toLowerCase().includes(key.toLowerCase()) || 
                        dbCar.description.toLowerCase().includes(WASH_NAMES[key].toLowerCase())) {
                        washType = key;
                        break;
                    }
                }
            }
            return {
                id: dbCar.id,
                tracking_id: dbCar.tracking_id || Math.floor(Math.random() * 100),
                nickname: dbCar.nickname || 'Vehículo Especial',
                plate: dbCar.plate || '',
                color: dbCar.color || '#06b6d4',
                zone: dbCar.zone || 'espera',
                budget: dbCar.budget || 0,
                wash_type: dbCar.wash_type || washType,
                description: dbCar.description || '',
                entered_at: dbCar.entered_at || new Date().toISOString(),
                created_at: dbCar.created_at || new Date().toISOString()
            };
        });
        saveStateLocally(false); // Guardar copia local sin re-escribir a Supabase
        renderAll();
    }
}"""

new_sync = """async function syncFromSupabase() {
    if (!config.useSupabase) return;
    
    // Cambiar visualización
    if (elConnectionStatus) {
        elConnectionStatus.className = "connection-status supabase-active";
        elConnectionStatus.querySelector('.status-label').innerText = "Supabase Sincronizado";
    }

    try {
        // 1. Cargar cola de vehículos
        const data = await fetchSupabase(`${config.queueTable}?select=*&order=entered_at.asc`);
        if (data && Array.isArray(data)) {
            activeVehicles = data.map(dbCar => {
                let washType = 'combo-limpieza-total';
                if (dbCar.description) {
                    for (const key in WASH_NAMES) {
                        if (dbCar.description.toLowerCase().includes(key.toLowerCase()) || 
                            dbCar.description.toLowerCase().includes(WASH_NAMES[key].toLowerCase())) {
                            washType = key;
                            break;
                        }
                    }
                }
                return {
                    id: dbCar.id,
                    tracking_id: dbCar.tracking_id || Math.floor(Math.random() * 100),
                    nickname: dbCar.nickname || 'Vehículo Especial',
                    plate: dbCar.plate || '',
                    color: dbCar.color || '#06b6d4',
                    zone: dbCar.zone || 'espera',
                    budget: dbCar.budget || 0,
                    wash_type: dbCar.wash_type || washType,
                    description: dbCar.description || '',
                    entered_at: dbCar.entered_at || new Date().toISOString(),
                    created_at: dbCar.created_at || new Date().toISOString()
                };
            });
            saveStateLocally(false);
            if(typeof renderAll === 'function') renderAll();
        }

        // 2. Cargar Finanzas (Gastos)
        const gastosData = await fetchSupabase('lavadero_gastos');
        if (gastosData && Array.isArray(gastosData)) {
            FINANZAS.gastos = gastosData.map(g => ({
                fecha: g.fecha,
                detalle: g.detalle,
                monto: g.monto,
                estado: g.estado
            }));
        }

        // 3. Cargar Finanzas (Sueldos)
        const sueldosData = await fetchSupabase('lavadero_sueldos');
        if (sueldosData && Array.isArray(sueldosData)) {
            FINANZAS.sueldos = sueldosData.map(s => ({
                fecha: s.fecha,
                empleado: s.empleado_nombre,
                monto: s.monto
            }));
        }
        
        if ((gastosData && Array.isArray(gastosData)) || (sueldosData && Array.isArray(sueldosData))) {
            saveFinanzas();
            if(typeof renderFinanzas === 'function') renderFinanzas();
        }
    } catch(err) {
        console.error("Error sincronizando todas las tablas", err);
    }
}"""

content = content.replace(old_sync, new_sync)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Finished replacements")
