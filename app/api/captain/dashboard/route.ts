import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'CAPTAIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const captain = await prisma.captainProfile.findUnique({ where: { userId: payload.userId } })
  if (!captain) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [commissionThisMonth, pendingTasks, employersOnboarded, workersOnboarded] = await Promise.all([
    prisma.commission.aggregate({
      where:  { captainProfileId: captain.id, createdAt: { gte: startOfMonth } },
      _sum:   { amount: true },
    }),
    prisma.captainTask.count({
      where: { captainProfileId: captain.id, status: 'OPEN' },
    }),
    prisma.employerProfile.count({ where: { captainReferralId: captain.id } }),
    prisma.workerProfile.count({ where: { captainReferralId: captain.id } }),
  ])

  return NextResponse.json({
    status:              captain.status,
    commissionThisMonth: commissionThisMonth._sum.amount ?? 0,
    pendingPayout:       captain.pendingPayout,
    totalEarnings:       captain.totalEarnings,
    pendingTasks,
    employersOnboarded,
    workersOnboarded,
  })
}
