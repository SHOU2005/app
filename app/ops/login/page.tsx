'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BG   = '#000000'
const S1   = '#0F0F0F'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.4)'
const BD   = 'rgba(255,255,255,0.08)'
const FONT = '"DM Sans", system-ui, sans-serif'

const useFirebase = false

export default function OpsLoginPage() {
  const router = useRouter()
  const [phone,   setPhone]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [phase,   setPhase]   = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function sendOTP() {
    if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return }
    setLoading(true); setError('')
    try {
      if (useFirebase) {
        const { sendPhoneCode } = await import('@/lib/firebase-phone-auth')
        await sendPhoneCode(phone)
      } else {
        const res  = await fetch('/api/auth/send-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, mode: 'register' }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed to send OTP'); return }
      }
      setPhase('otp')
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function verifyOTP() {
    if (otp.length < 4) return
    setLoading(true); setError('')
    try {
      let res, data
      if (useFirebase) {
        const { confirmPhoneCode } = await import('@/lib/firebase-phone-auth')
        const { idToken } = await confirmPhoneCode(otp)
        res  = await fetch('/api/auth/firebase-verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, role: 'OPS' }),
        })
        data = await res.json()
      } else {
        res  = await fetch('/api/auth/verify-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp, role: 'OPS' }),
        })
        data = await res.json()
      }
      if (!res.ok) { setError(data.error || 'Invalid OTP'); return }
      if (data.role !== 'OPS') { setError('Not an Ops account'); return }
      router.replace('/ops')
    } catch (e: any) {
      setError(e?.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>⚡</div>
          <h1 style={{ color: T1, fontWeight: 800, fontSize: 22, margin: 0 }}>Ops Portal</h1>
          <p style={{ color: T2, fontSize: 14, margin: '6px 0 0' }}>Internal operations team login</p>
        </div>

        {phase === 'phone' ? (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Mobile Number</label>
            <input
              style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 16px', color: T1, fontSize: 18, fontWeight: 600, letterSpacing: 2, outline: 'none', boxSizing: 'border-box' }}
              type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <div id="firebase-recaptcha" style={{ display: 'none', marginTop: 12 }} />
            <button onClick={sendOTP} disabled={loading || phone.length !== 10}
              style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 12, background: T1, color: '#000000', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', opacity: phone.length !== 10 ? 0.4 : 1 }}>
              {loading ? 'Verify & Send OTP…' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: T2, fontSize: 14, marginBottom: 12 }}>OTP sent to +91 {phone}</p>
            <input
              style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 16px', color: T1, fontSize: 28, fontWeight: 800, letterSpacing: 12, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
              type="tel" inputMode="numeric" maxLength={6} placeholder="OTP"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              autoFocus
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <button onClick={verifyOTP} disabled={loading || otp.length < 4}
              style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 12, background: T1, color: '#000000', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', opacity: otp.length < 4 ? 0.4 : 1 }}>
              {loading ? 'Verifying…' : 'Login'}
            </button>
            <button onClick={() => { setPhase('phone'); setOtp(''); setError('') }}
              style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: T2, cursor: 'pointer', fontSize: 13 }}>
              ← Change number
            </button>
          </>
        )}
      </div>
    </div>
  )
}
