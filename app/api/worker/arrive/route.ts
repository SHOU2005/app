import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { pushToUser } from '@/lib/fcm-server'

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
    where:   { id: bookingId, workerProfileId: workerProfile.id },
    include: { shift: true },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (!['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
    return NextResponse.json({ error: 'Booking not in valid state' }, { status: 400 })
  }

  // Mark arrived — only set checkInTime; OTP verification will set IN_PROGRESS
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data:  { checkInTime: new Date() },
    include: { shift: true },
  })

  // Notify employer worker has arrived
  pushToUser(booking.employerId, {
    title: `Worker has arrived — ${booking.shift.title}`,
    body:  'Generate an OTP from the job screen to start the shift',
    url:   `/employer/job/${booking.shiftId}`,
    data:  { type: 'WORKER_ARRIVED', shiftId: booking.shiftId },
  }).catch(console.error)

  return NextResponse.json({ booking: updated })
}
