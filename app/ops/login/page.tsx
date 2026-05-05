'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { sendPhoneCode, confirmPhoneCode } from '@/lib/firebase-phone-auth'

const BG   = '#000000'
const S1   = '#0F0F0F'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.4)'
const BD   = 'rgba(255,255,255,0.08)'
const FONT = '"DM Sans", system-ui, sans-serif'

export default function OpsLoginPage() {
  const router = useRouter()
  const [phone,   setPhone]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [stage,   setStage]   = useState<'phone' | 'otp'>('phone')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const phoneOk = /^\d{10}$/.test(phone)
  const otpOk   = /^\d{6}$/.test(otp)

  async function handleSendOtp() {
    if (!phoneOk || loading) return
    setLoading(true); setError('')
    try {
      await sendPhoneCode(phone)
      setStage('otp')
      setCountdown(60)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleVerify() {
    if (!otpOk || loading) return
    setLoading(true); setError('')
    try {
      const { idToken } = await confirmPhoneCode(otp)
      const res  = await fetch('/api/auth/firebase-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role: 'OPS' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.replace('/ops')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  function handleOtpChange(v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 6)
    setOtp(clean); setError('')
    if (clean.length === 6) setTimeout(() => document.getElementById('ops-verify-btn')?.click(), 80)
  }

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: '#000', lineHeight: 1 }}>S</span>
          </div>
          <h1 style={{ color: T1, fontWeight: 800, fontSize: 22, margin: 0 }}>Ops Portal</h1>
          <p style={{ color: T2, fontSize: 14, margin: '6px 0 0' }}>Internal operations team login</p>
        </div>

        {stage === 'phone' ? (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Mobile Number</label>
            <input
              style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${phoneOk ? T1 : BD}`, borderRadius: 12,
                padding: '14px 16px', color: T1, fontSize: 18, fontWeight: 600, letterSpacing: 2, outline: 'none',
                boxSizing: 'border-box' as const, marginBottom: 16, transition: 'border-color 0.2s' }}
              type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number" autoFocus
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleSendOtp} disabled={!phoneOk || loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: phoneOk ? T1 : 'rgba(255,255,255,0.12)',
                color: phoneOk ? '#000000' : T2, fontWeight: 800, fontSize: 15, border: 'none',
                cursor: phoneOk ? 'pointer' : 'default', opacity: loading ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              {loading ? 'Sending OTP…' : <><span>Send OTP</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
          </>
        ) : (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 4 }}>Enter OTP</label>
            <p style={{ fontSize: 12, color: T2, marginBottom: 10 }}>Sent to +91 {phone}</p>
            <input
              style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${otpOk ? T1 : BD}`, borderRadius: 12,
                padding: '14px 20px', color: T1, fontSize: 28, fontWeight: 800, letterSpacing: 10, outline: 'none',
                boxSizing: 'border-box' as const, marginBottom: 8, transition: 'border-color 0.2s' }}
              type="tel" inputMode="numeric" maxLength={6} placeholder="_ _ _ _ _ _"
              value={otp} autoFocus
              onChange={e => handleOtpChange(e.target.value)}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 8 }}>{error}</p>}
            <button id="ops-verify-btn" onClick={handleVerify} disabled={!otpOk || loading}
              style={{ width: '100%', marginTop: 8, padding: '14px', borderRadius: 12, background: otpOk ? T1 : 'rgba(255,255,255,0.12)',
                color: otpOk ? '#000000' : T2, fontWeight: 800, fontSize: 15, border: 'none',
                cursor: otpOk ? 'pointer' : 'default', opacity: loading ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginBottom: 10 }}>
              {loading ? 'Verifying…' : <><span>Verify & Sign In</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
            <button onClick={() => { if (countdown > 0) return; setStage('phone'); setOtp(''); setError('') }}
              disabled={countdown > 0}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none',
                cursor: countdown > 0 ? 'default' : 'pointer',
                color: countdown > 0 ? 'rgba(255,255,255,0.15)' : T2, fontSize: 13, fontFamily: FONT }}>
              {countdown > 0 ? `Resend OTP in ${countdown}s` : '← Change number'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
