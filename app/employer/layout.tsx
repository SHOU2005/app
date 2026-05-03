export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: '"DM Sans", -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 16,
      lineHeight: '24px',
      letterSpacing: 'normal',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
      background: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
    } as React.CSSProperties}>
      {children}
    </div>
  )
}
