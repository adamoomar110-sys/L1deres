'use client';
import { useState, useEffect } from 'react';
import { Users, Bell, CreditCard, LogOut, ChevronRight, Settings, ShieldAlert, Car, Navigation, User as UserIcon, ClipboardList, Gift, Wrench, Droplets, Waves } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSystemSettings, SystemSettings } from '@/lib/settings';
import GlobalChat from '@/components/GlobalChat';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [config, setConfig] = useState<any[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setUserProfile(session.user);
        } else {
          // Perfil de respaldo para Omar / Admin
          setUserProfile({
            id: 'u-admin-01',
            full_name: 'Omar Adamo (Admin)',
            email: 'admin@spinaz.com',
            role: 'admin'
          });
        }
        const sRes = await getSystemSettings();
        if (sRes) setSettings(sRes);
      } catch (e) {
        setUserProfile({
          id: 'u-admin-01',
          full_name: 'Omar Adamo (Admin)',
          email: 'admin@spinaz.com',
          role: 'admin'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const rawNavItems = [
    { id: 'postulantes', name: 'Postulantes', href: '/admin/postulantes', icon: Users },
    { id: 'avisos', name: 'Avisos', href: '/admin/avisos', icon: Bell },
    { id: 'taller', name: 'Gestión Taller', href: '/admin/taller', icon: Wrench },
    { id: 'lubricentro', name: 'Lubricentro', href: '/admin/lubricentro', icon: Droplets },
    { id: 'lavadero', name: 'Lavadero de Autos', href: '/admin/lavadero', icon: Waves },
    { id: 'informes', name: 'Informes de Fallas', href: '/admin/informes', icon: ShieldAlert },
    { id: 'monitoreo', name: 'Monitoreo GPS', href: '/admin/monitoreo', icon: Navigation },
    { id: 'reportes', name: 'Control Operativo', href: '/admin/reportes', icon: ClipboardList },
    { id: 'flota', name: 'Gestión de Flota', href: '/admin/flota', icon: Car },
    { id: 'usuarios', name: 'Gestión de Usuarios', href: '/admin/usuarios', icon: Users },
    { id: 'cobros', name: 'Pagos y Cobros', href: '/admin/cobros', icon: CreditCard },
    { id: 'beneficios', name: 'Spinaz Club', href: '/admin/beneficios', icon: Gift },
    { id: 'configuracion', name: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = rawNavItems.filter(item => {
    if (item.id === 'configuracion') return userProfile?.id === '734a51e1-194a-466c-b2a9-a324f8a52a27'; 
    const c = config.find(m => m.module_name === item.id);
    return c ? c.is_enabled : true; 
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#030303] text-white font-sans overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Background Orbs Globales para el Admin */}
      <div className="absolute top-[20%] left-[-10%] w-[30vw] h-[30vw] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      {/* Nuevo orbe Verde Limón */}
      <div className="absolute top-[10%] right-[20%] w-[20vw] h-[20vw] bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Cabecera Móvil Táctil */}
      <header className="lg:hidden h-20 px-6 bg-black/60 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            {settings?.brand_logo ? (
              <img src={settings.brand_logo} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <span className="font-black text-black text-md tracking-tighter">
                {settings?.brand_name?.substring(0, 2).toUpperCase() || 'SG'}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-black text-md tracking-tight leading-none text-white uppercase">
              {settings?.brand_name || 'SPINAZ'}
            </h1>
            <span className="text-[8px] text-yellow-500 font-bold uppercase tracking-[0.2em]">Comando</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-3 text-zinc-400 hover:text-white rounded-xl bg-white/5 border border-white/5 active:scale-95 transition-transform"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Contenedor del menú */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#090909] border-r border-white/5 flex flex-col z-50 animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                  <span className="font-black text-black text-md">
                    {settings?.brand_name?.substring(0, 2).toUpperCase() || 'SG'}
                  </span>
                </div>
                <div>
                  <h1 className="font-black text-md tracking-tight text-white uppercase">{settings?.brand_name || 'SPINAZ'}</h1>
                  <span className="text-[8px] text-yellow-500 font-bold uppercase tracking-[0.25em]">Comando</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 border border-white/5">
                  <UserIcon size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate leading-none mb-1">
                    {userProfile?.full_name || 'Cargando...'}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-lime-400 rounded-full animate-pulse" />
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest truncate">
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
                          ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold shadow-[inset_3px_0_0_0_rgba(163,230,53,1)]' 
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
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

            <div className="p-6 border-t border-white/5 space-y-4">
              <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-3.5 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300">
                <LogOut size={18} />
                <span className="font-bold text-xs uppercase tracking-widest">Cerrar Sesión</span>
              </button>
              
              <div className="pt-2 text-center border-t border-white/5 space-y-1">
                <p className="text-[9px] text-zinc-600 font-bold">
                  © 2026 Omar Adamo — Startup Aura
                </p>
                <div className="flex justify-center gap-3 text-[8px] text-zinc-500">
                  <a href="mailto:adamoomar110@gmail.com" className="hover:text-yellow-500 transition-colors">Email</a>
                  <span>•</span>
                  <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">WhatsApp</a>
                  <span>•</span>
                  <span className="font-black text-zinc-700">v1.0</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Premium Sidebar Unificado (Solo Escritorio) */}
      <aside className="hidden lg:flex w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col relative z-20 shrink-0 h-screen sticky top-0">
        <div className="h-24 flex items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              {settings?.brand_logo ? (
                <img src={settings.brand_logo} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <span className="font-black text-black text-xl tracking-tighter">
                  {settings?.brand_name?.substring(0, 2).toUpperCase() || 'SG'}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none text-white uppercase">
                {settings?.brand_name || 'SPINAZ'}
              </h1>
              <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.2em]">Comando</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 border border-white/5">
              <UserIcon size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate leading-none mb-1">
                {userProfile?.full_name || 'Cargando...'}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                  {userProfile?.role === 'admin' ? 'Administrador' : 'Gestor'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 px-4">Menu Principal</p>
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
                        ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 text-yellow-500 shadow-[inset_4px_0_0_0_rgba(163,230,53,1)]' 
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
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

        <div className="p-6 border-t border-white/5 space-y-4">
          <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-4 rounded-2xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300">
            <LogOut size={20} />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
          
          <div className="pt-2 text-center border-t border-white/5 space-y-2">
            <p className="text-[10px] text-zinc-500 font-bold tracking-tight">
              © 2026 Omar Adamo — Startup Aura. Todos los derechos reservados.
            </p>
            <div className="flex justify-center gap-4 text-[9px] text-zinc-500 font-medium">
              <a href="mailto:adamoomar110@gmail.com" className="hover:text-yellow-500 transition-colors">Email</a>
              <span>•</span>
              <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">WhatsApp</a>
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

      {/* Global Chat en Panel de Comando */}
      <GlobalChat module="ADMIN" accentColor="yellow" />

      {/* Botón Flotante de Ayuda */}
      <button 
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black px-5 py-3.5 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center gap-2.5 transform hover:scale-105 active:scale-95 transition-all text-xs tracking-wider uppercase border border-yellow-300/40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <span>Ayuda & Guía</span>
      </button>

      {/* Modal de Ayuda y Funcionamiento */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] p-8 lg:p-10 shadow-3xl flex flex-col overflow-hidden relative">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight">Manual & Guía de Funcionamiento</h3>
                  <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Spinaz Garage System v1.0</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Contenido scrolleable del Modal */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-zinc-300 font-medium">
              
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                <h4 className="text-white font-black text-base mb-2 flex items-center gap-2">
                  <span>🚀</span> ¿Qué es Spinaz Garage?
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Es una plataforma integral cloud para la gestión en tiempo real de flotas de vehículos, choferes, postulaciones, mantenimiento en taller y servicios de lubricentro con integración a Supabase y despliegue automático en Vercel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Módulo Postulantes */}
                <div className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all">
                  <h5 className="text-yellow-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>📄</span> 1. Postulantes (/admin/postulantes)
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Los choferes interesados completan el formulario público en <code className="text-yellow-400">/postular</code>. En este panel el administrador revisa su documentación (DNI, Licencia) y puede <strong>Aprobar</strong> o <strong>Rechazar</strong>. Al aprobarlo, se le habilita la opción de <strong>Contratar y crear acceso</strong> automáticamente.
                  </p>
                </div>

                {/* Módulo Taller */}
                <div className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all">
                  <h5 className="text-yellow-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🛠️</span> 2. Gestión de Taller (/admin/taller)
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Permite enviar unidades a reparación. El personal técnico o taller accede desde <code className="text-yellow-400">/taller</code> para registrar tareas realizadas, presupuesto y cambiar el estado de la unidad a <strong>Finalizado / Listo para entrega</strong>.
                  </p>
                </div>

                {/* Módulo Lubricentro */}
                <div className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all">
                  <h5 className="text-yellow-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🛢️</span> 3. Lubricentro (/admin/lubricentro)
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Control preventivo de cambios de aceite y filtros por kilometraje. Los técnicos operan desde <code className="text-yellow-400">/lubricentro</code> para cargar el servicio efectuado y habilitar nuevamente la unidad a la flota activa.
                  </p>
                </div>

                {/* Módulo Flota */}
                <div className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all">
                  <h5 className="text-yellow-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🚘</span> 4. Gestión de Flota (/admin/flota)
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Inventario completo de autos (Marca, Modelo, Patente, Estado). Permite derivar vehículos a Taller o Lubricentro de forma directa y asignar un chofer responsable a cada unidad.
                  </p>
                </div>

                {/* Módulo Choferes */}
                <div className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all">
                  <h5 className="text-yellow-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>📱</span> 5. App Choferes (/chofer)
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Panel móvil donde cada chofer inicia turno, registra el kilometraje de salida/llegada, la recaudación del día e informa fallas mecánicas urgentes al administrador.
                  </p>
                </div>

                {/* Módulo Cobros */}
                <div className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all">
                  <h5 className="text-yellow-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>💰</span> 6. Pagos y Cobros (/admin/cobros)
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Auditoría financiera. Registro de deudas diarias por concepto de alquiler de coche, entregas de dinero en efectivo o transferencias y estado de cuenta de cada chofer.
                  </p>
                </div>

              </div>

              {/* Pie de ayuda */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 text-center">
                <p className="text-xs font-bold text-yellow-500">
                  © 2026 Omar Adamo — Sistema creado para Aura / Spinaz Garage.
                </p>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="bg-yellow-500 text-black font-black px-8 py-3.5 rounded-2xl hover:bg-yellow-400 transition-all text-xs tracking-wider uppercase"
              >
                Entendido, cerrar ayuda
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

