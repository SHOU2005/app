'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

const BG='#000000';const S1='#0F0F0F';const BD='rgba(255,255,255,0.08)';const T1='#FFFFFF';const T2='rgba(255,255,255,0.4)';const FONT='"DM Sans", system-ui, sans-serif'

export default function BroadcastPage() {
  const router = useRouter()
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [targetRole, setTargetRole] = useState('ALL')
  const [targetCity, setTargetCity] = useState('')
  const [sending,    setSending]    = useState(false)
  const [result,     setResult]     = useState<{ sent: number } | null>(null)

  async function send() {
    if (!title || !body) return
    setSending(true); setResult(null)
    const res = await fetch('/api/ops/broadcast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, targetRole, targetCity: targetCity || undefined }),
    })
    if (res.status === 401) { router.replace('/ops/login'); return }
    const data = await res.json()
    setSending(false)
    if (data.success) { setResult({ sent: data.sent }); setTitle(''); setBody('') }
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0, maxWidth: 600 }} className="ops-content">
        <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: '0 0 8px', paddingTop: 'env(safe-area-inset-top,0px)' }}>Broadcast Notification</p>
        <p style={{ color: T2, fontSize: 14, marginBottom: 24 }}>Send push notifications to all users or filtered groups</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: T2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Target Audience</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['ALL', 'WORKER', 'EMPLOYER', 'CAPTAIN'].map(r => (
              <button key={r} onClick={() => setTargetRole(r)} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: targetRole === r ? T1 : 'transparent', color: targetRole === r ? '#000' : T2 }}>{r}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: T2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>City Filter (optional)</label>
          <input value={targetCity} onChange={e => setTargetCity(e.target.value)} placeholder="e.g. Bangalore" style={{ width: '100%', background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px', color: T1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: T2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Notification Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New shifts available near you!" style={{ width: '100%', background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px', color: T1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: T2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Message Body *</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Enter your message…" style={{ width: '100%', background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px', color: T1, fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 100, boxSizing: 'border-box' }} />
        </div>

        {/* Preview */}
        {(title || body) && (
          <div style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ color: T2, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>Preview</p>
            <div style={{ background: '#1C1C1C', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ color: T1, fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{title || 'Notification title'}</p>
              <p style={{ color: T2, fontSize: 13, margin: 0 }}>{body || 'Message body'}</p>
            </div>
          </div>
        )}

        {result && (
          <div style={{ background: '#14532D20', border: '1px solid #34D399', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ color: '#34D399', fontWeight: 700, margin: 0 }}>✓ Sent to {result.sent} users</p>
          </div>
        )}

        <button onClick={send} disabled={sending || !title || !body} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: !title || !body ? 'rgba(255,255,255,0.1)' : T1, color: !title || !body ? T2 : '#000000', fontWeight: 800, fontSize: 15, cursor: !title || !body ? 'not-allowed' : 'pointer' }}>
          {sending ? 'Sending…' : `Send to ${targetRole === 'ALL' ? 'All Users' : targetRole + 's'}`}
        </button>
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )
}
