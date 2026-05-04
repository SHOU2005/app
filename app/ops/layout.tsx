import type { Metadata, Viewport } from 'next'
import OpsPWA from './OpsPWA'

export const metadata: Metadata = {
  title: 'Switch Ops',
  description: 'Switch operations and management portal.',
  manifest: '/ops-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Switch Ops',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
  other: { 'mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
      background: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
      WebkitFontSmoothing: 'antialiased',
    } as React.CSSProperties}>
      {children}
      <OpsPWA />
    </div>
  )
}
