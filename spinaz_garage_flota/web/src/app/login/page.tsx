'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, Car, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

      if (signInError) {
        throw new Error(signInError.message || 'Credenciales incorrectas');
      }

      // Extraer rol directamente del usuario autenticado o inferir según el correo
      let userRole = data?.user?.role || data?.session?.user?.role || 'driver';
      const lowEmail = email.toLowerCase().trim();

      if (lowEmail.includes('admin') || lowEmail.includes('omar') || lowEmail.includes('claudio')) {
        userRole = 'admin';
      } else if (lowEmail.includes('taller') || lowEmail.includes('mecanico')) {
        userRole = 'mechanic';
      } else if (lowEmail.includes('lavadero')) {
        userRole = 'lavadero';
      } else if (lowEmail.includes('lubri')) {
        userRole = 'lubricentro';
      }

      // Guardar sesión demo local para navegación fluida
      if (typeof window !== 'undefined') {
        localStorage.setItem('spinaz_demo_user', JSON.stringify({ email, role: userRole }));
      }

      // Redirección Inteligente según Rol
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'mechanic') {
        router.push('/taller');
      } else if (userRole === 'lubricentro') {
        router.push('/lubricentro');
      } else if (userRole === 'lavadero') {
        router.push('/lavadero');
      } else {
        router.push('/chofer');
      }

    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#030303] text-white font-sans overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Minimal */}
      <header className="absolute top-0 left-0 w-full p-8 z-20">
        <Link href="/" className="flex items-center gap-3 text-zinc-500 hover:text-white transition-colors w-fit">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm tracking-widest uppercase">Volver al Portal</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-12 rounded-[3rem] shadow-2xl w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] mx-auto mb-6">
              <Car className="text-black" size={32} />
            </div>
            <h1 className="font-black text-3xl tracking-tight text-white mb-2">Iniciar Sesión</h1>
            <p className="text-zinc-400 text-sm font-medium">Ingresa tus credenciales de acceso</p>
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
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest pl-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-yellow-500 focus:bg-black transition-all shadow-inner"
                  placeholder="admin@spinaz.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest pl-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-yellow-500 focus:bg-black transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-extrabold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_50px_rgba(234,179,8,0.4)] flex items-center justify-center gap-3 transform hover:-translate-y-1 mt-8 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Ingresar</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER GENERAL */}
      <footer className="absolute bottom-6 left-0 right-0 text-center space-y-1.5 opacity-40 hover:opacity-100 transition-opacity z-20">
        <p className="text-[10px] text-zinc-500 font-bold">
          © 2026 Omar Adamo — Startup Aura. Todos los derechos reservados.
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
