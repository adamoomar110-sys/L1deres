'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, Car, AlertTriangle, ArrowLeft, Droplets, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CarWashAnimation = () => {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-orange-400/30 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
      {/* Coche Animado */}
      <motion.div
        animate={{
          x: [-100, 0, 0, 100],
          color: ['#a1a1aa', '#a1a1aa', '#22d3ee', '#22d3ee'], // De sucio (zinc-400) a limpio (cyan-400)
          scale: [0.8, 1, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut"
        }}
        className="absolute z-10"
      >
        <Car size={48} />
      </motion.div>

      {/* Espuma / Agua (Droplets) */}
      <motion.div
        animate={{
          scale: [0, 0, 1.5, 1.5, 0],
          opacity: [0, 0, 1, 1, 0],
          y: [20, 20, 0, 0, 20]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.2, 0.4, 0.6, 1],
          ease: "easeInOut"
        }}
        className="absolute z-20 flex items-center justify-center"
      >
        <div className="relative flex items-center justify-center w-full h-full">
           <Droplets size={56} className="text-black drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]" />
           {/* Burbujas extra */}
           <motion.div 
             animate={{ y: [-10, -30], opacity: [1, 0] }} 
             transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} 
             className="absolute -top-4 -left-4 w-3 h-3 bg-white rounded-full opacity-80 shadow-[0_0_10px_white]" 
           />
           <motion.div 
             animate={{ y: [-5, -25], opacity: [1, 0] }} 
             transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }} 
             className="absolute -top-2 -right-4 w-4 h-4 bg-cyan-200 rounded-full opacity-60 shadow-[0_0_10px_cyan]" 
           />
        </div>
      </motion.div>

      {/* Destello (Sparkles) cuando sale limpio */}
      <motion.div
        animate={{
          scale: [0, 0, 0, 1.2, 0],
          opacity: [0, 0, 0, 1, 0],
          rotate: [0, 0, 0, 180, 180]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.5, 0.6, 0.7, 1],
        }}
        className="absolute z-30"
      >
        <Sparkles size={32} className="text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
      </motion.div>
      
      {/* Piso del lavadero */}
      <div className="absolute bottom-4 w-3/4 h-1 bg-orange-400/20 rounded-full blur-[1px]" />
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Obtener el rol del perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Redirección Inteligente al lavadero
      router.push('/admin/lavadero');

    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-orange-50 text-black font-sans overflow-hidden selection:bg-orange-400 selection:text-black">
      {/* Background Orbs de Agua */}
      <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Minimal */}
      <header className="absolute top-0 left-0 w-full p-8 z-20">
        <Link href="/" className="flex items-center gap-3 text-zinc-600 hover:text-orange-600 transition-colors w-fit">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm tracking-widest uppercase">Volver al Portal</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="bg-white/80 backdrop-blur-xl border border-orange-200 p-12 rounded-[3rem] shadow-2xl w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          
          <div className="text-center mb-8">
            <CarWashAnimation />
            
            <h1 className="font-black text-3xl tracking-tight text-black mb-2">Lavadero VIP</h1>
            <p className="text-orange-600/80 text-sm font-bold uppercase tracking-widest">Panel de Control</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500">
                <AlertTriangle size={18} />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-orange-500/70 mb-2 uppercase tracking-widest pl-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-2xl px-6 py-4 text-black font-medium focus:outline-none focus:border-orange-400 focus:bg-slate-950 transition-all shadow-inner"
                  placeholder="admin@lavadero.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-orange-500/70 mb-2 uppercase tracking-widest pl-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-2xl px-6 py-4 text-black font-medium focus:outline-none focus:border-orange-400 focus:bg-slate-950 transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-300 to-green-300 hover:from-orange-200 hover:to-green-200 text-black font-extrabold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3 transform hover:-translate-y-1 mt-8 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER GENERAL */}
      <footer className="absolute bottom-6 left-0 right-0 text-center space-y-1.5 opacity-40 hover:opacity-100 transition-opacity z-20">
        <p className="text-[10px] text-orange-500/50 font-bold">
          © 2026 Omar Adamo. Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-[9px] text-zinc-600 font-medium">
          <a href="mailto:adamoomar110@gmail.com" className="hover:text-orange-600 transition-colors">Email</a>
          <span>•</span>
          <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">WhatsApp</a>
          <span>•</span>
          <span className="text-zinc-600 font-black">v1.0</span>
        </div>
      </footer>
    </div>
  );
}
