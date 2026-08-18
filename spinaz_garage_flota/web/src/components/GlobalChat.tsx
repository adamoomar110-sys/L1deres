'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, ShieldAlert, Wrench, Droplets, Car, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/types';

interface GlobalChatProps {
  module: string; // 'ADMIN', 'TALLER', 'LUBRICENTRO', 'LAVADERO', 'CHOFER'
  accentColor?: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string; btn: string }> = {
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', glow: 'shadow-yellow-500/30', btn: 'bg-yellow-500 hover:bg-yellow-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/30', btn: 'bg-blue-500 hover:bg-blue-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/30', btn: 'bg-cyan-500 hover:bg-cyan-400' },
  lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400', glow: 'shadow-lime-500/30', btn: 'bg-lime-500 hover:bg-lime-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/30', btn: 'bg-purple-500 hover:bg-purple-400' },
};

const SENDER_STYLES: Record<string, string> = {
  ADMIN: 'text-purple-400',
  TALLER: 'text-yellow-500',
  LUBRICENTRO: 'text-blue-400',
  LAVADERO: 'text-cyan-400',
  CHOFER: 'text-lime-400',
  CHOFERES: 'text-lime-400'
};

const ADMIN_TABS = [
  { id: 'TALLER', label: 'Taller', icon: Wrench, color: 'text-yellow-500', activeBg: 'bg-yellow-500/20 border-yellow-500/50' },
  { id: 'LUBRICENTRO', label: 'Lubri', icon: Droplets, color: 'text-blue-400', activeBg: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'LAVADERO', label: 'Lavadero', icon: Droplets, color: 'text-cyan-400', activeBg: 'bg-cyan-500/20 border-cyan-500/50' },
  { id: 'CHOFERES', label: 'Choferes', icon: Car, color: 'text-lime-400', activeBg: 'bg-lime-500/20 border-lime-500/50' },
];

export default function GlobalChat({ module, accentColor = 'yellow' }: GlobalChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const resolveChannel = (mod: string) => mod === 'CHOFER' ? 'CHOFERES' : mod;
  const [activeChannel, setActiveChannel] = useState(module === 'ADMIN' ? 'TALLER' : resolveChannel(module));
  
  const c = COLOR_MAP[accentColor] || COLOR_MAP.yellow;

  // Fetch messages
  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel', activeChannel)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (data && !error && Array.isArray(data)) {
        setMessages(data);
      }
    } catch (e) {
      if (!silent) console.error("Error cargando mensajes:", e);
    }
  }, [activeChannel]);

  // Initial load on channel change or open
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Live polling: every 2.5s when open, every 10s when closed
  useEffect(() => {
    const intervalMs = open ? 2500 : 10000;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [open, fetchMessages]);

  // Auto-scroll when messages change or chat is opened
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages.length, open]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempId = 'temp-' + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      channel: activeChannel,
      sender: module,
      message: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { error } = await supabase.from('chat_messages').insert([{
        channel: activeChannel,
        sender: module,
        message: text
      }]);

      if (error) {
        console.error("Error al enviar mensaje:", error);
      } else {
        fetchMessages(true);
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setSending(false);
    }
  };

  const getSenderStyle = (senderName: string) => SENDER_STYLES[senderName] || 'text-lime-400';

  const buttonPos = module === 'ADMIN' 
    ? 'bottom-6 right-48' 
    : module === 'CHOFER' 
    ? 'bottom-24 right-6' 
    : 'bottom-8 right-8';

  const modalPos = module === 'ADMIN' 
    ? 'bottom-24 right-48' 
    : module === 'CHOFER' 
    ? 'bottom-44 right-6' 
    : 'bottom-28 right-8';

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed ${buttonPos} z-[90] w-14 h-14 ${c.btn} rounded-full flex items-center justify-center shadow-2xl ${c.glow} transition-all hover:scale-110 active:scale-95 border border-black/20`}
        title="Abrir Chat Interno"
      >
        {open ? <X size={24} className="text-black" /> : <MessageCircle size={26} className="text-black" />}
        {!open && unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#030303] animate-bounce">
            {unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div className={`fixed ${modalPos} z-[90] w-[360px] max-w-[90vw] animate-in slide-in-from-bottom-4 fade-in duration-300`}>
          <div className={`bg-zinc-950/95 backdrop-blur-2xl border ${c.border} rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[550px] max-h-[75vh]`}>
            
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center border border-white/5`}>
                  <MessageCircle size={18} className={c.text} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    {module === 'ADMIN' ? 'Centro de Comunicación' : 'Chat Directo con Admin'}
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse inline-block" />
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-bold">
                    {module === 'ADMIN' ? `Canal: ${activeChannel}` : 'Canal Privado y Seguro'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Admin Tabs */}
            {module === 'ADMIN' && (
              <div className="flex bg-black/60 p-2 gap-1 overflow-x-auto no-scrollbar border-b border-white/5">
                {ADMIN_TABS.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveChannel(tab.id)}
                    className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${activeChannel === tab.id ? tab.activeBg : 'border-transparent hover:bg-white/5 opacity-50 hover:opacity-100'}`}
                  >
                    <tab.icon size={13} className={tab.color} />
                    <span className="text-[8px] font-black tracking-widest uppercase text-white">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/20">
              <div className="text-center pb-2">
                <ShieldAlert size={14} className="text-zinc-600 mx-auto mb-1" />
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                  {module === 'ADMIN' ? `Canal privado con ${activeChannel}` : 'Tus mensajes van directo a Administración'}
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="py-16 text-center text-zinc-600">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-30 text-yellow-500" />
                  <p className="text-xs font-bold italic">No hay mensajes aún.</p>
                  <p className="text-[10px] text-zinc-700">Sé el primero en enviar un mensaje.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === module;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-1 px-1 ${getSenderStyle(msg.sender)}`}>
                        {isMe ? 'Tú' : msg.sender}
                      </span>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${isMe ? 'bg-yellow-500/15 border border-yellow-500/30 text-white rounded-tr-sm' : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-sm'}`}>
                        <p className="text-xs font-medium leading-relaxed break-words">{msg.message}</p>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-bold mt-1 px-1">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3.5 border-t border-white/5 bg-black/60">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-white font-medium text-xs outline-none focus:border-yellow-500/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className={`w-10 h-10 rounded-2xl ${c.btn} flex items-center justify-center text-black disabled:opacity-40 transition-all shrink-0`}
                >
                  <Send size={16} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
