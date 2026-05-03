'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CaptainBottomNav from '@/components/captain/CaptainBottomNav'

const T1   = '#111111'
const T2   = 'rgba(0,0,0,0.5)'
const BLUE = '#111111'
const GOLD = '#111111'
const FONT = '"DM Sans", system-ui, sans-serif'

interface Leader { rank: number; name: string; territory: string | null; totalEarnings: number; earnedThisMonth: number; isMe: boolean }

export default function LeaderboardPage() {
  const router = useRouter()
  const [list,    setList]    = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/captain/leaderboard').then(r => {
      if (r.status === 401) { router.replace('/captain/login'); return null }
      return r.json()
    }).then(d => { if (d) setList(d.leaderboard || []) }).finally(() => setLoading(false))
  }, [router])

  const medal = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  return (
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', paddingTop: 'calc(64px + env(safe-area-inset-top,0px))', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
      <TopBar title="Leaderboard" />
      <div style={{ padding: '8px 0 0' }}>
        <p style={{ fontSize: 13, color: T2, textAlign: 'center', marginBottom: 16 }}>This month's top captains</p>
        {loading ? (
          <div style={{ color: T2, textAlign: 'center', paddingTop: 40 }}>Loading…</div>
        ) : list.map(c => (
          <div key={c.rank} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: c.isMe ? '#EFF6FF' : '#FFFFFF', borderLeft: c.isMe ? `3px solid ${BLUE}` : '3px solid transparent', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: c.rank <= 3 ? 26 : 15, fontWeight: 800, color: GOLD, width: 32, textAlign: 'center', flexShrink: 0 }}>{medal(c.rank)}</span>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: c.isMe ? BLUE : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.isMe ? '#fff' : T1, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
              {c.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: T1, margin: 0, fontSize: 15 }}>{c.name} {c.isMe ? '(You)' : ''}</p>
              <p style={{ color: T2, fontSize: 12, margin: '2px 0 0' }}>{c.territory || 'All India'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 800, color: T1, fontSize: 16, margin: 0 }}>₹{c.earnedThisMonth}</p>
              <p style={{ color: T2, fontSize: 11, margin: 0 }}>this month</p>
            </div>
          </div>
        ))}
      </div>
      <CaptainBottomNav />
    </div>
  )
}
