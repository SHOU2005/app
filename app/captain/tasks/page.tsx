'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#2563EB'
const FONT = '"DM Sans", system-ui, sans-serif'

interface Task { id: string; title: string; description: string | null; status: string; dueDate: string | null; createdAt: string }

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:        { bg: '#DBEAFE', text: '#1E40AF', label: 'Open'        },
  IN_PROGRESS: { bg: '#FEF9C3', text: '#713F12', label: 'In Progress' },
  DONE:        { bg: '#DCFCE7', text: '#166534', label: 'Done'        },
  CANCELLED:   { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled'   },
}

export default function TasksPage() {
  const router  = useRouter()
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/captain/tasks').then(r => {
      if (r.status === 401) { router.replace('/captain/login'); return null }
      return r.json()
    }).then(d => { if (d) setTasks(d.tasks || []) }).finally(() => setLoading(false))
  }, [router])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/captain/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const now = new Date()
  const isOverdue = (t: Task) => t.status === 'OPEN' && t.dueDate && new Date(t.dueDate) < now

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title="My Tasks" />
      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>✅</p>
            <p style={{ color: T2 }}>No tasks assigned yet</p>
          </div>
        ) : tasks.map(task => {
          const sc      = STATUS_CONFIG[task.status] || STATUS_CONFIG.OPEN
          const overdue = isOverdue(task)
          return (
            <div key={task.id} style={{ background: overdue ? '#FFF1F2' : '#F5F5F5', border: overdue ? '1px solid #FECDD3' : '1px solid transparent', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontWeight: 700, color: overdue ? '#DC2626' : T1, margin: 0, fontSize: 15, flex: 1 }}>{task.title}</p>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text, marginLeft: 8, flexShrink: 0 }}>{sc.label}</span>
              </div>
              {task.description && <p style={{ color: T2, fontSize: 13, margin: '0 0 8px' }}>{task.description}</p>}
              {task.dueDate && (
                <p style={{ fontSize: 12, color: overdue ? '#DC2626' : T2, margin: '0 0 10px', fontWeight: overdue ? 700 : 400 }}>
                  {overdue ? '⚠️ Overdue — ' : '📅 Due: '}
                  {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              {task.status === 'OPEN' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateStatus(task.id, 'IN_PROGRESS')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${BLUE}`, background: 'transparent', color: BLUE, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Start
                  </button>
                </div>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button onClick={() => updateStatus(task.id, 'DONE')} style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Mark Done ✓
                </button>
              )}
            </div>
          )
        })}
      </div>
      <CaptainBottomNav />
    </div>
  )
}
