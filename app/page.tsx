'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronDown, Star, Clock, Zap, Bookmark, CheckCircle, TrendingUp, ChevronRight, Navigation, ArrowRight, Search, Filter } from 'lucide-react'
import SplashScreen  from '@/components/shared/SplashScreen'
import WelcomeCard   from '@/components/shared/WelcomeCard'
import LocationSync  from '@/components/shared/LocationSync'
import LocationSheet from '@/components/shared/LocationSheet'
import TopBar        from '@/components/shared/TopBar'
import BottomNav            from '@/components/shared/BottomNav'
import PermissionScreen     from '@/components/shared/PermissionScreen'
import JobDetailSheet   from '@/components/worker/JobDetailSheet'
import ShiftConfirmed   from '@/components/worker/ShiftConfirmed'
import UrgentJobPopup   from '@/components/worker/UrgentJobPopup'
import ActiveShift      from '@/components/worker/ActiveShift'
import JobIcon, { getJobPhoto } from '@/components/worker/JobIcon'
import { useLang }      from '@/lib/lang'

type Job = {
  id:number; emoji:string; title:string; company:string
  pay:number; hours:number; totalPay:number
  distance:string; time:string; day:string
  urgent:boolean; rating:number; slots:number; tag:string
  address:string
}

const JOBS: Job[] = [
  { id:1, emoji:'🏪', title:'Shop Helper',      company:'D-Mart',       pay:99,  hours:8,  totalPay:792,  distance:'1.2 km', time:'9 AM – 5 PM',  day:'Today',    urgent:true,  rating:4.8, slots:3,  tag:'Popular',  address:'Shop No. 4, Lokhandwala Complex, Andheri West, Mumbai' },
  { id:2, emoji:'🚴', title:'Delivery Rider',   company:'BigBasket',    pay:109, hours:6,  totalPay:654,  distance:'0.8 km', time:'10 AM – 4 PM', day:'Today',    urgent:false, rating:4.6, slots:5,  tag:'',         address:'BigBasket Warehouse, MIDC, Andheri East, Mumbai' },
  { id:3, emoji:'🏭', title:'Warehouse Staff',  company:'Amazon',       pay:119, hours:8,  totalPay:952,  distance:'3.5 km', time:'8 AM – 4 PM',  day:'Tomorrow', urgent:false, rating:4.9, slots:10, tag:'High Pay', address:'Amazon Fulfillment Centre, Bhiwandi, Thane' },
  { id:4, emoji:'🔒', title:'Security Guard',   company:'Phoenix Mall', pay:109, hours:12, totalPay:1308, distance:'2.1 km', time:'7 PM – 7 AM',  day:'Today',    urgent:true,  rating:4.5, slots:2,  tag:'Urgent',   address:'Phoenix Palladium, Senapati Bapat Marg, Lower Parel, Mumbai' },
  { id:5, emoji:'🍳', title:'Kitchen Helper',   company:'Hotel Taj',    pay:99,  hours:8,  totalPay:792,  distance:'4.2 km', time:'10 AM – 6 PM', day:'Tomorrow', urgent:false, rating:4.7, slots:4,  tag:'',         address:'Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai' },
  { id:6, emoji:'🚗', title:'Driver',           company:'Flipkart',     pay:129, hours:8,  totalPay:1032, distance:'2.8 km', time:'8 AM – 4 PM',  day:'Today',    urgent:false, rating:4.9, slots:2,  tag:'High Pay', address:'Flipkart Hub, LBS Marg, Kurla West, Mumbai' },
  { id:7, emoji:'💼', title:'Office Assistant', company:'HDFC Bank',    pay:109, hours:8,  totalPay:872,  distance:'1.9 km', time:'9 AM – 5 PM',  day:'Tomorrow', urgent:false, rating:4.6, slots:6,  tag:'',         address:'HDFC Bank House, Bandra Kurla Complex, BKC, Mumbai' },
  { id:8, emoji:'🧹', title:'Cleaning Staff',   company:'Taj Hotel',    pay:99,  hours:4,  totalPay:396,  distance:'0.5 km', time:'6 AM – 10 AM', day:'Today',    urgent:true,  rating:4.3, slots:1,  tag:'Urgent',   address:'Vivanta by Taj, Cuffe Parade, Colaba, Mumbai' },
]

const CATEGORIES = [
  { label:'All',      photo: null },
  { label:'Shop',     photo: '/icons/services/store-helper.jpg' },
  { label:'Delivery', photo: '/icons/services/delivery-rider.jpg' },
  { label:'Kitchen',  photo: '/icons/services/cook-chef.jpg' },
  { label:'Guard',    photo: '/icons/services/security-guard.jpg' },
  { label:'Driver',   photo: '/icons/services/driver.jpg' },
  { label:'Office',   photo: '/icons/services/store-helper.jpg' },
  { label:'Cleaning', photo: '/icons/services/house-cleaner.jpg' },
]

/* ── Slide-to-Arrive inside the home banner ── */
function SlideToArrive({ onConfirm }: { onConfirm: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const startX   = useRef(0)
  const curX     = useRef(0)
  const [x, setX]      = useState(0)
  const [done, setDone] = useState(false)

  const THUMB_W = 54
  const PAD     = 5
  const maxX = () => (trackRef.current?.offsetWidth ?? 320) - THUMB_W - PAD * 2

  function onDown(e: React.PointerEvent) {
    if (done) return
    startX.current = e.clientX - curX.current
    thumbRef.current?.setPointerCapture(e.pointerId)
  }
  function onMove(e: React.PointerEvent) {
    if (!thumbRef.current?.hasPointerCapture(e.pointerId)) return
    const nx = Math.max(0, Math.min(e.clientX - startX.current, maxX()))
    curX.current = nx; setX(nx)
  }
  function onUp() {
    if (curX.current >= maxX() * 0.82) {
      setX(maxX()); setDone(true); setTimeout(onConfirm, 400)
    } else { curX.current = 0; setX(0) }
  }

  const pct   = x / Math.max(maxX(), 1)
  const fillW = x + THUMB_W + PAD * 2

  return (
    <div ref={trackRef} className="relative select-none"
      style={{
        height: 64, borderRadius: 32, overflow: 'hidden',
        background: done ? '#111111' : 'rgba(0,0,0,0.07)',
        border: `2px solid ${done ? '#111111' : 'rgba(0,0,0,0.18)'}`,
        transition: 'background 0.4s, border-color 0.3s',
      }}>
      {!done && (
        <div className="absolute inset-y-0 left-0 pointer-events-none"
          style={{ width: fillW, background: 'linear-gradient(90deg,rgba(0,0,0,0.12),rgba(0,0,0,0.22))', borderRadius: 29, transition: 'none' }} />
      )}
      {!done ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingLeft: THUMB_W + PAD * 2 + 8, opacity: Math.max(0, 1 - pct * 1.8) }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(0,0,0,0.55)' }}>Slide to Mark Arrived</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
          <CheckCircle style={{ width: 18, height: 18, color: '#FFFFFF' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Arrival Confirmed!</span>
        </div>
      )}
      <div ref={thumbRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        className="absolute flex items-center justify-center z-10"
        style={{
          top: PAD, bottom: PAD, width: THUMB_W, left: x + PAD,
          borderRadius: THUMB_W / 2,
          background: done ? 'rgba(255,255,255,0.25)' : '#111111',
          boxShadow: '0 3px 16px rgba(0,0,0,0.2)',
          touchAction: 'none', cursor: done ? 'default' : 'grab',
          transition: done ? 'left 0.35s ease' : 'none',
        }}>
        {done
          ? <CheckCircle style={{ width: 22, height: 22, color: '#fff' }} />
          : <ArrowRight  style={{ width: 20, height: 20, color: '#FFFFFF' }} />
        }
      </div>
    </div>
  )
}

/* ── Active Job Banner on home screen ── */
function ActiveJobBanner({ job, onArrive }: { job: Job; onArrive: () => void }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>

      <div style={{ height:3, background:'#111111', flexShrink:0 }} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background:'#111111' }} />
            <p style={{ fontSize:13, fontWeight:800, color:'#111111', letterSpacing:'0.08em' }}>SHIFT CONFIRMED</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.09)' }}>
            <Clock style={{ width:13, height:13, color:'#111111' }} />
            <span style={{ fontSize:13, fontWeight:700, color:'#111111' }}>{job.time}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <div className="rounded-2xl" style={{ width:56, height:56, overflow:'hidden', flexShrink:0 }}>
              <img src={getJobPhoto(job.title)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full"
              style={{ width:18, height:18, background:'#111111', fontSize:10, color:'#FFFFFF' }}>✓</span>
          </div>
          <div className="flex-1">
            <p style={{ fontSize:18, fontWeight:900, color:'#111111', lineHeight:1.2 }}>{job.title}</p>
            <p style={{ fontSize:13, color:'rgba(0,0,0,0.4)', marginTop:2 }}>{job.company}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p style={{ fontSize:22, fontWeight:900, color:'#111111', lineHeight:1 }}>₹{job.totalPay.toLocaleString('en-IN')}</p>
            <p style={{ fontSize:13, color:'rgba(0,0,0,0.35)', marginTop:2 }}>₹{job.pay}/hr × {job.hours}h</p>
          </div>
        </div>

        <div className="rounded-2xl p-3 mb-4" style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(0,0,0,0.07)' }}>
              <MapPin style={{ width:16, height:16, color:'#111111' }} />
            </div>
            <div className="flex-1">
              <p style={{ fontSize:12, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', marginBottom:3 }}>EMPLOYER ADDRESS</p>
              <p style={{ fontSize:15, fontWeight:700, color:'#111111', lineHeight:1.35 }}>{job.address}</p>
              <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:3 }}>{job.distance} away</p>
            </div>
          </div>
        </div>

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between w-full rounded-2xl px-4 mb-3"
          style={{ height:48, background:'#111111', textDecoration:'none' }}>
          <div className="flex items-center gap-2">
            <Navigation style={{ width:17, height:17, color:'#FFFFFF' }} />
            <p style={{ fontSize:15, fontWeight:700, color:'#FFFFFF' }}>Get Directions</p>
          </div>
          <ChevronRight style={{ width:16, height:16, color:'rgba(255,255,255,0.5)' }} />
        </a>

        <SlideToArrive onConfirm={onArrive} />
        <p className="text-center mt-2" style={{ fontSize:13, color:'rgba(0,0,0,0.35)' }}>Slide to start your shift timer</p>
      </div>
    </div>
  )
}

export default function WorkerHome() {
  const { t } = useLang()
  const router = useRouter()
  const FILTERS = t.filters as string[]

  const [mounted,      setMounted]     = useState(false)
  const [loggedIn,     setLoggedIn]    = useState(false)
  const [cityLabel,    setCityLabel]   = useState('Nearby')
  const [showLocEdit,  setShowLocEdit] = useState(false)

  const [online,       setOnline]      = useState(false)
  const [filter,       setFilter]      = useState(FILTERS[0])
  const [catFilter,    setCatFilter]   = useState('All')
  const [search,       setSearch]      = useState('')
  const [saved,        setSaved]       = useState<Set<number>>(new Set())
  const [selectedJob,  setSelectedJob] = useState<Job|null>(null)
  const [confirmedJob, setConfirmedJob]= useState<Job|null>(null)
  const [urgentJob,    setUrgentJob]   = useState<Job|null>(null)
  const [bookedJob,    setBookedJob]   = useState<Job|null>(null)
  const [activeShift,  setActiveShift] = useState<Job|null>(null)
  const [userName,     setUserName]    = useState('there')

  useEffect(() => {
    setMounted(true)
    setLoggedIn(!!localStorage.getItem('sw_role'))
    const savedCity = localStorage.getItem('sw_city')
    if (savedCity) setCityLabel(savedCity)
    const saved = localStorage.getItem('sw_booked_job')
    if (saved) { try { setBookedJob(JSON.parse(saved)) } catch {} }
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.name) setUserName(d.user.name.split(' ')[0]) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setUrgentJob({ id:4, emoji:'🔒', title:'Security Guard', company:'Phoenix Mall', pay:109, hours:12, totalPay:1308, distance:'2.1 km', time:'Now – 7 AM', day:'Tonight', urgent:true, rating:4.5, slots:2, tag:'Urgent', address:'Phoenix Palladium, Senapati Bapat Marg, Lower Parel, Mumbai' })
    }, 6000)
    return () => clearTimeout(t)
  }, [])

  const filtered = JOBS.filter(j => {
    const matchFilter =
      filter === FILTERS[1] ? j.day==='Today' :
      filter === FILTERS[2] ? j.day==='Tomorrow' :
      filter === FILTERS[3] ? true :
      filter === FILTERS[4] ? j.pay>=119 : true
    const matchCat = catFilter === 'All' ? true : j.title.toLowerCase().includes(catFilter.toLowerCase())
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchCat && matchSearch
  })
  const sortedFiltered = filter === FILTERS[3] ? [...filtered].sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance)) : filtered

  const urgentJobs = JOBS.filter(j => j.urgent)

  function handleSplashDone() {
    if (!localStorage.getItem('sw_lang')) router.push('/language')
  }

  if (!mounted || !loggedIn) {
    return (
      <div className="worker-theme">
        <SplashScreen onDone={handleSplashDone} />
        <WelcomeCard />
        <div style={{ minHeight: '100vh', background: '#FFFFFF' }} />
      </div>
    )
  }

  return (
    <div className="worker-theme">
      <SplashScreen onDone={handleSplashDone} />
      <WelcomeCard />
      <PermissionScreen />
      <LocationSync onCity={setCityLabel} />
      <TopBar name={userName} unread={2} />
      <JobDetailSheet
        job={selectedJob}
        onClose={()=>setSelectedJob(null)}
        onAccepted={job=>{ setSelectedJob(null); setConfirmedJob(job as Job) }}
      />
      <ShiftConfirmed job={confirmedJob} onDone={()=>{
        const job = confirmedJob
        setBookedJob(job)
        if (job) localStorage.setItem('sw_booked_job', JSON.stringify(job))
        setConfirmedJob(null)
      }} />
      <ActiveShift job={activeShift} onClose={()=>setActiveShift(null)} onDone={()=>{
        setBookedJob(null)
        setActiveShift(null)
        localStorage.removeItem('sw_booked_job')
      }} />

      <div style={{ minHeight:'100vh', paddingTop:'calc(56px + var(--safe-t))', paddingBottom:'calc(80px + var(--safe-b))', background:'#FFFFFF' }}>

        {/* ── Hero header bar ── */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <button className="flex items-center gap-1.5" onClick={() => setShowLocEdit(true)}>
            <MapPin style={{ width:15, height:15, color:'rgba(0,0,0,0.5)', flexShrink:0 }} />
            <span style={{ fontSize:15, fontWeight:700, color:'#111111' }}>{cityLabel}</span>
            <ChevronDown style={{ width:14, height:14, color:'rgba(0,0,0,0.35)' }} />
          </button>
          <button
            onClick={()=>setOnline(o=>!o)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 12px', borderRadius:20,
              background: online ? '#111111' : 'rgba(0,0,0,0.07)',
              border: `1px solid ${online ? 'transparent' : 'rgba(0,0,0,0.12)'}`,
              transition:'all 0.25s',
            }}>
            <span style={{
              width:8, height:8, borderRadius:'50%',
              background: online ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
              display:'inline-block', flexShrink:0,
            }} />
            <span style={{ fontSize:13, fontWeight:700, color: online ? '#FFFFFF' : 'rgba(0,0,0,0.4)' }}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="px-5 pb-4">
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)',
            borderRadius:16, padding:'12px 16px',
          }}>
            <Search style={{ width:17, height:17, color:'rgba(0,0,0,0.3)', flexShrink:0 }} />
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search jobs, companies…"
              style={{
                flex:1, background:'transparent', border:'none', outline:'none',
                fontSize:16, fontWeight:500, color:'#111111',
              }}
            />
            {search && (
              <button onClick={()=>setSearch('')} style={{ fontSize:13, color:'rgba(0,0,0,0.4)' }}>✕</button>
            )}
          </div>
        </div>

        {/* ── Active Job Banner ── */}
        {bookedJob && <div className="px-5 pb-4"><ActiveJobBanner job={bookedJob} onArrive={() => setActiveShift(bookedJob)} /></div>}

        {/* ── Earnings strip ── */}
        {!bookedJob && (
          <div className="px-5 pb-5">
            <div style={{
              background:'#F5F5F5',
              border:'1px solid rgba(0,0,0,0.09)',
              borderRadius:22, padding:'16px 18px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <p style={{ fontSize:13, fontWeight:700, letterSpacing:'0.08em', color:'rgba(0,0,0,0.38)', textTransform:'uppercase', marginBottom:4 }}>{t.today_money}</p>
                <p style={{ fontSize:34, fontWeight:900, color:'#111111', lineHeight:1 }}>₹0</p>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                  <TrendingUp style={{ width:12, height:12, color:'#111111' }} />
                  <span style={{ fontSize:13, color:'rgba(0,0,0,0.4)' }}>{t.this_week}: <b style={{ color:'#111111' }}>₹1,200</b></span>
                </div>
              </div>
              {!online ? (
                <button onClick={()=>setOnline(true)}
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    padding:'12px 16px', borderRadius:16,
                    background:'#111111', border:'none',
                  }}>
                  <Zap style={{ width:18, height:18, color:'#FFFFFF' }} />
                  <span style={{ fontSize:13, fontWeight:800, color:'#FFFFFF', letterSpacing:'0.05em' }}>GO LIVE</span>
                </button>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#111111' }} />
                  <span style={{ fontSize:13, fontWeight:800, color:'#111111', letterSpacing:'0.08em' }}>LIVE</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Category filter ── */}
        <div style={{ paddingBottom:16, overflowX:'auto', display:'flex', gap:10, padding:'0 20px 16px', scrollbarWidth:'none' }}>
          {CATEGORIES.map(c => {
            const on = catFilter === c.label
            return (
              <button
                key={c.label}
                onClick={()=>setCatFilter(c.label)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                  flexShrink:0,
                  padding:'10px 14px', borderRadius:18,
                  background: on ? '#111111' : '#F5F5F5',
                  border: `1.5px solid ${on ? 'transparent' : 'rgba(0,0,0,0.09)'}`,
                  transition:'all 0.2s',
                }}>
                {c.photo
                  ? <div style={{ width:28, height:28, borderRadius:8, overflow:'hidden' }}>
                      <img src={c.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                    </div>
                  : <Zap style={{ width:18, height:18, color: on ? '#FFFFFF' : 'rgba(0,0,0,0.4)' }} />
                }
                <span style={{ fontSize:13, fontWeight:700, color: on ? '#FFFFFF' : 'rgba(0,0,0,0.55)', whiteSpace:'nowrap' }}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Urgent / Featured horizontal scroll ── */}
        {urgentJobs.length > 0 && catFilter === 'All' && !search && (
          <div style={{ marginBottom:24 }}>
            <div className="flex items-center justify-between px-5 mb-3">
              <p style={{ fontSize:17, fontWeight:800, color:'#111111' }}>Urgent Near You</p>
              <span style={{ fontSize:13, fontWeight:600, color:'#DC2626' }}>Filling fast</span>
            </div>
            <div style={{ display:'flex', gap:14, padding:'0 20px', overflowX:'auto', scrollbarWidth:'none' }}>
              {urgentJobs.map(job => (
                <UrgentCard key={job.id} job={job} onTap={()=>setSelectedJob(job)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Filter pills ── */}
        <div style={{ display:'flex', gap:8, padding:'0 20px 16px', overflowX:'auto', scrollbarWidth:'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{
                flexShrink:0, padding:'7px 16px', borderRadius:20,
                fontSize:14, fontWeight:700,
                background: filter===f ? '#111111' : '#F5F5F5',
                color: filter===f ? '#FFFFFF' : 'rgba(0,0,0,0.55)',
                border: `1px solid ${filter===f ? 'transparent' : 'rgba(0,0,0,0.09)'}`,
                transition:'all 0.2s',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between px-5 mb-4">
          <p style={{ fontSize:16, fontWeight:800, color:'#111111' }}>
            {t.jobs_near_you}
            <span style={{ fontSize:14, fontWeight:400, color:'rgba(0,0,0,0.35)', marginLeft:6 }}>({sortedFiltered.length})</span>
          </p>
          <button style={{ fontSize:13, fontWeight:600, color:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:2 }}>
            {t.see_all} <ChevronRight style={{ width:14, height:14 }} />
          </button>
        </div>

        {/* ── Job cards ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'0 20px' }}>
          {sortedFiltered.map((job,i) => (
            <JobCard
              key={job.id} job={job}
              saved={saved.has(job.id)}
              onSave={()=>setSaved(prev=>{const n=new Set(prev);n.has(job.id)?n.delete(job.id):n.add(job.id);return n})}
              onTap={()=>setSelectedJob(job)}
              delay={i*0.04}
              t={t}
            />
          ))}
          {sortedFiltered.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <Search style={{ width:36, height:36, color:'rgba(0,0,0,0.2)', marginBottom:12 }} />
              <p style={{ fontSize:17, fontWeight:700, color:'rgba(0,0,0,0.5)' }}>No jobs found</p>
              <p style={{ fontSize:14, color:'rgba(0,0,0,0.35)', marginTop:4 }}>Try a different filter or search</p>
            </div>
          )}
        </div>
        <div style={{ height:16 }} />
      </div>

      <UrgentJobPopup
        job={urgentJob}
        onView={job=>{ setUrgentJob(null); setSelectedJob(job as Job) }}
        onDismiss={()=>setUrgentJob(null)}
      />
      {!urgentJob && !activeShift && !confirmedJob && !selectedJob && <BottomNav active="/" />}
      <LocationSheet
        visible={showLocEdit}
        cityLabel={cityLabel}
        onSave={city => { setCityLabel(city); setShowLocEdit(false) }}
        onClose={() => setShowLocEdit(false)}
      />
    </div>
  )
}

/* ── Compact horizontal urgent card ── */
function UrgentCard({ job, onTap }: { job:Job; onTap:()=>void }) {
  return (
    <button onClick={onTap}
      style={{
        flexShrink:0, width:175, borderRadius:20, overflow:'hidden',
        background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)',
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        textAlign:'left', outline:'none',
      }}>
      <div style={{ background:'#EFEFEF', padding:'14px 14px 12px' }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:4,
          padding:'3px 8px', borderRadius:10, marginBottom:10,
          background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)',
        }}>
          <span style={{ fontSize:12, fontWeight:800, color:'#DC2626', letterSpacing:'0.08em' }}>⚡ URGENT</span>
        </div>
        <div style={{ width:44, height:44, borderRadius:14, overflow:'hidden' }}>
          <img src={getJobPhoto(job.title)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
        </div>
      </div>
      <div style={{ padding:'10px 14px 12px' }}>
        <p style={{ fontSize:16, fontWeight:800, color:'#111111', lineHeight:1.2, marginBottom:2 }}>{job.title}</p>
        <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginBottom:8 }}>{job.company}</p>
        <p style={{ fontSize:20, fontWeight:900, color:'#111111', lineHeight:1 }}>₹{job.totalPay.toLocaleString('en-IN')}</p>
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <span style={{ fontSize:13, color:'rgba(0,0,0,0.4)' }}>{job.hours}h</span>
          <span style={{ fontSize:13, color:'rgba(0,0,0,0.4)' }}>{job.distance}</span>
        </div>
      </div>
    </button>
  )
}

/* ── Job Card ── */
function JobCard({ job, saved, onSave, onTap, delay, t }: {
  job:Job; saved:boolean; onSave:()=>void; onTap:()=>void; delay:number; t:any
}) {
  return (
    <div onClick={onTap}
      style={{
        borderRadius:20, overflow:'hidden',
        background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.09)',
        boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer',
      }}>

      <div style={{
        height:88, background:'#F5F5F5',
        position:'relative', padding:'12px 14px',
      }}>
        <div style={{ display:'flex', gap:6 }}>
          {job.urgent && (
            <span style={{ fontSize:12, fontWeight:800, color:'#DC2626',
              background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)',
              borderRadius:8, padding:'3px 8px' }}>⚡ URGENT</span>
          )}
          {job.tag && !job.urgent && (
            <span style={{ fontSize:12, fontWeight:800, color:'rgba(0,0,0,0.5)',
              background:'rgba(0,0,0,0.06)', borderRadius:8, padding:'3px 8px' }}>{job.tag}</span>
          )}
        </div>
        <button onClick={e=>{e.stopPropagation();onSave()}}
          style={{
            position:'absolute', top:10, right:12, width:32, height:32, borderRadius:10,
            background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.09)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
          <Bookmark style={{ width:15, height:15, color:saved?'#111111':'rgba(0,0,0,0.35)', fill:saved?'#111111':'none', transition:'all 0.2s' }} />
        </button>
        <div style={{
          position:'absolute', bottom:-22, left:16,
          width:46, height:46, borderRadius:14,
          border:'3px solid #FFFFFF',
          boxShadow:'0 4px 12px rgba(0,0,0,0.12)',
          overflow:'hidden', zIndex:2,
        }}>
          <img src={getJobPhoto(job.title)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
        </div>
      </div>

      <div style={{ padding:'26px 16px 14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:4 }}>
          <div>
            <p style={{ fontSize:16, fontWeight:800, color:'#111111', lineHeight:1.2 }}>{job.title}</p>
            <p style={{ fontSize:13, color:'rgba(0,0,0,0.4)', marginTop:2 }}>{job.company}</p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <p style={{ fontSize:22, fontWeight:900, color:'#111111', lineHeight:1 }}>₹{job.totalPay.toLocaleString('en-IN')}</p>
            <p style={{ fontSize:13, color:'rgba(0,0,0,0.35)', marginTop:2 }}>₹{job.pay}/hr × {job.hours}h</p>
          </div>
        </div>

        <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
          {[
            <><Clock style={{ width:10, height:10 }} />{job.hours}h</>,
            <><MapPin style={{ width:10, height:10 }} />{job.distance}</>,
            <><Star style={{ width:10, height:10, fill:'rgba(0,0,0,0.6)', color:'rgba(0,0,0,0.6)' }} />{job.rating}</>,
            <>{job.day} · {job.time}</>,
          ].map((c,i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:3, fontSize:13, color:'rgba(0,0,0,0.45)', background:'rgba(0,0,0,0.05)', borderRadius:8, padding:'4px 8px' }}>{c}</span>
          ))}
        </div>

        <div style={{
          marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 16px', borderRadius:14,
          background:'#111111',
        }}>
          <span style={{ fontSize:15, fontWeight:800, color:'#FFFFFF' }}>{t.view_apply}</span>
          <ArrowRight style={{ width:16, height:16, color:'rgba(255,255,255,0.5)' }} />
        </div>
      </div>
    </div>
  )
}
