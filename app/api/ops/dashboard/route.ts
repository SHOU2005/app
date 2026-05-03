import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    activeShifts,
    todayBookings,
    pendingKyc,
    openComplaints,
    captainsInField,
    pendingCommissions,
    todayRevenue,
    pendingCaptains,
  ] = await Promise.all([
    prisma.shift.count({ where: { status: { in: ['OPEN', 'SEARCHING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
    prisma.booking.count({ where: { createdAt: { gte: today } } }),
    prisma.workerProfile.count({ where: { kycStatus: 'PENDING' } }),
    prisma.complaint.count({ where: { status: 'OPEN' } }),
    prisma.captainAttendance.count({ where: { date: { gte: today }, checkInTime: { not: null }, checkOutTime: null } }),
    prisma.commission.count({ where: { status: 'PENDING' } }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: 'PAID' },
      _sum:  { platformFee: true },
    }),
    prisma.captainProfile.count({ where: { status: 'PENDING' } }),
  ])

  return NextResponse.json({
    activeShifts,
    todayBookings,
    pendingKyc,
    openComplaints,
    captainsInField,
    pendingCommissions,
    todayRevenue: todayRevenue._sum.platformFee ?? 0,
    pendingCaptains,
  })
}
