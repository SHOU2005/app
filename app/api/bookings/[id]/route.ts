import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { pushToUser } from '@/lib/fcm-server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()

  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const allowedTransitions: Record<string, string[]> = {
    EMPLOYER: ['CONFIRMED', 'CANCELLED'],
    WORKER:   ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'],
    ADMIN:    ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
    OPS:      ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
  }

  if (!allowedTransitions[payload.role]?.includes(status)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { status }
  if (status === 'IN_PROGRESS') updateData.checkInTime  = new Date()
  if (status === 'COMPLETED')   updateData.checkOutTime = new Date()

  const updated = await prisma.booking.update({
    where:   { id: params.id },
    data:    updateData,
    include: {
      shift:  true,
      worker: { include: { user: { select: { name: true, phone: true } } } },
    },
  })

  if (status === 'COMPLETED') {
    await prisma.workerProfile.update({
      where:  { id: booking.workerProfileId },
      data: {
        totalShifts:   { increment: 1 },
        totalEarnings: { increment: booking.workerEarning },
      },
    })

    // Fire captain commission if employer or worker was referred by a captain
    const [workerProfile, employerProfile] = await Promise.all([
      prisma.workerProfile.findUnique({ where: { id: booking.workerProfileId }, select: { captainReferralId: true } }),
      prisma.employerProfile.findFirst({ where: { userId: booking.employerId }, select: { captainReferralId: true } }),
    ])

    const captainProfileId = workerProfile?.captainReferralId || employerProfile?.captainReferralId
    if (captainProfileId) {
      const existing = await prisma.commission.findUnique({ where: { bookingId: booking.id } })
      if (!existing) {
        const [commission, captain] = await Promise.all([
          prisma.commission.create({
            data: { captainProfileId, bookingId: booking.id, amount: 100, status: 'PENDING' },
          }),
          prisma.captainProfile.update({
            where: { id: captainProfileId },
            data:  { pendingPayout: { increment: 100 } },
          }),
        ])
        void commission
        await pushToUser(captain.userId, {
          title: '₹100 Commission Earned!',
          body:  'A booking from your referral was completed.',
        })
      }
    }
  }

  return NextResponse.json({ booking: updated })
}
