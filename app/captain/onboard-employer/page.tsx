'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#2563EB'
const FONT = '"DM Sans", system-ui, sans-serif'

const BUSINESS_TYPES = ['Restaurant', 'Hotel', 'Retail', 'Warehouse', 'Hospital', 'Office', 'Manufacturing', 'Other']

export default function OnboardEmployerPage() {
  const router = useRouter()
  const [step,        setStep]        = useState(1)
  const [name,        setName]        = useState('')
  const [phone,       setPhone]       = useState('')
  const [companyName, setCompanyName] = useState('')
  const [bizType,     setBizType]     = useState('')
  const [city,        setCity]        = useState('')
  const [address,     setAddress]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function submit() {
    if (!name || phone.length !== 10) { setError('Owner name and valid phone required'); return }
    setLoading(true); setError('')
    const res  = await fetch('/api/captain/onboard-employer', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, phone, companyName, businessType: bizType, city, address }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Failed to register'); return }
    setStep(3)
  }

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title="Register Employer" />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 20px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? BLUE : '#E5E7EB', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {step === 1 && (
          <>
            <p style={{ fontWeight: 700, color: T1, fontSize: 18, marginBottom: 20 }}>Owner Details</p>
            {[
              { label: 'Owner Name *', value: name, setter: setName, placeholder: 'Full name', type: 'text' },
              { label: 'Mobile Number *', value: phone, setter: setPhone, placeholder: '10-digit number', type: 'tel', maxLen: 10, numeric: true },
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
            <p style={{ fontWeight: 700, color: T1, fontSize: 18, marginBottom: 20 }}>Business Details</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 6 }}>Company Name</label>
              <input className="field" type="text" placeholder="Business name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 8 }}>Business Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BUSINESS_TYPES.map(t => (
                  <button key={t} onClick={() => setBizType(t)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${bizType === t ? BLUE : 'rgba(0,0,0,0.12)'}`, background: bizType === t ? `${BLUE}15` : '#FFFFFF', color: bizType === t ? BLUE : T2, cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: 'City', value: city, setter: setCity, placeholder: 'City' },
              { label: 'Address', value: address, setter: setAddress, placeholder: 'Full address' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input className="field" type="text" placeholder={f.placeholder} value={f.value} onChange={e => f.setter(e.target.value)} />
              </div>
            ))}
            {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}
            <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 8, background: BLUE, borderRadius: 14 }} onClick={submit} disabled={loading}>
              {loading ? 'Registering…' : 'Register Employer'}
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <p style={{ fontSize: 22, fontWeight: 800, color: T1, marginBottom: 8 }}>Employer Registered!</p>
            <p style={{ color: T2, fontSize: 15, marginBottom: 8 }}><strong>{name}</strong> from <strong>{companyName || 'their business'}</strong> has been registered.</p>
            <p style={{ color: T2, fontSize: 14, marginBottom: 32 }}>An OTP has been sent to their number so they can set up their account.</p>
            <p style={{ color: '#059669', fontSize: 14, fontWeight: 600 }}>You will earn ₹100 commission on every booking they make.</p>
            <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 32, background: BLUE, borderRadius: 14 }} onClick={() => router.push('/captain')}>
              Back to Home
            </button>
          </div>
        )}
      </div>

      {step !== 3 && <CaptainBottomNav />}
    </div>
  )
}
