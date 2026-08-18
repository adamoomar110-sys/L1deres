'use client';
import { useState, useEffect } from 'react';
import { ClipboardList, User, Car, Clock, Gauge, DollarSign, Search, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ReportesAdmin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        profiles:driver_id (full_name),
        vehicles:vehicle_id (plate, brand, model)
      `)
      .order('created_at', { ascending: false });
    
    if (data) setReports(data);
    setLoading(false);
  };

  const stats = {
    today: {
      km: reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, r) => acc + ((r.end_km || r.start_km) - r.start_km), 0),
      rev: reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, r) => acc + Number(r.revenue || 0), 0)
    },
    week: {
      km: reports.filter(r => {
        const d = new Date(r.created_at);
        const now = new Date();
        return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      }).reduce((acc, r) => acc + ((r.end_km || r.start_km) - r.start_km), 0),
      rev: reports.filter(r => {
        const d = new Date(r.created_at);
        const now = new Date();
        return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      }).reduce((acc, r) => acc + Number(r.revenue || 0), 0)
    },
    month: {
      km: reports.filter(r => {
        const d = new Date(r.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((acc, r) => acc + ((r.end_km || r.start_km) - r.start_km), 0),
      rev: reports.filter(r => {
        const d = new Date(r.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((acc, r) => acc + Number(r.revenue || 0), 0)
    },
    total: {
      km: reports.reduce((acc, r) => acc + ((r.end_km || r.start_km) - r.start_km), 0),
      rev: reports.reduce((acc, r) => acc + Number(r.revenue || 0), 0)
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030303]">
      <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Control Operativo</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Rendimiento Detallado de la Flota</p>
        </div>
        
        <div className="flex gap-4">
           <button onClick={fetchReports} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl text-zinc-400 hover:text-white transition-all">
              <Search size={20} />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Hoy', data: stats.today, color: 'from-yellow-500 to-yellow-600' },
             { label: 'Esta Semana', data: stats.week, color: 'from-lime-500 to-lime-600' },
             { label: 'Este Mes', data: stats.month, color: 'from-emerald-500 to-emerald-600' },
             { label: 'Total Histórico', data: stats.total, color: 'from-zinc-500 to-zinc-600' }
           ].map((stat) => (
             <div key={stat.label} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`} />
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{stat.label}</h4>
                
                <div className="space-y-4">
                   <div>
                      <div className="flex items-center gap-2 text-zinc-500 mb-1">
                         <Gauge size={12} />
                         <span className="text-[9px] font-bold uppercase">Kilómetros</span>
                      </div>
                      <p className="text-2xl font-black text-white">{stat.data.km.toLocaleString()} <span className="text-xs text-zinc-600">km</span></p>
                   </div>
                   
                   <div className="pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-zinc-500 mb-1">
                         <DollarSign size={12} />
                         <span className="text-[9px] font-bold uppercase">Recaudación</span>
                      </div>
                      <p className="text-2xl font-black text-green-500">${stat.data.rev.toLocaleString()}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-6">
        {loading ? (
           <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Table Header */}
            <div className="grid grid-cols-7 px-8 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500">
               <div className="col-span-2">Chofer / Unidad</div>
               <div>KM Inicio</div>
               <div>KM Fin</div>
               <div>Total KM</div>
               <div>Horas Uso</div>
               <div className="text-right">Recaudación</div>
            </div>

            {reports.map(report => {
              const kmTotal = (report.end_km || report.start_km) - report.start_km;
              const hours = report.end_time ? 
                Math.round((new Date(report.end_time).getTime() - new Date(report.start_time).getTime()) / (1000 * 60 * 60)) : 
                'En curso';

              return (
                <div key={report.id} className="grid grid-cols-7 items-center px-8 py-6 bg-zinc-900/20 border border-white/5 rounded-[2rem] hover:bg-zinc-900/40 transition-all group">
                   <div className="col-span-2 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-yellow-500">
                         <User size={18} />
                      </div>
                      <div>
                         <p className="font-bold text-white leading-none mb-1">{report.profiles?.full_name}</p>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase">{report.vehicles?.plate} - {report.vehicles?.brand}</p>
                      </div>
                   </div>

                   <div className="text-sm font-bold text-zinc-400">
                      {report.start_km.toLocaleString()} km
                   </div>

                   <div className="text-sm font-bold text-zinc-400">
                      {report.end_km ? `${report.end_km.toLocaleString()} km` : '---'}
                   </div>

                   <div className="flex items-center gap-2">
                      <Gauge size={14} className="text-yellow-500" />
                      <span className="text-sm font-black text-white">{kmTotal} km</span>
                   </div>

                   <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Clock size={14} className="text-blue-500" />
                      <span>{hours} {typeof hours === 'number' ? 'hs' : ''}</span>
                   </div>

                   <div className="text-right text-lg font-black text-green-500">
                      ${Number(report.revenue).toLocaleString()}
                   </div>
                </div>
              );
            })}

            {reports.length === 0 && (
              <div className="h-[400px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center text-zinc-500 bg-black/20">
                 <ClipboardList size={48} className="opacity-20 mb-4" />
                 <p className="font-bold">No hay reportes operativos registrados todavía.</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
