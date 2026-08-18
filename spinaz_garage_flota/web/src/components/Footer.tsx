'use client';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`pt-12 pb-4 text-center border-t border-white/5 space-y-2 opacity-40 hover:opacity-100 transition-opacity ${className}`}>
      <p className="text-[10px] text-zinc-500 font-bold">
        © 2026 Omar Adamo — Startup Aura. Todos los derechos reservados.
      </p>
      <div className="flex justify-center gap-4 text-[9px] text-zinc-500 font-medium">
        <a href="mailto:adamoomar110@gmail.com" className="hover:text-yellow-500 transition-colors">Email</a>
        <span>•</span>
        <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">WhatsApp</a>
        <span>•</span>
        <span className="text-zinc-600 font-black">v1.5</span>
      </div>
    </footer>
  );
}
