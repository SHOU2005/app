'use client'
import { useEffect, useState } from 'react'
import TopBar from '@/components/shared/TopBar'
import StatusBadge from '@/components/ui/StatusBadge'
import Avatar from '@/components/ui/Avatar'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminBookingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => setBookings(d.bookings ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <TopBar title="All Bookings" />
      <div className="px-4 py-4 space-y-3">
        {loading
          ? [...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
          : bookings.length === 0
            ? <div className="card p-10 text-center mt-4"><div className="text-5xl mb-2">📋</div><p className="text-surface-500">No bookings</p></div>
            : bookings.map(b => (
              <div key={b.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={b.worker?.user?.name ?? 'W'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 text-sm truncate">{b.shift?.title}</p>
                    <p className="text-xs text-surface-500">{b.worker?.user?.name} · {formatDate(b.createdAt)}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex justify-between text-xs text-surface-500 pt-2 border-t border-surface-100">
                  <span>Platform fee</span>
                  <span className="font-bold text-brand-600">{formatCurrency(b.platformFee)}</span>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}
