'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BG   = '#FFFFFF'
const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#111111'
const FONT = '"DM Sans", system-ui, sans-serif'

export default function CaptainLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp,   setOtp]   = useState('')
  const [phase, setPhase] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function sendOTP() {
    if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return }
    setLoading(true); setError('')
    try {
      const { sendPhoneCode } = await import('@/lib/firebase-phone-auth')
      await sendPhoneCode(phone)
      setPhase('otp')
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function verifyOTP() {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const { confirmPhoneCode } = await import('@/lib/firebase-phone-auth')
      const { idToken } = await confirmPhoneCode(otp)
      const res  = await fetch('/api/auth/firebase-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'CAPTAIN' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid OTP'); return }
      if (data.role !== 'CAPTAIN') { setError('Not a captain account'); return }
      router.replace('/captain')
    } catch (e: any) {
      setError(e?.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            🧭
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T1, margin: 0 }}>Captain Login</h1>
          <p style={{ color: T2, marginTop: 8, fontSize: 15 }}>Field executive portal</p>
        </div>

        {phase === 'phone' ? (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Mobile Number</label>
            <input
              className="field"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              style={{ fontSize: 18, fontWeight: 600, letterSpacing: 2 }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <div id="firebase-recaptcha" style={{ display: 'none' }} />
            <button
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 20, borderRadius: 14 }}
              onClick={sendOTP}
              disabled={loading || phone.length !== 10}
            >
              {loading ? 'Verify & Send OTP…' : 'Send OTP'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 24, color: T2, fontSize: 14 }}>
              New captain?{' '}
              <a href="/captain/register" style={{ color: BLUE, fontWeight: 700 }}>Register here</a>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: T2, fontSize: 14, marginBottom: 16 }}>OTP sent to +91 {phone}</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Enter OTP</label>
            <input
              className="field"
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: 'center' }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <button
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 20, borderRadius: 14 }}
              onClick={verifyOTP}
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>
            <button
              style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: BLUE, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              onClick={() => { setPhase('phone'); setOtp(''); setError('') }}
            >
              ← Change number
            </button>
          </>
        )}
      </div>
    </div>
  )
}
