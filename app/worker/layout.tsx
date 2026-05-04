import type { Metadata, Viewport } from 'next'
import { LanguageProvider } from './LanguageContext'
import WorkerPWA from './WorkerPWA'

export const metadata: Metadata = {
  title: 'Switch – Part-time Jobs',
  description: 'Find verified part-time shifts near you. Earn daily.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Switch',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
  other: { 'mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="worker-theme">
        {children}
        <WorkerPWA />
      </div>
    </LanguageProvider>
  )
}
