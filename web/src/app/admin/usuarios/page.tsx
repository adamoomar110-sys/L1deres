'use client';
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, X, Trash2, Gauge, Clock, DollarSign, ChevronRight } from 'lucide-react';
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

       // Si viene de un postulante, marcarlo como contratado (hired)
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

  return (
    <div className="flex flex-col h-full bg-orange-50">
      <header className="h-24 px-10 flex items-center justify-between border-b border-orange-200 bg-orange-100/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tighter italic">Legajos de Personal</h2>
          <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Rendimiento y Perfiles de Choferes</p>
        </div>
        
        <button onClick={() => setShowAddModal(true)} className="bg-green-400 text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20">
          <UserPlus size={20} /> CREAR EMPLEADO NUEVO
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {loading ? (
             <div className="col-span-full flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-green-400/20 border-t-yellow-500 rounded-full animate-spin" />
             </div>
          ) : users.map(user => (
            <div key={user.id} className="bg-white backdrop-blur-xl border border-orange-200 rounded-[3rem] overflow-hidden group hover:bg-orange-100/50 transition-all flex flex-col justify-between">
               <div>
                  <div className="p-8 flex items-start gap-6">
                     <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-black rounded-3xl flex items-center justify-center border border-orange-200 relative">
                        <Users size={40} className="text-zinc-600 group-hover:text-green-600 transition-colors" />
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-green-400 text-black text-[9px] font-black rounded-lg uppercase shadow-lg">
                           {user.role}
                        </div>
                     </div>

                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <h3 className="text-2xl font-black text-black tracking-tight">{user.full_name}</h3>
                              {user.legajo && (
                                 <span className="inline-block mt-1 text-[10px] font-black bg-orange-200/60 text-orange-700 px-2 py-0.5 rounded-md">
                                    Legajo: {user.legajo}
                                 </span>
                              )}
                           </div>
                           <button 
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              className="text-zinc-700 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-xl cursor-pointer"
                              title="Eliminar Usuario"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                        <p className="text-zinc-600 text-sm font-medium mb-4 flex items-center gap-2">
                           <Mail size={14} /> {user.email}
                        </p>
                        
                        {user.vehicles && (
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-orange-200 text-[10px] font-bold text-zinc-700 uppercase">
                              Unidad: {user.vehicles.plate} - {user.vehicles.brand}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Cargos, Función y Turno Horario */}
                  {(user.cargo || user.funcion || user.turno) && (
                     <div className="grid grid-cols-3 gap-3 px-8 pb-6">
                        <div className="p-3 bg-white/50 border border-orange-100 rounded-2xl flex flex-col gap-0.5">
                           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Cargo</span>
                           <span className="text-xs font-bold text-black truncate">{user.cargo || 'No asignado'}</span>
                        </div>
                        <div className="p-3 bg-white/50 border border-orange-100 rounded-2xl flex flex-col gap-0.5">
                           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Especialidad</span>
                           <span className="text-xs font-bold text-black truncate">{user.funcion || 'No asignado'}</span>
                        </div>
                        <div className="p-3 bg-white/50 border border-orange-100 rounded-2xl flex flex-col gap-0.5">
                           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Turno</span>
                           <span className="text-xs font-bold text-black truncate">{user.turno || 'No asignado'}</span>
                        </div>
                     </div>
                  )}
               </div>

               <div>
                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 bg-white/40 border-t border-orange-200 p-8 gap-4">
                     <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 text-zinc-600 mb-1">
                           <Gauge size={14} className="text-green-600" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Total KM</span>
                        </div>
                        <p className="text-xl font-black text-black">{user.stats.km.toLocaleString()}</p>
                     </div>
                     <div className="text-center border-x border-orange-200 space-y-1">
                        <div className="flex items-center justify-center gap-2 text-zinc-600 mb-1">
                           <Clock size={14} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Horas Uso</span>
                        </div>
                        <p className="text-xl font-black text-black">{user.stats.hours} hs</p>
                     </div>
                     <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 text-zinc-600 mb-1">
                           <DollarSign size={14} className="text-lime-400 drop-shadow-[0_0_5px_rgba(163,230,53,0.5)]" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Recaudado</span>
                        </div>
                        <p className="text-xl font-black text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">${user.stats.revenue.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Historial de Trabajo Colapsable */}
                  <div className="border-t border-orange-200 p-6 bg-white/20">
                     <button 
                        type="button"
                        onClick={() => setExpandedHistoryUserId(expandedHistoryUserId === user.id ? null : user.id)}
                        className="w-full py-3 bg-orange-100 hover:bg-orange-200/50 border border-orange-200 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                     >
                        <span>{expandedHistoryUserId === user.id ? 'Ocultar Historial' : 'Ver Historial de Trabajo'}</span>
                        <ChevronRight size={14} className={`transform transition-transform ${expandedHistoryUserId === user.id ? 'rotate-90' : ''}`} />
                     </button>

                     {expandedHistoryUserId === user.id && (
                        <div className="mt-4 space-y-2 overflow-y-auto max-h-48 border border-orange-200/50 rounded-2xl p-4 bg-white/50 animate-in slide-in-from-top-2 duration-300">
                           {!user.work_history || user.work_history.length === 0 ? (
                              <p className="text-xs text-zinc-600 italic text-center py-4">Sin turnos registrados todavía.</p>
                           ) : (
                              <div className="space-y-2">
                                 {user.work_history.map((hist: any) => (
                                    <div key={hist.id} className="flex justify-between items-center text-xs p-3 bg-white/80 border border-orange-100 rounded-xl">
                                       <div className="flex flex-col gap-0.5">
                                          <span className="font-bold text-black">{new Date(hist.date).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                                          <span className="text-[10px] text-zinc-600 font-bold uppercase">Unidad: {hist.vehicle_plate}</span>
                                       </div>
                                       <div className="flex gap-4 items-center">
                                          <span className="text-zinc-600 font-bold">{hist.hours} hs</span>
                                          <span className="text-green-600 font-black">${hist.revenue.toLocaleString()}</span>
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
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-orange-100 border border-orange-200 w-full max-w-md rounded-[2.5rem] p-10 shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-black italic">Nuevo Usuario</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-600 hover:text-black"><X /></button>
            </div>
             <div className="flex bg-white/40 p-2 rounded-2xl mb-8 border border-orange-200">
                <button 
                  onClick={() => { setAddMode('manual'); setSelectedApplicantId(null); setNewUser({ ...newUser, full_name: '' }); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'manual' ? 'bg-green-400 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-600 hover:text-black'}`}
                >
                  Nuevo (Manual)
                </button>
                <button 
                  onClick={() => setAddMode('applicant')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'applicant' ? 'bg-green-400 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-600 hover:text-black'}`}
                >
                  De Postulante
                </button>
             </div>

             <form onSubmit={handleAddUser} className="space-y-6">
               {addMode === 'applicant' && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Seleccionar Postulante Aprobado</label>
                   <select 
                    required 
                    className="w-full bg-white border border-orange-200 rounded-2xl p-5 text-black outline-none focus:border-green-400 font-bold appearance-none"
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

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Nombre Completo</label>
                 <input 
                  required 
                  type="text" 
                  value={newUser.full_name} 
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})} 
                  readOnly={addMode === 'applicant'}
                  className="w-full bg-white border border-orange-200 rounded-2xl p-5 text-black outline-none focus:border-green-400 font-bold disabled:opacity-50" 
                  placeholder="Roberto Gomez" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Email de Acceso</label>
                 <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-white border border-orange-200 rounded-2xl p-5 text-black outline-none focus:border-green-400 font-bold" placeholder="email@dominio.com" />
               </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Contraseña Inicial</label>
                  <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-white border border-orange-200 rounded-2xl p-5 text-black outline-none focus:border-green-400 font-bold" placeholder="********" />
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Legajo</label>
                    <input required type="text" value={newUser.legajo} onChange={e => setNewUser({...newUser, legajo: e.target.value})} className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-green-400 font-bold" placeholder="LEG-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Cargo</label>
                    <select required value={newUser.cargo} onChange={e => setNewUser({...newUser, cargo: e.target.value})} className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-green-400 font-bold appearance-none">
                      <option value="">Seleccionar...</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Detailer / Washer">Detailer / Washer</option>
                      <option value="Cajero / Receptor">Cajero / Receptor</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Especialidad</label>
                    <select required value={newUser.funcion} onChange={e => setNewUser({...newUser, funcion: e.target.value})} className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-green-400 font-bold appearance-none">
                      <option value="">Seleccionar...</option>
                      <option value="Lavado Exterior">Lavado Exterior</option>
                      <option value="Limpieza Interior">Limpieza Interior</option>
                      <option value="Lustrado y Pulido">Lustrado y Pulido</option>
                      <option value="Tratamiento Cerámico">Tratamiento Cerámico</option>
                      <option value="Gestión de Caja">Gestión de Caja</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Turno Horario</label>
                    <select required value={newUser.turno} onChange={e => setNewUser({...newUser, turno: e.target.value})} className="w-full bg-white border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-green-400 font-bold appearance-none">
                      <option value="">Seleccionar...</option>
                      <option value="Turno Mañana (08-16)">Turno Mañana (08-16)</option>
                      <option value="Turno Tarde (16-00)">Turno Tarde (16-00)</option>
                      <option value="Turno Completo (09-18)">Turno Completo (09-18)</option>
                      <option value="Fin de Semana">Fin de Semana</option>
                    </select>
                  </div>
                </div>

               <div className="flex items-center justify-between p-5 bg-white/40 rounded-2xl border border-orange-200">
                  <div className="flex flex-col">
                     <span className="text-xs font-black text-black uppercase tracking-tight">Notificar por Email</span>
                     <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Enviar credenciales al chofer</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${sendEmail ? 'bg-green-400 justify-end' : 'bg-zinc-800 justify-start'}`}
                  >
                     <div className={`w-6 h-6 rounded-full shadow-lg transition-all ${sendEmail ? 'bg-white' : 'bg-zinc-500'}`} />
                  </button>
               </div>

               <button type="submit" className="w-full bg-green-400 text-black font-black py-5 rounded-2xl shadow-xl shadow-yellow-500/20 hover:bg-yellow-400 transition-all mt-4">
                 {addMode === 'applicant' ? 'CONTRATAR Y CREAR ACCESO' : 'CREAR LEGAJO DIGITAL'}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
