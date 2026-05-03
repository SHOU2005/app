'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin, Clock, X } from 'lucide-react'
import TopBar         from '@/components/shared/TopBar'
import BottomNav      from '@/components/shared/BottomNav'
import JobDetailSheet from '@/components/worker/JobDetailSheet'
import ShiftConfirmed from '@/components/worker/ShiftConfirmed'
import JobIcon        from '@/components/worker/JobIcon'
import { useLang }    from '@/lib/lang'

type Job = {
  id:number; emoji:string; title:string; company:string
  pay:number; hours:number; totalPay:number
  distance:string; time:string; day:string
  urgent:boolean; rating:number; slots:number; tag:string
  address:string
}

const ALL_JOBS: Job[] = [
  { id:1,  emoji:'🏪', title:'Shop Helper',       company:'D-Mart',         pay:99,  hours:8,  totalPay:792,  distance:'1.2 km', time:'9 AM – 5 PM',  day:'Today',    urgent:true,  rating:4.8, slots:3,  tag:'Popular',  address:'D-Mart, Infinity Mall, Link Road, Andheri West, Mumbai'           },
  { id:2,  emoji:'🚴', title:'Delivery Rider',    company:'BigBasket',      pay:109, hours:6,  totalPay:654,  distance:'0.8 km', time:'10 AM – 4 PM', day:'Today',    urgent:false, rating:4.6, slots:5,  tag:'',         address:'BigBasket Warehouse, MIDC, Andheri East, Mumbai'                 },
  { id:3,  emoji:'🏭', title:'Warehouse Staff',   company:'Amazon',         pay:119, hours:8,  totalPay:952,  distance:'3.5 km', time:'8 AM – 4 PM',  day:'Tomorrow', urgent:false, rating:4.9, slots:10, tag:'High Pay', address:'Amazon Fulfillment Centre, Bhiwandi, Thane'                       },
  { id:4,  emoji:'🔒', title:'Security Guard',    company:'Phoenix Mall',   pay:109, hours:12, totalPay:1308, distance:'2.1 km', time:'7 PM – 7 AM',  day:'Today',    urgent:true,  rating:4.5, slots:2,  tag:'Urgent',   address:'Phoenix Palladium, Senapati Bapat Marg, Lower Parel, Mumbai'     },
  { id:5,  emoji:'🍳', title:'Kitchen Helper',    company:'Hotel Taj',      pay:99,  hours:8,  totalPay:792,  distance:'4.2 km', time:'10 AM – 6 PM', day:'Tomorrow', urgent:false, rating:4.7, slots:4,  tag:'',         address:'Taj Mahal Palace, Apollo Bunder, Colaba, Mumbai'                  },
  { id:6,  emoji:'🚗', title:'Driver',            company:'Flipkart',       pay:129, hours:8,  totalPay:1032, distance:'2.8 km', time:'8 AM – 4 PM',  day:'Today',    urgent:false, rating:4.9, slots:2,  tag:'High Pay', address:'Flipkart Hub, LBS Marg, Kurla West, Mumbai'                       },
  { id:7,  emoji:'💼', title:'Office Assistant',  company:'HDFC Bank',      pay:109, hours:8,  totalPay:872,  distance:'1.9 km', time:'9 AM – 5 PM',  day:'Tomorrow', urgent:false, rating:4.6, slots:6,  tag:'',         address:'HDFC Bank House, Bandra Kurla Complex, BKC, Mumbai'               },
  { id:8,  emoji:'🧹', title:'Cleaning Staff',    company:'Taj Hotel',      pay:99,  hours:4,  totalPay:396,  distance:'0.5 km', time:'6 AM – 10 AM', day:'Today',    urgent:true,  rating:4.3, slots:1,  tag:'Urgent',   address:'Vivanta by Taj, Cuffe Parade, Colaba, Mumbai'                     },
  { id:9,  emoji:'🏗️',title:'Construction Help', company:'L&T',            pay:119, hours:8,  totalPay:952,  distance:'5.1 km', time:'7 AM – 3 PM',  day:'Tomorrow', urgent:false, rating:4.4, slots:8,  tag:'',         address:'L&T Construction Site, Powai, Mumbai'                             },
  { id:10, emoji:'📦', title:'Packing Staff',     company:'Meesho',         pay:99,  hours:6,  totalPay:594,  distance:'2.3 km', time:'9 AM – 3 PM',  day:'Today',    urgent:false, rating:4.5, slots:7,  tag:'Popular',  address:'Meesho Warehouse, Sakinaka, Andheri East, Mumbai'                 },
  { id:11, emoji:'🛒', title:'Cashier',           company:'Reliance Fresh', pay:109, hours:8,  totalPay:872,  distance:'1.6 km', time:'9 AM – 5 PM',  day:'Tomorrow', urgent:false, rating:4.7, slots:3,  tag:'',         address:'Reliance Fresh, Versova Road, Andheri West, Mumbai'               },
  { id:12, emoji:'🚛', title:'Loading Helper',    company:'DTDC',           pay:119, hours:6,  totalPay:714,  distance:'3.8 km', time:'6 AM – 12 PM', day:'Today',    urgent:true,  rating:4.2, slots:4,  tag:'Urgent',   address:'DTDC Courier Hub, Saki Naka, Mumbai'                               },
]

export default function BrowsePage() {
  const [search,       setSearch]       = useState('')
  const [selectedJob,  setSelectedJob]  = useState<Job|null>(null)
  const [confirmedJob, setConfirmedJob] = useState<Job|null>(null)
  const { t } = useLang()
  const router = useRouter()

  const jobs = ALL_JOBS.filter(j => {
    const q = search.toLowerCase()
    return !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
  })

  return (
    <>
      <TopBar title={t.browse} unread={2} />
      <JobDetailSheet job={selectedJob} onClose={()=>setSelectedJob(null)}
        onAccepted={job=>{ setSelectedJob(null); setConfirmedJob(job as Job) }} />
      <ShiftConfirmed job={confirmedJob} onDone={() => {
        if (confirmedJob) localStorage.setItem('sw_booked_job', JSON.stringify(confirmedJob))
        setConfirmedJob(null)
        router.push('/')
      }} />

      <div className="page">
        {/* Search */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center gap-3 px-4" style={{
            background: '#F5F5F5', border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 16, height: 52,
          }}>
            <Search style={{ width:19, height:19, color:'rgba(0,0,0,0.35)', flexShrink:0 }} />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={t.search_placeholder as string}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize:15, color:'#111111' }} />
            {search && (
              <button onClick={()=>setSearch('')}>
                <X style={{ width:16, height:16, color:'rgba(0,0,0,0.4)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-3">
          <p style={{ fontSize:16, fontWeight:800, color:'#111111' }}>
            {search ? t.results as string : t.all_jobs as string}
            <span style={{ fontSize:14, fontWeight:400, color:'rgba(0,0,0,0.35)', marginLeft:6 }}>({jobs.length})</span>
          </p>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
            background:'#F0F0F0', color:'rgba(0,0,0,0.6)',
            border:'1px solid rgba(0,0,0,0.09)', fontSize:14, fontWeight:600,
          }}>
            <SlidersHorizontal style={{ width:13, height:13 }} /> Filter
          </button>
        </div>

        {/* List */}
        <div className="px-4 space-y-2.5">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p style={{ fontSize:40, marginBottom:12 }}>🔍</p>
              <p style={{ fontSize:17, fontWeight:800, color:'#111111', marginBottom:6 }}>{t.no_jobs_found as string}</p>
              <p style={{ fontSize:14, color:'rgba(0,0,0,0.35)' }}>{t.no_jobs_sub as string}</p>
            </div>
          ) : jobs.map((job, i) => (
            <button key={job.id} onClick={()=>setSelectedJob(job)}
              className="w-full text-left overflow-hidden animate-fade-up"
              style={{
                background: '#F5F5F5', border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                animationDelay:`${i*0.03}s`,
              }}>
              <div className="p-4 flex gap-3 items-center">
                <JobIcon emoji={job.emoji} size={50} radius={14} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize:16, fontWeight:800, color:'#111111' }}>{job.title}</p>
                  <p style={{ fontSize:14, color:'rgba(0,0,0,0.45)', marginTop:2 }}>{job.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span style={{ fontSize:16, fontWeight:800, color:'#111111' }}>₹{job.totalPay.toLocaleString('en-IN')}</span>
                    <span className="flex items-center gap-0.5" style={{ fontSize:13, color:'rgba(0,0,0,0.35)' }}>
                      <Clock style={{ width:12, height:12 }} /> {job.hours}h
                    </span>
                    <span className="flex items-center gap-0.5" style={{ fontSize:13, color:'rgba(0,0,0,0.35)' }}>
                      <MapPin style={{ width:12, height:12 }} /> {job.distance}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontSize:14, fontWeight:600, color:'rgba(0,0,0,0.6)' }}>{job.day}</p>
                  {job.urgent && <p style={{ fontSize:12, fontWeight:700, color:'#DC2626', marginTop:2 }}>⚡ Urgent</p>}
                  {job.tag && !job.urgent && (
                    <p style={{ fontSize:12, fontWeight:700, color:'rgba(0,0,0,0.45)', marginTop:2 }}>{job.tag}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {!selectedJob && <BottomNav active="/worker/jobs" />}
    </>
  )
}
