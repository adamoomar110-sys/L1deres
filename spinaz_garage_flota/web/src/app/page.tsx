'use client';
import { Car, LogIn, ClipboardList, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PortalUnico() {
  return (
    <div className="flex flex-col h-screen bg-[#030303] text-white font-sans overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Centralizado */}
      <header className="h-32 flex flex-col items-center justify-center relative z-20 mt-10">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)] mb-6 transform hover:scale-105 transition-transform duration-500">
          <span className="font-black text-black text-4xl tracking-tighter">SG</span>
        </div>
        <h1 className="font-black text-6xl tracking-tighter leading-none text-white drop-shadow-2xl">SPINAZ</h1>
        <span className="text-sm text-yellow-500 font-bold uppercase tracking-[0.4em] mt-2">Garage App Oficial</span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tarjeta de Login (Acceso al Sistema) */}
          <Link href="/login" className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[3rem] transition-all duration-500 hover:bg-zinc-800/60 hover:border-yellow-500/30 hover:shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col justify-between h-80">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-colors duration-500">
                <LogIn size={28} />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Ingresar al Sistema</h2>
              <p className="text-zinc-400 font-medium">Panel de administración y dashboard exclusivo para choferes activos de la flota.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-yellow-500 font-bold tracking-widest uppercase text-xs">
              Iniciar Sesión <ArrowRight size={16} className="transform group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

          {/* Tarjeta de Reclutamiento (Postularse) */}
          <Link href="/postular" className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[3rem] transition-all duration-500 hover:bg-zinc-800/60 hover:border-white/20 hover:shadow-2xl overflow-hidden flex flex-col justify-between h-80">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-500">
                <ClipboardList size={28} />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2 text-white">Postularme</h2>
              <p className="text-zinc-400 font-medium">¿Quieres manejar con nosotros? Completa el formulario de ingreso y sumate a nuestra flota de choferes VIP.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-white font-bold tracking-widest uppercase text-xs">
              Enviar Solicitud <ArrowRight size={16} className="transform group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

        </div>
      </main>

      {/* Footer Security Badge */}
      <footer className="py-8 flex flex-col items-center justify-center text-zinc-600 gap-2 relative z-10 mt-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Sistema Cerrado • Acceso Restringido</span>
        </div>
        <p className="text-[10px] text-zinc-500 font-bold">
          © 2026 Omar Adamo — Aura. Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-[9px] text-zinc-500 font-medium">
          <a href="mailto:adamoomar110@gmail.com" className="hover:text-yellow-500 transition-colors">Email</a>
          <span>•</span>
          <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">WhatsApp</a>
          <span>•</span>
          <span className="text-zinc-600 font-black">v1.5</span>
        </div>
      </footer>
    </div>
  );
}
