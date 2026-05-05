'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Clock, Zap, CheckCircle, X, ChevronRight } from 'lucide-react'
import TopBar    from '@/components/shared/TopBar'
import BottomNav from '@/components/shared/BottomNav'
import { Suspense } from 'react'

type Shift = {
  id: string; title: string; role: string; address: string; city: string
  date: string; startTime: string; endTime: string; duration: number
  hourlyRate: number; isUrgent: boolean; status: string
  employer: { companyName?: string; user: { name: string; avatar?: string } }
}

const FONT = '"DM Sans", system-ui, sans-serif'

function JobsInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const urgentId     = searchParams.get('urgent')

  const [shifts,     setShifts]     = useState<Shift[]>([])
  const [index,      setIndex]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [accepting,  setAccepting]  = useState(false)
  const [confirmed,  setConfirmed]  = useState<Shift | null>(null)
  const [error,      setError]      = useState('')
  const [listMode,   setListMode]   = useState(false)

  // Drag state
  const dragStartX  = useRef(0)
  const dragCurX    = useRef(0)
  const [dragX,     setDragX]       = useState(0)
  const [dragging,  setDragging]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/shifts')
      const data = await res.json()
      let list: Shift[] = data.shifts || []
      // Put the urgently-broadcast shift first
      if (urgentId) {
        list = [...list.filter(s => s.id === urgentId), ...list.filter(s => s.id !== urgentId)]
      }
      setShifts(list)
    } catch { /* ignore */ }
    setLoading(false)
  }, [urgentId])

  useEffect(() => { load() }, [load])

  const current = shifts[index]
  const earn    = current ? Math.round(current.hourlyRate * current.duration * 0.85) : 0

  async function accept(shift: Shift) {
    if (accepting) return
    setAccepting(true); setError('')
    try {
      const res  = await fetch(`/api/shifts/${shift.id}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setError(shift.isUrgent ? 'Job was just taken — next one!' : 'Already applied')
        } else {
          setError(data.error || 'Failed to accept')
        }
        next()
        return
      }
      setConfirmed(shift)
    } catch { setError('Network error') }
    setAccepting(false)
  }

  function next() {
    setDragX(0)
    setIndex(i => i + 1)
    setError('')
  }

  // Touch / mouse drag handlers
  function onDragStart(x: number) {
    dragStartX.current = x
    dragCurX.current   = x
    setDragging(true)
  }
  function onDragMove(x: number) {
    if (!dragging) return
    dragCurX.current = x
    setDragX(x - dragStartX.current)
  }
  async function onDragEnd() {
    if (!dragging) return
    setDragging(false)
    const dx = dragCurX.current - dragStartX.current
    if (dx > 90 && current) {
      setDragX(400)
      await accept(current)
    } else if (dx < -90) {
      setDragX(-400)
      setTimeout(next, 200)
    } else {
      setDragX(0)
    }
  }

  const rotation  = dragX * 0.08
  const opacity   = Math.max(0.3, 1 - Math.abs(dragX) / 300)
  const isRight   = dragX > 40
  const isLeft    = dragX < -40

  if (loading) return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Find Jobs" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: '#111', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>Finding jobs near you…</p>
        </div>
      </div>
      <BottomNav active="/worker/jobs" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (confirmed) return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#111111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, animation: 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <CheckCircle style={{ width: 40, height: 40, color: '#22C55E' }} />
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
        {confirmed.isUrgent ? 'Job Accepted!' : 'Application Sent!'}
      </p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textAlign: 'center' }}>
        {confirmed.title}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 40, textAlign: 'center' }}>
        {confirmed.isUrgent
          ? 'The employer has been notified. Head to the location when confirmed.'
          : 'Wait for the employer to confirm your application.'}
      </p>
      <button onClick={() => router.push('/')}
        style={{ width: '100%', height: 56, borderRadius: 16, background: '#FFFFFF', color: '#111111', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
        Go to Dashboard
      </button>
      <button onClick={() => { setConfirmed(null); next() }}
        style={{ width: '100%', height: 48, borderRadius: 16, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 15, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
        Browse More Jobs
      </button>
      <style>{`@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}`}</style>
    </div>
  )

  return (
    <>
      <TopBar title="Find Jobs" unread={0} />
      <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', paddingTop: 64, paddingBottom: 80, display: 'flex', flexDirection: 'column' }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>
            <span style={{ fontWeight: 800, color: '#111111' }}>{shifts.length - index}</span> jobs available
          </p>
          <button onClick={() => setListMode(m => !m)}
            style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', background: '#EFEFEF', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }}>
            {listMode ? 'Swipe Mode' : 'List Mode'}
          </button>
        </div>

        {error && (
          <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* No more jobs */}
        {index >= shifts.length && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#111111', marginBottom: 8 }}>You're all caught up!</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginBottom: 32 }}>Check back soon for new opportunities</p>
            <button onClick={() => { setIndex(0); load() }}
              style={{ padding: '14px 32px', borderRadius: 14, background: '#111111', color: '#FFFFFF', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        )}

        {/* Swipe card mode */}
        {!listMode && index < shifts.length && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px' }}>

            {/* Stack hint (next card peeking behind) */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 400, height: 460 }}>
              {shifts[index + 1] && (
                <div style={{
                  position: 'absolute', top: 8, left: 8, right: 8, bottom: -8,
                  background: '#E8E8E8', borderRadius: 24, zIndex: 0,
                  transform: 'scale(0.97)',
                }} />
              )}

              {/* Main card */}
              {current && (
                <div
                  onMouseDown={e => onDragStart(e.clientX)}
                  onMouseMove={e => onDragMove(e.clientX)}
                  onMouseUp={onDragEnd}
                  onMouseLeave={onDragEnd}
                  onTouchStart={e => onDragStart(e.touches[0].clientX)}
                  onTouchMove={e => onDragMove(e.touches[0].clientX)}
                  onTouchEnd={onDragEnd}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    background: '#FFFFFF', borderRadius: 24,
                    boxShadow: `0 8px 32px rgba(0,0,0,${0.12 + Math.abs(dragX) / 2000})`,
                    transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
                    opacity,
                    transition: dragging ? 'none' : 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
                    cursor: 'grab', userSelect: 'none',
                    overflow: 'hidden',
                  }}>

                  {/* Accept / Skip overlays */}
                  {isRight && (
                    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: '#22C55E', borderRadius: 10, padding: '6px 14px', border: '2.5px solid #16A34A', transform: 'rotate(-15deg)' }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>ACCEPT ✓</span>
                    </div>
                  )}
                  {isLeft && (
                    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: '#EF4444', borderRadius: 10, padding: '6px 14px', border: '2.5px solid #DC2626', transform: 'rotate(15deg)' }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>SKIP ✗</span>
                    </div>
                  )}

                  {/* Urgent banner */}
                  {current.isUrgent && (
                    <div style={{ background: '#111111', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap style={{ width: 14, height: 14, color: '#FCD34D', fill: '#FCD34D' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#FCD34D', letterSpacing: '0.06em' }}>URGENT · FIRST TO ACCEPT GETS THE JOB</span>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: 24 }}>
                    {/* Job icon + title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 18, background: current.isUrgent ? '#111111' : '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 28 }}>
                          {current.role === 'Driver' ? '🚗' : current.role === 'Security Guard' ? '🔒' : current.role === 'Kitchen Helper' ? '🍳' : current.role === 'Cleaning Staff' ? '🧹' : current.role === 'Delivery' ? '🚴' : current.role === 'Warehouse Staff' ? '🏭' : '💼'}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 22, fontWeight: 900, color: '#111111', margin: 0, lineHeight: 1.2 }}>{current.title}</p>
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                          {current.employer?.companyName || current.employer?.user?.name || 'Employer'}
                        </p>
                      </div>
                    </div>

                    {/* Earnings highlight */}
                    <div style={{ background: '#F5F5F5', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>You Earn</p>
                      <p style={{ fontSize: 36, fontWeight: 900, color: '#111111', margin: 0 }}>₹{earn.toLocaleString('en-IN')}</p>
                      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', margin: '4px 0 0' }}>₹{current.hourlyRate}/hr × {current.duration}h</p>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin style={{ width: 16, height: 16, color: 'rgba(0,0,0,0.4)', flexShrink: 0 }} />
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', margin: 0, lineClamp: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.address}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock style={{ width: 16, height: 16, color: 'rgba(0,0,0,0.4)', flexShrink: 0 }} />
                        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', margin: 0 }}>
                          {new Date(current.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {current.startTime} – {current.endTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 16, marginTop: 24, width: '100%', maxWidth: 400 }}>
              <button onClick={() => { setDragX(-200); setTimeout(next, 200) }}
                style={{ flex: 1, height: 60, borderRadius: 18, background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <X style={{ width: 28, height: 28, color: '#EF4444' }} />
              </button>
              <button onClick={() => current && accept(current)} disabled={accepting}
                style={{ flex: 2, height: 60, borderRadius: 18, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: accepting ? 'default' : 'pointer', opacity: accepting ? 0.7 : 1 }}>
                {accepting
                  ? <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                  : <>
                    <CheckCircle style={{ width: 22, height: 22, color: '#FFFFFF' }} />
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF' }}>Accept Job</span>
                  </>
                }
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', marginTop: 14 }}>Swipe right to accept · Swipe left to skip</p>
          </div>
        )}

        {/* List mode */}
        {listMode && index < shifts.length && (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shifts.slice(index).map(shift => {
              const w = Math.round(shift.hourlyRate * shift.duration * 0.85)
              return (
                <div key={shift.id}
                  style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {shift.isUrgent && (
                    <div style={{ background: '#111111', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Zap style={{ width: 12, height: 12, color: '#FCD34D', fill: '#FCD34D' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#FCD34D' }}>URGENT</span>
                    </div>
                  )}
                  <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#111111', margin: 0 }}>{shift.title}</p>
                      <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>{shift.city} · {shift.duration}h</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: '#111111', margin: 0 }}>₹{w.toLocaleString('en-IN')}</p>
                      <button
                        onClick={() => accept(shift)}
                        style={{ marginTop: 6, padding: '6px 14px', borderRadius: 10, background: '#111111', color: '#FFFFFF', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Accept <ChevronRight style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav active="/worker/jobs" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

export default function BrowsePage() {
  return <Suspense><JobsInner /></Suspense>
}
