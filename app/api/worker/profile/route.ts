import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

function parseSkills(s: string | null): string[] {
  try { return JSON.parse(s || '[]') } catch { return [] }
}

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where:   { id: payload.userId },
    include: { workerProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = user.workerProfile
    ? { ...user, workerProfile: { ...user.workerProfile, skills: parseSkills(user.workerProfile.skills) } }
    : user
  return NextResponse.json({ user: result })
}

export async function PATCH(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, city, skills, upiId, bio, lat, lng } = body

  const [user] = await Promise.all([
    name ? prisma.user.update({ where: { id: payload.userId }, data: { name } }) : null,
    prisma.workerProfile.upsert({
      where:  { userId: payload.userId },
      create: {
        userId: payload.userId,
        ...(city   ? { city }   : {}),
        ...(skills ? { skills: JSON.stringify(skills) } : {}),
        ...(bio    ? { bio }    : {}),
        ...(lat != null ? { lat } : {}),
        ...(lng != null ? { lng } : {}),
      },
      update: {
        ...(city   ? { city }   : {}),
        ...(skills ? { skills: JSON.stringify(skills) } : {}),
        ...(bio    ? { bio }    : {}),
        ...(lat != null ? { lat } : {}),
        ...(lng != null ? { lng } : {}),
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
