import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const captains = await prisma.captainProfile.findMany({
    include: {
      user:        { select: { id: true, name: true, phone: true, avatar: true, createdAt: true } },
      commissions: { select: { amount: true, status: true } },
      tasks:       { select: { status: true } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const data = captains.map(c => ({
    id:                c.id,
    userId:            c.userId,
    name:              c.user.name,
    phone:             c.user.phone,
    avatar:            c.user.avatar,
    territory:         c.territory,
    status:            c.status,
    totalEarnings:     c.totalEarnings,
    pendingPayout:     c.pendingPayout,
    joinedAt:          c.joinedAt,
    totalCommissions:  c.commissions.reduce((s, x) => s + x.amount, 0),
    pendingCommissions: c.commissions.filter(x => x.status === 'PENDING').length,
    openTasks:         c.tasks.filter(x => x.status === 'OPEN').length,
  }))

  return NextResponse.json({ captains: data })
}
