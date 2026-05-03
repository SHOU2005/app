import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const city     = req.nextUrl.searchParams.get('city')     || undefined
  const verified = req.nextUrl.searchParams.get('verified')

  const employers = await prisma.employerProfile.findMany({
    where: {
      ...(city     && { city }),
      ...(verified === 'true'  && { verifiedByOpsAt: { not: null } }),
      ...(verified === 'false' && { verifiedByOpsAt: null }),
    },
    include: {
      user: { select: { id: true, name: true, phone: true, avatar: true, isActive: true, createdAt: true } },
    },
    orderBy: { user: { createdAt: 'desc' } },
  })

  return NextResponse.json({ employers })
}
