'use client'
import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Check, ChevronLeft, Camera, Upload } from 'lucide-react'

const JOB_TYPES = [
  { id: 'shop',         emoji: '🏪', label: 'Shop Helper'      },
  { id: 'delivery',     emoji: '🚴', label: 'Delivery Rider'   },
  { id: 'security',     emoji: '🔒', label: 'Security Guard'   },
  { id: 'kitchen',      emoji: '🍳', label: 'Kitchen Helper'   },
  { id: 'warehouse',    emoji: '🏭', label: 'Warehouse Staff'  },
  { id: 'cleaning',     emoji: '🧹', label: 'Cleaning Staff'   },
  { id: 'driver',       emoji: '🚗', label: 'Driver'           },
  { id: 'construction', emoji: '🏗️', label: 'Construction'    },
  { id: 'packing',      emoji: '📦', label: 'Packing Staff'    },
  { id: 'cashier',      emoji: '🛒', label: 'Cashier'          },
  { id: 'painter',      emoji: '🎨', label: 'Painter'          },
  { id: 'electrician',  emoji: '⚡', label: 'Electrician'      },
]

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function PhotoPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>{label}</p>
      <button onClick={() => ref.current?.click()}
        style={{ width: '100%', height: value ? 'auto' : 80, borderRadius: 14,
          border: `2px dashed ${value ? '#22C55E' : 'rgba(0,0,0,0.15)'}`,
          background: value ? 'rgba(34,197,94,0.04)' : '#F9F9F9',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
        {value
          ? <img src={value} alt={label} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
          : <>
              <Upload style={{ width: 22, height: 22, color: 'rgba(0,0,0,0.3)' }} />
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>Tap to upload</span>
            </>
        }
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={async e => {
          const f = e.target.files?.[0]
          if (f) onChange(await fileToBase64(f))
        }} />
    </div>
  )
}

function RegisterForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Step 1 fields
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState(searchParams?.get('phone') ?? '')
  const [city,     setCity]     = useState('')
  const [referral, setReferral] = useState(searchParams?.get('ref') ?? '')

  // OTP stage within step 1
  const [otpSent, setOtpSent] = useState(false)
  const [otp,     setOtp]     = useState('')

  // Step 2 fields
  const [jobs, setJobs] = useState<Set<string>>(new Set())

  // Step 3 fields
  const [profilePhoto,  setProfilePhoto]  = useState('')
  const [aadhaarFront,  setAadhaarFront]  = useState('')

  // Step 4 fields
  const [aadhaarBack,   setAadhaarBack]   = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')

  const phoneOk = /^\d{10}$/.test(phone)
  const otpOk   = /^\d{6}$/.test(otp)
  const step1Ok = name.trim().length >= 2 && phoneOk && city.trim().length > 0

  const TOTAL_STEPS = 4
  const stepLabel = ['Your Info', 'Work Types', 'Profile Photo & ID Front', 'ID Back & Complete']

  async function handleSendOtp() {
    if (!step1Ok || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send OTP'); return }
      setOtpSent(true)
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function handleVerifyAndNext() {
    if (!otpOk || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role: 'WORKER', name: name.trim(), city: city.trim(), referralCode: referral || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setStep(2)
    } catch (e: any) {
      setError(e.message || 'OTP verification failed')
    } finally { setLoading(false) }
  }

  async function handleStep2Next() {
    setStep(3)
  }

  async function handleStep3Next() {
    if (!aadhaarFront) { setError('Please upload your Aadhaar front photo'); return }
    setStep(4)
    setError('')
  }

  async function handleComplete() {
    if (!aadhaarBack) { setError('Please upload your Aadhaar back photo'); return }
    setLoading(true); setError('')
    try {
      // Extract Aadhaar number from front image
      let extractedNumber = aadhaarNumber
      if (aadhaarFront && !extractedNumber) {
        try {
          const ocrRes = await fetch('/api/worker/extract-aadhaar', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: aadhaarFront }),
          })
          const ocrData = await ocrRes.json()
          if (ocrData.aadhaarNumber) extractedNumber = ocrData.aadhaarNumber
        } catch {}
      }

      // Save all profile data
      await fetch('/api/worker/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills:       Array.from(jobs),
          profilePhoto: profilePhoto || undefined,
          aadhaarFront: aadhaarFront || undefined,
          aadhaarBack:  aadhaarBack  || undefined,
          aadhaarNumber: extractedNumber || undefined,
        }),
      })

      router.replace('/worker/dashboard')
    } catch (e: any) {
      setError(e.message || 'Failed to save profile')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 8px' }}>
        {step > 1 ? (
          <button onClick={() => { setStep(s => s - 1); setError('') }}
            style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0F0F0',
              border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: 20, height: 20, color: 'rgba(0,0,0,0.6)' }} />
          </button>
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 14, background: '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Step {step} of {TOTAL_STEPS}
          </p>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#111111', marginTop: 1 }}>
            {stepLabel[step - 1]}
          </p>
        </div>
        {step === 1 && (
          <button onClick={() => router.push('/login')}
            style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Login
          </button>
        )}
      </div>

      {/* Step bar */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 20px 12px' }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 8,
            background: i < step ? '#111111' : 'rgba(0,0,0,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>

        {/* ── STEP 1: Basic info + OTP ── */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Join Switch</p>
            <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>Find part-time jobs near you</p>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Full Name *</p>
              <input value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Your full name"
                disabled={otpSent}
                style={{ width: '100%', height: 54, paddingLeft: 16, paddingRight: 16, borderRadius: 14,
                  background: '#F5F5F5', border: `1.5px solid ${name.length >= 2 ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                  fontSize: 16, fontWeight: 600, color: '#111111', outline: 'none', boxSizing: 'border-box',
                  opacity: otpSent ? 0.6 : 1 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Mobile Number *</p>
              <div style={{ display: 'flex', height: 54, borderRadius: 14, overflow: 'hidden',
                background: '#F5F5F5', border: `1.5px solid ${phoneOk ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                opacity: otpSent ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
                  borderRight: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>🇮🇳</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>+91</span>
                </div>
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
                  value={phone} disabled={otpSent}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    paddingLeft: 14, fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2 }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>City *</p>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai, Delhi" disabled={otpSent}
                style={{ width: '100%', height: 54, paddingLeft: 16, paddingRight: 16, borderRadius: 14,
                  background: '#F5F5F5', border: `1.5px solid ${city.trim() ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                  fontSize: 16, fontWeight: 600, color: '#111111', outline: 'none', boxSizing: 'border-box',
                  opacity: otpSent ? 0.6 : 1 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
                Captain Referral Code <span style={{ fontWeight: 400 }}>(optional)</span>
              </p>
              <input value={referral} disabled={otpSent}
                onChange={e => setReferral(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="e.g. SW4X7RKM"
                style={{ width: '100%', height: 50, padding: '0 16px', borderRadius: 14,
                  background: '#F5F5F5', border: '1.5px solid rgba(0,0,0,0.1)',
                  fontSize: 15, fontWeight: 700, color: '#111111', outline: 'none',
                  letterSpacing: 3, boxSizing: 'border-box', opacity: otpSent ? 0.6 : 1 }} />
            </div>

            {/* OTP entry */}
            {otpSent && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111111', marginBottom: 4 }}>
                  Enter OTP sent to +91 {phone}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 10 }}>Check your SMS inbox</p>
                <input type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                  value={otp} autoFocus
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyAndNext()}
                  style={{ width: '100%', height: 64, padding: '0 18px', borderRadius: 14,
                    background: '#F5F5F5', border: `1.5px solid ${otpOk ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                    fontSize: 28, fontWeight: 800, color: '#111111', letterSpacing: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            {!otpSent ? (
              <button onClick={handleSendOtp} disabled={!step1Ok || loading}
                style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                  background: step1Ok ? '#111111' : 'rgba(0,0,0,0.07)',
                  color: step1Ok ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: step1Ok ? 'pointer' : 'default' }}>
                {loading ? <><SSpinner /><span>Sending OTP…</span></> : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
              </button>
            ) : (
              <>
                <button onClick={handleVerifyAndNext} disabled={!otpOk || loading}
                  style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                    background: otpOk ? '#111111' : 'rgba(0,0,0,0.07)',
                    color: otpOk ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: otpOk ? 'pointer' : 'default', marginBottom: 10 }}>
                  {loading ? <><SSpinner /><span>Verifying…</span></> : <><span>Verify & Continue</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
                </button>
                <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                  style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(0,0,0,0.4)', fontSize: 14, fontWeight: 600 }}>
                  ← Change number / Resend OTP
                </button>
              </>
            )}

            <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 16 }}>
              Already registered?{' '}
              <button onClick={() => router.push('/login')}
                style={{ color: '#111111', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                Sign In
              </button>
            </p>
          </div>
        )}

        {/* ── STEP 2: Job types ── */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>What work do you do?</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 20 }}>Select all that apply</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
              {JOB_TYPES.map(j => {
                const on = jobs.has(j.id)
                return (
                  <button key={j.id}
                    onClick={() => setJobs(prev => { const n = new Set(prev); n.has(j.id) ? n.delete(j.id) : n.add(j.id); return n })}
                    style={{ padding: '14px 8px', borderRadius: 16, cursor: 'pointer',
                      background: on ? 'rgba(17,17,17,0.06)' : '#F5F5F5',
                      border: `2px solid ${on ? '#111111' : 'rgba(0,0,0,0.08)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s', position: 'relative' }}>
                    <span style={{ fontSize: 22 }}>{j.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? '#111111' : 'rgba(0,0,0,0.5)',
                      textAlign: 'center', lineHeight: 1.3 }}>{j.label}</span>
                    {on && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%',
                        background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check style={{ width: 11, height: 11, color: '#fff' }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button onClick={handleStep2Next}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              <span>Continue</span><ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            <button onClick={handleStep2Next}
              style={{ width: '100%', height: 44, borderRadius: 16, fontSize: 15, fontWeight: 600, border: 'none',
                background: 'transparent', color: 'rgba(0,0,0,0.35)', cursor: 'pointer' }}>
              Skip for now
            </button>
          </div>
        )}

        {/* ── STEP 3: Profile photo + Aadhaar front ── */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Upload your photos</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>Profile photo is optional. Aadhaar front is required for KYC.</p>

            <PhotoPicker label="Profile Photo (optional)" value={profilePhoto} onChange={setProfilePhoto} />
            <PhotoPicker label="Aadhaar Card Front *" value={aadhaarFront} onChange={setAadhaarFront} />

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button onClick={handleStep3Next}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              <span>Continue</span><ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            <button onClick={() => { setStep(4); setError('') }}
              style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(0,0,0,0.35)', fontSize: 14, fontWeight: 600 }}>
              Skip Aadhaar for now
            </button>
          </div>
        )}

        {/* ── STEP 4: Aadhaar back ── */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Aadhaar Back</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>
              Upload the back side of your Aadhaar card. We'll auto-extract your Aadhaar number.
            </p>

            <PhotoPicker label="Aadhaar Card Back *" value={aadhaarBack} onChange={setAadhaarBack} />

            {aadhaarNumber && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 2 }}>Aadhaar number detected</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#111111', letterSpacing: 3 }}>
                  {aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                </p>
              </div>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button onClick={handleComplete} disabled={loading}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              {loading ? <><SSpinner light /><span>Completing registration…</span></> : <><span>Complete Registration</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
            <button onClick={async () => {
              setLoading(true)
              await fetch('/api/worker/profile', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: Array.from(jobs), profilePhoto: profilePhoto || undefined }),
              })
              router.replace('/worker/dashboard')
            }}
              style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(0,0,0,0.35)', fontSize: 14, fontWeight: 600 }}>
              Skip Aadhaar for now → Go to app
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SSpinner({ light }: { light?: boolean }) {
  const c = light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
  const tc = light ? '#fff' : '#111'
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2.5px solid ${c}`,
      borderTopColor: tc, animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function WorkerRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
