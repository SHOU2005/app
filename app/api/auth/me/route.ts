import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawUser = await prisma.user.findUnique({
    where:   { id: payload.userId },
    include: { workerProfile: true, employerProfile: true, captainProfile: true, opsProfile: true },
  })
  if (!rawUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...user } = rawUser

  return NextResponse.json({ user })
}
