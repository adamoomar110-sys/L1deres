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
      <header className="h-auto py-6 md:h-24 px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter flex items-center gap-3">
             <Droplets className="text-blue-500" /> Lubricentro
          </h2>
          <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest">Control de Services y Mantenimiento Preventivo</p>
        </div>
        
        <div className="flex items-center bg-black/50 border border-white/10 px-5 py-3 rounded-2xl w-full md:w-80 shadow-inner">
          <Search className="text-zinc-500 shrink-0" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar unidad..." 
            className="bg-transparent border-none focus:outline-none text-xs md:text-sm ml-3 w-full text-white placeholder-zinc-600" 
          />
        </div>
      </header>

      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {/* UNIDADES EN SERVICE (HIGHLIGHTED) */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] px-4">Unidades en Service Activo</h3>
              {vehicles.filter(v => v.status === 'lubricentro').length === 0 ? (
                <div className="bg-zinc-900/10 border border-dashed border-white/5 rounded-[2.5rem] p-12 text-center">
                   <p className="text-zinc-600 font-bold italic">No hay unidades en el lubricentro.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {vehicles.filter(v => v.status === 'lubricentro').map(v => {
                    const order = serviceOrders.find(o => o.vehicle_id === v.id);
                    return (
                      <div key={v.id} className="bg-zinc-900/60 border border-blue-500/30 rounded-[2.5rem] p-8 hover:bg-zinc-900/80 transition-all group relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 p-4">
                            <div className="bg-blue-500 text-white p-3 rounded-2xl">
                               <Droplets size={20} />
                            </div>
                         </div>

                         <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                               <Car size={32} className="text-blue-500" />
                            </div>
                            <div>
                               <p className="text-2xl font-black text-white">{v.plate}</p>
                               <p className="text-xs text-zinc-500 font-bold uppercase">{v.brand} {v.model}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                  <Calendar size={12} /> Fecha
                               </div>
                               <span className="text-xs font-bold text-white">
                                  {order?.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'Hoy'}
                               </span>
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                  <DollarSign size={12} /> Costo
                               </div>
                               <span className="text-xs font-bold text-blue-400">
                                  ${order?.budget || '0.00'}
                               </span>
                            </div>
                         </div>

                         <button 
                          onClick={() => handleSetReady(v.id)}
                          className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                         >
                            <CheckCircle size={18} /> Finalizar Service
                         </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MONITOR GENERAL */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] px-4">Estado de la Flota</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {filteredVehicles.filter(v => v.status !== 'lubricentro').map(v => (
                   <div key={v.id} className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 hover:bg-zinc-900/40 transition-all">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-lg font-black text-white">{v.plate}</span>
                         <div className={`w-2 h-2 rounded-full ${v.status === 'active' ? 'bg-lime-500 shadow-[0_0_8px_rgba(163,230,53,0.5)]' : 'bg-yellow-500'}`} />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4">{v.brand} {v.model}</p>
                      <Link href="/admin/flota" className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 hover:underline">
                         Programar Service <Settings size={12} />
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
