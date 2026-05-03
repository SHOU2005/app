'use client'
import { AlertCircle, CheckCircle } from 'lucide-react'
import TopBar from '@/components/shared/TopBar'

const MOCK_COMPLAINTS = [
  { id: '1', type: 'No Show',    description: 'Worker did not show up for the shift', status: 'OPEN',     reportedBy: 'Ravi Sharma',   against: 'Amit Kumar',    date: '2024-01-15' },
  { id: '2', type: 'Late',       description: 'Worker was 2 hours late', status: 'OPEN',                  reportedBy: 'Priya Mehta',   against: 'Rahul Singh',   date: '2024-01-14' },
  { id: '3', type: 'Quality',    description: 'Work was not up to standard', status: 'RESOLVED',          reportedBy: 'Suresh Reddy',  against: 'Deepak Verma',  date: '2024-01-12' },
  { id: '4', type: 'Payment',    description: 'Employer did not confirm payment', status: 'OPEN',         reportedBy: 'Meena Pillai',  against: 'TechCorp Ltd',  date: '2024-01-10' },
]

export default function AdminComplaintsPage() {
  return (
    <div>
      <TopBar title="Complaints" />

      <div className="px-4 py-4 space-y-3">
        {MOCK_COMPLAINTS.map(c => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${c.status === 'OPEN' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="font-bold text-surface-900 text-sm">{c.type}</span>
                </div>
                <p className="text-xs text-surface-500 mt-0.5">{c.date}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                c.status === 'OPEN' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {c.status}
              </span>
            </div>

            <p className="text-sm text-surface-700 mb-3">{c.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <p className="text-surface-400">Reported by</p>
                <p className="font-semibold text-surface-700">{c.reportedBy}</p>
              </div>
              <div>
                <p className="text-surface-400">Against</p>
                <p className="font-semibold text-surface-700">{c.against}</p>
              </div>
            </div>

            {c.status === 'OPEN' && (
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600">
                  <AlertCircle className="w-3.5 h-3.5" /> Escalate
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-700">
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
