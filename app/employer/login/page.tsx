'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

const BG   = '#000000'
const CARD = '#0E0E0E'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.15)'

export default function EmployerLoginPage() {
  const router  = useRouter()
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
      if (!res.ok) { setError(data.error || 'Invalid phone or password'); return }
      if (data.user?.role !== 'EMPLOYER') { setError('This is not an employer account'); return }
      router.replace('/employer')
    } catch {
      setError('Network error. Try again.')
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
        <p style={{ fontSize: 14, color: T2, marginBottom: 24 }}>Sign in to your employer account</p>

        {/* Phone */}
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `1.5px solid ${phone ? T1 : 'rgba(255,255,255,0.1)'}`,
          background: '#161616', marginBottom: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
            borderRight: '1px solid rgba(255,255,255,0.08)', height: 58, flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>🇮🇳</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>+91</span>
          </div>
          <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('emp-pass')?.focus()}
            style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
              padding: '0 16px', fontSize: 20, fontWeight: 700, color: T1, letterSpacing: 2, height: 58 }} />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 16,
          border: `1.5px solid ${password ? T1 : 'rgba(255,255,255,0.1)'}`,
          background: '#161616', marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
          <input id="emp-pass" type={showPass ? 'text' : 'password'} placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none',
              padding: '0 16px', fontSize: 16, fontWeight: 600, color: T1, height: 58 }} />
          <button onClick={() => setShowPass(s => !s)}
            style={{ padding: '0 14px', height: 58, background: 'none', border: 'none', cursor: 'pointer',
              color: T2, display: 'flex', alignItems: 'center' }}>
            {showPass ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={login} disabled={!canSubmit || loading}
          style={{ width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: canSubmit ? T1 : '#1E1E1E',
            color: canSubmit ? '#000' : T3,
            fontSize: 16, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', boxShadow: canSubmit ? '0 8px 32px rgba(255,255,255,0.12)' : 'none' }}>
          {loading
            ? <><Spinner /><span>Signing in…</span></>
            : <><span>Sign In</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
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
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(0,0,0,0.2)',
      borderTopColor: '#000', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
