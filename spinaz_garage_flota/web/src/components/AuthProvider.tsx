'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { donwebAuth } from '@/lib/donweb-api';

const PUBLIC_ROUTES = ['/', '/login', '/postular', '/terminos', '/taller', '/lubricentro', '/lavadero'];

function isPublicPath(path: string): boolean {
  if (!path || path === '/') return true;
  return PUBLIC_ROUTES.some(route => route !== '/' && (path === route || path.startsWith(route + '/')));
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = isPublicPath(pathname);
    if (isPublic) {
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await donwebAuth.getSession();
        const hasDemoUser = typeof window !== 'undefined' && Boolean(localStorage.getItem('spinaz_demo_user'));
        
        if (!session && !hasDemoUser && !isPublic) {
          router.push('/login');
        } else {
          setLoading(false);
        }
      } catch (e) {
        const hasDemoUser = typeof window !== 'undefined' && Boolean(localStorage.getItem('spinaz_demo_user'));
        if (!hasDemoUser && !isPublic) {
          router.push('/login');
        } else {
          setLoading(false);
        }
      }
    };
    
    checkUser();

    const { data: authListener } = donwebAuth.onAuthStateChange(
      (event, session) => {
        const currentPath = window.location.pathname;
        const currentIsPublic = isPublicPath(currentPath);
        const hasDemoUser = typeof window !== 'undefined' && Boolean(localStorage.getItem('spinaz_demo_user'));
        
        if (!session && !hasDemoUser && !currentIsPublic) {
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 font-medium tracking-wide animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}

