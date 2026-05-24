'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PUBLIC_ROUTES = ['/login', '/postular', '/terminos'];

function isPublicPath(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = isPublicPath(pathname);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isPublic) {
        router.push('/login');
        // No seteamos loading=false aquí porque vamos a redirigir
      } else {
        setLoading(false);
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentPath = window.location.pathname;
        const currentIsPublic = isPublicPath(currentPath);
        
        if (!session && !currentIsPublic) {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading && !isPublicPath(pathname)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-black">
        <div className="w-12 h-12 border-4 border-green-400/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-600 font-medium tracking-wide animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}
