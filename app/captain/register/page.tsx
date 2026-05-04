'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

const FONT = '"DM Sans", system-ui, sans-serif'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState(params.get('phone') || '')
  const [city,     setCity]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#EF4444', '#F59E0B', '#22C55E']

  const canSubmit = name.trim().length > 1 && /^\d{10}$/.test(phone) && password.length >= 6 && password === confirm

  async function register() {
    if (!canSubmit || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/captain-register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name.trim(), password, city: city.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      router.replace('/captain')
    } catch {
      setError('Network error. Check your connection.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#111111', padding: '40px 24px 28px', paddingTop: 'calc(40px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🧭</div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>Join as Captain</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Earn ₹100 per worker placed</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Onboard Workers', 'Build Territory', 'Daily Commissions'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CheckCircle style={{ width: 11, height: 11, color: '#22C55E' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: '24px 24px 0 0', marginTop: -16, padding: '28px 24px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111111', margin: '0 0 6px' }}>Create your account</h2>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: '0 0 24px' }}>Fill in the details below to get started</p>

        {/* Full name */}
        <Field label="Full Name">
          <input
            type="text" placeholder="Your full name"
            value={name} onChange={e => { setName(e.target.value); setError('') }}
            style={inputStyle(!!name)}
          />
        </Field>

        {/* Phone */}
        <Field label="Mobile Number">
          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${phone ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <div style={{ padding: '0 14px', borderRight: '1px solid rgba(0,0,0,0.08)', height: 54, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>🇮🇳</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>+91</span>
            </div>
            <input
              type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
              value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2, height: 54 }}
            />
          </div>
        </Field>

        {/* City */}
        <Field label="City / Territory (optional)">
          <input
            type="text" placeholder="e.g. Mumbai, Delhi"
            value={city} onChange={e => setCity(e.target.value)}
            style={inputStyle(!!city)}
          />
        </Field>

        {/* Password */}
        <Field label="Password">
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${password ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', overflow: 'hidden', transition: 'border-color 0.15s' }}>
              <input
                type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 16, fontWeight: 600, color: '#111111', height: 54 }}
              />
              <button onClick={() => setShowPass(s => !s)} style={{ padding: '0 14px', height: 54, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#F0F0F0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(passwordStrength / 3) * 100}%`, background: strengthColor[passwordStrength], transition: 'all 0.3s', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: strengthColor[passwordStrength] }}>{strengthLabel[passwordStrength]}</span>
              </div>
            )}
          </div>
        </Field>

        {/* Confirm password */}
        <Field label="Confirm Password">
          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${confirm ? (confirm === password ? '#22C55E' : '#EF4444') : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <input
              type={showPass ? 'text' : 'password'} placeholder="Re-enter password"
              value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && register()}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 16, fontWeight: 600, color: '#111111', height: 54 }}
            />
            {confirm && (
              <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center' }}>
                {confirm === password
                  ? <CheckCircle style={{ width: 18, height: 18, color: '#22C55E' }} />
                  : <span style={{ fontSize: 16, color: '#EF4444' }}>✕</span>
                }
              </div>
            )}
          </div>
          {confirm && confirm !== password && (
            <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 4 }}>Passwords do not match</p>
          )}
        </Field>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        <button onClick={register} disabled={!canSubmit || loading}
          style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: canSubmit ? '#111111' : '#E5E5E5',
            color: canSubmit ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
            fontSize: 16, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 20,
            boxShadow: canSubmit ? '0 8px 24px rgba(0,0,0,0.18)' : 'none',
          }}>
          {loading ? <Spinner /> : <><span>Create Account</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          Already registered?{' '}
          <a href="/captain/login" style={{ color: '#111111', fontWeight: 800, textDecoration: 'none' }}>Sign in →</a>
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function inputStyle(filled: boolean): React.CSSProperties {
  return {
    width: '100%', height: 54, borderRadius: 14,
    border: `1.5px solid ${filled ? '#111111' : 'rgba(0,0,0,0.12)'}`,
    background: '#FAFAFA', outline: 'none',
    padding: '0 14px', fontSize: 16, fontWeight: 600, color: '#111111',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  }
}

function Spinner() {
  return (
    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function CaptainRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
