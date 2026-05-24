'use client';
import { Droplets, LogIn, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PortalUnico() {
  return (
    <div className="flex flex-col h-screen bg-orange-50 text-black font-sans overflow-hidden selection:bg-orange-400 selection:text-black">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Centralizado */}
      <header className="h-32 flex flex-col items-center justify-center relative z-20 mt-20">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-300 to-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.3)] mb-6 transform hover:scale-105 transition-transform duration-500">
          <Droplets className="text-black" size={40} />
        </div>
        <h1 className="font-black text-5xl md:text-6xl tracking-tighter leading-none text-black drop-shadow-2xl text-center">LAVADERO VIP</h1>
        <span className="text-sm text-orange-600 font-bold uppercase tracking-[0.4em] mt-2 text-center">Elite Car Wash</span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4 mt-8">
        <div className="max-w-md w-full">
          
          {/* Tarjeta de Login (Acceso al Sistema) */}
          <Link href="/login" className="group relative bg-white/80 backdrop-blur-xl border border-orange-200 p-10 rounded-[3rem] transition-all duration-500 hover:bg-slate-800/60 hover:border-orange-400/30 hover:shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col justify-between h-80">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-400 group-hover:text-black transition-colors duration-500">
                <LogIn size={28} />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Ingresar al Sistema</h2>
              <p className="text-slate-400 font-medium">Panel de administración exclusivo para el personal del lavadero.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-orange-600 font-bold tracking-widest uppercase text-xs">
              Iniciar Sesión <ArrowRight size={16} className="transform group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

        </div>
      </main>

      {/* Footer Security Badge */}
      <footer className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2 relative z-10 mt-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Sistema Cerrado • Acceso Restringido</span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold">
          © 2026 Omar Adamo. Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-[9px] text-slate-500 font-medium">
          <a href="mailto:adamoomar110@gmail.com" className="hover:text-orange-600 transition-colors">Email</a>
          <span>•</span>
          <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">WhatsApp</a>
          <span>•</span>
          <span className="text-slate-600 font-black">v1.0</span>
        </div>
      </footer>
    </div>
  );
}
