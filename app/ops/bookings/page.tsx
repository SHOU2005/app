'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

const BG='#080808';const S1='#111111';const BD='rgba(255,255,255,0.07)';const T1='#FFFFFF';const T2='rgba(255,255,255,0.45)';const ACC='#6366F1';const FONT='"DM Sans", system-ui, sans-serif'

interface Booking { id: string; status: string; totalAmount: number; platformFee: number; createdAt: string; shift: { title: string; date: string; city: string }; worker: { user: { name: string } }; employer: { name: string } }

const STATUS_COLORS: Record<string, string> = { PENDING: '#FBBF24', CONFIRMED: '#60A5FA', IN_PROGRESS: '#818CF8', COMPLETED: '#34D399', CANCELLED: '#F87171', NO_SHOW: '#9CA3AF' }

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')

  useEffect(() => {
    const q = filter === 'ALL' ? '' : `?status=${filter}`
    fetch(`/api/ops/bookings${q}`).then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() })
      .then(d => { if (d) setBookings(d.bookings || []) }).finally(() => setLoading(false))
  }, [filter, router])

  async function forceComplete(id: string) {
    if (!confirm('Force complete this booking?')) return
    await fetch(`/api/ops/bookings/${id}/force-complete`, { method: 'PATCH' })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'COMPLETED' } : b))
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: '0 0 16px', paddingTop: 'env(safe-area-inset-top,0px)' }}>Bookings</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(f => (
            <button key={f} onClick={() => { setLoading(true); setFilter(f) }} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: filter === f ? ACC : S1, color: filter === f ? T1 : T2, whiteSpace: 'nowrap', flexShrink: 0 }}>{f}</button>
          ))}
        </div>
        {loading ? <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div> :
          bookings.map(b => (
            <div key={b.id} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ['IN_PROGRESS', 'CONFIRMED'].includes(b.status) ? 10 : 0 }}>
                <div>
                  <p style={{ color: T1, fontWeight: 700, fontSize: 15, margin: 0 }}>{b.shift?.title}</p>
                  <p style={{ color: T2, fontSize: 13, margin: '2px 0' }}>{b.worker?.user?.name} @ {b.employer?.name}</p>
                  <p style={{ color: T2, fontSize: 12, margin: 0 }}>{new Date(b.createdAt).toLocaleDateString('en-IN')} · ₹{b.totalAmount} · Fee: ₹{b.platformFee}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${STATUS_COLORS[b.status] || T2}20`, color: STATUS_COLORS[b.status] || T2, flexShrink: 0 }}>{b.status}</span>
              </div>
              {['IN_PROGRESS', 'CONFIRMED'].includes(b.status) && (
                <button onClick={() => forceComplete(b.id)} style={{ width: '100%', padding: '8px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: '#34D399', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Force Complete
                </button>
              )}
            </div>
          ))
        }
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )
}
