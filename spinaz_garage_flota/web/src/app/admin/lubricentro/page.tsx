'use client';
import { useState, useEffect } from 'react';
import { Droplets, Car, Clock, CheckCircle, ArrowRight, Calendar, DollarSign, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LubricentroAdmin() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('/api/admin/flota'),
        supabase.from('service_orders').select('*').eq('provider_type', 'lubricentro').eq('status', 'pending')
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

  const handleSetReady = async (id: string) => {
    try {
      const res = await fetch('/api/admin/flota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' })
      });
      if (res.ok) {
        await supabase.from('service_orders').update({ status: 'completed' }).eq('vehicle_id', id).eq('provider_type', 'lubricentro');
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

  return (
    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight italic leading-none flex items-center gap-2">
             <Droplets className="text-blue-400" size={20} /> Lubricentro
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Control de Services y Mantenimiento Preventivo</p>
        </div>
        
        <div className="flex items-center bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl w-64 shadow-inner">
          <Search className="text-zinc-500 shrink-0" size={15} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar unidad..." 
            className="bg-transparent border-none focus:outline-none text-xs ml-2.5 w-full text-white placeholder-zinc-600 font-medium" 
          />
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* UNIDADES EN SERVICE */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Unidades en Service Activo</h3>
              {vehicles.filter(v => v.status === 'lubricentro').length === 0 ? (
                <div className="bg-zinc-900/10 border border-dashed border-white/5 rounded-2xl p-8 text-center">
                   <p className="text-zinc-600 text-xs font-bold italic">No hay unidades en el lubricentro.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vehicles.filter(v => v.status === 'lubricentro').map(v => {
                    const order = serviceOrders.find(o => o.vehicle_id === v.id);
                    return (
                      <div key={v.id} className="bg-zinc-900/40 border border-blue-500/30 rounded-2xl p-4 hover:bg-zinc-900/60 transition-all group relative overflow-hidden flex flex-col justify-between">
                         <div className="absolute top-3 right-3">
                            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-xl border border-blue-500/30">
                               <Droplets size={14} />
                            </div>
                         </div>

                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                               <Car size={20} className="text-blue-400" />
                            </div>
                            <div>
                               <p className="text-base font-black text-white leading-none mb-0.5">{v.plate}</p>
                               <p className="text-[10px] text-zinc-500 font-bold uppercase">{v.brand} {v.model}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-0.5">
                               <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                                  <Calendar size={11} /> Fecha
                               </div>
                               <span className="text-xs font-bold text-white truncate">
                                  {order?.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'Hoy'}
                               </span>
                            </div>
                            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-0.5">
                               <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                                  <DollarSign size={11} /> Costo
                               </div>
                               <span className="text-xs font-bold text-blue-400 truncate">
                                  ${order?.budget || '0.00'}
                                </span>
                            </div>
                         </div>

                         <button 
                          onClick={() => handleSetReady(v.id)}
                          className="w-full py-2.5 bg-blue-500 text-white font-black rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-400 transition-all flex items-center justify-center gap-1.5 uppercase text-[11px] tracking-wider"
                         >
                            <CheckCircle size={15} /> Finalizar Service
                         </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MONITOR GENERAL */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Estado de la Flota</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                 {filteredVehicles.filter(v => v.status !== 'lubricentro').map(v => (
                   <div key={v.id} className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 hover:bg-zinc-900/50 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                         <span className="text-sm font-black text-white">{v.plate}</span>
                         <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-lime-500 shadow-[0_0_6px_rgba(163,230,53,0.5)]' : 'bg-yellow-500'}`} />
                      </div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2 truncate">{v.brand} {v.model}</p>
                      <Link href="/admin/flota" className="text-[9px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1 hover:underline">
                         Service <Settings size={10} />
                      </Link>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
