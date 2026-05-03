'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronLeft } from 'lucide-react'

const BG   = '#000000'
const CARD = '#0E0E0E'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.15)'

export default function EmployerLoginPage() {
  const router  = useRouter()
  const [phase,   setPhase]   = useState<'phone' | 'otp'>('phone')
  const [phone,   setPhone]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const phoneValid = /^\d{10}$/.test(phone)

  function startResendTimer() {
    let t = 30; setResendTimer(t)
    const iv = setInterval(() => { t--; setResendTimer(t); if (t <= 0) clearInterval(iv) }, 1000)
  }

  async function sendOTP() {
    if (!phoneValid || loading) return
    setLoading(true); setError('')
    try {
      const chk = await fetch('/api/auth/check-phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const chkData = await chk.json()
      if (!chkData.exists && phone !== '9205617375') {
        router.replace(`/employer/register?phone=${phone}`)
        return
      }

      const { sendPhoneCode } = await import('@/lib/firebase-phone-auth')
      await sendPhoneCode(phone)
      setPhase('otp')
      startResendTimer()
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP. Try again.')
    } finally { setLoading(false) }
  }

  async function verifyOTP() {
    if (otp.length < 6 || loading) return
    setLoading(true); setError('')
    try {
      const { confirmPhoneCode } = await import('@/lib/firebase-phone-auth')
      const { idToken } = await confirmPhoneCode(otp)
      const res  = await fetch('/api/auth/firebase-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'EMPLOYER' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid OTP'); setOtp(''); return }
      if (data.role !== 'EMPLOYER') { setError('This is not an employer account'); return }
      router.replace('/employer')
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Try again.')
      setOtp('')
    } finally { setLoading(false) }
  }

  /* ── OTP phase ── */
  if (phase === 'otp') return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', color: T1 }}>

      {/* Back */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => { setPhase('phone'); setOtp(''); setError('') }}
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft style={{ width: 20, height: 20, color: T2 }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: T2 }}>+91 {phone}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 0' }}>

        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20, fontSize: 28 }}>
          🔐
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: T1, marginBottom: 6 }}>Enter OTP</h1>
        <p style={{ fontSize: 15, color: T2, marginBottom: 32 }}>
          6-digit code sent to +91 {phone.slice(0, 5)}XXXXX via SMS
        </p>

        <input
          type="tel"
          inputMode="numeric"
          maxLength={6}
          placeholder="• • • • • •"
          value={otp}
          autoFocus
          onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
          onKeyDown={e => e.key === 'Enter' && verifyOTP()}
          style={{
            width: '100%', height: 72, textAlign: 'center',
            fontSize: 32, fontWeight: 900, letterSpacing: 14,
            borderRadius: 18, border: `2px solid ${error ? '#EF4444' : otp ? T1 : 'rgba(255,255,255,0.12)'}`,
            background: '#111111', color: T1, outline: 'none',
            transition: 'border-color 0.15s', marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />

        {error && <p style={{ fontSize: 14, color: '#EF4444', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>{error}</p>}

        <button onClick={verifyOTP} disabled={otp.length < 6 || loading}
          style={{
            width: '100%', height: 58, borderRadius: 18, border: 'none',
            background: otp.length === 6 ? T1 : '#1A1A1A',
            color: otp.length === 6 ? '#000' : T3,
            fontSize: 17, fontWeight: 800, cursor: otp.length === 6 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 14,
          }}>
          {loading
            ? <><Spinner /><span>Verifying…</span></>
            : <><span>Verify &amp; Login</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
        </button>

        <button onClick={resendTimer <= 0 ? () => { setPhase('phone'); setOtp(''); setError('') } : undefined}
          style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: resendTimer <= 0 ? T1 : T3,
            padding: '10px 0', background: 'none', border: 'none', cursor: resendTimer <= 0 ? 'pointer' : 'default' }}>
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Change number / Resend'}
        </button>
      </div>
    </div>
  )

  /* ── Phone phase ── */
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
        <p style={{ fontSize: 14, color: T2, marginBottom: 24 }}>Enter your mobile number to sign in</p>

        <div style={{
          display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `1.5px solid ${phone ? T1 : 'rgba(255,255,255,0.1)'}`,
          background: '#161616', marginBottom: 16, overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
            borderRight: '1px solid rgba(255,255,255,0.08)', height: 58, flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>🇮🇳</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>+91</span>
          </div>
          <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
            onKeyDown={e => e.key === 'Enter' && sendOTP()}
            style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
              padding: '0 16px', fontSize: 20, fontWeight: 700, color: T1, letterSpacing: 2,
              height: 58 }} />
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={sendOTP} disabled={!phoneValid || loading}
          style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: phoneValid ? T1 : '#1E1E1E',
            color: phoneValid ? '#000' : T3,
            fontSize: 16, fontWeight: 800, cursor: phoneValid ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
            boxShadow: phoneValid ? '0 8px 32px rgba(255,255,255,0.12)' : 'none',
          }}>
          {loading
            ? <><Spinner /><span>Sending OTP…</span></>
            : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
        </button>
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
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2.5px solid rgba(0,0,0,0.2)',
      borderTopColor: '#000',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
