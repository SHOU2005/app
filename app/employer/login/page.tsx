'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { sendPhoneCode, confirmPhoneCode } from '@/lib/firebase-phone-auth'

const BG   = '#000000'
const CARD = '#0E0E0E'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.15)'

export default function EmployerLoginPage() {
  const router  = useRouter()
  const [phone,   setPhone]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [stage,   setStage]   = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const phoneOk = /^\d{10}$/.test(phone)
  const otpOk   = /^\d{6}$/.test(otp)

  async function handleSendOtp() {
    if (!phoneOk || loading) return
    setLoading(true); setError('')
    try {
      await sendPhoneCode(phone)
      setStage('otp')
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function handleVerify() {
    if (!otpOk || loading) return
    setLoading(true); setError('')
    try {
      const { idToken } = await confirmPhoneCode(otp)
      const res = await fetch('/api/auth/firebase-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'EMPLOYER' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      if (data.role !== 'EMPLOYER') { setError('This is not an employer account'); return }
      router.replace('/employer')
    } catch (e: any) {
      setError(e.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 24px env(safe-area-inset-bottom)', color: T1 }}>

      {/* Logo */}
      <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          boxShadow: '0 12px 40px rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#000', lineHeight: 1 }}>S</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: T1, letterSpacing: -0.5 }}>Switch Employer</p>
        <p style={{ fontSize: 14, color: T2, marginTop: 4 }}>Hire verified workers instantly</p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 400, background: CARD, borderRadius: 28,
        border: '1px solid rgba(255,255,255,0.07)', padding: '28px 24px' }}>

        <p style={{ fontSize: 22, fontWeight: 900, color: T1, marginBottom: 6 }}>Welcome back</p>
        <p style={{ fontSize: 14, color: T2, marginBottom: 24 }}>
          {stage === 'phone' ? 'Enter your mobile number to sign in' : `OTP sent to +91 ${phone}`}
        </p>

        {stage === 'phone' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: 16,
              border: `1.5px solid ${phoneOk ? T1 : 'rgba(255,255,255,0.1)'}`,
              background: '#161616', marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
                borderRight: '1px solid rgba(255,255,255,0.08)', height: 58, flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>🇮🇳</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>+91</span>
              </div>
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
                  padding: '0 16px', fontSize: 20, fontWeight: 700, color: T1, letterSpacing: 2, height: 58 }} />
            </div>
            {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <button onClick={handleSendOtp} disabled={!phoneOk || loading}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: phoneOk ? T1 : '#1E1E1E', color: phoneOk ? '#000' : T3,
                fontSize: 16, fontWeight: 800, cursor: phoneOk ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', boxShadow: phoneOk ? '0 8px 32px rgba(255,255,255,0.12)' : 'none' }}>
              {loading ? <><Spinner /><span>Sending…</span></> : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
          </>
        ) : (
          <>
            <div style={{ borderRadius: 16, border: `1.5px solid ${otpOk ? T1 : 'rgba(255,255,255,0.1)'}`,
              background: '#161616', marginBottom: 16, overflow: 'hidden' }}>
              <input type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                value={otp} autoFocus
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{ width: '100%', background: 'transparent', outline: 'none', border: 'none',
                  padding: '0 18px', fontSize: 28, fontWeight: 800, color: T1, letterSpacing: 8, height: 64,
                  boxSizing: 'border-box' }} />
            </div>
            {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <button onClick={handleVerify} disabled={!otpOk || loading}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: otpOk ? T1 : '#1E1E1E', color: otpOk ? '#000' : T3,
                fontSize: 16, fontWeight: 800, cursor: otpOk ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginBottom: 10,
                boxShadow: otpOk ? '0 8px 32px rgba(255,255,255,0.12)' : 'none' }}>
              {loading ? <><Spinner /><span>Verifying…</span></> : <><span>Verify & Sign In</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
            <button onClick={() => { setStage('phone'); setOtp(''); setError('') }}
              style={{ width: '100%', height: 40, background: 'none', border: 'none', cursor: 'pointer',
                color: T2, fontSize: 14, fontWeight: 600 }}>
              ← Change number
            </button>
          </>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: T2 }}>
        New employer?{' '}
        <button onClick={() => router.push('/employer/register')}
          style={{ color: T1, fontWeight: 800, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
          Register
        </button>
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(0,0,0,0.2)',
      borderTopColor: '#000', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
