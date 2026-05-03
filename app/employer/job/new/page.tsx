'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const BRAND = '#111827'

const JOB_ROLES: Record<string, { emoji: string; gradient: string; rate: number }> = {
  'Cleaner':         { emoji: '🧹', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', rate: 200 },
  'Cook':            { emoji: '👨‍🍳', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', rate: 200 },
  'Kitchen Helper':  { emoji: '🍳', gradient: 'linear-gradient(135deg,#fc5c7d,#6a3093)', rate: 200 },
  'Store Staff':     { emoji: '🏪', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', rate: 200 },
  'General Helper':  { emoji: '🙋', gradient: 'linear-gradient(135deg,#fa709a,#fee140)', rate: 200 },
  'Driver':          { emoji: '🚗', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', rate: 200 },
  'Bouncer':         { emoji: '💪', gradient: 'linear-gradient(135deg,#2c3e50,#4ca1af)', rate: 200 },
  'Waiter':          { emoji: '🍽️', gradient: 'linear-gradient(135deg,#e96c27,#f5a623)', rate: 200 },
  'Security Guard':  { emoji: '🛡️', gradient: 'linear-gradient(135deg,#373b44,#4286f4)', rate: 200 },
  'Promoter':        { emoji: '📣', gradient: 'linear-gradient(135deg,#f7971e,#ffd200)', rate: 200 },
  'Caretaker':       { emoji: '🤲', gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', rate: 200 },
  'Delivery Rider':  { emoji: '🛵', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', rate: 200 },
  'Factory Helper':  { emoji: '🏭', gradient: 'linear-gradient(135deg,#757f9a,#d7dde8)', rate: 200 },
}

const DURATIONS = [1, 2, 3, 4, 6, 8]

function JobNewInner() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const [step, setStep] = useState(() => searchParams.get('category') ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [category, setCategory]   = useState(searchParams.get('category') || '')
  const [mode]                     = useState(searchParams.get('mode') || 'instant')
  const [duration, setDuration]   = useState(2)
  const [address, setAddress]     = useState('')
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5))
  const [addrFocus,    setAddrFocus]    = useState(false)
  const [locLoading,   setLocLoading]   = useState(false)

  const info  = JOB_ROLES[category]
  const rate  = mode === 'instant' ? 250 : 200
  const total = rate * duration
  const gst   = Math.round(total * 18 / 118)

  const step1Valid = !!category
  const step2Valid = duration > 0 && address.trim().length > 0

  async function fillAddress() {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
          const data = await res.json()
          const a    = data.address || {}
          const parts = [
            a.house_number, a.road || a.pedestrian,
            a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.village || a.county,
            a.state,
          ].filter(Boolean)
          setAddress(parts.join(', '))
        } catch { /* ignore */ } finally { setLocLoading(false) }
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    )
  }

  async function postJob() {
    setLoading(true); setError('')
    try {
      const endH    = Number(startTime.split(':')[0]) + duration
      const endTime = `${String(endH % 24).padStart(2, '0')}:${startTime.split(':')[1]}`
      const res     = await fetch('/api/employer/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, duration, address, date, startTime, endTime, isInstant: mode === 'instant' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post job'); return }
      router.replace(`/employer/job/${data.job.id}/payment`)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: BRAND,
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        paddingBottom: 16, paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : window.history.back()}
            style={{
              width: 36, height: 36, borderRadius: 11, border: 'none',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
            {mode === 'instant' ? 'Instant Job' : 'Schedule Job'}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
            {step} / 3
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#fff', width: step >= s ? '100%' : '0%', transition: 'width 0.3s' }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 'calc(96px + env(safe-area-inset-top))', padding: 'calc(96px + env(safe-area-inset-top)) 16px 40px' }}>

        {/* Step 1 — Select Service */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 4 }}>What do you need?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>Select a service category</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
              {Object.entries(JOB_ROLES).map(([name, info]) => {
                const sel = category === name
                return (
                  <div key={name} onClick={() => setCategory(name)} style={{
                    background: '#fff', borderRadius: 14, padding: '12px 6px 10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer', position: 'relative',
                    border: `2px solid ${sel ? BRAND : '#E5E7EB'}`,
                    boxShadow: sel ? '0 4px 12px rgba(17,24,39,0.12)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {sel && (
                      <div style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 16, height: 16, borderRadius: 8,
                        background: BRAND, color: '#fff', fontSize: 9,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
                      }}>✓</div>
                    )}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: info.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>{info.emoji}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: sel ? '#111827' : '#6B7280', textAlign: 'center', lineHeight: 1.3 }}>
                      {name}
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid} style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: step1Valid ? BRAND : '#E5E7EB', color: step1Valid ? '#fff' : '#9CA3AF',
              fontWeight: 800, fontSize: 15,
              boxShadow: step1Valid ? '0 4px 16px rgba(17,24,39,0.25)' : 'none',
              fontFamily: 'inherit',
            }}>Continue</button>
          </div>
        )}

        {/* Step 2 — Job Details */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Job Details</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Set duration and location</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Duration (hours)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' as const }}>
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  width: 58, height: 50, borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${duration === d ? BRAND : '#E5E7EB'}`,
                  background: duration === d ? BRAND : '#fff',
                  fontWeight: 800, fontSize: 15,
                  color: duration === d ? '#fff' : '#374151',
                  fontFamily: 'inherit',
                }}>
                  {d}h
                </button>
              ))}
            </div>

            {mode === 'schedule' && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Date</div>
                <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)} style={{
                    width: '100%', padding: '13px 16px', borderRadius: 12,
                    border: '1.5px solid #E5E7EB', fontSize: 15, color: '#111827',
                    background: '#fff', outline: 'none', marginBottom: 16,
                    boxSizing: 'border-box' as const, fontFamily: 'inherit',
                  }}
                />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Start Time</div>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '1.5px solid #E5E7EB', fontSize: 15, color: '#111827',
                  background: '#fff', outline: 'none', marginBottom: 16,
                  boxSizing: 'border-box' as const, fontFamily: 'inherit',
                }} />
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>Job Address</div>
              <button onClick={fillAddress} disabled={locLoading} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
                border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 11, fontWeight: 700, color: BRAND, opacity: locLoading ? 0.5 : 1,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                {locLoading ? 'Getting…' : 'Use my location'}
              </button>
            </div>
            <textarea rows={3} placeholder="Enter the complete work address..."
              value={address} onChange={e => setAddress(e.target.value)}
              onFocus={() => setAddrFocus(true)} onBlur={() => setAddrFocus(false)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: `1.5px solid ${addrFocus ? BRAND : address ? '#D1D5DB' : '#E5E7EB'}`,
                fontSize: 14, color: '#111827', background: '#fff', outline: 'none', resize: 'none',
                marginBottom: 20, boxSizing: 'border-box' as const, fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />

            {/* Price estimate */}
            {info && (
              <div style={{
                background: '#fff', borderRadius: 14, padding: '16px 18px',
                marginBottom: 20, border: `1.5px solid ${BRAND}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Price Estimate
                </div>
                {[
                  { label: `${duration}h × ₹${rate}/hr`, value: `₹${total - gst}` },
                  { label: 'GST (18% incl.)',             value: `₹${gst}`         },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Total</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: BRAND }}>₹{total}</span>
                </div>
              </div>
            )}

            <button onClick={() => step2Valid && setStep(3)} disabled={!step2Valid} style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: step2Valid ? BRAND : '#E5E7EB', color: step2Valid ? '#fff' : '#9CA3AF',
              fontWeight: 800, fontSize: 15,
              boxShadow: step2Valid ? '0 4px 16px rgba(17,24,39,0.25)' : 'none',
              fontFamily: 'inherit',
            }}>Continue</button>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && info && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Review & Post</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Confirm your job details</div>

            {/* Service card */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 18, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16,
              border: '1px solid #E5E7EB',
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: 16, background: info.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }}>{info.emoji}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{category}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
                  {duration}h · {mode === 'instant' ? 'Instant hire' : `${date} at ${startTime}`}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '2px 18px 16px', marginBottom: 12, border: '1px solid #E5E7EB' }}>
              {[
                { label: 'Duration', value: `${duration} hour${duration > 1 ? 's' : ''}` },
                { label: 'Type',     value: mode === 'instant' ? 'Instant (~8 min arrival)' : `${date} at ${startTime}` },
                { label: 'Address',  value: address },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', maxWidth: '62%', textAlign: 'right' as const }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '2px 18px 16px', marginBottom: 16, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', padding: '14px 0 10px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Pricing</div>
              {[
                { label: `${duration}h × ₹${rate}/hr`, value: `₹${total - gst}` },
                { label: 'GST (18% incl.)',             value: `₹${gst}`         },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Total</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: BRAND }}>₹{total}</span>
              </div>
            </div>

            {mode === 'instant' && (
              <div style={{
                background: '#F8FAFC', borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                border: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Worker will arrive in ~8 minutes</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Nearest available worker auto-assigned</div>
                </div>
              </div>
            )}

            {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12, textAlign: 'center' }}>{error}</div>}

            <button onClick={postJob} disabled={loading} style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: BRAND, color: '#fff', fontWeight: 900, fontSize: 16, opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(17,24,39,0.3)', fontFamily: 'inherit',
            }}>
              {loading ? 'Finding Worker…' : `Pay and Book  —  ₹${total}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobNewPage() {
  return <Suspense><JobNewInner /></Suspense>
}
