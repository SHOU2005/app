import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { notifyJobStarted, notifyJobCompleted } from '@/lib/fcm-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = await prisma.shift.findUnique({
    where: { id: params.id },
    include: {
      bookings: {
        include: { worker: { include: { user: { select: { name: true, phone: true, avatar: true } } } } },
        take: 1,
      },
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ job })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await req.json()
  const validStatuses = ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const job = await prisma.shift.update({
    where: { id: params.id },
    data:  { status },
    include: { bookings: { include: { worker: { include: { user: true } } }, take: 1 } },
  })

  const booking = job.bookings?.[0]
  const workerUserId = booking?.worker?.userId

  if (status === 'COMPLETED' && booking) {
    await prisma.booking.updateMany({
      where: { shiftId: params.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      data:  { status: 'COMPLETED', checkOutTime: new Date() },
    })
    if (workerUserId) {
      notifyJobCompleted(workerUserId, booking.workerEarning, job.title).catch(console.error)
    }
  }

  if (status === 'STARTED' && booking) {
    await prisma.booking.updateMany({
      where: { shiftId: params.id, status: 'CONFIRMED' },
      data:  { status: 'IN_PROGRESS', checkInTime: new Date() },
    })
    if (workerUserId) {
      notifyJobStarted(workerUserId, job.title, params.id).catch(console.error)
    }
  }

  return NextResponse.json({ job })
}
