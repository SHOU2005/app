'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, UserPlus, Briefcase, TrendingUp, ListChecks, Award } from 'lucide-react'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const T3   = 'rgba(0,0,0,0.3)'
const BLUE = '#2563EB'
const FONT = '"DM Sans", system-ui, sans-serif'

interface DashData {
  status: string
  commissionThisMonth: number
  pendingPayout: number
  totalEarnings: number
  pendingTasks: number
  employersOnboarded: number
  workersOnboarded: number
}

export default function CaptainDashboard() {
  const router  = useRouter()
  const [user,  setUser]    = useState<{ name: string } | null>(null)
  const [dash,  setDash]    = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/captain/profile').then(r => { if (r.status === 401) { router.replace('/captain/login'); return null } return r.json() }),
      fetch('/api/captain/dashboard').then(r => r.json()),
    ]).then(([u, d]) => {
      if (!u) return
      setUser(u.user)
      setDash(d)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: T2 }}>Loading…</div>
    </div>
  )

  const isPending = dash?.status === 'PENDING'

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Top Bar */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <p style={{ fontSize: 11, color: T3, margin: 0 }}>Welcome back</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: T1, margin: 0 }}>{user?.name || 'Captain'}</p>
            </div>
          </div>
          <Bell style={{ width: 22, height: 22, color: T2 }} />
        </div>
      </header>

      <div style={{ padding: '0 20px' }}>

        {/* Pending banner */}
        {isPending && (
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: '#92400E', margin: 0, fontSize: 14 }}>Account Under Review</p>
            <p style={{ color: '#B45309', margin: '4px 0 0', fontSize: 13 }}>The Ops team will activate your account shortly.</p>
          </div>
        )}

        {/* Commission Hero */}
        <div style={{ background: BLUE, borderRadius: 20, padding: '24px 20px', marginBottom: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 4px' }}>Commission this month</p>
          <p style={{ color: '#FFFFFF', fontSize: 36, fontWeight: 800, margin: 0 }}>₹{dash?.commissionThisMonth ?? 0}</p>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Pending payout</p>
              <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>₹{dash?.pendingPayout ?? 0}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>All-time earned</p>
              <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>₹{dash?.totalEarnings ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Employers', value: dash?.employersOnboarded ?? 0, Icon: Briefcase, color: '#7C3AED' },
            { label: 'Workers',   value: dash?.workersOnboarded   ?? 0, Icon: UserPlus,  color: '#059669' },
            { label: 'Tasks Due', value: dash?.pendingTasks       ?? 0, Icon: ListChecks, color: '#DC2626' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ background: '#F5F5F5', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <Icon style={{ width: 22, height: 22, color, margin: '0 auto 6px' }} />
              <p style={{ fontSize: 22, fontWeight: 800, color: T1, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: T2, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <p style={{ fontSize: 13, fontWeight: 700, color: T2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Register Employer', Icon: Briefcase, href: '/captain/onboard-employer', color: BLUE },
            { label: 'Register Worker',   Icon: UserPlus,  href: '/captain/onboard-worker',   color: '#059669' },
            { label: 'View Commissions',  Icon: TrendingUp, href: '/captain/commissions',      color: '#7C3AED' },
            { label: 'Leaderboard',       Icon: Award,     href: '/captain/leaderboard',       color: '#D97706' },
          ].map(({ label, Icon, href, color }) => (
            <a key={label} href={href} style={{ background: '#F5F5F5', borderRadius: 16, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 20, height: 20, color }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T1, margin: 0 }}>{label}</p>
            </a>
          ))}
        </div>

        {/* Attendance shortcut */}
        <a href="/captain/attendance" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 16, padding: '16px 18px', textDecoration: 'none' }}>
          <div>
            <p style={{ fontWeight: 700, color: BLUE, margin: 0, fontSize: 15 }}>Mark Attendance</p>
            <p style={{ color: T2, margin: '2px 0 0', fontSize: 13 }}>Check in / Check out for today</p>
          </div>
          <span style={{ fontSize: 22 }}>📍</span>
        </a>
      </div>

      <CaptainBottomNav />
    </div>
  )
}
