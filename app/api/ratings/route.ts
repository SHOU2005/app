import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, score, comment } = await req.json()

  if (score < 1 || score > 5) {
    return NextResponse.json({ error: 'Score must be between 1 and 5' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { worker: true },
  })

  if (!booking || booking.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Can only rate completed bookings' }, { status: 400 })
  }

  const existing = await prisma.rating.findUnique({ where: { bookingId } })
  if (existing) return NextResponse.json({ error: 'Already rated' }, { status: 409 })

  const rating = await prisma.rating.create({
    data: {
      bookingId,
      workerProfileId: booking.workerProfileId,
      ratedById:       payload.userId,
      score,
      comment,
    },
  })

  const allRatings = await prisma.rating.aggregate({
    where:   { workerProfileId: booking.workerProfileId },
    _avg:    { score: true },
    _count:  { score: true },
  })

  await prisma.workerProfile.update({
    where: { id: booking.workerProfileId },
    data:  { rating: allRatings._avg.score ?? 0 },
  })

  return NextResponse.json({ rating }, { status: 201 })
}
