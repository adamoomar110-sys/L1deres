import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import { SettingsProvider } from '@/context/SettingsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Spinaz Garage | Aura',
  description: 'Sistema inteligente de gestión de flotas y telemática.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        <SettingsProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}

