'use client'
import { useState, useEffect } from 'react'
import { Copy, CheckCircle2, X, ShieldCheck, CreditCard } from 'lucide-react'
import EmployerTopBar from '@/components/employer/EmployerTopBar'
import EmployerBottomNav from '@/components/employer/EmployerBottomNav'

interface LiveShift {
  id: number
  name: string
  initial: string
  job: string
  location: string
  startedAt: string
  payPerHr: number
  startSeconds: number
}

const LIVE_SHIFTS: LiveShift[] = [
  { id: 1, name: 'Raju Yadav',   initial: 'R', job: 'Shop Helper',    location: 'D-Mart Andheri',   startedAt: '9:00 AM',  payPerHr: 99,  startSeconds: 8100  },
  { id: 2, name: 'Suresh Kumar', initial: 'S', job: 'Security Guard', location: 'Phoenix Mall',      startedAt: '12:00 AM', payPerHr: 109, startSeconds: 24000 },
]

const PAST_SHIFTS = [
  { id: 1, name: 'Anil Sharma',  job: 'Driver',          date: 'Yesterday',   hours: 8, amount: 1032, status: 'Paid' },
  { id: 2, name: 'Priya Patel',  job: 'Shop Helper',     date: '2 days ago',  hours: 6, amount: 594,  status: 'Paid' },
  { id: 3, name: 'Mohan Das',    job: 'Warehouse Staff', date: '3 days ago',  hours: 10, amount: 1190, status: 'Pending' },
  { id: 4, name: 'Deepak Verma', job: 'Kitchen Helper',  date: '4 days ago',  hours: 8, amount: 792,  status: 'Paid' },
  { id: 5, name: 'Kavita Singh', job: 'Office Assistant',date: '5 days ago',  hours: 6, amount: 654,  status: 'Pending' },
]

function formatSecs(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function EmployerShiftsPage() {
  const [ticks, setTicks] = useState(0)
  const [otpModal, setOtpModal] = useState<{ name: string; code: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [endedShifts, setEndedShifts] = useState<number[]>([])
  const [paySheet, setPaySheet] = useState<typeof PAST_SHIFTS[0] | null>(null)
  const [paidNow, setPaidNow] = useState<number[]>([])
  const [paySuccess, setPaySuccess] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => setTicks(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  function openOTP(name: string) {
    setOtpModal({ name, code: String(Math.floor(1000 + Math.random() * 9000)) })
    setCopied(false)
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePayNow() {
    setTimeout(() => {
      setPaySuccess(true)
      setTimeout(() => {
        if (paySheet) setPaidNow(p => [...p, paySheet.id])
        setPaySheet(null)
        setPaySuccess(false)
      }, 1500)
    }, 800)
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(56px + var(--safe-t))', paddingBottom: 'calc(88px + var(--safe-b))', background: 'var(--bg)' }}>
      <EmployerTopBar title="Shifts" unread={1} />

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Active Shifts */}
        <div>
          <p className="text-base font-black mb-3" style={{ color: 'var(--text1)' }}>Active Shifts</p>
          <div className="flex flex-col gap-3">
            {LIVE_SHIFTS.filter(s => !endedShifts.includes(s.id)).map(shift => {
              const elapsed = shift.startSeconds + ticks
              const earned = ((shift.payPerHr / 3600) * elapsed).toFixed(2)
              return (
                <div key={shift.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid rgba(20,184,166,0.2)' }}>
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', color: '#fff' }}
                      >
                        {shift.initial}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text1)' }}>{shift.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text2)' }}>{shift.job}</p>
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>{shift.location}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> LIVE
                    </span>
                  </div>

                  {/* Timer & Pay */}
                  <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>Started at {shift.startedAt}</p>
                    <p className="text-3xl font-black font-mono tracking-wider" style={{ color: '#5EEAD4' }}>
                      {formatSecs(elapsed)}
                    </p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#4ADE80' }}>₹{earned} paid so far</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openOTP(shift.name)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(20,184,166,0.12)', color: '#5EEAD4', border: '1px solid rgba(20,184,166,0.3)' }}
                    >
                      <ShieldCheck style={{ width: 15, height: 15 }} /> Generate OTP
                    </button>
                    <button
                      onClick={() => setEndedShifts(p => [...p, shift.id])}
                      className="flex-1 py-3 rounded-xl font-bold text-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      End Shift
                    </button>
                  </div>
                </div>
              )
            })}
            {endedShifts.length > 0 && LIVE_SHIFTS.every(s => endedShifts.includes(s.id)) && (
              <div className="py-8 text-center rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-3xl mb-2">✅</p>
                <p className="font-bold" style={{ color: 'var(--text2)' }}>No active shifts right now</p>
              </div>
            )}
          </div>
        </div>

        {/* Past Shifts */}
        <div>
          <p className="text-base font-black mb-3" style={{ color: 'var(--text1)' }}>Past Shifts</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {PAST_SHIFTS.map((s, i) => {
              const isPaid = s.status === 'Paid' || paidNow.includes(s.id)
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < PAST_SHIFTS.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: isPaid ? 'rgba(20,184,166,0.15)' : 'rgba(251,191,36,0.12)', color: isPaid ? '#5EEAD4' : '#FCD34D' }}
                  >
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text1)' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text2)' }}>{s.job} · {s.date} · {s.hours}h</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: '#5EEAD4' }}>₹{s.amount}</p>
                    {isPaid ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(20,184,166,0.15)', color: '#5EEAD4', border: '1px solid rgba(20,184,166,0.3)' }}>
                        ✓ Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => setPaySheet(s)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', color: '#fff' }}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid rgba(20,184,166,0.25)' }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.12)' }}>
              <ShieldCheck style={{ width: 24, height: 24, color: '#14B8A6' }} />
            </div>
            <p className="text-lg font-black mb-1" style={{ color: 'var(--text1)' }}>Employer OTP</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text2)' }}>Share with {otpModal.name} to confirm arrival</p>
            <div className="flex gap-2 justify-center mb-3">
              {otpModal.code.split('').map((d, i) => (
                <div key={i} className="w-14 h-16 rounded-2xl flex items-center justify-center text-3xl font-black" style={{ background: 'rgba(20,184,166,0.1)', border: '2px solid #14B8A6', color: '#5EEAD4' }}>
                  {d}
                </div>
              ))}
            </div>
            <button
              onClick={() => copyCode(otpModal.code)}
              className="w-full py-3 rounded-2xl font-bold text-sm mb-2 flex items-center justify-center gap-2"
              style={{ background: 'rgba(20,184,166,0.12)', color: '#5EEAD4', border: '1px solid rgba(20,184,166,0.3)' }}
            >
              {copied ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button onClick={() => setOtpModal(null)} className="w-full py-3 rounded-2xl font-bold text-sm" style={{ background: 'var(--sur2)', color: 'var(--text2)' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pay Sheet */}
      {paySheet && (
        <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => { if (!paySuccess) setPaySheet(null) }}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5" style={{ background: '#1A2535', border: '1px solid rgba(20,184,166,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--sur2)' }} />
            {paySuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3" style={{ width: 48, height: 48, color: '#14B8A6' }} />
                <p className="text-xl font-black" style={{ color: 'var(--text1)' }}>Payment Sent!</p>
                <p className="text-2xl font-black mt-1" style={{ color: '#5EEAD4' }}>₹{paySheet.amount}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>to {paySheet.name}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-base" style={{ color: 'var(--text1)' }}>Pay {paySheet.name}</p>
                    <p className="text-2xl font-black" style={{ color: '#5EEAD4' }}>₹{paySheet.amount}</p>
                  </div>
                  <button onClick={() => setPaySheet(null)}><X style={{ width: 20, height: 20, color: 'var(--text3)' }} /></button>
                </div>
                <button
                  onClick={handlePayNow}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', color: '#fff', boxShadow: '0 4px 20px rgba(6,78,59,0.5)' }}
                >
                  <CreditCard style={{ width: 18, height: 18 }} /> Pay ₹{paySheet.amount}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <EmployerBottomNav />
    </div>
  )
}
