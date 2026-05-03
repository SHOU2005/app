'use client'
import { useState } from 'react'
import { Phone, Check, X, Star, ShieldCheck, Repeat2 } from 'lucide-react'
import EmployerTopBar from '@/components/employer/EmployerTopBar'
import EmployerBottomNav from '@/components/employer/EmployerBottomNav'

const WORKING_NOW = [
  { id: 1, name: 'Raju Yadav',    initial: 'R', job: 'Shop Helper',    elapsed: '2h 15m', earned: 223, phone: '9876543210' },
  { id: 2, name: 'Suresh Kumar',  initial: 'S', job: 'Security Guard', elapsed: '6h 40m', earned: 726, phone: '9123456780' },
]

const APPLIED = [
  { id: 1, name: 'Anil Sharma',  initial: 'A', rating: 4.7, jobs: 23, skills: ['Loading', 'Stocking'],    aadhaar: true,  appliedFor: 'Warehouse Staff' },
  { id: 2, name: 'Priya Patel',  initial: 'P', rating: 4.5, jobs: 11, skills: ['Cashier', 'Customer Service'], aadhaar: true,  appliedFor: 'Shop Helper' },
  { id: 3, name: 'Mohan Das',    initial: 'M', rating: 4.8, jobs: 37, skills: ['Driving', 'Navigation'],  aadhaar: false, appliedFor: 'Driver' },
]

const ALL_WORKERS = [
  { id: 1, name: 'Raju Yadav',    initial: 'R', rating: 4.8, timesHired: 5, lastWorked: '2 days ago' },
  { id: 2, name: 'Suresh Kumar',  initial: 'S', rating: 4.6, timesHired: 3, lastWorked: 'Yesterday' },
  { id: 3, name: 'Anil Sharma',   initial: 'A', rating: 4.7, timesHired: 2, lastWorked: '1 week ago' },
  { id: 4, name: 'Deepak Verma',  initial: 'D', rating: 4.5, timesHired: 1, lastWorked: '2 weeks ago' },
  { id: 5, name: 'Kavita Singh',  initial: 'K', rating: 4.9, timesHired: 4, lastWorked: '3 days ago' },
]

const TABS = ['Working Now', 'Applied', 'All Workers'] as const
type Tab = typeof TABS[number]

export default function EmployerWorkersPage() {
  const [tab, setTab] = useState<Tab>('Working Now')
  const [accepted, setAccepted] = useState<number[]>([])
  const [rejected, setRejected] = useState<number[]>([])
  const [endedShifts, setEndedShifts] = useState<number[]>([])

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(56px + var(--safe-t))', paddingBottom: 'calc(88px + var(--safe-b))', background: 'var(--bg)' }}>
      <EmployerTopBar title="Workers" unread={3} />

      {/* Tab bar */}
      <div className="sticky top-14 z-30 px-4 py-3 flex gap-1.5 overflow-x-auto" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-shrink-0 py-2.5 px-4 rounded-xl font-bold text-sm"
            style={{
              background: tab === t ? 'linear-gradient(135deg,#064E3B,#0D9488)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--text2)',
              border: tab === t ? 'none' : '1px solid var(--border)',
            }}
          >
            {t}
            {t === 'Applied' && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                {APPLIED.filter(a => !accepted.includes(a.id) && !rejected.includes(a.id)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">

        {/* ── Working Now ── */}
        {tab === 'Working Now' && (
          <>
            {WORKING_NOW.filter(w => !endedShifts.includes(w.id)).map(w => (
              <div key={w.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)' }}
                  >
                    {w.initial}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-base" style={{ color: 'var(--text1)' }}>{w.name}</p>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text2)' }}>{w.job}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> LIVE
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: 'var(--text1)' }}>{w.elapsed}</p>
                    <p className="text-xs" style={{ color: '#5EEAD4' }}>₹{w.earned} earned</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`tel:+91${w.phone}`}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' }}
                  >
                    <Phone style={{ width: 15, height: 15 }} /> Contact
                  </a>
                  <button
                    onClick={() => setEndedShifts(p => [...p, w.id])}
                    className="flex-1 py-3 rounded-xl font-bold text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ))}
            {endedShifts.length > 0 && (
              <p className="text-center text-sm py-4" style={{ color: 'var(--text3)' }}>
                {endedShifts.length} shift{endedShifts.length > 1 ? 's' : ''} marked complete
              </p>
            )}
            {WORKING_NOW.filter(w => !endedShifts.includes(w.id)).length === 0 && endedShifts.length === WORKING_NOW.length && (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-bold" style={{ color: 'var(--text2)' }}>All shifts completed</p>
              </div>
            )}
          </>
        )}

        {/* ── Applied ── */}
        {tab === 'Applied' && APPLIED.map(a => (
          <div key={a.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {a.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-bold text-sm" style={{ color: 'var(--text1)' }}>{a.name}</p>
                  {a.aadhaar && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(20,184,166,0.12)', color: '#5EEAD4' }}>
                      <ShieldCheck style={{ width: 10, height: 10 }} /> Aadhaar ✓
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>
                  <Star style={{ width: 11, height: 11, display: 'inline', color: '#FBBF24', fill: '#FBBF24' }} /> {a.rating} · {a.jobs} jobs done
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Applied for: <span style={{ color: '#5EEAD4' }}>{a.appliedFor}</span></p>
              </div>
            </div>

            {/* Skills */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {a.skills.map(s => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--sur2)', color: 'var(--text2)' }}>{s}</span>
              ))}
            </div>

            {/* Accept / Reject */}
            {accepted.includes(a.id) ? (
              <div className="py-3 rounded-xl text-center font-bold text-sm" style={{ background: 'rgba(20,184,166,0.12)', color: '#5EEAD4', border: '1px solid rgba(20,184,166,0.3)' }}>
                ✓ Accepted
              </div>
            ) : rejected.includes(a.id) ? (
              <div className="py-3 rounded-xl text-center font-bold text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                ✗ Rejected
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setAccepted(p => [...p, a.id])}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', boxShadow: '0 2px 12px rgba(6,78,59,0.4)' }}
                >
                  <Check style={{ width: 15, height: 15 }} /> Accept
                </button>
                <button
                  onClick={() => setRejected(p => [...p, a.id])}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'transparent', color: '#EF4444', border: '2px solid rgba(239,68,68,0.4)' }}
                >
                  <X style={{ width: 15, height: 15 }} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {/* ── All Workers ── */}
        {tab === 'All Workers' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {ALL_WORKERS.map((w, i) => (
              <div
                key={w.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < ALL_WORKERS.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0"
                  style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {w.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text1)' }}>{w.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>
                    <Star style={{ width: 11, height: 11, display: 'inline', color: '#FBBF24', fill: '#FBBF24' }} /> {w.rating} · Hired {w.timesHired}x · {w.lastWorked}
                  </p>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(20,184,166,0.1)', color: '#5EEAD4', border: '1px solid rgba(20,184,166,0.25)' }}
                >
                  <Repeat2 style={{ width: 13, height: 13 }} /> Hire Again
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmployerBottomNav />
    </div>
  )
}
