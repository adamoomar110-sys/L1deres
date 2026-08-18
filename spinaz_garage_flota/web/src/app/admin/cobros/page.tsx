'use client';
import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, TrendingDown, Clock, CheckCircle2, User, DollarSign, Search, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CobrosAdmin() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_paid: 0, total_debt: 0, pending_count: 0 });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        profiles:driver_id (full_name, email)
      `)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPayments(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data: any[]) => {
    const paid = data.filter(p => p.status === 'completed' || p.status === 'approved').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const debt = data.filter(p => p.type === 'debt' || p.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const pending = data.filter(p => p.status === 'pending').length;
    setStats({ total_paid: paid, total_debt: debt, pending_count: pending });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-24 px-12 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 z-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">Pagos y Cobros</h2>
          <p className="text-zinc-400 text-sm font-medium">Seguimiento financiero de la flota y recaudación semanal.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
              <TrendingUp className="text-green-500" size={20} />
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter leading-none">Total Cobrado</p>
                <p className="text-xl font-black text-green-500">${stats.total_paid.toLocaleString()}</p>
              </div>
           </div>
           <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <TrendingDown className="text-red-500" size={20} />
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter leading-none">Pendiente/Deuda</p>
                <p className="text-xl font-black text-red-500">${stats.total_debt.toLocaleString()}</p>
              </div>
           </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-12 z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-yellow-500">
            <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Cargando registros contables...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-8 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <div className="col-span-2">Chofer</div>
              <div>Fecha Venc.</div>
              <div>Monto</div>
              <div>Tipo</div>
              <div className="text-right">Estado / Acción</div>
            </div>

            {/* Table Rows */}
            {payments.map(p => (
              <div key={p.id} className="grid grid-cols-6 items-center px-8 py-6 bg-zinc-900/20 hover:bg-zinc-800/40 border border-white/5 rounded-[2rem] transition-all duration-300">
                <div className="col-span-2 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-white leading-none mb-1">{p.profiles?.full_name}</p>
                    <p className="text-[10px] text-zinc-500">{p.profiles?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <Calendar size={14} className="text-yellow-500" />
                  {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A'}
                </div>

                <div className="text-lg font-black text-white">
                  ${Number(p.amount).toLocaleString()}
                </div>

                <div>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                     p.type === 'penalty' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                     p.type === 'debt' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                     'bg-blue-500/10 text-blue-500 border-blue-500/20'
                   }`}>
                     {p.type}
                   </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                   {p.receipt_url && (
                     <button 
                       onClick={() => window.open(p.receipt_url, '_blank')}
                       className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-yellow-500 transition-all group"
                       title="Ver Comprobante"
                     >
                       <FileText size={18} />
                     </button>
                   )}
                   <select 
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className={`bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-yellow-500 transition-all ${
                      p.status === 'completed' || p.status === 'approved' ? 'text-green-500' : 
                      p.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                    }`}
                   >
                     <option value="pending">Pendiente</option>
                     <option value="approved">Aprobado</option>
                     <option value="completed">Completado</option>
                     <option value="rejected">Rechazado</option>
                   </select>
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <div className="h-[400px] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center text-zinc-500 bg-black/20 backdrop-blur-sm">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <CreditCard size={32} className="opacity-50 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin movimientos contables</h3>
                <p className="max-w-sm">No se han registrado pagos o deudas en el sistema todavía.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
