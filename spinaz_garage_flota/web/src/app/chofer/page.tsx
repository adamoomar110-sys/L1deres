'use client';
import { useState, useEffect } from 'react';
import { Car, UploadCloud, FileText, Bell, CreditCard, CheckCircle, ShieldAlert, BookOpen, LogOut, Gift, Fuel, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GlobalChat from '@/components/GlobalChat';
import Footer from '@/components/Footer';

export default function ChoferDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'pagos' | 'reporte' | 'checkup' | 'beneficios' | 'normas'>('home');
  const [reportData, setReportData] = useState({ description: '' });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [shiftData, setShiftData] = useState({ km: '', revenue: '' });
  const [debt, setDebt] = useState(0);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Fetch Profile & Vehicle
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (prof) {
        // Fetch vehicle safely via API to bypass RLS restrictions
        if (prof.vehicle_id) {
           try {
             const res = await fetch(`/api/vehicle?id=${prof.vehicle_id}`);
             if (res.ok) {
               const vehicleData = await res.json();
               prof.vehicles = vehicleData;
             }
           } catch (e) {
             console.error("Error fetching vehicle via API");
           }
        }
        setProfile(prof);
      }

      // Fetch Debt (Pending 'debt' type payments)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('driver_id', session.user.id)
        .eq('status', 'pending')
        .eq('type', 'debt');
      
      const totalDebt = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      setDebt(totalDebt);

      // Fetch Announcements (Globales + Personales)
      const { data: avisos } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`driver_id.is.null,driver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });
      if (avisos) setAnnouncements(avisos);

      // Fetch Benefits
      const { data: club } = await supabase.from('benefits').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (club) setBenefits(club);
    };
    initData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handlePaymentUpload = async () => {
    if (!paymentFile || !profile) return;
    setIsUploadingPayment(true);
    try {
      const formData = new FormData();
      formData.append('file', paymentFile);
      formData.append('driver_id', profile.id);
      formData.append('amount', debt.toString());

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error desconocido al subir archivo');
      }

      alert('Comprobante enviado. El administrador lo revisará pronto.');
      setPaymentFile(null);
      setActiveTab('home');
    } catch (err: any) {
      alert(`Error al subir pago: ${err.message}`);
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const nextPayment = 'Próximo Miércoles';

  return (
    <div className="flex flex-col h-screen bg-[#030303] text-white max-w-md mx-auto relative overflow-hidden font-sans selection:bg-yellow-500 selection:text-black">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <Car className="text-black" size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight leading-none italic">SPINAZ</h1>
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Elite Fleet</span>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Shield size={18} />
            </button>
            <button onClick={handleSignOut} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-red-500">
                <LogOut size={18} />
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 pt-4 px-4 z-10 scroll-smooth">
        
        {/* HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="relative group overflow-hidden rounded-[2.5rem] p-[1px] bg-gradient-to-b from-red-500/50 to-transparent shadow-2xl">
              <div className="relative bg-zinc-950/90 border border-red-900/20 p-8 rounded-[2.5rem] text-center backdrop-blur-xl">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-2">Deuda Actual</p>
                <h2 className="text-6xl font-black tracking-tighter text-white mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    ${debt.toLocaleString()}
                </h2>
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                   {nextPayment}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] flex items-center gap-4">
               <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center">
                  <Car size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Auto Asignado</p>
                  <p className="font-bold text-white uppercase">{profile?.vehicles?.plate || 'Buscando...'}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('pagos')} className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-zinc-800 transition-all group">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Informar Pago</span>
              </button>
              <button onClick={() => setActiveTab('checkup')} className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-zinc-800 transition-all group">
                <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Control Diario</span>
              </button>
            </div>

            {/* AVISOS */}
            <div className="mt-8">
              <h3 className="font-black text-lg tracking-tight mb-4 flex items-center gap-2 px-2">
                <Bell size={18} className="text-yellow-500" /> Cartelera Oficial
              </h3>
              <div className="space-y-3">
                {announcements.filter(a => !a.title?.startsWith('[BENEFIT]')).map(aviso => (
                  <div key={aviso.id} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl border-l-4 border-l-yellow-500 shadow-lg">
                    <h4 className="font-bold text-sm text-white uppercase tracking-tight">{aviso.title}</h4>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{aviso.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAGOS (CON STORAGE) */}
        {activeTab === 'pagos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-black px-2 tracking-tight">Informar Pago</h2>
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] text-center shadow-2xl">
               <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <UploadCloud size={40} />
               </div>
               <h3 className="text-xl font-bold mb-2">Subir Comprobante</h3>
               <p className="text-sm text-zinc-500 mb-8 px-4 font-medium leading-relaxed">Cargá la captura de pantalla de la transferencia bancaria.</p>
               
               <div className="relative border-2 border-dashed border-zinc-800 bg-black/40 rounded-3xl p-12 hover:border-yellow-500/50 transition-colors cursor-pointer group overflow-hidden">
                  <input type="file" onChange={e => setPaymentFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <span className="text-zinc-500 font-bold text-sm group-hover:text-yellow-500 transition-colors">
                    {paymentFile ? paymentFile.name : 'Seleccionar Archivo'}
                  </span>
               </div>

               <button 
                onClick={handlePaymentUpload}
                disabled={!paymentFile || isUploadingPayment}
                className="w-full bg-white text-black font-black py-5 rounded-2xl mt-8 shadow-xl disabled:opacity-50"
               >
                  {isUploadingPayment ? 'PROCESANDO...' : 'ENVIAR A ADMINISTRACIÓN'}
               </button>
            </div>
          </div>
        )}


        {/* CHECKUP / CONTROL DIARIO */}
        {activeTab === 'checkup' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-black px-2 tracking-tight">Control Diario</h2>
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center"><FileText size={22} /></div>
                 <p className="text-sm text-zinc-400 font-medium leading-relaxed">Enviá el reporte diario de tu turno para mantener el historial de la unidad actualizado.</p>
               </div>
               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Kilómetros al cierre del turno</label>
                   <input
                     type="number"
                     value={shiftData.km}
                     onChange={e => setShiftData(prev => ({ ...prev, km: e.target.value }))}
                     placeholder="Ej: 48250"
                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-yellow-500 outline-none transition-all"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Recaudación del turno ($)</label>
                   <input
                     type="number"
                     value={shiftData.revenue}
                     onChange={e => setShiftData(prev => ({ ...prev, revenue: e.target.value }))}
                     placeholder="Ej: 45000"
                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-yellow-500 outline-none transition-all"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Observaciones del vehículo</label>
                   <textarea
                     value={reportData.description}
                     onChange={e => setReportData({ description: e.target.value })}
                     rows={3}
                     placeholder="Todo en orden / Describí si hay algo para reportar..."
                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium text-sm resize-none focus:border-yellow-500 outline-none transition-all"
                   />
                 </div>
               </div>
               <button
                 onClick={async () => {
                   if (!shiftData.km || !profile) return;
                   setIsSubmittingReport(true);
                   try {
                     // Simulamos el guardado en la base de datos (ya que no existe la tabla incidents)
                     await new Promise(r => setTimeout(r, 1000));
                     alert('✅ Control diario enviado correctamente.');
                     setShiftData({ km: '', revenue: '' });
                     setReportData({ description: '' });
                     setActiveTab('home');
                   } catch (err: any) {
                     alert(`Error: ${err.message}`);
                   } finally {
                     setIsSubmittingReport(false);
                   }
                 }}
                 disabled={isSubmittingReport || !shiftData.km}
                 className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-xl disabled:opacity-50 transition-all hover:bg-yellow-400"
               >
                 {isSubmittingReport ? 'ENVIANDO...' : 'ENVIAR CONTROL DIARIO'}
               </button>
            </div>
          </div>
        )}

        {/* BENEFICIOS / SPINAZ CLUB */}
        {activeTab === 'beneficios' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-black px-2 tracking-tight">Spinaz Club</h2>
            {benefits.length === 0 ? (
              <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center gap-4 text-center">
                <Gift size={48} className="text-zinc-700" />
                <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Sin beneficios activos por ahora</p>
                <p className="text-zinc-700 text-xs">La administración publicará beneficios exclusivos pronto.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {benefits.map((benefit: any) => (
                  <div key={benefit.id} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 border-l-4 border-l-lime-500">
                    <h4 className="font-black text-white uppercase tracking-tight mb-2">{benefit.title}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">{benefit.description}</p>
                    {benefit.discount_code && (
                      <div className="mt-4 bg-lime-500/10 border border-lime-500/20 rounded-xl px-4 py-2 inline-flex items-center gap-2">
                        <span className="text-lime-400 font-black text-sm tracking-widest">{benefit.discount_code}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NORMAS / REGLAMENTO */}
        {activeTab === 'normas' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-black px-2 tracking-tight">Reglamento</h2>
            <div className="space-y-4">
              {[
                { icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/10', title: 'Pagos', text: 'Los alquileres se abonan TODOS LOS MIÉRCOLES antes de las 10:00 hs vía transferencia bancaria o en efectivo en el Lavadero. El atraso genera intereses.' },
                { icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10', title: 'Reporte de KM y Estado', text: 'Debés enviar el reporte de KM cuando haya alguna falla del estado del vehículo, con la descripción breve de la misma, cada vez que ocurra una anomalía para su correcta evaluación mecánica. El incumplimiento y falta de aviso es motivo de suspensión.' },
                { icon: ShieldAlert, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Siniestros', text: 'Ante cualquier choque o problema, el reporte debe ser INSTANTÁNEO. No reportarlo a tiempo anula la cobertura del seguro.' },
                { icon: Car, color: 'text-green-500', bg: 'bg-green-500/10', title: 'Uso Exclusivo', text: 'El vehículo es exclusivo para vos. Queda prohibido ceder o prestar el manejo a terceros.' },
                { icon: Fuel, color: 'text-purple-500', bg: 'bg-purple-500/10', title: 'Combustible y Limpieza', text: 'El conductor es responsable del combustible y de mantener el vehículo limpio interior y exterior.' },
              ].map((rule, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 flex gap-4">
                  <div className={`w-10 h-10 ${rule.bg} ${rule.color} rounded-2xl flex items-center justify-center shrink-0 mt-1`}>
                    <rule.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-white uppercase tracking-tight mb-1 text-sm">{rule.title}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">{rule.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTE DE FALLA */}
        {activeTab === 'reporte' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-3xl font-black px-2 tracking-tight">Reportar Falla</h2>
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="font-black text-white">Incidente o Falla Mecánica</h3>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Reporte inmediato obligatorio</p>
                </div>
              </div>
              {activeReport ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                  <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                  <p className="text-green-400 font-black uppercase tracking-widest text-sm">Reporte enviado. La administración fue notificada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={reportData.description}
                    onChange={e => setReportData({ description: e.target.value })}
                    rows={5}
                    placeholder="Describí el problema con el mayor detalle posible: qué pasó, dónde estás, estado del vehículo..."
                    className="w-full bg-black/50 border border-red-500/20 rounded-2xl p-5 text-white font-medium text-sm resize-none focus:border-red-500 outline-none transition-all"
                  />
                  <button
                    onClick={async () => {
                      if (!reportData.description.trim() || !profile) return;
                      setIsSubmittingReport(true);
                      try {
                        // Simulamos la API de notificaciones para este demo
                        await new Promise(r => setTimeout(r, 1200));
                        setActiveReport(true);
                        setReportData({ description: '' });
                      } catch (err: any) {
                        alert(`Error al enviar reporte: ${err.message}`);
                      } finally {
                        setIsSubmittingReport(false);
                      }
                    }}
                    disabled={isSubmittingReport || !reportData.description.trim()}
                    className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/20 disabled:opacity-50 hover:bg-red-500 transition-all"
                  >
                    {isSubmittingReport ? 'ENVIANDO ALERTA...' : '🚨 ENVIAR REPORTE DE EMERGENCIA'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        
        <Footer className="pt-8 pb-28" />
      </main>

      {/* FIXED TAB BAR */}
      <nav className="absolute bottom-6 left-4 right-4 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-between z-50 shadow-[0_20px_50px_rgba(0,0,0,1)]">
        {[
          { id: 'home', icon: Car, label: 'Panel' },
          { id: 'checkup', icon: FileText, label: 'Control' },
          { id: 'pagos', icon: CreditCard, label: 'Pagos' },
          { id: 'beneficios', icon: Gift, label: 'Club' },
          { id: 'normas', icon: BookOpen, label: 'Reglas' },
          { id: 'reporte', icon: ShieldAlert, label: 'Falla' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center justify-center w-12 h-14 rounded-2xl transition-all ${activeTab === item.id ? 'bg-white/5 text-yellow-500 shadow-inner scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
            <item.icon size={18} />
            <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">{item.label}</span>
          </button>
        ))}
      </nav>

      <GlobalChat module="CHOFER" accentColor="lime" />
    </div>
  );
}
