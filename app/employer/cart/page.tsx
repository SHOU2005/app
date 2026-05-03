'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const BG   = '#080808'
const S1   = '#111111'
const S2   = '#181818'
const BD   = 'rgba(255,255,255,0.07)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.2)'
const GRN  = '#10B981'
const FONT = '"DM Sans", system-ui, -apple-system, sans-serif'

const IMG = (f: string) => `/icons/services/${f}.jpg`

type RoleInfo = { img: string; emoji: string; includes: string[] }

const ROLES: Record<string, RoleInfo> = {
  'Cleaner': {
    img: IMG('house-cleaner'), emoji: '🧹',
    includes: ['Floor sweeping & mopping', 'Dusting all surfaces', 'Bathroom & toilet cleaning', 'Kitchen surface wipe-down', 'Trash removal'],
  },
  'Cook': {
    img: IMG('cook-chef'), emoji: '👨‍🍳',
    includes: ['Meal preparation (up to 3 dishes)', 'Grocery list assistance', 'Kitchen cleaning after cooking', 'Serving if required'],
  },
  'Kitchen Helper': {
    img: IMG('cook-chef'), emoji: '🍳',
    includes: ['Vegetable cutting & prep', 'Utensil washing & drying', 'Counter & stove cleaning', 'Assisting the main cook'],
  },
  'Store Staff': {
    img: IMG('store-helper'), emoji: '🏪',
    includes: ['Customer assistance', 'Shelf stocking & arrangement', 'Billing & cashier support', 'Inventory management'],
  },
  'General Helper': {
    img: IMG('store-helper'), emoji: '🙋',
    includes: ['Loading & unloading goods', 'Carrying & shifting items', 'Running errands', 'Basic task execution on request'],
  },
  'Driver': {
    img: IMG('driver'), emoji: '🚗',
    includes: ['Safe vehicle operation', 'Route navigation', 'Pick-up & drop service', 'Fuel-level monitoring'],
  },
  'Bouncer': {
    img: IMG('security-guard'), emoji: '💪',
    includes: ['Entry screening & frisking', 'Crowd management', 'Conflict resolution', 'Venue security & perimeter check'],
  },
  'Waiter': {
    img: IMG('cook-chef'), emoji: '🍽️',
    includes: ['Table setting & clearing', 'Order taking & serving', 'Food & beverage delivery', 'Guest assistance'],
  },
  'Security Guard': {
    img: IMG('security-guard'), emoji: '🛡️',
    includes: ['Premises patrolling', 'Visitor log & access control', 'Emergency response', 'Night watch duty'],
  },
  'Promoter': {
    img: IMG('store-helper'), emoji: '📣',
    includes: ['Brand & product promotion', 'Lead & contact collection', 'Handout & sample distribution', 'Event & stall support'],
  },
  'Caretaker': {
    img: IMG('baby-care'), emoji: '🤲',
    includes: ['Patient assistance & mobility', 'Medicine reminders', 'Companionship & basic care', 'Light personal hygiene help'],
  },
  'Delivery Rider': {
    img: IMG('delivery-rider'), emoji: '🛵',
    includes: ['Package pickup from sender', 'Timely last-mile delivery', 'Real-time location updates', 'Proof of delivery'],
  },
  'Factory Helper': {
    img: IMG('warehouse-staff'), emoji: '🏭',
    includes: ['Assembly line support', 'Material handling & shifting', 'Sorting & packing goods', 'Basic quality checking'],
  },
}

const SLOTS = [
  { id: '4h',  label: '4 hrs',  hours: 4,  discount: 0,  badge: ''           },
  { id: '8h',  label: '8 hrs',  hours: 8,  discount: 5,  badge: '5% off'     },
  { id: '12h', label: '1 Day',  hours: 12, discount: 5,  badge: '5% off'     },
  { id: '3d',  label: '3 Days', hours: 36, discount: 15, badge: '15% off'    },
  { id: '7d',  label: '7 Days', hours: 84, discount: 15, badge: 'Best Value' },
]

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']

function CartInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const serviceName = searchParams.get('service') || ''
  const mode        = (searchParams.get('mode') || 'instant') as 'instant' | 'schedule'
  const slotParam   = searchParams.get('slot') || '4h'

  const role = ROLES[serviceName]

  const initSlot = SLOTS.find(s => s.id === slotParam) || SLOTS[0]
  const [slot,      setSlot]      = useState(initSlot)
  const [address,   setAddress]   = useState('')
  const [addrFocus, setAddrFocus] = useState(false)
  const [dateIdx,   setDateIdx]   = useState(0)
  const [timeSlot,  setTimeSlot]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [locLoad,   setLocLoad]   = useState(false)
  const [error,     setError]     = useState('')

  const baseRate   = mode === 'instant' ? 250 : 200
  const baseTotal  = baseRate * slot.hours
  const discount   = Math.round(baseTotal * slot.discount / 100)
  const total      = baseTotal - discount
  const gst        = Math.round(total * 18 / 118)

  const now        = new Date()
  const dateLabels = [0, 1, 2].map(i => {
    const d = new Date(now); d.setDate(d.getDate() + i)
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day After',
      date:  d.toISOString().split('T')[0],
      short: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }
  })

  const canPay = address.trim().length > 3 && (mode === 'instant' || timeSlot !== '')

  async function fillAddress() {
    if (!navigator.geolocation) return
    setLocLoad(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
          const data = await res.json()
          const a    = data.address || {}
          const parts = [a.house_number, a.road || a.pedestrian, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state].filter(Boolean)
          setAddress(parts.join(', '))
        } catch { /* ignore */ } finally { setLocLoad(false) }
      },
      () => setLocLoad(false),
      { timeout: 8000 }
    )
  }

  async function handlePay() {
    if (!canPay) return
    setLoading(true); setError('')
    try {
      const startTime = mode === 'instant' ? new Date().toTimeString().slice(0, 5) : timeSlot
      const endH      = Number(startTime.split(':')[0]) + slot.hours
      const endTime   = `${String(endH % 24).padStart(2, '0')}:${startTime.split(':')[1]}`
      const res = await fetch('/api/employer/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category:    serviceName,
          duration:    slot.hours,
          discountPct: slot.discount,
          address,
          date:        dateLabels[dateIdx].date,
          startTime,
          endTime,
          isInstant:   mode === 'instant',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create booking'); setLoading(false); return }
      router.replace(`/employer/job/${data.job.id}/payment`)
    } catch { setError('Network error. Please try again.'); setLoading(false) }
  }

  if (!role) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T1, marginBottom: 8 }}>Service not available</div>
        <div style={{ fontSize: 14, color: T2, marginBottom: 24 }}>"{serviceName}" is not in our list</div>
        <button onClick={() => router.back()} style={{ padding: '13px 32px', borderRadius: 14, background: T1, color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, fontSize: 15 }}>Go Back</button>
      </div>
    </div>
  )

  const card: React.CSSProperties = { background: S1, borderRadius: 20, padding: 20, marginBottom: 12, border: `1px solid ${BD}` }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: T1 }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: BG,
        borderBottom: `1px solid ${BD}`,
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 14, paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.back()} style={{
            width: 40, height: 40, borderRadius: 20, border: `1px solid ${BD}`, background: S1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: T1 }}>{serviceName}</div>
            <div style={{ fontSize: 13, color: T2 }}>{mode === 'instant' ? '⚡ Instant · ₹250/hr' : '🗓 Scheduled · ₹200/hr'}</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T1, textAlign: 'right' }}>₹{total}</div>
            {slot.discount > 0 && (
              <div style={{ fontSize: 11, color: T3, textDecoration: 'line-through', textAlign: 'right' }}>₹{baseTotal}</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(70px + env(safe-area-inset-top))', paddingBottom: 'calc(90px + env(safe-area-inset-bottom))', padding: 'calc(70px + env(safe-area-inset-top)) 16px calc(90px + env(safe-area-inset-bottom))' }}>

        {/* Service hero */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 160, position: 'relative' }}>
            <img src={role.img} alt={serviceName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.72) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: T1 }}>{role.emoji} {serviceName}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
                {mode === 'instant' ? '⚡ Worker arrives in ~8 minutes' : '🗓 Scheduled booking · ₹200/hr'}
              </div>
            </div>
          </div>

          {/* What's included */}
          <div style={{ padding: '16px 18px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 12 }}>What's included</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {role.includes.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={GRN} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize: 14, color: T2, lineHeight: '20px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 14 }}>Choose Duration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, gridTemplateRows: 'auto auto' }}>
            {SLOTS.map(s => {
              const price    = Math.round(baseRate * s.hours * (1 - s.discount / 100))
              const selected = slot.id === s.id
              return (
                <button key={s.id} onClick={() => setSlot(s)} style={{
                  padding: '12px 8px', borderRadius: 14, cursor: 'pointer', fontFamily: FONT,
                  border: `1.5px solid ${selected ? T1 : BD}`,
                  background: selected ? T1 : S2,
                  textAlign: 'center' as const, position: 'relative' as const,
                }}>
                  {s.badge && (
                    <div style={{
                      position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                      background: selected ? '#111' : GRN,
                      color: selected ? '#fff' : '#000', fontSize: 9, fontWeight: 800,
                      padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' as const,
                    }}>{s.badge}</div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 900, color: selected ? '#000' : T1, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected ? '#000' : T2 }}>₹{price}</div>
                  {s.discount > 0 && (
                    <div style={{ fontSize: 10, color: selected ? 'rgba(0,0,0,0.45)' : T3, textDecoration: 'line-through', marginTop: 1 }}>₹{baseRate * s.hours}</div>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: S2, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: T2 }}>{slot.label} × ₹{baseRate}/hr{slot.discount > 0 ? ` − ${slot.discount}%` : ''}</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: T1 }}>₹{total}</span>
          </div>
        </div>

        {/* Date / Time (schedule mode) */}
        {mode === 'schedule' && (
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 14 }}>Date</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {dateLabels.map((d, i) => (
                <button key={i} onClick={() => setDateIdx(i)} style={{
                  flex: 1, padding: '11px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT,
                  border: `1.5px solid ${dateIdx === i ? T1 : BD}`,
                  background: dateIdx === i ? T1 : 'transparent', textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: dateIdx === i ? '#000' : T1 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: dateIdx === i ? 'rgba(0,0,0,0.5)' : T3, marginTop: 2 }}>{d.short}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 14 }}>Start Time</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {TIME_SLOTS.map(ts => (
                <button key={ts} onClick={() => setTimeSlot(ts)} style={{
                  padding: '10px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: FONT,
                  border: `1.5px solid ${timeSlot === ts ? T1 : BD}`,
                  background: timeSlot === ts ? T1 : 'transparent',
                  color: timeSlot === ts ? '#000' : T1,
                  fontSize: 12, fontWeight: 600, textAlign: 'center' as const,
                }}>
                  {ts}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Job Location</div>
            <button onClick={fillAddress} disabled={locLoad} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
              border: `1px solid ${BD}`, background: S2, cursor: 'pointer', fontFamily: FONT,
              fontSize: 11, fontWeight: 700, color: T2, opacity: locLoad ? 0.5 : 1,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
              {locLoad ? 'Getting…' : 'Use my location'}
            </button>
          </div>
          <textarea rows={3} placeholder="Enter complete address with landmark..."
            value={address} onChange={e => setAddress(e.target.value)}
            onFocus={() => setAddrFocus(true)} onBlur={() => setAddrFocus(false)}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              border: `1.5px solid ${addrFocus ? T1 : BD}`,
              fontSize: 14, color: T1, background: S2, outline: 'none', resize: 'none',
              boxSizing: 'border-box' as const, fontFamily: FONT, lineHeight: '22px',
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Bill */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 14 }}>Bill Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BD}` }}>
            <span style={{ fontSize: 14, color: T2 }}>{serviceName} · {slot.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>₹{baseTotal}</span>
          </div>
          {slot.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BD}` }}>
              <span style={{ fontSize: 14, color: GRN }}>Discount ({slot.discount}%)</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: GRN }}>−₹{discount}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BD}` }}>
            <span style={{ fontSize: 14, color: T2 }}>GST (18% incl.)</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>₹{gst}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: T1 }}>Total</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: T1 }}>₹{total}</span>
              {slot.discount > 0 && <div style={{ fontSize: 12, color: GRN, fontWeight: 700 }}>You save ₹{discount}</div>}
            </div>
          </div>
        </div>

        {/* Trust */}
        <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRN} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: GRN }}>100% Secure · Powered by Razorpay</span>
        </div>

        {error && <div style={{ fontSize: 14, color: '#EF4444', marginTop: 12, textAlign: 'center' }}>{error}</div>}
        {mode === 'schedule' && !timeSlot && (
          <div style={{ fontSize: 13, color: '#F5C518', marginTop: 12, textAlign: 'center', fontWeight: 600 }}>⚠ Select a start time to continue</div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: BG,
        borderTop: `1px solid ${BD}`, padding: '14px 16px',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      }}>
        {slot.discount > 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: GRN, fontWeight: 700, marginBottom: 8 }}>
            🎉 Saving ₹{discount} with {slot.discount}% off
          </div>
        )}
        <button onClick={handlePay} disabled={!canPay || loading} style={{
          width: '100%', padding: '17px 0', borderRadius: 16, border: 'none',
          cursor: canPay && !loading ? 'pointer' : 'default',
          background: canPay ? T1 : S1, color: canPay ? '#000' : T2,
          fontWeight: 900, fontSize: 17, fontFamily: FONT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
        }}>
          {loading ? 'Creating booking…' : !canPay ? 'Enter address to continue' : (
            <>
              <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
                <path d="M15 2L4 27h8L15 18l3 9h8L15 2z" fill="#000"/>
              </svg>
              Pay ₹{total} via Razorpay
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function CartPage() {
  return <Suspense><CartInner /></Suspense>
}
