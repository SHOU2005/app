import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { broadcastUrgentJob } from '@/lib/fcm-server'

const BASE_RATE = 200

async function getOrCreateEmployerProfile(userId: string) {
  return prisma.employerProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  })
}

export async function GET() {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const employerProfile = await getOrCreateEmployerProfile(payload.userId)

  const jobs = await prisma.shift.findMany({
    where: { employerProfileId: employerProfile.id },
    include: {
      bookings: {
        include: { worker: { include: { user: { select: { name: true, phone: true } } } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ jobs })
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { category, address, city, lat, lng, duration, date, startTime, endTime, isInstant } = body

  const employerProfile = await getOrCreateEmployerProfile(payload.userId)

  const hourlyRate     = isInstant ? 250 : BASE_RATE
  const totalAmount    = Math.round(hourlyRate * duration)
  const platformFee    = Math.round(totalAmount * 0.15)
  const workerEarning  = totalAmount - platformFee

  const shift = await prisma.shift.create({
    data: {
      title:             category,
      role:              category,
      address:           address || '',
      city:              city || 'Mumbai',
      lat:               lat || 19.076,
      lng:               lng || 72.877,
      date:              new Date(date || new Date()),
      startTime:         startTime || new Date().toTimeString().slice(0, 5),
      endTime:           endTime || '18:00',
      duration,
      workersNeeded:     1,
      hourlyRate,
      isUrgent:          isInstant || false,
      urgentFee:         isInstant ? 50 : 0,
      status:            'OPEN',
      employerProfileId: employerProfile.id,
    },
  })

  if (isInstant) {
    broadcastUrgentJob(
      shift.id,
      shift.title,
      shift.address,
      `₹${workerEarning.toLocaleString('en-IN')} total`,
    ).catch(console.error)
  }

  return NextResponse.json({
    job:          { ...shift, status: 'OPEN' },
    totalAmount,
    platformFee,
    workerEarning,
  }, { status: 201 })
}
