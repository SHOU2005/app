'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'
import TopBar from '@/components/shared/TopBar'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#111111'
const FONT = '"DM Sans", system-ui, sans-serif'

interface Employer { id: string; name: string; phone: string; employerProfile: { companyName: string | null; verifiedByOpsAt: string | null; totalShifts: number } | null }
interface Worker   { id: string; name: string; phone: string; workerProfile:   { kycStatus: string; totalShifts: number; city: string | null } | null }

export default function ReferralsPage() {
  const router = useRouter()
  const [tab,       setTab]       = useState<'employers' | 'workers'>('employers')
  const [employers, setEmployers] = useState<Employer[]>([])
  const [workers,   setWorkers]   = useState<Worker[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/captain/referrals').then(r => {
      if (r.status === 401) { router.replace('/captain/login'); return null }
      return r.json()
    }).then(d => {
      if (!d) return
      setEmployers(d.employers || [])
      setWorkers(d.workers || [])
    }).finally(() => setLoading(false))
  }, [router])

  const statusColor = (s: string) =>
    s === 'APPROVED' ? '#111111' : s === 'REJECTED' ? '#111111' : '#111111'

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title="My Referrals" />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 20px' }}>
        {(['employers', 'workers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '14px 0', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: tab === t ? BLUE : T2, borderBottom: tab === t ? `2px solid ${BLUE}` : '2px solid transparent' }}>
            {t === 'employers' ? `Employers (${employers.length})` : `Workers (${workers.length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div>
        ) : tab === 'employers' ? (
          employers.length === 0
            ? <p style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>No employers yet. Register your first employer!</p>
            : employers.map(e => (
              <div key={e.id} style={{ background: '#F5F5F5', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: T1, margin: 0, fontSize: 15 }}>{e.name}</p>
                    <p style={{ color: T2, margin: '2px 0', fontSize: 13 }}>{e.employerProfile?.companyName || '—'} · {e.phone}</p>
                    <p style={{ color: T2, margin: 0, fontSize: 12 }}>{e.employerProfile?.totalShifts ?? 0} shifts posted</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: e.employerProfile?.verifiedByOpsAt ? '#F5F5F5' : '#F5F5F5', color: e.employerProfile?.verifiedByOpsAt ? '#111111' : '#111111' }}>
                    {e.employerProfile?.verifiedByOpsAt ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
        ) : (
          workers.length === 0
            ? <p style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>No workers yet. Register your first worker!</p>
            : workers.map(w => (
              <div key={w.id} style={{ background: '#F5F5F5', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: T1, margin: 0, fontSize: 15 }}>{w.name}</p>
                    <p style={{ color: T2, margin: '2px 0', fontSize: 13 }}>{w.phone} · {w.workerProfile?.city || '—'}</p>
                    <p style={{ color: T2, margin: 0, fontSize: 12 }}>{w.workerProfile?.totalShifts ?? 0} shifts done</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#F7F7F7', color: statusColor(w.workerProfile?.kycStatus || '') }}>
                    {w.workerProfile?.kycStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>

      <CaptainBottomNav />
    </div>
  )
}
