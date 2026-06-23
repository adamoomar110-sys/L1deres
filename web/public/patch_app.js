const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

const regex = /function renderPostulantes\(\) \{[\s\S]*?\}\s*window\.contratarPostulante =/m;

const replacement = `async function renderPostulantes() {
    if (!tbodyPostulantes) return;
    
    let applicants = [];
    
    if (config.useSupabase) {
        // Cargar desde Supabase externa
        try {
            const data = await fetchSupabase('applicants?select=*&status=eq.pending');
            if (data && Array.isArray(data)) {
                applicants = data;
            }
        } catch(e) { console.error('Error cargando postulantes', e); }
    } else {
        // Tratamos de leer de localStorage
        const applicantsStr = localStorage.getItem('lavadero_applicants');
        applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.filter(a => a.status === 'pending');
    }

    tbodyPostulantes.innerHTML = '';

    if (applicants.length === 0) {
        tbodyPostulantes.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-dim);padding:2rem;">No hay postulantes pendientes en este momento.</td></tr>';
        return;
    }

    applicants.forEach(app => {
        const tr = document.createElement('tr');
        const imgSrc = app.selfie_url && app.selfie_url.length > 50 ? app.selfie_url : 'https://ui-avatars.com/api/?name='+encodeURIComponent(app.full_name)+'&background=06b6d4&color=fff';

        tr.innerHTML = \`
            <td>
                <img src="\${imgSrc}" alt="Selfie de \${app.full_name}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--color-cyan);">
            </td>
            <td>
                <div style="font-weight:bold; color:var(--color-cyan)">\${app.full_name}</div>
                <div style="font-size:0.85em; color:var(--color-text-dim)">DNI: \${app.dni} • \${app.age || '--'} años</div>
            </td>
            <td>
                <div><a href="https://wa.me/\${app.phone}" target="_blank" style="color:var(--color-lime); text-decoration:none;">\${app.phone}</a></div>
                <div style="font-size:0.85em; color:var(--color-text-dim)">\${app.zone || '--'}</div>
            </td>
            <td>
                <div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="\${app.app_experience || 'Sin experiencia'}">\${app.app_experience || 'Sin experiencia'}</div>
                <div style="font-size:0.85em; color:var(--color-yellow)">Disp: \${app.availability || '--'}</div>
            </td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="contratarPostulante('\${app.id}', '\${app.full_name}')" title="Contratar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rechazarPostulante('\${app.id}')" title="Rechazar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </td>
        \`;
        tbodyPostulantes.appendChild(tr);
    });
}

window.contratarPostulante = async function(id, name) {
    const role = prompt(\`¿Qué rol le asignarás a \${name}? (Ej: Lavador, Detallador, Encargado)\`, 'Lavador');
    if (role === null) return; // Cancelado

    // Mover a empleados
    const savedEmp = localStorage.getItem('lavadero_empleados');
    let empList = savedEmp ? JSON.parse(savedEmp) : [];
    empList.push({ id: Date.now(), name: name, role: role });
    localStorage.setItem('lavadero_empleados', JSON.stringify(empList));

    if (config.useSupabase) {
        await fetchSupabase(\`applicants?id=eq.\${id}\`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'hired' })
        });
    } else {
        const applicantsStr = localStorage.getItem('lavadero_applicants');
        let applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.map(a => {
            if (a.id === id) a.status = 'hired';
            return a;
        });
        localStorage.setItem('lavadero_applicants', JSON.stringify(applicants));
    }

    renderPostulantes();
    if(typeof renderEmpleados === 'function') renderEmpleados();
    
    if(typeof showFloatingToast === 'function') {
        showFloatingToast(\`\${name} contratado como \${role}!\`);
    } else {
        alert(\`\${name} fue contratado como \${role}!\`);
    }
}

window.rechazarPostulante = async function(id) {
    if(!confirm('¿Seguro que quieres rechazar y eliminar a este postulante?')) return;
    
    if (config.useSupabase) {
        await fetchSupabase(\`applicants?id=eq.\${id}\`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'rejected' })
        });
    } else {
        const applicantsStr = localStorage.getItem('lavadero_applicants');
        let applicants = applicantsStr ? JSON.parse(applicantsStr) : [];
        applicants = applicants.filter(a => a.id !== id);
        localStorage.setItem('lavadero_applicants', JSON.stringify(applicants));
    }
    
    renderPostulantes();
}

// Para evadir el match
window._dummyContratar =`;

appJs = appJs.replace(regex, replacement);
fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Parcheado con exito');
