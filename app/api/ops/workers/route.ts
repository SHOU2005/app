import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const kycStatus = (req.nextUrl.searchParams.get('kycStatus') || undefined) as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined
  const city      = req.nextUrl.searchParams.get('city')      || undefined
  const page      = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit     = 20

  const workers = await prisma.workerProfile.findMany({
    where: {
      ...(kycStatus && { kycStatus }),
      ...(city      && { city }),
    },
    include: { user: { select: { id: true, name: true, phone: true, avatar: true, isActive: true, createdAt: true } } },
    orderBy: { user: { createdAt: 'desc' } },
    skip:    (page - 1) * limit,
    take:    limit,
  })

  const total = await prisma.workerProfile.count({
    where: {
      ...(kycStatus && { kycStatus }),
      ...(city      && { city }),
    },
  })

  return NextResponse.json({ workers, total, page, pages: Math.ceil(total / limit) })
}
