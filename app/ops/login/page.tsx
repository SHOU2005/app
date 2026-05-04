'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const BG   = '#000000'
const S1   = '#0F0F0F'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.4)'
const BD   = 'rgba(255,255,255,0.08)'
const FONT = '"DM Sans", system-ui, sans-serif'

export default function OpsLoginPage() {
  const router = useRouter()
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const canSubmit = /^\d{10}$/.test(phone) && password.length >= 6

  async function login() {
    if (!canSubmit || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/ops-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.replace('/ops')
    } catch {
      setError('Network error. Try again.')
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

        {/* Phone */}
        <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Mobile Number</label>
        <input
          style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 16px', color: T1, fontSize: 18, fontWeight: 600, letterSpacing: 2, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
          type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
          value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
          onKeyDown={e => e.key === 'Enter' && document.getElementById('ops-pass')?.focus()}
        />

        {/* Password */}
        <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Password</label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            id="ops-pass"
            style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 48px 14px 16px', color: T1, fontSize: 16, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
            type={showPass ? 'text' : 'password'} placeholder="Enter password"
            value={password} onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          <button onClick={() => setShowPass(s => !s)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T2, display: 'flex', alignItems: 'center', padding: 0 }}>
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 4 }}>{error}</p>}

        <button onClick={login} disabled={!canSubmit || loading}
          style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 12, background: T1, color: '#000000', fontWeight: 800, fontSize: 15, border: 'none', cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
