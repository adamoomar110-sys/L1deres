'use client';
import { useState, useEffect } from 'react';
import { Car, User, ShieldCheck, AlertTriangle, Search, Filter, Plus, MoreVertical, X, Droplets, Waves } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import VehicleSidePanel from '@/components/VehicleSidePanel';

export default function FlotaAdmin() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({ plate: '', brand: '', model: '', year: new Date().getFullYear(), color: 'Blanco', status: 'active' });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState<{id: string, status: string} | null>(null);
  const [serviceDetails, setServiceDetails] = useState({ date: '', budget: '', description: '' });
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const popularBrands = ['Fiat', 'Peugeot', 'Toyota', 'Volkswagen', 'Renault', 'Chevrolet', 'Ford', 'Nissan', 'Citroën', 'Jeep'];
  const popularModels: { [key: string]: string[] } = {
    'Fiat': ['Cronos', 'Pulse', 'Toro', 'Mobi', 'Strada'],
    'Peugeot': ['208', '2008', '3008', 'Partner'],
    'Toyota': ['Hilux', 'Etios', 'Corolla', 'Corolla Cross', 'Yaris', 'SW4'],
    'Volkswagen': ['Amarok', 'Taos', 'Gol Trend', 'Polo', 'Virtus', 'T-Cross'],
    'Renault': ['Sandero', 'Stepway', 'Logan', 'Kangoo', 'Alaskan', 'Duster'],
    'Chevrolet': ['Onix', 'Cruze', 'Tracker', 'S10', 'Joy'],
    'Ford': ['Ranger', 'Territory', 'Maverick', 'Transit'],
    'Nissan': ['Frontier', 'Kicks', 'Versa', 'Sentra'],
    'Citroën': ['C3', 'C4 Cactus', 'Berlingo'],
    'Jeep': ['Renegade', 'Compass']
  };
  const popularColors = ['Blanco', 'Negro', 'Gris Plata', 'Gris Oscuro', 'Rojo', 'Azul', 'Beige', 'Blanco Perlado'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log('🔄 Iniciando carga de datos mediante Túnel API...');
    
    try {
      const res = await fetch('/api/admin/flota');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al conectar con el servidor');
      
      setDrivers(data.drivers || []);
      setVehicles(data.vehicles || []);
      
      console.log('✅ Datos cargados exitosamente (Bypass RLS):', {
        choferes: data.drivers?.length,
        autos: data.vehicles?.length
      });
      
    } catch (err: any) {
      console.error('❌ Error fatal de carga:', err.message);
    }
    
    setLoading(false);
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const vehicleDataToSave = {
      plate: newVehicle.plate,
      brand: newVehicle.brand,
      model: newVehicle.model,
      name: `${newVehicle.brand} ${newVehicle.model}`, // Requerido por la base de datos remota
      status: newVehicle.status
    };

    try {
      const res = await fetch('/api/admin/flota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleDataToSave)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      alert('Vehículo añadido correctamente');
      setShowAddModal(false);
      setNewVehicle({ plate: '', brand: '', model: '', year: new Date().getFullYear(), color: 'Blanco', status: 'active' });
      fetchData();
    } catch (error: any) {
      alert('Error al añadir vehículo: ' + error.message);
    }
  };

  const handleAssignDriver = async (driverId: string, vehicleId: string | null) => {
    setLoading(true);
    setShowAssignModal(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driverId, vehicle_id: vehicleId })
      });
      if (!res.ok) throw new Error('Error al asignar chofer');
      fetchData();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, extraData: any = {}) => {
    setOpenMenuId(null);
    if ((status === 'maintenance' || status === 'lubricentro' || status === 'lavadero') && !extraData.confirmed) {
      setShowServiceModal({ id, status });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/flota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status,
          appointment_date: extraData.date,
          budget: extraData.budget,
          description: extraData.description
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al actualizar estado');
      }
      setShowServiceModal(null);
      setServiceDetails({ date: '', budget: '', description: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string, plate: string) => {
    setOpenMenuId(null);
    if (!confirm(`¿Estás seguro de eliminar la unidad ${plate}? Esta acción es irreversible.`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flota?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar unidad');
      fetchData();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-lime-400 bg-lime-500/10 border-lime-500/20 shadow-[0_0_10px_rgba(163,230,53,0.2)]';
      case 'maintenance': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'lubricentro': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'lavadero': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'out_of_service': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const assignedDriver = drivers.find(d => d.vehicle_id === v.id);
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      v.plate?.toLowerCase().includes(searchLower) ||
      v.brand?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      (assignedDriver && assignedDriver.full_name?.toLowerCase().includes(searchLower)) ||
      (assignedDriver && assignedDriver.email?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight italic leading-none">Gestión de Flota</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Control de Unidades y Conductores</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl w-64 shadow-inner">
            <Search className="text-zinc-500" size={15} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar chofer o patente..." 
              className="bg-transparent border-none focus:outline-none text-xs ml-2.5 w-full text-white placeholder-zinc-600 font-medium" 
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-yellow-500 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
            <Plus size={16} /> ALTA UNIDAD
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Stats Row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
           {[
             { label: 'Total Unidades', val: vehicles.length, icon: Car, color: 'text-white' },
             { label: 'Choferes Activos', val: drivers.length, icon: User, color: 'text-blue-400' },
             { label: 'Disponibles', val: vehicles.filter(v => v.status === 'active' && !drivers.find(d => d.vehicle_id === v.id)).length, icon: ShieldCheck, color: 'text-lime-400' },
             { label: 'En Taller', val: vehicles.filter(v => v.status === 'maintenance').length, icon: AlertTriangle, color: 'text-yellow-500' },
             { label: 'En Lubricentro', val: vehicles.filter(v => v.status === 'lubricentro').length, icon: Droplets, color: 'text-blue-400' },
             { label: 'En Lavadero', val: vehicles.filter(v => v.status === 'lavadero').length, icon: Waves, color: 'text-cyan-400' },
           ].map((stat, i) => (
             <div key={i} className="bg-zinc-900/40 p-3.5 rounded-xl border border-white/5 backdrop-blur-xl">
                <stat.icon className={`${stat.color} mb-2`} size={18} />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-xl font-black text-white">{stat.val}</p>
             </div>
           ))}
        </div>

        {/* Fleet List */}
        <div className="space-y-2">
          <div className="grid grid-cols-6 px-5 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
             <div className="col-span-2">Unidad / Vehículo</div>
             <div>Chofer Asignado</div>
             <div>Estado</div>
             <div>Último Control</div>
             <div className="text-right">Acciones</div>
          </div>

          {loading ? (
            <div className="flex justify-center p-16">
               <div className="w-8 h-8 border-3 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : filteredVehicles.length === 0 ? (
             <div className="text-center py-12 bg-zinc-900/30 border border-white/5 rounded-2xl">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No se encontraron vehículos que coincidan con la búsqueda</p>
             </div>
          ) : (
            filteredVehicles.map(v => {
              const assignedDriver = drivers.find(d => d.vehicle_id === v.id);
              return (
                <div key={v.id} className="grid grid-cols-6 items-center px-5 py-3 bg-zinc-900/30 border border-white/5 rounded-xl hover:bg-zinc-900/50 hover:border-white/10 transition-all group cursor-pointer" onClick={() => setSelectedVehicle(v)}>
                   <div className="col-span-2 flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                         <Car size={20} className="text-yellow-500" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-sm font-black text-white leading-none mb-0.5 truncate">{v.plate}</p>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{v.brand} {v.model}</p>
                      </div>
                   </div>

                   <div>
                      {assignedDriver ? (
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded-md flex items-center justify-center font-black text-[9px] shrink-0">
                               {assignedDriver.full_name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-zinc-300 truncate">{assignedDriver.full_name}</span>
                         </div>
                      ) : (
                         <span className="text-[11px] text-zinc-600 font-bold italic">Sin asignar</span>
                      )}
                   </div>

                   <div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border inline-block ${getStatusColor(v.status)}`}>
                         {v.status === 'active' ? 'Operativo' : v.status === 'maintenance' ? 'En Taller' : v.status === 'lubricentro' ? 'En Lubricentro' : v.status === 'lavadero' ? 'En Lavadero' : 'Baja'}
                      </span>
                   </div>

                   <div className="text-[11px] text-zinc-500 font-medium">
                      Hace 2 horas
                   </div>

                   <div className="flex justify-end relative">
                      <button 
                         onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === v.id ? null : v.id); }}
                         className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors focus:outline-none"
                      >
                         <MoreVertical size={15} />
                      </button>

                      {openMenuId === v.id && (
                        <div className="absolute right-0 top-12 w-48 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                           {!assignedDriver ? (
                             <button onClick={() => { setOpenMenuId(null); setShowAssignModal(v.id); }} className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors">
                                Asignar Chofer
                             </button>
                           ) : (
                             <button onClick={() => { setOpenMenuId(null); handleAssignDriver(assignedDriver.id, null); }} className="w-full text-left px-4 py-3 text-xs font-bold text-orange-400 hover:bg-orange-500/10 transition-colors">
                                Desasignar Chofer
                             </button>
                           )}
                           {v.status !== 'maintenance' && (
                             <button onClick={() => handleUpdateStatus(v.id, 'maintenance')} className="w-full text-left px-4 py-3 text-xs font-bold text-yellow-500 hover:bg-yellow-500/10 transition-colors border-t border-white/5">
                                Mandar al Taller
                             </button>
                           )}
                           {v.status !== 'lubricentro' && (
                             <button onClick={() => handleUpdateStatus(v.id, 'lubricentro')} className="w-full text-left px-4 py-3 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors border-t border-white/5">
                                Mandar al Lubricentro
                             </button>
                           )}
                           {v.status !== 'lavadero' && (
                             <button onClick={() => handleUpdateStatus(v.id, 'lavadero')} className="w-full text-left px-4 py-3 text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 transition-colors border-t border-white/5">
                                Mandar al Lavadero
                             </button>
                           )}
                           {(v.status === 'maintenance' || v.status === 'lubricentro' || v.status === 'lavadero') && (
                             <button onClick={() => handleUpdateStatus(v.id, 'active')} className="w-full text-left px-4 py-3 text-xs font-bold text-lime-400 hover:bg-lime-500/10 transition-colors border-t border-white/5">
                                Marcar como Operativo
                             </button>
                           )}
                           <button onClick={() => handleDeleteVehicle(v.id, v.plate)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-white/5">
                              Dar de Baja / Eliminar
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL ALTA UNIDAD */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col rounded-[2rem] p-6 md:p-7 shadow-3xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-white italic">Nueva Unidad</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddVehicle} className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Patente / Dominio</label>
                <input required type="text" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" placeholder="AB 123 CD" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Marca</label>
                  <input list="brands" required type="text" value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" placeholder="Toyota" />
                  <datalist id="brands">
                    {popularBrands.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Modelo</label>
                  <input list="models" required type="text" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" placeholder="Etios" />
                  <datalist id="models">
                    {newVehicle.brand && popularModels[newVehicle.brand]?.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Año</label>
                  <input required type="number" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Color</label>
                  <input list="colors" required type="text" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" />
                  <datalist id="colors">
                    {popularColors.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <button type="submit" className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl shadow-xl shadow-yellow-500/20 hover:bg-yellow-400 transition-all uppercase text-xs tracking-wider sticky bottom-0 z-10 mt-3">
                REGISTRAR UNIDAD OFICIAL
              </button>
            </form>
          </div>
        </div>
      )}
      {/* MODAL ASIGNAR CHOFER */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col rounded-[2rem] p-6 md:p-7 shadow-3xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-white italic">Asignar Chofer</h3>
              <button onClick={() => setShowAssignModal(null)} className="text-zinc-500 hover:text-white p-1"><X size={20} /></button>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {drivers.filter(d => !d.vehicle_id).length === 0 ? (
                 <p className="text-zinc-500 text-sm text-center italic py-4">No hay choferes libres disponibles.</p>
              ) : (
                 drivers.filter(d => !d.vehicle_id).map(d => (
                   <button 
                     key={d.id}
                     onClick={() => handleAssignDriver(d.id, showAssignModal)}
                     className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-left hover:bg-white/5 transition-all group flex items-center gap-3"
                   >
                     <div className="w-9 h-9 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center font-black text-xs">
                       {d.full_name.charAt(0)}
                     </div>
                     <div>
                       <p className="font-bold text-white text-sm group-hover:text-yellow-500 transition-colors">{d.full_name}</p>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{d.email}</p>
                     </div>
                   </button>
                 ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL DERIVACIÓN A SERVICIO (TALLER/LUBRICENTRO/LAVADERO) */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col rounded-[2rem] p-6 md:p-7 shadow-3xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">
                  Derivar a {showServiceModal.status === 'maintenance' ? 'Taller' : showServiceModal.status === 'lubricentro' ? 'Lubricentro' : 'Lavadero'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Ingresar detalles del servicio</p>
              </div>
              <button onClick={() => setShowServiceModal(null)} className="text-zinc-500 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Fecha y Hora de Turno</label>
                <input 
                  type="datetime-local" 
                  value={serviceDetails.date} 
                  onChange={e => setServiceDetails({...serviceDetails, date: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Presupuesto Estimado ($)</label>
                <input 
                  type="number" 
                  value={serviceDetails.budget} 
                  onChange={e => setServiceDetails({...serviceDetails, budget: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold" 
                  placeholder="0.00" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Motivo / Descripción</label>
                <textarea 
                  value={serviceDetails.description} 
                  onChange={e => setServiceDetails({...serviceDetails, description: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500 font-bold h-20" 
                  placeholder="Ej: Mantenimiento correctivo o preventivo" 
                />
              </div>

              <button 
                onClick={() => handleUpdateStatus(showServiceModal.id, showServiceModal.status, { ...serviceDetails, confirmed: true })}
                className={`w-full py-4 rounded-xl font-black text-black shadow-xl transition-all uppercase text-xs tracking-wider sticky bottom-0 z-10 mt-2 ${showServiceModal.status === 'maintenance' ? 'bg-yellow-500 shadow-yellow-500/20 hover:bg-yellow-400' : showServiceModal.status === 'lubricentro' ? 'bg-blue-500 shadow-blue-500/20 hover:bg-blue-400' : 'bg-cyan-500 shadow-cyan-500/20 hover:bg-cyan-400'}`}
              >
                CONFIRMAR Y DERIVAR UNIDAD
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVehicle && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={() => setSelectedVehicle(null)} />
          <VehicleSidePanel 
            vehicle={selectedVehicle} 
            onClose={() => setSelectedVehicle(null)} 
            onUpdate={() => { fetchData(); }}
          />
        </>
      )}
    </div>
  );
}
