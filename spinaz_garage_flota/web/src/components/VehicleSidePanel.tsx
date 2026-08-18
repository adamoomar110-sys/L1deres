'use client';
import { useState, useEffect } from 'react';
import { X, Settings, History, Plus, Save, Activity } from 'lucide-react';

export default function VehicleSidePanel({ vehicle, onClose, onUpdate }: { vehicle: any, onClose: () => void, onUpdate: () => void }) {
  const [metrics, setMetrics] = useState(vehicle.metrics || {
    mileage: '0',
    fuel_level: '100',
    tire_pressure: 'Óptima',
    battery_status: '100',
    next_service_km: '10000',
    avg_consumption: '8.5'
  });
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [newLog, setNewLog] = useState({ type: 'inspection', description: '' });
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [vehicle.id]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/vehicles/logs?vehicle_id=${vehicle.id}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error(e);
    }
    setLoadingLogs(false);
  };

  const handleSaveMetrics = async () => {
    try {
      const res = await fetch('/api/admin/vehicles/metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vehicle.id, metrics })
      });
      if (res.ok) {
        setIsEditingMetrics(false);
        onUpdate();
      }
    } catch (e) {
      alert('Error guardando métricas');
    }
  };

  const handleAddLog = async () => {
    if (!newLog.description) return;
    setSavingLog(true);
    try {
      const res = await fetch('/api/admin/vehicles/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicle.id, ...newLog })
      });
      if (res.ok) {
        setNewLog({ type: 'inspection', description: '' });
        fetchLogs();
      }
    } catch (e) {
      alert('Error añadiendo registro');
    }
    setSavingLog(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-zinc-950 border-l border-white/10 shadow-2xl z-[200] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
        <div>
          <h2 className="text-2xl font-black text-white italic">{vehicle.plate}</h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{vehicle.brand} {vehicle.model}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 bg-white/5 rounded-full"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* METRICS SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={14} className="text-yellow-500" />
              Monitor de Estado
            </h3>
            <button 
              onClick={() => isEditingMetrics ? handleSaveMetrics() : setIsEditingMetrics(true)} 
              className="text-xs font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
            >
              {isEditingMetrics ? <><Save size={14} /> Guardar</> : <><Settings size={14} /> Editar</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'mileage', label: 'Kilometraje (km)', type: 'number' },
              { key: 'fuel_level', label: 'Combustible (%)', type: 'number' },
              { key: 'tire_pressure', label: 'Neumáticos', type: 'text' },
              { key: 'battery_status', label: 'Batería (%)', type: 'number' },
              { key: 'next_service_km', label: 'Próx. Servicio (km)', type: 'number' },
              { key: 'avg_consumption', label: 'Consumo (L/100km)', type: 'text' },
            ].map((m) => (
              <div key={m.key} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-2">{m.label}</p>
                {isEditingMetrics ? (
                  <input 
                    type={m.type}
                    value={metrics[m.key] || ''}
                    onChange={(e) => setMetrics({...metrics, [m.key]: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-yellow-500 outline-none"
                  />
                ) : (
                  <p className="text-lg font-black text-white">{metrics[m.key] || '-'}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* HISTORY SECTION */}
        <section>
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
            <History size={14} className="text-blue-500" />
            Historial de Mantenimiento
          </h3>

          <div className="bg-zinc-900/30 p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
            <div className="flex gap-2">
              <select 
                value={newLog.type} 
                onChange={e => setNewLog({...newLog, type: e.target.value})}
                className="bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-bold text-zinc-300 outline-none w-1/3"
              >
                <option value="inspection">Inspección</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="incident">Incidente</option>
              </select>
              <input 
                type="text" 
                placeholder="Descripción del evento..." 
                value={newLog.description}
                onChange={e => setNewLog({...newLog, description: e.target.value})}
                className="bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none flex-1"
              />
              <button 
                onClick={handleAddLog} 
                disabled={savingLog || !newLog.description}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-400 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loadingLogs ? (
              <p className="text-xs text-zinc-500 italic text-center">Cargando historial...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold italic text-center">No hay registros en el historial.</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-16px] before:w-[2px] before:bg-white/5 last:before:hidden">
                  <div className={`absolute left-[5px] top-2 w-[10px] h-[10px] rounded-full ring-4 ring-zinc-950 ${log.type === 'incident' ? 'bg-red-500' : log.type === 'maintenance' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                  <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {log.type === 'incident' ? 'Incidente' : log.type === 'maintenance' ? 'Mantenimiento' : 'Inspección'}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-bold">{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{log.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
