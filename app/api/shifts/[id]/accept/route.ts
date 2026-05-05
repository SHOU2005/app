import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { notifyWorkerAccepted } from '@/lib/fcm-server'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId: payload.userId },
  })
  if (!workerProfile) {
    return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })
  }

  // Check worker hasn't already applied/accepted this shift
  const existing = await prisma.booking.findFirst({
    where: {
      shiftId:         params.id,
      workerProfileId: workerProfile.id,
      status:          { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
    },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already applied' }, { status: 409 })
  }

  const shift = await prisma.shift.findUnique({ where: { id: params.id } })
  if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
  if (shift.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Shift cancelled' }, { status: 410 })
  }

  const totalAmount   = Math.round(shift.hourlyRate * shift.duration)
  const platformFee   = Math.round(totalAmount * 0.15)
  const workerEarning = totalAmount - platformFee

  if (shift.isUrgent) {
    // Atomic grab: only one worker can claim an urgent job
    const [updated] = await prisma.$transaction([
      prisma.shift.updateMany({
        where: { id: params.id, status: 'OPEN' },
        data:  { status: 'ASSIGNED' },
      }),
    ])

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Job already taken' }, { status: 409 })
    }

    const booking = await prisma.booking.create({
      data: {
        shiftId:         params.id,
        workerProfileId: workerProfile.id,
        employerId:      shift.employerProfileId
          ? (await prisma.employerProfile.findUnique({ where: { id: shift.employerProfileId }, select: { userId: true } }))!.userId
          : payload.userId,
        status:          'PENDING',
        totalAmount,
        platformFee,
        workerEarning,
        paymentStatus:   'PENDING',
        appliedAt:       new Date(),
      },
      include: { shift: true },
    })

    // Notify employer
    const employer = await prisma.employerProfile.findUnique({
      where: { id: shift.employerProfileId },
      select: { userId: true },
    })
    if (employer) {
      const workerUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } })
      notifyWorkerAccepted(employer.userId, workerUser?.name || 'A worker', shift.title, shift.id).catch(console.error)
    }

    return NextResponse.json({ booking, shift: booking.shift }, { status: 201 })
  }

  // Scheduled job — create a PENDING application (employer picks from applicants)
  const alreadyFull = await prisma.booking.count({
    where: { shiftId: params.id, status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
  })
  if (alreadyFull >= shift.workersNeeded) {
    return NextResponse.json({ error: 'No spots available' }, { status: 409 })
  }

  const booking = await prisma.booking.create({
    data: {
      shiftId:         params.id,
      workerProfileId: workerProfile.id,
      employerId:      (await prisma.employerProfile.findUnique({
        where: { id: shift.employerProfileId }, select: { userId: true },
      }))!.userId,
      status:          'PENDING',
      totalAmount,
      platformFee,
      workerEarning,
      paymentStatus:   'PENDING',
      appliedAt:       new Date(),
    },
    include: { shift: true },
  })

  const employer = await prisma.employerProfile.findUnique({
    where: { id: shift.employerProfileId },
    select: { userId: true },
  })
  if (employer) {
    const workerUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } })
    notifyWorkerAccepted(employer.userId, workerUser?.name || 'A worker', shift.title, shift.id).catch(console.error)
  }

  return NextResponse.json({ booking, shift: booking.shift }, { status: 201 })
}
