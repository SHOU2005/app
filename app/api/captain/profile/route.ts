import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'CAPTAIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:   { id: payload.userId },
    include: { captainProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { password: _, ...safe } = user
  return NextResponse.json({ user: safe })
}

export async function PATCH(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'CAPTAIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, city, avatar } = await req.json()
  const updated = await prisma.user.update({
    where:   { id: payload.userId },
    data:    { ...(name && { name }), ...(avatar && { avatar }) },
    include: { captainProfile: true },
  })
  if (city) {
    await prisma.captainProfile.update({
      where: { userId: payload.userId },
      data:  { territory: city },
    })
  }
  const { password: _, ...safe } = updated
  return NextResponse.json({ user: safe })
}
