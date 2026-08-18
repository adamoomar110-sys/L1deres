'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle2, Car, User, AlertCircle, Search, Filter, RefreshCw, Wrench, Check, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/Footer';

export default function InformesFallas() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error("Error cargando incidentes:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (updatingId) return;
    setUpdatingId(id);

    // Optimistic update
    const previousIncidents = [...incidents];
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));

    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) {
        console.error('Error al actualizar estado:', error);
        alert(`Error al actualizar estado: ${error.message || 'Error en servidor'}`);
        // Revert on error
        setIncidents(previousIncidents);
      }
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert(`Error al actualizar estado: ${err.message}`);
      setIncidents(previousIncidents);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Pendiente';
      case 'in_progress': return 'En Taller';
      case 'resolved': return 'Resuelto';
      default: return status || 'Pendiente';
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesFilter = filter === 'all' ? true : inc.status === filter;
    const query = search.toLowerCase();
    const matchesSearch = !search || 
      (inc.description && inc.description.toLowerCase().includes(query)) ||
      (inc.vehicle_plate && inc.vehicle_plate.toLowerCase().includes(query)) ||
      (inc.vehicles?.plate && inc.vehicles.plate.toLowerCase().includes(query)) ||
      (inc.driver_name && inc.driver_name.toLowerCase().includes(query)) ||
      (inc.profiles?.full_name && inc.profiles.full_name.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#030303] text-white">
      {/* Header */}
      <header className="h-auto py-6 md:h-24 px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20 backdrop-blur-md border-b border-white/5 z-20 sticky top-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
            <ShieldAlert className="text-yellow-500" /> Informes de Fallas
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm font-medium">Reportes mecánicos y técnicos enviados por los choferes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center bg-zinc-900/70 border border-white/10 px-4 py-2 rounded-xl text-xs">
            <Search size={14} className="text-zinc-500 mr-2" />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar reporte, chofer o patente..."
              className="bg-transparent text-white outline-none placeholder-zinc-500 text-xs w-48"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white ml-1">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'open', label: 'Pendientes' },
              { key: 'in_progress', label: 'En Taller' },
              { key: 'resolved', label: 'Resueltos' }
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === s.key ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchIncidents}
            disabled={loading}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all border border-white/5"
            title="Recargar reportes"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-yellow-500' : ''} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 z-10 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 text-yellow-500">
            <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Obteniendo reportes técnicos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredIncidents.map(inc => {
              const driverName = inc.profiles?.full_name || inc.driver_name || 'Sin Chofer';
              const driverEmail = inc.profiles?.email || inc.driver_email || '';
              const vehiclePlate = inc.vehicles?.plate || inc.vehicle_plate || '-';
              const vehicleBrand = inc.vehicles?.brand || inc.vehicle_brand || '';
              const vehicleModel = inc.vehicles?.model || inc.vehicle_model || '';
              const isUpdating = updatingId === inc.id;

              return (
                <div 
                  key={inc.id} 
                  className={`group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 md:p-8 transition-all duration-300 hover:bg-zinc-800/40 hover:border-white/10 shadow-2xl ${
                    isUpdating ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
                    
                    {/* Status Indicator Bar */}
                    <div className={`w-1.5 self-stretch rounded-full shrink-0 ${
                      inc.status === 'open' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 
                      inc.status === 'in_progress' ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]' : 
                      'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 ${
                          inc.status === 'open' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                          inc.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 
                          'bg-green-500/10 text-green-400 border-green-500/30'
                        }`}>
                          {inc.status === 'open' && <AlertTriangle size={12} />}
                          {inc.status === 'in_progress' && <Wrench size={12} />}
                          {inc.status === 'resolved' && <Check size={12} />}
                          {getStatusLabel(inc.status)}
                        </span>
                        <span className="text-zinc-500 text-xs font-medium flex items-center gap-1">
                          <Clock size={14} /> {inc.created_at ? new Date(inc.created_at).toLocaleString() : 'Fecha desconocida'}
                        </span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-black text-white mb-6 leading-tight break-words">
                        {inc.description}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                          <div className="w-12 h-12 bg-zinc-800/80 rounded-xl flex items-center justify-center text-yellow-500 shrink-0 border border-white/5">
                            <Car size={22} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vehículo</p>
                            <p className="font-extrabold text-white text-sm truncate">
                              {vehiclePlate} {vehicleBrand ? `• ${vehicleBrand} ${vehicleModel}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                          <div className="w-12 h-12 bg-zinc-800/80 rounded-xl flex items-center justify-center text-zinc-300 shrink-0 border border-white/5">
                            <User size={22} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chofer</p>
                            <p className="font-extrabold text-white text-sm truncate">{driverName}</p>
                            {driverEmail && <p className="text-[10px] text-zinc-500 truncate">{driverEmail}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions / Status Buttons */}
                    <div className="flex flex-col gap-2.5 w-full lg:w-48 shrink-0 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-center">
                        Cambiar Estado
                      </p>
                      
                      <button 
                        onClick={() => updateStatus(inc.id, 'open')}
                        disabled={isUpdating}
                        className={`py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                          inc.status === 'open' 
                            ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-[1.02]' 
                            : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5'
                        }`}
                      >
                        <AlertTriangle size={14} className={inc.status === 'open' ? 'text-white' : 'text-red-500/60'} />
                        Pendiente
                      </button>

                      <button 
                        onClick={() => updateStatus(inc.id, 'in_progress')}
                        disabled={isUpdating}
                        className={`py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                          inc.status === 'in_progress' 
                            ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-[1.02]' 
                            : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-yellow-500/40 hover:text-yellow-400 hover:bg-yellow-500/5'
                        }`}
                      >
                        <Wrench size={14} className={inc.status === 'in_progress' ? 'text-black' : 'text-yellow-500/60'} />
                        En Taller
                      </button>

                      <button 
                        onClick={() => updateStatus(inc.id, 'resolved')}
                        disabled={isUpdating}
                        className={`py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                          inc.status === 'resolved' 
                            ? 'bg-lime-500 text-black border-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.4)] scale-[1.02]' 
                            : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-lime-500/40 hover:text-lime-400 hover:bg-lime-500/5'
                        }`}
                      >
                        <Check size={14} className={inc.status === 'resolved' ? 'text-black' : 'text-lime-500/60'} />
                        Resuelto
                      </button>
                    </div>
                  </div>

                  {/* Photo/Audio Attachments */}
                  {(inc.photo_url || inc.audio_url) && (
                     <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center">
                       {inc.photo_url && (
                          <div 
                            onClick={() => setSelectedPhoto(inc.photo_url)}
                            className="group/img relative w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500 cursor-pointer transition-all hover:scale-105"
                          >
                            <img src={inc.photo_url} alt="Evidencia" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <Search size={16} className="text-white" />
                            </div>
                          </div>
                       )}
                       {inc.audio_url && (
                          <div className="flex items-center gap-3 px-5 py-3 bg-zinc-800/50 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-colors">
                            <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
                               <AlertCircle size={16} />
                            </div>
                            <audio controls src={inc.audio_url} className="h-8 max-w-[200px]" />
                          </div>
                       )}
                     </div>
                  )}
                </div>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="h-[360px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center text-zinc-500 bg-black/20 backdrop-blur-sm p-8">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                  <ShieldAlert size={32} className="opacity-50 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Sin informes técnicos</h3>
                <p className="max-w-sm text-xs text-zinc-500">
                  {search ? `No se encontraron coincidencias para "${search}"` : 'No se han encontrado reportes de fallas con el filtro seleccionado.'}
                </p>
              </div>
            )}
          </div>
        )}

        <Footer className="pt-12 pb-8" />
      </div>

      {/* Photo Zoom Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)} 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={selectedPhoto} alt="Evidencia en grande" className="w-full h-full object-contain" />
            <button 
              onClick={() => setSelectedPhoto(null)} 
              className="absolute top-4 right-4 bg-black/60 hover:bg-black p-2.5 rounded-full text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

