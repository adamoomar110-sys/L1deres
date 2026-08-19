'use client';
import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Image as ImageIcon, Copy, MessageSquare, Trash2, UserCheck, ShieldCheck, Key, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PostulantesAdmin() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [hireModal, setHireModal] = useState<{ email: string; pass: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/postulantes');
      const data = await res.json();
      if (data.applicants) {
        setApplicants(data.applicants);
        if (!selectedApplicant && data.applicants.length > 0) {
          setSelectedApplicant(data.applicants[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'approved') {
      const app = applicants.find(a => a.id === id) || selectedApplicant;
      if (app) {
        await hireApplicant(app);
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/postulantes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al actualizar el estado');
      }
      setApplicants(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      if (selectedApplicant?.id === id) {
        setSelectedApplicant((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const hireApplicant = async (app: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/postulantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hire', id: app.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al aceptar chofer');
      }
      
      // Remover de la lista de postulantes inmediatamente (ya es chofer activo)
      setApplicants(prev => {
        const remaining = prev.filter(a => a.id !== app.id);
        setSelectedApplicant(remaining.length > 0 ? remaining[0] : null);
        return remaining;
      });

      setHireModal({
        name: app.full_name,
        email: data.email,
        pass: data.password
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteApplicant = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este postulante? Esta acción no se puede deshacer.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/postulantes?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al eliminar');
      }
      setApplicants(prev => prev.filter(app => app.id !== id));
      if (selectedApplicant?.id === id) setSelectedApplicant(null);
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getWhatsAppMessage = (app: any, type: 'approved' | 'rejected') => {
    const firstName = app.full_name.split(' ')[0];
    if (type === 'approved') {
      return `¡Hola ${firstName}! 👋 Soy del equipo de Spinaz Garage. Te contacto porque tu postulación fue pre-seleccionada. 🚀 Nos gustaría coordinar tu incorporación y entrega de unidad. Por favor confirmame si estás disponible para acercarte.`;
    }
    return `Hola ${firstName}. Gracias por postularte a Spinaz Garage. Por el momento no avanzaremos con tu perfil para esta búsqueda, pero guardaremos tus datos para futuras vacantes. Saludos.`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredApplicants = applicants.filter(app => 
    app.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    app.dni?.includes(search)
  );

  const DOCS = [
    { label: 'DNI FRENTE', urlKey: 'dni_front_url' },
    { label: 'DNI DORSO', urlKey: 'dni_back_url' },
    { label: 'REGISTRO', urlKey: 'license_url' },
    { label: 'SELFIE', urlKey: 'selfie_url' },
  ];

  return (
    <>
      {/* MODAL DE CHOFER CONTRATADO */}
      {hireModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-green-500/30 p-8 rounded-[2.5rem] max-w-md w-full shadow-[0_0_80px_rgba(34,197,94,0.2)] text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <ShieldCheck size={36} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">¡Chofer Dado de Alta!</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Se ha creado el acceso oficial para <strong className="text-white">{hireModal.name}</strong>.
            </p>

            <div className="bg-black/60 border border-white/10 p-5 rounded-2xl text-left space-y-3 mb-6 font-mono text-sm">
              <div>
                <span className="text-zinc-500 text-xs block">USUARIO / EMAIL:</span>
                <span className="text-yellow-400 font-bold select-all">{hireModal.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">CONTRASEÑA:</span>
                <span className="text-white font-bold select-all">{hireModal.pass}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  copyToClipboard(`Hola ${hireModal.name}! Tus datos de acceso a Spinaz Garage son:\nURL: https://cheq-flota-de-autos.vercel.app/login\nUsuario: ${hireModal.email}\nClave: ${hireModal.pass}`);
                }}
                className="flex-1 bg-green-500 hover:bg-green-400 text-black font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Datos'}</span>
              </button>
              <button
                onClick={() => setHireModal(null)}
                className="px-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white italic leading-none">Candidatos</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Gestión de reclutamiento</p>
        </div>
        <div className="flex items-center bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl w-64 shadow-inner focus-within:border-yellow-500/50 transition-colors">
          <Search className="text-zinc-500" size={15} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o DNI..." className="bg-transparent border-none focus:outline-none text-xs ml-2.5 w-full text-white placeholder-zinc-600 font-medium" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* LISTA LATERAL */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto bg-black/40 backdrop-blur-md relative z-10">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-yellow-500 p-8">
               <div className="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cargando postulantes...</span>
             </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
              No hay postulantes registrados
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredApplicants.map(app => (
                <button 
                  key={app.id} 
                  onClick={() => setSelectedApplicant(app)} 
                  className={`w-full p-6 text-left transition-all relative ${selectedApplicant?.id === app.id ? 'bg-zinc-900/80 shadow-inner' : 'hover:bg-white/5'}`}
                >
                  {selectedApplicant?.id === app.id && <div className="absolute left-0 top-0 w-1.5 h-full bg-yellow-500" />}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg block text-white leading-none">{app.full_name}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      app.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {app.status === 'approved' ? 'Aprobado' : app.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>📍 {app.zone || 'Sin zona'}</span>
                    <span>{app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETALLE DEL CANDIDATO SELECCIONADO */}
        <div className="flex-1 overflow-y-auto p-10 bg-black">
          {selectedApplicant ? (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                 <div className="flex justify-between items-start mb-8 gap-4">
                    <div>
                       <div className="flex items-center gap-3 mb-2">
                         <h2 className="text-4xl font-black text-white">{selectedApplicant.full_name}</h2>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                           selectedApplicant.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                           selectedApplicant.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                           'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                         }`}>
                           {selectedApplicant.status === 'approved' ? 'Aprobado' : selectedApplicant.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                         </span>
                       </div>
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                         DNI: {selectedApplicant.dni} | EDAD: {selectedApplicant.age || '-'} | CEL: {selectedApplicant.phone}
                       </p>
                    </div>

                    {/* BOTONERA DE ACCIONES */}
                    <div className="flex items-center gap-2 shrink-0">
                       <button 
                          onClick={() => updateStatus(selectedApplicant.id, 'approved')} 
                          disabled={actionLoading}
                          title="Aprobar Postulante"
                          className={`px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            selectedApplicant.status === 'approved' 
                              ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                              : 'bg-zinc-800 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 border border-white/5'
                          }`}
                       >
                          <CheckCircle size={18} />
                          <span>Aceptar</span>
                       </button>

                       <button 
                          onClick={() => updateStatus(selectedApplicant.id, 'rejected')} 
                          disabled={actionLoading}
                          title="Rechazar Postulante"
                          className={`px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            selectedApplicant.status === 'rejected' 
                              ? 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                              : 'bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5'
                          }`}
                       >
                          <XCircle size={18} />
                          <span>Rechazar</span>
                       </button>

                       <button 
                          onClick={() => deleteApplicant(selectedApplicant.id)} 
                          disabled={actionLoading}
                          title="Eliminar Postulante"
                          className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center shadow-lg hover:shadow-red-500/20"
                       >
                          <Trash2 size={18} />
                       </button>
                    </div>
                 </div>

                 {/* BOTÓN PRINCIPAL: CONTRATAR Y CREAR ACCESO */}
                 <div className="mb-8 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Alta Automática de Chofer</h4>
                      <p className="text-zinc-500 text-xs">Crea el usuario en el sistema para que pueda ingresar a la App Chofer.</p>
                    </div>
                    <button
                      onClick={() => hireApplicant(selectedApplicant)}
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black px-6 py-3 rounded-2xl transition-all shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:shadow-[0_0_35px_rgba(234,179,8,0.5)] flex items-center gap-2 transform active:scale-95"
                    >
                      <UserCheck size={18} />
                      <span>Contratar y Crear Acceso</span>
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                       <h4 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest mb-3">Experiencia Apps</h4>
                       <p className="text-sm text-zinc-300 font-medium leading-relaxed">{selectedApplicant.app_experience || 'No especificada'}</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                       <h4 className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-3">Siniestros</h4>
                       <p className="text-sm text-zinc-300 font-medium leading-relaxed">{selectedApplicant.accident_history || 'Sin historial informado'}</p>
                    </div>
                 </div>
              </div>

              {/* WHATSAPP AUTOMATION AREA */}
              <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-8 rounded-[3rem] shadow-xl">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-500 text-black rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare size={24}/></div>
                    <div>
                      <h3 className="text-xl font-black text-white">Mensaje para Enviar</h3>
                      <p className="text-xs text-zinc-400 font-medium">Plantilla lista para WhatsApp con el estado actual del postulante.</p>
                    </div>
                 </div>
                 
                 <div className="bg-black/60 p-6 rounded-3xl border border-white/10 mb-6 relative group">
                    <p className="text-zinc-300 font-medium text-sm leading-relaxed pr-12 italic">
                       &quot;{getWhatsAppMessage(selectedApplicant, selectedApplicant.status === 'rejected' ? 'rejected' : 'approved')}&quot;
                    </p>
                    <button 
                      onClick={() => copyToClipboard(getWhatsAppMessage(selectedApplicant, selectedApplicant.status === 'rejected' ? 'rejected' : 'approved'))} 
                      className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-green-400 hover:text-green-300"
                      title="Copiar mensaje"
                    >
                       {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                 </div>
                 
                 <p className="text-[10px] text-green-400 font-black uppercase tracking-widest text-center">Copiá este texto y pegalo en WhatsApp para avanzar con el candidato.</p>
              </div>

              {/* DOCUMENTOS */}
              <div className="grid grid-cols-4 gap-4">
                {DOCS.map((doc) => {
                  const url = selectedApplicant[doc.urlKey];
                  return (
                    <div key={doc.urlKey} className="aspect-square bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden hover:border-yellow-500/30 transition-all group relative">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Ver Original</span>
                          </div>
                        </a>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <ImageIcon size={32} className="text-zinc-700" />
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{doc.label}</span>
                          <span className="text-[7px] text-zinc-700">No subido</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 opacity-30">
               <Users size={64} />
               <p className="font-black uppercase tracking-[0.3em]">Seleccionar Postulante</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

