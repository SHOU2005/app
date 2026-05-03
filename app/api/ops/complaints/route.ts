import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'OPS') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') || 'OPEN'

  const complaints = await prisma.complaint.findMany({
    where:   { status },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ complaints })
}
