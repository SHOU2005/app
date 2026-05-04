'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Star, Zap, IndianRupee } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const canSubmit = /^\d{10}$/.test(phone) && password.length >= 1

  async function login() {
    if (!canSubmit || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid phone or password')
        return
      }
      localStorage.setItem('sw_role', 'worker')
      router.push('/')
    } catch {
      setError('Network error. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      paddingBottom: 'env(safe-area-inset-bottom)', color: '#fff' }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: '45vh', overflow: 'hidden', flexShrink: 0 }}>
        <img src="/workers.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)' }} />

        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', left: 20,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#000' }}>S</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Switch</span>
        </div>

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

        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 24px' }} />

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Welcome back!</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>Sign in to your account</p>

        {/* Phone */}
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `1.5px solid ${phone ? '#fff' : 'rgba(255,255,255,0.1)'}`,
          background: '#111', marginBottom: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
            borderRight: '1px solid rgba(255,255,255,0.08)', height: 58, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>+91</span>
          </div>
          <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('worker-pass')?.focus()}
            style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
              padding: '0 14px', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 2, height: 58 }} />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `1.5px solid ${password ? '#fff' : 'rgba(255,255,255,0.1)'}`,
          background: '#111', marginBottom: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
          <input id="worker-pass" type={showPass ? 'text' : 'password'} placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
              padding: '0 14px', fontSize: 16, fontWeight: 600, color: '#fff', height: 58 }} />
          <button onClick={() => setShowPass(s => !s)}
            style={{ padding: '0 14px', height: 58, background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center' }}>
            {showPass ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={login} disabled={!canSubmit || loading}
          style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: canSubmit ? '#fff' : '#1A1A1A',
            color: canSubmit ? '#000' : 'rgba(255,255,255,0.15)',
            fontSize: 16, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 12,
            boxShadow: canSubmit ? '0 8px 32px rgba(255,255,255,0.12)' : 'none' }}>
          {loading
            ? <><Spinner /><span>Signing in…</span></>
            : <><span>Sign In</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
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
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(0,0,0,0.2)',
      borderTopColor: '#000', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
