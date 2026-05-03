import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { findMatchingWorkers } from '@/lib/matching'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shift = await prisma.shift.findUnique({
    where:   { id: params.id },
    include: {
      employer: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      bookings: {
        include: {
          worker: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
          rating: true,
        },
      },
    },
  })

  if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

  const matches = await findMatchingWorkers(params.id)

  return NextResponse.json({ shift, matches })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const shift = await prisma.shift.update({
    where: { id: params.id },
    data:  body,
  })
  return NextResponse.json({ shift })
}
