'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const BG   = '#FFFFFF'
const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#111111'
const FONT = '"DM Sans", system-ui, sans-serif'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState(params.get('phone') || '')
  const [city,    setCity]    = useState('')
  const [otp,     setOtp]     = useState('')
  const [phase,   setPhase]   = useState<'form' | 'otp'>('form')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function sendOTP() {
    if (!name.trim() || phone.length !== 10) { setError('Fill all required fields'); return }
    setLoading(true); setError('')
    try {
      const { sendPhoneCode } = await import('@/lib/firebase-phone-auth')
      await sendPhoneCode(phone)
      setPhase('otp')
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP. Try again.')
    } finally { setLoading(false) }
  }

  async function verifyOTP() {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const { confirmPhoneCode } = await import('@/lib/firebase-phone-auth')
      const { idToken } = await confirmPhoneCode(otp)
      const res = await fetch('/api/auth/firebase-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'CAPTAIN' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid OTP'); return }
      await fetch('/api/captain/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), city: city.trim() }),
      })
      router.replace('/captain')
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Try again.')
      setOtp('')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T1, marginBottom: 8 }}>Join as Captain</h1>
        <p style={{ color: T2, marginBottom: 32, fontSize: 15 }}>Field executive registration</p>

        {phase === 'form' ? (
          <>
            {[
              { label: 'Full Name *',        value: name,  setter: setName,  placeholder: 'Your name',       type: 'text',   maxLen: undefined, numeric: false },
              { label: 'Mobile Number *',    value: phone, setter: setPhone, placeholder: '10-digit number', type: 'tel',    maxLen: 10,        numeric: true  },
              { label: 'City / Territory',   value: city,  setter: setCity,  placeholder: 'e.g. Bangalore',  type: 'text',   maxLen: undefined, numeric: false },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  className="field"
                  type={f.type}
                  inputMode={f.numeric ? 'numeric' : undefined}
                  maxLength={f.maxLen}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChange={e => f.setter(f.numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
                />
              </div>
            ))}
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 4 }}>{error}</p>}
            <button
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 16, borderRadius: 14, background: BLUE }}
              onClick={sendOTP}
              disabled={loading || !name.trim() || phone.length !== 10}
            >
              {loading ? 'Sending OTP…' : 'Continue →'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 20, color: T2, fontSize: 14 }}>
              Already registered? <a href="/captain/login" style={{ color: BLUE, fontWeight: 700 }}>Login</a>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: T2, marginBottom: 16, fontSize: 14 }}>6-digit OTP sent to +91 {phone}</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Enter OTP</label>
            <input
              className="field"
              type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
              value={otp}
              autoFocus
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: 'center' }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <button
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 20, borderRadius: 14, background: BLUE }}
              onClick={verifyOTP}
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Registering…' : 'Register'}
            </button>
            <button
              style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: BLUE, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              onClick={() => { setPhase('form'); setOtp(''); setError('') }}
            >
              ← Change number
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CaptainRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
