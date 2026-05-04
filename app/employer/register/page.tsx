'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

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

function Field({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; hint?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
        {label}
      </div>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '14px 16px', borderRadius: 14, outline: 'none', fontSize: 15,
          fontWeight: 500, color: '#111827', background: '#fff', boxSizing: 'border-box' as const,
          border: `1.5px solid ${focused ? BRAND : value ? '#D1D5DB' : '#E5E7EB'}`,
          transition: 'border-color 0.2s', fontFamily: 'inherit' }} />
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function RegisterInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const [bizName,      setBizName]      = useState('')
  const [ownerName,    setOwnerName]    = useState('')
  const [phone,        setPhone]        = useState(searchParams.get('phone') || '')
  const [city,         setCity]         = useState('')
  const [bizType,      setBizType]      = useState('')
  const [address,      setAddress]      = useState('')
  const [gst,          setGst]          = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '')
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPass,     setShowPass]     = useState(false)

  const step1Valid = bizName.trim() && ownerName.trim() && /^\d{10}$/.test(phone) && city.trim()
  const step2Valid = !!bizType
  const step3Valid = password.length >= 6 && password === confirm

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['', '#EF4444', '#F59E0B', '#22C55E'][passwordStrength]

  async function createAccount() {
    if (!step3Valid || loading) return
    setLoading(true); setError('')
    try {
      // Register the user
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ownerName.trim(), phone, password, role: 'EMPLOYER', city: city.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }

      // Update employer profile with business details
      await fetch('/api/employer/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ownerName, companyName: bizName, businessType: bizType, address, city, gstNumber: gst }),
      })

      window.location.replace('/employer')
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* Header */}
      <div style={{ background: BRAND, padding: '20px 20px 28px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => { if (step > 1) { setStep(s => s - 1) } else { window.history.back() } }}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, flexShrink: 0 }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>Create Account</div>
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

          {/* Step 1: Business basics */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Business Details</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Tell us about your business</div>
              <Field label="Business Name *" value={bizName} onChange={setBizName} placeholder="e.g. Sharma Stores" />
              <Field label="Owner Name *" value={ownerName} onChange={setOwnerName} placeholder="e.g. Rajesh Sharma" />
              <Field label="City *" value={city} onChange={setCity} placeholder="e.g. Mumbai" />
              <Field label="Captain Referral Code (optional)" value={referralCode}
                onChange={v => setReferralCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="e.g. SW4X7RKM" hint="Enter if referred by a Switch Captain" />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Phone Number *
                </div>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 14,
                  border: `1.5px solid ${phone ? BRAND : '#E5E7EB'}`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderRight: '1px solid #E5E7EB', background: '#F9FAFB',
                    display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span>🇮🇳</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>+91</span>
                  </div>
                  <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
                      padding: '14px 16px', fontSize: 17, fontWeight: 600, color: '#111827', fontFamily: 'inherit' }} />
                </div>
              </div>
              <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid}
                style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: step1Valid ? BRAND : '#E5E7EB', color: step1Valid ? '#fff' : '#9CA3AF',
                  fontWeight: 800, fontSize: 16, marginTop: 8,
                  boxShadow: step1Valid ? '0 6px 20px rgba(17,24,39,0.35)' : 'none', fontFamily: 'inherit' }}>
                Continue →
              </button>
            </>
          )}

          {/* Step 2: Business type */}
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
              <button onClick={() => step2Valid && setStep(3)} disabled={!step2Valid}
                style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: step2Valid ? BRAND : '#E5E7EB', color: step2Valid ? '#fff' : '#9CA3AF',
                  fontWeight: 800, fontSize: 16, boxShadow: step2Valid ? '0 6px 20px rgba(17,24,39,0.35)' : 'none',
                  fontFamily: 'inherit' }}>
                Continue →
              </button>
            </>
          )}

          {/* Step 3: Password + optional details */}
          {step === 3 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Set Password</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Create a secure password for your account</div>

              {/* Summary */}
              <div style={{ background: '#F3F4F6', borderRadius: 14, padding: '14px 16px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Account Summary</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{bizName}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{ownerName} · {bizType}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{city} · +91 {phone}</div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Password *</div>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 14,
                  border: `1.5px solid ${password.length >= 6 ? BRAND : '#E5E7EB'}`, overflow: 'hidden', background: '#fff' }}>
                  <input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                    value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                    style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
                      padding: '14px 16px', fontSize: 15, fontWeight: 600, color: '#111827', fontFamily: 'inherit' }} />
                  <button onClick={() => setShowPass(s => !s)}
                    style={{ padding: '0 14px', height: 50, background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(passwordStrength / 3) * 100}%`,
                        background: strengthColor, transition: 'all 0.3s', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: strengthColor }}>
                      {['', 'Weak', 'Good', 'Strong'][passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Confirm Password *</div>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 14, overflow: 'hidden', background: '#fff',
                  border: `1.5px solid ${confirm ? (confirm === password ? '#22C55E' : '#EF4444') : '#E5E7EB'}` }}>
                  <input type={showPass ? 'text' : 'password'} placeholder="Re-enter password"
                    value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && createAccount()}
                    style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
                      padding: '14px 16px', fontSize: 15, fontWeight: 600, color: '#111827', fontFamily: 'inherit' }} />
                </div>
                {confirm && confirm !== password && (
                  <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Passwords don't match</div>
                )}
              </div>

              {/* Optional: Address */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                  Business Address <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </div>
                <textarea rows={2} placeholder="Shop address" value={address} onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E5E7EB',
                    fontSize: 14, color: '#111827', background: '#fff', outline: 'none',
                    resize: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
              </div>

              {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠ {error}</div>}

              <button onClick={createAccount} disabled={!step3Valid || loading}
                style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: step3Valid ? 'pointer' : 'default',
                  background: step3Valid ? BRAND : '#E5E7EB', color: step3Valid ? '#fff' : '#9CA3AF',
                  fontWeight: 800, fontSize: 16, opacity: loading ? 0.75 : 1,
                  boxShadow: step3Valid ? '0 6px 20px rgba(17,24,39,0.35)' : 'none', fontFamily: 'inherit' }}>
                🏢 {loading ? 'Creating Account…' : 'Create Account'}
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
