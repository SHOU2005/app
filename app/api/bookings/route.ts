import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (payload.role === 'WORKER') {
    const workerProfile = await prisma.workerProfile.findUnique({ where: { userId: payload.userId } })
    if (!workerProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const bookings = await prisma.booking.findMany({
      where:   { workerProfileId: workerProfile.id },
      include: {
        shift:   { include: { employer: { include: { user: { select: { name: true, phone: true, avatar: true } } } } } },
        rating:  true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ bookings })
  }

  if (payload.role === 'EMPLOYER') {
    const bookings = await prisma.booking.findMany({
      where:   { employerId: payload.userId },
      include: {
        shift:  true,
        worker: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
        rating: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ bookings })
  }

  const bookings = await prisma.booking.findMany({
    include: {
      shift:   true,
      worker:  { include: { user: { select: { name: true } } } },
      employer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    100,
  })
  return NextResponse.json({ bookings })
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { shiftId, workerProfileId } = await req.json()

    const [shift, workerProfile] = await Promise.all([
      prisma.shift.findUnique({ where: { id: shiftId } }),
      prisma.workerProfile.findUnique({ where: { id: workerProfileId } }),
    ])

    if (!shift || !workerProfile) {
      return NextResponse.json({ error: 'Shift or worker not found' }, { status: 404 })
    }

    const existing = await prisma.booking.findFirst({
      where: {
        shiftId,
        workerProfileId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })
    if (existing) return NextResponse.json({ error: 'Already booked' }, { status: 409 })

    const workerEarning   = shift.duration * 125
    const platformFee     = shift.duration * 75
    const totalAmount     = shift.duration * 200 + shift.urgentFee

    const booking = await prisma.booking.create({
      data: {
        shiftId,
        workerProfileId,
        employerId:   payload.userId,
        status:       'PENDING',
        totalAmount,
        platformFee,
        workerEarning,
        paymentStatus: 'PENDING',
      },
      include: {
        shift:  true,
        worker: { include: { user: { select: { name: true, phone: true } } } },
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
