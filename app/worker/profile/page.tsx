'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin, ChevronRight, Shield, Bell, HelpCircle,
  LogOut, Edit2, CheckCircle, Gift, Copy, Share2, Briefcase, Camera,
} from 'lucide-react'
import TopBar    from '@/components/shared/TopBar'
import BottomNav from '@/components/shared/BottomNav'

const SKILLS = [
  { label:'Shop Helper', emoji:'🏪' },
  { label:'Delivery',    emoji:'🚴' },
  { label:'Security',    emoji:'🔒' },
  { label:'Kitchen',     emoji:'🍳' },
  { label:'Warehouse',   emoji:'🏭' },
  { label:'Cleaning',    emoji:'🧹' },
]
const LANGUAGES = ['Hindi', 'English', 'Marathi']

const MENU_ITEMS = [
  { icon:Shield,     label:'Aadhaar Verified', sub:'Your ID is verified',      color:'#111111', bg:'rgba(0,0,0,0.07)',     action:''         },
  { icon:Bell,       label:'Notifications',    sub:'Job alerts are on',        color:'#111111', bg:'rgba(0,0,0,0.07)',     action:''         },
  { icon:HelpCircle, label:'Help & Support',   sub:'Chat on WhatsApp',         color:'#111111', bg:'rgba(0,0,0,0.07)',     action:'whatsapp' },
  { icon:LogOut,     label:'Log Out',          sub:'',                         color:'#FF3B30', bg:'rgba(255,59,48,0.1)',  action:'logout'   },
]

export default function ProfilePage() {
  const router = useRouter()
  const [editing,      setEditing]      = useState(false)
  const [name,         setName]         = useState('Raju Yadav')
  const [phone,        setPhone]        = useState('+91 98765 43210')
  const [city,         setCity]         = useState('Andheri West, Mumbai')
  const [activeSkills, setActiveSkills] = useState(new Set(['Shop Helper', 'Delivery', 'Kitchen']))
  const [refCopied,    setRefCopied]    = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [upiId,        setUpiId]        = useState('raju@phonepe')
  const [editUpi,      setEditUpi]      = useState(false)
  const [totalShifts,  setTotalShifts]  = useState(23)
  const [totalEarnings,setTotalEarnings]= useState(18000)
  const [rating,       setRating]       = useState(4.8)

  useEffect(() => {
    fetch('/api/worker/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) return
        setName(d.user.name || name)
        setPhone(d.user.phone ? `+91 ${d.user.phone.slice(0,5)} ${d.user.phone.slice(5)}` : phone)
        if (d.user.workerProfile) {
          const wp = d.user.workerProfile
          setCity(wp.city || city)
          if (wp.skills?.length) setActiveSkills(new Set(wp.skills))
          setTotalShifts(wp.totalShifts || 23)
          setTotalEarnings(wp.totalEarnings || 18000)
          setRating(wp.rating || 4.8)
        }
      })
      .catch(() => {})
  }, [])

  const referralCode = 'SW' + name.replace(/\s+/g,'').slice(0,4).toUpperCase() + phone.replace(/\D/g,'').slice(-4)

  function copyCode() {
    navigator.clipboard?.writeText(referralCode).catch(()=>{})
    setRefCopied(true)
    setTimeout(()=>setRefCopied(false), 2000)
  }

  function toggleSkill(s: string) {
    setActiveSkills(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  return (
    <>
      <TopBar title="My Profile" unread={2} />

      <div style={{ minHeight:'100vh', paddingTop:'calc(56px + var(--safe-t))', paddingBottom:'calc(80px + var(--safe-b))', background:'#FFFFFF' }}>

        {/* ── Profile header ── */}
        <div className="px-4 pt-3 pb-5">
          <div className="rounded-3xl overflow-hidden"
            style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>

            <div style={{ height:3, background:'rgba(0,0,0,0.07)' }} />

            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative flex-shrink-0">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) setProfilePhoto(URL.createObjectURL(file))
                    }}
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    style={{ display: 'block', width: 76, height: 76, borderRadius: 16, overflow: 'hidden',
                      border: '2px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      position: 'relative', padding: 0, cursor: 'pointer' }}>
                    <img src={profilePhoto ?? 'https://picsum.photos/seed/raju2025/152/152'} alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
                      background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Camera style={{ width: 11, height: 11, color: '#FFFFFF' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF' }}>Edit</span>
                    </div>
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#111111', border: '2px solid #FFFFFF' }}>
                    <CheckCircle style={{ width: 12, height: 12, color: '#FFFFFF' }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p style={{ fontSize:20, fontWeight:900, color:'#111111', lineHeight:1.15 }}>{name}</p>
                    <button onClick={()=>setEditing(e=>!e)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background:'rgba(0,0,0,0.07)' }}>
                      <Edit2 style={{ width:12, height:12, color:'rgba(0,0,0,0.6)' }} />
                    </button>
                  </div>
                  <p style={{ fontSize:14, color:'rgba(0,0,0,0.4)', marginBottom:8 }}>{phone}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                      style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.12)' }}>
                      <CheckCircle style={{ width:10, height:10, color:'#111111' }} />
                      <span style={{ fontSize:12, fontWeight:700, color:'#111111' }}>Verified</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                      style={{ background:'rgba(0,0,0,0.06)' }}>
                      <MapPin style={{ width:10, height:10, color:'rgba(0,0,0,0.45)' }} />
                      <span style={{ fontSize:12, fontWeight:600, color:'rgba(0,0,0,0.45)' }}>Mumbai</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 pt-4" style={{ borderTop:'1px solid rgba(0,0,0,0.08)' }}>
                {[
                  { value: rating.toFixed(1),                          label:'Rating',     icon:'⭐' },
                  { value: String(totalShifts),                         label:'Jobs Done',  icon:'✅' },
                  { value: `₹${Math.round(totalEarnings/1000)}k`,      label:'This Month', icon:'💰' },
                ].map(s => (
                  <div key={s.label} className="text-center py-1">
                    <p style={{ fontSize:20, fontWeight:900, color:'#111111', lineHeight:1 }}>{s.value}</p>
                    <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:4 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <div className="px-4 pb-5">
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize:16, fontWeight:800, color:'#111111', marginBottom:4 }}>Edit Info</p>
              {[
                { label:'Your Name', value:name, onChange:setName },
                { label:'City',      value:city, onChange:setCity },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ fontSize:13, fontWeight:600, color:'rgba(0,0,0,0.4)', marginBottom:6 }}>{f.label}</p>
                  <input value={f.value} onChange={e=>f.onChange(e.target.value)} className="field" style={{ fontSize:15 }} />
                </div>
              ))}
              <button onClick={()=>setEditing(false)} className="btn btn-primary btn-full"
                style={{ height:48, fontSize:15, fontWeight:700, borderRadius:14 }}>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── My Skills ── */}
        <div className="px-4 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'rgba(0,0,0,0.07)' }}>
              <Briefcase style={{ width:14, height:14, color:'rgba(0,0,0,0.6)' }} />
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:'#111111' }}>My Skills</p>
          </div>
          <p style={{ fontSize:14, color:'rgba(0,0,0,0.38)', marginBottom:12 }}>Tap to select work types you can do</p>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(({ label, emoji }) => {
              const on = activeSkills.has(label)
              return (
                <button key={label} onClick={()=>toggleSkill(label)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={on
                    ? { background:'#111111', color:'#FFFFFF',
                        boxShadow:'0 3px 16px rgba(0,0,0,0.12)', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }
                    : { background:'#F5F5F5', color:'rgba(0,0,0,0.5)', border:'1px solid rgba(0,0,0,0.09)', fontSize:13, fontWeight:600, cursor:'pointer' }
                  }>
                  <span style={{ fontSize:15 }}>{emoji}</span>
                  {on && <CheckCircle style={{ width:12, height:12, color:'#FFFFFF' }} />}
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Payout UPI ── */}
        <div className="px-4 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize:14 }}>💸</span>
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:'#111111' }}>Payout UPI ID</p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.09)' }}>
                <span style={{ fontSize:18 }}>💸</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                  Salary goes to
                </p>
                {editUpi ? (
                  <input value={upiId} onChange={e=>setUpiId(e.target.value.toLowerCase())} autoFocus
                    style={{ width:'100%', background:'none', border:'none', outline:'none',
                      fontSize:15, fontWeight:700, color:'#111111' }} />
                ) : (
                  <p style={{ fontSize:15, fontWeight:700, color:'#111111' }}>{upiId}</p>
                )}
              </div>
              {upiId.includes('@') && !editUpi && (
                <CheckCircle style={{ width:18, height:18, color:'#111111', flexShrink:0 }} />
              )}
            </div>
            <div style={{ padding:'0 16px 14px' }}>
              {editUpi ? (
                <button onClick={()=>setEditUpi(false)}
                  style={{ width:'100%', height:40, borderRadius:12, background:'#111111',
                    color:'#FFFFFF', fontSize:15, fontWeight:700, border:'none', cursor:'pointer' }}>
                  Save UPI ID
                </button>
              ) : (
                <button onClick={()=>setEditUpi(true)}
                  style={{ width:'100%', height:40, borderRadius:12, background:'rgba(0,0,0,0.06)',
                    color:'rgba(0,0,0,0.6)', fontSize:15, fontWeight:700, border:'1px solid rgba(0,0,0,0.09)', cursor:'pointer' }}>
                  Change UPI ID
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Refer & Earn ── */}
        <div className="px-4 pb-5">
          <div className="rounded-3xl overflow-hidden"
            style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background:'#111111' }}>
                    <Gift style={{ width:20, height:20, color:'#FFFFFF' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:16, fontWeight:900, color:'#111111' }}>Refer &amp; Earn</p>
                    <p style={{ fontSize:14, color:'rgba(0,0,0,0.45)', marginTop:1 }}>₹200 per referral</p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ fontSize:24, fontWeight:900, color:'#111111', lineHeight:1 }}>₹600</p>
                  <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:2 }}>3 friends</p>
                </div>
              </div>

              <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
                style={{ background:'#FFFFFF', border:'1.5px dashed rgba(0,0,0,0.15)' }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.1em', marginBottom:5 }}>
                    YOUR CODE
                  </p>
                  <p style={{ fontSize:20, fontWeight:900, color:'#111111', letterSpacing:4 }}>{referralCode}</p>
                </div>
                <button onClick={copyCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                  style={{ background: refCopied ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.07)',
                    border:'1px solid rgba(0,0,0,0.12)', fontSize:14, fontWeight:700, color:'#111111', cursor:'pointer' }}>
                  {refCopied ? <CheckCircle style={{ width:13, height:13 }} /> : <Copy style={{ width:13, height:13 }} />}
                  {refCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <button
                onClick={() => {
                  const msg = `Hey! Join me on Switch and earn ₹99–₹129/hr doing part-time work near you. Use my referral code *${referralCode}* to get started!\n\nDownload Switch: https://switch.app`
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl"
                style={{ background:'rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.09)',
                  fontSize:15, fontWeight:700, color:'#111111', cursor:'pointer' }}>
                <Share2 style={{ width:16, height:16 }} />
                Share with Friends
              </button>
            </div>
          </div>
        </div>

        {/* ── Work Area + Languages ── */}
        <div className="px-4 pb-5">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>

            <button className="w-full flex items-center gap-3 px-4 py-4 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(0,0,0,0.07)' }}>
                <MapPin style={{ width:18, height:18, color:'rgba(0,0,0,0.6)' }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize:15, fontWeight:700, color:'#111111' }}>Work Area</p>
                <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:2 }}>{city}</p>
              </div>
              <ChevronRight style={{ width:17, height:17, color:'rgba(0,0,0,0.25)' }} />
            </button>

            <div style={{ height:1, background:'rgba(0,0,0,0.06)', margin:'0 16px' }} />

            <div className="px-4 py-4">
              <p style={{ fontSize:14, fontWeight:700, color:'rgba(0,0,0,0.4)', marginBottom:10 }}>Languages I Speak</p>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map(l => (
                  <span key={l} className="px-3 py-1.5 rounded-full"
                    style={{ background:'rgba(0,0,0,0.06)', color:'rgba(0,0,0,0.6)', fontSize:13, fontWeight:600, border:'1px solid rgba(0,0,0,0.08)' }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Settings menu ── */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            {MENU_ITEMS.map(({ icon:Icon, label, sub, color, bg, action }, i) => (
              <div key={label}>
                <button
                  onClick={() => {
                    if (action==='logout') { localStorage.removeItem('sw_perms'); localStorage.removeItem('sw_role'); router.push('/login') }
                    if (action==='whatsapp') window.open('https://wa.me/918368828660?text=Hi%2C%20I%20need%20help%20with%20Switch', '_blank')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:bg }}>
                    <Icon style={{ width:18, height:18, color, strokeWidth:1.8 }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize:15, fontWeight:600, color: action==='logout' ? '#DC2626' : '#111111' }}>{label}</p>
                    {sub && <p style={{ fontSize:13, color:'rgba(0,0,0,0.38)', marginTop:2 }}>{sub}</p>}
                  </div>
                  {action!=='logout' && <ChevronRight style={{ width:17, height:17, color:'rgba(0,0,0,0.25)' }} />}
                </button>
                {i < MENU_ITEMS.length-1 && <div style={{ height:1, background:'rgba(0,0,0,0.06)', margin:'0 16px' }} />}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center pb-4" style={{ fontSize:13, color:'rgba(0,0,0,0.25)' }}>
          Switch v1.0 · Made in India 🇮🇳
        </p>

      </div>

      <BottomNav active="/worker/profile" />
    </>
  )
}
