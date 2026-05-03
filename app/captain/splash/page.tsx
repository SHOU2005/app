'use client'
import { useEffect } from 'react'

const FONT = '"DM Sans", -apple-system, "system-ui", Roboto, sans-serif'
const BLUE = '#2563EB'

export default function CaptainSplash() {
  useEffect(() => {
    sessionStorage.setItem('captain_splashed', '1')
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/captain/profile', { credentials: 'include' })
        window.location.replace(res.ok ? '/captain' : '/captain/login')
      } catch {
        window.location.replace('/captain/login')
      }
    }, 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: '#FFFFFF',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT,
      overflow: 'hidden', position: 'relative',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>

      {/* Subtle dot pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#111111"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Blue accent glow at top */}
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${BLUE}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Logo + text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeUp 0.6s ease forwards', zIndex: 1 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: '#F8F9FF', border: '1.5px solid rgba(37,99,235,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 48px rgba(37,99,235,0.12)', marginBottom: 28,
        }}>
          <div style={{
            width: 62, height: 62, borderRadius: 18,
            background: BLUE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 32 }}>🧭</span>
          </div>
        </div>

        <div style={{ fontSize: 48, fontWeight: 900, color: '#111111', letterSpacing: -2, lineHeight: 1 }}>Switch</div>
        <div style={{
          marginTop: 10, marginBottom: 32,
          background: `${BLUE}12`,
          borderRadius: 24, padding: '6px 18px',
          border: `1px solid ${BLUE}25`,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, letterSpacing: 2, textTransform: 'uppercase' as const }}>
            Captain
          </span>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div style={{ fontSize: 22, color: '#111111', fontWeight: 700, lineHeight: '30px', marginBottom: 10 }}>
            Onboard. Earn.<br/>Grow with Switch.
          </div>
          <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.4)', lineHeight: '22px' }}>
            Refer employers · Track commissions · Build your network
          </div>
        </div>
      </div>

      {/* Bottom progress */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(48px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        animation: 'fadeIn 0.5s ease 0.4s both',
        zIndex: 1,
      }}>
        <div style={{ width: 120, height: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: BLUE,
            animation: 'loadBar 2.2s ease-in-out forwards',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['₹100 per booking', 'GPS check-in', 'Live leaderboard'].map(tag => (
            <div key={tag} style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.45)',
              background: 'rgba(0,0,0,0.04)', borderRadius: 20,
              padding: '5px 10px', border: '1px solid rgba(0,0,0,0.06)',
              whiteSpace: 'nowrap' as const,
            }}>{tag}</div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes loadBar {
          0%   { width: 0% }
          20%  { width: 18% }
          55%  { width: 62% }
          85%  { width: 88% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  )
}
