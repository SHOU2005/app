'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#2563EB'
const FONT = '"DM Sans", system-ui, sans-serif'

const SKILL_OPTIONS = ['Cleaning', 'Cooking', 'Security', 'Driving', 'Delivery', 'Warehouse', 'Reception', 'Retail', 'Housekeeping', 'Other']

export default function OnboardWorkerPage() {
  const router = useRouter()
  const [step,    setStep]    = useState(1)
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [city,    setCity]    = useState('')
  const [skills,  setSkills]  = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function toggleSkill(s: string) {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function submit() {
    setLoading(true); setError('')
    const res = await fetch('/api/captain/onboard-worker', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, phone, city, skills }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    setStep(3)
  }

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title="Register Worker" />

      <div style={{ display: 'flex', gap: 8, padding: '16px 20px' }}>
        {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? '#059669' : '#E5E7EB', transition: 'background 0.3s' }} />)}
      </div>

      <div style={{ padding: '0 20px' }}>
        {step === 1 && (
          <>
            <p style={{ fontWeight: 700, color: T1, fontSize: 18, marginBottom: 20 }}>Worker Details</p>
            {[
              { label: 'Full Name *', value: name, setter: setName, placeholder: 'Worker full name', type: 'text' },
              { label: 'Mobile Number *', value: phone, setter: setPhone, placeholder: '10-digit number', type: 'tel', maxLen: 10, numeric: true },
              { label: 'City', value: city, setter: setCity, placeholder: 'e.g. Bangalore', type: 'text' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input className="field" type={f.type} inputMode={f.numeric ? 'numeric' : undefined} maxLength={f.maxLen} placeholder={f.placeholder} value={f.value} onChange={e => f.setter(f.numeric ? e.target.value.replace(/\D/g, '') : e.target.value)} />
              </div>
            ))}
            {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
            <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 8, background: BLUE, borderRadius: 14 }} onClick={() => { if (!name || phone.length !== 10) { setError('Fill required fields'); return }; setError(''); setStep(2) }}>
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ fontWeight: 700, color: T1, fontSize: 18, marginBottom: 8 }}>Skills</p>
            <p style={{ color: T2, fontSize: 14, marginBottom: 16 }}>Select the worker's skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {SKILL_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${skills.includes(s) ? '#059669' : 'rgba(0,0,0,0.12)'}`, background: skills.includes(s) ? '#DCFCE7' : '#FFFFFF', color: skills.includes(s) ? '#166534' : T2, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
            {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
            <button className="btn btn-primary btn-lg btn-full" style={{ background: '#059669', borderRadius: 14 }} onClick={submit} disabled={loading}>
              {loading ? 'Registering…' : 'Register Worker'}
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 22, fontWeight: 800, color: T1, marginBottom: 8 }}>Worker Registered!</p>
            <p style={{ color: T2, fontSize: 15, marginBottom: 16 }}><strong>{name}</strong> has been added to the platform.</p>
            <div style={{ background: '#F0F9FF', borderRadius: 14, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontWeight: 700, color: BLUE, margin: '0 0 4px', fontSize: 14 }}>Next Step for Worker</p>
              <p style={{ color: T2, margin: 0, fontSize: 13 }}>Ask <strong>{name}</strong> to download the Switch Worker app and complete their KYC (Aadhaar + Selfie) to start accepting shifts.</p>
            </div>
            <p style={{ color: '#059669', fontSize: 14, fontWeight: 600 }}>You will earn ₹100 commission when they complete their first shift.</p>
            <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 24, background: BLUE, borderRadius: 14 }} onClick={() => router.push('/captain')}>
              Back to Home
            </button>
          </div>
        )}
      </div>

      {step !== 3 && <CaptainBottomNav />}
    </div>
  )
}
