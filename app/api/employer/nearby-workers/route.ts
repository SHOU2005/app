import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { haversineDistance } from '@/lib/matching'

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const lat    = parseFloat(searchParams.get('lat')    || '0')
  const lng    = parseFloat(searchParams.get('lng')    || '0')
  const radius = parseFloat(searchParams.get('radius') || '10')

  const workers = await prisma.workerProfile.findMany({
    where: {
      isAvailable: true,
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id:          true,
      lat:         true,
      lng:         true,
      rating:      true,
      skills:      true,
      totalShifts: true,
      user: { select: { name: true } },
    },
    take: 50,
  })

  const nearby = workers.filter(w => {
    if (!w.lat || !w.lng) return false
    if (!lat || !lng) return true
    return haversineDistance(lat, lng, w.lat, w.lng) <= radius
  })

  return NextResponse.json({
    workers: nearby.slice(0, 20).map(w => ({
      id:          w.id,
      name:        w.user.name,
      lat:         w.lat,
      lng:         w.lng,
      rating:      w.rating,
      skills:      w.skills,
      totalShifts: w.totalShifts,
    })),
  })
}
