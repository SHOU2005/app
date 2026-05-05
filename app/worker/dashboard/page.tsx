'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Zap, MapPin, Clock,
  IndianRupee, ChevronRight, Bell, Briefcase,
  TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import BottomNav from '@/components/shared/BottomNav'

const GREETING = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WorkerDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user,     setUser]     = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bookings, setBookings] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nearby,   setNearby]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/shifts').then(r => r.json()),
    ]).then(([u, b, s]) => {
      setUser(u.user)
      setBookings(b.bookings ?? [])
      setNearby((s.shifts ?? []).slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const profile     = user?.workerProfile
  const earnings    = profile?.totalEarnings  ?? 0
  const totalShifts = profile?.totalShifts    ?? 0
  const rating      = profile?.rating         ?? 0
  const kycOk       = profile?.kycStatus      === 'APPROVED'
  const kycPending  = profile?.kycStatus      === 'PENDING'
  const active      = bookings.filter((b: { status: string }) => ['CONFIRMED','IN_PROGRESS'].includes(b.status))
  const firstName   = user?.name?.split(' ')[0] ?? 'Worker'

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF', paddingBottom: 'calc(80px + var(--safe-b))' }}>

      {/* ── HEADER ─────────────────────────── */}
      <div
        className="px-5 pb-8"
        style={{
          background: '#FFFFFF',
          paddingTop: 'calc(24px + var(--safe-t))',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>{GREETING()} 👋</p>
            <p className="text-xl font-black mt-0.5" style={{ color: '#111111' }}>{firstName}</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center relative rounded-xl"
            style={{ background: '#F0F0F0', border: '1px solid rgba(0,0,0,0.08)' }}>
            <Bell className="w-5 h-5" style={{ color: 'rgba(0,0,0,0.6)' }} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#DC2626' }} />
          </button>
        </div>

        {/* Earnings card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#F5F5F5', border: '1px solid rgba(0,0,0,0.09)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(0,0,0,0.45)' }}>Total Earned</p>
              <p className="text-3xl font-black" style={{ color: '#111111' }}>{formatCurrency(earnings)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#111111' }}>
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {[
              { label: 'Shifts Done',  value: totalShifts },
              { label: 'Rating',       value: `${rating.toFixed(1)}★` },
              { label: 'Active Jobs',  value: active.length },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-black" style={{ color: '#111111' }}>{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-4 pb-28">

        {/* KYC alert */}
        {!kycOk && (
          <Link
            href="/worker/onboarding"
            className="flex items-center gap-3 rounded-2xl p-4 active:scale-[0.98] transition-transform animate-fade-up"
            style={{
              background: '#111111',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {kycPending ? <Clock className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">
                {kycPending ? 'Verification in progress ⏳' : '⚠️ Verify your Aadhaar to start'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {kycPending ? 'Usually done within 24 hours' : 'Takes 2 minutes. Unlock all jobs.'}
              </p>
            </div>
            {!kycPending && <ArrowRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />}
          </Link>
        )}

        {/* Active shift card */}
        {active.length > 0 && (
          <ActiveShiftCard booking={active[0]} onArrived={() => {
            setBookings(bs => bs.map((b: Record<string,unknown>) =>
              b.id === active[0].id ? { ...b, status: 'IN_PROGRESS' } : b
            ))
          }} />
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up stagger-1">
          <Link href="/worker/jobs" className="card p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#111111' }}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#111111' }}>Find Jobs</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>{nearby.length} shifts nearby</p>
            </div>
          </Link>

          <Link href="/worker/earnings" className="card p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#111111' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#111111' }}>My Earnings</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>View history</p>
            </div>
          </Link>
        </div>

        {/* Nearby jobs */}
        {nearby.length > 0 && (
          <div className="animate-fade-up stagger-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: '#111111' }}>Shifts Near You</p>
              <Link href="/worker/jobs" className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'rgba(0,0,0,0.5)' }}>
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {nearby.map((j: Record<string,unknown>, i: number) => (
                <JobMiniCard key={j.id as string} job={j} idx={i} />
              ))}
            </div>
          </div>
        )}

        {/* Recent bookings */}
        {bookings.length > 0 && (
          <div className="animate-fade-up stagger-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: '#111111' }}>Recent Shifts</p>
              <Link href="/worker/earnings" className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'rgba(0,0,0,0.5)' }}>
                History <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {bookings.slice(0, 4).map((b: Record<string,unknown>, i: number) => {
                const shift = b.shift as Record<string,unknown>
                const status = b.status as string
                const statusColor = status === 'CANCELLED' ? 'text-red-500' : ''
                const statusLabel: Record<string,string> = {
                  COMPLETED: 'Done ✓', CONFIRMED: 'Confirmed', IN_PROGRESS: 'Active',
                  PENDING: 'Pending', CANCELLED: 'Cancelled', NO_SHOW: 'No Show',
                }
                return (
                  <div
                    key={b.id as string}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,0,0,0.05)' }}>
                      <Clock className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>{shift?.title as string}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
                        {formatDate(shift?.date as string)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: '#111111' }}>{formatCurrency(b.workerEarning as number)}</p>
                      <p className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel[status] ?? status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {bookings.length === 0 && !loading && (
          <div className="card p-10 text-center animate-fade-up">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-bold mb-1" style={{ color: '#111111' }}>No shifts yet</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(0,0,0,0.42)' }}>Accept your first job and start earning</p>
            <Link href="/worker/jobs" className="btn btn-primary btn-md inline-flex">
              Browse Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
      <BottomNav active="/" />
    </div>
  )
}

function JobMiniCard({ job, idx = 0 }: { job: Record<string,unknown>; idx?: number }) {
  const earn = (job.hourlyRate as number) * 0.625 * (job.duration as number)
  return (
    <Link
      href="/worker/jobs"
      className="card px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform animate-fade-up"
      style={{ animationDelay: `${idx * 0.07}s`, display: 'flex' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.06)' }}>
        <MapPin className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.45)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: '#111111' }}>{job.title as string}</p>
        <div className="flex items-center gap-2 text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
          <span>{job.city as string}</span>
          <span>·</span>
          <span>{job.duration as number}h shift</span>
          {(job.isUrgent as boolean) && (
            <span className="flex items-center gap-0.5 font-semibold" style={{ color: '#DC2626' }}>
              <Zap className="w-3 h-3" /> Urgent
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black" style={{ color: '#111111' }}>{formatCurrency(earn)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(0,0,0,0.35)' }}>you earn</p>
      </div>
    </Link>
  )
}

function ActiveShiftCard({ booking, onArrived }: { booking: Record<string,unknown>; onArrived: () => void }) {
  const shift      = booking.shift as Record<string,unknown>
  const isActive   = booking.status === 'IN_PROGRESS'
  const trackWidth = 280
  const thumbW     = 56

  const [pos,      setPos]      = useState(0)
  const [sliding,  setSliding]  = useState(false)
  const [done,     setDone]     = useState(isActive)
  const [loading,  setLoading]  = useState(false)
  const startX     = useRef(0)
  const railRef    = useRef<HTMLDivElement>(null)

  const onStart = useCallback((x: number) => { startX.current = x; setSliding(true) }, [])
  const onMove  = useCallback((x: number) => {
    if (!sliding) return
    const max = trackWidth - thumbW - 4
    setPos(Math.max(0, Math.min(max, x - startX.current)))
  }, [sliding])
  const onEnd   = useCallback(async () => {
    if (!sliding) return
    setSliding(false)
    const max = trackWidth - thumbW - 4
    if (pos >= max - 20) {
      setDone(true)
      setLoading(true)
      await fetch('/api/worker/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      }).catch(console.error)
      setLoading(false)
      onArrived()
    } else {
      setPos(0)
    }
  }, [sliding, pos, booking.id, onArrived])

  return (
    <div className="rounded-2xl p-4 animate-fade-up" style={{ background: '#111111', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <p className="text-[10px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {done ? 'SHIFT IN PROGRESS' : 'CONFIRMED SHIFT'}
        </p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-white text-base">{shift?.title as string}</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {formatTime(shift?.startTime as string)} – {formatTime(shift?.endTime as string)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-white">{formatCurrency(booking.workerEarning as number)}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>your share</p>
        </div>
      </div>

      {!done ? (
        <div
          ref={railRef}
          style={{
            position: 'relative', width: trackWidth, height: 60, borderRadius: 30,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden', userSelect: 'none',
          }}
          onMouseDown={e => onStart(e.clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onMouseMove={e => onMove(e.clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={e => onStart(e.touches[0].clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onTouchMove={e => onMove(e.touches[0].clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onTouchEnd={onEnd}
        >
          {/* Fill */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pos + thumbW / 2, background: 'rgba(255,255,255,0.08)', transition: sliding ? 'none' : 'width 0.25s' }} />
          {/* Label */}
          <p style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>Slide to Arrive →</p>
          {/* Thumb */}
          <div style={{
            position: 'absolute', left: pos + 2, top: 2, width: thumbW, height: thumbW, borderRadius: thumbW / 2,
            background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            transition: sliding ? 'none' : 'left 0.25s cubic-bezier(0.34,1.2,0.64,1)',
            cursor: 'grab',
          }}>
            {loading
              ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(0,0,0,0.15)', borderTopColor: '#111', animation: 'spin 0.7s linear infinite' }} />
              : <ArrowRight style={{ width: 22, height: 22, color: '#111111' }} />
            }
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 14, border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle style={{ width: 18, height: 18, color: '#22C55E' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', margin: 0 }}>Arrived at location — shift started!</p>
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ background: '#FFFFFF' }}>
      <div className="h-64" style={{ background: '#F5F5F5' }} />
      <div className="px-4 pt-4 space-y-3">
        {[200, 80, 80, 160, 200].map((h, i) => (
          <div key={i} className="skel" style={{ height: `${h}px` }} />
        ))}
      </div>
    </div>
  )
}
