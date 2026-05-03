'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronLeft, Star, Zap, IndianRupee } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
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
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: 'login' }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.notRegistered) { router.push(`/register?phone=${encodeURIComponent(phone)}`); return }
        setError(data.error || 'Failed to send OTP. Try again.'); return
      }
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
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role: 'WORKER' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid OTP'); setOtp(''); return }
      localStorage.setItem('sw_role', (data.role as string).toLowerCase())
      router.push('/')
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Try again.')
      setOtp('')
    } finally { setLoading(false) }
  }

  /* ── OTP screen ── */
  if (phase === 'otp') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', color: '#fff' }}>

      {/* Back */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => { setPhase('phone'); setOtp(''); setError('') }}
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.5)' }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>+91 {phone}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 0' }}>

        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20, fontSize: 28 }}>
          🔐
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Enter OTP</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>
          6-digit code sent to +91 {phone.slice(0, 5)}XXXXX via SMS
        </p>

        {/* OTP input */}
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
            borderRadius: 18, border: `2px solid ${error ? '#EF4444' : otp ? '#fff' : 'rgba(255,255,255,0.12)'}`,
            background: '#111', color: '#fff', outline: 'none',
            transition: 'border-color 0.15s', marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />

        {error && <p style={{ fontSize: 14, color: '#EF4444', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>{error}</p>}

        <button onClick={verifyOTP} disabled={otp.length < 6 || loading}
          style={{
            width: '100%', height: 58, borderRadius: 18, border: 'none',
            background: otp.length === 6 ? '#fff' : '#1A1A1A',
            color: otp.length === 6 ? '#000' : 'rgba(255,255,255,0.15)',
            fontSize: 17, fontWeight: 800, cursor: otp.length === 6 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 14,
            boxShadow: otp.length === 6 ? '0 8px 32px rgba(255,255,255,0.12)' : 'none',
          }}>
          {loading
            ? <><Spinner /><span>Verifying…</span></>
            : <><span>Verify &amp; Login</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
        </button>

        <button onClick={resendTimer <= 0 ? () => { setPhase('phone'); setOtp(''); setError('') } : undefined}
          style={{ textAlign: 'center', fontSize: 14, fontWeight: 600,
            color: resendTimer <= 0 ? '#fff' : 'rgba(255,255,255,0.2)',
            padding: '10px 0', background: 'none', border: 'none',
            cursor: resendTimer <= 0 ? 'pointer' : 'default' }}>
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Change number / Resend'}
        </button>
      </div>
    </div>
  )

  /* ── Phone screen ── */
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      paddingBottom: 'env(safe-area-inset-bottom)', color: '#fff' }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: '50vh', overflow: 'hidden', flexShrink: 0 }}>
        <img src="/workers.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)' }} />

        {/* Logo top */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', left: 20,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#000' }}>S</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Switch</span>
        </div>

        {/* Hero text */}
        <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Earn up to</p>
          <p style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2, marginBottom: 6 }}>₹45,000</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>per month, working near you</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: <IndianRupee style={{ width: 12, height: 12 }} />, v: '₹99–₹129/hr' },
              { icon: <Star        style={{ width: 12, height: 12 }} />, v: '4.8 Rated'    },
              { icon: <Zap         style={{ width: 12, height: 12 }} />, v: 'Daily Pay'     },
            ].map(({ icon, v }) => (
              <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {icon}
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ flex: 1, background: '#000', borderRadius: '24px 24px 0 0', marginTop: -20,
        padding: '28px 20px 32px', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 24px' }} />

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Welcome back!</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>Enter your mobile number to continue</p>

        {/* Phone input */}
        <div style={{
          display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `1.5px solid ${phone ? '#fff' : 'rgba(255,255,255,0.1)'}`,
          background: '#111', marginBottom: 14, overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
            borderRight: '1px solid rgba(255,255,255,0.08)', height: 58, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>+91</span>
          </div>
          <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
            onKeyDown={e => e.key === 'Enter' && sendOTP()}
            style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
              padding: '0 14px', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 2, height: 58 }} />
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={sendOTP} disabled={!phoneValid || loading}
          style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: phoneValid ? '#fff' : '#1A1A1A',
            color: phoneValid ? '#000' : 'rgba(255,255,255,0.15)',
            fontSize: 16, fontWeight: 800, cursor: phoneValid ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 12,
            boxShadow: phoneValid ? '0 8px 32px rgba(255,255,255,0.12)' : 'none',
          }}>
          {loading
            ? <><Spinner /><span>Sending OTP…</span></>
            : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
        </button>

        <button onClick={() => router.push('/register')}
          style={{ width: '100%', height: 52, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          New to Switch? Create account
        </button>
      </div>
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
