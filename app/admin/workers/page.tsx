'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Phone, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import TopBar from '@/components/shared/TopBar'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PendingWorker {
  id:      string
  kycStatus: string
  skills:  string[]
  city:    string | null
  user: { name: string; phone: string; createdAt: string }
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<PendingWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/kyc')
      .then(r => r.json())
      .then(d => setWorkers(d.workers ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function decide(workerProfileId: string, status: 'APPROVED' | 'REJECTED') {
    setActing(workerProfileId)
    const res = await fetch('/api/admin/kyc', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ workerProfileId, status }),
    })
    if (!res.ok) { toast.error('Failed'); setActing(null); return }
    toast.success(status === 'APPROVED' ? '✓ Worker approved' : 'Worker rejected')
    setWorkers(prev => prev.filter(w => w.id !== workerProfileId))
    setActing(null)
  }

  return (
    <div>
      <TopBar title="Worker KYC" />

      <div className="px-4 py-4 space-y-3">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)
          : workers.length === 0
            ? (
              <div className="card p-10 text-center mt-4">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-semibold text-surface-700">All clear!</p>
                <p className="text-sm text-surface-400 mt-1">No pending KYC reviews</p>
              </div>
            )
            : workers.map(w => (
              <div key={w.id} className="card p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={w.user.name} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="font-bold text-surface-900">{w.user.name}</p>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-surface-500 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {w.user.phone}
                    </div>
                    {w.city && <p className="text-xs text-surface-400 mt-0.5">📍 {w.city}</p>}
                    {w.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {w.skills.map(s => (
                          <span key={s} className="text-[10px] bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document placeholders */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['Aadhaar Card', 'Selfie Video'].map(doc => (
                    <div key={doc} className="bg-surface-50 border border-surface-200 rounded-xl p-3 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-medium text-surface-600">{doc}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    loading={acting === w.id}
                    onClick={() => decide(w.id, 'REJECTED')}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    loading={acting === w.id}
                    onClick={() => decide(w.id, 'APPROVED')}
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}
