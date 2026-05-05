'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Clock, Zap, CheckCircle, X, ChevronRight, Star } from 'lucide-react'
import TopBar    from '@/components/shared/TopBar'
import BottomNav from '@/components/shared/BottomNav'
import { getMilestone } from '@/lib/milestones'

type Shift = {
  id: string; title: string; role: string; address: string; city: string
  date: string; startTime: string; endTime: string; duration: number
  hourlyRate: number; isUrgent: boolean; status: string
  employer: { companyName?: string; rating?: number; user: { name: string; avatar?: string } }
}

const FONT    = '"DM Sans", system-ui, sans-serif'
const ROLE_EMOJI: Record<string, string> = {
  'Driver': '🚗', 'Security Guard': '🔒', 'Kitchen Helper': '🍳',
  'Cleaning Staff': '🧹', 'Delivery': '🚴', 'Warehouse Staff': '🏭',
  'Shop Helper': '🏪', 'Office Work': '💼', 'Construction': '🏗️',
  'Packing Staff': '📦', 'Cashier': '🛒',
}

function playSwipeSound(accepted: boolean) {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    if (accepted) {
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    }
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5)
  } catch { /* AudioContext not available */ }
}

function JobsInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const urgentId     = searchParams.get('urgent')

  const [shifts,    setShifts]    = useState<Shift[]>([])
  const [index,     setIndex]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [confirmed, setConfirmed] = useState<Shift | null>(null)
  const [error,     setError]     = useState('')
  const [listMode,  setListMode]  = useState(false)
  const [totalShifts, setTotalShifts] = useState(0)

  // Drag state
  const startX  = useRef(0)
  const startY  = useRef(0)
  const [dragX, setDragX]     = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flinging, setFlinging] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [shiftsRes, meRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/auth/me'),
      ])
      const [sd, md] = await Promise.all([shiftsRes.json(), meRes.json()])
      let list: Shift[] = sd.shifts || []
      if (urgentId) list = [...list.filter(s => s.id === urgentId), ...list.filter(s => s.id !== urgentId)]
      setShifts(list)
      setTotalShifts(md.user?.workerProfile?.totalShifts ?? 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [urgentId])

  useEffect(() => { load() }, [load])

  const current = shifts[index]
  const earn    = current ? Math.round(current.hourlyRate * current.duration * 0.85) : 0
  const milestone = getMilestone(totalShifts)

  async function accept(shift: Shift) {
    if (accepting) return
    setAccepting(true); setError('')
    playSwipeSound(true)
    try {
      const res  = await fetch(`/api/shifts/${shift.id}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 409 ? (shift.isUrgent ? '⚡ Just taken — next one!' : 'Already applied') : (data.error || 'Failed'))
        goNext()
        return
      }
      setConfirmed(shift)
      setTotalShifts(t => t + 1)
    } catch { setError('Network error') }
    setAccepting(false)
  }

  function goNext() {
    setDragX(0)
    setFlingDir(null)
    setIndex(i => i + 1)
    setError('')
  }

  const [flingDir, setFlingDir] = useState<'left' | 'right' | null>(null)

  function onStart(x: number, y: number) { startX.current = x; startY.current = y; setDragging(true) }
  function onMove(x: number) {
    if (!dragging) return
    setDragX(x - startX.current)
  }
  async function onEnd() {
    if (!dragging) return
    setDragging(false)
    const dx = dragX
    if (dx > 90 && current) {
      setFlingDir('right')
      setFlinging(true)
      await accept(current)
      setFlinging(false)
      goNext()
    } else if (dx < -90) {
      setFlingDir('left')
      setFlinging(true)
      playSwipeSound(false)
      setTimeout(() => { setFlinging(false); goNext() }, 300)
    } else {
      setDragX(0)
    }
  }

  const rot     = dragging ? dragX * 0.07 : flingDir === 'right' ? 20 : flingDir === 'left' ? -20 : 0
  const tx      = flinging ? (flingDir === 'right' ? 500 : -500) : dragging ? dragX : 0
  const opa     = dragging ? Math.max(0.4, 1 - Math.abs(dragX) / 250) : flinging ? 0 : 1
  const isRight = dragX > 50
  const isLeft  = dragX < -50

  if (loading) return (
    <>
      <TopBar title="Find Jobs" />
      <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(0,0,0,0.08)', borderTopColor: '#111', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.35)', fontFamily: FONT }}>Finding jobs near you…</p>
        </div>
      </div>
      <BottomNav active="/worker/jobs" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )

  if (confirmed) return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#111111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, animation: 'pop 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <CheckCircle style={{ width: 44, height: 44, color: '#22C55E' }} />
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', marginBottom: 8, textAlign: 'center', letterSpacing: -1 }}>
        {confirmed.isUrgent ? 'Job Accepted! ⚡' : 'Applied! 🎉'}
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#22C55E', marginBottom: 6, textAlign: 'center' }}>{confirmed.title}</p>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textAlign: 'center' }}>
        You earn <span style={{ fontWeight: 800, color: '#FFFFFF' }}>₹{Math.round(confirmed.hourlyRate * confirmed.duration * 0.85).toLocaleString('en-IN')}</span>
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 40, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
        {confirmed.isUrgent ? 'Employer has been notified. Get ready to go!' : 'Employer will review and confirm your application.'}
      </p>

      {/* Milestone nudge */}
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 20px', marginBottom: 32, width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>{milestone.emoji} {milestone.label} Tier</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{totalShifts} jobs completed · ₹{milestone.bonus > 0 ? `+${milestone.bonus}/hr bonus` : 'Base rate'}</p>
      </div>

      <button onClick={() => router.push('/')}
        style={{ width: '100%', maxWidth: 320, height: 56, borderRadius: 16, background: '#FFFFFF', color: '#111111', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
        Go to Dashboard
      </button>
      <button onClick={() => { setConfirmed(null); goNext() }}
        style={{ width: '100%', maxWidth: 320, height: 48, borderRadius: 16, background: 'transparent', color: 'rgba(255,255,255,0.45)', fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
        Browse More Jobs
      </button>
      <style>{`@keyframes pop{0%{transform:scale(0)}65%{transform:scale(1.22)}100%{transform:scale(1)}}`}</style>
    </div>
  )

  return (
    <>
      <TopBar title="Find Jobs" unread={0} />
      <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F0F0F0', paddingTop: 64, paddingBottom: 80 }}>

        {/* Milestone bar */}
        <div style={{ background: '#111111', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{milestone.emoji}</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{milestone.label}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{totalShifts} jobs{milestone.bonus > 0 ? ` · +₹${milestone.bonus}/hr` : ''}</p>
            </div>
          </div>
          <button onClick={() => setListMode(m => !m)}
            style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }}>
            {listMode ? 'Swipe' : 'List'} Mode
          </button>
        </div>

        {error && (
          <div style={{ margin: '12px 16px 0', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Empty / all done */}
        {index >= shifts.length && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✨</div>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#111111', marginBottom: 8 }}>All caught up!</p>
            <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.4)', marginBottom: 32 }}>Check back soon for new jobs</p>
            <button onClick={() => { setIndex(0); load() }}
              style={{ padding: '14px 36px', borderRadius: 16, background: '#111111', color: '#FFFFFF', fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              Refresh Jobs
            </button>
          </div>
        )}

        {/* ─── SWIPE MODE ─── */}
        {!listMode && index < shifts.length && current && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 0' }}>

            {/* Stack: cards behind */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 'calc(100dvh - 220px)', minHeight: 420 }}>

              {/* Card behind -2 */}
              {shifts[index + 2] && (
                <div style={{ position: 'absolute', top: 20, left: 16, right: 16, bottom: 0, borderRadius: 28, background: '#D8D8D8', transform: 'scale(0.92)', transformOrigin: 'bottom center' }} />
              )}

              {/* Card behind -1 */}
              {shifts[index + 1] && (
                <div style={{ position: 'absolute', top: 10, left: 8, right: 8, bottom: 0, borderRadius: 28, background: '#E4E4E4', transform: 'scale(0.96)', transformOrigin: 'bottom center' }} />
              )}

              {/* Main card */}
              <div
                onMouseDown={e => onStart(e.clientX, e.clientY)}
                onMouseMove={e => { if (dragging) onMove(e.clientX) }}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={e => { e.preventDefault(); if (dragging) onMove(e.touches[0].clientX) }}
                onTouchEnd={onEnd}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: '#FFFFFF', borderRadius: 28,
                  boxShadow: `0 12px 48px rgba(0,0,0,${0.1 + Math.abs(dragX) / 3000})`,
                  border: isRight ? '2px solid #22C55E' : isLeft ? '2px solid #EF4444' : '2px solid transparent',
                  transform: `translateX(${tx}px) rotate(${rot}deg)`,
                  opacity:  opa,
                  transition: dragging ? 'none' : flinging ? 'transform 0.3s ease-in, opacity 0.3s' : 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1), border-color 0.1s',
                  cursor: 'grab', userSelect: 'none', overflow: 'hidden',
                }}>

                {/* Accept/Skip overlays */}
                <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20, opacity: Math.min(1, Math.max(0, dragX / 70)), transform: `rotate(-${Math.min(15, dragX / 6)}deg)` }}>
                  <div style={{ background: '#22C55E', borderRadius: 12, padding: '8px 18px', border: '3px solid #16A34A' }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>ACCEPT ✓</p>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 20, opacity: Math.min(1, Math.max(0, -dragX / 70)), transform: `rotate(${Math.min(15, -dragX / 6)}deg)` }}>
                  <div style={{ background: '#EF4444', borderRadius: 12, padding: '8px 18px', border: '3px solid #DC2626' }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>SKIP ✗</p>
                  </div>
                </div>

                {/* Urgent banner */}
                {current.isUrgent && (
                  <div style={{ background: 'linear-gradient(90deg,#111 0%,#1a1a1a 100%)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCD34D', animation: 'pulse 1s ease infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#FCD34D', letterSpacing: '0.1em' }}>⚡ URGENT · FIRST TO ACCEPT WINS</span>
                  </div>
                )}

                {/* Card body */}
                <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', height: current.isUrgent ? 'calc(100% - 44px)' : '100%', boxSizing: 'border-box' }}>

                  {/* Header: icon + title */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                    <div style={{ width: 70, height: 70, borderRadius: 20, background: current.isUrgent ? '#111111' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 32 }}>{ROLE_EMOJI[current.role] || ROLE_EMOJI[current.title] || '💼'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color: '#111111', margin: 0, lineHeight: 1.15 }}>{current.title}</p>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                        {current.employer?.companyName || current.employer?.user?.name || 'Employer'}
                      </p>
                      {current.employer?.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                          <Star style={{ width: 12, height: 12, color: '#F59E0B', fill: '#F59E0B' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>{current.employer.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Earnings highlight */}
                  <div style={{ background: '#111111', borderRadius: 20, padding: '18px 22px', marginBottom: 18 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>You Earn</p>
                    <p style={{ fontSize: 42, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: -2 }}>₹{earn.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>₹{current.hourlyRate}/hr × {current.duration}h {milestone.bonus > 0 ? `+ ₹${milestone.bonus}/hr bonus` : ''}</p>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin style={{ width: 15, height: 15, color: 'rgba(0,0,0,0.5)' }} />
                      </div>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', margin: 0, lineHeight: 1.35 }}>{current.address || current.city}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock style={{ width: 15, height: 15, color: 'rgba(0,0,0,0.5)' }} />
                      </div>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', margin: 0 }}>
                        {new Date(current.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {current.startTime} – {current.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint + action buttons */}
            <div style={{ width: '100%', maxWidth: 420, padding: '0 4px' }}>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(0,0,0,0.3)', margin: '14px 0 14px' }}>← swipe to skip · swipe to accept →</p>
              <div style={{ display: 'flex', gap: 14 }}>
                <button onClick={() => { playSwipeSound(false); setFlingDir('left'); setFlinging(true); setTimeout(() => { setFlinging(false); goNext() }, 300) }}
                  style={{ flex: 1, height: 64, borderRadius: 20, background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <X style={{ width: 30, height: 30, color: '#EF4444' }} />
                </button>
                <button onClick={() => { if (!accepting && current) accept(current) }} disabled={accepting}
                  style={{ flex: 2, height: 64, borderRadius: 20, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: accepting ? 'default' : 'pointer', opacity: accepting ? 0.7 : 1, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
                  {accepting
                    ? <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                    : <>
                        <CheckCircle style={{ width: 24, height: 24, color: '#FFFFFF' }} />
                        <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>Accept Job</span>
                      </>
                  }
                </button>
              </div>

              {/* Milestone progress */}
              {(() => {
                const next = MILESTONES.find(m => m.minJobs > totalShifts)
                if (!next) return null
                const prev = getMilestone(totalShifts)
                const pct = Math.round(((totalShifts - prev.minJobs) / (next.minJobs - prev.minJobs)) * 100)
                return (
                  <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 16px', marginTop: 14, border: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111111', margin: 0 }}>
                        {next.emoji} {next.minJobs - totalShifts} more to {next.label}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: 0 }}>+₹{next.bonus}/hr</p>
                    </div>
                    <div style={{ height: 8, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 8, background: '#111111', width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ─── LIST MODE ─── */}
        {listMode && index < shifts.length && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shifts.slice(index).map(shift => {
              const w = Math.round(shift.hourlyRate * shift.duration * 0.85)
              return (
                <div key={shift.id} style={{ background: '#FFFFFF', borderRadius: 20, border: `1px solid ${shift.isUrgent ? 'rgba(252,211,77,0.3)' : 'rgba(0,0,0,0.07)'}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  {shift.isUrgent && (
                    <div style={{ background: '#111111', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FCD34D', animation: 'pulse 1s ease infinite' }} />
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#FCD34D', letterSpacing: '0.06em' }}>URGENT</span>
                    </div>
                  )}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 24 }}>{ROLE_EMOJI[shift.role] || '💼'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#111111', margin: 0 }}>{shift.title}</p>
                      <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>{shift.city} · {shift.duration}h</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 19, fontWeight: 900, color: '#111111', margin: '0 0 6px' }}>₹{w.toLocaleString('en-IN')}</p>
                      <button onClick={() => accept(shift)}
                        style={{ padding: '7px 16px', borderRadius: 12, background: '#111111', color: '#FFFFFF', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
      `}</style>
    </>
  )
}

const MILESTONES = [
  { level: 0, label: 'Starter',  emoji: '🌱', minJobs: 0,  bonus: 0   },
  { level: 1, label: 'Bronze',   emoji: '🥉', minJobs: 5,  bonus: 10  },
  { level: 2, label: 'Silver',   emoji: '🥈', minJobs: 10, bonus: 25  },
  { level: 3, label: 'Gold',     emoji: '🥇', minJobs: 25, bonus: 40  },
  { level: 4, label: 'Platinum', emoji: '💎', minJobs: 50, bonus: 60  },
]

export default function BrowsePage() {
  return <Suspense><JobsInner /></Suspense>
}
