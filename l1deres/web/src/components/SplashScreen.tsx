'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Letras del título para animación de entrada estilo máquina de escribir retro
const TITLE_CHARS = "LAVADERO".split("");
const SUBTITLE = "SISTEMA DE CONTROL AVANZADO";

// SVG del auto pixel art visto desde arriba
const PixelCar = ({ color = "#00f0ff" }: { color?: string }) => (
  <svg width="64" height="110" viewBox="0 0 64 110" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 0 14px ${color}cc)` }}>
    {/* Ruedas */}
    <rect x="2" y="18" width="8" height="18" rx="2" fill="#09090b"/>
    <rect x="54" y="18" width="8" height="18" rx="2" fill="#09090b"/>
    <rect x="2" y="74" width="8" height="18" rx="2" fill="#09090b"/>
    <rect x="54" y="74" width="8" height="18" rx="2" fill="#09090b"/>
    {/* Cuerpo */}
    <rect x="10" y="8" width="44" height="90" rx="14" fill={color}/>
    {/* Franja central */}
    <rect x="28" y="8" width="8" height="90" fill="white" fillOpacity="0.12"/>
    {/* Parabrisas */}
    <path d="M16 38 C16 38, 20 28, 32 28 C44 28, 48 38, 48 38 L44 44 L20 44 Z" fill="#0d0d12"/>
    {/* Luneta */}
    <path d="M20 74 L44 74 L41 84 L23 84 Z" fill="#0d0d12"/>
    {/* Faros */}
    <rect x="14" y="7" width="8" height="4" rx="1" fill="#fef08a"/>
    <rect x="42" y="7" width="8" height="4" rx="1" fill="#fef08a"/>
    {/* Luces traseras */}
    <rect x="12" y="96" width="6" height="3" rx="1" fill="#f87171"/>
    <rect x="46" y="96" width="6" height="3" rx="1" fill="#f87171"/>
    {/* Detalle capó */}
    <rect x="20" y="16" width="24" height="6" rx="2" fill="#000" fillOpacity="0.3"/>
  </svg>
);

// Gotas de agua animadas
const WaterDrops = () => {
  const drops = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 10 + (i % 6) * 16,
    delay: (i * 0.15),
    duration: 0.6 + Math.random() * 0.4,
    size: 4 + Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {drops.map(drop => (
        <motion.div
          key={drop.id}
          className="absolute rounded-full bg-cyan-400"
          style={{ left: `${drop.x}%`, width: drop.size, height: drop.size, top: -10 }}
          animate={{ y: ['0%', '110vh'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
};

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState(0); // 0=intro, 1=car, 2=wash, 3=title, 4=done

  useEffect(() => {
    // Secuencia de fases retro
    const timers = [
      setTimeout(() => setPhase(1), 400),   // Auto entra
      setTimeout(() => setPhase(2), 1800),  // Lavado activo
      setTimeout(() => setPhase(3), 3500),  // Título aparece
      setTimeout(() => setPhase(4), 5200),  // Fading
      setTimeout(() => setIsVisible(false), 6200), // Desaparece
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#030712' }}
        >
          {/* Grid retro de fondo */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}/>

          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }}/>

          {/* Gotas de agua activas en fase 2 */}
          {phase >= 2 && phase < 4 && <WaterDrops />}

          {/* Orbes de luz de fondo */}
          <motion.div
            className="absolute rounded-full blur-[100px] pointer-events-none"
            style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,240,255,0.15), transparent)' }}
            animate={{ scale: phase >= 2 ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* === ESCENA DEL LAVADERO === */}
          <div className="relative flex flex-col items-center gap-6 z-10">

            {/* Túnel de lavado (arcos) */}
            <div className="relative flex items-center justify-center w-[220px]">
              {/* Arcos del túnel */}
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2 pointer-events-none"
                  style={{
                    width: 180 - i * 30,
                    height: 200 - i * 30,
                    borderColor: phase >= 2 ? '#00f0ff' : '#1f2937',
                    boxShadow: phase >= 2 ? `0 0 20px rgba(0,240,255,${0.3 - i * 0.08})` : 'none',
                  }}
                  animate={phase >= 2 ? {
                    borderColor: ['#00f0ff', '#a855f7', '#00f0ff'],
                    boxShadow: [
                      `0 0 20px rgba(0,240,255,${0.3 - i*0.08})`,
                      `0 0 30px rgba(168,85,247,${0.3 - i*0.08})`,
                      `0 0 20px rgba(0,240,255,${0.3 - i*0.08})`,
                    ]
                  } : {}}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}

              {/* Auto (entra desde abajo, sube) */}
              <motion.div
                initial={{ y: 160, opacity: 0 }}
                animate={
                  phase === 1 ? { y: 40, opacity: 1 } :
                  phase === 2 ? { y: 0, opacity: 1 } :
                  phase >= 3 ? { y: -120, opacity: 0 } : {}
                }
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                className="z-10"
              >
                <PixelCar color={phase >= 2 ? '#00f0ff' : '#a1a1aa'} />
              </motion.div>
            </div>

            {/* Partículas de espuma en lavado */}
            {phase === 2 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{ width: 6 + i * 2, height: 6 + i * 2 }}
                    animate={{
                      x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8)],
                      y: [0, -(10 + i * 10)],
                      opacity: [0.8, 0],
                      scale: [1, 0.3],
                    }}
                    transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* === TÍTULO RETRO === */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute bottom-[15%] flex flex-col items-center gap-3 z-10"
              >
                {/* Título letra por letra */}
                <div className="flex gap-1">
                  {TITLE_CHARS.map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="text-4xl md:text-6xl font-black tracking-widest uppercase"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        color: '#00f0ff',
                        textShadow: '0 0 20px rgba(0,240,255,0.8)',
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>

                {/* Línea separadora */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="h-px w-64 md:w-80"
                  style={{ background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)' }}
                />

                {/* Subtítulo */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase"
                  style={{ color: '#f97316', fontFamily: "'Orbitron', monospace" }}
                >
                  {SUBTITLE}
                </motion.p>

                {/* Versión */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 1.1, duration: 0.4 }}
                  className="text-[9px] tracking-widest"
                  style={{ color: '#4b5563', fontFamily: 'monospace' }}
                >
                  © 2026 Omar Adamo  •  v1.5
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barra de progreso retro */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 md:w-64 z-20">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00f0ff, #a855f7)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5.5, ease: 'linear' }}
              />
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
