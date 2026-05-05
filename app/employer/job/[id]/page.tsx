'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const EmpMap        = dynamic(() => import('@/components/employer/EmpMap'),        { ssr: false })
const WorkerMapView = dynamic(() => import('@/components/employer/WorkerMapView'), { ssr: false })

const BG   = '#080808'
const S1   = '#111111'
const S2   = '#181818'
const BD   = 'rgba(255,255,255,0.07)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.2)'
const GOLD = '#F5C518'
const FONT = '"DM Sans", system-ui, -apple-system, sans-serif'

const STATUS_STEPS = [
  { key: 'SEARCHING',  label: 'Search'   },
  { key: 'ASSIGNED',   label: 'Assigned' },
  { key: 'ON_THE_WAY', label: 'En Route' },
  { key: 'ARRIVED',    label: 'Arrived'  },
  { key: 'STARTED',    label: 'Started'  },
  { key: 'COMPLETED',  label: 'Done'     },
]

function OTPDisplay({ jobId }: { jobId: string }) {
  const [otp,        setOtp]        = useState('')
  const [expiry,     setExpiry]     = useState<Date | null>(null)
  const [timeLeft,   setTimeLeft]   = useState(0)
  const [generating, setGenerating] = useState(false)
  const [copied,     setCopied]     = useState(false)

  useEffect(() => {
    if (!expiry) return
    const iv = setInterval(() => {
      const diff = Math.floor((expiry.getTime() - Date.now()) / 1000)
      setTimeLeft(Math.max(0, diff))
      if (diff <= 0) { setOtp(''); setExpiry(null) }
    }, 1000)
    return () => clearInterval(iv)
  }, [expiry])

  async function generateOTP() {
    setGenerating(true)
    try {
      const res  = await fetch(`/api/employer/jobs/${jobId}/otp`, { method: 'POST' })
      const data = await res.json()
      if (data.otp) { setOtp(data.otp); setExpiry(new Date(data.expiresAt)); setTimeLeft(300) }
    } finally { setGenerating(false) }
  }

  function copyOTP() {
    navigator.clipboard?.writeText(otp).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  return (
    <div style={{ background: S1, borderRadius: 20, padding: 20, marginBottom: 12, border: `1px solid ${BD}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: S2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BD}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T1 }}>Job Start OTP</div>
          <div style={{ fontSize: 12, color: T2 }}>Share with worker to begin</div>
        </div>
      </div>

      {otp ? (
        <>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
            {otp.split('').map((d, i) => (
              <div key={i} style={{
                width: 58, height: 66, borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 900, color: T1,
                background: S2, border: `2px solid ${T1}`,
                fontFamily: 'monospace',
              }}>{d}</div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, marginBottom: 14, color: timeLeft < 60 ? '#EF4444' : T2, fontWeight: 600 }}>
            Expires in {mins}:{secs}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyOTP} style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              border: `1.5px solid ${copied ? T1 : BD}`,
              background: copied ? T1 : 'transparent',
              color: copied ? '#000' : T1,
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
            }}>{copied ? '✓ Copied' : 'Copy OTP'}</button>
            <button onClick={generateOTP} style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: `1px solid ${BD}`,
              background: S2, color: T2, fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: FONT,
            }}>Regenerate</button>
          </div>
        </>
      ) : (
        <button onClick={generateOTP} disabled={generating} style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
          background: T1, color: '#000', fontWeight: 800, fontSize: 15,
          opacity: generating ? 0.7 : 1, fontFamily: FONT,
        }}>
          {generating ? 'Generating...' : 'Generate OTP'}
        </button>
      )}
    </div>
  )
}

export default function JobDetailPage() {
  const { id }          = useParams<{ id: string }>()
  const router          = useRouter()
  const [job,           setJob]       = useState<any>(null)
  const [worker,        setWorker]    = useState<any>(null)
  const [loading,       setLoading]   = useState(true)
  const [completing,    setCompleting] = useState(false)
  const [confirming,    setConfirming] = useState<string | null>(null)
  const pollRef = useRef<any>(null)

  async function load() {
    try {
      const res  = await fetch(`/api/employer/jobs/${id}`)
      const data = await res.json()
      if (data.job) {
        setJob(data.job)
        const confirmed = data.job.bookings?.find((b: any) => ['CONFIRMED','IN_PROGRESS','COMPLETED'].includes(b.status))
        const pending   = data.job.bookings?.find((b: any) => b.status === 'PENDING')
        const b = confirmed || pending
        if (b?.worker) setWorker(b.worker)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  async function confirmWorker(bookingId: string) {
    setConfirming(bookingId)
    try {
      const res = await fetch(`/api/employer/bookings/${bookingId}`, { method: 'POST' })
      if (res.ok) {
        await load()
        router.push(`/employer/job/${id}/payment`)
      }
    } finally { setConfirming(null) }
  }

  async function completeJob() {
    setCompleting(true)
    try {
      await fetch(`/api/employer/jobs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'COMPLETED' }) })
      router.replace(`/employer/job/${id}/payment`)
    } finally { setCompleting(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ color: T2, fontSize: 16 }}>Loading...</div>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: T1, fontWeight: 700, marginBottom: 16 }}>Job not found</div>
        <button onClick={() => router.replace('/employer')} style={{ padding: '12px 24px', borderRadius: 14, background: T1, color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Go Home</button>
      </div>
    </div>
  )

  const statusIdx   = STATUS_STEPS.findIndex(s => s.key === job.status)
  const currentStep = STATUS_STEPS[statusIdx] || STATUS_STEPS[0]
  const isOpen      = job.status === 'OPEN'
  const isSearching = job.status === 'SEARCHING'
  const isAssigned  = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(job.status)
  const isStarted   = job.status === 'IN_PROGRESS'
  const isCompleted = job.status === 'COMPLETED'
  const workerName  = worker?.user?.name || 'Worker'
  const workerInit  = workerName[0]?.toUpperCase() || 'W'
  const pendingBookings = job.bookings?.filter((b: any) => b.status === 'PENDING') || []
  const confirmedBooking = job.bookings?.find((b: any) => ['CONFIRMED','IN_PROGRESS','COMPLETED'].includes(b.status))

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: T1 }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: BG, borderBottom: `1px solid ${BD}`,
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 14, paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.replace('/employer')} style={{
            width: 40, height: 40, borderRadius: 20, border: `1px solid ${BD}`,
            background: S1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: T1 }}>{job.title}</div>
            <div style={{ fontSize: 12, color: T2, marginTop: 1 }}>{currentStep.label}</div>
          </div>
          {!isCompleted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: S1, padding: '6px 12px', borderRadius: 20, border: `1px solid ${BD}` }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isStarted ? '#10B981' : isSearching ? GOLD : '#60A5FA',
                animation: 'livePulse 1.5s ease infinite',
              }} />
              <span style={{ fontSize: 12, color: T1, fontWeight: 600 }}>
                {isSearching ? 'Searching' : isStarted ? 'Live' : 'Active'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'fixed', top: 'calc(62px + env(safe-area-inset-top))', left: 0, right: 0, height: '28vh', zIndex: 10 }}>
        {worker?.lat && worker?.lng ? (
          <WorkerMapView
            pins={[{
              id: String(worker.id ?? 'w1'),
              name: workerName,
              lat: Number(worker.lat),
              lng: Number(worker.lng),
              job: job.title,
              status: isStarted ? 'live' : 'pending',
            }]}
            centerLat={Number(job.lat) || Number(worker.lat) || 19.076}
            centerLng={Number(job.lng) || Number(worker.lng) || 72.877}
          />
        ) : (
          <EmpMap showWorker={!!worker} workerInitial={workerInit} />
        )}
      </div>

      <div style={{ paddingTop: 'calc(62px + env(safe-area-inset-top) + 28vh)', padding: 'calc(62px + env(safe-area-inset-top) + 28vh) 16px 48px' }}>

        {/* Progress stepper */}
        <div style={{ background: S1, borderRadius: 18, padding: '14px 12px', marginBottom: 12, overflowX: 'auto', border: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content' }}>
            {STATUS_STEPS.map((s, i) => {
              const done    = i < statusIdx
              const current = i === statusIdx
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#10B981' : current ? T1 : S2,
                      border: `2px solid ${done ? '#10B981' : current ? T1 : BD}`,
                      color: (done || current) ? (current ? '#000' : '#fff') : T3,
                      fontWeight: 800, fontSize: 11,
                    }}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : i + 1}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: current ? 700 : 500, whiteSpace: 'nowrap' as const, color: current ? T1 : done ? '#10B981' : T3 }}>{s.label}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 22, height: 2, background: done ? '#10B981' : BD, margin: '0 4px', marginBottom: 18, borderRadius: 1 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Open / Searching state */}
        {(isOpen || isSearching) && pendingBookings.length === 0 && (
          <div style={{ background: S1, borderRadius: 20, padding: '24px', marginBottom: 12, textAlign: 'center', border: `1px solid ${BD}` }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: S2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `1px solid ${BD}` }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: GOLD, animation: 'livePulse 1s ease infinite' }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T1, marginBottom: 6 }}>
              {job.isUrgent ? 'Waiting for workers to accept…' : 'Open for applications'}
            </div>
            <div style={{ fontSize: 13, color: T2 }}>
              {job.isUrgent ? 'Notifications sent to nearby workers' : 'Workers can apply — you pick who to confirm'}
            </div>
          </div>
        )}

        {/* Pending applicants (scheduled jobs) */}
        {pendingBookings.length > 0 && !confirmedBooking && (
          <div style={{ background: S1, borderRadius: 20, padding: 20, marginBottom: 12, border: `1px solid ${BD}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
              {pendingBookings.length} Applicant{pendingBookings.length > 1 ? 's' : ''}
            </div>
            {pendingBookings.map((b: any) => {
              const wName  = b.worker?.user?.name || 'Worker'
              const wInit  = wName[0]?.toUpperCase() || 'W'
              const rating = b.worker?.rating || 4.5
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${BD}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: S2, border: `1.5px solid ${T1}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T1, fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{wInit}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>{wName}</div>
                    <div style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>★ {rating.toFixed(1)}</div>
                  </div>
                  <button
                    onClick={() => confirmWorker(b.id)}
                    disabled={!!confirming}
                    style={{ padding: '10px 20px', borderRadius: 12, background: T1, color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: confirming ? 'default' : 'pointer', opacity: confirming ? 0.7 : 1, fontFamily: FONT }}>
                    {confirming === b.id ? 'Confirming…' : 'Confirm & Pay'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Worker card */}
        {worker && (
          <div style={{ background: S1, borderRadius: 20, padding: 20, marginBottom: 12, border: `1px solid ${BD}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, marginBottom: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Assigned Worker</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                background: S2, border: `2px solid ${T1}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T1, fontWeight: 900, fontSize: 22, flexShrink: 0,
              }}>{workerInit}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: T1 }}>{workerName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>★ {worker.rating || '4.8'}</span>
                  <span style={{ fontSize: 12, color: T2 }}>{worker.totalShifts || 0} jobs</span>
                  <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>Verified</span>
                </div>
              </div>
              {worker.user?.phone && (
                <a href={`tel:+91${worker.user.phone}`} style={{
                  width: 44, height: 44, borderRadius: 22,
                  background: S2, border: `1px solid ${BD}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
              )}
            </div>
            {job.status === 'ON_THE_WAY' && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#60A5FA', animation: 'livePulse 1.5s ease infinite' }} />
                <span style={{ fontSize: 13, color: '#60A5FA', fontWeight: 600 }}>Worker is on the way · ETA ~15 min</span>
              </div>
            )}
          </div>
        )}

        {/* OTP */}
        {(isAssigned || isStarted) && <OTPDisplay jobId={id} />}

        {/* Job details */}
        <div style={{ background: S1, borderRadius: 20, padding: '2px 18px 18px', marginBottom: 12, border: `1px solid ${BD}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, padding: '14px 0 10px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Job Details</div>
          {[
            { label: 'Service',  value: job.title },
            { label: 'Address',  value: job.address },
            { label: 'Duration', value: `${job.duration}h` },
            { label: 'Rate',     value: `₹${job.hourlyRate}/hr` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BD}`, alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 14, color: T2, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T1, textAlign: 'right' as const }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: T1 }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: T1 }}>₹{job.hourlyRate * job.duration}</span>
          </div>
        </div>

        {/* Action buttons */}
        {/* Urgent: worker accepted → employer must pay to confirm */}
        {job.isUrgent && isAssigned && confirmedBooking?.status === 'PENDING' && (
          <button onClick={() => router.push(`/employer/job/${id}/payment`)} style={{
            width: '100%', padding: '18px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#FFFFFF', color: '#000', fontWeight: 900, fontSize: 17, fontFamily: FONT,
            marginBottom: 10,
          }}>
            Pay & Confirm Worker
          </button>
        )}

        {isStarted && (
          <button onClick={completeJob} disabled={completing} style={{
            width: '100%', padding: '18px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#FFFFFF', color: '#000', fontWeight: 900, fontSize: 17,
            opacity: completing ? 0.7 : 1, fontFamily: FONT,
          }}>
            {completing ? 'Completing...' : 'Mark Job Complete'}
          </button>
        )}

        {isCompleted && (
          <button onClick={() => router.replace(`/employer/job/${id}/payment`)} style={{
            width: '100%', padding: '18px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#FFFFFF', color: '#000000', fontWeight: 900, fontSize: 17,
            fontFamily: FONT,
          }}>
            Pay Worker
          </button>
        )}
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.82); }
        }
      `}</style>
    </div>
  )
}
