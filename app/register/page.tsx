'use client'
import { useRef, useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Phone, User, MapPin, Camera, ArrowRight,
  Check, ChevronLeft, Upload, Shield, Sparkles, CheckCircle, Zap,
} from 'lucide-react'
import { useLang, type Lang } from '@/lib/lang'

/* ── Job types with real photos ── */
const JOB_TYPES = [
  { id:'shop',         photo:'/icons/services/store-helper.jpg',    emoji:'🏪', en:'Shop Helper',      hi:'दुकान सहायक'    },
  { id:'delivery',     photo:'/icons/services/delivery-rider.jpg',  emoji:'🚴', en:'Delivery Rider',   hi:'डिलीवरी राइडर' },
  { id:'security',     photo:'/icons/services/security-guard.jpg',  emoji:'🔒', en:'Security Guard',   hi:'सुरक्षा गार्ड'  },
  { id:'kitchen',      photo:'/icons/services/cook-chef.jpg',       emoji:'🍳', en:'Kitchen Helper',   hi:'रसोई सहायक'     },
  { id:'warehouse',    photo:'/icons/services/warehouse-staff.jpg', emoji:'🏭', en:'Warehouse Staff',  hi:'गोदाम कर्मी'    },
  { id:'cleaning',     photo:'/icons/services/house-cleaner.jpg',   emoji:'🧹', en:'Cleaning Staff',   hi:'सफाई कर्मी'     },
  { id:'driver',       photo:'/icons/services/driver.jpg',          emoji:'🚗', en:'Driver',           hi:'ड्राइवर'         },
  { id:'construction', photo:'/icons/services/carpenter.jpg',       emoji:'🏗️', en:'Construction',    hi:'निर्माण कार्य'  },
  { id:'packing',      photo:'/icons/services/warehouse-staff.jpg', emoji:'📦', en:'Packing Staff',    hi:'पैकिंग स्टाफ'   },
  { id:'cashier',      photo:'/icons/services/store-helper.jpg',    emoji:'🛒', en:'Cashier',          hi:'कैशियर'          },
  { id:'painter',      photo:'/icons/services/painter.jpg',         emoji:'🎨', en:'Painter',          hi:'पेंटर'           },
  { id:'electrician',  photo:'/icons/services/electrician.jpg',     emoji:'⚡', en:'Electrician',      hi:'इलेक्ट्रीशियन'  },
]

const TOTAL_STEPS = 4

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display:'flex', gap:6, padding:'4px 20px 8px' }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:8, transition:'all 0.5s',
          background: i < step ? '#111111' : 'rgba(0,0,0,0.1)',
        }} />
      ))}
    </div>
  )
}

function PhotoBox({ value, onChange, label, subLabel, icon: Icon }:
  { value: string|null; onChange: (v:string)=>void; label:string; subLabel:string; icon: typeof Upload }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <button onClick={() => ref.current?.click()}
      style={{
        width:'100%', height:200, borderRadius:20, overflow:'hidden',
        background: value ? 'transparent' : '#F5F5F5',
        border: value ? 'none' : '2px dashed rgba(0,0,0,0.2)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        position:'relative', cursor:'pointer',
      }}>
      {value ? (
        <>
          <img src={value} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
            justifyContent:'center', background:'rgba(0,0,0,0.4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:20,
              background:'rgba(0,0,0,0.85)' }}>
              <Check style={{ width:15, height:15, color:'#FFFFFF' }} />
              <span style={{ fontSize:14, fontWeight:700, color:'#FFFFFF' }}>Photo Added</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ width:60, height:60, borderRadius:18, background:'rgba(0,0,0,0.05)',
            border:'1px solid rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon style={{ width:26, height:26, color:'rgba(0,0,0,0.35)' }} />
          </div>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:700, color:'#111111' }}>{label}</p>
            <p style={{ fontSize:13, color:'rgba(0,0,0,0.45)', marginTop:4 }}>{subLabel}</p>
          </div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
        onChange={e => {
          const file = e.target.files?.[0]; if (!file) return
          const r = new FileReader(); r.onload = ev => onChange(ev.target?.result as string); r.readAsDataURL(file)
        }} />
    </button>
  )
}

function SlidePane({ children, dir }: { children: React.ReactNode; dir: 'left'|'right'|'none' }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setMounted(true)) }, [])
  const from = dir === 'left' ? 'translateX(60px)' : dir === 'right' ? 'translateX(-60px)' : 'translateX(0)'
  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateX(0)' : from,
      transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {children}
    </div>
  )
}

function RegisterPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { t, lang, setLang } = useLang()

  const [step,    setStep]    = useState(1)
  const [dir,     setDir]     = useState<'left'|'right'|'none'>('none')
  const [stepKey, setStepKey] = useState(0)

  const [photo,  setPhoto]  = useState<string|null>(null)
  const [name,   setName]   = useState('')
  const [phone,  setPhone]  = useState(() => searchParams?.get('phone') ?? '')
  const [city,   setCity]   = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  const [jobs, setJobs] = useState<Set<string>>(new Set())

  const [aadharFront, setAadharFront] = useState<string|null>(null)
  const [aadharBack,  setAadharBack]  = useState<string|null>(null)

  const [referralCode, setReferralCode] = useState(() => searchParams?.get('ref') ?? '')

  const [loading,   setLoading]   = useState(false)
  const [otpPhase,  setOtpPhase]  = useState<'info'|'otp'>('info')
  const [otp,       setOtp]       = useState(['','','',''])
  const [otpError,  setOtpError]  = useState('')
  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ]

  const useFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY

  async function sendOtp() {
    if (phone.length < 10) return
    setLoading(true)
    try {
      if (useFirebase) {
        const { sendPhoneCode } = await import('@/lib/firebase-phone-auth')
        await sendPhoneCode(phone)
      } else {
        const res = await fetch('/api/auth/send-otp', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ phone }),
        })
        if (!res.ok) { setLoading(false); return }
      }
      setOtpPhase('otp'); setTimeout(() => otpRefs[0].current?.focus(), 200)
    } catch {}
    setLoading(false)
  }

  async function verifyOtp() {
    const code = otp.join('')
    if (code.length < 4) return
    setLoading(true); setOtpError('')
    try {
      if (useFirebase) {
        const { confirmPhoneCode } = await import('@/lib/firebase-phone-auth')
        const { idToken } = await confirmPhoneCode(code)
        const res = await fetch('/api/auth/firebase-verify', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ idToken, role:'WORKER', referralCode: referralCode || undefined }),
        })
        if (res.ok) { localStorage.setItem('sw_role','worker'); go(2) }
        else { const d = await res.json(); setOtpError(d.error||'Invalid OTP'); setOtp(['','','','']); setTimeout(() => otpRefs[0].current?.focus(), 50) }
      } else {
        const res = await fetch('/api/auth/verify-otp', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ phone, otp: code, role:'WORKER', referralCode: referralCode || undefined }),
        })
        const data = await res.json()
        if (res.ok) { localStorage.setItem('sw_role','worker'); go(2) }
        else { setOtpError(data.error||'Invalid OTP'); setOtp(['','','','']); setTimeout(() => otpRefs[0].current?.focus(), 50) }
      }
    } catch { setOtpError('Server unavailable. Try again.') }
    setLoading(false)
  }

  function handleOtpInput(i: number, val: string) {
    const d = val.replace(/\D/,'').slice(-1)
    const next = [...otp]; next[i] = d; setOtp(next); setOtpError('')
    if (d && i < 3) otpRefs[i+1].current?.focus()
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key==='Backspace' && !otp[i] && i>0) {
      const next = [...otp]; next[i-1]=''; setOtp(next); otpRefs[i-1].current?.focus()
    }
  }

  function go(n: number) {
    setDir(n>step?'left':'right')
    setTimeout(() => { setStep(n); setStepKey(k=>k+1); setDir('left') }, 10)
  }

  function toggleJob(id: string) {
    setJobs(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch('/api/worker/profile', {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, city, skills: Array.from(jobs) }),
      })
    } catch {}
    router.push('/')
  }

  const step1Valid = !!photo && name.length>1 && phone.length===10 && city.length>1
  const step2Valid = jobs.size > 0
  const step3Valid = !!aadharFront
  const step4Valid = !!aadharBack

  const stepLabels = ['','Basic Info','Work Types','Aadhaar Front','Aadhaar Back']

  return (
    <div style={{ minHeight:'100vh', background:'#FFFFFF', display:'flex', flexDirection:'column',
      paddingTop:'var(--safe-t)', paddingBottom:'var(--safe-b)' }}>

      {/* ── Top nav ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px 4px' }}>
        {step>1 || otpPhase==='otp' ? (
          <button onClick={() => { if(otpPhase==='otp'){setOtpPhase('info');setOtp(['','','',''])}else if(step>1)go(step-1) }}
            style={{ width:40, height:40, borderRadius:'50%', background:'#F0F0F0',
              border:'1px solid rgba(0,0,0,0.1)', display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
            <ChevronLeft style={{ width:20, height:20, color:'rgba(0,0,0,0.6)' }} />
          </button>
        ) : (
          <div style={{ width:40, height:40, borderRadius:14, background:'#FFFFFF',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Zap style={{ width:22, height:22, color:'#000000', fill:'#000000' }} />
          </div>
        )}
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Step {step} of {TOTAL_STEPS}
          </p>
          <p style={{ fontSize:18, fontWeight:800, color:'#111111', marginTop:1 }}>
            {otpPhase==='otp' ? 'Verify Phone' : stepLabels[step]}
          </p>
        </div>
        {step===1 && <Link href="/login" style={{ fontSize:15, fontWeight:700, color:'rgba(0,0,0,0.45)', textDecoration:'none' }}>Login</Link>}
      </div>

      <StepBar step={step} />

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px' }}>
        <SlidePane key={stepKey} dir={dir}>

          {/* ── STEP 1: OTP ── */}
          {step===1 && otpPhase==='otp' && (
            <div>
              <div style={{ width:72, height:72, borderRadius:22, background:'rgba(0,0,0,0.05)',
                border:'1px solid rgba(0,0,0,0.09)', display:'flex', alignItems:'center',
                justifyContent:'center', marginBottom:20, fontSize:34 }}>🔐</div>

              <p style={{ fontSize:28, fontWeight:900, color:'#111111', marginBottom:6 }}>Verify OTP</p>
              <p style={{ fontSize:16, color:'rgba(0,0,0,0.45)', marginBottom:32 }}>
                Sent to <span style={{ color:'#111111', fontWeight:700 }}>+91 {phone.slice(0,5)} {phone.slice(5)}</span>
              </p>

              <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:10 }}>
                {otp.map((d,i) => (
                  <input key={i} ref={otpRefs[i]} type="tel" inputMode="numeric" maxLength={2} value={d}
                    onChange={e=>handleOtpInput(i,e.target.value)} onKeyDown={e=>handleOtpKey(i,e)}
                    style={{ width:68, height:72, textAlign:'center', fontSize:30, fontWeight:900, borderRadius:18,
                      border:`2px solid ${otpError?'#DC2626':d?'#111111':'rgba(0,0,0,0.15)'}`,
                      background:d?'rgba(0,0,0,0.05)':'#F5F5F5', color:'#111111', outline:'none' }} />
                ))}
              </div>

              <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                {otpError && <p style={{ fontSize:14, color:'#DC2626', fontWeight:600 }}>{otpError}</p>}
              </div>

              <button onClick={verifyOtp} disabled={otp.join('').length<4||loading}
                style={{ width:'100%', height:56, borderRadius:16, fontSize:16, fontWeight:800, border:'none',
                  background:otp.join('').length>=4?'#111111':'rgba(0,0,0,0.07)',
                  color:otp.join('').length>=4?'#FFFFFF':'rgba(0,0,0,0.25)',
                  boxShadow:otp.join('').length>=4?'0 8px 32px rgba(0,0,0,0.15)':'none',
                  marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer' }}>
                {loading ? 'Verifying…' : <><span>Verify &amp; Continue</span><ArrowRight style={{ width:18, height:18 }} /></>}
              </button>

              <button onClick={() => {setOtpPhase('info');setOtp(['','','','']);setOtpError('')}}
                style={{ width:'100%', background:'none', border:'none', fontSize:15, fontWeight:600,
                  color:'rgba(0,0,0,0.38)', padding:'10px 0', cursor:'pointer' }}>
                ← Change number / Resend OTP
              </button>
            </div>
          )}

          {/* ── STEP 1: Basic Info ── */}
          {step===1 && otpPhase==='info' && (
            <div>
              <p style={{ fontSize:28, fontWeight:900, color:'#111111', marginBottom:6 }}>अपनी जानकारी दें</p>
              <p style={{ fontSize:16, color:'rgba(0,0,0,0.45)', marginBottom:28 }}>Tell us about yourself to get started</p>

              {/* Profile photo */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
                <button onClick={() => photoRef.current?.click()} style={{ position:'relative', background:'none', border:'none', cursor:'pointer' }}>
                  <div style={{ width:96, height:96, borderRadius:28, overflow:'hidden',
                    border: photo ? '3px solid #111111' : '2px dashed rgba(0,0,0,0.2)',
                    background:'#F5F5F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {photo
                      ? <img src={photo} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <Camera style={{ width:30, height:30, color:'rgba(0,0,0,0.35)' }} />
                    }
                  </div>
                  <div style={{ position:'absolute', bottom:-4, right:-4, width:32, height:32, borderRadius:10,
                    background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.5)' }}>
                    <Camera style={{ width:14, height:14, color:'#000000' }} />
                  </div>
                </button>
                <input ref={photoRef} type="file" accept="image/*" capture="user" style={{ display:'none' }}
                  onChange={e => {
                    const f=e.target.files?.[0]; if(!f) return
                    const r=new FileReader(); r.onload=ev=>setPhoto(ev.target?.result as string); r.readAsDataURL(f)
                  }} />
                <p style={{ fontSize:15, fontWeight:600, marginTop:12, color:photo?'#111111':'rgba(0,0,0,0.38)' }}>
                  {photo ? '✓ Photo added' : 'Add profile photo (required)'}
                </p>
              </div>

              {/* Language */}
              <p style={{ fontSize:15, fontWeight:600, color:'rgba(0,0,0,0.5)', marginBottom:10 }}>{t.lang_label}</p>
              <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                {(['en','hi'] as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 16px', borderRadius:16,
                      background: lang===l ? 'rgba(0,0,0,0.06)' : '#F5F5F5',
                      border: `2px solid ${lang===l ? '#111111' : 'rgba(0,0,0,0.1)'}`,
                      cursor:'pointer' }}>
                    <span style={{ fontWeight:700, fontSize:16, color:'#111111' }}>{l==='en'?'🇬🇧 English':'🇮🇳 हिंदी'}</span>
                    {lang===l && <Check style={{ width:16, height:16, color:'#111111' }} />}
                  </button>
                ))}
              </div>

              {/* Fields */}
              {[
                { label:t.name_label,  icon:User,  value:name,  onChange:setName,  placeholder:t.name_placeholder as string, type:'text', extra:{} },
                { label:t.city_label,  icon:MapPin, value:city, onChange:setCity,  placeholder:t.city_placeholder as string,  type:'text', extra:{} },
              ].map(f => (
                <div key={f.label as string} style={{ marginBottom:14 }}>
                  <p style={{ fontSize:15, fontWeight:600, color:'rgba(0,0,0,0.5)', marginBottom:8 }}>{f.label as string}</p>
                  <div style={{ position:'relative' }}>
                    <f.icon style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', width:17, height:17, color:'rgba(0,0,0,0.35)' }} />
                    <input value={f.value} onChange={e=>f.onChange(e.target.value)}
                      placeholder={f.placeholder} type={f.type}
                      style={{ width:'100%', height:54, paddingLeft:46, paddingRight:16, borderRadius:14,
                        background:'#F5F5F5', border:'1.5px solid rgba(0,0,0,0.1)',
                        fontSize:16, fontWeight:600, color:'#111111', outline:'none' }} />
                  </div>
                </div>
              ))}

              {/* Phone */}
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'rgba(0,0,0,0.5)', marginBottom:8 }}>{t.phone_label as string}</p>
                <div style={{ display:'flex', height:54, borderRadius:14, overflow:'hidden',
                  background:'#F5F5F5', border:'1.5px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', flexShrink:0,
                    borderRight:'1.5px solid rgba(0,0,0,0.1)' }}>
                    <Phone style={{ width:16, height:16, color:'rgba(0,0,0,0.35)' }} />
                    <span style={{ fontSize:15, fontWeight:700, color:'rgba(0,0,0,0.5)' }}>+91</span>
                  </div>
                  <input type="tel" inputMode="numeric" maxLength={10}
                    value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/,'').slice(0,10))}
                    placeholder={t.phone_placeholder as string}
                    style={{ flex:1, height:'100%', background:'transparent', border:'none', outline:'none',
                      paddingLeft:16, paddingRight:16, fontSize:16, fontWeight:600, color:'#111111' }} />
                </div>
              </div>

              {/* Optional referral code */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
                  Captain Referral Code <span style={{ fontWeight: 400 }}>(optional)</span>
                </p>
                <input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder="e.g. SW4X7RKM"
                  style={{ width: '100%', height: 50, padding: '0 16px', borderRadius: 14,
                    background: '#F5F5F5', border: '1.5px solid rgba(0,0,0,0.1)',
                    fontSize: 16, fontWeight: 700, color: '#111111', outline: 'none',
                    letterSpacing: 3, fontFamily: '"Courier New", monospace', boxSizing: 'border-box' as const }} />
              </div>

              <button onClick={sendOtp} disabled={!step1Valid||loading}
                style={{ width:'100%', height:56, borderRadius:16, fontSize:16, fontWeight:800, border:'none',
                  background:step1Valid?'#111111':'rgba(0,0,0,0.07)',
                  color:step1Valid?'#FFFFFF':'rgba(0,0,0,0.25)',
                  boxShadow:step1Valid?'0 8px 32px rgba(0,0,0,0.15)':'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:step1Valid?'pointer':'default' }}>
                {loading ? 'Sending OTP…' : <><span>Continue</span><ArrowRight style={{ width:18, height:18 }} /></>}
              </button>

              {!step1Valid && (
                <p style={{ fontSize:14, color:'rgba(0,0,0,0.3)', textAlign:'center', marginTop:12 }}>
                  {!photo ? '📸 Add your profile photo to continue' : 'Fill all fields to continue'}
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: Job Types with photos ── */}
          {step===2 && (
            <div>
              <p style={{ fontSize:28, fontWeight:900, color:'#111111', marginBottom:6 }}>क्या काम करना चाहते हो?</p>
              <p style={{ fontSize:16, color:'rgba(0,0,0,0.45)', marginBottom:6 }}>What kind of work are you looking for?</p>
              <p style={{ fontSize:14, color:'rgba(0,0,0,0.3)', marginBottom:20 }}>Select all that apply — change later</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {JOB_TYPES.map(j => {
                  const on = jobs.has(j.id)
                  return (
                    <button key={j.id} onClick={() => toggleJob(j.id)}
                      style={{
                        position:'relative', height:110, borderRadius:20, overflow:'hidden',
                        border:`2.5px solid ${on?'#111111':'rgba(0,0,0,0.08)'}`,
                        background:'#F5F5F5', cursor:'pointer',
                        boxShadow: on?'0 4px 20px rgba(0,0,0,0.08)':'none',
                        transition:'all 0.2s',
                      }}>
                      {/* Photo */}
                      <img src={j.photo} alt={j.en}
                        style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                          objectFit:'cover', opacity: on ? 0.7 : 0.45, transition:'opacity 0.2s' }} />
                      {/* Overlay */}
                      <div style={{ position:'absolute', inset:0,
                        background: on
                          ? 'linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%)'
                          : 'linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.75) 100%)' }} />
                      {/* Text */}
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'flex-end', padding:'10px 8px' }}>
                        <p style={{ fontSize:14, fontWeight:800, color:'#FFFFFF', textAlign:'center', lineHeight:1.3 }}>
                          {lang==='hi' ? j.hi : j.en}
                        </p>
                        {lang==='hi' && (
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.2, textAlign:'center' }}>{j.en}</p>
                        )}
                      </div>
                      {/* Check badge */}
                      {on && (
                        <div style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%',
                          background:'#111111', display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
                          <Check style={{ width:13, height:13, color:'#FFFFFF' }} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {jobs.size > 0 && (
                <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:16,
                  background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.09)',
                  display:'flex', alignItems:'center', gap:10 }}>
                  <Sparkles style={{ width:16, height:16, color:'rgba(0,0,0,0.45)', flexShrink:0 }} />
                  <p style={{ fontSize:15, color:'#111111', fontWeight:600 }}>
                    {jobs.size} job type{jobs.size>1?'s':''} selected
                  </p>
                </div>
              )}

              <button onClick={() => go(3)} disabled={!step2Valid}
                style={{ width:'100%', height:56, borderRadius:16, fontSize:16, fontWeight:800, border:'none',
                  background:step2Valid?'#111111':'rgba(0,0,0,0.07)',
                  color:step2Valid?'#FFFFFF':'rgba(0,0,0,0.25)',
                  boxShadow:step2Valid?'0 8px 32px rgba(0,0,0,0.15)':'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:step2Valid?'pointer':'default' }}>
                Continue <ArrowRight style={{ width:18, height:18 }} />
              </button>
            </div>
          )}

          {/* ── STEP 3: Aadhaar Front ── */}
          {step===3 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:12, background:'rgba(0,0,0,0.05)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Shield style={{ width:18, height:18, color:'rgba(0,0,0,0.5)' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.1em' }}>KYC VERIFICATION</span>
              </div>
              <p style={{ fontSize:28, fontWeight:900, color:'#111111', marginBottom:6 }}>आधार कार्ड — सामने</p>
              <p style={{ fontSize:16, color:'rgba(0,0,0,0.45)', marginBottom:20 }}>Upload the front side of your Aadhaar card</p>

              <PhotoBox value={aadharFront} onChange={setAadharFront}
                label="Aadhaar Card Front" subLabel="Tap to take photo or upload" icon={Camera} />

              <div style={{ marginTop:16, marginBottom:24, padding:'16px', borderRadius:18,
                background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.08)' }}>
                <p style={{ fontSize:14, fontWeight:700, color:'rgba(0,0,0,0.5)', marginBottom:12 }}>Tips for a good photo</p>
                {['All 4 corners must be visible','Keep card flat — no shadows','Text must be clear and readable','Good lighting, no blur'].map(tip => (
                  <div key={tip} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(0,0,0,0.3)', flexShrink:0 }} />
                    <p style={{ fontSize:14, color:'rgba(0,0,0,0.45)' }}>{tip}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => go(4)} disabled={!step3Valid}
                style={{ width:'100%', height:56, borderRadius:16, fontSize:16, fontWeight:800, border:'none',
                  background:step3Valid?'#111111':'rgba(0,0,0,0.07)',
                  color:step3Valid?'#FFFFFF':'rgba(0,0,0,0.25)',
                  boxShadow:step3Valid?'0 8px 32px rgba(0,0,0,0.15)':'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:step3Valid?'pointer':'default' }}>
                Continue <ArrowRight style={{ width:18, height:18 }} />
              </button>
            </div>
          )}

          {/* ── STEP 4: Aadhaar Back ── */}
          {step===4 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:12, background:'rgba(0,0,0,0.05)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Shield style={{ width:18, height:18, color:'rgba(0,0,0,0.5)' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.1em' }}>KYC VERIFICATION</span>
              </div>
              <p style={{ fontSize:28, fontWeight:900, color:'#111111', marginBottom:6 }}>आधार कार्ड — पीछे</p>
              <p style={{ fontSize:16, color:'rgba(0,0,0,0.45)', marginBottom:6 }}>Upload the back side of your Aadhaar card</p>
              <p style={{ fontSize:14, color:'rgba(0,0,0,0.3)', marginBottom:20 }}>Almost done — one last step!</p>

              <PhotoBox value={aadharBack} onChange={setAadharBack}
                label="Aadhaar Card Back" subLabel="Tap to take photo or upload" icon={Camera} />

              <div style={{ marginTop:16, marginBottom:24, padding:'16px', borderRadius:18,
                background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.09)',
                display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(0,0,0,0.06)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Shield style={{ width:18, height:18, color:'#111111' }} />
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:'#111111', marginBottom:4 }}>Your data is 100% safe</p>
                  <p style={{ fontSize:14, color:'rgba(0,0,0,0.45)', lineHeight:1.5 }}>
                    Your Aadhaar is encrypted with 256-bit security. Only used for employer verification, never shared.
                  </p>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={!step4Valid||loading}
                style={{ width:'100%', height:58, borderRadius:16, fontSize:17, fontWeight:800, border:'none',
                  background:step4Valid?'#111111':'rgba(0,0,0,0.07)',
                  color:step4Valid?'#FFFFFF':'rgba(0,0,0,0.25)',
                  boxShadow:step4Valid?'0 8px 32px rgba(0,0,0,0.15)':'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:step4Valid?'pointer':'default' }}>
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:18, height:18, border:'2px solid #FFFFFF', borderTopColor:'transparent',
                      borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'block' }} />
                    Creating account…
                  </span>
                ) : (
                  <><span>Create Account</span><ArrowRight style={{ width:18, height:18 }} /></>
                )}
              </button>

              {loading && (
                <div style={{ marginTop:16, textAlign:'center' }}>
                  {['Verifying your Aadhaar…', 'Setting up your profile…', 'Finding jobs near you…'].map((msg,i) => (
                    <p key={msg} style={{ fontSize:14, color:'rgba(0,0,0,0.45)', opacity:1-i*0.25, marginBottom:4 }}>{msg}</p>
                  ))}
                </div>
              )}
            </div>
          )}

        </SlidePane>
      </div>

      {step===1 && (
        <p style={{ textAlign:'center', paddingBottom:20, fontSize:16, color:'rgba(0,0,0,0.45)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color:'#111111', fontWeight:700, textDecoration:'none' }}>Login</Link>
        </p>
      )}
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterPageInner /></Suspense>
}
