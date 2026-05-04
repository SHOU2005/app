import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

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

  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'WORKER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, city, skills, bio, lat, lng, profilePhoto, aadhaarFront, aadhaarBack, aadhaarNumber } = body

  await Promise.all([
    name ? prisma.user.update({ where: { id: payload.userId }, data: { name } }) : null,
    prisma.workerProfile.upsert({
      where:  { userId: payload.userId },
      create: {
        userId: payload.userId,
        ...(city          != null ? { city }          : {}),
        ...(skills        != null ? { skills }        : {}),
        ...(bio           != null ? { bio }            : {}),
        ...(lat           != null ? { lat }            : {}),
        ...(lng           != null ? { lng }            : {}),
        ...(profilePhoto  != null ? { profilePhoto }  : {}),
        ...(aadhaarFront  != null ? { aadhaarFront }  : {}),
        ...(aadhaarBack   != null ? { aadhaarBack }   : {}),
        ...(aadhaarNumber != null ? { aadhaarNumber } : {}),
      },
      update: {
        ...(city          != null ? { city }          : {}),
        ...(skills        != null ? { skills }        : {}),
        ...(bio           != null ? { bio }            : {}),
        ...(lat           != null ? { lat }            : {}),
        ...(lng           != null ? { lng }            : {}),
        ...(profilePhoto  != null ? { profilePhoto }  : {}),
        ...(aadhaarFront  != null ? { aadhaarFront }  : {}),
        ...(aadhaarBack   != null ? { aadhaarBack }   : {}),
        ...(aadhaarNumber != null ? { aadhaarNumber } : {}),
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
