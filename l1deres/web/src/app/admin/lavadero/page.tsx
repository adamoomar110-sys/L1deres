'use client';
import { useState, useEffect } from 'react';
import { Waves, Car, Clock, CheckCircle, Calendar, DollarSign, Search, X, Trash2, Plus, Monitor } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';



export default function LavaderoAdmin() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes, qRes] = await Promise.all([
        supabase.from('lavadero_camera_queue').select('*').order('created_at', { ascending: true }),
        supabase.from('service_orders').select('*').eq('status', 'pending'),
        supabase.from('lavadero_camera_queue').select('*').order('created_at', { ascending: true })
      ]);

      if (vRes.data) setVehicles(vRes.data.filter((v: any) => v.zone === 'lavado'));
      if (sRes.data) setServiceOrders(sRes.data);
      if (qRes.data) setQueue(qRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddQueueCar = async () => {
    const nombres = ["Rayo", "Toro", "Halcón", "Puma", "Tigre", "Furia", "Centella", "Cometa", "Flecha", "Viento", "Cobra", "Trueno", "Ciclón", "Pantera", "Lobo"];
    const adjetivos = ["Azul", "Rojo", "Gris", "Plata", "Verde", "Negro", "Dorado", "Feroz", "Veloz", "Oscuro", "Blanco", "Brillante", "Neon", "Rápido"];
    const colores = ["#06b6d4", "#84cc16", "#eab308", "#3b82f6", "#ef4444", "#a855f7", "#f97316"];
    
    const nickname = `${nombres[Math.floor(Math.random() * nombres.length)]} ${adjetivos[Math.floor(Math.random() * adjetivos.length)]}`;
    const color = colores[Math.floor(Math.random() * colores.length)];
    
    const { error } = await supabase.from('lavadero_camera_queue').insert([{
      tracking_id: Math.floor(Math.random() * 1000),
      nickname,
      zone: 'espera',
      color
    }]);
    
    if (error) console.error(error);
    
    const { data } = await supabase.from('lavadero_camera_queue').select('*').order('created_at', { ascending: true });
    if (data) setQueue(data);
  };

  const handleUpdateQueueZone = async (id: string, zone: string) => {
    await supabase.from('lavadero_camera_queue').update({ zone, entered_at: new Date().toISOString() }).eq('id', id);
    const { data } = await supabase.from('lavadero_camera_queue').select('*').order('created_at', { ascending: true });
    if (data) setQueue(data);
  };

  const handleDeleteQueueCar = async (id: string) => {
    await supabase.from('lavadero_camera_queue').delete().eq('id', id);
    const { data } = await supabase.from('lavadero_camera_queue').select('*').order('created_at', { ascending: true });
    if (data) setQueue(data);
  };

  const handleClearQueue = async () => {
    if (!confirm('¿Estás seguro de que deseas vaciar el visualizador de clientes por completo?')) return;
    await supabase.from('lavadero_camera_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setQueue([]);
  };

  const fetchVehicleHistory = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('service_orders')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (data) setHistory(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingHistory(false);
  };

  const filteredHistory = history.filter(h => {
    if (!dateRange.from && !dateRange.to) return true;
    const date = new Date(h.created_at);
    const from = dateRange.from ? new Date(dateRange.from) : new Date(0);
    const to = dateRange.to ? new Date(dateRange.to) : new Date();
    return date >= from && date <= to;
  });

  const totalSpent = filteredHistory.reduce((acc, curr) => acc + Number(curr.budget || 0), 0);

  const handleSetReady = async (id: string) => {
    try {
      await supabase
        .from('lavadero_camera_queue')
        .update({ zone: 'terminado', entered_at: new Date().toISOString() })
        .eq('id', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.brand.toLowerCase().includes(search.toLowerCase()) || 
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-orange-50">
      <header className="h-auto py-6 md:h-24 px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-200 bg-orange-100/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-black tracking-tighter flex items-center gap-3">
             <Waves className="text-orange-500" /> Control de Lavadero
          </h2>
          <p className="text-zinc-600 text-xs md:text-sm font-bold uppercase tracking-widest">Monitoreo y Auditoría del Lavadero L1deres</p>
        </div>
        
        <div className="flex items-center bg-white border border-orange-200 px-5 py-3 rounded-2xl w-full md:w-80 shadow-inner">
          <Search className="text-zinc-600 shrink-0" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar patente o modelo..." 
            className="bg-transparent border-none focus:outline-none text-xs md:text-sm ml-3 w-full text-black placeholder-zinc-600" 
          />
        </div>
      </header>

      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-orange-400/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {/* VEHÍCULOS EN LAVADERO ACTIVO */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] px-4">Vehículos Actualmente en el Lavadero</h3>
              {vehicles.filter(v => v.status === 'lavadero').length === 0 ? (
                <div className="bg-orange-100/10 border border-dashed border-orange-200 rounded-[2.5rem] p-12 text-center">
                   <p className="text-zinc-600 font-bold italic">No hay vehículos en el lavadero.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {vehicles.filter(v => v.status === 'lavadero').map(v => {
                    const order = serviceOrders.find(o => o.vehicle_id === v.id);
                    return (
                      <div key={v.id} className="bg-orange-100/60 border border-orange-400/30 rounded-[2.5rem] p-8 hover:bg-orange-100/80 transition-all group relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 p-4">
                            <div className="bg-orange-400 text-black p-3 rounded-2xl">
                               <Waves size={20} />
                            </div>
                         </div>

                         <div 
                          onClick={() => fetchVehicleHistory(v)}
                          className="cursor-pointer"
                         >
                            <div className="flex items-center gap-4 mb-8">
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-orange-200 shadow-inner">
                                  <Car size={32} className="text-orange-500" />
                               </div>
                               <div>
                                  <p className="text-2xl font-black text-black">{v.plate}</p>
                                  <p className="text-xs text-zinc-600 font-bold uppercase">{v.brand} {v.model}</p>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                               <div className="p-4 bg-white/40 rounded-2xl border border-orange-200 flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                     <Calendar size={12} /> Turno
                                  </div>
                                  <span className="text-xs font-bold text-black">
                                     {order?.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'Hoy'}
                                  </span>
                               </div>
                               <div className="p-4 bg-white/40 rounded-2xl border border-orange-200 flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                     <DollarSign size={12} /> Costo
                                  </div>
                                  <span className="text-xs font-bold text-orange-600">
                                     ${order?.budget || '0.00'}
                                  </span>
                                </div>
                            </div>
                         </div>

                         <button 
                          onClick={() => handleSetReady(v.id)}
                          className="w-full py-4 bg-orange-400 text-black font-black rounded-2xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                         >
                            <CheckCircle size={18} /> Finalizar y Liberar
                         </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SIMULADOR Y CONTROL DE FILA GAMIFICADA */}
            <div className="space-y-6 bg-white border border-orange-200 rounded-[2.5rem] p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-200 pb-6">
                <div>
                  <h3 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
                    <Monitor className="text-orange-500" /> Control del Visualizador de Clientes (Cámara)
                  </h3>
                  <p className="text-zinc-600 text-xs font-bold uppercase tracking-wider mt-1">
                    Simula la detección por cámara o gestiona la fila pública manualmente
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link 
                    href="/lavadero/pantalla" 
                    target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors text-xs font-black uppercase tracking-wider text-orange-600 font-bold"
                  >
                    <Monitor size={14} /> Pantalla Pública ↗
                  </Link>
                  <button 
                    onClick={handleAddQueueCar}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-400 text-black rounded-xl hover:bg-cyan-400 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={14} /> Añadir Auto
                  </button>
                  <button 
                    onClick={handleClearQueue}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-950/40 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-900/20 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    <Trash2 size={14} /> Limpiar Cola
                  </button>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-zinc-600 font-bold italic text-sm">No hay vehículos en la cola del visualizador público. Presiona "Añadir Auto" o inicia el script de la cámara.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {queue.map((q) => (
                    <div key={q.id} className="bg-white/40 border border-orange-200 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-5 h-5 rounded-full border border-orange-300 shadow-inner" 
                            style={{ backgroundColor: q.color }}
                          />
                          <span className="font-bold text-sm text-black">{q.nickname}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteQueueCar(q.id)}
                          className="p-2 text-zinc-600 hover:text-red-500 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-orange-200">
                        {(['espera', 'lavado', 'terminado'] as const).map((z) => (
                          <button
                            key={z}
                            onClick={() => handleUpdateQueueZone(q.id, z)}
                            className={`py-2 px-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                              q.zone === z 
                                ? z === 'espera' 
                                  ? 'bg-green-400/20 text-green-600 border border-green-400/30'
                                  : z === 'lavado'
                                  ? 'bg-orange-400/20 text-orange-600 border border-orange-400/30'
                                  : 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                                : 'text-zinc-600 hover:text-zinc-300'
                            }`}
                          >
                            {z === 'espera' ? 'Espera' : z === 'lavado' ? 'Lavado' : 'Listo'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DRAWER DE HISTORIAL Y AUDITORÍA DE COSTOS */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex items-center justify-end p-0 md:p-6">
          <div className="bg-orange-100 border-l border-orange-200 w-full max-w-2xl h-full md:h-[90vh] md:rounded-[3rem] shadow-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 text-black">
             <div className="p-6 md:p-10 border-b border-orange-200 flex justify-between items-start">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center border border-orange-200 shadow-2xl">
                      <Waves size={30} className="text-orange-500" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-black tracking-tighter italic uppercase">{selectedVehicle.plate}</h3>
                      <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">{selectedVehicle.brand} {selectedVehicle.model}</p>
                   </div>
                </div>
                <button onClick={() => { setSelectedVehicle(null); setHistory([]); }} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-600 transition-all">
                   <X size={20} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12">
                {/* FILTROS DE HISTORIAL Y GASTO */}
                <div className="bg-zinc-950 border border-orange-200 rounded-[2rem] p-8 space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-zinc-700 uppercase tracking-widest">Auditoría de Gastos</h4>
                      <span className="text-2xl font-black text-orange-600">${totalSpent.toLocaleString()}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Desde</label>
                         <input 
                           type="date" 
                           value={dateRange.from} 
                           onChange={e => setDateRange({...dateRange, from: e.target.value})}
                           className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-orange-400 font-bold" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Hasta</label>
                         <input 
                           type="date" 
                           value={dateRange.to} 
                           onChange={e => setDateRange({...dateRange, to: e.target.value})}
                           className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-orange-400 font-bold" 
                         />
                      </div>
                   </div>
                </div>

                {/* LISTA DE ÓRDENES */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] px-4">Historial de Trabajos</h4>
                   <div className="space-y-4">
                      {loadingHistory ? (
                         <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-orange-400/20 border-t-cyan-500 rounded-full animate-spin" /></div>
                      ) : filteredHistory.length === 0 ? (
                         <p className="text-center text-zinc-600 italic py-10">Sin trabajos en el rango seleccionado.</p>
                      ) : (
                        filteredHistory.map(h => (
                           <div key={h.id} className="bg-white/5 border border-orange-200 rounded-3xl p-6 flex justify-between items-center group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-600">
                                    <Calendar size={18} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-black">{new Date(h.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{h.description || 'Lavado de unidad'}</p>
                                    <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-zinc-700 font-bold uppercase">{h.provider_type}</span>
                                 </div>
                              </div>
                              <p className="text-sm font-black text-orange-600">${Number(h.budget).toLocaleString()}</p>
                           </div>
                        ))
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
