import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lat, lng } = await req.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  await prisma.workerProfile.update({
    where: { userId: payload.userId },
    data:  { lat, lng },
  })

  return NextResponse.json({ success: true })
}
