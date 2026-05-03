import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where:   { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
    take:    50,
  })

  const unread = notifications.filter(n => !n.read).length

  return NextResponse.json({ notifications, unread })
}

export async function PATCH(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()

  if (ids && Array.isArray(ids)) {
    // Mark specific notifications as read
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: payload.userId },
      data:  { read: true },
    })
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: payload.userId, read: false },
      data:  { read: true },
    })
  }

  return NextResponse.json({ success: true })
}
