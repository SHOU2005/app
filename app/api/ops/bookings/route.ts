import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') || undefined
  const from   = req.nextUrl.searchParams.get('from')
  const to     = req.nextUrl.searchParams.get('to')
  const page   = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit  = 20

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(from   && { createdAt: { gte: new Date(from) } }),
      ...(to     && { createdAt: { lte: new Date(to) } }),
    },
    include: {
      shift:    { select: { title: true, date: true, city: true } },
      worker:   { include: { user: { select: { name: true, phone: true } } } },
      employer: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip:    (page - 1) * limit,
    take:    limit,
  })

  const total = await prisma.booking.count({
    where: {
      ...(status && { status: status as never }),
      ...(from   && { createdAt: { gte: new Date(from) } }),
      ...(to     && { createdAt: { lte: new Date(to) } }),
    },
  })

  return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) })
}
