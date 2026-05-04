'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, MapPin, TrendingUp, Users } from 'lucide-react'

const FONT = '"DM Sans", system-ui, sans-serif'

export default function CaptainLoginPage() {
  const router = useRouter()
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const canSubmit = /^\d{10}$/.test(phone) && password.length >= 1

  async function login() {
    if (!canSubmit || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/captain-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.replace('/captain')
    } catch {
      setError('Network error. Check your connection.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#F8F8F8', display: 'flex', flexDirection: 'column' }}>

      {/* Top hero */}
      <div style={{ background: '#111111', padding: '48px 24px 36px', paddingTop: 'calc(48px + env(safe-area-inset-top))' }}>

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            🧭
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>Switch Captain</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Field executive portal</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { icon: <MapPin style={{ width: 14, height: 14 }} />, label: 'Your Territory' },
            { icon: <Users style={{ width: 14, height: 14 }} />, label: 'Onboard Workers' },
            { icon: <TrendingUp style={{ width: 14, height: 14 }} />, label: 'Earn Commission' },
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

        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111111', margin: '0 0 6px' }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: '0 0 28px' }}>Sign in to your captain account</p>

        {/* Phone */}
        <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Mobile Number
        </label>
        <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${phone ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}>
          <div style={{ padding: '0 14px', borderRight: '1px solid rgba(0,0,0,0.08)', height: 54, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>+91</span>
          </div>
          <input
            type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2, height: 54 }}
          />
        </div>

        {/* Password */}
        <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Password
        </label>
        <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${password ? '#111111' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, background: '#FAFAFA', marginBottom: 8, overflow: 'hidden', transition: 'border-color 0.15s' }}>
          <input
            type={showPass ? 'text' : 'password'} placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 16, fontWeight: 600, color: '#111111', height: 54 }}
          />
          <button onClick={() => setShowPass(s => !s)} style={{ padding: '0 14px', height: 54, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'rgba(0,0,0,0.35)', flexShrink: 0 }}>
            {showPass ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Login button */}
        <button onClick={login} disabled={!canSubmit || loading}
          style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: canSubmit ? '#111111' : '#E5E5E5',
            color: canSubmit ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
            fontSize: 16, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 20,
            boxShadow: canSubmit ? '0 8px 24px rgba(0,0,0,0.18)' : 'none',
          }}>
          {loading ? <Spinner /> : <><span>Sign In</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          New captain?{' '}
          <a href="/captain/register" style={{ color: '#111111', fontWeight: 800, textDecoration: 'none' }}>
            Create account →
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
