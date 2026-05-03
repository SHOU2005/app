'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, IndianRupee, ChevronRight, Wallet, CheckCircle, X, Clock, ArrowRight } from 'lucide-react'
import TopBar    from '@/components/shared/TopBar'
import BottomNav from '@/components/shared/BottomNav'
import JobIcon   from '@/components/worker/JobIcon'

const HISTORY = [
  { id:1, emoji:'🏪', title:'Shop Helper',     company:'D-Mart',       pay:792,  date:'Today',     hours:8,  status:'processing' },
  { id:2, emoji:'🚗', title:'Driver',          company:'Flipkart',     pay:1032, date:'Yesterday', hours:8,  status:'paid'       },
  { id:3, emoji:'🔒', title:'Security Guard',  company:'Phoenix Mall', pay:1308, date:'Mon',       hours:12, status:'paid'       },
  { id:4, emoji:'🍳', title:'Kitchen Helper',  company:'Hotel Taj',    pay:792,  date:'Sun',       hours:8,  status:'paid'       },
  { id:5, emoji:'🧹', title:'Cleaning Staff',  company:'Taj Hotel',    pay:396,  date:'Sat',       hours:4,  status:'paid'       },
  { id:6, emoji:'🏭', title:'Warehouse Staff', company:'Amazon',       pay:952,  date:'Fri',       hours:8,  status:'paid'       },
]
const WEEK_DATA = [
  { day:'Mon', amt:952  },
  { day:'Tue', amt:0    },
  { day:'Wed', amt:792  },
  { day:'Thu', amt:1308 },
  { day:'Fri', amt:396  },
  { day:'Sat', amt:1032 },
  { day:'Sun', amt:792  },
]
const WITHDRAWALS = [
  { id:1, amount:2340, upi:'raju@phonepe', date:'Yesterday', status:'success' },
  { id:2, amount:1308, upi:'raju@phonepe', date:'Mon',       status:'success' },
  { id:3, amount:792,  upi:'raju@phonepe', date:'Sat',       status:'pending' },
]

const BAR_MAX_H = 68

/* ── Withdraw Sheet ── */
function WithdrawSheet({ balance, upi, onClose }: { balance:number; upi:string; onClose:()=>void }) {
  const [visible,   setVisible]   = useState(false)
  const [stage,     setStage]     = useState<'form'|'processing'|'done'>('form')
  const [showHist,  setShowHist]  = useState(false)

  useEffect(()=>{ requestAnimationFrame(()=>setVisible(true)) },[])

  function close(){ setVisible(false); setTimeout(onClose, 320) }

  async function confirm() {
    setStage('processing')
    await new Promise(r=>setTimeout(r,1800))
    setStage('done')
  }

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background:'rgba(0,0,0,0.4)',opacity:visible?1:0,transition:'opacity 0.3s' }} onClick={close}/>
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{
        background:'#FFFFFF', borderRadius:'24px 24px 0 0', paddingBottom:'var(--safe-b)',
        transform:visible?'translateY(0)':'translateY(100%)',
        transition:'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.08)',
      }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(0,0,0,0.15)' }}/>
        </div>
        {stage!=='processing'&&(
          <button onClick={close} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background:'rgba(0,0,0,0.07)' }}>
            <X style={{ width:14,height:14,color:'rgba(0,0,0,0.5)' }}/>
          </button>
        )}

        <div className="overflow-y-auto flex-1 px-5 pb-6">

          {stage==='form'&&(
            <>
              <p style={{ fontSize:20, fontWeight:900, color:'#111111', marginTop:10, marginBottom:4 }}>Withdraw to UPI</p>
              <p style={{ fontSize:14, color:'rgba(0,0,0,0.4)', marginBottom:20 }}>Funds arrive in 2–4 hours</p>

              <div style={{ padding:'16px', borderRadius:18, marginBottom:16,
                background:'#111111', boxShadow:'0 6px 24px rgba(0,0,0,0.2)' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.08em', marginBottom:6 }}>
                  AVAILABLE BALANCE
                </p>
                <p style={{ fontSize:36, fontWeight:900, color:'#FFFFFF', lineHeight:1 }}>
                  ₹{balance.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:6 }}>Ready for instant withdrawal</p>
              </div>

              <div style={{ padding:'14px 16px', borderRadius:16, marginBottom:20,
                background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.09)', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:'rgba(0,0,0,0.06)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:20 }}>💸</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:3 }}>WITHDRAWING TO</p>
                  <p style={{ fontSize:15, fontWeight:700, color:'#111111' }}>{upi}</p>
                </div>
                <CheckCircle style={{ width:18, height:18, color:'#111111', flexShrink:0 }}/>
              </div>

              <button onClick={confirm}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:16, fontWeight:800,
                  background:'#111111', color:'#FFFFFF', border:'none', cursor:'pointer',
                  boxShadow:'0 6px 24px rgba(0,0,0,0.15)', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8, marginBottom:16 }}>
                <Wallet style={{ width:18,height:18 }}/> Withdraw ₹{balance.toLocaleString('en-IN')}
              </button>

              <button onClick={()=>setShowHist(h=>!h)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 0', background:'none', border:'none', cursor:'pointer', borderTop:'1px solid rgba(0,0,0,0.08)' }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#111111' }}>Withdrawal History</p>
                <ChevronRight style={{ width:16,height:16,color:'rgba(0,0,0,0.35)',
                  transform:showHist?'rotate(90deg)':'none', transition:'transform 0.2s' }}/>
              </button>

              {showHist&&(
                <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(0,0,0,0.09)' }}>
                  {WITHDRAWALS.map((w,i)=>(
                    <div key={w.id}>
                      <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, background:'#F5F5F5' }}>
                        <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          background:'rgba(0,0,0,0.06)' }}>
                          {w.status==='success'
                            ? <CheckCircle style={{ width:16,height:16,color:'#111111' }}/>
                            : <Clock style={{ width:16,height:16,color:'rgba(0,0,0,0.45)' }}/>
                          }
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:14,fontWeight:700,color:'#111111' }}>{w.upi}</p>
                          <p style={{ fontSize:12,color:'rgba(0,0,0,0.38)',marginTop:2 }}>{w.date}</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ fontSize:15,fontWeight:900,color:'#111111' }}>₹{w.amount.toLocaleString('en-IN')}</p>
                          <p style={{ fontSize:12,fontWeight:600,marginTop:2,
                            color:'rgba(0,0,0,0.4)' }}>
                            {w.status==='success'?'✓ Paid':'⏳ Pending'}
                          </p>
                        </div>
                      </div>
                      {i<WITHDRAWALS.length-1&&<div style={{ height:1,background:'rgba(0,0,0,0.06)',margin:'0 14px' }}/>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {stage==='processing'&&(
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0' }}>
              <div style={{ width:72, height:72, borderRadius:'50%',
                border:'4px solid #111111', borderTopColor:'transparent',
                animation:'spin 0.9s linear infinite', marginBottom:20 }}/>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ fontSize:18,fontWeight:800,color:'#111111',marginBottom:6 }}>Processing…</p>
              <p style={{ fontSize:14,color:'rgba(0,0,0,0.4)' }}>Sending ₹{balance.toLocaleString('en-IN')} to {upi}</p>
            </div>
          )}

          {stage==='done'&&(
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 0' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',background:'#111111',
                display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,
                boxShadow:'0 12px 40px rgba(0,0,0,0.2)',animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                <CheckCircle style={{ width:36,height:36,color:'#fff' }}/>
              </div>
              <p style={{ fontSize:22,fontWeight:900,color:'#111111',marginBottom:6 }}>
                ₹{balance.toLocaleString('en-IN')} Initiated!
              </p>
              <p style={{ fontSize:14,color:'rgba(0,0,0,0.45)',textAlign:'center',marginBottom:8 }}>
                Withdrawal sent to <strong style={{ color:'#111111' }}>{upi}</strong>
              </p>
              <div style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:20,
                background:'rgba(0,0,0,0.05)',border:'1px solid rgba(0,0,0,0.09)',marginBottom:28 }}>
                <Clock style={{ width:13,height:13,color:'rgba(0,0,0,0.45)' }}/>
                <p style={{ fontSize:13,fontWeight:600,color:'rgba(0,0,0,0.5)' }}>Arrives in 2–4 hours</p>
              </div>
              <button onClick={close}
                style={{ width:'100%',height:52,borderRadius:16,fontSize:16,fontWeight:800,
                  background:'#111111',color:'#FFFFFF',border:'none',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                Done <ArrowRight style={{ width:18,height:18 }}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Main Page ── */
export default function EarningsPage() {
  const [period,       setPeriod]      = useState<'week'|'month'>('month')
  const [showWithdraw, setShowWithdraw]= useState(false)

  const totalPaid       = HISTORY.filter(h=>h.status==='paid').reduce((s,h)=>s+h.pay,0)
  const totalProcessing = HISTORY.filter(h=>h.status==='processing').reduce((s,h)=>s+h.pay,0)
  const totalHours      = HISTORY.reduce((s,h)=>s+h.hours,0)
  const maxAmt          = Math.max(...WEEK_DATA.map(d=>d.amt))
  const weekTotal       = WEEK_DATA.reduce((s,d)=>s+d.amt,0)
  const avgDaily        = Math.round(weekTotal/WEEK_DATA.filter(d=>d.amt>0).length)

  return (
    <>
      <TopBar title="Earnings" unread={2}/>
      {showWithdraw&&<WithdrawSheet balance={totalPaid} upi="raju@phonepe" onClose={()=>setShowWithdraw(false)}/>}

      <div style={{ minHeight:'100vh', paddingTop:'calc(56px + var(--safe-t))', paddingBottom:'calc(80px + var(--safe-b))', background:'#FFFFFF' }}>

        {/* ── Total card ── */}
        <div style={{ padding:'16px 16px 4px' }}>
          <div style={{ borderRadius:24, overflow:'hidden',
            background:'#111111',
            boxShadow:'0 12px 48px rgba(0,0,0,0.2)' }}>

            <div style={{ height:3, background:'linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0.3),rgba(255,255,255,0.1))' }}/>

            <div style={{ padding:'20px 20px 16px' }}>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {(['week','month'] as const).map(p=>(
                  <button key={p} onClick={()=>setPeriod(p)}
                    style={{ padding:'5px 16px', borderRadius:20, fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
                      background:period===p?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.08)',
                      color:period===p?'#fff':'rgba(255,255,255,0.45)', transition:'all 0.15s' }}>
                    {p==='week'?'This Week':'This Month'}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:44, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:-1 }}>
                    ₹{(totalPaid+totalProcessing).toLocaleString('en-IN')}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                    <TrendingUp style={{ width:13,height:13,color:'#86EFAC' }}/>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,0.55)' }}>+12% from last month</p>
                  </div>
                </div>
                <div style={{ width:52,height:52,borderRadius:16,background:'rgba(255,255,255,0.15)',
                  border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <IndianRupee style={{ width:24,height:24,color:'#fff',strokeWidth:1.8 }}/>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { label:'In Bank',   value:`₹${totalPaid.toLocaleString('en-IN')}`,       sub:'Settled' },
                  { label:'On the Way',value:`₹${totalProcessing.toLocaleString('en-IN')}`, sub:'Processing' },
                  { label:'Hours',     value:`${totalHours}h`,                               sub:`${HISTORY.length} shifts` },
                ].map(s=>(
                  <div key={s.label} style={{ padding:'10px 10px', borderRadius:14, background:'rgba(0,0,0,0.25)' }}>
                    <p style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.5)',marginBottom:4 }}>{s.label}</p>
                    <p style={{ fontSize:16,fontWeight:900,color:'#fff',lineHeight:1 }}>{s.value}</p>
                    <p style={{ fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:3 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <button onClick={()=>setShowWithdraw(true)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'12px 0', borderRadius:16, cursor:'pointer',
                  background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)',
                  fontSize:15, fontWeight:700, color:'#fff' }}>
                <Wallet style={{ width:17,height:17 }}/>
                Withdraw ₹{totalPaid.toLocaleString('en-IN')} to UPI
              </button>
            </div>
          </div>
        </div>

        {/* ── Weekly chart ── */}
        <div style={{ padding:'16px 16px 4px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontSize:17,fontWeight:800,color:'#111111' }}>This Week</p>
            <p style={{ fontSize:14,fontWeight:700,color:'rgba(0,0,0,0.45)' }}>Avg ₹{avgDaily.toLocaleString('en-IN')}/day</p>
          </div>
          <div style={{ borderRadius:20, padding:'16px',
            background:'#F5F5F5', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', gap:6, alignItems:'flex-end', height: BAR_MAX_H + 32 }}>
              {WEEK_DATA.map(d=>{
                const pct = maxAmt>0?d.amt/maxAmt:0
                const barH = pct>0?Math.max(Math.round(pct*BAR_MAX_H),10):4
                return (
                  <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <p style={{ fontSize:11,color:'rgba(0,0,0,0.38)',height:16,lineHeight:'16px',textAlign:'center',marginBottom:3 }}>
                      {d.amt>0?(d.amt>=1000?`₹${(d.amt/1000).toFixed(1)}k`:`₹${d.amt}`):''}
                    </p>
                    <div style={{ width:'100%',height:barH,borderRadius:'6px 6px 0 0',
                      background:pct>0?'#111111':'rgba(0,0,0,0.07)',
                      transition:'height 0.3s ease' }}/>
                  </div>
                )
              })}
            </div>
            <div style={{ height:1,background:'rgba(0,0,0,0.07)',margin:'0 0 8px' }}/>
            <div style={{ display:'flex', gap:6 }}>
              {WEEK_DATA.map(d=>(
                <div key={d.day} style={{ flex:1,textAlign:'center' }}>
                  <p style={{ fontSize:12,fontWeight:700,color:'rgba(0,0,0,0.38)' }}>{d.day}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Payment history ── */}
        <div style={{ padding:'16px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontSize:17,fontWeight:800,color:'#111111' }}>Payment History</p>
            <button style={{ display:'flex',alignItems:'center',gap:3,fontSize:13,fontWeight:600,
              color:'rgba(0,0,0,0.45)',background:'none',border:'none',cursor:'pointer' }}>
              See all <ChevronRight style={{ width:13,height:13 }}/>
            </button>
          </div>
          <div style={{ borderRadius:20,overflow:'hidden',background:'#F5F5F5',border:'1px solid rgba(0,0,0,0.08)',boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            {HISTORY.map((h,i)=>(
              <div key={h.id}>
                <div style={{ padding:'14px 16px',display:'flex',alignItems:'center',gap:12 }}>
                  <JobIcon emoji={h.emoji} size={42} radius={12}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:15,fontWeight:700,color:'#111111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.title}</p>
                    <p style={{ fontSize:13,color:'rgba(0,0,0,0.38)',marginTop:2 }}>{h.company} · {h.date} · {h.hours}h</p>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <p style={{ fontSize:16,fontWeight:900,color:'#111111' }}>+₹{h.pay.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize:12,fontWeight:600,marginTop:2,color:'rgba(0,0,0,0.38)' }}>
                      {h.status==='paid'?'✓ Paid':'⏳ Processing'}
                    </p>
                  </div>
                </div>
                {i<HISTORY.length-1&&<div style={{ height:1,background:'rgba(0,0,0,0.06)',margin:'0 16px' }}/>}
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav active="/worker/earnings"/>
    </>
  )
}
