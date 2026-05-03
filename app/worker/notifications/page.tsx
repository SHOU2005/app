'use client'
import { useState } from 'react'
import { Bell, Zap, CheckCircle, IndianRupee, MapPin, BellOff } from 'lucide-react'
import TopBar    from '@/components/shared/TopBar'
import BottomNav from '@/components/shared/BottomNav'

const INITIAL_NOTIFS = [
  { id:1, icon:Zap,          color:'#DC2626', bg:'rgba(220,38,38,0.08)',       title:'Urgent Job Nearby!',      body:'Security Guard at Phoenix Mall — 2.1 km away', time:'2 min ago',  unread:true  },
  { id:2, icon:CheckCircle,  color:'#111111', bg:'rgba(0,0,0,0.07)',           title:'Shift Confirmed',          body:'Shop Helper at D-Mart — Today 9 AM – 5 PM',   time:'1 hr ago',   unread:true  },
  { id:3, icon:IndianRupee,  color:'#111111', bg:'rgba(0,0,0,0.07)',           title:'Payment Received!',        body:'₹1,032 paid for Flipkart Driver shift',        time:'Yesterday',  unread:false },
  { id:4, icon:MapPin,       color:'#111111', bg:'rgba(0,0,0,0.07)',           title:'New Jobs in Your Area',   body:'5 new jobs available near Andheri West',       time:'2 days ago', unread:false },
  { id:5, icon:CheckCircle,  color:'#111111', bg:'rgba(0,0,0,0.07)',           title:'Shift Completed',          body:'Great work! ₹792 will be paid tomorrow',       time:'3 days ago', unread:false },
  { id:6, icon:IndianRupee,  color:'#111111', bg:'rgba(0,0,0,0.07)',           title:'Payment Received!',        body:'₹1,308 paid for Phoenix Mall Security shift',  time:'4 days ago', unread:false },
]

export default function NotificationsPage() {
  const [unreadIds, setUnreadIds] = useState<Set<number>>(
    new Set(INITIAL_NOTIFS.filter(n => n.unread).map(n => n.id))
  )

  function markRead(id: number) {
    setUnreadIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function markAllRead() { setUnreadIds(new Set()) }

  const unreadCount = unreadIds.size

  return (
    <>
      <TopBar title="Notifications" unread={0} />

      <div className="page">

        {unreadCount > 0 && (
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <p style={{ fontSize:14, color:'rgba(0,0,0,0.4)' }}>
              <span style={{ fontWeight:700, color:'#111111' }}>{unreadCount}</span> unread
            </p>
            <button onClick={markAllRead}
              style={{ fontSize:14, fontWeight:700, color:'rgba(0,0,0,0.5)' }}>
              Mark all read
            </button>
          </div>
        )}

        <div className={`px-4 ${unreadCount > 0 ? 'pt-0' : 'pt-2'} pb-4 space-y-2.5`}>
          {INITIAL_NOTIFS.map(n => {
            const Icon    = n.icon
            const isUnread = unreadIds.has(n.id)
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className="w-full text-left overflow-hidden"
                style={{
                  background: '#F5F5F5',
                  border: `1px solid ${isUnread ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.07)'}`,
                  borderLeft: isUnread ? '3px solid #111111' : '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 20,
                  padding: 16,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  boxShadow: isUnread ? '0 4px 16px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:n.bg }}>
                  <Icon style={{ width:18, height:18, color:n.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p style={{ fontSize:15, fontWeight:isUnread?800:600, color:'#111111' }}>{n.title}</p>
                    <p style={{ fontSize:13, color:'rgba(0,0,0,0.35)', flexShrink:0 }}>{n.time}</p>
                  </div>
                  <p style={{ fontSize:14, color:'rgba(0,0,0,0.48)', marginTop:3, lineHeight:1.4 }}>{n.body}</p>
                </div>
                {isUnread && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background:'#111111' }} />
                )}
              </button>
            )
          })}

          {unreadCount === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background:'#F0F0F0', border:'1px solid rgba(0,0,0,0.09)' }}>
                <BellOff style={{ width:24, height:24, color:'rgba(0,0,0,0.3)' }} />
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:'rgba(0,0,0,0.38)' }}>All caught up!</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="/worker/notifications" />
    </>
  )
}
