'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BG   = '#080808'
const S1   = '#111111'
const S2   = '#181818'
const BD   = 'rgba(255,255,255,0.07)'
const T1   = '#FFFFFF'
const T2   = 'rgba(255,255,255,0.45)'
const T3   = 'rgba(255,255,255,0.2)'
const FONT = '"DM Sans", system-ui, -apple-system, sans-serif'

type Profile = {
  name: string; phone: string
  employerProfile?: {
    companyName?: string; businessType?: string; address?: string; city?: string; gstNumber?: string
    totalShifts: number; rating: number; createdAt?: string
  }
}

export default function EmployerProfilePage() {
  const router = useRouter()
  const [profile,     setProfile]    = useState<Profile | null>(null)
  const [editing,     setEditing]    = useState(false)
  const [draft,       setDraft]      = useState({ companyName: '', businessType: '', address: '', city: '', gstNumber: '' })
  const [saving,      setSaving]     = useState(false)
  const [showLogout,  setShowLogout] = useState(false)

  useEffect(() => {
    fetch('/api/employer/profile').then(r => {
      if (r.status === 401) { router.replace('/employer/login'); return r.json() }
      return r.json()
    }).then(d => {
      const u = d?.user || d?.profile
      if (!u) return
      setProfile(u)
      const ep = u.employerProfile
      setDraft({ companyName: ep?.companyName || '', businessType: ep?.businessType || '', address: ep?.address || '', city: ep?.city || '', gstNumber: ep?.gstNumber || '' })
    })
  }, [])

  async function saveEdit() {
    setSaving(true)
    await fetch('/api/employer/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile?.name, ...draft }),
    })
    setProfile(p => p ? { ...p, employerProfile: { ...p.employerProfile, totalShifts: p.employerProfile?.totalShifts || 0, rating: p.employerProfile?.rating || 0, ...draft } } : p)
    setEditing(false); setSaving(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/employer/login')
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ color: T2, fontSize: 16 }}>Loading...</div>
    </div>
  )

  const ep        = profile.employerProfile
  const bizName   = ep?.companyName || profile.name || 'My Business'
  const initial   = bizName[0]?.toUpperCase() || 'B'
  const sinceYear = ep?.createdAt ? new Date(ep.createdAt).getFullYear() : new Date().getFullYear()

  const menuItems = [
    {
      iconColor: '#818CF8', iconBg: 'rgba(129,140,248,0.1)', label: 'My Bookings', desc: 'View all your jobs',
      action: () => router.push('/employer/jobs'),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.1)', label: 'Wallet', desc: 'Payment history & spending',
      action: () => router.push('/employer/wallet'),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    },
    {
      iconColor: '#34D399', iconBg: 'rgba(52,211,153,0.1)', label: 'Refer & Earn', desc: 'Invite friends, earn ₹100',
      action: () => router.push('/employer/refer'),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      iconColor: '#60A5FA', iconBg: 'rgba(96,165,250,0.1)', label: 'Help & Support', desc: 'Chat with us on WhatsApp',
      action: () => window.open('https://wa.me/918368828660', '_blank'),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      iconColor: T2, iconBg: 'rgba(255,255,255,0.05)', label: 'Terms & Privacy', desc: 'Legal documents',
      action: () => {},
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: T1, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))', paddingBottom: 28, paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => window.history.back()} style={{
            width: 40, height: 40, borderRadius: 20, border: `1px solid ${BD}`, background: S1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ fontSize: 22, fontWeight: 900, color: T1 }}>Account</div>
        </div>

        {/* Avatar + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 36,
            background: S1, border: `2px solid ${T1}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T1, fontWeight: 900, fontSize: 28,
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T1 }}>{bizName}</div>
            <div style={{ fontSize: 14, color: T2, marginTop: 3 }}>+91 {profile.phone}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
              background: 'rgba(16,185,129,0.08)', borderRadius: 20, padding: '4px 12px',
              border: '1px solid rgba(16,185,129,0.18)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'vPulse 2s ease infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Verified Employer</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Jobs Posted', value: ep?.totalShifts || 0 },
            { label: 'Rating',      value: ep?.rating ? `${ep.rating.toFixed(1)}★` : 'New' },
            { label: 'Since',       value: sinceYear },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: S1, borderRadius: 14, padding: '14px 8px', textAlign: 'center', border: `1px solid ${BD}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: T1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: T2, marginTop: 3 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Business details */}
        <div style={{ background: S1, borderRadius: 20, padding: 18, border: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T1 }}>Business Details</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{ padding: '7px 16px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: T2, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: T1, color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.7 : 1, fontFamily: FONT }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} style={{ fontSize: 14, fontWeight: 700, color: T1, background: 'none', border: `1px solid ${BD}`, cursor: 'pointer', fontFamily: FONT, padding: '6px 14px', borderRadius: 10 }}>Edit</button>
            )}
          </div>

          {([
            { label: 'Business Name', key: 'companyName' },
            { label: 'Business Type', key: 'businessType' },
            { label: 'Address',       key: 'address' },
            { label: 'City',          key: 'city' },
            { label: 'GST Number',    key: 'gstNumber' },
          ] as { label: string; key: keyof typeof draft }[]).map(({ label, key }, i, arr) => (
            <div key={key} style={{ paddingBottom: i < arr.length - 1 ? 14 : 0, marginBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${BD}` : 'none' }}>
              <div style={{ fontSize: 12, color: T3, marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>{label}</div>
              {editing ? (
                <input type="text" value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${T1}`,
                  fontSize: 15, fontWeight: 500, color: T1, background: S2, outline: 'none',
                  boxSizing: 'border-box' as const, fontFamily: FONT,
                }} />
              ) : (
                <div style={{ fontSize: 15, fontWeight: 600, color: draft[key] ? T1 : T3 }}>{draft[key] || '—'}</div>
              )}
            </div>
          ))}
        </div>

        {/* Menu */}
        <div style={{ background: S1, borderRadius: 20, overflow: 'hidden', border: `1px solid ${BD}` }}>
          {menuItems.map(({ iconBg, label, desc, action, icon }) => (
            <button key={label} onClick={action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left' as const, borderBottom: `1px solid ${BD}`, fontFamily: FONT,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T1 }}>{label}</div>
                <div style={{ fontSize: 13, color: T2, marginTop: 2 }}>{desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}

          <button onClick={() => setShowLogout(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div style={{ flex: 1, textAlign: 'left' as const }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#EF4444' }}>Sign Out</div>
              <div style={{ fontSize: 13, color: T2, marginTop: 2 }}>Sign out of your account</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: T3, paddingBottom: 4 }}>Switch Employer v2.0.0</div>
      </div>

      {/* Logout sheet */}
      {showLogout && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowLogout(false)}>
          <div style={{ background: S1, borderRadius: '28px 28px 0 0', padding: '28px 24px 36px', width: '100%', maxWidth: 480, border: `1px solid ${BD}`, borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: BD, margin: '0 auto 24px' }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: T1, marginBottom: 10 }}>Sign out?</div>
            <div style={{ fontSize: 15, color: T2, marginBottom: 28 }}>Are you sure you want to sign out of Switch Employer?</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 16, border: `1px solid ${BD}`, background: 'transparent', color: T1, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '15px 0', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: FONT }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes vPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
    </div>
  )
}
