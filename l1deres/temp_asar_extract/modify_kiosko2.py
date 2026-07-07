import re

with open('kiosko.html', 'r', encoding='utf-8') as f:
    content = f.read()

renderQueue_new = """            function renderZoneGrid(gridId, vehicles, emptyMsg, slotCount = 0) {
                const grid = document.getElementById(gridId);
                if (!grid) return;
                
                if (vehicles.length === 0 && slotCount === 0) {
                    grid.innerHTML = `<div class="queue-empty-msg" style="grid-column:span 2; padding: 1rem; font-size:0.9rem">
                        <i class="fa-solid fa-car" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3"></i>
                        ${emptyMsg}
                    </div>`;
                    return;
                }
                
                let html = '';
                const totalSlots = Math.max(vehicles.length, slotCount);
                for (let i = 0; i < totalSlots; i++) {
                    if (i < vehicles.length) {
                        const car = vehicles[i];
                        const mins = (gridId === 'grid-espera') ? (i + 1) * MINS_PER_CAR : 0;
                        const colorHex = car.color || '#06b6d4';
                        const name = car.nickname || `Auto ${i+1}`;
                        html += `
                        <div class="queue-car-card">
                            <div class="queue-car-name">${name}</div>
                            ${mins > 0 ? `<div class="queue-car-time">${mins} min</div>` : ''}
                            <div style="margin-top:0.5rem;display:flex;justify-content:center;gap:10px">
                                <div style="width:12px;height:12px;border-radius:50%;background:${colorHex}"></div>
                            </div>
                        </div>`;
                    } else if (slotCount > 0) {
                        html += `<div class="queue-car-card slot-empty"><div style="font-size:1.4rem;opacity:0.4">${i + 1}</div></div>`;
                    }
                }
                grid.innerHTML = html;
            }

            function renderQueuePanel(vehicles) {
                const preEspera = vehicles.filter(v => v.zone === 'pre_espera').sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                const espera = vehicles.filter(v => v.zone === 'espera').sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                const lavadoAspirado = vehicles.filter(v => v.zone === 'lavado' || v.zone === 'aspirado').sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at));
                const terminado = vehicles.filter(v => v.zone === 'terminado').sort((a, b) => new Date(b.entered_at) - new Date(a.entered_at));

                renderZoneGrid('grid-pre-espera', preEspera, 'Sin autos en ingreso', 4);
                renderZoneGrid('grid-espera', espera, 'Sin autos en espera', 8);
                renderZoneGrid('grid-lavado', lavadoAspirado, 'Sin autos procesándose');
                renderZoneGrid('grid-terminado', terminado, 'Sin autos terminados');
            }

"""

start = content.find("            function renderQueuePanel(vehicles) {")
end = content.find("            function renderStatusBar(vehicles) {", start)

if start != -1 and end != -1:
    content = content[:start] + renderQueue_new + content[end:]
    print("Replaced renderQueuePanel!")
    with open('kiosko.html', 'w', encoding='utf-8') as f:
        f.write(content)
else:
    print("Could not find start/end")
