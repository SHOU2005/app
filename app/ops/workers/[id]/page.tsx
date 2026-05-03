'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

const BG='#000000';const S1='#0F0F0F';const BD='rgba(255,255,255,0.08)';const T1='#FFFFFF';const T2='rgba(255,255,255,0.4)';

const KYC_COLOR: Record<string, string> = { PENDING: '#FBBF24', APPROVED: '#34D399', REJECTED: '#F87171' }
const STATUS_COLOR: Record<string, string> = { COMPLETED: '#34D399', PENDING: '#FBBF24', CANCELLED: '#F87171', IN_PROGRESS: '#60A5FA' }

interface Worker {
  id: string; kycStatus: string; city: string | null; totalShifts: number; totalEarnings: number
  skills: string[]; aadhaarNumber: string | null; aadhaarVerified: boolean; videoVerified: boolean
  hourlyRate: number; rating: number; captainReferralId: string | null
  user: { id: string; name: string; phone: string; isActive: boolean; createdAt: string }
  bookings: { id: string; status: string; totalAmount: number; createdAt: string; shift: { title: string; startTime: string }; employer: { name: string } }[]
}

export default function WorkerDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [worker,    setWorker]    = useState<Worker | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [toggling,  setToggling]  = useState(false)
  const [kycAction, setKycAction] = useState(false)

  useEffect(() => {
    fetch(`/api/ops/workers/${id}`).then(r => { if (r.status === 401) { router.replace('/ops/login'); return null } return r.json() })
      .then(d => { if (d?.worker) setWorker(d.worker) }).finally(() => setLoading(false))
  }, [id, router])

  async function toggleSuspend() {
    if (!worker) return
    setToggling(true)
    await fetch(`/api/ops/workers/${id}/suspend`, { method: 'PATCH' })
    setWorker(prev => prev ? { ...prev, user: { ...prev.user, isActive: !prev.user.isActive } } : prev)
    setToggling(false)
  }

  async function setKyc(status: string) {
    setKycAction(true)
    await fetch(`/api/ops/workers/${id}/kyc`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setWorker(prev => prev ? { ...prev, kycStatus: status } : prev)
    setKycAction(false)
  }

  if (loading) return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <div style={{ color: T2, textAlign: 'center', paddingTop: 60 }}>Loading…</div>
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )

  if (!worker) return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0 }} className="ops-content">
        <p style={{ color: T2, textAlign: 'center', paddingTop: 60 }}>Worker not found</p>
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: '100vh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom,0px))' }}>
      <OpsNav />
      <div style={{ padding: '20px', marginLeft: 0, maxWidth: 700 }} className="ops-content">

        {/* Back */}
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: T1, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16, paddingTop: 'env(safe-area-inset-top,0px)' }}>← Back</button>

        {/* Header */}
        <div style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 16, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ color: T1, fontWeight: 800, fontSize: 20, margin: 0 }}>{worker.user.name}</p>
              <p style={{ color: T2, fontSize: 14, margin: '4px 0 0' }}>{worker.user.phone} · {worker.city || '—'}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${KYC_COLOR[worker.kycStatus] || T2}20`, color: KYC_COLOR[worker.kycStatus] || T2 }}>{worker.kycStatus}</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Shifts', value: worker.totalShifts },
              { label: 'Earnings', value: `₹${worker.totalEarnings.toLocaleString('en-IN')}` },
              { label: 'Rating', value: worker.rating > 0 ? `${worker.rating.toFixed(1)} ★` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#1A1A1A', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ color: T2, fontSize: 11, margin: '0 0 2px' }}>{label}</p>
                <p style={{ color: T1, fontWeight: 700, fontSize: 16, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          {worker.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {worker.skills.map(s => (
                <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: T2, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          )}

          {/* KYC verification badges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: worker.aadhaarVerified ? '#34D39920' : '#F8717120', color: worker.aadhaarVerified ? '#34D399' : '#F87171' }}>
              Aadhaar {worker.aadhaarVerified ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: worker.videoVerified ? '#34D39920' : '#F8717120', color: worker.videoVerified ? '#34D399' : '#F87171' }}>
              Video {worker.videoVerified ? '✓' : '✗'}
            </span>
            {worker.captainReferralId && (
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: '#2563EB20', color: '#2563EB' }}>Captain Referred</span>
            )}
          </div>

          {/* KYC actions */}
          {worker.kycStatus === 'PENDING' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setKyc('APPROVED')} disabled={kycAction} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#34D399', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve KYC</button>
              <button onClick={() => setKyc('REJECTED')} disabled={kycAction} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${BD}`, background: 'transparent', color: '#F87171', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject KYC</button>
            </div>
          )}

          {/* Suspend toggle */}
          <button onClick={toggleSuspend} disabled={toggling} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${worker.user.isActive ? '#F87171' : '#34D399'}`, background: 'transparent', color: worker.user.isActive ? '#F87171' : '#34D399', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {toggling ? '…' : worker.user.isActive ? 'Suspend Worker' : 'Unsuspend Worker'}
          </button>
        </div>

        {/* Booking history */}
        <p style={{ color: T1, fontWeight: 700, fontSize: 16, margin: '0 0 12px' }}>Booking History</p>
        {worker.bookings.length === 0
          ? <p style={{ color: T2, fontSize: 14, textAlign: 'center', paddingTop: 20 }}>No bookings yet</p>
          : worker.bookings.map(b => (
            <div key={b.id} style={{ background: S1, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: T1, fontWeight: 600, fontSize: 14, margin: 0 }}>{b.shift.title}</p>
                  <p style={{ color: T2, fontSize: 12, margin: '2px 0 0' }}>{b.employer.name} · {new Date(b.shift.startTime).toLocaleDateString('en-IN')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${STATUS_COLOR[b.status] || T2}20`, color: STATUS_COLOR[b.status] || T2 }}>{b.status}</span>
                  <p style={{ color: T1, fontWeight: 700, fontSize: 13, margin: '4px 0 0' }}>₹{b.totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      <style>{`@media (min-width: 768px) { .ops-content { margin-left: 220px !important; } }`}</style>
    </div>
  )
}
