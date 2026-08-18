'use client';
import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QuickMessageProps {
  senderLabel: string; // Ej: "TALLER", "LUBRICENTRO", "CHOFER"
  accentColor?: string; // Ej: "yellow", "blue", "lime"
}

export default function QuickMessage({ senderLabel, accentColor = 'yellow' }: QuickMessageProps) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; btnBg: string }> = {
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-500',
      glow: 'shadow-yellow-500/30',
      btnBg: 'bg-yellow-500 hover:bg-yellow-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/30',
      btnBg: 'bg-blue-500 hover:bg-blue-400',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/30',
      btnBg: 'bg-cyan-500 hover:bg-cyan-400',
    },
    lime: {
      bg: 'bg-lime-500/10',
      border: 'border-lime-500/30',
      text: 'text-lime-400',
      glow: 'shadow-lime-500/30',
      btnBg: 'bg-lime-500 hover:bg-lime-400',
    },
  };

  const c = colorMap[accentColor] || colorMap.yellow;

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await supabase.from('announcements').insert([{
        title: `📩 MENSAJE DE ${senderLabel}`,
        content: msg.trim(),
        is_active: true,
      }]);
      setSent(true);
      setMsg('');
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2000);
    } catch (e) {
      alert('Error al enviar');
    }
    setSending(false);
  };

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-8 right-8 z-[90] w-16 h-16 ${c.btnBg} rounded-full flex items-center justify-center shadow-2xl ${c.glow} transition-all hover:scale-110 active:scale-95`}
      >
        {open ? <X size={24} className="text-black" /> : <MessageCircle size={28} className="text-black" />}
      </button>

      {/* MODAL DE MENSAJE */}
      {open && (
        <div className="fixed bottom-28 right-8 z-[90] w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`bg-zinc-900/95 backdrop-blur-2xl border ${c.border} rounded-[2rem] p-6 shadow-2xl space-y-4`}>
            
            {sent ? (
              <div className="text-center py-4">
                <div className={`w-14 h-14 ${c.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Send size={24} className={c.text} />
                </div>
                <p className="text-white font-black text-sm">¡Mensaje Enviado!</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">El admin lo recibirá al instante</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                    <MessageCircle size={18} className={c.text} />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">Mensaje al Admin</p>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Máximo 20 caracteres</p>
                  </div>
                </div>

                <input
                  type="text"
                  maxLength={20}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Escribí tu mensaje..."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-white font-bold text-sm outline-none focus:border-yellow-500 placeholder:text-zinc-600"
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black ${msg.length >= 20 ? 'text-red-500' : 'text-zinc-600'}`}>
                    {msg.length}/20
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={sending || !msg.trim()}
                    className={`px-6 py-3 ${c.btnBg} text-black font-black rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 transition-all active:scale-95`}
                  >
                    {sending ? '...' : <><Send size={14} /> ENVIAR</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
