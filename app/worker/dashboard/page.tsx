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
import { useLanguage } from '@/app/worker/LanguageContext'

export default function WorkerDashboard() {
  const { t } = useLanguage()
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

  const h = new Date().getHours()
  const greeting = h < 12 ? t('goodMorning') : h < 17 ? t('goodAfternoon') : t('goodEvening')

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
            <p className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>{greeting} 👋</p>
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
              <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(0,0,0,0.45)' }}>{t('totalEarned')}</p>
              <p className="text-3xl font-black" style={{ color: '#111111' }}>{formatCurrency(earnings)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#111111' }}>
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {[
              { label: t('shiftsDone'),  value: totalShifts },
              { label: t('rating'),      value: `${rating.toFixed(1)}★` },
              { label: t('activeJobs'),  value: active.length },
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
                {kycPending ? t('verificationInProgress') : t('verifyAadhaar')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {kycPending ? t('usuallyDone24h') : t('takes2Min')}
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
              <p className="font-bold text-sm" style={{ color: '#111111' }}>{t('findJobs')}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>{nearby.length} {t('shiftsNearby')}</p>
            </div>
          </Link>

          <Link href="/worker/earnings" className="card p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#111111' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#111111' }}>{t('myEarnings')}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>{t('viewHistory')}</p>
            </div>
          </Link>
        </div>

        {/* Nearby jobs */}
        {nearby.length > 0 && (
          <div className="animate-fade-up stagger-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: '#111111' }}>{t('shiftsNearYou')}</p>
              <Link href="/worker/jobs" className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'rgba(0,0,0,0.5)' }}>
                {t('seeAll')} <ChevronRight className="w-3.5 h-3.5" />
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
              <p className="text-sm font-bold" style={{ color: '#111111' }}>{t('recentShifts')}</p>
              <Link href="/worker/earnings" className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'rgba(0,0,0,0.5)' }}>
                {t('viewHistory')} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {bookings.slice(0, 4).map((b: Record<string,unknown>, i: number) => {
                const shift = b.shift as Record<string,unknown>
                const status = b.status as string
                const statusColor = status === 'CANCELLED' ? 'text-red-500' : ''
                const statusLabel: Record<string,string> = {
                  COMPLETED: t('statusDone'), CONFIRMED: t('statusConfirmed'), IN_PROGRESS: t('statusInProgress'),
                  PENDING: t('statusPending'), CANCELLED: t('statusCancelled'), NO_SHOW: t('statusNoShow'),
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
            <p className="font-bold mb-1" style={{ color: '#111111' }}>{t('noShiftsYet')}</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(0,0,0,0.42)' }}>{t('acceptFirstJob')}</p>
            <Link href="/worker/jobs" className="btn btn-primary btn-md inline-flex">
              {t('browseJobs')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
      <BottomNav active="/" />
    </div>
  )
}

function JobMiniCard({ job, idx = 0 }: { job: Record<string,unknown>; idx?: number }) {
  const { t } = useLanguage()
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
          <span>{job.duration as number}h {t('hours')}</span>
          {(job.isUrgent as boolean) && (
            <span className="flex items-center gap-0.5 font-semibold" style={{ color: '#DC2626' }}>
              <Zap className="w-3 h-3" /> {t('urgent')}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black" style={{ color: '#111111' }}>{formatCurrency(earn)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(0,0,0,0.35)' }}>{t('youEarn')}</p>
      </div>
    </Link>
  )
}

function ActiveShiftCard({ booking, onArrived }: { booking: Record<string,unknown>; onArrived: () => void }) {
  const { t }      = useLanguage()
  const shift      = booking.shift as Record<string,unknown>
  const isActive   = booking.status === 'IN_PROGRESS'
  const alreadyArrived = !!(booking.checkInTime)
  const trackWidth = 280
  const thumbW     = 56

  const [pos,           setPos]          = useState(0)
  const [sliding,       setSliding]      = useState(false)
  const [arrived,       setArrived]      = useState(alreadyArrived)
  const [loading,       setLoading]      = useState(false)
  const [shiftStarted,  setShiftStarted] = useState(isActive)
  const [otp,           setOtp]          = useState('')
  const [otpError,      setOtpError]     = useState('')
  const [verifying,     setVerifying]    = useState(false)
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
      setLoading(true)
      await fetch('/api/worker/arrive', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId: booking.id }),
      }).catch(console.error)
      setLoading(false)
      setArrived(true)
      onArrived()
    } else {
      setPos(0)
    }
  }, [sliding, pos, booking.id, onArrived])

  async function verifyOTP() {
    if (otp.length !== 4) return
    setVerifying(true)
    setOtpError('')
    try {
      const res = await fetch(`/api/employer/jobs/${(shift as any).id}/otp`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ otp }),
      })
      if (!res.ok) {
        setOtpError(t('invalidOTP'))
        setOtp('')
      } else {
        setShiftStarted(true)
      }
    } catch {
      setOtpError(t('invalidOTP'))
    } finally {
      setVerifying(false)
    }
  }

  const address = (shift?.address || shift?.city || '') as string
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=transit`

  return (
    <div className="rounded-2xl p-4 animate-fade-up" style={{ background: '#111111', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <p className="text-[10px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {shiftStarted ? t('shiftInProgress') : t('confirmedShift')}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-black text-white text-base">{shift?.title as string}</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {formatTime(shift?.startTime as string)} – {formatTime(shift?.endTime as string)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-white">{formatCurrency(booking.workerEarning as number)}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('yourShare')}</p>
        </div>
      </div>

      {/* Get Directions button — always visible */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', height: 44, borderRadius: 12, marginBottom: 10,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#FFFFFF', fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}
      >
        <MapPin style={{ width: 16, height: 16 }} />
        {t('getDirections')}
      </a>

      {/* Phase 1: Slide to arrive */}
      {!arrived && !shiftStarted && (
        <div
          ref={railRef}
          style={{
            position: 'relative', width: '100%', height: 60, borderRadius: 30,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden', userSelect: 'none' as const,
          }}
          onMouseDown={e => onStart(e.clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onMouseMove={e => onMove(e.clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={e => onStart(e.touches[0].clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onTouchMove={e => onMove(e.touches[0].clientX - (railRef.current?.getBoundingClientRect().left || 0))}
          onTouchEnd={onEnd}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pos + thumbW / 2, background: 'rgba(255,255,255,0.06)', transition: sliding ? 'none' : 'width 0.25s' }} />
          <p style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.38)', pointerEvents: 'none' as const }}>
            {t('slideToArrive')}
          </p>
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
      )}

      {/* Phase 2: Arrived — enter OTP to start */}
      {arrived && !shiftStarted && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', padding: '14px 14px 12px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px', textAlign: 'center' as const }}>
            📍 {t('arrivedBanner')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              maxLength={4}
              value={otp}
              onChange={e => { setOtp(e.target.value.slice(0, 4)); setOtpError('') }}
              placeholder={t('otpPlaceholder4')}
              style={{
                flex: 1, height: 48, borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: 22, fontWeight: 900,
                textAlign: 'center' as const, letterSpacing: 6, outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={verifyOTP}
              disabled={otp.length !== 4 || verifying}
              style={{
                flex: 1, height: 48, borderRadius: 12, border: 'none',
                background: otp.length === 4 ? '#22C55E' : 'rgba(255,255,255,0.12)',
                color: otp.length === 4 ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                fontSize: 13, fontWeight: 800, cursor: otp.length === 4 ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              {verifying ? t('verifyingOTP') : t('verifyAndStart')}
            </button>
          </div>
          {otpError && <p style={{ fontSize: 12, color: '#FF3B30', margin: '8px 0 0', textAlign: 'center' as const }}>{otpError}</p>}
        </div>
      )}

      {/* Phase 3: Shift started */}
      {shiftStarted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 14, border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle style={{ width: 18, height: 18, color: '#22C55E' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', margin: 0 }}>{t('shiftStarted')}</p>
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
