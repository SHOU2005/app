import type { Metadata, Viewport } from 'next'
import EmployerPWA from './EmployerPWA'

export const metadata: Metadata = {
  title: 'Switch Employer',
  description: 'Post jobs and hire verified part-time workers.',
  manifest: '/employer-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Switch Employer',
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

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: '"DM Sans", -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 16,
      lineHeight: '24px',
      letterSpacing: 'normal',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
      background: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
    } as React.CSSProperties}>
      {children}
      <EmployerPWA />
    </div>
  )
}
