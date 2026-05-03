'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

const BG='#080808';const S1='#111111';const S2='#181818';const BD='rgba(255,255,255,0.07)';const T1='#FFFFFF';const T2='rgba(255,255,255,0.45)';const ACC='#6366F1';const FONT='"DM Sans", system-ui, sans-serif'

export default function CaptainDetailPage() {
  const router = useRouter(); const { id } = useParams<{ id: string }>()
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [task,    setTask]    = useState({ title: '', description: '', dueDate: '' })
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch(`/api/ops/captains/${id}`).then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() })
      .then(d => { if (d) setData(d.captain) }).finally(() => setLoading(false))
  }, [id, router])

  async function assignTask() {
    if (!task.title) return
    setSaving(true)
    await fetch(`/api/ops/captains/${id}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) })
    setSaving(false); setTask({ title: '', description: '', dueDate: '' })
    const d = await fetch(`/api/ops/captains/${id}`).then(r => r.json())
    setData(d.captain)
  }

  if (loading) return <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T2 }}>Loading…</div>
  if (!data)   return <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T2 }}>Not found</div>

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <a href="/ops/captains" style={{ color: T2, fontSize: 13, textDecoration: 'none' }}>← Captains</a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px' }}>
          <div>
            <p style={{ color: T1, fontWeight: 800, fontSize: 22, margin: 0 }}>{data.user.name}</p>
            <p style={{ color: T2, fontSize: 13, margin: '4px 0 0' }}>{data.user.phone} · {data.territory || 'No territory'}</p>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: 20, background: data.status === 'ACTIVE' ? '#34D39920' : '#F8717120', color: data.status === 'ACTIVE' ? '#34D399' : '#F87171', fontWeight: 700, fontSize: 13 }}>{data.status}</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Employers', value: data.employersOnboarded },
            { label: 'Workers',   value: data.workersOnboarded   },
            { label: 'Total ₹',   value: `₹${data.totalEarnings}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <p style={{ color: T1, fontWeight: 800, fontSize: 18, margin: 0 }}>{value}</p>
              <p style={{ color: T2, fontSize: 11, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Assign task */}
        <div style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <p style={{ color: T1, fontWeight: 700, margin: '0 0 12px' }}>Assign Task</p>
          <input style={{ width: '100%', background: S2, border: `1px solid ${BD}`, borderRadius: 10, padding: '10px 14px', color: T1, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} placeholder="Task title *" value={task.title} onChange={e => setTask(p => ({ ...p, title: e.target.value }))} />
          <input style={{ width: '100%', background: S2, border: `1px solid ${BD}`, borderRadius: 10, padding: '10px 14px', color: T1, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} placeholder="Description (optional)" value={task.description} onChange={e => setTask(p => ({ ...p, description: e.target.value }))} />
          <input style={{ width: '100%', background: S2, border: `1px solid ${BD}`, borderRadius: 10, padding: '10px 14px', color: T1, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} type="date" value={task.dueDate} onChange={e => setTask(p => ({ ...p, dueDate: e.target.value }))} />
          <button onClick={assignTask} disabled={saving || !task.title} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: ACC, color: T1, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{saving ? 'Assigning…' : 'Assign Task'}</button>
        </div>

        {/* Tasks list */}
        {data.tasks?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: T2, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Tasks ({data.tasks.length})</p>
            {data.tasks.map((t: any) => (
              <div key={t.id} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: T1, fontSize: 14, margin: 0 }}>{t.title}</p>
                <span style={{ fontSize: 11, color: T2, background: S2, padding: '3px 8px', borderRadius: 20 }}>{t.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Attendance */}
        {data.attendances?.length > 0 && (
          <div>
            <p style={{ color: T2, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Attendance (Last 10)</p>
            {data.attendances.slice(0, 10).map((a: any) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BD}` }}>
                <p style={{ color: T1, fontSize: 14, margin: 0 }}>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                <p style={{ color: T2, fontSize: 13, margin: 0 }}>
                  {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'} – {a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )
}
