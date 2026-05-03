import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const captain = await prisma.captainProfile.findUnique({
    where:   { id: params.id },
    include: {
      user:        { select: { id: true, name: true, phone: true, avatar: true } },
      commissions: { include: { booking: { include: { shift: { select: { title: true, date: true } } } } }, orderBy: { createdAt: 'desc' }, take: 20 },
      tasks:       { orderBy: { createdAt: 'desc' } },
      attendances: { orderBy: { date: 'desc' }, take: 30 },
    },
  })
  if (!captain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [employersOnboarded, workersOnboarded] = await Promise.all([
    prisma.employerProfile.count({ where: { captainReferralId: captain.id } }),
    prisma.workerProfile.count({ where: { captainReferralId: captain.id } }),
  ])

  return NextResponse.json({ captain: { ...captain, employersOnboarded, workersOnboarded } })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status, territory } = await req.json()
  const updated = await prisma.captainProfile.update({
    where: { id: params.id },
    data:  {
      ...(status    && { status }),
      ...(territory && { territory }),
    },
  })
  return NextResponse.json({ captain: updated })
}
