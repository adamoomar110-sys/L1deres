'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const { settings, loading } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5500); // 5.5 segundos para dar margen al video de 5s

    return () => clearTimeout(timer);
  }, []);

  if (loading) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden"
        >
          {/* Video de fondo */}
          <video
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-fast-speed-camera-moving-along-a-white-car-34533-large.mp4" type="video/mp4" />
            Tu navegador no soporta videos.
          </video>

          {/* Overlay gradiente para mejorar legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />

          {/* Logo y Texto Animado */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
              className="w-24 h-24 bg-gradient-to-br from-orange-300 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_80px_rgba(6,182,212,0.4)] mb-8"
            >
              {settings?.brand_logo ? (
                <img src={settings.brand_logo} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <span className="font-black text-black text-5xl tracking-tighter">
                  {settings?.brand_name?.substring(0, 2).toUpperCase() || 'LV'}
                </span>
              )}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-center"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-black mb-2 italic uppercase">
                {settings?.brand_name || 'LAVADERO'}
              </h1>
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4" />
              <p className="text-orange-600 font-bold uppercase tracking-[0.6em] text-xs md:text-sm">
                Elite Car Wash Service
              </p>
            </motion.div>
          </div>

          {/* Barra de carga minimalista */}
          <motion.div 
            className="absolute bottom-0 left-0 h-1 bg-orange-400"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
