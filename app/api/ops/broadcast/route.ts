import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { pushToUser } from '@/lib/fcm-server'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, targetRole, targetCity } = await req.json()
  if (!title || !body) return NextResponse.json({ error: 'Title and body required' }, { status: 400 })

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(targetRole && targetRole !== 'ALL' && { role: targetRole }),
    },
    select: { id: true, fcmToken: true },
  })

  let sent = 0
  for (const user of users) {
    if (user.fcmToken) {
      await pushToUser(user.id, { title, body })
      sent++
    }
  }

  await prisma.broadcastLog.create({
    data: {
      sentByUserId: payload.userId,
      title,
      body,
      targetRole: targetRole || 'ALL',
      targetCity: targetCity || null,
      sentCount:  sent,
    },
  })

  return NextResponse.json({ success: true, sent })
}
