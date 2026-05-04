'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'
import { useLanguage } from '../LanguageContext'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const FONT = '"DM Sans", system-ui, sans-serif'

interface Task { id: string; title: string; description: string | null; status: string; dueDate: string | null; createdAt: string }

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:        { bg: '#DBEAFE', text: '#1E40AF', label: 'Open'        },
  IN_PROGRESS: { bg: '#F5F5F5', text: '#111111', label: 'In Progress' },
  DONE:        { bg: '#F5F5F5', text: '#111111', label: 'Done'        },
  CANCELLED:   { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled'   },
}

export default function TasksPage() {
  const router  = useRouter()
  const { t }   = useLanguage()
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
    setTasks(prev => prev.map(task => task.id === id ? { ...task, status } : task))
  }

  const now = new Date()
  const isOverdue = (task: Task) => task.status === 'OPEN' && task.dueDate && new Date(task.dueDate) < now

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title={t('myTasks')} />
      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>{t('loading')}</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>✅</p>
            <p style={{ color: T2 }}>{t('noTasks')}</p>
          </div>
        ) : tasks.map(task => {
          const sc      = STATUS_CONFIG[task.status] || STATUS_CONFIG.OPEN
          const overdue = isOverdue(task)
          return (
            <div key={task.id} style={{ background: overdue ? '#F7F7F7' : '#F5F5F5', border: overdue ? '1px solid #FECDD3' : '1px solid transparent', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontWeight: 700, color: overdue ? T1 : T1, margin: 0, fontSize: 15, flex: 1 }}>{task.title}</p>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text, marginLeft: 8, flexShrink: 0 }}>{sc.label}</span>
              </div>
              {task.description && <p style={{ color: T2, fontSize: 13, margin: '0 0 8px' }}>{task.description}</p>}
              {task.dueDate && (
                <p style={{ fontSize: 12, color: overdue ? T1 : T2, margin: '0 0 10px', fontWeight: overdue ? 700 : 400 }}>
                  {overdue ? t('overdue') : t('due')}
                  {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              {task.status === 'OPEN' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateStatus(task.id, 'IN_PROGRESS')} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${T1}`, background: 'transparent', color: T1, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {t('startTask')}
                  </button>
                </div>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button onClick={() => updateStatus(task.id, 'DONE')} style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', background: T1, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {t('markDone')}
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
