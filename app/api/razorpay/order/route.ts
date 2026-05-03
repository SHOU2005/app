import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
})

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, employerId: payload.userId },
    include: { shift: true },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.paymentStatus === 'PAID') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }

  const amountInPaise = Math.round(booking.totalAmount * 100)

  try {
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `booking_${bookingId}`,
      notes:    { bookingId, shiftTitle: booking.shift.title },
    })

    await prisma.payment.upsert({
      where:  { bookingId },
      create: { bookingId, razorpayOrderId: order.id, amount: booking.totalAmount, status: 'PENDING' },
      update: { razorpayOrderId: order.id, status: 'PENDING' },
    })

    return NextResponse.json({
      orderId:   order.id,
      amount:    amountInPaise,
      currency:  'INR',
      keyId:     process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      bookingId,
    })
  } catch {
    // Razorpay unavailable — create payment record and signal fallback to client
    await prisma.payment.upsert({
      where:  { bookingId },
      create: { bookingId, razorpayOrderId: `order_pending_${Date.now()}`, amount: booking.totalAmount, status: 'PENDING' },
      update: { status: 'PENDING' },
    })

    return NextResponse.json({
      orderId:  null,
      amount:   amountInPaise,
      currency: 'INR',
      keyId:    'placeholder',
      bookingId,
    })
  }
}
