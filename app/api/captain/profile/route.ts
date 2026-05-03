import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'SW'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

async function ensureReferralCode(captainProfileId: string): Promise<string> {
  const profile = await prisma.captainProfile.findUnique({ where: { id: captainProfileId }, select: { referralCode: true } })
  if (profile?.referralCode) return profile.referralCode
  // Generate unique code
  let code = genCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.captainProfile.findUnique({ where: { referralCode: code } })
    if (!existing) break
    code = genCode()
    attempts++
  }
  await prisma.captainProfile.update({ where: { id: captainProfileId }, data: { referralCode: code } })
  return code
}

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'CAPTAIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:   { id: payload.userId },
    include: { captainProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (user.captainProfile && !user.captainProfile.referralCode) {
    await ensureReferralCode(user.captainProfile.id)
    const updated = await prisma.captainProfile.findUnique({ where: { userId: user.id } })
    const { password: _, ...safe } = user
    return NextResponse.json({ user: { ...safe, captainProfile: updated } })
  }

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
