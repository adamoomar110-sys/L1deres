'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle2, Car, User, AlertCircle, Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InformesFallas() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        profiles:driver_id (full_name, email),
        vehicles:vehicle_id (plate, brand, model)
      `)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setIncidents(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('incidents')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
    }
  };

  const filteredIncidents = incidents.filter(inc => 
    filter === 'all' ? true : inc.status === filter
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-24 px-12 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 z-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">Informes de Fallas</h2>
          <p className="text-zinc-400 text-sm font-medium">Reportes mecánicos y técnicos enviados por los choferes.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {['all', 'open', 'in_progress', 'resolved'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {s === 'all' ? 'Todos' : s === 'open' ? 'Abiertos' : s === 'in_progress' ? 'En Curso' : 'Resueltos'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-12 z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-yellow-500">
            <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Obteniendo reportes técnicos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredIncidents.map(inc => (
              <div key={inc.id} className="group relative bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:bg-zinc-800/40 hover:border-white/10">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  
                  {/* Status Indicator Bar */}
                  <div className={`w-1 self-stretch rounded-full ${
                    inc.status === 'open' ? 'bg-red-500' : inc.status === 'in_progress' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        inc.status === 'open' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        inc.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                        'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {inc.status}
                      </span>
                      <span className="text-zinc-500 text-xs font-medium flex items-center gap-1">
                        <Clock size={14} /> {new Date(inc.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4 leading-tight">{inc.description}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                          <Car size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Vehículo</p>
                          <p className="font-bold text-white">{inc.vehicles?.plate} - {inc.vehicles?.brand} {inc.vehicles?.model}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                          <User size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Chofer</p>
                          <p className="font-bold text-white">{inc.profiles?.full_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">Cambiar Estado</p>
                    <button 
                      onClick={() => updateStatus(inc.id, 'open')}
                      className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${inc.status === 'open' ? 'bg-red-500 text-black border-red-500' : 'bg-transparent text-zinc-500 border-white/5 hover:border-red-500/50 hover:text-red-500'}`}
                    >
                      Pendiente
                    </button>
                    <button 
                      onClick={() => updateStatus(inc.id, 'in_progress')}
                      className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${inc.status === 'in_progress' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-transparent text-zinc-500 border-white/5 hover:border-yellow-500/50 hover:text-yellow-500'}`}
                    >
                      En Taller
                    </button>
                    <button 
                      onClick={() => updateStatus(inc.id, 'resolved')}
                      className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${inc.status === 'resolved' ? 'bg-green-500 text-black border-green-500' : 'bg-transparent text-zinc-500 border-white/5 hover:border-green-500/50 hover:text-green-500'}`}
                    >
                      Resuelto
                    </button>
                  </div>
                </div>

                {/* Photo/Audio Attachments Placeholder */}
                {(inc.photo_url || inc.audio_url) && (
                   <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                     {inc.photo_url && (
                        <div className="w-20 h-20 bg-zinc-800 rounded-xl overflow-hidden border border-white/10 hover:scale-110 transition-transform cursor-pointer">
                          <img src={inc.photo_url} alt="Evidencia" className="w-full h-full object-cover" />
                        </div>
                     )}
                     {inc.audio_url && (
                        <div className="flex items-center gap-3 px-6 py-3 bg-zinc-800/50 rounded-xl border border-white/5 hover:bg-zinc-800 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
                             <AlertCircle size={16} />
                          </div>
                          <span className="text-xs font-bold text-white">Escuchar Audio</span>
                        </div>
                     )}
                   </div>
                )}
              </div>
            ))}

            {filteredIncidents.length === 0 && (
              <div className="h-[400px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center text-zinc-500 bg-black/20 backdrop-blur-sm">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <ShieldAlert size={32} className="opacity-50 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin informes técnicos</h3>
                <p className="max-w-sm">No se han encontrado reportes de fallas con el filtro seleccionado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
