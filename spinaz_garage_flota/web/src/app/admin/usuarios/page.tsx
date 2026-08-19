'use client';
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, X, Trash2, Gauge, Clock, DollarSign, ChevronRight, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DriverSidePanel from '@/components/DriverSidePanel';

export default function UsuariosAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'driver', password: '' });
  const [approvedApplicants, setApprovedApplicants] = useState<any[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'manual' | 'applicant'>('manual');
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'driver' | 'services'>('all');

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
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      
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
       
       const text = await res.text();
       let data: any = {};
       try { data = JSON.parse(text); } catch {}
       
       if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

       // Si viene de un postulante, marcarlo como contratado (hired)
       if (addMode === 'applicant' && selectedApplicantId) {
          await supabase
            .from('applicants')
            .update({ status: 'hired' })
            .eq('id', selectedApplicantId);
       }

       const roleNames: Record<string, string> = {
          admin: 'Administrador',
          mechanic: 'Jefe de Taller',
          lubricentro: 'Jefe de Lubricentro',
          lavadero: 'Jefe de Lavadero',
          driver: 'Chofer'
       };
       alert(`Usuario ${roleNames[newUser.role] || 'Chofer'} creado con éxito`);
       setShowAddModal(false);
       setNewUser({ full_name: '', email: '', role: 'driver', password: '' });
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
       
       const text = await res.text();
       let err: any = {};
       try { err = JSON.parse(text); } catch {}

       if (!res.ok) {
          throw new Error(err.error || 'Error al eliminar');
       }

       alert('Usuario eliminado correctamente');
       fetchUsersWithStats();
    } catch (err: any) {
       alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: '🛡️ Admin', bg: 'bg-yellow-500 text-black border-yellow-400 font-black' };
      case 'mechanic':
        return { label: '🛠️ Jefe Taller', bg: 'bg-orange-500 text-white border-orange-400 font-bold' };
      case 'lubricentro':
        return { label: '🛢️ Jefe Lubricentro', bg: 'bg-lime-500 text-black border-lime-400 font-bold' };
      case 'lavadero':
        return { label: '🧽 Jefe Lavadero', bg: 'bg-cyan-500 text-black border-cyan-400 font-bold' };
      default:
        return { label: '🚖 Chofer', bg: 'bg-blue-600 text-white border-blue-400 font-bold' };
    }
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter === 'admin' && user.role !== 'admin') return false;
    if (roleFilter === 'driver' && user.role !== 'driver' && user.role) return false;
    if (roleFilter === 'services' && user.role !== 'mechanic' && user.role !== 'lubricentro' && user.role !== 'lavadero') return false;

    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;

    const vehiclePlate = user.vehicles?.plate || '';
    const vehicleBrand = user.vehicles?.brand || '';
    const vehicleModel = user.vehicles?.model || '';

    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      vehiclePlate.toLowerCase().includes(searchLower) ||
      `${vehicleBrand} ${vehicleModel}`.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight italic leading-none">Legajos de Personal</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Gestión Diferenciada: Choferes y Administradores</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl w-64 shadow-inner">
            <Search className="text-zinc-500" size={15} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o patente..." 
              className="bg-transparent border-none focus:outline-none text-xs ml-2.5 w-full text-white placeholder-zinc-600 font-medium" 
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-yellow-500 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
            <UserPlus size={16} /> NUEVO USUARIO / ADMIN
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* BARRA DE FILTROS POR ROL */}
        <div className="flex items-center gap-2 mb-5 bg-black/40 p-1.5 rounded-xl border border-white/5 w-fit">
          <button 
            onClick={() => setRoleFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${roleFilter === 'all' ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' : 'text-zinc-400 hover:text-white'}`}
          >
            Todos ({users.length})
          </button>
          <button 
            onClick={() => setRoleFilter('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${roleFilter === 'admin' ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' : 'text-zinc-400 hover:text-white'}`}
          >
            🛡️ Admin ({users.filter(u => u.role === 'admin').length})
          </button>
          <button 
            onClick={() => setRoleFilter('driver')}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${roleFilter === 'driver' ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' : 'text-zinc-400 hover:text-white'}`}
          >
            🚖 Choferes ({users.filter(u => u.role === 'driver' || !u.role).length})
          </button>
          <button 
            onClick={() => setRoleFilter('services')}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${roleFilter === 'services' ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' : 'text-zinc-400 hover:text-white'}`}
          >
            🛠️ Servicios ({users.filter(u => u.role === 'mechanic' || u.role === 'lubricentro' || u.role === 'lavadero').length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
             <div className="col-span-full flex justify-center py-16">
                <div className="w-8 h-8 border-3 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
             </div>
          ) : filteredUsers.length === 0 ? (
             <div className="col-span-full text-center py-12 bg-zinc-900/30 border border-white/5 rounded-2xl">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No hay usuarios registrados en esta categoría</p>
             </div>
          ) : filteredUsers.map(user => {
            const roleInfo = getRoleInfo(user.role);
            return (
              <div key={user.id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden group hover:bg-zinc-900/60 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between" onClick={() => setSelectedDriver(user)}>
                 <div className="p-4 flex items-start gap-3.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-black rounded-xl flex items-center justify-center border border-white/5 relative shrink-0">
                       <Users size={22} className="text-zinc-500 group-hover:text-yellow-500 transition-colors" />
                       <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] uppercase shadow-md rounded border ${roleInfo.bg}`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'Chofer' : roleInfo.label.split(' ')[1] || 'Staff'}
                       </div>
                    </div>

                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-0.5">
                          <h3 className="text-sm font-black text-white tracking-tight truncate">{user.full_name}</h3>
                          {user.role !== 'admin' ? (
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id, user.full_name); }}
                                className="text-zinc-600 hover:text-red-500 transition-colors p-1 hover:bg-red-500/10 rounded-lg shrink-0 ml-1"
                                title="Eliminar Usuario"
                             >
                                <Trash2 size={14} />
                             </button>
                          ) : (
                             <div className="flex items-center gap-1 text-[8px] font-black text-yellow-500/80 uppercase tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20 shrink-0 ml-1">
                                <Shield size={10} /> Protegido
                             </div>
                          )}
                       </div>
                       <p className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-1.5 truncate">
                          <Mail size={12} className="shrink-0" /> <span className="truncate">{user.email}</span>
                       </p>
                       
                       {user.vehicles ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/5 rounded-md border border-white/5 text-[9px] font-bold text-zinc-400 uppercase">
                             🚗 {user.vehicles.plate} • {user.vehicles.brand}
                          </div>
                       ) : (
                          <span className="text-[9px] text-zinc-600 font-bold uppercase">Sin vehículo asignado</span>
                       )}
                    </div>
                 </div>

                 {/* Stats Bar */}
                 <div className="grid grid-cols-3 bg-black/40 border-t border-white/5 py-2.5 px-3 gap-2">
                    <div className="text-center">
                       <div className="flex items-center justify-center gap-1 text-zinc-500 mb-0.5">
                          <Gauge size={11} className="text-yellow-500" />
                          <span className="text-[8px] font-black uppercase tracking-wider">KM</span>
                       </div>
                       <p className="text-xs font-black text-white">{user.stats.km.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                       <div className="flex items-center justify-center gap-1 text-zinc-500 mb-0.5">
                          <Clock size={11} className="text-blue-400" />
                          <span className="text-[8px] font-black uppercase tracking-wider">Uso</span>
                       </div>
                       <p className="text-xs font-black text-white">{user.stats.hours} hs</p>
                    </div>
                    <div className="text-center">
                       <div className="flex items-center justify-center gap-1 text-zinc-500 mb-0.5">
                          <DollarSign size={11} className="text-lime-400" />
                          <span className="text-[8px] font-black uppercase tracking-wider">Recaudado</span>
                       </div>
                       <p className="text-xs font-black text-lime-400">${user.stats.revenue.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CREAR USUARIO CON SELECTOR DE ROL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col rounded-[2rem] p-6 md:p-7 shadow-3xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-white italic">Crear Nuevo Usuario</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="flex bg-black/40 p-1.5 rounded-xl mb-4 border border-white/5 shrink-0">
              <button 
                onClick={() => { setAddMode('manual'); setSelectedApplicantId(null); setNewUser({ ...newUser, full_name: '' }); }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'manual' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}
              >
                Nuevo (Manual)
              </button>
              <button 
                onClick={() => setAddMode('applicant')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${addMode === 'applicant' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}
              >
                De Postulante
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              
              {/* SELECTOR DE ROL / TIPO DE USUARIO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest pl-1">
                  Tipo de Usuario / Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-extrabold appearance-none cursor-pointer shadow-md shadow-yellow-500/5"
                >
                  <option value="driver">🚖 Chofer / Conductor (App Móvil)</option>
                  <option value="admin">🛡️ Administrador (Acceso Total a Comando)</option>
                  <option value="mechanic">🛠️ Jefe de Taller (Acceso a Portal Taller)</option>
                  <option value="lubricentro">🛢️ Jefe de Lubricentro (Acceso a Portal Lubricentro)</option>
                  <option value="lavadero">🧽 Jefe de Lavadero (Acceso a Portal Lavadero)</option>
                </select>
              </div>

              {addMode === 'applicant' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Seleccionar Postulante Aprobado</label>
                  <select 
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold appearance-none"
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
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Nombre Completo</label>
                <input 
                  required 
                  type="text" 
                  value={newUser.full_name} 
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})} 
                  readOnly={addMode === 'applicant'}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold disabled:opacity-50" 
                  placeholder="Ej: Roberto Gomez" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Email de Acceso</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" placeholder="email@dominio.com" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Contraseña Inicial</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" placeholder="********" />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-black/40 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white uppercase tracking-tight">Notificar por Email</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Enviar credenciales al usuario</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`w-12 h-7 rounded-full p-0.5 transition-all duration-300 flex items-center ${sendEmail ? 'bg-yellow-500 justify-end' : 'bg-zinc-800 justify-start'}`}
                >
                  <div className={`w-6 h-6 rounded-full shadow-lg transition-all ${sendEmail ? 'bg-black' : 'bg-zinc-500'}`} />
                </button>
              </div>

              <button type="submit" className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl shadow-xl shadow-yellow-500/20 hover:bg-yellow-400 transition-all uppercase text-xs tracking-wider sticky bottom-0 z-10 mt-2">
                {addMode === 'applicant' ? 'CONTRATAR Y CREAR ACCESO' : `CREAR USUARIO (${newUser.role.toUpperCase()})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedDriver && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={() => setSelectedDriver(null)} />
          <DriverSidePanel 
            driver={selectedDriver} 
            onClose={() => setSelectedDriver(null)} 
            onUpdate={() => { fetchUsersWithStats(); }}
          />
        </>
      )}
    </div>
  );
}
