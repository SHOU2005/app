'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

const BG   = '#000000'; const S1 = '#0F0F0F'; const S2 = '#141414'
const BD   = 'rgba(255,255,255,0.08)'; const T1 = '#FFFFFF'; const T2 = 'rgba(255,255,255,0.4)'
const FONT = '"DM Sans", system-ui, sans-serif'


interface Captain { id: string; name: string; phone: string; territory: string | null; status: string; totalEarnings: number; pendingPayout: number; pendingCommissions: number; openTasks: number }

const STATUS_COLORS: Record<string, string> = { PENDING: '#FBBF24', ACTIVE: '#34D399', SUSPENDED: '#F87171' }

export default function OpsCapt() {
  const router = useRouter()
  const [captains, setCaptains] = useState<Captain[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')

  useEffect(() => {
    fetch('/api/ops/captains').then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() })
      .then(d => { if (d) setCaptains(d.captains || []) }).finally(() => setLoading(false))
  }, [router])

  const filtered = filter === 'ALL' ? captains : captains.filter(c => c.status === filter)

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ops/captains/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setCaptains(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: '0 0 16px', paddingTop: 'env(safe-area-inset-top,0px)' }}>Captains</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${BD}`, cursor: 'pointer', background: filter === f ? T1 : 'transparent', color: filter === f ? '#000' : T2 }}>{f}</button>
          ))}
        </div>
        {loading ? <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div> :
          filtered.map(c => (
            <div key={c.id} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 16, padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <a href={`/ops/captains/${c.id}`} style={{ color: T1, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{c.name}</a>
                  <p style={{ color: T2, fontSize: 13, margin: '2px 0' }}>{c.phone} · {c.territory || 'No territory'}</p>
                  <p style={{ color: T2, fontSize: 12, margin: 0 }}>₹{c.totalEarnings} earned · {c.pendingCommissions} pending commissions</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {c.status === 'PENDING' && <button onClick={() => updateStatus(c.id, 'ACTIVE')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: '#34D399', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Activate</button>}
                {c.status === 'ACTIVE'  && <button onClick={() => updateStatus(c.id, 'SUSPENDED')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: '#F87171', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Suspend</button>}
                {c.status === 'SUSPENDED' && <button onClick={() => updateStatus(c.id, 'ACTIVE')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: '#34D399', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reactivate</button>}
                <a href={`/ops/captains/${c.id}`} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${BD}`, color: T2, fontWeight: 700, fontSize: 13, textAlign: 'center', textDecoration: 'none' }}>View →</a>
              </div>
            </div>
          ))
        }
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )
}
