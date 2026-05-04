'use client'
import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Check, ChevronLeft, Eye, EyeOff } from 'lucide-react'

const JOB_TYPES = [
  { id: 'shop',         emoji: '🏪', label: 'Shop Helper'      },
  { id: 'delivery',     emoji: '🚴', label: 'Delivery Rider'   },
  { id: 'security',     emoji: '🔒', label: 'Security Guard'   },
  { id: 'kitchen',      emoji: '🍳', label: 'Kitchen Helper'   },
  { id: 'warehouse',    emoji: '🏭', label: 'Warehouse Staff'  },
  { id: 'cleaning',     emoji: '🧹', label: 'Cleaning Staff'   },
  { id: 'driver',       emoji: '🚗', label: 'Driver'           },
  { id: 'construction', emoji: '🏗️', label: 'Construction'    },
  { id: 'packing',      emoji: '📦', label: 'Packing Staff'    },
  { id: 'cashier',      emoji: '🛒', label: 'Cashier'          },
  { id: 'painter',      emoji: '🎨', label: 'Painter'          },
  { id: 'electrician',  emoji: '⚡', label: 'Electrician'      },
]

function RegisterForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Step 1 fields
  const [name,        setName]        = useState('')
  const [phone,       setPhone]       = useState(searchParams?.get('phone') ?? '')
  const [city,        setCity]        = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [referral,    setReferral]    = useState(searchParams?.get('ref') ?? '')

  // Step 2 fields
  const [jobs, setJobs] = useState<Set<string>>(new Set())

  const canRegister = name.trim().length >= 2 && /^\d{10}$/.test(phone) && password.length >= 6 && password === confirm

  async function register() {
    if (!canRegister || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone, password, role: 'WORKER', city: city.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      localStorage.setItem('sw_role', 'worker')
      setStep(2)
    } catch {
      setError('Network error. Try again.')
    } finally { setLoading(false) }
  }

  async function finishProfile() {
    setLoading(true)
    try {
      if (jobs.size > 0) {
        await fetch('/api/worker/profile', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills: Array.from(jobs) }),
        })
      }
    } catch {}
    router.push('/')
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['', '#EF4444', '#F59E0B', '#22C55E'][passwordStrength]

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 8px' }}>
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)}
            style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0F0F0',
              border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: 20, height: 20, color: 'rgba(0,0,0,0.6)' }} />
          </button>
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 14, background: '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Step {step} of 2
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#111111', marginTop: 1 }}>
            {step === 1 ? 'Create Account' : 'What work do you do?'}
          </p>
        </div>
        {step === 1 && (
          <button onClick={() => router.push('/login')}
            style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Login
          </button>
        )}
      </div>

      {/* Step bar */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 20px 12px' }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 8,
            background: s <= step ? '#111111' : 'rgba(0,0,0,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>Join Switch</p>
            <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>Find part-time jobs near you</p>

            {/* Full name */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Full Name *</p>
              <input value={name} onChange={e => { setName(e.target.value); setError('') }}
                placeholder="Your full name"
                style={{ width: '100%', height: 54, paddingLeft: 16, paddingRight: 16, borderRadius: 14,
                  background: '#F5F5F5', border: `1.5px solid ${name.length >= 2 ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                  fontSize: 16, fontWeight: 600, color: '#111111', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Mobile Number *</p>
              <div style={{ display: 'flex', height: 54, borderRadius: 14, overflow: 'hidden',
                background: '#F5F5F5', border: `1.5px solid ${/^\d{10}$/.test(phone) ? '#111111' : 'rgba(0,0,0,0.1)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
                  borderRight: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>🇮🇳</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>+91</span>
                </div>
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number"
                  value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    paddingLeft: 14, fontSize: 18, fontWeight: 700, color: '#111111', letterSpacing: 2 }} />
              </div>
            </div>

            {/* City */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>City <span style={{ fontWeight: 400 }}>(optional)</span></p>
              <input value={city} onChange={e => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Delhi"
                style={{ width: '100%', height: 54, paddingLeft: 16, paddingRight: 16, borderRadius: 14,
                  background: '#F5F5F5', border: '1.5px solid rgba(0,0,0,0.1)',
                  fontSize: 16, fontWeight: 600, color: '#111111', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Referral */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
                Captain Referral Code <span style={{ fontWeight: 400 }}>(optional)</span>
              </p>
              <input value={referral} onChange={e => setReferral(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="e.g. SW4X7RKM"
                style={{ width: '100%', height: 50, padding: '0 16px', borderRadius: 14,
                  background: '#F5F5F5', border: '1.5px solid rgba(0,0,0,0.1)',
                  fontSize: 15, fontWeight: 700, color: '#111111', outline: 'none',
                  letterSpacing: 3, boxSizing: 'border-box' as const }} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Password *</p>
              <div style={{ display: 'flex', height: 54, borderRadius: 14, overflow: 'hidden',
                background: '#F5F5F5', border: `1.5px solid ${password.length >= 6 ? '#111111' : 'rgba(0,0,0,0.1)'}` }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    paddingLeft: 16, fontSize: 16, fontWeight: 600, color: '#111111' }} />
                <button onClick={() => setShowPass(s => !s)}
                  style={{ padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#E5E5E5', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(passwordStrength / 3) * 100}%`,
                      background: strengthColor, transition: 'all 0.3s', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: strengthColor }}>
                    {['', 'Weak', 'Good', 'Strong'][passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>Confirm Password *</p>
              <div style={{ display: 'flex', height: 54, borderRadius: 14, overflow: 'hidden',
                background: '#F5F5F5',
                border: `1.5px solid ${confirm ? (confirm === password ? '#22C55E' : '#EF4444') : 'rgba(0,0,0,0.1)'}` }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Re-enter password"
                  value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && register()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    paddingLeft: 16, fontSize: 16, fontWeight: 600, color: '#111111' }} />
              </div>
              {confirm && confirm !== password && (
                <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 4 }}>Passwords don't match</p>
              )}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
                padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button onClick={register} disabled={!canRegister || loading}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: canRegister ? '#111111' : 'rgba(0,0,0,0.07)',
                color: canRegister ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                boxShadow: canRegister ? '0 8px 32px rgba(0,0,0,0.15)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: canRegister ? 'pointer' : 'default' }}>
              {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 16 }}>
              Already registered?{' '}
              <button onClick={() => router.push('/login')}
                style={{ color: '#111111', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                Sign In
              </button>
            </p>
          </div>
        )}

        {/* ── STEP 2: Job types ── */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#111111', marginBottom: 4 }}>What work do you do?</p>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 20 }}>Select all that apply — you can change later</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {JOB_TYPES.map(j => {
                const on = jobs.has(j.id)
                return (
                  <button key={j.id} onClick={() => setJobs(prev => { const n = new Set(prev); n.has(j.id) ? n.delete(j.id) : n.add(j.id); return n })}
                    style={{ padding: '14px 8px', borderRadius: 16, cursor: 'pointer',
                      background: on ? 'rgba(17,17,17,0.06)' : '#F5F5F5',
                      border: `2px solid ${on ? '#111111' : 'rgba(0,0,0,0.08)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s', position: 'relative' }}>
                    <span style={{ fontSize: 22 }}>{j.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? '#111111' : 'rgba(0,0,0,0.5)',
                      textAlign: 'center', lineHeight: 1.3 }}>{j.label}</span>
                    {on && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%',
                        background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check style={{ width: 11, height: 11, color: '#fff' }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button onClick={finishProfile} disabled={loading}
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none',
                background: '#111111', color: '#FFFFFF',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', marginBottom: 12 }}>
              {loading ? 'Saving…' : <><span>Done — Find Jobs</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>

            <button onClick={() => router.push('/')}
              style={{ width: '100%', height: 48, borderRadius: 16, fontSize: 15, fontWeight: 600, border: 'none',
                background: 'transparent', color: 'rgba(0,0,0,0.35)', cursor: 'pointer' }}>
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorkerRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
