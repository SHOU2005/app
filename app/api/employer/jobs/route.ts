import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies } from '@/lib/auth'
import { notifyWorkerAssigned } from '@/lib/fcm-server'

const DEMO_WORKERS = [
  { name: 'Rajesh Kumar',  avatar: 'R', rating: 4.8, totalShifts: 47, phone: '9876543210', eta: 8  },
  { name: 'Suresh Yadav',  avatar: 'S', rating: 4.7, totalShifts: 32, phone: '9123456780', eta: 12 },
  { name: 'Mohan Sharma',  avatar: 'M', rating: 4.9, totalShifts: 63, phone: '9988776655', eta: 6  },
]

const BASE_RATE = 200

async function getOrCreateEmployerProfile(userId: string) {
  return prisma.employerProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  })
}

async function getOrCreateDemoWorker() {
  const DEMO_PHONE = '0000000001'
  let user = await prisma.user.findUnique({ where: { phone: DEMO_PHONE } })
  if (!user) {
    user = await prisma.user.create({
      data: { phone: DEMO_PHONE, name: 'Rajesh Kumar', role: 'WORKER', password: '' },
    })
  }
  let profile = await prisma.workerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) {
    profile = await prisma.workerProfile.create({
      data: { userId: user.id, skills: JSON.stringify(['General Helper']), city: 'Mumbai', rating: 4.8, isAvailable: true },
    })
  }
  return { user, profile }
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
  const { category, address, city, lat, lng, duration, date, startTime, endTime, isInstant, discountPct = 0 } = body

  const employerProfile = await getOrCreateEmployerProfile(payload.userId)

  // ₹200/hr scheduled, ₹250/hr urgent (flat for all services)
  const hourlyRate = isInstant ? 250 : BASE_RATE

  const totalAmount   = Math.round(hourlyRate * duration * (1 - discountPct / 100))
  const platformFee   = Math.round(totalAmount * 0.15)
  const workerEarning = totalAmount - platformFee

  const shift = await prisma.shift.create({
    data: {
      title:             category,
      role:              category,
      address,
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
      status:            'SEARCHING',
      employerProfileId: employerProfile.id,
    },
  })

  // Auto-assign: try real worker first
  let assignedWorker: any = null
  let isDemo = false

  try {
    const realWorker = await prisma.workerProfile.findFirst({
      where: {
        isAvailable: true,
        bookings: { none: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } },
      },
      include: { user: { select: { name: true, phone: true } } },
      orderBy: [{ rating: 'desc' }, { totalShifts: 'desc' }],
    })

    if (realWorker) {
      await prisma.booking.create({
        data: {
          shiftId:         shift.id,
          workerProfileId: realWorker.id,
          employerId:      payload.userId,
          status:          'PENDING',
          totalAmount,
          platformFee,
          workerEarning,
          paymentStatus:   'PENDING',
        },
      })
      assignedWorker = {
        id:          realWorker.id,
        name:        realWorker.user.name,
        phone:       realWorker.user.phone,
        rating:      realWorker.rating || 4.7,
        totalShifts: realWorker.totalShifts,
        avatar:      realWorker.user.name[0],
        eta:         Math.floor(6 + Math.random() * 10),
        isDemo:      false,
      }
    }
  } catch {}

  // Demo fallback — create a real DB booking so payment can proceed
  if (!assignedWorker) {
    try {
      const { user: demoUser, profile: demoProfile } = await getOrCreateDemoWorker()
      await prisma.booking.create({
        data: {
          shiftId:         shift.id,
          workerProfileId: demoProfile.id,
          employerId:      payload.userId,
          status:          'PENDING',
          totalAmount,
          platformFee,
          workerEarning,
          paymentStatus:   'PENDING',
        },
      })
      const demo = DEMO_WORKERS[Math.floor(Math.random() * DEMO_WORKERS.length)]
      assignedWorker = { ...demo, id: demoProfile.id, name: demoUser.name, isDemo: true }
    } catch {
      const demo = DEMO_WORKERS[Math.floor(Math.random() * DEMO_WORKERS.length)]
      assignedWorker = { ...demo, id: 'demo', isDemo: true }
    }
    isDemo = true
  }

  // Update shift to ASSIGNED
  await prisma.shift.update({
    where: { id: shift.id },
    data:  { status: 'ASSIGNED' },
  })

  // Notify employer that a worker was assigned
  notifyWorkerAssigned(
    payload.userId,
    assignedWorker.name,
    shift.title,
    shift.id
  ).catch(console.error)

  return NextResponse.json({
    job: { ...shift, status: 'ASSIGNED' },
    worker: assignedWorker,
    totalAmount,
    platformFee,
    workerEarning,
    isDemo,
  }, { status: 201 })
}
