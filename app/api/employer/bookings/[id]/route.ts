import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { notifyJobStarted } from '@/lib/fcm-server'

// Employer confirms a worker application and triggers payment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id, employerId: payload.userId },
    include: { shift: true, worker: { include: { user: { select: { name: true } } } } },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'PENDING') {
    return NextResponse.json({ error: 'Booking already processed' }, { status: 400 })
  }

  // Reject all other pending applications for the same shift
  await prisma.booking.updateMany({
    where: { shiftId: booking.shiftId, status: 'PENDING', id: { not: params.id } },
    data:  { status: 'CANCELLED' },
  })

  // Confirm this booking and update shift
  const updated = await prisma.booking.update({
    where: { id: params.id },
    data:  { status: 'CONFIRMED' },
    include: { shift: true, worker: { include: { user: true } } },
  })

  await prisma.shift.update({
    where: { id: booking.shiftId },
    data:  { status: 'ASSIGNED' },
  })

  notifyJobStarted(booking.worker.userId, booking.shift.title, booking.shiftId).catch(console.error)

  return NextResponse.json({ booking: updated })
}
