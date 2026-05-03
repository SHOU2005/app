'use client'
import { usePathname } from 'next/navigation'

const BRAND = '#FFFFFF'
const FONT  = '"DM Sans", -apple-system, "system-ui", Roboto, sans-serif'

const TABS = [
  {
    label: 'Home', path: '/employer',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? BRAND : 'none'} stroke={active ? BRAND : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: 'Bookings', path: '/employer/jobs',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Wallet', path: '/employer/wallet',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Profile', path: '/employer/profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export default function EmpBottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff',
      borderTop: '1px solid #E5E7EB',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 24px rgba(79,70,229,0.08)',
    }}>
      {TABS.map(tab => {
        const active = pathname === tab.path || (tab.path !== '/employer' && pathname?.startsWith(tab.path))
        return (
          <button
            key={tab.path}
            onClick={() => window.location.href = tab.path}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4, padding: '11px 0 9px',
              border: 'none', background: 'none', cursor: 'pointer', position: 'relative',
              fontFamily: FONT,
            }}
          >
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 30, height: 3, background: BRAND, borderRadius: '0 0 4px 4px',
              }} />
            )}
            {tab.icon(active)}
            <span style={{
              fontSize: 12, fontWeight: active ? 700 : 500, lineHeight: '16px',
              color: active ? BRAND : '#9CA3AF',
            }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
