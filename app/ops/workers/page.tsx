'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'
import { Suspense } from 'react'

const BG='#000000';const S1='#0F0F0F';const BD='rgba(255,255,255,0.08)';const T1='#FFFFFF';const T2='rgba(255,255,255,0.4)';const FONT='"DM Sans", system-ui, sans-serif'

interface Worker { id: string; kycStatus: string; city: string | null; totalShifts: number; user: { name: string; phone: string; isActive: boolean } }

function WorkersList() {
  const router  = useRouter(); const params = useSearchParams()
  const [workers,  setWorkers]  = useState<Worker[]>([])
  const [loading,  setLoading]  = useState(true)
  const [kycFilter, setKycFilter] = useState(params.get('kycStatus') || 'ALL')

  function load(status: string) {
    setLoading(true)
    const q = status === 'ALL' ? '' : `?kycStatus=${status}`
    fetch(`/api/ops/workers${q}`).then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() })
      .then(d => { if (d) setWorkers(d.workers || []) }).finally(() => setLoading(false))
  }

  useEffect(() => { load(kycFilter) }, [kycFilter])

  async function approveKyc(id: string, status: string) {
    await fetch(`/api/ops/workers/${id}/kyc`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, kycStatus: status } : w))
  }

  const KYC_COLORS: Record<string, string> = { PENDING: '#FBBF24', APPROVED: '#34D399', REJECTED: '#F87171' }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: '0 0 16px', paddingTop: 'env(safe-area-inset-top,0px)' }}>Workers</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setKycFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${BD}`, cursor: 'pointer', background: kycFilter === f ? T1 : 'transparent', color: kycFilter === f ? '#000' : T2 }}>{f}</button>
          ))}
        </div>
        {loading ? <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div> :
          workers.map(w => (
            <div key={w.id} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
              <div onClick={() => router.push(`/ops/workers/${w.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: w.kycStatus === 'PENDING' ? 10 : 0, cursor: 'pointer' }}>
                <div>
                  <p style={{ color: T1, fontWeight: 700, fontSize: 15, margin: 0 }}>{w.user.name}</p>
                  <p style={{ color: T2, fontSize: 13, margin: '2px 0' }}>{w.user.phone} · {w.city || '—'}</p>
                  <p style={{ color: T2, fontSize: 12, margin: 0 }}>{w.totalShifts} shifts · {w.user.isActive ? 'Active' : 'Suspended'}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${KYC_COLORS[w.kycStatus] || T2}20`, color: KYC_COLORS[w.kycStatus] || T2 }}>{w.kycStatus}</span>
              </div>
              {w.kycStatus === 'PENDING' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approveKyc(w.id, 'APPROVED')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: '#34D399', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => approveKyc(w.id, 'REJECTED')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: '#F87171', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                </div>
              )}
            </div>
          ))
        }
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )
}

export default function WorkersPage() { return <Suspense><WorkersList /></Suspense> }
