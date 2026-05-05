import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

  const workerProfile = await prisma.workerProfile.findUnique({ where: { userId: payload.userId } })
  if (!workerProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, workerProfileId: workerProfile.id },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (!['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
    return NextResponse.json({ error: 'Booking not in valid state' }, { status: 400 })
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: 'IN_PROGRESS', checkInTime: new Date() },
    include: { shift: true },
  })

  await prisma.shift.update({
    where: { id: updated.shiftId },
    data:  { status: 'IN_PROGRESS' },
  })

  return NextResponse.json({ booking: updated })
}
