'use client'
import { useRef, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Check, ChevronLeft, Upload, Camera } from 'lucide-react'
import { sendPhoneCode, confirmPhoneCode } from '@/lib/firebase-phone-auth'
import { compressImage } from '@/lib/compress-image'

const JOB_TYPES = [
  { id: 'shop',         emoji: '🏪', label: 'Shop Helper'     },
  { id: 'delivery',     emoji: '🚴', label: 'Delivery Rider'  },
  { id: 'security',     emoji: '🔒', label: 'Security Guard'  },
  { id: 'kitchen',      emoji: '🍳', label: 'Kitchen Helper'  },
  { id: 'warehouse',    emoji: '🏭', label: 'Warehouse Staff' },
  { id: 'cleaning',     emoji: '🧹', label: 'Cleaning Staff'  },
  { id: 'driver',       emoji: '🚗', label: 'Driver'          },
  { id: 'construction', emoji: '🏗️', label: 'Construction'   },
  { id: 'packing',      emoji: '📦', label: 'Packing Staff'   },
  { id: 'cashier',      emoji: '🛒', label: 'Cashier'         },
  { id: 'painter',      emoji: '🎨', label: 'Painter'         },
  { id: 'electrician',  emoji: '⚡', label: 'Electrician'     },
]

function PhotoPicker({ label, value, onChange, selfie = false, required = false }: { label: string; value: string; onChange: (v: string) => void; selfie?: boolean; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </p>
      <button onClick={() => ref.current?.click()}
        style={{ width: '100%', height: value ? 'auto' : 100, borderRadius: 16,
          border: `2px dashed ${value ? '#22C55E' : required ? 'rgba(220,38,38,0.3)' : 'rgba(0,0,0,0.15)'}`,
          background: value ? 'rgba(34,197,94,0.04)' : required ? 'rgba(220,38,38,0.02)' : '#F9F9F9',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, cursor: 'pointer', overflow: 'hidden', padding: 0, transition: 'all 0.15s' }}>
        {loading
          ? <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid rgba(0,0,0,0.1)', borderTopColor: '#111', animation: 'spin 0.7s linear infinite' }} />
          : value
            ? <img src={value} alt={label} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
            : <>
                <Camera style={{ width: 26, height: 26, color: required ? 'rgba(220,38,38,0.5)' : 'rgba(0,0,0,0.3)' }} />
                <span style={{ fontSize: 13, color: required ? 'rgba(220,38,38,0.6)' : 'rgba(0,0,0,0.4)', fontWeight: 600 }}>Tap to take or upload</span>
              </>
        }
      </button>
      <input ref={ref} type="file" accept="image/*" capture={selfie ? 'user' : 'environment'} style={{ display: 'none' }}
        onChange={async e => {
          const f = e.target.files?.[0]
          if (!f) return
          setLoading(true)
          try { onChange(await compressImage(f, 200, 600)) } catch {}
          setLoading(false)
        }} />
    </div>
  )
}

function RegisterForm() {
  const router  = useRouter()
  const params  = useSearchParams()

  const [step,      setStep]      = useState(1)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState(params?.get('phone') ?? '')
  const [city,     setCity]     = useState('')
  const [referral, setReferral] = useState(params?.get('ref') ?? '')
  const [otpSent,  setOtpSent]  = useState(false)
  const [otp,      setOtp]      = useState('')

  const [jobs,         setJobs]         = useState<Set<string>>(new Set())
  const [profilePhoto, setProfilePhoto] = useState('')
  const [aadhaarFront, setAadhaarFront] = useState('')
  const [aadhaarBack,  setAadhaarBack]  = useState('')
  const [aadhaarNumber,setAadhaarNumber]= useState('')

  const phoneOk = /^\d{10}$/.test(phone)
  const otpOk   = /^\d{6}$/.test(otp)
  const step1Ok = name.trim().length >= 2 && phoneOk && city.trim().length > 0

  const TOTAL_STEPS = 4
  const stepLabel = ['Your Info', 'Work Types', 'Your Photo & Aadhaar', 'Aadhaar Back & Done']

  async function handleSendOtp() {
    if (!step1Ok || loading) return
    setLoading(true); setError('')
    try {
      await sendPhoneCode(phone)
      setOtpSent(true)
      setCountdown(60)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleVerifyAndNext() {
    if (!otpOk || loading) return
    setLoading(true); setError('')
    try {
      const { idToken } = await confirmPhoneCode(otp)
      const res  = await fetch('/api/auth/firebase-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'WORKER', name: name.trim(), city: city.trim(), referralCode: referral || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setStep(2)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  function handleOtpChange(v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 6)
    setOtp(clean); setError('')
    if (clean.length === 6) setTimeout(() => document.getElementById('reg-verify-btn')?.click(), 80)
  }

  async function handleStep3Next() {
    if (!profilePhoto) { setError('Profile photo is required'); return }
    if (!aadhaarFront) { setError('Please upload your Aadhaar front photo'); return }
    setStep(4); setError('')
  }

  async function handleComplete() {
    if (!aadhaarBack) { setError('Please upload your Aadhaar back photo'); return }
    setLoading(true); setError('')
    try {
      let extracted = aadhaarNumber
      if (aadhaarFront && !extracted) {
        try {
          const r = await fetch('/api/worker/extract-aadhaar', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: aadhaarFront }),
          })
          const d = await r.json()
          if (d.aadhaarNumber) extracted = d.aadhaarNumber
        } catch {}
      }
      await fetch('/api/worker/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: Array.from(jobs), profilePhoto: profilePhoto || undefined,
          aadhaarFront: aadhaarFront || undefined, aadhaarBack: aadhaarBack || undefined,
          aadhaarNumber: extracted || undefined }),
      })
      router.replace('/worker/dashboard')
    } catch { setError('Failed to save profile') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 8px' }}>
        {step > 1 ? (
          <button onClick={() => { setStep(s => s - 1); setError('') }}
            style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0F0F0',
              border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: 20, height: 20, color: 'rgba(0,0,0,0.6)' }} />
          </button>
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 14, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            Step {step} of {TOTAL_STEPS}
          </p>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#111111', marginTop: 1 }}>{stepLabel[step - 1]}</p>
        </div>
        {step === 1 && (
          <button onClick={() => router.push('/login')}
            style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Login
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '4px 20px 12px' }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 8, background: i < step ? '#111111' : 'rgba(0,0,0,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Join Switch</p>
            <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>Find part-time jobs near you</p>

            {[
              { label: 'Full Name *', value: name, onChange: setName, placeholder: 'Your full name', check: name.length >= 2 },
            ].map(({ label, value, onChange, placeholder, check }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>{label}</p>
                <input value={value} onChange={e => { onChange(e.target.value); setError('') }} placeholder={placeholder}
                  disabled={otpSent}
                  style={{ width: '100%', height: 54, paddingLeft: 16, paddingRight: 16, borderRadius: 14,
                    background: '#F5F5F5', border: `1.5px solid ${check ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                    fontSize: 16, fontWeight: 600, color: '#111111', outline: 'none', boxSizing: 'border-box' as const,
                    opacity: otpSent ? 0.6 : 1 }} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Mobile Number *</p>
              <div style={{ display: 'flex', height: 54, borderRadius: 14, overflow: 'hidden',
                background: '#F5F5F5', border: `1.5px solid ${phoneOk ? '#111111' : 'rgba(0,0,0,0.1)'}`, opacity: otpSent ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRight: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>🇮🇳</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>+91</span>
                </div>
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
                  value={phone} disabled={otpSent}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', paddingLeft: 14, fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2 }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>City *</p>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai, Delhi" disabled={otpSent}
                style={{ width: '100%', height: 54, paddingLeft: 16, paddingRight: 16, borderRadius: 14,
                  background: '#F5F5F5', border: `1.5px solid ${city.trim() ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                  fontSize: 16, fontWeight: 600, color: '#111111', outline: 'none', boxSizing: 'border-box' as const, opacity: otpSent ? 0.6 : 1 }} />
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
                  fontSize: 15, fontWeight: 700, color: '#111111', outline: 'none', letterSpacing: 3, boxSizing: 'border-box' as const, opacity: otpSent ? 0.6 : 1 }} />
            </div>

            {otpSent && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111111', marginBottom: 4 }}>OTP sent to +91 {phone}</p>
                <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 10 }}>Check your SMS inbox</p>
                <div style={{ border: `1.5px solid ${otpOk ? '#111111' : 'rgba(0,0,0,0.1)'}`, borderRadius: 14, background: '#F5F5F5', overflow: 'hidden' }}>
                  <input type="tel" inputMode="numeric" maxLength={6} placeholder="_ _ _ _ _ _" autoFocus
                    value={otp}
                    onChange={e => handleOtpChange(e.target.value)}
                    style={{ width: '100%', height: 68, padding: '0 20px', borderRadius: 14,
                      background: 'transparent', border: 'none', fontSize: 32, fontWeight: 800, color: '#111111', letterSpacing: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
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
                  background: step1Ok ? '#111111' : 'rgba(0,0,0,0.07)', color: step1Ok ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: step1Ok ? 'pointer' : 'default' }}>
                {loading ? <><SSpinner /><span>Sending OTP…</span></> : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
              </button>
            ) : (
              <>
                <button id="reg-verify-btn" onClick={handleVerifyAndNext} disabled={!otpOk || loading}
                  style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                    background: otpOk ? '#111111' : 'rgba(0,0,0,0.07)', color: otpOk ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: otpOk ? 'pointer' : 'default', marginBottom: 10 }}>
                  {loading ? <><SSpinner /><span>Verifying…</span></> : <><span>Verify & Continue</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
                </button>
                <button onClick={() => { if (countdown > 0) return; setOtpSent(false); setOtp(''); setError('') }}
                  disabled={countdown > 0}
                  style={{ width: '100%', height: 44, background: 'none', border: 'none',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    color: countdown > 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)', fontSize: 14, fontWeight: 600 }}>
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : '← Change number / Resend OTP'}
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

        {/* STEP 2 */}
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
                      background: on ? 'rgba(17,17,17,0.06)' : '#F5F5F5', border: `2px solid ${on ? '#111111' : 'rgba(0,0,0,0.08)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s', position: 'relative' }}>
                    <span style={{ fontSize: 22 }}>{j.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? '#111111' : 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 1.3 }}>{j.label}</span>
                    {on && <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: 11, height: 11, color: '#fff' }} />
                    </div>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setStep(3)}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              <span>Continue</span><ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            <button onClick={() => setStep(3)}
              style={{ width: '100%', height: 44, borderRadius: 16, fontSize: 15, fontWeight: 600, border: 'none', background: 'transparent', color: 'rgba(0,0,0,0.35)', cursor: 'pointer' }}>
              Skip for now
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Your Photos</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>Both photos are required to complete your profile.</p>
            <PhotoPicker label="Profile Selfie" value={profilePhoto} onChange={setProfilePhoto} selfie required />
            <PhotoPicker label="Aadhaar Card Front" value={aadhaarFront} onChange={setAadhaarFront} required />
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
            </div>}
            <button onClick={handleStep3Next}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              <span>Continue</span><ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            <button onClick={() => { setStep(4); setError('') }}
              style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', fontSize: 14, fontWeight: 600 }}>
              Skip Aadhaar for now
            </button>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Aadhaar Back</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>Upload the back side to auto-extract your Aadhaar number.</p>
            <PhotoPicker label="Aadhaar Card Back *" value={aadhaarBack} onChange={setAadhaarBack} />
            {aadhaarNumber && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 2 }}>Aadhaar number detected</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#111111', letterSpacing: 3 }}>
                  {aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                </p>
              </div>
            )}
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
            </div>}
            <button onClick={handleComplete} disabled={loading}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              {loading ? <><SSpinner light /><span>Completing…</span></> : <><span>Complete Registration</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
            <button onClick={async () => {
              setLoading(true)
              await fetch('/api/worker/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: Array.from(jobs), profilePhoto: profilePhoto || undefined }) })
              router.replace('/worker/dashboard')
            }}
              style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', fontSize: 14, fontWeight: 600 }}>
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
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2.5px solid ${c}`, borderTopColor: tc, animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function WorkerRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
