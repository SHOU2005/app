'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BG   = '#080808'
const S1   = '#111111'
const S2   = '#181818'
const BD   = 'rgba(255,255,255,0.07)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.2)'
const GOLD = '#F5C518'
const FONT = '"DM Sans", system-ui, -apple-system, sans-serif'

const IMG = (f: string) => `/icons/services/${f}.jpg`

const ROLES: Record<string, { img: string; color: string }> = {
  'House Cleaner':     { img: IMG('house-cleaner'),  color: '#8B5CF6' },
  'Cook / Chef':       { img: IMG('cook-chef'),       color: '#8B5CF6' },
  'Baby Care':         { img: IMG('baby-care'),       color: '#8B5CF6' },
  'Elder Care':        { img: IMG('baby-care'),       color: '#8B5CF6' },
  'Plumber':           { img: IMG('plumber'),         color: '#F59E0B' },
  'Electrician':       { img: IMG('electrician'),     color: '#F59E0B' },
  'Carpenter':         { img: IMG('carpenter'),       color: '#F59E0B' },
  'Painter':           { img: IMG('painter'),         color: '#F59E0B' },
  'AC Technician':     { img: IMG('electrician'),     color: '#F59E0B' },
  'Driver':            { img: IMG('driver'),          color: '#3B82F6' },
  'Delivery Rider':    { img: IMG('delivery-rider'),  color: '#3B82F6' },
  'Security Guard':    { img: IMG('security-guard'),  color: '#6B7280' },
  'Night Watchman':    { img: IMG('security-guard'),  color: '#6B7280' },
  'General Helper':    { img: IMG('store-helper'),    color: '#0EA5E9' },
  'Loader / Mover':    { img: IMG('delivery-rider'),  color: '#0EA5E9' },
  'Warehouse Staff':   { img: IMG('warehouse-staff'), color: '#0EA5E9' },
  'Construction Help': { img: IMG('warehouse-staff'), color: '#0EA5E9' },
  'Office Cleaner':    { img: IMG('house-cleaner'),   color: '#06B6D4' },
  'Deep Cleaner':      { img: IMG('house-cleaner'),   color: '#06B6D4' },
  'Bathroom Cleaner':  { img: IMG('house-cleaner'),   color: '#06B6D4' },
  'Gardener':          { img: IMG('store-helper'),    color: '#22C55E' },
  'Pest Control':      { img: IMG('store-helper'),    color: '#22C55E' },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function EmployerWalletPage() {
  const router = useRouter()
  const [jobs,    setJobs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employer/jobs').then(r => r.json()).then(d => {
      setJobs(d.jobs || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const completedJobs = jobs.filter(j => j.status === 'COMPLETED')
  const totalSpent    = completedJobs.reduce((s, j) => s + (j.hourlyRate * j.duration), 0)
  const pendingAmt    = jobs.filter(j => j.status === 'STARTED').reduce((s, j) => s + (j.hourlyRate * j.duration), 0)

  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const spent = completedJobs.filter(j => {
      const jd = new Date(j.date)
      return `${jd.getFullYear()}-${jd.getMonth()}` === key
    }).reduce((s, j) => s + (j.hourlyRate * j.duration), 0)
    return { month: MONTHS[d.getMonth()], spent }
  })
  const maxSpent = Math.max(...monthlyData.map(m => m.spent), 1)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: T1 }}>

      {/* Header */}
      <div style={{
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        paddingBottom: 20, paddingLeft: 20, paddingRight: 20,
        borderBottom: `1px solid ${BD}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={() => window.history.back()} style={{
          width: 40, height: 40, borderRadius: 20, border: `1px solid ${BD}`, background: S1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: T1 }}>Wallet</div>
          <div style={{ fontSize: 13, color: T2 }}>Payment history & spending</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 60px' }}>

        {/* Balance card */}
        <div style={{
          background: S1, borderRadius: 24, padding: '28px 24px',
          marginTop: 16, marginBottom: 14, border: `1px solid ${BD}`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }} />

          <div style={{ fontSize: 12, color: T2, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Total Spent</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: T1, marginBottom: 20, letterSpacing: -1 }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            <div>
              <div style={{ fontSize: 12, color: T2, marginBottom: 3 }}>Completed</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T1 }}>{completedJobs.length}</div>
            </div>
            {pendingAmt > 0 && (
              <div>
                <div style={{ fontSize: 12, color: T2, marginBottom: 3 }}>Pending</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>₹{pendingAmt}</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button onClick={() => router.push('/employer')} style={{
            flex: 1, padding: '15px 0', borderRadius: 16, border: `1px solid ${BD}`, cursor: 'pointer',
            background: T1, color: '#000', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Booking
          </button>
          <button style={{
            flex: 1, padding: '15px 0', borderRadius: 16, border: `1px solid ${BD}`, cursor: 'pointer',
            background: S1, color: T1, fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Statement
          </button>
        </div>

        {/* Monthly chart */}
        <div style={{ background: S1, borderRadius: 20, padding: '18px 16px', marginBottom: 20, border: `1px solid ${BD}` }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: T1, marginBottom: 18 }}>Monthly Spending</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {monthlyData.map(({ month, spent }, i) => {
              const pct    = (spent / maxSpent) * 100
              const isLast = i === monthlyData.length - 1
              return (
                <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 10, color: isLast ? T1 : T3, fontWeight: 700 }}>
                    {spent > 0 ? `₹${spent >= 1000 ? Math.round(spent / 1000) + 'k' : spent}` : ''}
                  </div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 64 }}>
                    <div style={{
                      width: '100%', borderRadius: '5px 5px 0 0',
                      background: spent > 0 ? (isLast ? T1 : 'rgba(255,255,255,0.18)') : 'rgba(255,255,255,0.04)',
                      height: `${Math.max(pct, spent > 0 ? 8 : 0)}%`,
                      minHeight: spent > 0 ? 6 : 0,
                      transition: 'height 0.4s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: isLast ? T1 : T3, fontWeight: isLast ? 700 : 400 }}>{month}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment history */}
        <div style={{ fontSize: 17, fontWeight: 800, color: T1, marginBottom: 14 }}>Payment History</div>

        {loading && <div style={{ textAlign: 'center', color: T2, paddingTop: 20, fontSize: 15 }}>Loading...</div>}

        {!loading && completedJobs.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 16, color: T2, fontWeight: 500 }}>No payments yet</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {completedJobs.map(job => {
            const total    = job.hourlyRate * job.duration
            const worker   = job.bookings?.[0]?.worker?.user
            const dateStr  = new Date(job.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
            const isPaid   = job.bookings?.[0]?.paymentStatus === 'PAID'
            const roleInfo = ROLES[job.title]

            return (
              <div key={job.id} onClick={() => router.push(`/employer/job/${job.id}`)} style={{
                background: S1, borderRadius: 16, padding: '16px',
                display: 'flex', alignItems: 'center', gap: 14,
                border: `1px solid ${BD}`, cursor: 'pointer',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                  background: S2, overflow: 'hidden', position: 'relative',
                }}>
                  {roleInfo?.img
                    ? <img src={roleInfo.img} alt={job.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 22 }}>?</div>
                  }
                  {roleInfo?.color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: roleInfo.color }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: T2, marginTop: 3 }}>{dateStr} · {worker?.name || 'Worker'} · {job.duration}h</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T1 }}>₹{total}</div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginTop: 3, padding: '3px 10px', borderRadius: 20,
                    background: isPaid ? 'rgba(16,185,129,0.1)' : `${GOLD}18`,
                    color: isPaid ? '#10B981' : GOLD,
                    border: `1px solid ${isPaid ? 'rgba(16,185,129,0.2)' : GOLD + '30'}`,
                  }}>{isPaid ? 'Paid' : 'Pending'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
