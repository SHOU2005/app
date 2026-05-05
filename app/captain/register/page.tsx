'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

const FONT = '"DM Sans", system-ui, sans-serif'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { t }  = useLanguage()

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState(params.get('phone') || '')
  const [city,    setCity]    = useState('')
  const [otp,     setOtp]     = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const phoneOk  = /^\d{10}$/.test(phone)
  const otpOk    = /^\d{6}$/.test(otp)
  const formOk   = name.trim().length > 1 && phoneOk && city.trim().length > 0

  async function handleSendOtp() {
    if (!formOk || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('networkError')); return }
      setOtpSent(true)
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
        body: JSON.stringify({ phone, otp, role: 'CAPTAIN', name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('registerFailed')); return }
      router.replace('/captain')
    } catch (e: any) {
      setError(e.message || t('networkError'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#111111', padding: '40px 24px 28px', paddingTop: 'calc(40px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#111111', lineHeight: 1, letterSpacing: -1, fontFamily: '"DM Sans", sans-serif' }}>S</span>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>{t('joinAsCaptain')}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{t('joinTagline')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[t('onboardWorkers'), t('buildTerritory'), t('dailyCommissions')].map(txt => (
            <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CheckCircle style={{ width: 11, height: 11, color: '#22C55E' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: '24px 24px 0 0', marginTop: -16, padding: '28px 24px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111111', margin: '0 0 6px' }}>{t('createYourAccount')}</h2>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: '0 0 24px' }}>{t('fillDetails')}</p>

        {/* Full name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>
            {t('fullName')}
          </label>
          <input
            type="text" placeholder={t('namePlaceholder')}
            value={name} disabled={otpSent}
            onChange={e => { setName(e.target.value); setError('') }}
            style={{ width: '100%', height: 54, borderRadius: 14, border: `1.5px solid ${name.trim().length > 1 ? '#111111' : 'rgba(0,0,0,0.12)'}`,
              background: '#FAFAFA', outline: 'none', padding: '0 14px', fontSize: 16, fontWeight: 600,
              color: '#111111', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
              opacity: otpSent ? 0.6 : 1 }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>
            {t('mobileNumber')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${phoneOk ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', overflow: 'hidden', transition: 'border-color 0.15s', opacity: otpSent ? 0.6 : 1 }}>
            <div style={{ padding: '0 14px', borderRight: '1px solid rgba(0,0,0,0.08)', height: 54, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>🇮🇳</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>+91</span>
            </div>
            <input
              type="tel" inputMode="numeric" maxLength={10} placeholder={t('phonePlaceholder')}
              value={phone} disabled={otpSent}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2, height: 54 }}
            />
          </div>
        </div>

        {/* City */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>
            {t('cityTerritoryLabel')} *
          </label>
          <input
            type="text" placeholder={t('cityPlaceholder')}
            value={city} disabled={otpSent}
            onChange={e => setCity(e.target.value)}
            style={{ width: '100%', height: 54, borderRadius: 14, border: `1.5px solid ${city ? '#111111' : 'rgba(0,0,0,0.12)'}`,
              background: '#FAFAFA', outline: 'none', padding: '0 14px', fontSize: 16, fontWeight: 600,
              color: '#111111', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
              opacity: otpSent ? 0.6 : 1 }}
          />
        </div>

        {/* OTP entry */}
        {otpSent && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#111111', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }}>
              OTP sent to +91 {phone}
            </label>
            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 10 }}>Check your SMS inbox</p>
            <div style={{ border: `1.5px solid ${otpOk ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', overflow: 'hidden' }}>
              <input
                type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                value={otp} autoFocus
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  padding: '0 16px', fontSize: 28, fontWeight: 800, color: '#111111', letterSpacing: 8, height: 64,
                  boxSizing: 'border-box' as const }}
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {!otpSent ? (
          <button onClick={handleSendOtp} disabled={!formOk || loading}
            style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
              background: formOk ? '#111111' : '#E5E5E5',
              color: formOk ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
              fontSize: 16, fontWeight: 800, cursor: formOk ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s', marginBottom: 20,
              boxShadow: formOk ? '0 8px 24px rgba(0,0,0,0.18)' : 'none' }}>
            {loading ? <Spinner /> : <><span>Send OTP</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
          </button>
        ) : (
          <>
            <button onClick={handleVerify} disabled={!otpOk || loading}
              style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: otpOk ? '#111111' : '#E5E5E5',
                color: otpOk ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                fontSize: 16, fontWeight: 800, cursor: otpOk ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginBottom: 12,
                boxShadow: otpOk ? '0 8px 24px rgba(0,0,0,0.18)' : 'none' }}>
              {loading ? <Spinner /> : <><span>Verify & Create Account</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
            <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
              style={{ width: '100%', height: 44, background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(0,0,0,0.4)', fontSize: 14, fontWeight: 600 }}>
              ← Change number / Resend OTP
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          {t('alreadyRegistered')}{' '}
          <a href="/captain/login" style={{ color: '#111111', fontWeight: 800, textDecoration: 'none' }}>{t('signIn')} →</a>
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

export default function CaptainRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
