'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
    if (!name || phone.length !== 10) { setError('Fill all required fields'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/send-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, mode: 'register' }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    setPhase('otp')
  }

  async function verifyOTP() {
    setLoading(true); setError('')
    const res = await fetch('/api/auth/verify-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, otp, role: 'CAPTAIN' }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); setError(data.error || 'Invalid OTP'); return }
    // Update name and city
    await fetch('/api/captain/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, city }),
    })
    setLoading(false)
    router.replace('/captain')
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T1, marginBottom: 8 }}>Join as Captain</h1>
        <p style={{ color: T2, marginBottom: 32, fontSize: 15 }}>Field executive registration</p>

        {phase === 'form' ? (
          <>
            {[
              { label: 'Full Name *', value: name, setter: setName, placeholder: 'Your name', type: 'text' },
              { label: 'Mobile Number *', value: phone, setter: setPhone, placeholder: '10-digit number', type: 'tel', maxLen: 10, numeric: true },
              { label: 'City / Territory', value: city, setter: setCity, placeholder: 'e.g. Bangalore', type: 'text' },
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
            <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 8, borderRadius: 14, background: BLUE }} onClick={sendOTP} disabled={loading}>
              {loading ? 'Sending OTP…' : 'Continue →'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 20, color: T2, fontSize: 14 }}>
              Already registered? <a href="/captain/login" style={{ color: BLUE, fontWeight: 700 }}>Login</a>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: T2, marginBottom: 16, fontSize: 14 }}>OTP sent to +91 {phone}</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Enter OTP</label>
            <input
              className="field"
              type="tel" inputMode="numeric" maxLength={6} placeholder="OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: 'center' }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 20, borderRadius: 14, background: BLUE }} onClick={verifyOTP} disabled={loading || otp.length < 4}>
              {loading ? 'Registering…' : 'Register'}
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
