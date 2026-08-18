'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Plus, Trash2, Power, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AvisosAdmin() {
  const [avisos, setAvisos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', is_active: true });

  useEffect(() => {
    fetchAvisos();
  }, []);

  const fetchAvisos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setAvisos(data);
    }
    setLoading(false);
  };

  const toggleAviso = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { is_active: !currentStatus } })
      });
      const json = await res.json();
      if (json.success) {
        setAvisos(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setAvisos([json.data, ...avisos]);
        setIsModalOpen(false);
        setFormData({ title: '', content: '', is_active: true });
      } else {
        alert('Error creando aviso: ' + json.error);
      }
    } catch (err) {
      alert('Error creando aviso');
    }
  };

  const deleteAviso = async (id: string) => {
    if(!confirm('¿Seguro que deseas eliminar este aviso permanentemente?')) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAvisos(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="h-24 px-12 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 z-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">Gestión de Avisos</h2>
          <p className="text-zinc-400 text-sm font-medium">Controla lo que los choferes ven en sus pantallas al instante.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl font-bold text-black flex items-center gap-2 overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.2)] hover:shadow-[0_0_60px_rgba(234,179,8,0.4)]"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10">Crear Nuevo Aviso</span>
        </button>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-12 z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-yellow-500">
            <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Sincronizando Base de Datos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {avisos.map(aviso => (
              <div key={aviso.id} className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:bg-zinc-800/50 hover:border-white/10 hover:shadow-2xl">
                {/* Glow effect based on active status */}
                <div className={`absolute inset-0 rounded-[2rem] transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none ${aviso.is_active ? 'shadow-[inset_0_0_50px_rgba(234,179,8,0.05)]' : ''}`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${aviso.is_active ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-white/5 text-zinc-500'}`}>
                        <Bell size={18} />
                      </div>
                    </div>
                    
                    {/* Premium Toggle Switch */}
                    <button 
                      onClick={() => toggleAviso(aviso.id, aviso.is_active)}
                      className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-500 ease-in-out border ${aviso.is_active ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-black border-white/10'}`}
                    >
                      <div className={`w-6 h-6 rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${aviso.is_active ? 'translate-x-6 bg-yellow-500 shadow-yellow-500/50' : 'translate-x-0 bg-zinc-600'}`}>
                        <Power size={12} className={aviso.is_active ? 'text-black' : 'text-zinc-400'} />
                      </div>
                    </button>
                  </div>
                  
                  <h3 className="font-black text-xl text-white mb-3 line-clamp-2">{aviso.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-8 line-clamp-3 min-h-[4.5rem]">
                    {aviso.content}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 ${aviso.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                      <div className={`w-2 h-2 rounded-full ${aviso.is_active ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                      {aviso.is_active ? 'Visible en App' : 'Oculto'}
                    </span>
                    
                    <button 
                      onClick={() => deleteAviso(aviso.id)} 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Eliminar aviso"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {avisos.length === 0 && (
               <div className="col-span-full h-[400px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center text-zinc-500 bg-black/20 backdrop-blur-sm">
                 <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                   <Bell size={32} className="opacity-50 text-yellow-500" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">No hay avisos cargados</h3>
                 <p className="max-w-sm">Haz clic en el botón superior derecho para crear el primer comunicado para los choferes.</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            
            <h2 className="text-3xl font-black mb-2 text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                <Bell className="text-yellow-500" size={24} />
              </div>
              Redactar Aviso Oficial
            </h2>
            <p className="text-zinc-500 text-sm mb-8 ml-15">Se enviará inmediatamente a las pantallas de todos los choferes.</p>
            
            <form onSubmit={createAviso} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-widest pl-2">Título del Comunicado</label>
                <input 
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white text-lg font-medium focus:outline-none focus:border-yellow-500 focus:bg-black transition-all shadow-inner"
                  placeholder="Ej: Cambio en Política de Pagos"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-widest pl-2">Mensaje / Cuerpo del informe</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-yellow-500 focus:bg-black transition-all resize-none shadow-inner"
                  placeholder="Escribe aquí el contenido..."
                ></textarea>
              </div>
              
              <label className="flex items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 cursor-pointer hover:bg-zinc-900 hover:border-yellow-500/30 transition-all group">
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${formData.is_active ? 'bg-yellow-500 border-yellow-500' : 'border-zinc-500 bg-transparent'}`}>
                    {formData.is_active && <div className="w-2 h-2 bg-black rounded-sm" />}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white">Publicar Inmediatamente</p>
                  <p className="text-xs text-zinc-500">Si desmarcas, el aviso se guardará como borrador invisible.</p>
                </div>
              </label>

              <div className="flex gap-4 mt-10 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl font-bold transition-all">
                  Descartar
                </button>
                <button type="submit" className="flex-[2] bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-extrabold py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transform hover:-translate-y-1">
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
