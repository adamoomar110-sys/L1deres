'use client';
import React, { useState, useEffect } from 'react';
import { UserPlus, UserX, Check, X, ShieldAlert, FileText, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PostulantesPage() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('applicants').select('*').eq('status', 'pending');
    if (data) setApplicants(data);
    setLoading(false);
  };

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected', name: string) => {
    if (newStatus === 'rejected') {
      if (!confirm(`¿Seguro que quieres rechazar a ${name}?`)) return;
    }
    
    const { error } = await supabase.from('applicants').update({ status: newStatus }).eq('id', id);
    if (!error) {
      alert(`Postulante ${newStatus === 'approved' ? 'Aprobado para Contratación' : 'Rechazado'}`);
      fetchApplicants();
    } else {
      alert('Error al actualizar postulante');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando postulantes...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
          <UserPlus className="text-cyan-500" size={32} />
          Nuevos Postulantes
        </h1>
        <p className="text-sm text-zinc-500 mt-1 font-medium">Revisa las solicitudes de empleo pendientes.</p>
      </div>

      {applicants.length === 0 ? (
        <div className="bg-white/40 border border-orange-200 rounded-3xl p-12 text-center shadow-sm">
          <ShieldAlert className="mx-auto text-orange-300 mb-4" size={48} />
          <h2 className="text-xl font-bold text-zinc-800">No hay postulantes pendientes</h2>
          <p className="text-zinc-500 mt-2">Cuando alguien envíe una solicitud, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {applicants.map((app) => (
            <div key={app.id} className="bg-white border border-orange-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="h-32 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 relative">
                {app.selfie_url && (
                  <img src={app.selfie_url} alt="Selfie" className="w-full h-full object-cover opacity-80 mix-blend-overlay" />
                )}
                <div className="absolute -bottom-10 left-6">
                  {app.selfie_url ? (
                    <img src={app.selfie_url} alt="Avatar" className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover bg-white" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{app.full_name.substring(0,2).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-cyan-700 shadow-sm">
                  DNI: {app.dni}
                </div>
              </div>
              
              <div className="p-6 pt-12">
                <h3 className="font-black text-xl text-black leading-tight mb-1">{app.full_name}</h3>
                <p className="text-sm font-bold text-zinc-500 mb-4">{app.age || '--'} años</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-zinc-700 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                    <Phone size={16} className="text-green-500" />
                    <a href={`https://wa.me/${app.phone}`} target="_blank" rel="noreferrer" className="hover:text-green-600 hover:underline font-medium">
                      {app.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-700 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                    <MapPin size={16} className="text-orange-500" />
                    <span className="truncate" title={app.zone || '--'}>{app.zone || '--'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-700 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                    <FileText size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-zinc-500 mb-0.5">Experiencia</p>
                      <p className="leading-snug">{app.app_experience || 'Sin experiencia previa.'}</p>
                      
                      <p className="font-bold text-xs text-zinc-500 mt-2 mb-0.5">Disponibilidad</p>
                      <p className="leading-snug">{app.availability || '--'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(app.id, 'rejected', app.full_name)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all"
                  >
                    <X size={18} /> Rechazar
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, 'approved', app.full_name)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                  >
                    <Check size={18} /> Aprobar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
