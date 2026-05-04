'use client'
import { useEffect, useState } from 'react'

export default function CaptainPWA() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow]     = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/captain-sw.js', { scope: '/captain/' })
        .catch(() => {})
    }

    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      // Show install banner after 3 seconds on first visit
      const dismissed = sessionStorage.getItem('captain_pwa_dismissed')
      if (!dismissed) setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler as any)
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false) })

    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
  }

  function dismiss() {
    setShow(false)
    sessionStorage.setItem('captain_pwa_dismissed', '1')
  }

  if (!show || installed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
      background: '#FFFFFF',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: '"DM Sans", system-ui, sans-serif',
      animation: 'slideUp 0.35s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: '#111111',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 26,
      }}>🧭</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: 15, color: '#111111', margin: 0 }}>Install Captain App</p>
        <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: '2px 0 0' }}>
          Add to home screen for faster access
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={dismiss} style={{
          padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
          background: 'transparent', fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.45)',
          cursor: 'pointer',
        }}>Later</button>
        <button onClick={install} style={{
          padding: '8px 16px', borderRadius: 10, border: 'none',
          background: '#111111', fontSize: 13, fontWeight: 700, color: '#FFFFFF',
          cursor: 'pointer',
        }}>Install</button>
      </div>
    </div>
  )
}
