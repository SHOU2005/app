'use client'
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

interface EmpMapProps {
  showWorker?: boolean
  workerInitial?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function EmpMap(_props: EmpMapProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const [count,   setCount]   = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return

      let lat = 19.076, lng = 72.877
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000, maximumAge: 60000 })
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {}

      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center:           [lat, lng],
        zoom:             14,
        zoomControl:      false,
        attributionControl: false,
      })

      // Free light tiles — CartoDB Positron, no key required
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      mapRef.current = map
      setLoading(false)

      // Employer pin
      const employerIcon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
          <defs><filter id="es"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/></filter></defs>
          <circle cx="24" cy="24" r="22" fill="#FFFFFF" stroke="#111827" stroke-width="3" filter="url(#es)"/>
          <circle cx="24" cy="24" r="8" fill="#111827"/>
          <circle cx="24" cy="24" r="4" fill="#FFFFFF"/>
          <polygon points="24,46 30,36 18,36" fill="#FFFFFF" stroke="#111827" stroke-width="2.5" stroke-linejoin="round"/>
        </svg>`,
        className:  '',
        iconSize:   [48, 56],
        iconAnchor: [24, 46],
      })

      L.marker([lat, lng], { icon: employerIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('Your Location', { direction: 'top', offset: [0, -46] })

      L.circle([lat, lng], {
        radius:      400,
        color:       '#6366f1',
        weight:      1.5,
        opacity:     0.35,
        fillColor:   '#6366f1',
        fillOpacity: 0.07,
      }).addTo(map)

      // Nearby workers
      try {
        const res  = await fetch(`/api/employer/nearby-workers?lat=${lat}&lng=${lng}&radius=8`)
        const data = await res.json()
        if (cancelled) return

        const workers: Array<{
          id: string; name: string; lat: number; lng: number; rating: number; skills: string[]
        }> = data.workers || []

        setCount(workers.length)

        workers.forEach(w => {
          if (!w.lat || !w.lng) return
          const initial = (w.name?.[0] || 'W').toUpperCase()
          const skill   = w.skills?.[0] || 'Worker'
          const color   = w.rating >= 4.5 ? '#22C55E' : w.rating >= 4 ? '#F59E0B' : '#60A5FA'

          const icon = L.divIcon({
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
              <defs><filter id="ws"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.45)"/></filter></defs>
              <circle cx="22" cy="22" r="20" fill="#111827" stroke="${color}" stroke-width="2.5" filter="url(#ws)"/>
              <text x="22" y="28" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="800" fill="white">${initial}</text>
              <circle cx="35" cy="9" r="6" fill="${color}" stroke="white" stroke-width="2"/>
              <polygon points="22,42 27,34 17,34" fill="#111827"/>
            </svg>`,
            className:  '',
            iconSize:   [44, 52],
            iconAnchor: [22, 42],
          })

          L.marker([w.lat, w.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:system-ui,sans-serif;padding:4px 2px;min-width:140px">
                <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:2px">${w.name}</div>
                <div style="font-size:12px;color:#6B7280;margin-bottom:6px">${skill}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:13px;color:#F59E0B;font-weight:700">★ ${w.rating.toFixed(1)}</span>
                  <span style="font-size:11px;color:#22C55E;font-weight:700;background:rgba(34,197,94,0.1);padding:2px 7px;border-radius:20px">● Available</span>
                </div>
              </div>
            `, { maxWidth: 200 })
        })
      } catch {
        setCount(0)
      }
    }

    init()
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, background: '#f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.07)',
            borderTop: '3px solid #6366f1',
            animation: 'spin 0.8s linear infinite',
          }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {count !== null && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 1000,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,0,0,0.08)',
          pointerEvents: 'none',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
            display: 'inline-block', flexShrink: 0,
          }}/>
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#111827',
            fontFamily: '"DM Sans", system-ui, sans-serif',
          }}>
            {count > 0 ? `${count} worker${count !== 1 ? 's' : ''} nearby` : 'No workers nearby'}
          </span>
        </div>
      )}
    </div>
  )
}
