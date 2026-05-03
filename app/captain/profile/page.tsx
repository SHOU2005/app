'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#2563EB'
const FONT = '"DM Sans", system-ui, sans-serif'

interface Profile { name: string; phone: string; captainProfile: { status: string; territory: string | null; totalEarnings: number; joinedAt: string } | null }

export default function CaptainProfilePage() {
  const router  = useRouter()
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [editing,  setEditing]  = useState(false)
  const [name,     setName]     = useState('')
  const [city,     setCity]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/captain/profile').then(r => {
      if (r.status === 401) { router.replace('/captain/login'); return null }
      return r.json()
    }).then(d => {
      if (!d) return
      setProfile(d.user)
      setName(d.user.name)
      setCity(d.user.captainProfile?.territory || '')
    }).finally(() => setLoading(false))
  }, [router])

  async function save() {
    setSaving(true)
    await fetch('/api/captain/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city }) })
    setSaving(false)
    setEditing(false)
    setProfile(prev => prev ? { ...prev, name, captainProfile: prev.captainProfile ? { ...prev.captainProfile, territory: city } : null } : null)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/captain/login')
  }

  if (loading) return <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T2 }}>Loading…</div>

  const cp = profile?.captainProfile

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title="Profile" />
      <div style={{ padding: '24px 20px' }}>

        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28, margin: '0 auto 12px' }}>
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: T1, margin: '0 0 4px' }}>{profile?.name}</p>
          <p style={{ color: T2, fontSize: 14, margin: 0 }}>{profile?.phone}</p>
          <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: cp?.status === 'ACTIVE' ? '#DCFCE7' : '#FEF9C3', color: cp?.status === 'ACTIVE' ? '#166534' : '#713F12' }}>
            {cp?.status || 'PENDING'}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Territory', value: cp?.territory || 'Not assigned' },
            { label: 'Total Earned', value: `₹${cp?.totalEarnings ?? 0}` },
            { label: 'Member Since', value: cp?.joinedAt ? new Date(cp.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#F5F5F5', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: T2, margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: T1, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Edit form */}
        {editing ? (
          <div style={{ background: '#F5F5F5', borderRadius: 16, padding: '20px' }}>
            <p style={{ fontWeight: 700, color: T1, marginBottom: 16 }}>Edit Profile</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 6 }}>Name</label>
              <input className="field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'block', marginBottom: 6 }}>City / Territory</label>
              <input className="field" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#FFFFFF', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: T2 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${BLUE}`, background: 'transparent', color: BLUE, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>
            Edit Profile
          </button>
        )}

        <button onClick={logout} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #FCA5A5', background: '#FFF1F2', color: '#DC2626', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
          Logout
        </button>
      </div>
      <CaptainBottomNav />
    </div>
  )
}
