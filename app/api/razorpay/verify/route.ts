import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { razorpayPaymentId, razorpayOrderId, razorpaySignature, bookingId } = await req.json()

  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  await Promise.all([
    prisma.payment.update({
      where: { bookingId },
      data:  { razorpayPaymentId, status: 'PAID' },
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

  return NextResponse.json({ success: true })
}
