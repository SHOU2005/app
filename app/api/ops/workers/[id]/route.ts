import { NextResponse } from 'next/server'
import { getTokenFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const token = getTokenFromCookies()
  if (!token || token.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const worker = await prisma.workerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, phone: true, isActive: true, createdAt: true } },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          shift: { select: { title: true, startTime: true } },
          employer: { select: { name: true } },
        },
      },
    },
  })

  if (!worker) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ worker })
}
