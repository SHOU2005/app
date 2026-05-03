'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

const BG='#000000';const S1='#0F0F0F';const BD='rgba(255,255,255,0.08)';const T1='#FFFFFF';const T2='rgba(255,255,255,0.4)';

interface Complaint { id: string; type: string; status: string; description: string; reportedBy: string; against: string; createdAt: string; resolution: string | null }

export default function ComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading,    setLoading]    = useState(true)
  const [resolving,  setResolving]  = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    fetch('/api/ops/complaints?status=OPEN').then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() })
      .then(d => { if (d) setComplaints(d.complaints || []) }).finally(() => setLoading(false))
  }, [router])

  async function resolve(id: string) {
    if (!resolution.trim()) return
    await fetch(`/api/ops/complaints/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'RESOLVED', resolution }) })
    setComplaints(prev => prev.filter(c => c.id !== id))
    setResolving(null); setResolution('')
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: '0 0 16px', paddingTop: 'env(safe-area-inset-top,0px)' }}>Complaints</p>
        {loading ? <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div> :
          complaints.length === 0 ? <div style={{ textAlign: 'center', paddingTop: 60 }}><p style={{ fontSize: 36 }}>✅</p><p style={{ color: T2 }}>No open complaints</p></div> :
          complaints.map(c => (
            <div key={c.id} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 14, padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#F8717120', color: '#F87171' }}>{c.type}</span>
                <span style={{ fontSize: 12, color: T2 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <p style={{ color: T1, fontSize: 14, margin: '0 0 8px' }}>{c.description}</p>
              <p style={{ color: T2, fontSize: 12, margin: '0 0 12px' }}>By: {c.reportedBy} → Against: {c.against}</p>
              {resolving === c.id ? (
                <>
                  <textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Resolution note…" style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${BD}`, borderRadius: 10, padding: '10px 12px', color: T1, fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setResolving(null); setResolution('') }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: T2, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => resolve(c.id)} disabled={!resolution.trim()} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#34D399', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Resolve</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setResolving(c.id)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: T1, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Resolve Complaint
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
