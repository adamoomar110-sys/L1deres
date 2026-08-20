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
    const paid = data
      .filter(p => p.status === 'completed' || p.status === 'approved')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const pendingDebt = data
      .filter(p => p.status === 'pending' || p.status === 'rejected')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const pendingCount = data.filter(p => p.status === 'pending').length;
    setStats({ total_paid: paid, total_debt: pendingDebt, pending_count: pendingCount });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      setPayments(prev => {
        const next = prev.map(p => p.id === id ? { ...p, status: newStatus } : p);
        calculateStats(next);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white italic leading-none">Pagos y Cobros</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Seguimiento financiero de la flota</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
              <TrendingUp className="text-green-500" size={15} />
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Cobrado</p>
                <p className="text-xs font-black text-green-500">${stats.total_paid.toLocaleString()}</p>
              </div>
           </div>
           <div className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <TrendingDown className="text-red-500" size={15} />
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Pendiente</p>
                <p className="text-xs font-black text-red-500">${stats.total_debt.toLocaleString()}</p>
              </div>
           </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 z-10">
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 border-3 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-5 py-2 bg-zinc-900/50 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500">
              <div className="col-span-2">Chofer</div>
              <div>Fecha Venc.</div>
              <div>Monto</div>
              <div>Tipo</div>
              <div className="text-right">Estado / Acción</div>
            </div>

            {/* Table Rows */}
            {payments.map(p => (
              <div key={p.id} className="grid grid-cols-6 items-center px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl transition-all">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-zinc-400 shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white leading-none mb-0.5 truncate">
                      {p.profiles?.full_name || p.driver_name || 'Sin nombre'}
                    </p>
                    <p className="text-[9px] text-zinc-500 truncate">
                      {p.profiles?.email || p.driver_email || `ID: ${String(p.id).substring(0, 8)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <Calendar size={12} className="text-yellow-500 shrink-0" />
                  <span>{p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A'}</span>
                </div>

                <div className="text-sm font-black text-white">
                  ${Number(p.amount).toLocaleString()}
                </div>

                <div>
                   <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block ${
                     p.type === 'penalty' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                     p.type === 'debt' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                     'bg-blue-500/10 text-blue-500 border-blue-500/20'
                   }`}>
                     {p.type}
                   </span>
                </div>

                <div className="flex items-center justify-end gap-1.5">
                   {p.receipt_url && (
                     <button 
                       onClick={() => window.open(p.receipt_url, '_blank')}
                       className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-yellow-500 transition-all"
                       title="Ver Comprobante"
                     >
                       <FileText size={14} />
                     </button>
                   )}
                   <select 
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className={`bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider focus:outline-none focus:border-yellow-500 transition-all cursor-pointer ${
                      p.status === 'completed' || p.status === 'approved' ? 'text-green-400 border-green-500/30' : 
                      p.status === 'rejected' ? 'text-red-400 border-red-500/30' : 'text-yellow-400 border-yellow-500/30'
                    }`}
                   >
                     <option value="pending" className="bg-zinc-950 text-yellow-400 font-bold">PENDIENTE</option>
                     <option value="approved" className="bg-zinc-950 text-green-400 font-bold">APROBADO</option>
                     <option value="completed" className="bg-zinc-950 text-green-400 font-bold">COMPLETADO</option>
                     <option value="rejected" className="bg-zinc-950 text-red-400 font-bold">RECHAZADO</option>
                   </select>
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <div className="py-12 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center text-zinc-500 bg-black/20">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                  <CreditCard size={20} className="opacity-50 text-yellow-500" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Sin movimientos contables</h3>
                <p className="text-xs max-w-sm">No se han registrado pagos o deudas en el sistema todavía.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
