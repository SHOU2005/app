'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'
import { Users, Briefcase, BookOpen, AlertTriangle, TrendingUp, Clock, UserCheck } from 'lucide-react'

const BG   = '#080808'
const S1   = '#111111'
const S2   = '#181818'
const BD   = 'rgba(255,255,255,0.07)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const ACC  = '#6366F1'
const FONT = '"DM Sans", system-ui, sans-serif'

interface DashData {
  activeShifts: number; todayBookings: number; pendingKyc: number
  openComplaints: number; captainsInField: number; pendingCommissions: number
  todayRevenue: number; pendingCaptains: number
}

export default function OpsDashboard() {
  const router = useRouter()
  const [dash,    setDash]    = useState<DashData | null>(null)
  const [user,    setUser]    = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/ops/dashboard').then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() }),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([d, u]) => {
      if (!d) return
      setDash(d)
      setUser(u?.user)
    }).finally(() => setLoading(false))
  }, [router])

  const STATS = dash ? [
    { label: 'Active Shifts',      value: dash.activeShifts,       Icon: Briefcase,   color: '#818CF8', href: '/ops/bookings'    },
    { label: 'Today Bookings',     value: dash.todayBookings,       Icon: BookOpen,    color: '#34D399', href: '/ops/bookings'    },
    { label: 'Pending KYC',        value: dash.pendingKyc,          Icon: UserCheck,   color: '#FBBF24', href: '/ops/workers?kycStatus=PENDING' },
    { label: 'Open Complaints',    value: dash.openComplaints,      Icon: AlertTriangle,color: '#F87171', href: '/ops/complaints'  },
    { label: 'Captains in Field',  value: dash.captainsInField,     Icon: Users,       color: '#60A5FA', href: '/ops/captains'    },
    { label: 'Pending Commissions',value: dash.pendingCommissions,  Icon: TrendingUp,  color: '#A78BFA', href: '/ops/commissions' },
  ] : []

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />

      <div style={{ padding: '20px 20px 0', marginLeft: 0 }} className="ops-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div>
            <p style={{ color: T2, fontSize: 13, margin: 0 }}>Operations Dashboard</p>
            <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: '2px 0 0' }}>Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {user?.name?.split(' ')[0] || 'Ops'}</p>
          </div>
          <div style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '8px 14px' }}>
            <p style={{ color: '#34D399', fontWeight: 800, fontSize: 16, margin: 0 }}>₹{dash?.todayRevenue?.toLocaleString('en-IN') ?? '—'}</p>
            <p style={{ color: T2, fontSize: 11, margin: 0 }}>Today Revenue</p>
          </div>
        </div>

        {/* Alert: Pending captain approvals */}
        {dash && dash.pendingCaptains > 0 && (
          <a href="/ops/captains" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1C1714', border: '1px solid #92400E', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textDecoration: 'none' }}>
            <Clock style={{ width: 20, height: 20, color: '#FBBF24', flexShrink: 0 }} />
            <div>
              <p style={{ color: '#FDE68A', fontWeight: 700, margin: 0, fontSize: 14 }}>{dash.pendingCaptains} captain{dash.pendingCaptains > 1 ? 's' : ''} awaiting activation</p>
              <p style={{ color: T2, margin: 0, fontSize: 12 }}>Tap to review and activate</p>
            </div>
          </a>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {STATS.map(({ label, value, Icon, color, href }) => (
              <a key={label} href={href} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 16, padding: '16px', textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 18, height: 18, color }} />
                  </div>
                </div>
                <p style={{ color: T1, fontSize: 28, fontWeight: 800, margin: '0 0 4px' }}>{value}</p>
                <p style={{ color: T2, fontSize: 12, margin: 0 }}>{label}</p>
              </a>
            ))}
          </div>
        )}

        {/* Quick links */}
        <p style={{ color: T2, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Approve KYC',     href: '/ops/workers?kycStatus=PENDING', color: '#FBBF24' },
            { label: 'Pay Commissions', href: '/ops/payouts',                   color: '#34D399' },
            { label: 'Broadcast',       href: '/ops/broadcast',                 color: ACC       },
            { label: 'Analytics',       href: '/ops/analytics',                 color: '#F87171' },
          ].map(({ label, href, color }) => (
            <a key={label} href={href} style={{ background: S2, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color: T1, fontWeight: 600, fontSize: 14 }}>{label}</span>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }
      `}</style>
    </div>
  )
}
