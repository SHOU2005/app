'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin, TrendingUp, Users } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

const FONT = '"DM Sans", system-ui, sans-serif'

export default function CaptainLoginPage() {
  const router = useRouter()
  const { t }  = useLanguage()

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
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: 'login' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('networkError')); return }
      setStage('otp')
    } catch (e: any) {
      setError(e.message || t('networkError'))
    } finally { setLoading(false) }
  }

  async function handleVerify() {
    if (!otpOk || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role: 'CAPTAIN' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('loginFailed')); return }
      router.replace('/captain')
    } catch (e: any) {
      setError(e.message || t('networkError'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', display: 'flex', flexDirection: 'column' }}>

      {/* Top hero */}
      <div style={{ background: '#111111', padding: '48px 24px 36px', paddingTop: 'calc(48px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#111111', lineHeight: 1, letterSpacing: -1, fontFamily: '"DM Sans", sans-serif' }}>S</span>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>{t('appName')}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{t('appTagline')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { icon: <MapPin style={{ width: 14, height: 14 }} />, label: t('yourTerritory') },
            { icon: <Users style={{ width: 14, height: 14 }} />, label: t('onboardWorkers') },
            { icon: <TrendingUp style={{ width: 14, height: 14 }} />, label: t('earnCommission') },
          ].map(({ icon, label }) => (
            <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: '24px 24px 0 0', marginTop: -16, padding: '32px 24px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111111', margin: '0 0 6px' }}>{t('welcomeBack')}</h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: '0 0 28px' }}>
          {stage === 'phone' ? t('signInSubtitle') : `OTP sent to +91 ${phone}`}
        </p>

        {stage === 'phone' ? (
          <>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              {t('mobileNumber')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${phoneOk ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}>
              <div style={{ padding: '0 14px', borderRight: '1px solid rgba(0,0,0,0.08)', height: 54, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>🇮🇳</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>+91</span>
              </div>
              <input
                type="tel" inputMode="numeric" maxLength={10} placeholder={t('phonePlaceholder')}
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2, height: 54 }}
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button onClick={handleSendOtp} disabled={!phoneOk || loading}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: phoneOk ? '#111111' : '#E5E5E5',
                color: phoneOk ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                fontSize: 16, fontWeight: 800, cursor: phoneOk ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginBottom: 20,
                boxShadow: phoneOk ? '0 8px 24px rgba(0,0,0,0.18)' : 'none' }}>
              {loading ? <Spinner /> : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
          </>
        ) : (
          <>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Enter OTP
            </label>
            <div style={{ border: `1.5px solid ${otpOk ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', marginBottom: 16, overflow: 'hidden' }}>
              <input
                type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                value={otp} autoFocus
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  padding: '0 16px', fontSize: 28, fontWeight: 800, color: '#111111', letterSpacing: 8, height: 64,
                  boxSizing: 'border-box' as const }}
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button onClick={handleVerify} disabled={!otpOk || loading}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: otpOk ? '#111111' : '#E5E5E5',
                color: otpOk ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                fontSize: 16, fontWeight: 800, cursor: otpOk ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginBottom: 12,
                boxShadow: otpOk ? '0 8px 24px rgba(0,0,0,0.18)' : 'none' }}>
              {loading ? <Spinner /> : <><span>Verify & Sign In</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
            <button onClick={() => { setStage('phone'); setOtp(''); setError('') }}
              style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(0,0,0,0.4)', fontSize: 14, fontWeight: 600 }}>
              ← Change number
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          {t('newCaptain')}{' '}
          <a href="/captain/register" style={{ color: '#111111', fontWeight: 800, textDecoration: 'none' }}>
            {t('createAccount')} →
          </a>
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
