'use client'
import { useEffect, useState } from 'react'
import { Users, Briefcase, CheckCircle, AlertCircle, TrendingUp, IndianRupee } from 'lucide-react'
import TopBar from '@/components/shared/TopBar'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  totalUsers:       number
  totalWorkers:     number
  totalEmployers:   number
  pendingKyc:       number
  totalShifts:      number
  totalBookings:    number
  completedBookings: number
  revenue:          number
}

function StatCard({ icon: Icon, label, value, sub, color, alert }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; alert?: boolean
}) {
  return (
    <div className={`card p-4 ${alert ? 'ring-1 ring-orange-400 bg-orange-50' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-surface-900">{value}</div>
      <div className="text-xs text-surface-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-surface-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-dark text-white px-5 pt-14 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/20 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-black">S</span>
            </div>
            <span className="text-sm font-semibold text-white/60">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-black text-white">Switch Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">Real-time overview</p>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : stats && (
          <>
            {stats.pendingKyc > 0 && (
              <div className="card p-4 bg-orange-50 border-l-4 border-orange-400">
                <p className="font-bold text-orange-800 text-sm">⚠️ {stats.pendingKyc} KYC Pending</p>
                <p className="text-xs text-orange-600 mt-0.5">Workers waiting for approval</p>
                <a href="/admin/workers" className="text-xs font-semibold text-orange-700 mt-2 block">Review now →</a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users}        label="Total Users"      value={stats.totalUsers}                       color="bg-brand-100 text-brand-600" />
              <StatCard icon={Users}        label="Workers"          value={stats.totalWorkers}                     color="bg-green-100 text-green-600" />
              <StatCard icon={Briefcase}    label="Employers"        value={stats.totalEmployers}                   color="bg-blue-100 text-blue-600" />
              <StatCard icon={AlertCircle}  label="KYC Pending"      value={stats.pendingKyc}                       color="bg-orange-100 text-orange-600" alert={stats.pendingKyc > 0} />
              <StatCard icon={TrendingUp}   label="Total Shifts"     value={stats.totalShifts}                      color="bg-purple-100 text-purple-600" />
              <StatCard icon={CheckCircle}  label="Completed"        value={stats.completedBookings}                color="bg-teal-100 text-teal-600" />
              <StatCard icon={IndianRupee}  label="Platform Revenue" value={formatCurrency(stats.revenue)}          color="bg-gold-400/20 text-gold-600" />
              <StatCard icon={Briefcase}    label="Total Bookings"   value={stats.totalBookings}                    color="bg-rose-100 text-rose-600" />
            </div>

            {/* Revenue chart placeholder */}
            <div className="card p-5">
              <h3 className="font-bold text-surface-900 mb-3">Revenue Overview</h3>
              <div className="h-24 bg-gradient-brand rounded-xl flex items-end justify-around px-4 pb-3 opacity-80">
                {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
                  <div key={i} className="bg-white/40 rounded-t-lg" style={{ height: `${h}%`, width: '10%' }} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-surface-400 mt-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
