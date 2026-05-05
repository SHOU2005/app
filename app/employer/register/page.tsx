'use client'
import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Upload } from 'lucide-react'

const BRAND = '#111827'

const BUSINESS_TYPES = [
  { label: 'Restaurant',       emoji: '🍽️' },
  { label: 'Retail Store',     emoji: '🏪' },
  { label: 'Warehouse',        emoji: '🏭' },
  { label: 'Hotel',            emoji: '🏨' },
  { label: 'Security Agency',  emoji: '🔒' },
  { label: 'Delivery Hub',     emoji: '🚴' },
  { label: 'Office/Corporate', emoji: '💼' },
  { label: 'Construction',     emoji: '🏗️' },
  { label: 'Healthcare',       emoji: '🏥' },
  { label: 'Other',            emoji: '📋' },
]

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Field({ label, value, onChange, placeholder, hint, disabled }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; hint?: string; disabled?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
        {label}
      </div>
      <input type="text" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{ width: '100%', padding: '14px 16px', borderRadius: 14, outline: 'none', fontSize: 15,
          fontWeight: 500, color: '#111827', background: disabled ? '#F3F4F6' : '#fff', boxSizing: 'border-box' as const,
          border: `1.5px solid ${value ? BRAND : '#E5E7EB'}`,
          transition: 'border-color 0.2s', fontFamily: 'inherit', opacity: disabled ? 0.7 : 1 }} />
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function RegisterInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const logoRef      = useRef<HTMLInputElement>(null)

  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Step 1
  const [bizName,      setBizName]      = useState('')
  const [ownerName,    setOwnerName]    = useState('')
  const [phone,        setPhone]        = useState(searchParams.get('phone') || '')
  const [city,         setCity]         = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '')

  // OTP within step 1
  const [otpSent, setOtpSent] = useState(false)
  const [otp,     setOtp]     = useState('')

  // Step 2
  const [bizType, setBizType] = useState('')

  // Step 3
  const [address, setAddress] = useState('')
  const [gst,     setGst]     = useState('')
  const [logo,    setLogo]    = useState('')

  const phoneOk    = /^\d{10}$/.test(phone)
  const step1Ok    = bizName.trim() && ownerName.trim() && phoneOk && city.trim()
  const otpOk      = /^\d{6}$/.test(otp)
  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100

  async function handleSendOtp() {
    if (!step1Ok || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-whatsapp-otp', {
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
      const res = await fetch('/api/auth/verify-whatsapp-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone, otp, role: 'EMPLOYER',
          name: ownerName.trim(), city: city.trim(),
          companyName: bizName.trim(),
          referralCode: referralCode || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setStep(2)
    } catch (e: any) {
      setError(e.message || 'OTP verification failed')
    } finally { setLoading(false) }
  }

  async function handleComplete() {
    setLoading(true); setError('')
    try {
      await fetch('/api/employer/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ownerName.trim(),
          ownerName: ownerName.trim(),
          companyName: bizName.trim(),
          businessType: bizType,
          address: address.trim() || undefined,
          city: city.trim(),
          gstNumber: gst.trim() || undefined,
          logo: logo || undefined,
        }),
      })
      window.location.replace('/employer')
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* Header */}
      <div style={{ background: BRAND, padding: '20px 20px 28px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => { if (step > 1) { setStep(s => s - 1); setError('') } else { window.history.back() } }}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, flexShrink: 0 }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>
              {step === 1 ? 'Business Info' : step === 2 ? 'Business Type' : 'Final Details'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Step {step} of 3</div>
          </div>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#FFFFFF',
            width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ padding: '24px 20px', paddingBottom: 60 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {/* ── STEP 1: Business basics + OTP ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Business Details</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Tell us about your business</div>

              <Field label="Business Name *" value={bizName} onChange={setBizName} placeholder="e.g. Sharma Stores" disabled={otpSent} />
              <Field label="Owner Name *" value={ownerName} onChange={setOwnerName} placeholder="e.g. Rajesh Sharma" disabled={otpSent} />
              <Field label="City *" value={city} onChange={setCity} placeholder="e.g. Mumbai" disabled={otpSent} />
              <Field label="Captain Referral Code (optional)" value={referralCode}
                onChange={v => setReferralCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="e.g. SW4X7RKM" hint="Enter if referred by a Switch Captain" disabled={otpSent} />

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Phone Number *
                </div>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 14,
                  border: `1.5px solid ${phoneOk ? BRAND : '#E5E7EB'}`, overflow: 'hidden',
                  opacity: otpSent ? 0.7 : 1 }}>
                  <div style={{ padding: '14px 16px', borderRight: '1px solid #E5E7EB', background: '#F9FAFB',
                    display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span>🇮🇳</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>+91</span>
                  </div>
                  <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
                    value={phone} disabled={otpSent}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                    style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
                      padding: '14px 16px', fontSize: 17, fontWeight: 600, color: '#111827', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* OTP entry */}
              {otpSent && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                    OTP sent to +91 {phone}
                  </div>
                  <input type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                    value={otp} autoFocus
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyAndNext()}
                    style={{ width: '100%', padding: '16px', borderRadius: 14, border: `1.5px solid ${otpOk ? BRAND : '#E5E7EB'}`,
                      fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: 8, outline: 'none', boxSizing: 'border-box' as const,
                      fontFamily: 'inherit' }} />
                </div>
              )}

              {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠ {error}</div>}

              {!otpSent ? (
                <button onClick={handleSendOtp} disabled={!step1Ok || loading}
                  style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: step1Ok ? 'pointer' : 'default',
                    background: step1Ok ? BRAND : '#E5E7EB', color: step1Ok ? '#fff' : '#9CA3AF',
                    fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: step1Ok ? '0 6px 20px rgba(17,24,39,0.35)' : 'none', fontFamily: 'inherit' }}>
                  {loading ? 'Sending OTP…' : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
                </button>
              ) : (
                <>
                  <button onClick={handleVerifyAndNext} disabled={!otpOk || loading}
                    style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: otpOk ? 'pointer' : 'default',
                      background: otpOk ? BRAND : '#E5E7EB', color: otpOk ? '#fff' : '#9CA3AF',
                      fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: otpOk ? '0 6px 20px rgba(17,24,39,0.35)' : 'none', fontFamily: 'inherit', marginBottom: 10 }}>
                    {loading ? 'Verifying…' : <><span>Verify & Continue</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
                  </button>
                  <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                    style={{ width: '100%', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', fontSize: 13, fontFamily: 'inherit' }}>
                    ← Change number / Resend OTP
                  </button>
                </>
              )}
            </>
          )}

          {/* ── STEP 2: Business type ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Business Type</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>What kind of business do you run?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {BUSINESS_TYPES.map(({ label, emoji }) => {
                  const sel = bizType === label
                  return (
                    <button key={label} onClick={() => setBizType(label)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        padding: '16px 10px', borderRadius: 16, cursor: 'pointer',
                        background: sel ? '#F3F4F6' : '#FAFAFA',
                        border: `2px solid ${sel ? BRAND : '#E5E7EB'}`,
                        transition: 'all 0.15s', fontFamily: 'inherit' }}>
                      <span style={{ fontSize: 26 }}>{emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center',
                        color: sel ? BRAND : '#6B7280', lineHeight: 1.3 }}>{label}</span>
                      {sel && <span style={{ color: BRAND, fontSize: 14 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => bizType && setStep(3)} disabled={!bizType}
                style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: bizType ? 'pointer' : 'default',
                  background: bizType ? BRAND : '#E5E7EB', color: bizType ? '#fff' : '#9CA3AF',
                  fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: bizType ? '0 6px 20px rgba(17,24,39,0.35)' : 'none', fontFamily: 'inherit' }}>
                <span>Continue</span><ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </>
          )}

          {/* ── STEP 3: Address, GST, Logo ── */}
          {step === 3 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Final Details</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>All fields optional — you can fill later</div>

              {/* Summary */}
              <div style={{ background: '#F3F4F6', borderRadius: 14, padding: '14px 16px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Account</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{bizName}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{ownerName} · {bizType}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{city} · +91 {phone}</div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Business Address <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </div>
                <textarea rows={2} placeholder="Shop/office address" value={address} onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E5E7EB',
                    fontSize: 14, color: '#111827', background: '#fff', outline: 'none',
                    resize: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
              </div>

              {/* GST */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  GST Number <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </div>
                <input type="text" placeholder="e.g. 27AAPFU0939F1ZV" value={gst}
                  onChange={e => setGst(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${gst ? BRAND : '#E5E7EB'}`,
                    outline: 'none', fontSize: 14, fontWeight: 600, color: '#111827', background: '#fff',
                    boxSizing: 'border-box' as const, fontFamily: 'inherit', letterSpacing: 1 }} />
              </div>

              {/* Company Logo */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Company Logo <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </div>
                <button onClick={() => logoRef.current?.click()}
                  style={{ width: '100%', height: logo ? 'auto' : 80, borderRadius: 14,
                    border: `2px dashed ${logo ? '#22C55E' : '#E5E7EB'}`,
                    background: logo ? 'rgba(34,197,94,0.04)' : '#FAFAFA',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                  {logo
                    ? <img src={logo} alt="logo" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', padding: 8 }} />
                    : <>
                        <Upload style={{ width: 20, height: 20, color: '#9CA3AF' }} />
                        <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'inherit' }}>Tap to upload logo</span>
                      </>
                  }
                </button>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={async e => {
                    const f = e.target.files?.[0]
                    if (f) setLogo(await fileToBase64(f))
                  }} />
              </div>

              {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠ {error}</div>}

              <button onClick={handleComplete} disabled={loading}
                style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: BRAND, color: '#fff', fontWeight: 800, fontSize: 16, opacity: loading ? 0.75 : 1,
                  boxShadow: '0 6px 20px rgba(17,24,39,0.35)', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                🏢 {loading ? 'Creating Account…' : <><span>Create Account</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <button onClick={() => router.push('/employer/login')}
            style={{ color: BRAND, fontWeight: 800, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmployerRegisterPage() {
  return <Suspense><RegisterInner /></Suspense>
}
