'use client';
import React, { useState, useEffect } from 'react';
import { ClipboardList, Car, Calendar, User, Search, Filter, DollarSign, Clock, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ControlMaestro() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usuarios');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error de conexión');
      
      const allUsers = data.users || [];
      
      // Flatten all work history from all users into a single master log array
      const masterLogs: any[] = [];
      
      allUsers.forEach((user: any) => {
        if (user.work_history && user.work_history.length > 0) {
          user.work_history.forEach((hist: any) => {
            masterLogs.push({
              id: hist.id,
              user_id: user.id,
              full_name: user.full_name,
              legajo: user.legajo || 'S/L',
              role: user.role,
              cargo: user.cargo || 'Lavador',
              vehicle_plate: hist.vehicle_plate,
              vehicle_model: hist.vehicle_model,
              revenue: hist.revenue,
              date: new Date(hist.date),
              hours_estimated: 1.5 // Standard wash time estimation
            });
          });
        }
      });
      
      // Sort by date descending
      masterLogs.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setLogs(masterLogs);
    } catch (err: any) {
      console.error('❌ Error cargando control maestro:', err.message);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredLogs.reduce((sum, log) => sum + log.revenue, 0);
  const totalHours = filteredLogs.reduce((sum, log) => sum + log.hours_estimated, 0);
  const totalWashes = filteredLogs.length;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-green-500/5 blur-[120px] pointer-events-none" />

      <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/20">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">Control Maestro</h2>
            <p className="text-cyan-400/80 text-sm font-bold uppercase tracking-widest">Auditoría Global de Personal</p>
          </div>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar empleado o patente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 rounded-full bg-zinc-900/80 border border-white/10 text-sm font-bold text-white placeholder-zinc-600 outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] w-72 transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 relative z-10">
        
        {/* KPIs Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full" />
             <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
               <DollarSign size={24} className="text-amber-500" />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recaudación Total</p>
               <h3 className="text-3xl font-black text-white mt-1">${totalRevenue.toLocaleString()}</h3>
             </div>
           </div>

           <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-2xl rounded-full" />
             <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
               <Car size={24} className="text-green-500" />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Autos Lavados</p>
               <h3 className="text-3xl font-black text-white mt-1">{totalWashes} <span className="text-sm text-zinc-600 font-medium tracking-normal">unidades</span></h3>
             </div>
           </div>

           <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full" />
             <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
               <Clock size={24} className="text-cyan-500" />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Horas Estimadas</p>
               <h3 className="text-3xl font-black text-white mt-1">{totalHours} <span className="text-sm text-zinc-600 font-medium tracking-normal">hs</span></h3>
             </div>
           </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-cyan-500"/> Fecha y Hora</div>
                  </th>
                  <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><User size={14} className="text-purple-500"/> Empleado</div>
                  </th>
                  <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><Car size={14} className="text-green-500"/> Vehículo</div>
                  </th>
                  <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Hs. Estimadas</th>
                  <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Recaudación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Analizando registros...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <p className="text-sm font-bold text-zinc-600 italic">No se encontraron registros en la auditoría.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{log.date.toLocaleDateString('es-AR')}</span>
                          <span className="text-xs text-zinc-500 font-medium">{log.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white text-xs font-black shadow-inner">
                            {log.full_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{log.full_name}</span>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID: {log.legajo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-xs w-fit tracking-widest uppercase">
                            {log.vehicle_plate}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium mt-1">{log.vehicle_model}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <span className="font-bold text-zinc-300 bg-white/5 border border-white/5 px-2 py-1 rounded-md text-xs">
                          ~ {log.hours_estimated} hs
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="font-black text-amber-500 text-sm drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">
                          ${log.revenue.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
