import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bookings = await prisma.booking.findMany({
    where: { employerId: payload.userId },
    include: {
      shift: true,
      worker: { include: { user: { select: { name: true, avatar: true } } } },
      payment: true,
      rating: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ bookings })
}
