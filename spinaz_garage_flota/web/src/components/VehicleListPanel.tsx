'use client';
import { useState } from 'react';
import { Truck, ChevronDown, ChevronUp, User, Clock, Gauge, Power } from 'lucide-react';

const mockVehicles = [
  { id: 1, name: 'Toyota Hilux #102', plate: 'AB 123 CD', driver: 'Juan Chofer', status: 'En Movimiento', speed: '85 km/h', odometer: '45,200 km', hours: '4h 15m' },
  { id: 2, name: 'Ford Transit #405', plate: 'XY 987 ZW', driver: 'Carlos Admin', status: 'En Pausa', speed: '0 km/h', odometer: '12,500 km', hours: '6h 30m' },
  { id: 3, name: 'Mercedes Sprinter', plate: 'FG 456 HI', driver: 'Luis Transporte', status: 'Taller', speed: '0 km/h', odometer: '89,000 km', hours: '0h 0m' },
];

export default function VehicleListPanel() {
  const [expanded, setExpanded] = useState<number | null>(1); // Expand the first one by default
  const [toggles, setToggles] = useState<Record<number, Record<string, boolean>>>({});

  const handleToggle = (vid: number, key: string) => {
    setToggles(prev => ({
      ...prev,
      [vid]: {
        ...(prev[vid] || { driver: true, odometer: true, hours: true, plate: true }),
        [key]: !(prev[vid]?.[key] ?? true)
      }
    }));
  };

  const getVisibility = (vid: number, key: string) => {
    return toggles[vid]?.[key] ?? true; // By default everything is visible
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col h-full backdrop-blur-xl">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 rounded-t-2xl">
        <h3 className="font-bold text-lg">Unidades de Flota</h3>
        <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-md font-bold tracking-widest uppercase">En Vivo</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockVehicles.map(v => (
          <div key={v.id} className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
             {/* Header */}
             <div 
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
               onClick={() => setExpanded(expanded === v.id ? null : v.id)}
             >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${v.status === 'En Movimiento' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-zinc-800/50 border-white/5 text-zinc-500'}`}>
                    <Truck size={24} />
                  </div>
                  <div>
                     <h4 className="font-bold text-white tracking-wide text-[15px]">{v.name}</h4>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
                         <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'En Movimiento' ? 'bg-green-500 animate-pulse' : v.status === 'En Pausa'? 'bg-yellow-500' : 'bg-red-500'}`} />
                         {v.status}
                       </span>
                       <span className="text-xs text-zinc-500 font-mono">{v.speed}</span>
                     </div>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  {expanded === v.id ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
                </div>
             </div>
             
             {/* Expanded content */}
             {expanded === v.id && (
               <div className="p-5 border-t border-white/5 bg-gradient-to-b from-zinc-900/50 to-transparent">
                 
                 {/* Visual Toggles */}
                 <div className="mb-5">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-3">Filtros de Telemetría</p>
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleToggle(v.id, 'driver')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${getVisibility(v.id, 'driver') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-black text-zinc-600 border border-white/5 hover:bg-white/5'}`}>
                        <Power size={14} className={getVisibility(v.id, 'driver') ? 'text-blue-500' : 'text-zinc-700'} /> Chofer
                      </button>
                      <button onClick={() => handleToggle(v.id, 'plate')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${getVisibility(v.id, 'plate') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-black text-zinc-600 border border-white/5 hover:bg-white/5'}`}>
                        <Power size={14} className={getVisibility(v.id, 'plate') ? 'text-blue-500' : 'text-zinc-700'} /> Datos Auto
                      </button>
                      <button onClick={() => handleToggle(v.id, 'odometer')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${getVisibility(v.id, 'odometer') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-black text-zinc-600 border border-white/5 hover:bg-white/5'}`}>
                        <Power size={14} className={getVisibility(v.id, 'odometer') ? 'text-blue-500' : 'text-zinc-700'} /> Kilometraje
                      </button>
                      <button onClick={() => handleToggle(v.id, 'hours')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${getVisibility(v.id, 'hours') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-black text-zinc-600 border border-white/5 hover:bg-white/5'}`}>
                        <Power size={14} className={getVisibility(v.id, 'hours') ? 'text-blue-500' : 'text-zinc-700'} /> Horas Uso
                      </button>
                   </div>
                 </div>

                 {/* Data Grid based on toggles */}
                 <div className="grid grid-cols-2 gap-3">
                    {getVisibility(v.id, 'driver') && (
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-start gap-3 transition-all">
                         <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                           <User size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Chofer Asignado</p>
                            <p className="text-sm font-medium text-zinc-200">{v.driver}</p>
                         </div>
                      </div>
                    )}
                    {getVisibility(v.id, 'plate') && (
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-start gap-3 transition-all">
                         <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                           <Truck size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Matrícula</p>
                            <p className="text-sm font-medium text-zinc-200">{v.plate}</p>
                         </div>
                      </div>
                    )}
                    {getVisibility(v.id, 'odometer') && (
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-start gap-3 transition-all">
                         <div className="p-2 bg-green-500/10 rounded-lg text-green-400 shrink-0">
                           <Gauge size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Odómetro</p>
                            <p className="text-sm font-medium text-zinc-200">{v.odometer}</p>
                         </div>
                      </div>
                    )}
                    {getVisibility(v.id, 'hours') && (
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-start gap-3 transition-all">
                         <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 shrink-0">
                           <Clock size={16} />
                         </div>
                         <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Jornada Activa</p>
                            <p className="text-sm font-medium text-zinc-200">{v.hours}</p>
                         </div>
                      </div>
                    )}
                 </div>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}
