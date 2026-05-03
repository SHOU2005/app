'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Clock, X } from 'lucide-react'
import JobIcon from './JobIcon'
import { useLang } from '@/lib/lang'

type Job = {
  id:number; emoji:string; title:string; company:string
  pay:number; hours:number; totalPay:number
  distance:string; time:string; day:string
  urgent:boolean; rating:number; slots:number; tag:string
}

/* ── Shared slide button ──────────────────────────── */
function SlideButton({
  label, doneLabel, color, onConfirm,
}: {
  label: string
  doneLabel: string
  color: string
  onConfirm: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const startX   = useRef(0)
  const curX     = useRef(0)
  const [x, setX]      = useState(0)
  const [done, setDone] = useState(false)

  const THUMB_W = 52
  const PAD     = 5

  const maxX = () => (trackRef.current?.offsetWidth ?? 320) - THUMB_W - PAD * 2

  function onDown(e: React.PointerEvent) {
    if (done) return
    startX.current = e.clientX - curX.current
    thumbRef.current?.setPointerCapture(e.pointerId)
  }
  function onMove(e: React.PointerEvent) {
    if (!thumbRef.current?.hasPointerCapture(e.pointerId)) return
    const nx = Math.max(0, Math.min(e.clientX - startX.current, maxX()))
    curX.current = nx; setX(nx)
  }
  function onUp() {
    if (curX.current >= maxX() * 0.82) {
      setX(maxX()); setDone(true); setTimeout(onConfirm, 400)
    } else { curX.current = 0; setX(0) }
  }

  const pct   = x / Math.max(maxX(), 1)
  const fillW = x + THUMB_W + PAD * 2

  return (
    <div ref={trackRef} className="relative select-none"
      style={{
        height: 62, borderRadius: 31, overflow: 'hidden',
        background: done ? '#111111' : `${color}14`,
        border: `1.5px solid ${done ? '#111111' : `${color}44`}`,
        transition: 'background 0.4s, border-color 0.3s',
      }}>

      {/* Fill track */}
      {!done && (
        <div className="absolute inset-y-0 left-0 pointer-events-none"
          style={{
            width: fillW,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            borderRadius: 31,
            transition: 'none',
          }} />
      )}

      {/* Label */}
      {!done ? (
        <div className="absolute inset-0 flex items-center pointer-events-none"
          style={{ paddingLeft: THUMB_W + PAD * 2 + 14, paddingRight: 16, opacity: Math.max(0, 1 - pct * 1.8) }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.55)' }}>{label}</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
          <CheckCircle style={{ width: 20, height: 20, color: '#FFFFFF' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{doneLabel}</span>
        </div>
      )}

      {/* Thumb */}
      <div ref={thumbRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        className="absolute flex items-center justify-center z-10"
        style={{
          top: PAD, bottom: PAD, width: THUMB_W,
          left: x + PAD,
          borderRadius: THUMB_W / 2,
          background: done ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
          boxShadow: '0 3px 14px rgba(0,0,0,0.15)',
          touchAction: 'none',
          cursor: done ? 'default' : 'grab',
          transition: done ? 'left 0.35s ease' : 'none',
        }}>
        {done
          ? <CheckCircle style={{ width: 22, height: 22, color: '#FFFFFF' }} />
          : <span style={{ fontSize: 20 }}>→</span>
        }
      </div>
    </div>
  )
}

/* ── OTP Entry Screen ─────────────────────────── */
function OTPScreen({ job, onVerified }: { job:Job; onVerified:()=>void }) {
  const { t } = useLang()
  const [otp, setOtp]     = useState(['','','',''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const DEMO_OTP = '1234'

  function handleInput(i: number, val: string) {
    const digit = val.replace(/\D/,'').slice(-1)
    const next = [...otp]; next[i] = digit; setOtp(next)
    setError(false)
    if (digit && i < 3) refs[i+1].current?.focus()
    if (!digit && i > 0) refs[i-1].current?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i-1].current?.focus()
  }

  function verify() {
    if (otp.join('') === DEMO_OTP) {
      onVerified()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setOtp(['','','',''])
      setTimeout(() => refs[0].current?.focus(), 50)
    }
  }

  const full = otp.every(d => d !== '')

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background:'#F5F5F5', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
        <Clock style={{ width:40, height:40, color:'#111111', strokeWidth:1.5 }} />
      </div>

      <p style={{ fontSize:24, fontWeight:900, color:'var(--text1)', marginBottom:8 }}>
        {t.enter_arrival_otp as string}
      </p>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:6 }}>
        {t.ask_employer_otp as string}
      </p>
      <p style={{ fontSize:13, color:'var(--text3)', marginBottom:32 }}>
        {t.starts_shift_timer as string}
      </p>

      {/* Job card */}
      <div className="w-full p-4 rounded-2xl mb-8 flex items-center gap-3 text-left"
        style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
        <JobIcon emoji={job.emoji} size={44} radius={12} />
        <div>
          <p style={{ fontSize:15, fontWeight:800, color:'var(--text1)' }}>{job.title}</p>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{job.company} · {job.time}</p>
        </div>
      </div>

      {/* OTP boxes */}
      <div className={`flex gap-3 mb-3 ${shake ? 'animate-shake' : ''}`}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{
              width:68, height:72,
              textAlign:'center',
              fontSize:30, fontWeight:900,
              borderRadius:18,
              border:`2px solid ${error ? '#DC2626' : d ? '#111111' : 'rgba(0,0,0,0.12)'}`,
              background: d ? 'rgba(0,0,0,0.05)' : '#F5F5F5',
              color:'#111111',
              outline:'none',
              transition:'border-color 0.15s, background 0.15s',
            }}
          />
        ))}
      </div>

      {error
        ? <p style={{ fontSize:13, color:'#DC2626', marginBottom:16 }}>{t.wrong_otp as string}</p>
        : <div style={{ height:36 }} />
      }

      <p style={{ fontSize:12, color:'rgba(0,0,0,0.38)', marginBottom:24 }}>
        {t.demo_otp as string}{' '}
        <span style={{ color:'#111111', fontWeight:700 }}>1234</span>
      </p>

      <button
        onClick={verify}
        disabled={!full}
        className="btn btn-primary btn-full"
        style={{
          fontSize:15, fontWeight:700, padding:'16px 24px', borderRadius:16,
          opacity: full ? 1 : 0.4,
          boxShadow: full ? '0 6px 24px rgba(255,255,255,0.15)' : 'none',
        }}
      >
        {t.confirm_arrival as string}
      </button>
    </div>
  )
}

/* ── Active Shift Timer ───────────────────────── */
function ShiftTimer({ job, onEnd }: { job:Job; onEnd:()=>void }) {
  const { t } = useLang()
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const hrs  = Math.floor(secs / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  const sec  = secs % 60
  const pad  = (n:number) => String(n).padStart(2,'0')

  const earnedSoFar = ((secs / 3600) * job.pay).toFixed(2)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {/* Pulsing ring */}
      <div className="relative mb-8">
        <div className="w-36 h-36 rounded-full flex items-center justify-center"
          style={{ background:'rgba(0,0,0,0.04)', border:'2px solid rgba(0,0,0,0.08)' }}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background:'rgba(0,0,0,0.05)', border:'2px solid rgba(0,0,0,0.1)', animation:'pulse 2s ease-in-out infinite' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background:'#111111' }}>
              <span className="w-3 h-3 rounded-full" style={{ background:'#FFFFFF', animation:'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full"
          style={{ background:'#111111', fontSize:10, fontWeight:800, color:'#FFFFFF' }}>LIVE</div>
      </div>

      <p style={{ fontSize:14, fontWeight:600, color:'var(--text3)', marginBottom:8 }}>
        {t.shift_in_progress as string}
      </p>
      <p style={{ fontSize:48, fontWeight:900, color:'var(--text1)', fontVariantNumeric:'tabular-nums', lineHeight:1, marginBottom:4 }}>
        {pad(hrs)}:{pad(mins)}:{pad(sec)}
      </p>
      <p style={{ fontSize:13, color:'var(--text3)', marginBottom:32 }}>hours : minutes : seconds</p>

      {/* Earned so far */}
      <div className="w-full p-4 rounded-2xl mb-6"
        style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)' }}>
        <p style={{ fontSize:12, color:'rgba(0,0,0,0.38)', marginBottom:4 }}>{t.earned_so_far as string}</p>
        <p style={{ fontSize:32, fontWeight:900, color:'#111111', lineHeight:1 }}>₹{earnedSoFar}</p>
        <p style={{ fontSize:12, color:'rgba(0,0,0,0.38)', marginTop:4 }}>₹{job.pay}/hr · Total ₹{job.totalPay.toLocaleString('en-IN')} after {job.hours}h</p>
      </div>

      {/* Job card */}
      <div className="w-full p-4 rounded-2xl mb-8 flex items-center gap-3 text-left"
        style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
        <JobIcon emoji={job.emoji} size={44} radius={12} />
        <div>
          <p style={{ fontSize:15, fontWeight:800, color:'var(--text1)' }}>{job.title}</p>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{job.company} · {job.distance} away</p>
        </div>
      </div>

      <div className="w-full">
        <SlideButton
          label={t.slide_to_end as string}
          doneLabel={t.shift_ended as string}
          color="#DC2626"
          onConfirm={onEnd}
        />
      </div>
      <p style={{ fontSize:12, color:'var(--text3)', marginTop:10 }}>{t.slide_to_end_sub as string}</p>
    </div>
  )
}

/* ── Main Component ───────────────────────────── */
export default function ActiveShift({ job, onClose, onDone }: { job:Job|null; onClose:()=>void; onDone:(j:Job)=>void }) {
  const { t } = useLang()
  const [visible,  setVisible]  = useState(false)
  const [verified, setVerified] = useState(false)
  const [ended,    setEnded]    = useState(false)

  useEffect(() => {
    if (job) { setVerified(false); setEnded(false); requestAnimationFrame(()=>setVisible(true)) }
    else setVisible(false)
  }, [job])

  function close() { setVisible(false); setTimeout(onClose, 320) }
  function endShift() {
    setEnded(true)
    setTimeout(() => { setVisible(false); setTimeout(() => onDone(job!), 320) }, 1200)
  }

  if (!job) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:'#FFFFFF',
        paddingTop:'var(--safe-t)', paddingBottom:'var(--safe-b)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition:'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0"
        style={{ borderBottom:'1px solid var(--border)' }}>
        <p style={{ fontSize:17, fontWeight:800, color:'var(--text1)' }}>
          {verified ? t.active_shift as string : t.confirm_arrival_ttl as string}
        </p>
        {!verified && (
          <button onClick={close} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background:'var(--surface)' }}>
            <X style={{ width:18, height:18, color:'var(--text2)' }} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {!verified
          ? <OTPScreen job={job} onVerified={() => setVerified(true)} />
          : <ShiftTimer job={job} onEnd={endShift} />
        }
      </div>
    </div>
  )
}
