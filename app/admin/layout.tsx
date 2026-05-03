import BottomNav from '@/components/shared/BottomNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      {children}
      <BottomNav />
    </div>
  )
}
