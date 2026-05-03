import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: payload.userId },
    data:  { fcmToken: token },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.update({
    where: { id: payload.userId },
    data:  { fcmToken: null },
  })

  return NextResponse.json({ success: true })
}
