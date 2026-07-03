'use client';
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, X, Trash2, Clock, DollarSign, ChevronRight, Car, Award, Calendar, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UsuariosAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'driver', password: '', cargo: '', funcion: '', turno: '', legajo: '' });
  const [expandedHistoryUserId, setExpandedHistoryUserId] = useState<string | null>(null);
  const [approvedApplicants, setApprovedApplicants] = useState<any[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'manual' | 'applicant'>('manual');
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    fetchUsersWithStats();
    fetchApprovedApplicants();
  }, []);

  const fetchApprovedApplicants = async () => {
    const { data } = await supabase.from('applicants').select('*').eq('status', 'approved');
    if (data) setApprovedApplicants(data);
  };

  const fetchUsersWithStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usuarios');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error de conexión');
      
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('❌ Error fatal cargando usuarios:', err.message);
    }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
       const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newUser, send_email: sendEmail })
       });
       
       const data = await res.json();
       
       if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

       if (addMode === 'applicant' && selectedApplicantId) {
          await supabase
            .from('applicants')
            .update({ status: 'hired' })
            .eq('id', selectedApplicantId);
       }

        alert('Usuario creado con éxito');
        setShowAddModal(false);
        setNewUser({ full_name: '', email: '', role: 'driver', password: '', cargo: '', funcion: '', turno: '', legajo: '' });
       setSelectedApplicantId(null);
       setAddMode('manual');
       fetchUsersWithStats();
       fetchApprovedApplicants();
    } catch (err: any) {
       alert('Error: ' + err.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esta acción eliminará su legajo y estadísticas.`)) return;
    
    setLoading(true);
    try {
       const res = await fetch(`/api/admin/usuarios?id=${id}`, {
          method: 'DELETE'
       });
       
       if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al eliminar');
       }

       alert('Usuario eliminado correctamente');
       fetchUsersWithStats();
    } catch (err: any) {
       alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleAddExtraHours = async (user: any) => {
    const currentExtra = user.stats.hs_extra || 0;
    const input = prompt(`¿Cuántas horas extra NUEVAS quieres sumarle a ${user.full_name}? (Actualmente tiene ${currentExtra} hs extra guardadas).\n\nIngresa el número de horas a sumar:`);
    if (input !== null && input.trim() !== '' && !isNaN(Number(input))) {
      const newTotalExtra = currentExtra + Number(input);
      setLoading(true);
      try {
        const res = await fetch('/api/admin/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, hs_extra: newTotalExtra })
        });
        if (!res.ok) throw new Error('Error al actualizar');
        fetchUsersWithStats();
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
      setLoading(false);
    }
  };

  const handleAddExtraWashes = async (user: any) => {
    const currentExtra = user.stats.autos_extra || 0;
    const input = prompt(`¿Cuántos autos lavados NUEVOS quieres sumarle a ${user.full_name}? (Actualmente tiene ${currentExtra} autos extra guardados).\n\nIngresa el número de autos a sumar:`);
    if (input !== null && input.trim() !== '' && !isNaN(Number(input))) {
      const newTotalExtra = currentExtra + Number(input);
      setLoading(true);
      try {
        const res = await fetch('/api/admin/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, autos_extra: newTotalExtra })
        });
        if (!res.ok) throw new Error('Error al actualizar');
        fetchUsersWithStats();
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic">Legajos de Personal</h2>
          <p className="text-amber-500/80 text-sm font-bold uppercase tracking-widest">Rendimiento y Perfiles del Personal</p>
        </div>
        
        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <UserPlus size={20} /> CREAR EMPLEADO NUEVO
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-10 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {loading ? (
             <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando legajos...</p>
             </div>
          ) : users.map(user => (
            <div key={user.id} className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-2xl relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div>
                  <div className="p-8 flex items-start gap-6">
                     <div className="w-24 h-24 bg-zinc-950 rounded-3xl flex items-center justify-center border border-white/5 relative shadow-inner">
                        <Users size={32} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-amber-500 text-black text-[9px] font-black rounded-lg uppercase shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                           {user.role}
                        </div>
                     </div>

                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                           <div>
                              <h3 className="text-2xl font-black text-white tracking-tight">{user.full_name}</h3>
                              {user.legajo && (
                                 <span className="inline-block mt-1 text-[10px] font-black bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded-md tracking-widest uppercase">
                                    Legajo: {user.legajo}
                                 </span>
                              )}
                           </div>
                           <button 
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-xl cursor-pointer"
                              title="Eliminar Usuario"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                        <p className="text-zinc-400 text-sm font-medium mb-4 flex items-center gap-2">
                           <Mail size={14} className="text-zinc-600" /> {user.email}
                        </p>
                        
                        {user.vehicles && (
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase">
                              <Car size={12}/> Unidad Asignada: {user.vehicles.plate}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Cargos */}
                  {(user.cargo || user.funcion || user.turno) && (
                     <div className="grid grid-cols-3 gap-3 px-8 pb-6">
                        <div className="p-3 bg-zinc-950/50 border border-white/5 rounded-2xl flex flex-col gap-1">
                           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Shield size={10}/> Cargo</span>
                           <span className="text-xs font-bold text-zinc-200 truncate">{user.cargo || '-'}</span>
                        </div>
                        <div className="p-3 bg-zinc-950/50 border border-white/5 rounded-2xl flex flex-col gap-1">
                           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Award size={10}/> Especialidad</span>
                           <span className="text-xs font-bold text-zinc-200 truncate">{user.funcion || '-'}</span>
                        </div>
                        <div className="p-3 bg-zinc-950/50 border border-white/5 rounded-2xl flex flex-col gap-1">
                           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> Turno</span>
                           <span className="text-xs font-bold text-zinc-200 truncate">{user.turno || '-'}</span>
                        </div>
                     </div>
                  )}
               </div>

               <div>
                  {/* Stats Bar */}
                  <div className="grid grid-cols-4 bg-zinc-950/80 border-t border-white/5 p-6 gap-2">
                     <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-zinc-500 mb-2">
                           <Clock size={12} className="text-cyan-400" />
                           <span className="text-[9px] font-black uppercase tracking-widest leading-none">Hs Extras</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                           <p className="text-lg font-black text-white">{user.stats.hs_trabajadas}</p>
                           <button onClick={() => handleAddExtraHours(user)} className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/30 flex items-center justify-center transition-colors text-xs font-black shadow-sm" title="Sumar horas extra">+</button>
                        </div>
                     </div>
                     <div className="text-center border-l border-white/5 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-zinc-500 mb-2">
                           <Car size={12} className="text-green-400" />
                           <span className="text-[9px] font-black uppercase tracking-widest leading-none">Autos Extra</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                           <p className="text-lg font-black text-white">{user.stats.autos_lavados}</p>
                           <button onClick={() => handleAddExtraWashes(user)} className="w-5 h-5 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 flex items-center justify-center transition-colors text-xs font-black shadow-sm" title="Sumar autos extra">+</button>
                        </div>
                     </div>
                     <div className="text-center border-l border-white/5 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-zinc-500 mb-2">
                           <Calendar size={12} className="text-purple-400" />
                           <span className="text-[9px] font-black uppercase tracking-widest leading-none">Días</span>
                        </div>
                        <p className="text-lg font-black text-white mt-1">{user.stats.dias_trabajados}</p>
                     </div>
                     <div className="text-center border-l border-white/5 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-zinc-500 mb-2">
                           <DollarSign size={12} className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                           <span className="text-[9px] font-black uppercase tracking-widest leading-none">Generado</span>
                        </div>
                        <p className="text-lg font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] mt-1">${user.stats.revenue.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Historial de Trabajo Colapsable */}
                  <div className="border-t border-white/5 p-6 bg-white/[0.02]">
                     <button 
                        type="button"
                        onClick={() => setExpandedHistoryUserId(expandedHistoryUserId === user.id ? null : user.id)}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                     >
                        <span>{expandedHistoryUserId === user.id ? 'Ocultar Actividad' : 'Ver Registro de Actividad'}</span>
                        <ChevronRight size={14} className={`transform transition-transform ${expandedHistoryUserId === user.id ? 'rotate-90' : ''}`} />
                     </button>

                     {expandedHistoryUserId === user.id && (
                        <div className="mt-4 space-y-2 overflow-y-auto max-h-48 border border-white/5 rounded-2xl p-4 bg-zinc-950/50 animate-in slide-in-from-top-2 duration-300 custom-scrollbar">
                           {!user.work_history || user.work_history.length === 0 ? (
                              <p className="text-xs text-zinc-600 italic text-center py-4">Sin actividad registrada todavía.</p>
                           ) : (
                              <div className="space-y-2">
                                 {user.work_history.map((hist: any) => (
                                    <div key={hist.id} className="flex justify-between items-center text-xs p-3 bg-zinc-900 border border-white/5 rounded-xl">
                                       <div className="flex flex-col gap-0.5">
                                          <span className="font-bold text-white">{new Date(hist.date).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                                          <span className="text-[10px] text-zinc-500 font-bold uppercase">U: {hist.vehicle_plate}</span>
                                       </div>
                                       <div className="flex gap-4 items-center">
                                          <span className="text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">{hist.hours} hs</span>
                                          <span className="text-amber-400 font-black">${hist.revenue.toLocaleString()}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREAR USUARIO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none rounded-[2.5rem]" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-2xl font-black text-white italic">Nuevo Legajo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
             
             <div className="flex bg-zinc-950 p-1.5 rounded-xl mb-6 border border-white/5 relative z-10">
                <button 
                  onClick={() => { setAddMode('manual'); setSelectedApplicantId(null); setNewUser({ ...newUser, full_name: '' }); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'manual' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  Manual
                </button>
                <button 
                  onClick={() => setAddMode('applicant')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'applicant' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  De Postulante
                </button>
             </div>

             <form onSubmit={handleAddUser} className="space-y-4 relative z-10">
               {addMode === 'applicant' && (
                 <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Seleccionar Postulante Aprobado</label>
                   <select 
                    required 
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 font-bold appearance-none transition-colors"
                    onChange={(e) => {
                      const app = approvedApplicants.find(a => a.id === e.target.value);
                      if (app) {
                        setSelectedApplicantId(app.id);
                        setNewUser({ ...newUser, full_name: app.full_name });
                      }
                    }}
                   >
                     <option value="">Seleccionar...</option>
                     {approvedApplicants.map(app => (
                       <option key={app.id} value={app.id}>{app.full_name} (DNI: {app.dni})</option>
                     ))}
                   </select>
                 </div>
               )}

                 <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Nombre Completo</label>
                 <input 
                  required 
                  type="text" 
                  value={newUser.full_name} 
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})} 
                  readOnly={addMode === 'applicant'}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 font-bold disabled:opacity-50 transition-colors" 
                  placeholder="Roberto Gomez" 
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Email de Acceso</label>
                 <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 font-bold transition-colors" placeholder="email@dominio.com" />
               </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Contraseña Inicial</label>
                  <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 font-bold transition-colors" placeholder="********" />
                </div>

                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Legajo</label>
                    <input required type="text" value={newUser.legajo} onChange={e => setNewUser({...newUser, legajo: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 font-bold transition-colors" placeholder="LEG-001" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Cargo</label>
                    <select required value={newUser.cargo} onChange={e => setNewUser({...newUser, cargo: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 font-bold appearance-none transition-colors">
                      <option value="">Seleccionar...</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Detailer / Washer">Detailer / Washer</option>
                      <option value="Cajero / Receptor">Cajero / Receptor</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Especialidad</label>
                    <select required value={newUser.funcion} onChange={e => setNewUser({...newUser, funcion: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 font-bold appearance-none transition-colors">
                      <option value="">Seleccionar...</option>
                      <option value="Lavado Exterior">Lavado Exterior</option>
                      <option value="Limpieza Interior">Limpieza Interior</option>
                      <option value="Lustrado y Pulido">Lustrado y Pulido</option>
                      <option value="Tratamiento Cerámico">Tratamiento Cerámico</option>
                      <option value="Gestión de Caja">Gestión de Caja</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Turno Horario</label>
                    <select required value={newUser.turno} onChange={e => setNewUser({...newUser, turno: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 font-bold appearance-none transition-colors">
                      <option value="">Seleccionar...</option>
                      <option value="Turno Mañana (08-16)">Turno Mañana (08-16)</option>
                      <option value="Turno Tarde (16-00)">Turno Tarde (16-00)</option>
                      <option value="Turno Completo (09-18)">Turno Completo (09-18)</option>
                      <option value="Fin de Semana">Fin de Semana</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-white uppercase tracking-tight">Notificar por Email</span>
                     <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Enviar credenciales al empleado</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${sendEmail ? 'bg-amber-500 justify-end' : 'bg-zinc-800 justify-start'}`}
                  >
                     <div className={`w-4 h-4 rounded-full shadow-lg transition-all ${sendEmail ? 'bg-white' : 'bg-zinc-500'}`} />
                  </button>
               </div>

               <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-[1.02] transition-transform mt-4">
                 {addMode === 'applicant' ? 'CONTRATAR Y CREAR ACCESO' : 'CREAR LEGAJO DIGITAL'}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
