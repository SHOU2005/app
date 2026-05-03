import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone || !/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, role: true } })
  return NextResponse.json({ exists: !!user, role: user?.role ?? null })
}
