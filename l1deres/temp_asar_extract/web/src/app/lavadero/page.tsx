'use client';
import { useState, useEffect } from 'react';
import { Waves, Car, Clock, CheckCircle, LogOut, ChevronRight, Calendar, DollarSign, X, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import QuickMessage from '@/components/QuickMessage';

export default function LavaderoPortal() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener vehículos que están en la cola del lavadero (zona espera o lavado)
      const { data, error } = await supabase
        .from('lavadero_camera_queue')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) {
        setVehicles(data.filter((v: any) => v.zone === 'espera' || v.zone === 'lavado'));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchHistory = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setLoadingHistory(true);
    const { data } = await supabase
      .from('service_orders')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
    
    // Buscar si hay una orden pendiente para editar
    const pending = data?.find(o => o.status === 'pending' && o.provider_type === 'lavadero');
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
      alert('Información del lavado actualizada');
      fetchHistory(selectedVehicle);
    }
    setLoadingHistory(false);
  };

  const handleFinishJob = async () => {
    if (!editingOrder || !selectedVehicle) return;
    if (!confirm('¿Estás seguro de que deseas finalizar este lavado? El administrador será notificado.')) return;
    
    setLoadingHistory(true);
    try {
      // 1. Marcar orden como completada
      await supabase.from('service_orders').update({ status: 'completed' }).eq('id', editingOrder.id);
      
      // 2. Mover el vehículo a zona terminado en la cola del lavadero
      await supabase
        .from('lavadero_camera_queue')
        .update({ zone: 'terminado', entered_at: new Date().toISOString() })
        .eq('id', selectedVehicle.id);

      // 3. Crear aviso para el admin
      await supabase.from('announcements').insert([{
        title: 'LAVADO FINALIZADO: ' + selectedVehicle.nickname,
        content: `El lavadero ha finalizado el lavado del vehículo ${selectedVehicle.nickname}. Ya está listo para retiro.`,
        is_active: true
      }]);

      alert('Lavado finalizado.');
      setSelectedVehicle(null);
      setEditingOrder(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setLoadingHistory(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-orange-50 text-black font-sans p-6 md:p-12">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-orange-400/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-300 to-cyan-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyan-500/20">
               <Waves className="text-black" size={32} />
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tighter italic uppercase">Portal Lavadero</h1>
               <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">Estética y Limpieza Lavadero De Luxe</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-6 py-3 bg-orange-100/50 border border-orange-200 rounded-2xl text-zinc-700 hover:text-black transition-all self-start md:self-center">
            <LogOut size={20} /> <span className="font-bold text-sm">Salir</span>
          </button>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
             Vehículos en Fila <span className="bg-orange-400 text-black px-3 py-1 rounded-full text-xs font-black">{vehicles.length}</span>
          </h2>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-orange-100/40 rounded-[2.5rem] border border-orange-200" />)}
             </div>
          ) : vehicles.length === 0 ? (
             <div className="bg-white border border-orange-200 rounded-[3rem] py-32 text-center">
                <CheckCircle size={64} className="text-orange-500 mx-auto mb-6 opacity-10" />
                <h3 className="text-2xl font-black text-zinc-700 uppercase italic">Sin trabajos pendientes</h3>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vehicles.map(v => (
                  <div key={v.id} onClick={() => fetchHistory(v)} className="bg-orange-100/60 backdrop-blur-xl border border-orange-200 rounded-[2.5rem] p-8 hover:bg-orange-100/80 transition-all group border-t-4 border-t-cyan-500 shadow-2xl cursor-pointer">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <p className="text-3xl font-black text-black tracking-tighter leading-none mb-2">{v.plate}</p>
                           <p className="text-xs text-zinc-600 font-black uppercase tracking-widest">{v.brand} {v.model}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-orange-400/10 transition-colors">
                           <Car size={24} className="text-zinc-600 group-hover:text-orange-500" />
                        </div>
                     </div>
                     <div className="pt-6 border-t border-orange-200">
                        <button className="w-full py-4 bg-orange-400 text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all shadow-lg group/btn shadow-cyan-500/20">
                           GESTIONAR TRABAJO <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          )}
        </section>

        {/* FOOTER GENERAL */}
        <footer className="pt-12 pb-4 text-center border-t border-orange-200 space-y-2 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-zinc-600 font-bold">
            © 2026 Omar Adamo. Todos los derechos reservados.
          </p>
          <div className="flex justify-center gap-4 text-[9px] text-zinc-600 font-medium">
            <a href="mailto:adamoomar110@gmail.com" className="hover:text-orange-500 transition-colors">Email</a>
            <span>•</span>
            <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">WhatsApp</a>
            <span>•</span>
            <span className="text-zinc-600 font-black">v1.5</span>
          </div>
        </footer>
      </div>

      {/* DRAWER DE GESTIÓN Y HISTORIAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex items-center justify-end p-0 md:p-6">
          <div className="bg-orange-100 border-l border-orange-200 w-full max-w-2xl h-full md:h-[90vh] md:rounded-[3rem] shadow-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 text-black">
             <div className="p-6 md:p-10 border-b border-orange-200 flex justify-between items-start">
                <div className="flex items-center gap-4 md:gap-6">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-orange-200 shadow-2xl">
                      <Waves size={30} className="text-orange-500" />
                   </div>
                   <div>
                      <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter italic uppercase">{selectedVehicle.plate}</h3>
                      <p className="text-zinc-600 text-xs md:text-sm font-bold uppercase tracking-widest">{selectedVehicle.brand} {selectedVehicle.model}</p>
                   </div>
                </div>
                <button onClick={() => { setSelectedVehicle(null); setEditingOrder(null); }} className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-600 transition-all">
                   <X size={20} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-12">
                {/* SECCIÓN EDICIÓN (PRESUPUESTO Y TURNO) */}
                {editingOrder && (
                  <div className="bg-orange-400/5 border border-orange-400/20 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 space-y-4 md:space-y-6">
                     <h4 className="text-xs md:text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Actualizar Turno y Costo
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Fecha de Turno</label>
                           <input 
                            type="datetime-local" 
                            value={editingOrder.appointment_date?.slice(0, 16) || ''} 
                            onChange={e => setEditingOrder({...editingOrder, appointment_date: e.target.value})}
                            className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs md:text-sm font-bold outline-none focus:border-orange-400" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Costo ($)</label>
                           <input 
                            type="number" 
                            value={editingOrder.budget || ''} 
                            onChange={e => setEditingOrder({...editingOrder, budget: e.target.value})}
                            className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs md:text-sm font-bold outline-none focus:border-orange-400" 
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Detalles del Trabajo</label>
                        <textarea 
                          value={editingOrder.description || ''} 
                          onChange={e => setEditingOrder({...editingOrder, description: e.target.value})}
                          className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-sm font-bold outline-none focus:border-orange-400 h-24" 
                        />
                     </div>
                     <button 
                      onClick={handleUpdateOrder}
                      className="w-full py-4 bg-orange-400/20 text-orange-600 font-black rounded-2xl border border-orange-400/20 hover:bg-orange-400/30 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mb-3"
                     >
                        Actualizar Turno / Costo
                     </button>

                     <button 
                      onClick={handleFinishJob}
                      className="w-full py-4 bg-lime-500 text-black font-black rounded-2xl shadow-xl shadow-lime-500/20 hover:bg-lime-400 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                     >
                        <CheckCircle size={18} /> FINALIZAR LAVADO Y LIBERAR UNIDAD
                     </button>
                  </div>
                )}

                {/* SECCIÓN HISTORIAL */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] px-4">Historial de la Unidad</h4>
                   <div className="space-y-4">
                      {loadingHistory ? (
                         <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-orange-400/20 border-t-cyan-500 rounded-full animate-spin" /></div>
                      ) : history.length === 0 ? (
                         <p className="text-center text-zinc-600 italic py-10">Sin registros previos.</p>
                      ) : (
                         history.map(h => (
                           <div key={h.id} className="bg-white/5 border border-orange-200 rounded-3xl p-6 flex justify-between items-center group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-600">
                                    <Calendar size={18} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-black">{new Date(h.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{h.description || 'Sin descripción'}</p>
                                 </div>
                              </div>
                              <p className="text-sm font-black text-lime-400">${Number(h.budget).toLocaleString()}</p>
                           </div>
                         ))
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <QuickMessage senderLabel="LAVADERO" accentColor="cyan" />
    </div>
  );
}
