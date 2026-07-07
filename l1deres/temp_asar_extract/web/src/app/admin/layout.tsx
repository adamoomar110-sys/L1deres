'use client';
import { useState, useEffect } from 'react';
import { Users, Bell, CreditCard, LogOut, ChevronRight, Settings, ShieldAlert, Car, Navigation, User as UserIcon, ClipboardList, Gift, Wrench, Droplets, Waves } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSystemSettings, SystemSettings } from '@/lib/settings';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [config, setConfig] = useState<any[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Fetch Profile, Config and Settings
      const [pRes, cRes, sRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('site_config').select('*'),
        getSystemSettings()
      ]);
      
      if (pRes.data) setUserProfile(pRes.data);
      if (cRes.data) setConfig(cRes.data);
      if (sRes) setSettings(sRes);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const rawNavItems = [
    { id: 'lavadero', name: 'Control Lavadero', href: '/admin/lavadero', icon: Waves },
    { id: 'control', name: 'Control Maestro', href: '/admin/control', icon: ClipboardList },
    { id: 'facturacion', name: 'Facturación', href: '/admin/facturacion', icon: CreditCard },
    { id: 'postulantes', name: 'Postulantes', href: '/admin/postulantes', icon: UserIcon },
    { id: 'usuarios', name: 'Gestión de Usuarios', href: '/admin/usuarios', icon: Users },
    { id: 'configuracion', name: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = rawNavItems.filter(item => {
    if (item.id === 'configuracion') return true; 
    const c = config.find(m => m.module_name === item.id);
    return c ? c.is_enabled : true; 
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-orange-50 text-black font-sans overflow-hidden selection:bg-green-400 selection:text-black">
      {/* Background Orbs Globales para el Admin */}
      <div className="absolute top-[20%] left-[-10%] w-[30vw] h-[30vw] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-green-400/5 rounded-full blur-[120px] pointer-events-none" />
      {/* Nuevo orbe Verde Limón */}
      <div className="absolute top-[10%] right-[20%] w-[20vw] h-[20vw] bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Cabecera Móvil Táctil */}
      <header className="lg:hidden h-20 px-6 bg-white/60 backdrop-blur-3xl border-b border-orange-200 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-green-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            {settings?.brand_logo ? (
              <img src={settings.brand_logo} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <span className="font-black text-black text-md tracking-tighter">
                {settings?.brand_name?.substring(0, 2).toUpperCase() || 'LV'}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-black text-md tracking-tight leading-none text-black uppercase">
              {settings?.brand_name || 'LAVADERO'}
            </h1>
            <span className="text-[8px] text-green-600 font-bold uppercase tracking-[0.2em]">Comando</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-3 text-zinc-700 hover:text-black rounded-xl bg-white/5 border border-orange-200 active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* Sidebar Móvil (Drawer Deslizable) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fondo oscuro traslúcido */}
          <div 
            className="fixed inset-0 bg-white/80 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Contenedor del menú */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#090909] border-r border-orange-200 flex flex-col z-50 animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-green-500 rounded-xl flex items-center justify-center">
                  <span className="font-black text-black text-md">
                    {settings?.brand_name?.substring(0, 2).toUpperCase() || 'LV'}
                  </span>
                </div>
                <div>
                  <h1 className="font-black text-md tracking-tight text-black uppercase">{settings?.brand_name || 'LAVADERO'}</h1>
                  <span className="text-[8px] text-green-600 font-bold uppercase tracking-[0.25em]">Comando</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600 hover:text-black"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 border-b border-orange-200 bg-gradient-to-b from-white/[0.01] to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-600 border border-orange-200">
                  <UserIcon size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-black truncate leading-none mb-1">
                    {userProfile?.full_name || 'Cargando...'}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-lime-400 rounded-full animate-pulse" />
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest truncate">
                      {userProfile?.role === 'admin' ? 'Administrador' : 'Gestor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-green-400/10 border border-green-400/20 text-green-600 font-bold shadow-[inset_3px_0_0_0_rgba(163,230,53,1)]' 
                          : 'text-zinc-700 hover:bg-white/5 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={isActive ? 'text-lime-400' : ''} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-6 border-t border-orange-200 space-y-4">
              <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-3.5 rounded-xl text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300">
                <LogOut size={18} />
                <span className="font-bold text-xs uppercase tracking-widest">Cerrar Sesión</span>
              </button>
              
              <div className="pt-2 text-center border-t border-orange-200 space-y-1">
                <p className="text-[9px] text-zinc-600 font-bold">
                  © 2026 Omar Adamo
                </p>
                <div className="flex justify-center gap-3 text-[8px] text-zinc-600">
                  <a href="mailto:adamoomar110@gmail.com" className="hover:text-green-600 transition-colors">Email</a>
                  <span>•</span>
                  <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">WhatsApp</a>
                  <span>•</span>
                  <span className="font-black text-zinc-700">v1.5</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Premium Sidebar Unificado (Solo Escritorio) */}
      <aside className="hidden lg:flex w-72 bg-white/40 backdrop-blur-3xl border-r border-orange-200 flex-col relative z-20 shrink-0 h-screen sticky top-0">
        <div className="h-24 flex items-center px-8 border-b border-orange-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              {settings?.brand_logo ? (
                <img src={settings.brand_logo} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <span className="font-black text-black text-xl tracking-tighter">
                  {settings?.brand_name?.substring(0, 2).toUpperCase() || 'LV'}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none text-black uppercase">
                {settings?.brand_name || 'LAVADERO'}
              </h1>
              <span className="text-[10px] text-green-600 font-bold uppercase tracking-[0.2em]">Comando</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-b border-orange-200 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-600 border border-orange-200">
              <UserIcon size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-black truncate leading-none mb-1">
                {userProfile?.full_name || 'Cargando...'}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest truncate">
                  {userProfile?.role === 'admin' ? 'Administrador' : 'Gestor'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-4 px-4">Menu Principal</p>
          <nav className="flex flex-col gap-2">
            {loading ? (
               <div className="space-y-3 px-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
               </div>
            ) : (
              navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-green-400/10 to-transparent border border-green-400/20 text-green-600 shadow-[inset_4px_0_0_0_rgba(163,230,53,1)]' 
                        : 'text-zinc-700 hover:bg-white/5 hover:text-black'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={isActive ? 'text-lime-400' : 'group-hover:text-lime-400 transition-colors'} />
                      <span className={isActive ? 'font-bold' : 'font-medium'}>{item.name}</span>
                    </div>
                    {!isActive && <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-lime-400" />}
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-orange-200 space-y-4">
          <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-4 rounded-2xl text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300">
            <LogOut size={20} />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
          
          <div className="pt-2 text-center border-t border-orange-200 space-y-2">
            <p className="text-[10px] text-zinc-600 font-bold tracking-tight">
              © 2026 Omar Adamo. Todos los derechos reservados.
            </p>
            <div className="flex justify-center gap-4 text-[9px] text-zinc-600 font-medium">
              <a href="mailto:adamoomar110@gmail.com" className="hover:text-green-600 transition-colors">Email</a>
              <span>•</span>
              <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">WhatsApp</a>
              <span>•</span>
              <span className="text-zinc-600 font-black">v1.5</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area unificado */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}

