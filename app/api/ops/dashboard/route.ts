import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now   = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const week  = new Date(now); week.setDate(week.getDate() - 7)
  const month = new Date(now); month.setDate(1); month.setHours(0, 0, 0, 0)

  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const [
    activeShifts, todayBookings, pendingKyc, openComplaints,
    captainsInField, pendingCommissions, pendingCaptains,
    todayRev, yesterdayRev, weekRev, monthRev,
  ] = await Promise.all([
    prisma.shift.count({ where: { status: { in: ['OPEN', 'SEARCHING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
    prisma.booking.count({ where: { createdAt: { gte: today } } }),
    prisma.workerProfile.count({ where: { kycStatus: 'PENDING' } }),
    prisma.complaint.count({ where: { status: 'OPEN' } }),
    prisma.captainAttendance.count({ where: { date: { gte: today }, checkInTime: { not: null }, checkOutTime: null } }),
    prisma.commission.count({ where: { status: 'PENDING' } }),
    prisma.captainProfile.count({ where: { status: 'PENDING' } }),
    prisma.booking.aggregate({ where: { createdAt: { gte: today }, paymentStatus: 'PAID' }, _sum: { platformFee: true } }),
    prisma.booking.aggregate({ where: { createdAt: { gte: yesterday, lt: today }, paymentStatus: 'PAID' }, _sum: { platformFee: true } }),
    prisma.booking.aggregate({ where: { createdAt: { gte: week }, paymentStatus: 'PAID' }, _sum: { platformFee: true } }),
    prisma.booking.aggregate({ where: { createdAt: { gte: month }, paymentStatus: 'PAID' }, _sum: { platformFee: true } }),
  ])

  return NextResponse.json({
    activeShifts, todayBookings, pendingKyc, openComplaints,
    captainsInField, pendingCommissions, pendingCaptains,
    todayRevenue:     todayRev._sum.platformFee     ?? 0,
    yesterdayRevenue: yesterdayRev._sum.platformFee ?? 0,
    weekRevenue:      weekRev._sum.platformFee      ?? 0,
    monthRevenue:     monthRev._sum.platformFee     ?? 0,
  })
}
