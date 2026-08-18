'use client';
import { useState, useEffect } from 'react';
import { Car, Clock, CheckCircle, LogOut, ChevronRight, Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import GlobalChat from '@/components/GlobalChat';
import Footer from '@/components/Footer';
import type { Vehicle, ServiceOrder, ServicePortalConfig } from '@/lib/types';

interface ServicePortalProps {
  config: ServicePortalConfig;
}

export default function ServicePortal({ config }: ServicePortalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<ServiceOrder[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Obtener el perfil/rol del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const userRole = session.user.user_metadata?.role || profile?.role || 'driver';

      // Verificar permisos según módulo (Taller, Lubricentro o Lavadero)
      if (userRole !== 'admin') {
        if (config.providerType === 'taller' && userRole !== 'mechanic') {
          router.push(userRole === 'lubricentro' ? '/lubricentro' : userRole === 'lavadero' ? '/lavadero' : '/chofer');
          return;
        }
        if (config.providerType === 'lubricentro' && userRole !== 'lubricentro') {
          router.push(userRole === 'mechanic' ? '/taller' : userRole === 'lavadero' ? '/lavadero' : '/chofer');
          return;
        }
        if (config.providerType === 'lavadero' && userRole !== 'lavadero') {
          router.push(userRole === 'mechanic' ? '/taller' : userRole === 'lubricentro' ? '/lubricentro' : '/chofer');
          return;
        }
      }

      const res = await fetch('/api/admin/flota');
      const data = await res.json();
      if (res.ok) {
        setVehicles(data.vehicles.filter((v: Vehicle) => v.status === config.vehicleFilter));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchHistory = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLoadingHistory(true);
    const { data } = await supabase
      .from('service_orders')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
    
    const pending = data?.find((o: ServiceOrder) => o.status === 'pending' && o.provider_type === config.providerType);
    setEditingOrder(pending || null);
    setLoadingHistory(false);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    setLoadingHistory(true);
    const { error } = await supabase
      .from('service_orders')
      .update({ 
        appointment_date: editingOrder.appointment_date,
        budget: editingOrder.budget,
        description: editingOrder.description
      })
      .eq('id', editingOrder.id);
    
    if (!error) {
      alert('Información de servicio actualizada');
      if (selectedVehicle) fetchHistory(selectedVehicle);
    }
    setLoadingHistory(false);
  };

  const handleFinishJob = async () => {
    if (!editingOrder || !selectedVehicle) return;
    if (!confirm('¿Estás seguro de que deseas finalizar este trabajo? El administrador será notificado.')) return;
    
    setLoadingHistory(true);
    try {
      await supabase.from('service_orders').update({ status: 'completed' }).eq('id', editingOrder.id);
      
      await fetch('/api/admin/flota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedVehicle.id, status: 'active' })
      });

      await supabase.from('announcements').insert([{
        title: `${config.announcementPrefix}: ${selectedVehicle.plate}`,
        content: config.announcementContent(selectedVehicle.plate),
        is_active: true
      }]);

      alert('Trabajo finalizado y unidad liberada.');
      setSelectedVehicle(null);
      setEditingOrder(null);
      checkAccessAndFetch();
    } catch (err) {
      console.error(err);
    }
    setLoadingHistory(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const IconComponent = config.icon;
  const DrawerIconComponent = config.drawerIcon;
  const c = config.colors;

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans p-6 md:p-12">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] ${c.orb} rounded-full blur-[120px]`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 bg-gradient-to-br ${c.gradient} rounded-[2rem] flex items-center justify-center shadow-2xl ${c.shadow}`}>
               <IconComponent className="text-black" size={32} />
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tighter italic">{config.title}</h1>
               <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">{config.subtitle}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all self-start md:self-center">
            <LogOut size={20} /> <span className="font-bold text-sm">Salir</span>
          </button>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
             {config.sectionTitle} <span className={`${c.badge} px-3 py-1 rounded-full text-xs`}>{vehicles.length}</span>
          </h2>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-zinc-900/40 rounded-[2.5rem] border border-white/5" />)}
             </div>
          ) : vehicles.length === 0 ? (
             <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] py-32 text-center">
                <CheckCircle size={64} className="text-lime-500 mx-auto mb-6 opacity-10" />
                <h3 className="text-2xl font-black text-zinc-700 uppercase italic">{config.emptyMessage}</h3>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vehicles.map(v => (
                  <div key={v.id} onClick={() => fetchHistory(v)} className={`bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 hover:bg-zinc-900/80 transition-all group border-t-4 ${c.borderTop} shadow-2xl cursor-pointer`}>
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <p className="text-3xl font-black text-white tracking-tighter leading-none mb-2">{v.plate}</p>
                           <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">{v.brand} {v.model}</p>
                        </div>
                        <div className={`bg-white/5 p-3 rounded-2xl group-hover:${c.hoverBg} transition-colors`}>
                           <Car size={24} className={`text-zinc-500 group-hover:${c.hoverText}`} />
                        </div>
                     </div>
                     <div className="pt-6 border-t border-white/5">
                        <button className={`w-full py-4 ${c.actionBtn} font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg group/btn`}>
                           {config.actionButtonText} <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          )}
        </section>

        <Footer />
      </div>

      {/* DRAWER DE GESTIÓN Y HISTORIAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-end p-0 md:p-6">
          <div className="bg-zinc-900 border-l border-white/10 w-full max-w-2xl h-full md:h-[90vh] md:rounded-[3rem] shadow-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 text-white">
             <div className="p-6 md:p-10 border-b border-white/5 flex justify-between items-start">
                <div className="flex items-center gap-4 md:gap-6">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-white/5 shadow-2xl">
                      <DrawerIconComponent size={30} className={c.text} />
                   </div>
                   <div>
                      <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">{selectedVehicle.plate}</h3>
                      <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest">{selectedVehicle.brand} {selectedVehicle.model}</p>
                   </div>
                </div>
                <button onClick={() => { setSelectedVehicle(null); setEditingOrder(null); }} className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-500 transition-all">
                   <X size={20} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-12">
                {/* SECCIÓN EDICIÓN */}
                {editingOrder && (
                  <div className={`${c.bg} border ${c.border} rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 space-y-4 md:space-y-6`}>
                     <h4 className={`text-xs md:text-sm font-black ${c.text} uppercase tracking-widest flex items-center gap-2`}>
                        <Clock size={16} /> {config.editSectionTitle}
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Fecha de Turno</label>
                           <input 
                            type="datetime-local" 
                            value={editingOrder.appointment_date?.slice(0, 16)} 
                            onChange={e => setEditingOrder({...editingOrder, appointment_date: e.target.value})}
                            className={`w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs md:text-sm font-bold outline-none ${c.focusBorder}`}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Presupuesto ($)</label>
                           <input 
                            type="number" 
                            value={editingOrder.budget} 
                            onChange={e => setEditingOrder({...editingOrder, budget: Number(e.target.value)})}
                            className={`w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs md:text-sm font-bold outline-none ${c.focusBorder}`}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Detalles del Trabajo</label>
                        <textarea 
                          value={editingOrder.description} 
                          onChange={e => setEditingOrder({...editingOrder, description: e.target.value})}
                          className={`w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none ${c.focusBorder} h-24`}
                        />
                     </div>
                     <button 
                      onClick={handleUpdateOrder}
                      className={`w-full py-4 ${c.updateBtn} font-black rounded-2xl border transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mb-3`}
                     >
                        {config.updateButtonText}
                     </button>

                     <button 
                      onClick={handleFinishJob}
                      className="w-full py-4 bg-lime-500 text-black font-black rounded-2xl shadow-xl shadow-lime-500/20 hover:bg-lime-400 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                     >
                        <CheckCircle size={18} /> {config.finishButtonText}
                     </button>
                  </div>
                )}

                {/* SECCIÓN HISTORIAL */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] px-4">Historial de la Unidad</h4>
                   <div className="space-y-4">
                      {loadingHistory ? (
                        <div className="flex justify-center py-10"><div className={`w-8 h-8 border-2 ${c.spinnerBorder} ${c.spinnerTop} rounded-full animate-spin`} /></div>
                      ) : history.length === 0 ? (
                        <p className="text-center text-zinc-600 italic py-10">Sin registros previos.</p>
                      ) : (
                        history.map(h => (
                          <div key={h.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex justify-between items-center group">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-zinc-600">
                                   <Calendar size={18} />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-white">{new Date(h.created_at).toLocaleDateString()}</p>
                                   <p className="text-[10px] text-zinc-500 font-bold uppercase">{h.description || 'Sin descripción'}</p>
                                </div>
                             </div>
                             <p className={`text-sm font-black ${c.text}`}>${Number(h.budget).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <Footer className="py-8" />
      <GlobalChat module={config.chatModule} accentColor={config.chatAccent} />
    </div>
  );
}
