'use client';
import { useState, useEffect } from 'react';
import { Wrench, Car, Clock, CheckCircle, ArrowRight, User, AlertTriangle, Calendar, DollarSign, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import VehicleSidePanel from '@/components/VehicleSidePanel';

export default function TallerAdmin() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedVehicleForPanel, setSelectedVehicleForPanel] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('/api/admin/flota'),
        supabase.from('service_orders').select('*').eq('provider_type', 'taller').eq('status', 'pending')
      ]);
      
      const fleetData = await vRes.json();
      if (vRes.ok) {
        setVehicles(fleetData.vehicles);
        setDrivers(fleetData.drivers);
      }
      if (sRes.data) {
        setServiceOrders(sRes.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchVehicleHistory = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
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
      const res = await fetch('/api/admin/flota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' })
      });
      if (res.ok) {
        // También marcar la orden como finalizada
        await supabase.from('service_orders').update({ status: 'completed' }).eq('vehicle_id', id).eq('provider_type', 'taller');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.brand.toLowerCase().includes(search.toLowerCase()) || 
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  return (    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight italic leading-none">Gestión de Taller</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Control de Reparaciones y Turnos</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl w-64 shadow-inner">
            <Search className="text-zinc-500" size={15} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar unidad..." 
              className="bg-transparent border-none focus:outline-none text-xs ml-2.5 w-full text-white placeholder-zinc-600 font-medium" 
            />
          </div>
          <Link href="/admin/flota" className="bg-yellow-500 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
            ENVIAR A TALLER
          </Link>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 border-3 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* UNIDADES EN REPARACIÓN */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Unidades Actualmente en Taller</h3>
              {vehicles.filter(v => v.status === 'maintenance').length === 0 ? (
                <div className="bg-zinc-900/10 border border-dashed border-white/5 rounded-2xl p-8 text-center">
                   <p className="text-zinc-600 text-xs font-bold italic">No hay unidades en reparación activa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vehicles.filter(v => v.status === 'maintenance').map(v => {
                    const order = serviceOrders.find(o => o.vehicle_id === v.id);
                    return (
                      <div key={v.id} className="bg-zinc-900/40 border border-yellow-500/30 rounded-2xl p-4 hover:bg-zinc-900/60 transition-all group relative overflow-hidden flex flex-col justify-between">
                         <div className="absolute top-3 right-3">
                            <div className="bg-yellow-500/20 text-yellow-500 p-2 rounded-xl border border-yellow-500/30">
                               <Wrench size={14} />
                            </div>
                         </div>
                         <div 
                          onClick={() => fetchVehicleHistory(v)}
                          className="cursor-pointer"
                         >
                            <div className="flex items-center gap-3 mb-4">
                               <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                                  <Car size={20} className="text-yellow-500" />
                                </div>
                               <div>
                                  <p className="text-base font-black text-white leading-none mb-0.5">{v.plate}</p>
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{v.brand} {v.model}</p>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                               <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                                     <Calendar size={11} /> Turno
                                  </div>
                                  <span className="text-xs font-bold text-white truncate">
                                     {order?.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'N/A'}
                                  </span>
                               </div>
                               <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                                     <DollarSign size={11} /> Presupuesto
                                  </div>
                                  <span className="text-xs font-bold text-yellow-500 truncate">
                                     ${order?.budget || '0.00'}
                                  </span>
                                </div>
                            </div>
                         </div>

                         <button 
                          onClick={() => handleSetReady(v.id)}
                          className="w-full py-2.5 bg-lime-500 text-black font-black rounded-xl shadow-md shadow-lime-500/20 hover:bg-lime-400 transition-all flex items-center justify-center gap-1.5 uppercase text-[11px] tracking-wider"
                         >
                            <CheckCircle size={15} /> Finalizar Reparación
                         </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RESTO DE LA FLOTA */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Toda la Flota (Monitor de Estado)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                 {filteredVehicles.filter(v => v.status !== 'maintenance').map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVehicleForPanel(v)}
                      className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 hover:bg-zinc-900/50 hover:border-white/10 transition-all cursor-pointer group"
                    >
                       <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-black text-white group-hover:text-yellow-500 transition-colors">{v.plate}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-lime-500 shadow-[0_0_6px_rgba(163,230,53,0.5)]' : 'bg-blue-500'}`} />
                       </div>
                       <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2 truncate">{v.brand} {v.model}</p>
                       <div className="text-[8px] font-black text-zinc-600 uppercase tracking-wider flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
                          Ver Historial <ArrowRight size={10} />
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL HISTORIAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-end p-0 md:p-6">
          <div className="bg-zinc-900 border-l border-white/10 w-full max-w-2xl h-full md:h-[90vh] md:rounded-[3rem] shadow-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
             {/* Modal Header */}
             <div className="p-6 md:p-10 border-b border-white/5 flex justify-between items-start">
                <div className="flex items-center gap-4 md:gap-6">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-white/5 shadow-2xl">
                      <Car size={32} className="text-yellow-500" />
                   </div>
                   <div>
                      <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">{selectedVehicle.plate}</h3>
                      <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest">{selectedVehicle.brand} {selectedVehicle.model}</p>
                   </div>
                </div>
                <button 
                  onClick={() => { setSelectedVehicle(null); setHistory([]); setDateRange({ from: '', to: '' }); }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-500 transition-all"
                >
                   <X />
                </button>
             </div>

             {/* Filters Bar */}
             <div className="px-6 py-4 md:px-10 md:py-6 bg-black/20 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 md:gap-6">
                <div className="flex items-center gap-2 md:gap-4">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-600 uppercase pl-1">Desde</p>
                      <input 
                        type="date" 
                        value={dateRange.from} 
                        onChange={e => setDateRange({...dateRange, from: e.target.value})}
                        className="bg-zinc-800 border border-white/5 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-white outline-none focus:border-yellow-500"
                      />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-600 uppercase pl-1">Hasta</p>
                      <input 
                        type="date" 
                        value={dateRange.to} 
                        onChange={e => setDateRange({...dateRange, to: e.target.value})}
                        className="bg-zinc-800 border border-white/5 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-white outline-none focus:border-yellow-500"
                      />
                   </div>
                </div>

                <div className="text-left md:text-right">
                   <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Inversión Total Periodo</p>
                   <p className="text-2xl md:text-3xl font-black text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.3)]">${totalSpent.toLocaleString()}</p>
                </div>
             </div>

             {/* History List */}
             <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                {loadingHistory ? (
                   <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" /></div>
                ) : filteredHistory.length === 0 ? (
                   <div className="text-center py-20 bg-black/20 rounded-[2rem] border border-dashed border-white/5">
                      <Clock size={32} className="mx-auto mb-4 text-zinc-700" />
                      <p className="text-zinc-500 font-bold italic text-sm">No se registran servicios en este periodo.</p>
                   </div>
                ) : (
                  filteredHistory.map((h, idx) => (
                    <div key={h.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:bg-zinc-900/60 transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 px-4 py-1 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest">
                          #{filteredHistory.length - idx}
                       </div>
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5">
                                <Calendar size={18} className="text-zinc-500" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-white">{new Date(h.created_at).toLocaleDateString()}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase">{h.provider_type}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-lime-400">${Number(h.budget).toLocaleString()}</p>
                             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Monto Individual</p>
                          </div>
                       </div>
                       <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                          <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">"{h.description}"</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {selectedVehicleForPanel && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={() => setSelectedVehicleForPanel(null)} />
          <VehicleSidePanel 
            vehicle={selectedVehicleForPanel} 
            onClose={() => setSelectedVehicleForPanel(null)} 
            onUpdate={() => { fetchData(); }}
          />
        </>
      )}
    </div>
  );
}

// Helper icons
function X() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
