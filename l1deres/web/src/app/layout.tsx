import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'

import SplashScreen from '@/components/SplashScreen'
import { SettingsProvider } from '@/context/SettingsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Lavadero VIP | Panel de Control',
  description: 'Sistema inteligente para gestión de lavaderos de autos de lujo.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#0a0a0a] text-black antialiased`}>
        <SettingsProvider>
          <SplashScreen />
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                {children}
              </main>
              <footer className="w-full bg-[#0a0a0a] text-white/50 text-center py-4 text-sm mt-auto border-t border-white/10">
                &copy; {new Date().getFullYear()} Aura. Todos los derechos reservados.
              </footer>
            </div>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
