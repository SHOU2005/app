'use client'
import { useEffect, useRef } from 'react'

type WorkerPin = {
  id: string
  name: string
  lat: number
  lng: number
  job: string
  status: 'live' | 'pending'
}

interface Props {
  pins: WorkerPin[]
  centerLat?: number
  centerLng?: number
}

function makePinIcon(L: any, pin: WorkerPin) {
  const isLive = pin.status === 'live'
  const html = `
    <div style="position:relative">
      <div style="
        width:40px; height:40px; border-radius:50%;
        background:${isLive ? 'linear-gradient(135deg,#064E3B,#0D9488)' : 'linear-gradient(135deg,#1E3A5F,#2563EB)'};
        border:3px solid ${isLive ? '#14B8A6' : '#60A5FA'};
        box-shadow:0 2px 12px rgba(0,0,0,0.35);
        display:flex; align-items:center; justify-content:center;
        font-weight:900; font-size:16px; color:#fff;
        font-family:system-ui,sans-serif;
      ">${pin.name[0]?.toUpperCase() || 'W'}</div>
      ${isLive ? '<div style="width:10px;height:10px;border-radius:50%;background:#4ADE80;border:2px solid #fff;position:absolute;top:-2px;right:-2px;"></div>' : ''}
    </div>`
  return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24] })
}

export default function WorkerMapView({ pins, centerLat = 19.076, centerLng = 72.877 }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const mapInst    = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return

    import('leaflet').then(L => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { center: [centerLat, centerLng], zoom: 13, zoomControl: false, attributionControl: false })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      L.control.attribution({ prefix: '© OSM', position: 'bottomright' }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      pins.forEach(pin => {
        const isLive = pin.status === 'live'
        const m = L.marker([pin.lat, pin.lng], { icon: makePinIcon(L, pin) })
          .addTo(map)
          .bindPopup(`<div style="font-family:system-ui,sans-serif;padding:4px 2px"><strong>${pin.name}</strong><br><span style="font-size:12px;color:#6B7280">${pin.job}</span><br><span style="font-size:11px;color:${isLive ? '#10B981' : '#3B82F6'};font-weight:700">${isLive ? '● Live' : '● Pending'}</span></div>`, { maxWidth: 180 })
        markersRef.current[pin.id] = { marker: m, L }
      })

      mapInst.current = map
    })

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null }
      markersRef.current = {}
    }
  }, [])

  // Update or add markers when pins change (live location updates)
  useEffect(() => {
    if (!mapInst.current) return
    import('leaflet').then(L => {
      const map = mapInst.current
      const seen = new Set<string>()

      pins.forEach(pin => {
        seen.add(pin.id)
        const existing = markersRef.current[pin.id]
        if (existing) {
          existing.marker.setLatLng([pin.lat, pin.lng])
          existing.marker.setIcon(makePinIcon(L, pin))
        } else {
          const isLive = pin.status === 'live'
          const m = L.marker([pin.lat, pin.lng], { icon: makePinIcon(L, pin) })
            .addTo(map)
            .bindPopup(`<div style="font-family:system-ui,sans-serif;padding:4px 2px"><strong>${pin.name}</strong><br><span style="font-size:12px;color:#6B7280">${pin.job}</span><br><span style="font-size:11px;color:${isLive ? '#10B981' : '#3B82F6'};font-weight:700">${isLive ? '● Live' : '● Pending'}</span></div>`, { maxWidth: 180 })
          markersRef.current[pin.id] = { marker: m, L }
        }
      })

      // Remove stale markers
      Object.keys(markersRef.current).forEach(id => {
        if (!seen.has(id)) {
          markersRef.current[id].marker.remove()
          delete markersRef.current[id]
        }
      })
    })
  }, [pins])

  // Re-center when center coordinates change
  useEffect(() => {
    if (mapInst.current) mapInst.current.setView([centerLat, centerLng], 13)
  }, [centerLat, centerLng])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#e8e0d8' }} />
    </>
  )
}
