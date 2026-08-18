'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, ShieldAlert, Wrench, Droplets, Car } from 'lucide-react';
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
};

const ADMIN_TABS = [
  { id: 'TALLER', icon: Wrench, color: 'text-yellow-500', activeBg: 'bg-yellow-500/20 border-yellow-500/50' },
  { id: 'LUBRICENTRO', icon: Droplets, color: 'text-blue-400', activeBg: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'LAVADERO', icon: Droplets, color: 'text-cyan-400', activeBg: 'bg-cyan-500/20 border-cyan-500/50' },
  { id: 'CHOFERES', icon: Car, color: 'text-lime-400', activeBg: 'bg-lime-500/20 border-lime-500/50' },
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
  
  // Refs to avoid stale closures in the realtime callback
  const activeChannelRef = useRef(activeChannel);
  const openRef = useRef(open);
  
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);
  useEffect(() => { openRef.current = open; }, [open]);

  const c = COLOR_MAP[accentColor] || COLOR_MAP.yellow;

  // Fetch messages whenever channel changes
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel', activeChannel)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data && !error) {
      setMessages(data);
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Separate effect for realtime subscription — only created once per module
  useEffect(() => {
    const channel = supabase
      .channel(`chat_realtime_${module}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        const newMsg = payload.new as ChatMessage;
        
        // Only add if it belongs to the active channel (using ref to avoid stale closure)
        if (newMsg.channel === activeChannelRef.current) {
          setMessages(prev => [...prev, newMsg]);
        }
        
        // Notify if chat is closed
        if (!openRef.current) {
          if (module === 'ADMIN' || newMsg.channel === resolveChannel(module)) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [module]); // Only re-subscribe when module changes (never in practice)

  // Auto-scroll and clear unread when opening
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, open]);

  // Re-fetch when switching channels (admin tabs)
  useEffect(() => {
    if (open) fetchMessages();
  }, [activeChannel, open, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    
    const { error } = await supabase.from('chat_messages').insert([{
      channel: activeChannel,
      sender: module,
      message: newMessage.trim()
    }]);

    if (!error) {
      setNewMessage('');
    } else {
      console.error(error);
    }
    setSending(false);
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
        title="Abrir Chat de Comunicación"
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
          <div className={`bg-zinc-900/95 backdrop-blur-2xl border ${c.border} rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[550px] max-h-[75vh]`}>
            
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/40">
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                <MessageCircle size={18} className={c.text} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">{module === 'ADMIN' ? 'Centro de Comando' : 'Chat con Admin'}</h3>
                <p className="text-zinc-500 text-[10px] font-bold">{module === 'ADMIN' ? 'Mensajes Privados' : 'Canal Privado y Seguro'}</p>
              </div>
            </div>

            {/* Admin Tabs */}
            {module === 'ADMIN' && (
              <div className="flex bg-black/60 p-2 gap-1 overflow-x-auto no-scrollbar border-b border-white/5">
                {ADMIN_TABS.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveChannel(tab.id)}
                    className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border border-transparent ${activeChannel === tab.id ? tab.activeBg : 'hover:bg-white/5 opacity-50 hover:opacity-100'}`}
                  >
                    <tab.icon size={14} className={tab.color} />
                    <span className="text-[8px] font-black tracking-widest uppercase text-white">{tab.id}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-center pb-4">
                <ShieldAlert size={16} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                  {module === 'ADMIN' ? `Canal Privado con ${activeChannel}` : 'Tus mensajes solo los ve el Administrador'}
                </p>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender === module;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 px-1 ${getSenderStyle(msg.sender)}`}>
                      {isMe ? 'Tú' : msg.sender}
                    </span>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${isMe ? 'bg-white/10 border border-white/10 text-white rounded-tr-sm' : 'bg-black/50 border border-white/5 text-zinc-300 rounded-tl-sm'}`}>
                      <p className="text-sm font-medium leading-relaxed break-words">{msg.message}</p>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-bold mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-black/40">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className={`w-12 h-12 rounded-2xl ${c.btn} flex items-center justify-center text-black disabled:opacity-50 transition-all`}
                >
                  <Send size={18} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
