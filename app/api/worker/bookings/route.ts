import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { shiftId } = await req.json()
  if (!shiftId) return NextResponse.json({ error: 'shiftId required' }, { status: 400 })

  const [shift, workerProfile] = await Promise.all([
    prisma.shift.findUnique({
      where:   { id: shiftId },
      include: { employer: true },
    }),
    prisma.workerProfile.findUnique({ where: { userId: payload.userId } }),
  ])

  if (!shift)         return NextResponse.json({ error: 'Shift not found' },          { status: 404 })
  if (!workerProfile) return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })
  if (shift.status !== 'OPEN') return NextResponse.json({ error: 'Shift not available' }, { status: 409 })

  const existing = await prisma.booking.findFirst({
    where: {
      shiftId,
      workerProfileId: workerProfile.id,
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
    },
  })
  if (existing) return NextResponse.json({ error: 'Already booked' }, { status: 409 })

  const workerEarning = shift.duration * 125
  const platformFee   = shift.duration * 75
  const totalAmount   = shift.duration * 200 + shift.urgentFee

  const booking = await prisma.booking.create({
    data: {
      shiftId,
      workerProfileId: workerProfile.id,
      employerId:      shift.employer.userId,
      status:          'PENDING',
      totalAmount,
      platformFee,
      workerEarning,
      paymentStatus:   'PENDING',
    },
    include: {
      shift: {
        include: {
          employer: { include: { user: { select: { name: true, phone: true } } } },
        },
      },
    },
  })

  return NextResponse.json({ booking }, { status: 201 })
}
