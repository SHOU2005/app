'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'contacts_synced'

export default function ContactsSync() {
  const [visible, setVisible]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done,    setDone]      = useState(false)
  const [count,   setCount]     = useState(0)
  const [error,   setError]     = useState('')

  useEffect(() => {
    // Only show if Contacts API available and not yet synced
    const supported = 'contacts' in navigator && 'ContactsManager' in (window as any)
    if (!supported) return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    // Small delay so it doesn't fight with the PWA install prompt
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  async function syncContacts() {
    setLoading(true)
    setError('')
    try {
      const contacts: any[] = await (navigator as any).contacts.select(
        ['name', 'tel'],
        { multiple: true }
      )
      if (!contacts.length) {
        setVisible(false)
        sessionStorage.setItem(STORAGE_KEY, '1')
        return
      }

      const normalised = contacts.map((c: any) => ({
        name: Array.isArray(c.name) ? c.name[0] || '' : c.name || '',
        tel:  Array.isArray(c.tel)  ? c.tel           : [c.tel].filter(Boolean),
      }))

      const res = await fetch('/api/user/contacts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contacts: normalised }),
      })

      if (!res.ok) throw new Error()
      const { saved } = await res.json()
      setCount(saved)
      setDone(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
      setTimeout(() => setVisible(false), 2500)
    } catch {
      setError('Could not sync contacts. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom))',
      left: 16, right: 16, zIndex: 9000,
      background: '#1C1C1E',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '16px 18px',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'csyncIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <style>{`
        @keyframes csyncIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26 }}>✅</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#FFFFFF', fontSize: 15 }}>
              {count} contacts saved!
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
              We'll never share your contacts with anyone.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>📋</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#FFFFFF', fontSize: 15 }}>
                Sync your contacts
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.4 }}>
                Help us connect you with jobs near your network. Contacts are stored securely and never shared.
              </p>
            </div>
          </div>

          {error && (
            <p style={{ margin: '0 0 10px', color: '#FF3B30', fontSize: 12 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={syncContacts}
              disabled={loading}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                border: 'none',
                background: loading ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
                color: '#111111', fontSize: 14, fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Syncing...' : 'Sync Contacts'}
            </button>
            <button
              onClick={dismiss}
              style={{
                flex: 0.7, height: 44, borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  )
}
