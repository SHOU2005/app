'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BG   = '#080808'
const S1   = '#111111'
const BD   = 'rgba(255,255,255,0.07)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.2)'
const GOLD = '#F5C518'
const FONT = '"DM Sans", system-ui, -apple-system, sans-serif'

const IMG = (f: string) => `/icons/services/${f}.jpg`

const ROLES: Record<string, { img: string; color: string }> = {
  'Cleaner':         { img: IMG('house-cleaner'),  color: '#06B6D4' },
  'Cook':            { img: IMG('cook-chef'),       color: '#8B5CF6' },
  'Kitchen Helper':  { img: IMG('cook-chef'),       color: '#8B5CF6' },
  'Store Staff':     { img: IMG('store-helper'),    color: '#0EA5E9' },
  'General Helper':  { img: IMG('store-helper'),    color: '#0EA5E9' },
  'Driver':          { img: IMG('driver'),          color: '#3B82F6' },
  'Bouncer':         { img: IMG('security-guard'),  color: '#6B7280' },
  'Waiter':          { img: IMG('cook-chef'),       color: '#8B5CF6' },
  'Security Guard':  { img: IMG('security-guard'),  color: '#6B7280' },
  'Promoter':        { img: IMG('store-helper'),    color: '#F59E0B' },
  'Caretaker':       { img: IMG('baby-care'),       color: '#A78BFA' },
  'Delivery Rider':  { img: IMG('delivery-rider'),  color: '#3B82F6' },
  'Factory Helper':  { img: IMG('warehouse-staff'), color: '#0EA5E9' },
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  SEARCHING:  { color: GOLD,      label: 'Searching'   },
  ASSIGNED:   { color: '#818CF8', label: 'Assigned'    },
  ON_THE_WAY: { color: '#60A5FA', label: 'On the Way'  },
  ARRIVED:    { color: '#A78BFA', label: 'Arrived'     },
  STARTED:    { color: '#34D399', label: 'In Progress' },
  COMPLETED:  { color: '#10B981', label: 'Completed'   },
  CANCELLED:  { color: '#F87171', label: 'Cancelled'   },
}

const TABS = ['Active', 'Completed', 'All'] as const
type Tab = typeof TABS[number]

export default function EmployerJobsPage() {
  const router = useRouter()
  const [tab,     setTab]     = useState<Tab>('Active')
  const [jobs,    setJobs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employer/jobs').then(r => r.json()).then(d => {
      setJobs(d.jobs || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const active    = jobs.filter(j => ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'STARTED'].includes(j.status))
  const completed = jobs.filter(j => j.status === 'COMPLETED')
  const list      = tab === 'Active' ? active : tab === 'Completed' ? completed : jobs

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: T1 }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: BG, borderBottom: `1px solid ${BD}`,
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        paddingBottom: 16, paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => window.history.back()} style={{
              width: 40, height: 40, borderRadius: 20, border: `1px solid ${BD}`, background: S1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: T1, lineHeight: '30px' }}>Bookings</div>
              <div style={{ fontSize: 13, color: T2 }}>
                {active.length > 0 ? `${active.length} active now` : 'No active jobs'}
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/employer')} style={{
            width: 40, height: 40, borderRadius: 20, background: T1,
            color: '#000', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 20, border: `1px solid ${tab === t ? T1 : BD}`, cursor: 'pointer',
              fontSize: 14, fontWeight: 600, fontFamily: FONT,
              background: tab === t ? T1 : 'transparent',
              color: tab === t ? '#000' : T2,
            }}>
              {t}
              {t === 'Active' && active.length > 0 && (
                <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1px 7px', fontSize: 12, color: T1 }}>{active.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 'calc(130px + env(safe-area-inset-top)) 16px 48px' }}>

        {loading && <div style={{ textAlign: 'center', color: T2, paddingTop: 60, fontSize: 16 }}>Loading...</div>}

        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 70 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T1, marginBottom: 10 }}>No bookings yet</div>
            <div style={{ fontSize: 15, color: T2, marginBottom: 32 }}>Hire your first worker in under 2 minutes</div>
            <button onClick={() => router.push('/employer')} style={{
              padding: '15px 36px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: T1, color: '#000', fontWeight: 700, fontSize: 16, fontFamily: FONT,
            }}>Browse Services</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(job => {
            const meta     = STATUS_META[job.status] || { color: T2, label: job.status }
            const worker   = job.bookings?.[0]?.worker?.user
            const dateStr  = new Date(job.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            const roleInfo = ROLES[job.title]
            const isPaid   = job.bookings?.[0]?.paymentStatus === 'PAID'
            const total    = job.hourlyRate * job.duration

            return (
              <div key={job.id} onClick={() => router.push(`/employer/job/${job.id}`)}
                style={{ background: S1, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${BD}` }}>
                <div style={{ height: 3, background: meta.color, opacity: ['COMPLETED','CANCELLED'].includes(job.status) ? 0.3 : 1 }} />
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 15, flexShrink: 0,
                      background: '#181818', overflow: 'hidden', position: 'relative',
                    }}>
                      {roleInfo?.img
                        ? <img src={roleInfo.img} alt={job.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 24 }}>?</div>
                      }
                      {roleInfo?.color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: roleInfo.color }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T1 }}>{job.title}</div>
                        <div style={{
                          padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                          background: `${meta.color}14`, fontSize: 12, fontWeight: 700, color: meta.color,
                          display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const,
                          border: `1px solid ${meta.color}30`,
                        }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color }} />
                          {meta.label}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: T2, marginTop: 3 }}>
                        {dateStr} · {job.startTime} · {job.duration}h
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BD}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {worker ? (
                        <>
                          <div style={{ width: 28, height: 28, borderRadius: 14, background: '#181818', border: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T1, fontWeight: 700, fontSize: 12 }}>{worker.name?.[0]?.toUpperCase()}</div>
                          <span style={{ fontSize: 14, color: T1, fontWeight: 500 }}>{worker.name}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 14, color: T2 }}>Unassigned</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: T1 }}>₹{total}</span>
                      {job.status === 'COMPLETED' && !isPaid && (
                        <button onClick={e => { e.stopPropagation(); router.push(`/employer/job/${job.id}/payment`) }}
                          style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: T1, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                          Pay Now
                        </button>
                      )}
                      {isPaid && <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>Paid</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
