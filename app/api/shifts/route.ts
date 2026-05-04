import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  title:         z.string().min(3),
  role:          z.string(),
  description:   z.string().optional(),
  address:       z.string(),
  city:          z.string(),
  lat:           z.number(),
  lng:           z.number(),
  date:          z.string(),
  startTime:     z.string(),
  endTime:       z.string(),
  duration:      z.number(),
  workersNeeded: z.number().min(1).max(20),
  isUrgent:      z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const city     = searchParams.get('city')
  const role     = searchParams.get('role')
  const dateStr  = searchParams.get('date')
  const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : null

  if (payload.role === 'WORKER') {
    const workerProfile = await prisma.workerProfile.findUnique({ where: { userId: payload.userId } })
    if (!workerProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const dateFilter = dateStr
      ? { gte: new Date(dateStr + 'T00:00:00'), lt: new Date(dateStr + 'T23:59:59') }
      : { gte: new Date() }

    const shifts = await prisma.shift.findMany({
      where: {
        status: 'OPEN',
        date:   dateFilter,
        ...(city     ? { city: { contains: city } }                       : {}),
        ...(role     ? { role }                                           : {}),
        ...(duration ? { duration }                                       : {}),
        bookings: {
          none: {
            workerProfileId: workerProfile.id,
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        },
      },
      include: { employer: { include: { user: { select: { name: true, avatar: true } } } } },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      take:    20,
    })
    return NextResponse.json({ shifts })
  }

  if (payload.role === 'EMPLOYER') {
    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: payload.userId } })
    if (!employerProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const shifts = await prisma.shift.findMany({
      where:   { employerProfileId: employerProfile.id },
      include: { bookings: { include: { worker: { include: { user: { select: { name: true, avatar: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ shifts })
  }

  const shifts = await prisma.shift.findMany({
    include: { employer: { include: { user: { select: { name: true } } } }, bookings: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ shifts })
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromCookies()
  if (!payload || payload.role !== 'EMPLOYER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const employerProfile = await prisma.employerProfile.findUnique({ where: { userId: payload.userId } })
    if (!employerProfile) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

    const hourlyRate = 200
    const urgentFee = data.isUrgent ? 99 : 0

    const shift = await prisma.shift.create({
      data: {
        ...data,
        date:              new Date(data.date),
        employerProfileId: employerProfile.id,
        hourlyRate,
        urgentFee,
        status:            'OPEN',
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
