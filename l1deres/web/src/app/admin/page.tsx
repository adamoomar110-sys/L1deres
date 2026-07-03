'use client';
import { useState, useEffect } from 'react';
import { Users, Waves, ArrowRight, Settings, Droplets, Sparkles, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Obtener cantidad de usuarios
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        // Obtener órdenes de servicio completadas para la facturación
        const { data: orders } = await supabase
          .from('service_orders')
          .select('budget')
          .eq('provider_type', 'lavadero')
          .eq('status', 'completed');

        const totalRevenue = orders ? orders.reduce((sum, o) => sum + Number(o.budget || 0), 0) : 0;
        
        setData({
          totalUsers: count || 0,
          totalRevenue: totalRevenue
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = data || {
    totalUsers: 0,
    totalRevenue: 0
  };

  const cards = [
    { title: 'Control Lavadero', value: 'ABRIR', href: '/admin/lavadero', icon: Waves, color: 'text-orange-600', bg: 'bg-orange-400/10' },
    { title: 'Facturación en Vivo', value: `$${stats.totalRevenue.toLocaleString('es-AR')}`, href: '/admin/facturacion', icon: CreditCard, color: 'text-lime-600', bg: 'bg-lime-500/10' },
    { title: 'Usuarios del Sistema', value: stats.totalUsers, href: '/admin/usuarios', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Configuración', value: 'AJUSTES', href: '/admin/configuracion', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ];

  return (
    <div className="flex flex-col h-full p-6 lg:p-12 bg-orange-50 select-none">
      <header className="mb-12">
        <h2 className="text-4xl font-black tracking-tight text-black mb-2">Comando Central</h2>
        <p className="text-orange-500/70 font-medium text-lg italic">"Gestionando el futuro del Lavadero VIP."</p>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-400/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {cards.map((card) => (
              <Link key={card.title} href={card.href} className="group bg-white/80 backdrop-blur-xl border border-orange-200 p-8 rounded-[2.5rem] transition-all duration-500 hover:bg-slate-800/50 hover:border-orange-400/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] flex flex-col justify-between min-h-56">
                <div>
                  <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <card.icon size={28} />
                  </div>
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">{card.title}</h3>
                </div>
                <div className="flex items-baseline justify-between gap-2 mt-auto">
                  <span className="text-2xl lg:text-3xl font-black text-black tracking-tight truncate max-w-[80%]">{card.value}</span>
                  <ArrowRight size={20} className="text-slate-600 group-hover:text-orange-600 group-hover:translate-x-2 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Quick Access or Status */}
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-orange-400/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-orange-400/5 rounded-full blur-[100px] pointer-events-none" />
                <Droplets size={64} className="mx-auto text-orange-600 mb-6 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                <h3 className="text-3xl font-black text-black uppercase tracking-tighter mb-4 flex items-center justify-center gap-3">
                   Bienvenido al Sistema <Sparkles className="text-yellow-300" size={24} />
                </h3>
                <p className="text-cyan-100/60 font-medium max-w-lg mx-auto">
                   Selecciona una de las opciones en el panel superior o en el menú lateral para comenzar a operar el Lavadero.
                </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
