import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { notifyJobStarted } from '@/lib/fcm-server'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  // Invalidate old OTPs for this job
  await prisma.otpLog.updateMany({
    where: { phone: `job_${params.id}`, verified: false },
    data:  { verified: true },
  })

  await prisma.otpLog.create({
    data: { phone: `job_${params.id}`, otp, expiresAt },
  })

  return NextResponse.json({ otp, expiresAt })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { otp } = await req.json()

  const record = await prisma.otpLog.findFirst({
    where: {
      phone:    `job_${params.id}`,
      otp,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
  }

  await prisma.otpLog.update({ where: { id: record.id }, data: { verified: true } })

  // Start the job
  const shift = await prisma.shift.update({ where: { id: params.id }, data: { status: 'IN_PROGRESS' } })
  const bookings = await prisma.booking.findMany({
    where:   { shiftId: params.id, status: 'CONFIRMED' },
    include: { worker: { include: { user: true } } },
  })
  await prisma.booking.updateMany({
    where: { shiftId: params.id, status: 'CONFIRMED' },
    data:  { status: 'IN_PROGRESS', checkInTime: new Date() },
  })

  // Notify workers their shift has begun
  for (const b of bookings) {
    if (b.worker?.userId) {
      notifyJobStarted(b.worker.userId, shift.title, params.id).catch(console.error)
    }
  }

  return NextResponse.json({ success: true })
}
