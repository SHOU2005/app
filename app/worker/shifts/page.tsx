'use client'
import { useEffect, useState } from 'react'
import {
  MapPin, ChevronDown, AlertCircle, HelpCircle,
  Clock, CheckCircle, X, Navigation, Calendar, Loader2, Zap, WifiOff,
} from 'lucide-react'
import BottomNav     from '@/components/shared/BottomNav'
import LocationSheet from '@/components/shared/LocationSheet'
import JobIcon       from '@/components/worker/JobIcon'
import ActiveShift   from '@/components/worker/ActiveShift'
import { formatDate, formatTime } from '@/lib/utils'

/* ── Dates ── */
const DAY3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function buildDates() {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return { i, short: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DAY3[d.getDay()], date: d.getDate(), iso }
  })
}
const DATES = buildDates()
const DUR_OPTS = [
  { id: 0,  label: 'All' },
  { id: 4,  label: '4 hrs' },
  { id: 8,  label: '8 hrs' },
  { id: 12, label: '12 hrs' },
]

function jobEmoji(title: string) {
  const t = title.toLowerCase()
  if (t.includes('shop') || t.includes('helper'))       return '🏪'
  if (t.includes('delivery') || t.includes('rider'))    return '🚴'
  if (t.includes('warehouse'))                           return '🏭'
  if (t.includes('security') || t.includes('guard'))    return '🔒'
  if (t.includes('kitchen') || t.includes('cook'))      return '🍳'
  if (t.includes('driver'))                             return '🚗'
  if (t.includes('clean'))                              return '🧹'
  if (t.includes('pack'))                               return '📦'
  if (t.includes('cashier'))                            return '🛒'
  return '💼'
}

const ST_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: 'Pending',    color: '#D97706', bg: 'rgba(245,158,11,0.12)'  },
  CONFIRMED:   { label: 'Confirmed',  color: '#111111', bg: 'rgba(0,0,0,0.07)'      },
  IN_PROGRESS: { label: 'Active',     color: '#111111', bg: 'rgba(0,0,0,0.07)'       },
  COMPLETED:   { label: 'Completed',  color: 'rgba(0,0,0,0.4)', bg: 'rgba(0,0,0,0.06)' },
  CANCELLED:   { label: 'Cancelled',  color: '#DC2626', bg: 'rgba(220,38,38,0.1)'    },
  NO_SHOW:     { label: 'No Show',    color: 'rgba(0,0,0,0.4)', bg: 'rgba(0,0,0,0.06)' },
}

/* ── Offline Banner ── */
function OfflineBanner() {
  return (
    <div style={{
      margin: '0 16px 12px',
      padding: '12px 14px',
      borderRadius: 14,
      background: 'rgba(220,38,38,0.08)',
      border: '1px solid rgba(220,38,38,0.25)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <WifiOff style={{ width: 18, height: 18, color: '#DC2626', flexShrink: 0 }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>
        Server unavailable — check your connection and try again
      </p>
    </div>
  )
}

/* ── Rating Sheet ── */
function RatingSheet({ bookingId, title, company, required, onClose, onSubmit }: {
  bookingId: string | null; title: string; company: string; required?: boolean
  onClose: () => void; onSubmit: (id: string, score: number, comment: string) => void
}) {
  const [stars,     setStars]     = useState(0)
  const [hovered,   setHovered]   = useState(0)
  const [comment,   setComment]   = useState('')
  const [submitting,setSubmitting]= useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [visible,   setVisible]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (bookingId) { setStars(0); setHovered(0); setComment(''); setSubmitted(false); setError(''); requestAnimationFrame(() => setVisible(true)) }
    else setVisible(false)
  }, [bookingId])

  function close() {
    if (required && !submitted) { setError('Please give a star rating before closing.'); return }
    setVisible(false); setTimeout(onClose, 300)
  }

  async function submit() {
    if (stars === 0) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, score: stars, comment: comment.trim() || undefined }),
      })
      if (res.ok) {
        setSubmitted(true)
        if (bookingId) onSubmit(bookingId, stars, comment)
        setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 1800)
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to submit')
      }
    } catch { setError('Network error. Try again.') }
    setSubmitting(false)
  }

  if (!bookingId) return null
  const LABELS = ['','Poor','Fair','Good','Great','Excellent!']

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background:'rgba(0,0,0,0.4)', opacity:visible?1:0, transition:'opacity 0.3s' }}
        onClick={close}/>
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{
        background:'#FFFFFF', borderRadius:'24px 24px 0 0',
        maxHeight:'88vh', display:'flex', flexDirection:'column',
        transform:visible?'translateY(0)':'translateY(100%)', transition:'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(0,0,0,0.15)' }}/>
        </div>
        {!submitted && (
          <button onClick={close} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background:'rgba(0,0,0,0.07)' }}>
            <X style={{ width:14, height:14, color:'rgba(0,0,0,0.5)' }}/>
          </button>
        )}

        <div className="px-5 overflow-y-auto flex-1" style={{ paddingBottom:'var(--safe-b)' }}>
          {submitted ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background:'rgba(0,0,0,0.06)' }}>
                <CheckCircle style={{ width:28, height:28, color:'#111111' }}/>
              </div>
              <p style={{ fontSize:18, fontWeight:800, color:'#111111', marginBottom:4 }}>Thanks for rating!</p>
              <p style={{ fontSize:14, color:'rgba(0,0,0,0.38)' }}>Your feedback helps improve the platform</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 mt-2">
                <JobIcon emoji={jobEmoji(title)} size={44} radius={12}/>
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color:'#111111' }}>{title}</p>
                  <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:2 }}>{company}</p>
                </div>
              </div>

              {required && (
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'8px 12px', marginBottom:12 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#D97706' }}>⭐ Rating required to complete your shift</p>
                </div>
              )}

              <p style={{ fontSize:16, fontWeight:800, color:'#111111', marginBottom:12 }}>How was your experience?</p>
              <div className="flex gap-2 justify-center mb-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n}
                    onPointerEnter={() => setHovered(n)} onPointerLeave={() => setHovered(0)}
                    onClick={() => { setStars(n); setError('') }}
                    style={{ fontSize:36, opacity:n<=(hovered||stars)?1:0.2, transition:'opacity 0.1s', lineHeight:1 }}>⭐</button>
                ))}
              </div>
              <p className="text-center mb-4" style={{ fontSize:14, fontWeight:700, color:'#D97706', minHeight:22 }}>
                {stars > 0 ? LABELS[stars] : 'Tap a star to rate'}
              </p>

              <p style={{ fontSize:13, fontWeight:600, color:'rgba(0,0,0,0.45)', marginBottom:6 }}>
                Review <span style={{ color:'rgba(0,0,0,0.28)', fontWeight:400 }}>(optional)</span>
              </p>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Tell others about this job…" rows={3}
                style={{ width:'100%', background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', borderRadius:14,
                  padding:'12px 14px', fontSize:14, color:'#111111', outline:'none', resize:'none', marginBottom:10 }}/>

              {error && (
                <p style={{ fontSize:13, color:'#DC2626', fontWeight:600, marginBottom:8 }}>{error}</p>
              )}

              <button onClick={submit} disabled={submitting || stars === 0}
                style={{
                  width:'100%', height:52, borderRadius:14, fontSize:16, fontWeight:800, border:'none',
                  background: stars > 0 ? '#111111' : 'rgba(0,0,0,0.08)',
                  color: stars > 0 ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                  cursor: stars > 0 && !submitting ? 'pointer' : 'not-allowed',
                  boxShadow: stars > 0 ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                  transition:'all 0.2s', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}>
                {submitting ? <><Loader2 style={{ width:18, height:18 }} className="animate-spin"/> Submitting…</> : 'Submit Rating'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ── API Booking Card ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BookingCard({ booking, tab, onArrive, onRate }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking: any; tab: 'upcoming' | 'past'
  onArrive: () => void; onRate: () => void
}) {
  const shift   = booking.shift
  const st      = ST_MAP[booking.status] ?? ST_MAP.PENDING
  const emoji   = jobEmoji(shift.title)
  const company = shift.employer?.user?.name ?? 'Employer'
  const shiftDate = new Date(shift.date)
  const isToday = new Date().toDateString() === shiftDate.toDateString()
  const dateLabel = isToday ? 'Today' : formatDate(shift.date)
  const alreadyRated = !!booking.rating

  return (
    <div style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', borderRadius:18, marginBottom:10, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
        <JobIcon emoji={emoji} size={46} radius={13}/>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
            <div>
              <p style={{ fontSize:16, fontWeight:800, color:'#111111' }}>{shift.title}</p>
              <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:2 }}>{company}</p>
            </div>
            <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'3px 10px', flexShrink:0,
              background:st.bg, color:st.color }}>
              {st.label}
            </span>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:'rgba(0,0,0,0.4)' }}>
              <Calendar style={{ width:12, height:12 }}/>{dateLabel}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:'rgba(0,0,0,0.4)' }}>
              <Clock style={{ width:12, height:12 }}/>{formatTime(shift.startTime)} – {formatTime(shift.endTime)}
            </span>
            <span style={{ fontSize:15, fontWeight:800, color:'#111111' }}>
              ₹{booking.workerEarning?.toLocaleString('en-IN') ?? '—'}
            </span>
          </div>
          {shift.city && (
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'rgba(0,0,0,0.35)', marginTop:4 }}>
              <MapPin style={{ width:11, height:11 }}/>{shift.city}
            </span>
          )}
          {tab === 'upcoming' && booking.status === 'CONFIRMED' && isToday && (
            <button onClick={onArrive} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              height:38, borderRadius:12, background:'#111111',
              fontSize:14, fontWeight:700, color:'#FFFFFF', border:'none', cursor:'pointer',
              boxShadow:'0 3px 16px rgba(0,0,0,0.15)', marginTop:10 }}>
              <Navigation style={{ width:14, height:14 }}/> I&apos;ve Arrived — Enter OTP
            </button>
          )}
          {tab === 'past' && booking.status === 'COMPLETED' && !alreadyRated && (
            <button onClick={onRate} style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:8,
              padding:'6px 14px', borderRadius:10, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)',
              fontSize:13, fontWeight:700, color:'#D97706', cursor:'pointer' }}>⭐ Rate this job</button>
          )}
          {tab === 'past' && alreadyRated && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:8 }}>
              <CheckCircle style={{ width:13, height:13, color:'#111111' }}/>
              <p style={{ fontSize:13, fontWeight:600, color:'#111111' }}>Rated ⭐{booking.rating?.score}/5</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Available Shift Card ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AvailableShiftCard({ shift, onBook, booking }: { shift: any; onBook: () => void; booking: boolean }) {
  const emoji   = jobEmoji(shift.title)
  const company = shift.employer?.user?.name ?? 'Employer'
  const earn    = shift.duration * 125
  const shiftDate = new Date(shift.date)
  const isToday = new Date().toDateString() === shiftDate.toDateString()
  const dateLabel = isToday ? 'Today' : formatDate(shift.date)

  return (
    <div style={{
      background:'#F5F5F5',
      border: `1px solid ${booking ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.09)'}`,
      borderRadius:18, marginBottom:10, overflow:'hidden',
      boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'border-color 0.2s',
    }}>
      <div style={{ padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
        <JobIcon emoji={emoji} size={46} radius={13}/>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
            <div>
              <p style={{ fontSize:16, fontWeight:800, color:'#111111' }}>{shift.title}</p>
              <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:1 }}>{company}</p>
            </div>
            {shift.isUrgent && (
              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, fontWeight:800,
                color:'#DC2626', background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)',
                borderRadius:8, padding:'3px 8px', flexShrink:0 }}>
                <Zap style={{ width:11, height:11 }}/> URGENT
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:13, color:'rgba(0,0,0,0.4)' }}>
              <Calendar style={{ width:12, height:12 }}/>{dateLabel}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:13, color:'rgba(0,0,0,0.4)' }}>
              <Clock style={{ width:12, height:12 }}/>{formatTime(shift.startTime)} – {formatTime(shift.endTime)}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:13, color:'rgba(0,0,0,0.4)' }}>
              <MapPin style={{ width:12, height:12 }}/>{shift.city}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <span style={{ fontSize:16, fontWeight:900, color:'#111111' }}>₹{earn.toLocaleString('en-IN')}</span>
              <span style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginLeft:4 }}>· {shift.duration}h shift</span>
            </div>
            {booking ? (
              <div style={{ display:'flex', alignItems:'center', gap:5, color:'#111111' }}>
                <CheckCircle style={{ width:16, height:16 }}/>
                <span style={{ fontSize:13, fontWeight:700 }}>Booked!</span>
              </div>
            ) : (
              <button onClick={onBook}
                style={{
                  padding:'8px 18px', borderRadius:12, fontSize:14, fontWeight:800,
                  background:'#111111', color:'#FFFFFF', border:'none',
                  cursor:'pointer', boxShadow:'0 3px 16px rgba(0,0,0,0.15)',
                }}>
                Book
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function ShiftsPage() {
  const [tab,          setTab]          = useState<'book'|'mine'>('book')
  const [dateIdx,      setDateIdx]      = useState(0)
  const [durFilter,    setDurFilter]    = useState(0)
  const [histTab,      setHistTab]      = useState<'upcoming'|'past'>('upcoming')
  const [ratingBookingId, setRatingBookingId] = useState<string|null>(null)
  const [ratingTitle,  setRatingTitle]  = useState('')
  const [ratingCompany,setRatingCompany]= useState('')
  const [ratingRequired,setRatingRequired] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeShift,  setActiveShift]  = useState<any>(null)
  const [toast,        setToast]        = useState<string|null>(null)
  const [cityLabel,    setCityLabel]    = useState('Nearby')
  const [showLocEdit,  setShowLocEdit]  = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiBookings,  setApiBookings]  = useState<any[]>([])
  const [apiLoading,   setApiLoading]   = useState(false)
  const [bookingsError,setBookingsError]= useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availShifts,  setAvailShifts]  = useState<any[]>([])
  const [shiftsLoading,setShiftsLoading]= useState(false)
  const [shiftsError,  setShiftsError]  = useState(false)
  const [bookedShiftIds, setBookedShiftIds] = useState(new Set<string>())
  const [bookingShiftId, setBookingShiftId] = useState<string|null>(null)

  useEffect(() => {
    const city = localStorage.getItem('sw_city')
    if (city) setCityLabel(city)
  }, [])

  useEffect(() => {
    if (tab !== 'book') return
    setShiftsLoading(true)
    setShiftsError(false)
    const date = DATES[dateIdx]?.iso ?? ''
    const params = new URLSearchParams({ date })
    if (durFilter > 0) params.set('duration', String(durFilter))
    fetch(`/api/shifts?${params}`)
      .then(r => r.json())
      .then(d => setAvailShifts(d.shifts ?? []))
      .catch(() => setShiftsError(true))
      .finally(() => setShiftsLoading(false))
  }, [tab, dateIdx, durFilter])

  useEffect(() => {
    if (tab !== 'mine') return
    setApiLoading(true)
    setBookingsError(false)
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => {
        const bookings = d.bookings ?? []
        setApiBookings(bookings)
        const unrated = bookings.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) => b.status === 'COMPLETED' && !b.rating
        )
        if (unrated) {
          setRatingBookingId(unrated.id)
          setRatingTitle(unrated.shift?.title ?? '')
          setRatingCompany(unrated.shift?.employer?.user?.name ?? '')
          setRatingRequired(true)
          setHistTab('past')
        }
      })
      .catch(() => setBookingsError(true))
      .finally(() => setApiLoading(false))
  }, [tab])

  const now = new Date()
  const upcomingBookings = apiBookings.filter(b => {
    const d = new Date(b.shift?.date)
    return d >= now && !['COMPLETED','CANCELLED','NO_SHOW'].includes(b.status)
  })
  const pastBookings = apiBookings.filter(b => {
    const d = new Date(b.shift?.date)
    return d < now || ['COMPLETED','CANCELLED','NO_SHOW'].includes(b.status)
  })
  const shownBookings = histTab === 'upcoming' ? upcomingBookings : pastBookings

  async function bookShift(shiftId: string, shiftTitle: string) {
    if (bookingShiftId || bookedShiftIds.has(shiftId)) return
    setBookingShiftId(shiftId)
    try {
      const res = await fetch('/api/worker/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId }),
      })
      const data = await res.json()
      if (res.ok) {
        setBookedShiftIds(prev => new Set([...prev, shiftId]))
        setApiBookings(prev => [data.booking, ...prev])
        setToast(`${shiftTitle} booked! Check My Shifts`)
        setTimeout(() => setToast(null), 3000)
        setTimeout(() => { setTab('mine'); setHistTab('upcoming') }, 1200)
      } else {
        setToast(data.error ?? 'Booking failed')
        setTimeout(() => setToast(null), 3000)
      }
    } catch {
      setToast('Server unavailable. Try again.')
      setTimeout(() => setToast(null), 3000)
    }
    setBookingShiftId(null)
  }

  function handleRatingSubmit(bookingId: string, score: number, comment: string) {
    setApiBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, rating: { score, comment } } : b
    ))
    setRatingRequired(false)
    setRatingBookingId(null)
  }

  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position:'fixed', top:'calc(var(--safe-t) + 16px)', left:16, right:16, zIndex:100,
          background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.09)', borderRadius:16, padding:'14px 16px',
          display:'flex', alignItems:'center', gap:10,
          boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
        }}>
          <CheckCircle style={{ width:20, height:20, color:'#111111', flexShrink:0 }}/>
          <p style={{ fontSize:14, fontWeight:700, color:'#111111' }}>{toast}</p>
        </div>
      )}

      {/* ── Fixed Header ── */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:40,
        background:'#FFFFFF', borderBottom:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        paddingTop:'var(--safe-t)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 8px' }}>
          <button onClick={() => setShowLocEdit(true)}
            style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer' }}>
            <MapPin style={{ width:15, height:15, color:'#111111', flexShrink:0 }}/>
            <span style={{ fontSize:15, fontWeight:700, color:'#111111' }}>{cityLabel}</span>
            <ChevronDown style={{ width:13, height:13, color:'rgba(0,0,0,0.35)' }}/>
          </button>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => window.open('tel:112')}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:20,
                background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', cursor:'pointer' }}>
              <AlertCircle style={{ width:12, height:12, color:'#DC2626' }}/>
              <span style={{ fontSize:13, fontWeight:800, color:'#DC2626' }}>SOS</span>
            </button>
            <button style={{ width:32, height:32, borderRadius:'50%', background:'#F0F0F0',
              border:'1px solid rgba(0,0,0,0.09)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <HelpCircle style={{ width:15, height:15, color:'rgba(0,0,0,0.45)' }}/>
            </button>
          </div>
        </div>
        <div style={{ display:'flex', padding:'0 16px 10px', gap:8 }}>
          {[{id:'book',label:'📅 Book Shift'},{id:'mine',label:'🗂 My Shifts'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'book'|'mine')}
              style={{
                flex:1, padding:'9px 0', borderRadius:12, fontSize:15, fontWeight:700,
                transition:'all 0.15s', border:'none', cursor:'pointer',
                ...(tab === t.id
                  ? { background:'#111111', color:'#FFFFFF', boxShadow:'0 3px 16px rgba(0,0,0,0.12)' }
                  : { background:'rgba(0,0,0,0.06)', color:'rgba(0,0,0,0.45)' }),
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{
        background:'#FFFFFF', minHeight:'100vh',
        paddingTop:'calc(88px + var(--safe-t))',
        paddingBottom:'calc(80px + var(--safe-b))',
      }}>

        {tab === 'book' ? (
          <>
            <div style={{ paddingTop:14 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.35)', textTransform:'uppercase',
                letterSpacing:'0.08em', padding:'0 16px', marginBottom:10 }}>Select Date</p>
              <div style={{ display:'flex', gap:8, padding:'0 16px 4px', overflowX:'auto', scrollbarWidth:'none' }}>
                {DATES.map(dt => {
                  const on = dateIdx === dt.i
                  return (
                    <button key={dt.i} onClick={() => setDateIdx(dt.i)}
                      style={{
                        flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
                        padding:'10px 14px', borderRadius:16, border:'none', cursor:'pointer',
                        background: on ? '#111111' : '#F5F5F5',
                        boxShadow: on ? '0 4px 16px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                        outline: on ? 'none' : '1px solid rgba(0,0,0,0.09)', transition:'all 0.15s',
                      }}>
                      <span style={{ fontSize:12, fontWeight:700, marginBottom:4, letterSpacing:'0.04em',
                        color: on ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.38)' }}>
                        {dt.short.toUpperCase()}
                      </span>
                      <span style={{ fontSize:22, fontWeight:900, lineHeight:1, color: on ? '#FFFFFF' : '#111111' }}>
                        {dt.date}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display:'flex', gap:8, padding:'12px 16px 4px', overflowX:'auto', scrollbarWidth:'none' }}>
              {DUR_OPTS.map(opt => {
                const on = durFilter === opt.id
                return (
                  <button key={opt.id} onClick={() => setDurFilter(opt.id)}
                    style={{
                      flexShrink:0, padding:'7px 16px', borderRadius:20, fontSize:14, fontWeight:700,
                      transition:'all 0.15s', border:'none', cursor:'pointer',
                      background: on ? '#111111' : '#F5F5F5',
                      color: on ? '#FFFFFF' : 'rgba(0,0,0,0.5)',
                      boxShadow: on ? '0 2px 12px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                      outline: on ? 'none' : '1px solid rgba(0,0,0,0.09)',
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <div style={{ padding:'8px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'rgba(0,0,0,0.38)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Available Jobs
                </p>
                {!shiftsLoading && !shiftsError && (
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(0,0,0,0.35)' }}>
                    {availShifts.length} found
                  </span>
                )}
              </div>

              {shiftsError && <OfflineBanner />}

              {shiftsLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
                  <Loader2 style={{ width:28, height:28, color:'rgba(0,0,0,0.3)' }} className="animate-spin"/>
                </div>
              ) : !shiftsError && availShifts.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 0' }}>
                  <p style={{ fontSize:36, marginBottom:10 }}>🔍</p>
                  <p style={{ fontSize:16, fontWeight:700, color:'rgba(0,0,0,0.38)' }}>No shifts available</p>
                  <p style={{ fontSize:13, color:'rgba(0,0,0,0.28)', marginTop:4 }}>Try a different date or duration</p>
                </div>
              ) : !shiftsError ? (
                availShifts.map(shift => (
                  <AvailableShiftCard
                    key={shift.id}
                    shift={shift}
                    booking={bookedShiftIds.has(shift.id) || bookingShiftId === shift.id}
                    onBook={() => bookShift(shift.id, shift.title)}
                  />
                ))
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div style={{ padding:'14px 16px 8px', display:'flex', gap:8 }}>
              {(['upcoming','past'] as const).map(id => (
                <button key={id} onClick={() => setHistTab(id)}
                  style={{
                    flex:1, padding:'9px 0', borderRadius:12, fontSize:15, fontWeight:700,
                    transition:'all 0.15s', border:'none', cursor:'pointer',
                    ...(histTab === id
                      ? { background:'#111111', color:'#FFFFFF', boxShadow:'0 3px 16px rgba(0,0,0,0.12)' }
                      : { background:'rgba(0,0,0,0.06)', color:'rgba(0,0,0,0.45)' }),
                  }}>
                  {id === 'upcoming' ? '📅 Upcoming' : '✅ Past'}
                </button>
              ))}
            </div>

            <div style={{ padding:'4px 16px' }}>
              {bookingsError && <OfflineBanner />}

              {apiLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
                  <Loader2 style={{ width:28, height:28, color:'rgba(0,0,0,0.3)' }} className="animate-spin"/>
                </div>
              ) : !bookingsError && shownBookings.length === 0 ? (
                <div style={{ textAlign:'center', padding:'56px 0' }}>
                  <p style={{ fontSize:40, marginBottom:12 }}>📭</p>
                  <p style={{ fontSize:16, fontWeight:700, color:'rgba(0,0,0,0.38)' }}>
                    {histTab === 'upcoming' ? 'No upcoming shifts' : 'No past shifts'}
                  </p>
                  {histTab === 'upcoming' && (
                    <p style={{ fontSize:14, color:'rgba(0,0,0,0.28)', marginTop:6 }}>Book a shift to see it here</p>
                  )}
                </div>
              ) : !bookingsError ? (
                <>
                  {histTab === 'upcoming' && (
                    <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                      {[
                        { label:`${upcomingBookings.filter(b=>b.status==='CONFIRMED').length} Confirmed`, color:'#111111', bg:'rgba(0,0,0,0.07)' },
                        { label:`${upcomingBookings.filter(b=>b.status==='PENDING').length} Pending`,    color:'#D97706', bg:'rgba(245,158,11,0.1)' },
                      ].map(s => (
                        <div key={s.label} style={{ padding:'6px 12px', borderRadius:12, background:s.bg }}>
                          <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {shownBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      tab={histTab}
                      onArrive={() => setActiveShift(booking.shift)}
                      onRate={() => {
                        setRatingBookingId(booking.id)
                        setRatingTitle(booking.shift?.title ?? '')
                        setRatingCompany(booking.shift?.employer?.user?.name ?? '')
                        setRatingRequired(false)
                      }}
                    />
                  ))}
                </>
              ) : null}
            </div>
          </>
        )}
      </div>

      <RatingSheet
        bookingId={ratingBookingId}
        title={ratingTitle}
        company={ratingCompany}
        required={ratingRequired}
        onClose={() => { setRatingBookingId(null); setRatingRequired(false) }}
        onSubmit={handleRatingSubmit}
      />
      <ActiveShift job={activeShift} onClose={() => setActiveShift(null)} onDone={() => setActiveShift(null)}/>
      <LocationSheet
        visible={showLocEdit}
        cityLabel={cityLabel}
        onSave={city => { setCityLabel(city); setShowLocEdit(false) }}
        onClose={() => setShowLocEdit(false)}
      />
      <BottomNav active="/worker/shifts"/>
    </>
  )
}
