'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Waves, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueVehicle {
  id: string;
  tracking_id: number;
  nickname: string;
  zone: 'espera' | 'lavado' | 'aspirado' | 'terminado';
  color: string;
  entered_at: string;
  created_at: string;
}

// Dibujo de Auto en 2D Estilo Retro Arcade
function RetroCar({ color }: { color: string }) {
  return (
    <svg className="w-16 h-28 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]" viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Spoiler */}
      <rect x="5" y="92" width="50" height="8" rx="2" fill="#18181b" />
      <rect x="10" y="90" width="8" height="6" fill="#27272a" />
      <rect x="42" y="90" width="8" height="6" fill="#27272a" />
      
      {/* Ruedas */}
      <rect x="0" y="16" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="54" y="16" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="0" y="74" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="54" y="74" width="6" height="16" rx="2" fill="#09090b" />

      {/* Cuerpo Principal del Auto */}
      <rect x="6" y="8" width="48" height="88" rx="14" fill={color} />
      
      {/* Franja de Carreras */}
      <rect x="26" y="8" width="8" height="88" fill="white" fillOpacity="0.15" />
      
      {/* Parabrisas Delantero */}
      <path d="M12 36 C 12 36, 16 26, 30 26 C 44 26, 48 36, 48 36 L 42 42 L 18 42 Z" fill="#09090b" />
      
      {/* Ventanillas Laterales */}
      <path d="M10 44 L 14 46 L 14 66 L 10 70 Z" fill="#09090b" />
      <path d="M50 44 L 46 46 L 46 66 L 50 70 Z" fill="#09090b" />
      
      {/* Luneta Trasera */}
      <path d="M16 74 L 44 74 L 41 82 L 19 82 Z" fill="#09090b" />
      
      {/* Capó / Detalles Delanteros */}
      <rect x="14" y="16" width="32" height="6" rx="1" fill="#18181b" fillOpacity="0.4" />
      
      {/* Faros Delanteros */}
      <rect x="12" y="6" width="8" height="4" rx="1" fill="#fef08a" />
      <rect x="40" y="6" width="8" height="4" rx="1" fill="#fef08a" />
      
      {/* Faros Traseros (Freno) */}
      <rect x="10" y="94" width="6" height="2" fill="#f87171" />
      <rect x="44" y="94" width="6" height="2" fill="#f87171" />
    </svg>
  );
}

function VehicleTimer({ enteredAt, zone }: { enteredAt: string; zone: 'espera' | 'lavado' | 'aspirado' | 'terminado' }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let safeDate = enteredAt.replace(' ', 'T');
    if (!safeDate.endsWith('Z') && !safeDate.includes('+') && safeDate.split('T')[1] && safeDate.split('T')[1].length <= 8) {
       safeDate += 'Z';
    }
    const start = new Date(safeDate).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      setSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [enteredAt]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (zone === 'terminado') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black text-lime-400 tracking-wider bg-lime-500/10 px-2.5 py-1 rounded-full border border-lime-500/20 animate-pulse">
        <CheckCircle2 size={10} /> LISTO
      </span>
    );
  }

  if (zone === 'lavado') {
    return (
      <div className="flex items-center gap-1.5 mt-1 bg-orange-400/20 px-2 py-0.5 rounded text-orange-600 border border-orange-400/30">
        <Clock size={10} className={seconds >= 15 * 60 ? "animate-ping text-red-500" : ""} />
        <span className="font-mono text-[10px] font-black tracking-widest tabular-nums">
          {formatTime(seconds)}
        </span>
      </div>
    );
  }

  if (zone === 'aspirado') {
    return (
      <div className="flex items-center gap-1.5 mt-1 bg-purple-500/20 px-2 py-0.5 rounded text-purple-400 border border-purple-500/30">
        <Clock size={10} className={seconds >= 15 * 60 ? "animate-ping text-red-500" : ""} />
        <span className="font-mono text-[10px] font-black tracking-widest tabular-nums">
          {formatTime(seconds)}
        </span>
      </div>
    );
  }

  return (
    <span className="text-[10px] font-black text-green-600 tracking-wider bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
      {formatTime(seconds)} MIN
    </span>
  );
}

export default function PantallaLavadero() {
  const [vehicles, setVehicles] = useState<QueueVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lavadero_camera_queue')
        .select('*')
        .order('entered_at', { ascending: true });
        
      if (!error && data) {
        setVehicles(data);
      }
      setLoading(false);
    };

    fetchQueue();

    const channel = supabase
      .channel('lavadero-camera-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lavadero_camera_queue' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCar = payload.new as QueueVehicle;
            setVehicles((prev) => [...prev.filter(v => v.id !== newCar.id), newCar]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedCar = payload.new as QueueVehicle;
            setVehicles((prev) => prev.map((v) => (v.id === updatedCar.id ? updatedCar : v)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setVehicles((prev) => prev.filter((v) => v.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const waitQueueCount = vehicles.filter(v => v.zone === 'espera').length;
  const preEsperaCount = vehicles.filter(v => v.zone === 'pre_espera').length;
  const washingCount = vehicles.filter(v => v.zone === 'lavado').length;
  const aspiradoCount = vehicles.filter(v => v.zone === 'aspirado').length;
  
  const estimatedTime = (waitQueueCount * 15) + (washingCount > 0 ? 8 : 0);

  return (
    <div className="min-h-screen bg-[#020202] text-black font-sans overflow-hidden p-6 md:p-10 relative flex flex-col justify-between selection:bg-orange-400 selection:text-black">
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_black_100%)] pointer-events-none z-10" />
      
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-orange-400/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-lime-500/5 rounded-full blur-[130px] pointer-events-none" />

      <header className="relative z-20 flex flex-col md:flex-row items-center justify-between border-b-2 border-dashed border-zinc-800 pb-6 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-300 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse">
            <Waves className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
              ESTADO DEL LAVADERO <span className="text-[10px] bg-red-600 text-black font-bold tracking-widest px-2 py-0.5 rounded animate-pulse">EN VIVO</span>
            </h1>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.25em]">Lavadero De Luxe • Privacidad Protegida</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-orange-100/50 border border-orange-200 rounded-2xl px-6 py-3.5 backdrop-blur-md">
          <Clock className="text-orange-600 animate-spin" style={{ animationDuration: '6s' }} size={20} />
          <div>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Demora Estimada de Ingreso</p>
            <p className="text-lg font-black text-orange-600 tracking-tight">
              {estimatedTime === 0 ? 'Sin Demoras 🎉' : `~ ${estimatedTime} MINUTOS`}
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-20 flex-1 my-8 mx-auto w-full max-w-[1200px] flex items-center justify-center">
        
        <main 
          className="w-full h-full gap-6"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr',
            gridTemplateRows: '60px 180px 320px 160px',
            gridTemplateAreas: `
              "retorno retorno retorno retorno"
              "espera central central terminado"
              "espera lavado aspirado terminado"
              "pre_espera pre_espera pre_espera pre_espera"
            `,
            aspectRatio: '40 / 45'
          }}
        >
          
          <div 
            className="bg-zinc-950/95 border-2 border-zinc-800/80 rounded-[1.5rem] px-6 flex items-center justify-between relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            style={{ gridArea: 'retorno', height: '100%' }}
          >
            {/* Indicador de Línea Neon */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.6)] animate-pulse" />
            
            {/* Animación de flechas de retorno */}
            <div className="absolute inset-0 flex items-center justify-center text-lime-500/10 font-black text-xl tracking-[0.25em] pointer-events-none select-none z-0 animate-pulse">
              ←←← ←←← RETORNO A SALIDA ←←← ←←←
            </div>
            
            {/* Rótulo de Salida final en la esquina izquierda del retorno */}
            <div className="bg-lime-500 text-black font-black text-[9px] tracking-widest px-3 py-1 rounded shadow-[0_0_12px_rgba(132,204,22,0.6)] z-10 animate-pulse flex items-center gap-1">
              <span>SALIDA FINAL OMAR</span> <span className="animate-ping">●</span>
            </div>
            
            <div className="flex items-center gap-2 z-10">
              <span className="text-[9px] text-zinc-700 font-mono tracking-wider">
                ENTRADA Y SALIDA POR ARRIBA IZQ
              </span>
            </div>
          </div>
          
          {/* ZONA 1: ESPERA (LADO IZQUIERDO DE LA U - DIRECCIÓN HACIA ABAJO ↓) */}
          <div 
            className="bg-zinc-950/90 border-2 border-zinc-800/80 rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{ gridArea: 'espera', height: '100%' }}
          >
            {/* Indicador de Línea Neon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-400 shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
            
            {/* Diseño de Calle/Pista */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-green-400/20 pointer-events-none z-0" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-green-600/20 font-black text-2xl tracking-widest animate-pulse pointer-events-none select-none z-0">
              ↓↓↓
            </div>
            
            {/* Rótulo de Entrada */}
            <div className="absolute top-3 left-4 bg-green-400/10 text-green-600 border border-green-400/25 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest z-10 animate-pulse">
              ENTRADA ↓
            </div>

            <h2 className="text-sm font-black tracking-widest text-green-600 uppercase mb-8 flex items-center gap-2 z-10">
              1. ESPERA <span className="bg-green-400/10 text-green-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-green-400/20">{waitQueueCount}</span>
            </h2>
            
            <div className="flex-1 flex flex-col justify-start gap-6 w-full max-w-[200px] overflow-y-hidden z-10">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-zinc-700 italic text-xs">Cargando...</div>
                ) : vehicles.filter(v => v.zone === 'espera').length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="h-full flex flex-col items-center justify-center text-center py-10 text-zinc-600">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-xs font-black uppercase tracking-wider">Línea Libre</p>
                  </motion.div>
                ) : (
                  vehicles.filter(v => v.zone === 'espera').map((v) => {
                    let parsedNickname = v.nickname;
                    let isPaid = false;
                    try {
                      if (v.nickname && v.nickname.startsWith('{')) {
                        const parsed = JSON.parse(v.nickname);
                        parsedNickname = parsed.name || v.nickname;
                        isPaid = parsed.isPaid || false;
                      }
                    } catch (e) {
                      // fallback to original if JSON parsing fails
                    }
                    
                    return (
                    <motion.div
                      key={v.id}
                      layoutId={v.id}
                      initial={{ opacity: 0, y: -50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="relative overflow-hidden rounded-md border-2 border-zinc-800 shadow-xl flex flex-col w-28 h-40"
                    >
                      {/* Top part: Car color */}
                      <div 
                        className="flex-1 flex flex-col items-center justify-center relative"
                        style={{ backgroundColor: v.color }}
                      >
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="transform rotate-180 z-10 scale-[0.6] mt-[-10px]">
                          <RetroCar color={v.color} />
                        </div>
                      </div>
                      
                      {/* Bottom part: Payment Status */}
                      <div 
                        className={`h-[4.5rem] flex flex-col items-center justify-center z-10 ${
                          isPaid 
                            ? 'bg-green-500 text-green-950' 
                            : 'bg-red-500 text-red-950'
                        }`}
                      >
                        <p className="text-[11px] font-black tracking-tight uppercase px-1 truncate w-full text-center">
                          {parsedNickname}
                        </p>
                        <VehicleTimer enteredAt={v.entered_at} zone="espera" />
                      </div>
                    </motion.div>
                  )})
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ZONA DE RECEPCIÓN (Autos del Kiosco) */}
          <div 
            className="bg-zinc-950/90 border-2 border-zinc-800/80 rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{ gridArea: 'pre_espera', height: '100%' }}
          >
            {/* Indicador de Línea Neon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            
            <h2 className="text-sm font-black tracking-widest text-blue-500 uppercase mb-4 flex items-center gap-2 z-10">
              AUTOS KIOSCO (EN INGRESO) <span className="bg-blue-500/10 text-blue-500 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/20">{preEsperaCount}</span>
            </h2>
            
            <div className="flex-1 flex flex-row justify-center items-center gap-6 w-full overflow-x-hidden z-10">
              <AnimatePresence mode="popLayout">
                {vehicles.filter(v => v.zone === 'pre_espera').length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="h-full flex flex-col items-center justify-center text-center py-4 text-zinc-600">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-xs font-black uppercase tracking-wider">Sin autos en ingreso</p>
                  </motion.div>
                ) : (
                  vehicles.filter(v => v.zone === 'pre_espera').map((v) => {
                    let parsedNickname = v.nickname;
                    let isPaid = false;
                    try {
                      if (v.nickname && v.nickname.startsWith('{')) {
                        const parsed = JSON.parse(v.nickname);
                        parsedNickname = parsed.name || v.nickname;
                        isPaid = parsed.isPaid || false;
                      }
                    } catch (e) {}
                    
                    return (
                    <motion.div
                      key={v.id}
                      layoutId={v.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="relative overflow-hidden rounded-md border-2 border-zinc-800 shadow-xl flex flex-col w-20 h-28"
                    >
                      <div 
                        className="flex-1 flex flex-col items-center justify-center relative"
                        style={{ backgroundColor: v.color }}
                      >
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="transform z-10 scale-[0.4] mt-[-15px]">
                          <RetroCar color={v.color} />
                        </div>
                      </div>
                      
                      <div 
                        className={`h-8 flex flex-col items-center justify-center z-10 ${
                          isPaid ? 'bg-green-500 text-green-950' : 'bg-red-500 text-red-950'
                        }`}
                      >
                        <p className="text-[9px] font-black tracking-tight uppercase px-1 truncate w-full text-center">
                          {parsedNickname}
                        </p>
                      </div>
                    </motion.div>
                  )})
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CENTRO DEL CIRCUITO (INTERIOR DE LA U) */}
          <div 
            className="bg-orange-100/40 border-2 border-dashed border-zinc-800/80 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center shadow-2xl relative"
            style={{ gridArea: 'central', height: '100%' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_black_100%)] pointer-events-none" />
            
            <h3 className="text-orange-600 font-mono font-black tracking-[0.25em] text-sm uppercase animate-pulse mb-1 z-10">
              LAVADERO DE LUXE
            </h3>
            <p className="text-zinc-600 font-mono text-[9px] font-bold uppercase tracking-widest mb-4 z-10">
              PLANO TALLER: 35m x 30m
            </p>
            
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-500 to-transparent my-2" />
            
            <div className="text-xs font-black text-zinc-700 tracking-wider z-10 mb-1">
              OPERADOR ACTIVO: <span className="text-yellow-400">OMAR</span>
            </div>
            <div className="text-md font-black text-black tracking-tight z-10">
              ESTADO: <span className="text-lime-400 font-mono" style={{ textShadow: '0 0 10px rgba(57, 255, 20, 0.4)' }}>ONLINE</span>
            </div>
            
            <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mt-4 z-10 max-w-[200px]">
              ENTRA POR ARRIBA IZQ ➔ CURVA DE LAVADO AL FONDO ➔ RETORNO Y SALIDA POR ARRIBA IZQ
            </p>
          </div>

          {/* ZONA 2: EN LAVADO (BASE/CURVA DE LA U - DIRECCIÓN HORIZONTAL ➔) */}
          <div 
            className="bg-zinc-950/90 border-2 border-zinc-800/80 rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{ gridArea: 'lavado', height: '100%' }}
          >
            {/* Indicador de Línea Neon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
            
            {/* Animación de burbujas en el fondo */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:18px_18px] pointer-events-none" />
            
            {/* Diseño de Calle/Pista Horizontal */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-orange-400/20 pointer-events-none z-0" />
            <div className="absolute inset-y-0 left-10 flex items-center text-orange-500/20 font-black text-2xl tracking-widest animate-pulse pointer-events-none select-none z-0">
              ➔➔➔
            </div>
            
            {/* Rótulo de Curva */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-orange-400/10 text-orange-600 border border-orange-400/25 px-3 py-0.5 rounded text-[8px] font-black uppercase tracking-widest z-10">
              CURVA DE LAVADO
            </div>

            <h2 className="text-sm font-black tracking-widest text-orange-600 uppercase mb-4 flex items-center gap-2 z-10">
              2. EN LAVADO <span className="bg-orange-400/10 text-orange-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-orange-400/20">{washingCount}</span>
            </h2>

            <div className="flex-1 flex flex-row justify-center items-center gap-8 w-full z-10">
              <AnimatePresence mode="popLayout">
                {vehicles.filter(v => v.zone === 'lavado').length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="h-full flex flex-col items-center justify-center text-center py-10 text-zinc-600">
                    <Waves size={32} className="mb-2 animate-bounce" />
                    <p className="text-xs font-black uppercase tracking-wider">Box de Lavado Vacío</p>
                  </motion.div>
                ) : (
                  vehicles.filter(v => v.zone === 'lavado').map((v) => (
                    <motion.div
                      key={v.id}
                      layoutId={v.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="flex flex-col items-center gap-3 relative"
                    >
                      <div className="absolute top-0 w-24 h-24 bg-orange-400/10 rounded-full blur-xl animate-pulse pointer-events-none" />
                      <div className="transform rotate-90 my-2">
                        <RetroCar color={v.color} />
                      </div>
                      <div className="text-center z-10">
                        <p className="text-[11px] font-black tracking-tight text-black uppercase">{v.nickname}</p>
                        <VehicleTimer enteredAt={v.entered_at} zone="lavado" />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ZONA 2.5: ASPIRADO (LADO CENTRAL DERECHO - DIRECCIÓN HACIA ARRIBA/DERECHA) */}
          <div 
            className="bg-zinc-950/90 border-2 border-zinc-800/80 rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{ gridArea: 'aspirado', height: '100%' }}
          >
            {/* Indicador de Línea Neon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
            
            <h2 className="text-sm font-black tracking-widest text-purple-400 uppercase mb-4 flex items-center gap-2 z-10">
              2.5 ASPIRADO <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-purple-500/20">{aspiradoCount}</span>
            </h2>

            <div className="flex-1 flex flex-row justify-center items-center gap-8 w-full z-10">
              <AnimatePresence mode="popLayout">
                {vehicles.filter(v => v.zone === 'aspirado').length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="h-full flex flex-col items-center justify-center text-center py-10 text-zinc-600">
                    <Waves size={32} className="mb-2 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-wider">Box de Aspirado Vacío</p>
                  </motion.div>
                ) : (
                  vehicles.filter(v => v.zone === 'aspirado').map((v) => (
                    <motion.div
                      key={v.id}
                      layoutId={v.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="flex flex-col items-center gap-3 relative"
                    >
                      <div className="absolute top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse pointer-events-none" />
                      <div className="transform rotate-0 my-2">
                        <RetroCar color={v.color} />
                      </div>
                      <div className="text-center z-10">
                        <p className="text-[11px] font-black tracking-tight text-white uppercase">{v.nickname}</p>
                        <VehicleTimer enteredAt={v.entered_at} zone="aspirado" />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ZONA 3: TERMINADO (LADO DERECHO DE LA U - DIRECCIÓN HACIA ARRIBA ↑) */}
          <div 
            className="bg-zinc-950/90 border-2 border-zinc-800/80 rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{ gridArea: 'terminado', height: '100%' }}
          >
            {/* Indicador de Línea Neon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.8)]" />
            
            {/* Diseño de Calle/Pista */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-lime-500/20 pointer-events-none z-0" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-lime-500/20 font-black text-2xl tracking-widest animate-pulse pointer-events-none select-none z-0">
              ↑↑↑
            </div>
            
            {/* Rótulo de Salida */}
            <div className="absolute top-3 right-4 bg-lime-500/10 text-lime-400 border border-lime-500/25 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest z-10 animate-pulse">
              RETORNO ➔
            </div>

            <h2 className="text-sm font-black tracking-widest text-lime-400 uppercase mb-6 flex items-center gap-2 z-10">
              3. TERMINADO <span className="bg-lime-500/10 text-lime-400 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-lime-500/20">{vehicles.filter(v => v.zone === 'terminado').length}</span>
            </h2>

            <div className="flex-1 flex flex-col justify-end gap-6 w-full max-w-[200px] overflow-y-hidden z-10">
              <AnimatePresence mode="popLayout">
                {vehicles.filter(v => v.zone === 'terminado').length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="h-full flex flex-col items-center justify-center text-center py-10 text-zinc-600">
                    <CheckCircle2 size={32} className="mb-2" />
                    <p className="text-xs font-black uppercase tracking-wider">Esperando Salidas</p>
                  </motion.div>
                ) : (
                  vehicles.filter(v => v.zone === 'terminado').map((v) => (
                    <motion.div
                      key={v.id}
                      layoutId={v.id}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="flex flex-col items-center gap-3 relative"
                    >
                      <RetroCar color={v.color} />
                      <div className="text-center">
                        <p className="text-[11px] font-black tracking-tight text-black uppercase">{v.nickname}</p>
                        <VehicleTimer enteredAt={v.entered_at} zone="terminado" />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </main>
      </div>

      {/* FOOTER PANTALLA */}
      <footer className="relative z-20 flex justify-between items-center border-t border-zinc-900 pt-6 mt-4">
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
          © 2026 Omar Adamo • Lavadero De Luxe Estética Vehicular
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-ping" />
          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Sincronización Activa</span>
        </div>
      </footer>
    </div>
  );
}
