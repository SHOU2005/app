'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'
import { Users, Briefcase, BookOpen, AlertTriangle, TrendingUp, Clock, UserCheck } from 'lucide-react'

const BG   = '#000000'
const S1   = '#0F0F0F'
const S2   = '#141414'
const BD   = 'rgba(255,255,255,0.08)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.4)'
const FONT = '"DM Sans", system-ui, sans-serif'

interface DashData {
  activeShifts: number; todayBookings: number; pendingKyc: number
  openComplaints: number; captainsInField: number; pendingCommissions: number
  pendingCaptains: number
  todayRevenue: number; yesterdayRevenue: number; weekRevenue: number; monthRevenue: number
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
    { label: 'Active Shifts',       value: dash.activeShifts,      Icon: Briefcase,    color: '#FFFFFF', href: '/ops/bookings'    },
    { label: 'Today Bookings',      value: dash.todayBookings,      Icon: BookOpen,     color: '#FFFFFF', href: '/ops/bookings'    },
    { label: 'Pending KYC',         value: dash.pendingKyc,         Icon: UserCheck,    color: '#FBBF24', href: '/ops/workers?kycStatus=PENDING' },
    { label: 'Open Complaints',     value: dash.openComplaints,     Icon: AlertTriangle,color: '#F87171', href: '/ops/complaints'  },
    { label: 'Captains in Field',   value: dash.captainsInField,    Icon: Users,        color: '#FFFFFF', href: '/ops/captains'    },
    { label: 'Pending Commissions', value: dash.pendingCommissions, Icon: TrendingUp,   color: '#FFFFFF', href: '/ops/commissions' },
  ] : []

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />

      <div style={{ padding: '20px 20px 0', marginLeft: 0 }} className="ops-content">
        {/* Header */}
        <div style={{ marginBottom: 24, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <p style={{ color: T2, fontSize: 13, margin: 0 }}>Operations</p>
          <p style={{ color: T1, fontWeight: 800, fontSize: 24, margin: '2px 0 0', letterSpacing: -0.5 }}>
            {new Date().getHours() < 12 ? 'Good morning' : 'Good evening'}, {user?.name?.split(' ')[0] || 'Ops'}
          </p>
        </div>

        {/* Revenue strip */}
        {dash && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, background: BD, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            {[
              { label: 'Today',     value: dash.todayRevenue     },
              { label: 'Yesterday', value: dash.yesterdayRevenue },
              { label: 'This Week', value: dash.weekRevenue      },
              { label: 'Month',     value: dash.monthRevenue     },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: S1, padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ color: T1, fontWeight: 800, fontSize: 15, margin: 0 }}>{fmt(value)}</p>
                <p style={{ color: T2, fontSize: 11, margin: '3px 0 0' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pending captains alert */}
        {dash && dash.pendingCaptains > 0 && (
          <a href="/ops/captains" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#141008', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 18, textDecoration: 'none' }}>
            <Clock style={{ width: 18, height: 18, color: '#FBBF24', flexShrink: 0 }} />
            <div>
              <p style={{ color: '#FDE68A', fontWeight: 700, margin: 0, fontSize: 14 }}>{dash.pendingCaptains} captain{dash.pendingCaptains > 1 ? 's' : ''} awaiting activation</p>
              <p style={{ color: T2, margin: 0, fontSize: 12 }}>Tap to review</p>
            </div>
          </a>
        )}

        {/* Stats grid */}
        {loading ? (
          <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {STATS.map(({ label, value, Icon, color, href }) => (
              <a key={label} href={href} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 16, padding: '16px', textDecoration: 'none', display: 'block' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                </div>
                <p style={{ color: T1, fontSize: 30, fontWeight: 800, margin: '0 0 3px', letterSpacing: -1 }}>{value}</p>
                <p style={{ color: T2, fontSize: 12, margin: 0 }}>{label}</p>
              </a>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <p style={{ color: T2, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Approve KYC',      href: '/ops/workers?kycStatus=PENDING' },
            { label: 'Pay Commissions',  href: '/ops/payouts'                   },
            { label: 'Broadcast',        href: '/ops/broadcast'                 },
            { label: 'Analytics',        href: '/ops/analytics'                 },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ background: S2, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px', textDecoration: 'none', display: 'block' }}>
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
