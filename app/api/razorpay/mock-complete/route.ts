import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, employerId: payload.userId },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.paymentStatus === 'PAID') {
    return NextResponse.json({ success: true, alreadyPaid: true })
  }

  const mockPaymentId = `pay_mock_${Date.now()}`
  const mockOrderId   = `order_mock_${Date.now()}`

  await Promise.all([
    prisma.payment.upsert({
      where:  { bookingId },
      create: {
        bookingId,
        razorpayOrderId:   mockOrderId,
        razorpayPaymentId: mockPaymentId,
        amount:   booking.totalAmount,
        status:   'PAID',
      },
      update: {
        razorpayPaymentId: mockPaymentId,
        status: 'PAID',
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data:  { paymentStatus: 'PAID', status: 'CONFIRMED' },
    }),
    prisma.shift.updateMany({
      where: { bookings: { some: { id: bookingId } } },
      data:  { status: 'ASSIGNED' },
    }),
  ])

  return NextResponse.json({ success: true, paymentId: mockPaymentId })
}
