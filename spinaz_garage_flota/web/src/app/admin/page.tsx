'use client';
import { useState, useEffect } from 'react';
import { Users, Bell, ShieldAlert, CreditCard, ArrowRight, Car, AlertTriangle, Gift, Map, Trophy, Waves } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          console.warn('Dashboard API returned non-200 status, using fallback stats');
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = {
    totalDrivers: data?.summary?.totalDrivers ?? 0,
    pendingApplicants: data?.summary?.pendingApplicants ?? 0,
    totalFleetDebt: data?.summary?.totalFleetDebt ?? 0,
    washPrice: data?.summary?.washPrice ?? 5000
  };

  const cards = [
    { title: 'Postulantes Pendientes', value: stats.pendingApplicants, href: '/admin/postulantes', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Deuda Total Flota', value: `$${(stats.totalFleetDebt || 0).toLocaleString()}`, href: '/admin/cobros', icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Conductores Activos', value: stats.totalDrivers, href: '/admin/usuarios', icon: Car, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Precio del Lavado', value: `$${(stats.washPrice || 5000).toLocaleString()}`, href: '/admin/lavadero', icon: Waves, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="flex flex-col h-full p-6 lg:p-12 bg-[#030303]">
      <header className="mb-12">
        <h2 className="text-4xl font-black tracking-tight text-white mb-2">Comando de Flota</h2>
        <p className="text-zinc-400 font-medium text-lg italic">"Gestionando el futuro de Spinaz Garage."</p>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {cards.map((card) => (
              <Link key={card.title} href={card.href} className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] transition-all duration-500 hover:bg-zinc-800/50 hover:border-white/10 hover:shadow-2xl">
                <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                  <card.icon size={28} />
                </div>
                <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">{card.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{card.value}</span>
                  <ArrowRight size={20} className="text-zinc-700 group-hover:text-yellow-500 group-hover:translate-x-2 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Fleet Map Preview */}
            <div className="lg:col-span-2 bg-zinc-900/30 border border-white/5 rounded-[3rem] p-8 relative overflow-hidden h-[400px]">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Map size={24} className="text-yellow-500" /> Monitoreo de Unidades
                  </h3>
                  <Link href="/admin/monitoreo" className="text-xs font-black text-zinc-500 hover:text-white transition-colors tracking-widest">EXPANDIR MAPA</Link>
               </div>
               <div className="w-full h-full bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-white/5 border-dashed">
                  <div className="text-center">
                    <Map size={48} className="text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Mapa Interactivo - Próxima Versión</p>
                  </div>
               </div>
            </div>

            {/* Ranking Preview */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
                    <Trophy size={24} className="text-yellow-500" /> Ranking de Elite
                </h3>
                <div className="space-y-6">
                   {data?.drivers?.slice(0, 4).map((driver: any, index: number) => (
                     <div key={driver.id} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-zinc-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                           {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-white uppercase text-sm">{driver.full_name}</p>
                          <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Puntualidad: 98%</p>
                        </div>
                     </div>
                   ))}
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
