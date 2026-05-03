'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, MapPin, Clock, Users, Zap, CheckCircle2 } from 'lucide-react'

const CATEGORIES = [
  { label: 'Shop Helper',     emoji: '🏪' },
  { label: 'Delivery',        emoji: '🚴' },
  { label: 'Warehouse Staff', emoji: '🏭' },
  { label: 'Security Guard',  emoji: '🔒' },
  { label: 'Kitchen Helper',  emoji: '🍳' },
  { label: 'Driver',          emoji: '🚗' },
  { label: 'Cleaning Staff',  emoji: '🧹' },
  { label: 'Office Work',     emoji: '💼' },
]

const DURATIONS = [4, 6, 8, 10, 12]

function PostJobInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [toast, setToast]   = useState(false)

  // Step 1
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [duration, setDuration] = useState<number | null>(null)

  // Step 2
  const [date, setDate]         = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime]   = useState('17:00')
  const [workers, setWorkers]   = useState(1)
  const [address, setAddress]   = useState('')
  const [city, setCity]         = useState('')

  // Step 3
  const [urgent, setUrgent]     = useState(searchParams.get('urgent') === '1')

  const hourlyRate = 200
  const totalCost  = hourlyRate * (duration || 0) * workers

  // Auto-fill today's date
  useEffect(() => {
    const d = new Date()
    setDate(d.toISOString().split('T')[0])
  }, [])

  // Auto-compute end time from start + duration
  useEffect(() => {
    if (!startTime || !duration) return
    const [h, m] = startTime.split(':').map(Number)
    const end = new Date(2000, 0, 1, h + duration, m)
    setEndTime(`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`)
  }, [startTime, duration])

  // Auto-fill category title
  useEffect(() => {
    if (category && !title) setTitle(category)
  }, [category])

  const catEmoji = CATEGORIES.find(c => c.label === category)?.emoji || '💼'
  const step1Valid = title.trim() && category && duration
  const step2Valid = date && startTime && address.trim() && city.trim()

  async function handlePost() {
    setLoading(true); setError('')
    try {
      // Geocode city for lat/lng
      let lat = 19.076, lng = 72.877
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`)
        const geoData = await geo.json()
        if (geoData[0]) { lat = parseFloat(geoData[0].lat); lng = parseFloat(geoData[0].lon) }
      } catch {}

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, role: category, address, city, lat, lng,
          date, startTime, endTime,
          duration: duration!, workersNeeded: workers,
          hourlyRate, isUrgent: urgent,
          description: '',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post job'); return }

      setToast(true)
      setTimeout(() => {
        setToast(false)
        router.push('/employer/jobs')
      }, 1800)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40" style={{ paddingTop: 'var(--safe-t)', background: '#111827', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-5 h-14">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0" style={{ background: 'var(--surface)' }}>
            <ArrowLeft style={{ width: 18, height: 18, color: 'var(--text1)' }} />
          </button>
          <p className="font-black text-lg" style={{ color: 'var(--text1)' }}>
            {step === 1 ? 'Job Details' : step === 2 ? 'Schedule & Location' : 'Review & Post'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginTop: 56, paddingTop: 'var(--safe-t)' }}>
        <div className="flex gap-1.5 px-5 pt-4 pb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sur2)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: step >= s ? '100%' : '0%', background: 'linear-gradient(135deg,#064E3B,#0D9488)' }} />
            </div>
          ))}
        </div>
        <p className="px-5 text-xs" style={{ color: 'var(--text3)' }}>Step {step} of 3</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">

        {/* Step 1 */}
        {step === 1 && (
          <div className="pt-4">
            <h2 className="text-xl font-black mb-4" style={{ color: 'var(--text1)' }}>What work do you need?</h2>

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Job Title</label>
            <input type="text" placeholder="e.g. Shop Helper, Delivery Boy" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full rounded-2xl px-4 py-4 outline-none text-base font-medium mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text1)' }}
            />

            <label className="block text-xs font-semibold mb-3" style={{ color: 'var(--text2)' }}>Category</label>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {CATEGORIES.map(c => {
                const sel = category === c.label
                return (
                  <button key={c.label} onClick={() => { setCategory(c.label); if (!title || CATEGORIES.some(x => x.label === title)) setTitle(c.label) }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{ background: sel ? 'rgba(20,184,166,0.12)' : 'var(--surface)', border: `2px solid ${sel ? '#14B8A6' : 'var(--border)'}` }}>
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: sel ? '#5EEAD4' : 'var(--text2)' }}>{c.label}</span>
                  </button>
                )
              })}
            </div>

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Shift Duration</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {DURATIONS.map(h => (
                <button key={h} onClick={() => setDuration(h)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: duration === h ? 'linear-gradient(135deg,#064E3B,#0D9488)' : 'var(--surface)', color: duration === h ? '#fff' : 'var(--text2)', border: `1px solid ${duration === h ? 'transparent' : 'var(--border)'}` }}>
                  {h}h
                </button>
              ))}
            </div>

            {duration && (
              <div className="rounded-2xl p-3 mb-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
                <p className="text-sm font-bold" style={{ color: '#5EEAD4' }}>₹{hourlyRate}/hr × {duration}h × {workers} = ₹{totalCost.toLocaleString('en-IN')} total</p>
              </div>
            )}

            <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: step1Valid ? 'linear-gradient(135deg,#064E3B,#0D9488)' : 'var(--sur2)', color: step1Valid ? '#fff' : 'var(--text3)' }}>
              Continue <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="pt-4">
            <h2 className="text-xl font-black mb-4" style={{ color: 'var(--text1)' }}>When & Where?</h2>

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-2xl px-4 py-4 outline-none text-base font-medium mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text1)' }}
            />

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full rounded-2xl px-4 py-4 outline-none text-base font-medium mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text1)' }}
            />

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Number of Workers</label>
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setWorkers(w => Math.max(1, w - 1))}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text1)' }}>−</button>
              <p className="text-2xl font-black w-8 text-center" style={{ color: 'var(--text1)' }}>{workers}</p>
              <button onClick={() => setWorkers(w => Math.min(20, w + 1))}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', color: '#fff' }}>+</button>
              <p className="text-xs ml-2" style={{ color: 'var(--text3)' }}>Max 20</p>
            </div>

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>City</label>
            <input type="text" placeholder="Mumbai" value={city} onChange={e => setCity(e.target.value)}
              className="w-full rounded-2xl px-4 py-4 outline-none text-base font-medium mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text1)' }}
            />

            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Full Address</label>
            <textarea rows={3} placeholder="Shop No 12, Andheri West Market, Mumbai - 400053" value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full rounded-2xl px-4 py-4 outline-none text-base font-medium resize-none mb-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text1)' }}
            />

            <button onClick={() => step2Valid && setStep(3)} disabled={!step2Valid}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: step2Valid ? 'linear-gradient(135deg,#064E3B,#0D9488)' : 'var(--sur2)', color: step2Valid ? '#fff' : 'var(--text3)' }}>
              Review Job <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="pt-4">
            <h2 className="text-xl font-black mb-4" style={{ color: 'var(--text1)' }}>Review Your Job</h2>

            <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{catEmoji}</span>
                <div>
                  <p className="font-black text-lg" style={{ color: 'var(--text1)' }}>{title}</p>
                  <p className="text-sm" style={{ color: '#5EEAD4' }}>₹{hourlyRate}/hr · {duration}h shift</p>
                </div>
              </div>
              {[
                { icon: Clock, label: 'Schedule', val: `${date} at ${startTime}` },
                { icon: MapPin, label: 'Location', val: `${address}, ${city}` },
                { icon: Users, label: 'Workers', val: `${workers} worker${workers > 1 ? 's' : ''}` },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-start gap-2.5 mb-3">
                  <Icon style={{ width: 15, height: 15, color: '#14B8A6', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text1)' }}>{val}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>Total estimated cost</p>
                <p className="text-xl font-black" style={{ color: '#5EEAD4' }}>₹{totalCost.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <button onClick={() => setUrgent(u => !u)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-4"
              style={{ background: urgent ? 'rgba(239,68,68,0.12)' : 'var(--surface)', border: `2px solid ${urgent ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`, color: urgent ? '#FCA5A5' : 'var(--text2)' }}>
              <Zap style={{ width: 16, height: 16 }} />
              {urgent ? 'Marked Urgent ⚡' : 'Mark as Urgent ⚡'}
            </button>

            {error && <p className="text-sm text-center mb-4" style={{ color: '#EF4444' }}>{error}</p>}

            <button onClick={handlePost} disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', color: '#fff', boxShadow: '0 4px 24px rgba(6,78,59,0.5)', opacity: loading ? 0.7 : 1 }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              {loading ? 'Posting…' : urgent ? 'Post Urgent Job ⚡' : 'Post Job'}
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed inset-x-4 bottom-8 z-50 rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#064E3B,#0D9488)', boxShadow: '0 8px 32px rgba(6,78,59,0.5)' }}>
          <CheckCircle2 style={{ width: 22, height: 22, color: '#fff', flexShrink: 0 }} />
          <p className="font-bold text-white">Job posted! Workers will apply shortly 🎉</p>
        </div>
      )}
    </div>
  )
}

export default function PostJobPage() {
  return <Suspense><PostJobInner /></Suspense>
}
