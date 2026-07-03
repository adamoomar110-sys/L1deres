'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Waves, Clock, CheckCircle2, ChevronLeft, Car, Droplets, Info, Sparkles, 
  MapPin, PhoneCall, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dibujo de Auto en 2D Estilo Retro Arcade (Vista Superior)
function RetroCar({ color }: { color: string }) {
  return (
    <svg className="w-16 h-28 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]" viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="92" width="50" height="8" rx="2" fill="#18181b" />
      <rect x="10" y="90" width="8" height="6" fill="#27272a" />
      <rect x="42" y="90" width="8" height="6" fill="#27272a" />
      <rect x="0" y="16" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="54" y="16" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="0" y="74" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="54" y="74" width="6" height="16" rx="2" fill="#09090b" />
      <rect x="6" y="8" width="48" height="88" rx="14" fill={color} />
      <rect x="26" y="8" width="8" height="88" fill="white" fillOpacity="0.15" />
      <path d="M12 36 C 12 36, 16 26, 30 26 C 44 26, 48 36, 48 36 L 42 42 L 18 42 Z" fill="#09090b" />
      <path d="M10 44 L 14 46 L 14 66 L 10 70 Z" fill="#09090b" />
      <path d="M50 44 L 46 46 L 46 66 L 50 70 Z" fill="#09090b" />
      <path d="M16 74 L 44 74 L 41 82 L 19 82 Z" fill="#09090b" />
      <rect x="14" y="16" width="32" height="6" rx="1" fill="#18181b" fillOpacity="0.4" />
      <rect x="12" y="6" width="8" height="4" rx="1" fill="#fef08a" />
      <rect x="40" y="6" width="8" height="4" rx="1" fill="#fef08a" />
      <rect x="10" y="94" width="6" height="2" fill="#f87171" />
      <rect x="44" y="94" width="6" height="2" fill="#f87171" />
    </svg>
  );
}

// Reloj en tiempo real
function QueueTimer({ enteredAt, zone }: { enteredAt: string | null; zone: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!enteredAt) return;
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
  }, [enteredAt, zone]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (zone === 'terminado') {
    return (
      <span className="text-lime-500 font-black tracking-widest text-lg flex items-center justify-center gap-2 animate-bounce">
        <CheckCircle2 size={20} /> LISTO
      </span>
    );
  }

  if (zone === 'lavado') {
    const totalWashingSecs = 15 * 60; // 15 mins
    const remaining = Math.max(0, totalWashingSecs - seconds);
    const percent = Math.min(100, Math.floor((seconds / totalWashingSecs) * 100));

    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex justify-between items-center w-full max-w-[280px]">
          <span className="text-zinc-600 text-xs font-black uppercase tracking-wider">Finaliza en aprox:</span>
          <span className="text-orange-500 font-black text-lg font-mono">{formatTime(remaining)}</span>
        </div>
        <div className="w-full max-w-[280px] h-3 bg-zinc-800 rounded-full overflow-hidden border border-orange-300/30">
          <div className="h-full bg-gradient-to-r from-orange-400 to-cyan-400 transition-all duration-1000" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  // Fila de espera
  return (
    <div className="flex justify-between items-center w-full max-w-[280px]">
      <span className="text-zinc-600 text-xs font-black uppercase tracking-wider">Tiempo transcurrido en fila:</span>
      <span className="text-green-500 font-black text-lg font-mono">{formatTime(seconds)}</span>
    </div>
  );
}

export default function TrackingClienteMovi() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const queueId = searchParams.get('id');
  const plateUrl = searchParams.get('plate');

  const [carData, setCarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queueId) {
      setLoading(false);
      return;
    }

    const fetchCarStatus = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lavadero_camera_queue')
        .select('*')
        .eq('id', queueId)
        .maybeSingle();

      if (!error && data) {
        setCarData(data);
      }
      setLoading(false);
    };

    fetchCarStatus();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`car-tracking-${queueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lavadero_camera_queue', filter: `id=eq.${queueId}` },
        (payload) => {
          console.log('Cambio detectado en seguimiento:', payload);
          if (payload.eventType === 'UPDATE') {
            setCarData(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setCarData((prev: any) => ({ ...prev, zone: 'terminado', isDeleted: true }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId]);

  const handleBackToMenu = () => {
    router.push('/lavadero/pedido');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando con cámaras del lavadero...</p>
      </div>
    );
  }

  if (!carData && !loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans p-6 text-center space-y-6">
        <AlertTriangle size={64} className="text-orange-500 animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Pedido no encontrado</h2>
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-wider max-w-xs mx-auto">No pudimos vincular este celular con un auto activo en el visualizador.</p>
        </div>
        <button
          onClick={handleBackToMenu}
          className="px-8 py-4 bg-orange-400 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-300 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={16} /> VOLVER AL MENÚ
        </button>
      </div>
    );
  }

  const { nickname, color, zone } = carData;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative flex flex-col justify-between selection:bg-orange-400 selection:text-black">
      
      {/* Efectos Retro Scanlines y Grilla */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.3)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.03),_rgba(0,255,0,0.01),_rgba(0,0,255,0.03))] bg-[size:100%_4px,_6px_100%] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_black_100%)] pointer-events-none z-10" />
      
      {/* Orbes de Neón en el Fondo */}
      <div className="absolute top-1/4 left-[-20%] w-[80vw] h-[80vw] bg-cyan-600/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-20%] w-[80vw] h-[80vw] bg-orange-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* HEADER DE LA CONSOLA */}
      <header className="relative z-20 px-6 py-6 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between">
        <button 
          onClick={handleBackToMenu}
          className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} /> Menú
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-lime-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(132,204,22,0.8)]" />
          <span className="text-[9px] text-lime-400 font-black tracking-widest uppercase">CONEXIÓN CAM: VIVO</span>
        </div>
      </header>

      {/* CORE: CONSOLA DE SEGUIMIENTO */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-md mx-auto w-full">
        
        {/* PANEL RETRO DEL AUTO */}
        <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-[3rem] p-8 flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-orange-500 to-lime-400" />
          
          <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.25em] mb-1">VEHÍCULO ACTIVO</span>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white" style={{ textShadow: `0 0 15px ${color}55` }}>
            {nickname}
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Patente: {plateUrl || '---'}</p>

          {/* VISUALIZADOR DE ESTADO EN AUTO */}
          <div className="my-10 h-36 flex items-center justify-center relative w-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Animación del auto según el estado */}
            <motion.div
              key={zone}
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="relative"
            >
              {zone === 'espera' && (
                <div className="absolute inset-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl animate-pulse pointer-events-none -translate-x-4 -translate-y-4" />
              )}
              {zone === 'lavado' && (
                <div className="absolute inset-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl animate-ping pointer-events-none -translate-x-4 -translate-y-4" />
              )}
              {zone === 'terminado' && (
                <div className="absolute inset-0 w-32 h-32 bg-lime-500/20 rounded-full blur-2xl animate-pulse pointer-events-none -translate-x-8 -translate-y-8" />
              )}
              
              <RetroCar color={color} />
            </motion.div>
          </div>

          {/* ESTADO EN PALABRAS */}
          <div className="space-y-2 w-full flex flex-col items-center">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Etapa Actual</span>
            <div className="h-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {zone === 'espera' && (
                  <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-md font-black uppercase tracking-widest text-green-500">
                    1. Fila de Espera 🕒
                  </motion.p>
                )}
                {zone === 'lavado' && (
                  <motion.p key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-md font-black uppercase tracking-widest text-orange-500 animate-pulse">
                    2. En Túnel de Lavado 🧼💦
                  </motion.p>
                )}
                {zone === 'terminado' && (
                  <motion.p key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-black uppercase tracking-widest text-lime-400 italic">
                    3. ¡Listo para retirar! 🎉
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* TEMPORIZADOR INTEGRADO */}
            <div className="pt-4 border-t border-zinc-900 w-full flex justify-center">
              <QueueTimer enteredAt={carData.entered_at} zone={zone} />
            </div>
          </div>
        </div>

        {/* PASOS DEL CIRCUITO (LÍNEA DE TIEMPO SIMPLE) */}
        <div className="w-full bg-zinc-950/60 border border-zinc-900 rounded-[2rem] p-6 space-y-4">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Circuito del Lavadero</h3>
          
          <div className="flex flex-col gap-4 relative pl-8">
            {/* Línea conectora */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 border-l border-dashed border-zinc-800" />

            {/* Paso 1: Espera */}
            <div className="flex items-start gap-4 relative">
              <div className={`absolute left-[-26px] w-[14px] h-[14px] rounded-full border-2 transition-colors duration-500 ${
                zone === 'espera' ? 'bg-green-500 border-green-400' : 'bg-zinc-900 border-zinc-800'
              }`} />
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${zone === 'espera' ? 'text-green-400' : 'text-zinc-500'}`}>Ingreso a Espera</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">El auto está en cola. Las cámaras calculan tu ingreso.</p>
              </div>
            </div>

            {/* Paso 2: Lavado */}
            <div className="flex items-start gap-4 relative">
              <div className={`absolute left-[-26px] w-[14px] h-[14px] rounded-full border-2 transition-colors duration-500 ${
                zone === 'lavado' ? 'bg-orange-500 border-orange-400' : 'bg-zinc-900 border-zinc-800'
              }`} />
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${zone === 'lavado' ? 'text-orange-400' : 'text-zinc-500'}`}>Túnel de Lavado Activo</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">Espuma, lavado de chasis y secado asistido por detailers.</p>
              </div>
            </div>

            {/* Paso 3: Terminado */}
            <div className="flex items-start gap-4 relative">
              <div className={`absolute left-[-26px] w-[14px] h-[14px] rounded-full border-2 transition-colors duration-500 ${
                zone === 'terminado' ? 'bg-lime-500 border-lime-400' : 'bg-zinc-900 border-zinc-800'
              }`} />
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${zone === 'terminado' ? 'text-lime-400' : 'text-zinc-500'}`}>Zona de Entrega</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">El auto está limpio y perfumado listo para rodar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTAS Y CONSEJOS EN SALA */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex items-start gap-4 w-full">
          <div className="p-3 bg-cyan-600/10 text-cyan-400 rounded-xl">
            <Info size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">¿Estás en la sala de espera?</h4>
            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">Disfrutá de un café de cortesía Lavadero VIP, wifi libre y revistas actualizadas mientras tu auto compite por el primer lugar de brillo.</p>
          </div>
        </div>

      </main>

      {/* FOOTER GENERAL OMAR */}
      <footer className="relative z-20 py-10 bg-zinc-950/40 border-t border-zinc-950 text-center space-y-3 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-zinc-600 font-bold">
          © 2026 Omar Adamo. Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-[9px] text-zinc-600 font-medium">
          <a href="mailto:adamoomar110@gmail.com" className="hover:text-orange-500 transition-colors">Email</a>
          <span>•</span>
          <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">WhatsApp</a>
          <span>•</span>
          <span className="text-zinc-600 font-black">v1.5</span>
        </div>
      </footer>
    </div>
  );
}
