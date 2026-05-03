export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
      background: '#080808',
      minHeight: '100vh',
      color: '#FFFFFF',
      WebkitFontSmoothing: 'antialiased',
    } as React.CSSProperties}>
      {children}
    </div>
  )
}
