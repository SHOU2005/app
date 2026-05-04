import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where:   { id: payload.userId },
    include: { employerProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ user, profile: user.employerProfile })
}

export async function PATCH(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, ownerName, companyName, businessType, address, city, gstNumber, logo } = body

  await Promise.all([
    name ? prisma.user.update({ where: { id: payload.userId }, data: { name } }) : null,
    prisma.employerProfile.upsert({
      where:  { userId: payload.userId },
      create: {
        userId: payload.userId,
        ...(ownerName    != null ? { ownerName }    : {}),
        ...(companyName  != null ? { companyName }  : {}),
        ...(businessType != null ? { businessType } : {}),
        ...(address      != null ? { address }      : {}),
        ...(city         != null ? { city }         : {}),
        ...(gstNumber    != null ? { gstNumber }    : {}),
        ...(logo         != null ? { logo }         : {}),
      },
      update: {
        ...(ownerName    != null ? { ownerName }    : {}),
        ...(companyName  != null ? { companyName }  : {}),
        ...(businessType != null ? { businessType } : {}),
        ...(address      != null ? { address }      : {}),
        ...(city         != null ? { city }         : {}),
        ...(gstNumber    != null ? { gstNumber }    : {}),
        ...(logo         != null ? { logo }         : {}),
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
