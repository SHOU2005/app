import type { Metadata, Viewport } from 'next'
import CaptainPWA from './CaptainPWA'

export const metadata: Metadata = {
  title: 'Switch Captain',
  description: 'Field executive portal — onboard workers & employers, earn commissions.',
  manifest: '/captain-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Switch Captain',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function CaptainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="captain-theme">
      {children}
      <CaptainPWA />
    </div>
  )
}
