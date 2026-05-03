'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const BG   = '#080808'
const S1   = '#111111'
const S2   = '#181818'
const S3   = '#222222'
const BD   = 'rgba(255,255,255,0.07)'
const BA   = 'rgba(255,255,255,0.18)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.2)'
const GOLD = '#F5C518'
const FONT = '"DM Sans", system-ui, -apple-system, sans-serif'

const EmpMap = dynamic(() => import('@/components/employer/EmpMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: S2 }} />,
})

const SLOTS = [
  { id: '4h',  label: '4 hrs',  hours: 4,  discount: 0,  badge: ''          },
  { id: '8h',  label: '8 hrs',  hours: 8,  discount: 0,  badge: 'Full Day'  },
  { id: '12h', label: '12 hrs', hours: 12, discount: 5,  badge: 'Save 5%'   },
  { id: '2d',  label: '2 Days', hours: 16, discount: 10, badge: 'Save 10%'  },
  { id: '7d',  label: '7 Days', hours: 56, discount: 15, badge: 'Best Value' },
] as const

const IMG = (f: string) => `/icons/services/${f}.jpg`

const ROLES: Record<string, { img: string; cat: string; rate: number; tag?: string }> = {
  'Cleaner':         { img: IMG('house-cleaner'),  cat: 'Cleaning',  rate: 200, tag: 'Popular'   },
  'Cook':            { img: IMG('cook-chef'),       cat: 'Domestic',  rate: 200                   },
  'Kitchen Helper':  { img: IMG('cook-chef'),       cat: 'Domestic',  rate: 200                   },
  'Store Staff':     { img: IMG('store-helper'),    cat: 'Labour',    rate: 200, tag: 'Popular'   },
  'General Helper':  { img: IMG('store-helper'),    cat: 'Labour',    rate: 200                   },
  'Driver':          { img: IMG('driver'),          cat: 'Transport', rate: 200, tag: 'Top Rated' },
  'Bouncer':         { img: IMG('security-guard'),  cat: 'Security',  rate: 200                   },
  'Waiter':          { img: IMG('cook-chef'),       cat: 'Domestic',  rate: 200                   },
  'Security Guard':  { img: IMG('security-guard'),  cat: 'Security',  rate: 200, tag: 'Verified'  },
  'Promoter':        { img: IMG('store-helper'),    cat: 'Labour',    rate: 200                   },
  'Caretaker':       { img: IMG('baby-care'),       cat: 'Domestic',  rate: 200                   },
  'Delivery Rider':  { img: IMG('delivery-rider'),  cat: 'Transport', rate: 200                   },
  'Factory Helper':  { img: IMG('warehouse-staff'), cat: 'Labour',    rate: 200                   },
}

const CAT_COLORS: Record<string, string> = {
  Domestic: '#8B5CF6', Transport: '#3B82F6',
  Security: '#6B7280', Labour: '#0EA5E9', Cleaning: '#06B6D4',
}
const CATS = ['All', 'Domestic', 'Transport', 'Security', 'Labour', 'Cleaning'] as const

function slotPrice(rate: number, slot: typeof SLOTS[number]) {
  return Math.round(rate * slot.hours * (1 - slot.discount / 100))
}

/* ── Gold Wax Seal SVG ─────────────────────────────────────────────────────── */
function WaxSeal() {
  /* 16-point star polygon for scalloped edge */
  const N = 16
  const R_OUT = 66, R_IN = 58, CX = 72, CY = 72
  const starPoints = Array.from({ length: N * 2 }, (_, i) => {
    const angle = (i * Math.PI) / N - Math.PI / 2
    const r     = i % 2 === 0 ? R_OUT : R_IN
    return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width="144" height="144" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Main gold radial gradient — light top-left, dark bottom-right */}
        <radialGradient id="gMain" cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#FFF0A0"/>
          <stop offset="25%"  stopColor="#F5C518"/>
          <stop offset="60%"  stopColor="#C8900A"/>
          <stop offset="100%" stopColor="#7A5500"/>
        </radialGradient>
        {/* Disc face gradient */}
        <radialGradient id="gFace" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#FFEBB0"/>
          <stop offset="30%"  stopColor="#EDB20C"/>
          <stop offset="65%"  stopColor="#C08010"/>
          <stop offset="100%" stopColor="#8A5F00"/>
        </radialGradient>
        {/* Specular highlight */}
        <radialGradient id="gShine" cx="30%" cy="25%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.55)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        {/* Inner ring gradient */}
        <radialGradient id="gInner" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#FFEEA0"/>
          <stop offset="50%"  stopColor="#D4950E"/>
          <stop offset="100%" stopColor="#9A6600"/>
        </radialGradient>
        {/* Deep shadow filter */}
        <filter id="fShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="rgba(0,0,0,0.75)"/>
          <feDropShadow dx="0" dy="2" stdDeviation="4"  floodColor="rgba(0,0,0,0.5)"/>
        </filter>
        {/* Emboss/inner glow */}
        <filter id="fEmboss" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
          <feOffset dx="1" dy="1" result="shifted"/>
          <feComposite in="SourceGraphic" in2="shifted" operator="over"/>
        </filter>
        {/* Clip for disc */}
        <clipPath id="discClip">
          <circle cx="72" cy="72" r="52"/>
        </clipPath>
      </defs>

      {/* ── Outer star / scallop shape ── */}
      <g filter="url(#fShadow)">
        <polygon points={starPoints} fill="url(#gMain)"/>
      </g>

      {/* ── Main disc ── */}
      <circle cx="72" cy="72" r="52" fill="url(#gFace)"/>

      {/* ── Outer ring emboss lines ── */}
      <circle cx="72" cy="72" r="51" fill="none" stroke="rgba(255,255,200,0.3)" strokeWidth="1.2"/>
      <circle cx="72" cy="72" r="48" fill="none" stroke="rgba(120,80,0,0.4)"    strokeWidth="0.8"/>

      {/* ── Inner decorative ring ── */}
      <circle cx="72" cy="72" r="43" fill="none" stroke="rgba(255,230,100,0.35)" strokeWidth="1.5"/>
      <circle cx="72" cy="72" r="41" fill="none" stroke="rgba(80,50,0,0.3)"      strokeWidth="0.7"/>

      {/* ── Inner disc face (slightly darker, recessed look) ── */}
      <circle cx="72" cy="72" r="40" fill="url(#gInner)" opacity="0.7"/>

      {/* ── "SWITCH" top arc text ── */}
      <path id="arcTop" d="M 36,72 A 36,36 0 0,1 108,72" fill="none"/>
      <text fontSize="8" fontWeight="800" fontFamily="DM Sans,Arial,sans-serif"
            fill="rgba(60,35,0,0.8)" letterSpacing="4.5">
        <textPath href="#arcTop" startOffset="50%" textAnchor="middle">SWITCH</textPath>
      </text>

      {/* ── "S" monogram ── */}
      <text x="72" y="86" textAnchor="middle" dominantBaseline="auto"
            fontSize="46" fontWeight="900" fontFamily="DM Sans,Arial,sans-serif"
            fill="rgba(55,30,0,0.88)" letterSpacing="-1">S</text>

      {/* ── Bottom arc: "VERIFIED" ── */}
      <path id="arcBot" d="M 40,72 A 32,32 0 0,0 104,72" fill="none"/>
      <text fontSize="6.5" fontWeight="700" fontFamily="DM Sans,Arial,sans-serif"
            fill="rgba(60,35,0,0.65)" letterSpacing="3.5">
        <textPath href="#arcBot" startOffset="50%" textAnchor="middle">VERIFIED</textPath>
      </text>

      {/* ── 4 small dots at cardinal points inside ring ── */}
      {[0, 90, 180, 270].map(deg => {
        const r = deg * Math.PI / 180
        return <circle key={deg} cx={72 + 36 * Math.cos(r)} cy={72 + 36 * Math.sin(r)} r="1.8" fill="rgba(60,35,0,0.5)"/>
      })}

      {/* ── Specular highlight (top-left sheen) ── */}
      <ellipse cx="58" cy="54" rx="20" ry="14" fill="url(#gShine)" clipPath="url(#discClip)"/>

      {/* ── Star point at outer ring ── */}
      {[45, 135, 225, 315].map(deg => {
        const r = deg * Math.PI / 180
        return <circle key={deg} cx={72 + 44 * Math.cos(r)} cy={72 + 44 * Math.sin(r)} r="1.4" fill="rgba(255,240,140,0.6)"/>
      })}
    </svg>
  )
}

/* ── Bottom nav ────────────────────────────────────────────────────────────── */
function BottomNav({ active }: { active: string }) {
  const router = useRouter()
  const tabs = [
    { id: 'home',    label: 'Home',     path: '/employer',
      icon: (on: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={on ? T1 : 'none'} stroke={on ? T1 : T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'jobs',    label: 'Bookings', path: '/employer/jobs',
      icon: (on: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? T1 : T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: 'wallet',  label: 'Wallet',   path: '/employer/wallet',
      icon: (on: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? T1 : T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill={on ? T1 : T3}/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { id: 'profile', label: 'Profile',  path: '/employer/profile',
      icon: (on: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? T1 : T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: S1, borderTop: `1px solid ${BD}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(tab => {
        const on = active === tab.id
        return (
          <button key={tab.id} onClick={() => router.push(tab.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4, padding: '10px 0 8px',
            border: 'none', background: 'none', cursor: 'pointer', fontFamily: FONT, position: 'relative',
          }}>
            {on && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: T1, borderRadius: '0 0 3px 3px' }} />}
            {tab.icon(on)}
            <span style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? T1 : T3 }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default function EmployerHome() {
  const router = useRouter()
  const [employer,   setEmployer]   = useState<any>(null)
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [mode,       setMode]       = useState<'instant' | 'schedule'>('instant')
  const [slot,       setSlot]       = useState<typeof SLOTS[number]>(SLOTS[1])
  const [cat,        setCat]        = useState<typeof CATS[number]>('All')
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('emp_splashed')) {
      window.location.replace('/employer/splash')
      return
    }
    fetch('/api/employer/profile').then(r => {
      if (r.status === 401 || r.status === 403 || r.status === 404) {
        router.replace('/employer/login'); return Promise.reject('auth')
      }
      return r.json()
    }).then(d => {
      if (d && d.error) { router.replace('/employer/login'); return }
      setEmployer(d.user || d.profile)
    }).catch(e => { if (e !== 'auth') console.error('profile fetch error', e) })
    fetch('/api/employer/jobs').then(r => r.json()).then(d => {
      if (d.jobs) setActiveJobs(d.jobs.filter((j: any) =>
        ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'STARTED'].includes(j.status)
      ))
    }).catch(() => {})
  }, [])

  const bizName   = employer?.employerProfile?.companyName || employer?.name || 'there'
  const initial   = bizName[0]?.toUpperCase() || 'E'
  const hour      = new Date().getHours()
  const greet     = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  const instMulti = mode === 'instant' ? 1.2 : 1

  const filtered = Object.entries(ROLES).filter(([name, info]) => {
    const matchCat  = cat === 'All' || info.cat === cat
    const matchSrch = !search || name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSrch
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: T1, overflowX: 'hidden' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top)) 18px 14px', background: BG, position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${BD}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, color: T2, lineHeight: '18px', marginBottom: 2 }}>Good {greet}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: T1, letterSpacing: -0.5 }}>{bizName.split(' ')[0]}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {activeJobs.length > 0 && (
              <button onClick={() => router.push(`/employer/job/${activeJobs[0].id}`)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'glow 1.5s ease infinite' }} />
                Live
              </button>
            )}
            <button onClick={() => router.push('/employer/wallet')} style={{ width: 40, height: 40, borderRadius: 20, background: S1, border: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill={T1}/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </button>
            <button onClick={() => router.push('/employer/refer')} style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(245,197,24,0.1)', border: `1px solid rgba(245,197,24,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            </button>
            <button onClick={() => router.push('/employer/profile')} style={{ width: 40, height: 40, borderRadius: 20, background: S3, border: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T1, fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: FONT }}>{initial}</button>
          </div>
        </div>
        <div style={{ background: S1, borderRadius: 14, border: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search any service…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: T1, fontFamily: FONT, background: 'transparent', lineHeight: '24px' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, fontSize: 20, padding: 0 }}>×</button>}
        </div>
      </div>

      <div style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}>

        {/* ── Active job banner ─────────────────────────────────── */}
        {activeJobs.length > 0 && (
          <div onClick={() => router.push(`/employer/job/${activeJobs[0].id}`)} style={{ margin: '12px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: 16, border: '1px solid rgba(34,197,94,0.2)', padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>Active Job</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T1 }}>{activeJobs[0].title}</div>
              <div style={{ fontSize: 15, color: T2, marginTop: 2 }}>
                {activeJobs[0].status === 'SEARCHING' ? 'Searching for worker…' : activeJobs[0].status === 'STARTED' ? 'In progress' : 'Worker en route'}
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}

        {/* ── Map — always open ─────────────────────────────────── */}
        <div style={{ margin: '12px 16px', borderRadius: 20, overflow: 'hidden', border: `1px solid ${BD}`, position: 'relative' }}>
          <div style={{ height: 260 }}>
            <EmpMap />
          </div>
          {/* Overlay: bottom gradient + action button */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0) 100%)', padding: '32px 14px 12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', pointerEvents: 'none' }}>
            <button
              onClick={() => router.push(activeJobs.length > 0 ? `/employer/job/${activeJobs[0].id}` : '/employer/post-job')}
              style={{ padding: '9px 18px', borderRadius: 20, background: T1, border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, pointerEvents: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
            >
              {activeJobs.length > 0 ? 'Track Job' : 'Book Now'}
            </button>
          </div>
        </div>

        {/* ── Instant / Schedule toggle ─────────────────────────── */}
        <div style={{ margin: '14px 16px', background: S1, borderRadius: 14, padding: 4, display: 'flex', border: `1px solid ${BD}` }}>
          {(['instant', 'schedule'] as const).map(t => (
            <button key={t} onClick={() => setMode(t)} style={{ flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', borderRadius: 11, fontWeight: 700, fontSize: 17, transition: 'all 0.2s', background: mode === t ? T1 : 'transparent', color: mode === t ? '#000' : T2, fontFamily: FONT }}>
              {t === 'instant' ? '⚡ Instant' : '📅 Schedule'}
            </button>
          ))}
        </div>

        {/* ── Duration slots ────────────────────────────────────── */}
        <div style={{ padding: '0 0 0 16px', marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingRight: 16 }}>
            {SLOTS.map(s => {
              const on = slot.id === s.id
              return (
                <button key={s.id} onClick={() => setSlot(s)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 18px', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${on ? BA : BD}`, background: on ? T1 : S1, color: on ? '#000' : T1, fontFamily: FONT, transition: 'all 0.15s', minWidth: 72 }}>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{s.label}</span>
                  {s.badge ? <span style={{ fontSize: 12, fontWeight: 700, color: on ? '#666' : GOLD, marginTop: 2 }}>{s.badge}</span> : <span style={{ height: 14 }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Category tabs ─────────────────────────────────────── */}
        <div style={{ padding: '0 0 0 16px', marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingRight: 16 }}>
            {CATS.map(c => {
              const on = cat === c
              return (
                <button key={c} onClick={() => setCat(c)} style={{ padding: '7px 16px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${on ? BA : BD}`, background: on ? T1 : 'transparent', color: on ? '#000' : T2, fontWeight: 600, fontSize: 15, fontFamily: FONT, transition: 'all 0.15s' }}>{c}</button>
              )
            })}
          </div>
        </div>

        {/* ── Section header ────────────────────────────────────── */}
        <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T1 }}>{search ? `"${search}"` : cat === 'All' ? 'All Services' : cat}</div>
            <div style={{ fontSize: 15, color: T2, marginTop: 2 }}>{slot.label} · {mode === 'instant' ? '~8 min arrival' : 'Scheduled'}</div>
          </div>
          <div style={{ fontSize: 15, color: T2 }}>{filtered.length} roles</div>
        </div>

        {/* ── Service grid ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
          {filtered.map(([name, info]) => {
            const price    = Math.round(slotPrice(info.rate, slot) * instMulti)
            const catColor = CAT_COLORS[info.cat] || '#888'
            return (
              <div key={name} onClick={() => router.push(`/employer/cart?service=${encodeURIComponent(name)}&mode=${mode}&slot=${slot.id}`)}
                style={{ background: S1, borderRadius: 18, padding: '14px 12px', cursor: 'pointer', border: `1px solid ${BD}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: catColor, opacity: 0.75 }} />
                {info.tag && <div style={{ position: 'absolute', top: 14, right: 10, fontSize: 11, fontWeight: 700, color: catColor, background: `${catColor}20`, padding: '2px 7px', borderRadius: 20 }}>{info.tag}</div>}
                <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 12, marginBottom: 10, overflow: 'hidden', background: S2, position: 'relative' }}>
                  <img src={info.img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to top, rgba(8,8,8,0.72), transparent)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: 7, left: 8, width: 7, height: 7, borderRadius: '50%', background: catColor, boxShadow: `0 0 6px ${catColor}` }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T1, marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 13, color: T3, marginBottom: 10 }}>{info.cat}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 17, background: T1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', paddingTop: 60, color: T2 }}>No services found</div>}

        {/* ── Refer & Earn banner ───────────────────────────────── */}
        <div style={{ margin: '24px 16px 0', borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1a1200 0%, #2a1e00 50%, #1a1200 100%)', border: `1px solid rgba(245,197,24,0.2)` }}>
          {/* Gold shimmer lines */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 0%, rgba(245,197,24,0.04) 50%, transparent 100%)', pointerEvents: 'none' }} />
          <div style={{ padding: '22px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 8, opacity: 0.8 }}>Refer & Earn</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: T1, lineHeight: '26px', marginBottom: 16, letterSpacing: -0.3 }}>
                Earn <span style={{ color: GOLD }}>₹200</span> for every<br/>friend you refer
              </div>
              <button onClick={() => router.push('/employer/refer')} style={{ padding: '12px 24px', borderRadius: 12, background: T1, border: 'none', color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FONT }}>
                Refer now
              </button>
            </div>
            {/* Coins illustration */}
            <div style={{ flexShrink: 0, width: 90, height: 90, position: 'relative' }}>
              {/* Coin stack using CSS */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{ position: 'absolute', bottom: i * 10, left: '50%', transform: 'translateX(-50%)', width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #FFE566, #E8A800 60%, #A86800)`, boxShadow: '0 3px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {i === 2 ? '₹' : ''}
                </div>
              ))}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFE566, #E8A800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>₹</div>
            </div>
          </div>
        </div>

        {/* ── Switch Seal of Trust ──────────────────────────────── */}
        <div style={{ margin: '24px 16px 0', borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(180deg, #0f0e08 0%, #0a0900 100%)', border: `1px solid rgba(245,197,24,0.12)`, padding: '32px 20px 28px' }}>

          {/* Gold wax seal */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <WaxSeal />
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T1, letterSpacing: -0.3, marginBottom: 6 }}>Workers Vetted for Quality</div>
            <div style={{ fontSize: 14, color: T2, lineHeight: '20px' }}>Every worker on Switch passes our<br/>rigorous 3-step verification process</div>
          </div>

          {/* 3 trust badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Top Rated Workers'        },
              { svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>, label: 'Professionally Trained' },
              { svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, label: 'Background Verified'     },
            ].map(b => (
              <div key={b.label} style={{ textAlign: 'center', background: 'rgba(245,197,24,0.04)', borderRadius: 16, padding: '18px 8px', border: '1px solid rgba(245,197,24,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>{b.svg}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T1, lineHeight: '18px' }}>{b.label}</div>
              </div>
            ))}
          </div>

          {/* 4 trust checks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Govt ID verification on every worker',
              'Live GPS tracking during the job',
              '100% secure payments via Razorpay',
              'Satisfaction guarantee on every booking',
            ].map(txt => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 15, color: T2 }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

      <BottomNav active="home" />

      <style>{`
        @keyframes glow{0%,100%{opacity:1}50%{opacity:0.3}}
        ::-webkit-scrollbar{display:none}
        *{box-sizing:border-box}
      `}</style>
    </div>
  )
}
