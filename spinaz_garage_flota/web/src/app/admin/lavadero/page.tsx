'use client';
import { useState, useEffect } from 'react';
import { Waves, Car, CheckCircle, Search, DollarSign, Calendar, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LavaderoAdmin() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [washPrice, setWashPrice] = useState<number>(5000);
  const [newPriceInput, setNewPriceInput] = useState<string>('5000');
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    fetchData();
    fetchWashPrice();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('/api/admin/flota'),
        supabase.from('service_orders').select('*').eq('provider_type', 'lavadero').eq('status', 'pending')
      ]);
      
      const fleetData = await vRes.json();
      if (vRes.ok) {
        setVehicles(fleetData.vehicles || []);
        setDrivers(fleetData.drivers || []);
      }
      if (sRes.data) {
        setServiceOrders(sRes.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchWashPrice = async () => {
    try {
      const res = await fetch('/api/admin/wash-price');
      const data = await res.json();
      if (res.ok && data.price) {
        setWashPrice(data.price);
        setNewPriceInput(String(data.price));
      }
    } catch (err) {
      console.error('Error cargando precio del lavado:', err);
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      const res = await fetch('/api/admin/wash-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(newPriceInput) })
      });
      const data = await res.json();
      if (res.ok) {
        setWashPrice(data.price);
        alert('🎉 Precio del lavado actualizado con éxito');
      } else {
        throw new Error(data.error || 'Error al guardar');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setSavingPrice(false);
  };

  const handleSetReady = async (id: string) => {
    try {
      const res = await fetch('/api/admin/flota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' })
      });
      if (res.ok) {
        await supabase.from('service_orders').update({ status: 'completed' }).eq('vehicle_id', id).eq('provider_type', 'lavadero');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate?.toLowerCase().includes(search.toLowerCase()) || 
    v.brand?.toLowerCase().includes(search.toLowerCase()) || 
    v.model?.toLowerCase().includes(search.toLowerCase())
  );

  const lavaderoVehicles = vehicles.filter(v => v.status === 'lavadero');

  return (
    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight italic leading-none flex items-center gap-2">
             <Waves className="text-cyan-400" size={20} /> Lavadero de Autos
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Control de Limpieza y Tarifas Estándar</p>
        </div>
        
        <div className="flex items-center bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl w-64 shadow-inner">
          <Search className="text-zinc-500 shrink-0" size={15} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar patente..." 
            className="bg-transparent border-none focus:outline-none text-xs ml-2.5 w-full text-white placeholder-zinc-600 font-medium" 
          />
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* TARJETA CONFIGURACIÓN PRECIO DEL LAVADO */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-black border border-cyan-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/10 rounded-md border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-wider mb-1">
                <DollarSign size={10} /> Tarifa Estándar
              </div>
              <h3 className="text-base font-black text-white italic tracking-tight">Precio del Lavado</h3>
              <p className="text-zinc-400 text-xs font-medium">
                Valor predeterminado por servicio de lavado de unidad.
              </p>
            </div>

            <form onSubmit={handleSavePrice} className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
              <div className="flex items-center px-3">
                <span className="text-base font-black text-cyan-400 mr-1">$</span>
                <input 
                  type="number"
                  value={newPriceInput}
                  onChange={e => setNewPriceInput(e.target.value)}
                  className="bg-transparent text-base font-black text-white w-24 outline-none"
                  placeholder="5000"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={savingPrice}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                <Save size={13} /> {savingPrice ? '...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* UNIDADES EN LAVADERO */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Unidades Actualmente en Lavadero ({lavaderoVehicles.length})</h3>
              {lavaderoVehicles.length === 0 ? (
                <div className="bg-zinc-900/10 border border-dashed border-white/5 rounded-2xl p-8 text-center">
                   <p className="text-zinc-600 text-xs font-bold italic">No hay unidades en el lavadero en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {lavaderoVehicles.map(v => {
                    const order = serviceOrders.find(o => o.vehicle_id === v.id);
                    return (
                      <div key={v.id} className="bg-zinc-900/40 border border-cyan-500/30 rounded-2xl p-4 hover:bg-zinc-900/60 transition-all group relative overflow-hidden flex flex-col justify-between">
                         <div className="absolute top-3 right-3">
                            <div className="bg-cyan-500/20 text-cyan-400 p-2 rounded-xl border border-cyan-500/30">
                               <Waves size={14} />
                            </div>
                         </div>

                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                               <Car size={20} className="text-cyan-400" />
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
                                  {order?.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'Hoy'}
                               </span>
                            </div>
                            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-0.5">
                               <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                                  <DollarSign size={11} /> Costo
                                </div>
                               <span className="text-xs font-bold text-cyan-400 truncate">
                                  ${order?.budget || washPrice}
                               </span>
                            </div>
                         </div>

                         <button 
                          onClick={() => handleSetReady(v.id)}
                          className="w-full py-2.5 bg-cyan-500 text-black font-black rounded-xl shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center justify-center gap-1.5 uppercase text-[11px] tracking-wider"
                         >
                            <CheckCircle size={15} /> Finalizar Lavado y Liberar
                         </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MONITOR GENERAL FLOTA */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Estado de la Flota</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                 {filteredVehicles.filter(v => v.status !== 'lavadero').map(v => (
                   <div key={v.id} className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 hover:bg-zinc-900/50 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                         <span className="text-sm font-black text-white">{v.plate}</span>
                         <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-lime-500 shadow-[0_0_6px_rgba(163,230,53,0.5)]' : 'bg-cyan-500'}`} />
                      </div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2 truncate">{v.brand} {v.model}</p>
                      <Link href="/admin/flota" className="text-[9px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1 hover:underline">
                         Lavadero
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
