import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Switch Shift...')

  const pass = await bcrypt.hash('demo123', 12)
  const adminPass = await bcrypt.hash('admin123', 12)

  // Admin
  await prisma.user.upsert({
    where:  { phone: '9999999900' },
    update: {},
    create: {
      name:     'Admin User',
      phone:    '9999999900',
      password: adminPass,
      role:     'ADMIN',
    },
  })

  // Employer
  const employer = await prisma.user.upsert({
    where:  { phone: '9999999901' },
    update: {},
    create: {
      name:     'Ravi Sharma',
      phone:    '9999999901',
      password: pass,
      role:     'EMPLOYER',
      employerProfile: {
        create: {
          companyName:  'TechMart Pvt Ltd',
          businessType: 'Retail',
          city:         'Mumbai',
          lat:          19.076,
          lng:          72.877,
          totalShifts:  12,
          rating:       4.5,
        },
      },
    },
    include: { employerProfile: true },
  })

  // Workers
  const workerData = [
    { name: 'Amit Kumar',   phone: '9999999902', city: 'Mumbai', lat: 19.083, lng: 72.881, rating: 4.8, shifts: 28, skills: ['Helper', 'Warehouse Worker'] },
    { name: 'Priya Mehta',  phone: '9999999903', city: 'Mumbai', lat: 19.071, lng: 72.872, rating: 4.6, shifts: 15, skills: ['Shop Assistant', 'Kitchen Staff'] },
    { name: 'Rahul Singh',  phone: '9999999904', city: 'Mumbai', lat: 19.090, lng: 72.890, rating: 4.3, shifts: 42, skills: ['Driver', 'Delivery Boy'] },
    { name: 'Deepak Verma', phone: '9999999905', city: 'Mumbai', lat: 19.065, lng: 72.865, rating: 4.7, shifts: 8,  skills: ['Security Guard'] },
  ]

  for (const w of workerData) {
    await prisma.user.upsert({
      where:  { phone: w.phone },
      update: {},
      create: {
        name:     w.name,
        phone:    w.phone,
        password: pass,
        role:     'WORKER',
        workerProfile: {
          create: {
            city:           w.city,
            lat:            w.lat,
            lng:            w.lng,
            rating:         w.rating,
            totalShifts:    w.shifts,
            totalEarnings:  w.shifts * 125 * 8,
            skills:         w.skills,
            kycStatus:      'APPROVED',
            aadhaarVerified: true,
            videoVerified:  true,
            isAvailable:    true,
          },
        },
      },
    })
  }

  // Sample shifts
  const ep = employer.employerProfile
  if (ep) {
    await prisma.shift.createMany({
      data: [
        {
          employerProfileId: ep.id,
          title:         'Warehouse Packers Needed',
          role:          'warehouseWorker',
          address:       'Dharavi Industrial Area, Mumbai',
          city:          'Mumbai',
          lat:           19.040,
          lng:           72.854,
          date:          new Date(Date.now() + 86400000),
          startTime:     '09:00',
          endTime:       '17:00',
          duration:      8,
          workersNeeded: 3,
          hourlyRate:    200,
          isUrgent:      true,
          urgentFee:     99,
          status:        'OPEN',
        },
        {
          employerProfileId: ep.id,
          title:         'Shop Assistant – Weekend',
          role:          'shopAssistant',
          address:       'Linking Road, Bandra West',
          city:          'Mumbai',
          lat:           19.056,
          lng:           72.836,
          date:          new Date(Date.now() + 172800000),
          startTime:     '11:00',
          endTime:       '19:00',
          duration:      8,
          workersNeeded: 2,
          hourlyRate:    200,
          isUrgent:      false,
          urgentFee:     0,
          status:        'OPEN',
        },
        {
          employerProfileId: ep.id,
          title:         'Office Helper – Half Day',
          role:          'helper',
          address:       'BKC, Mumbai',
          city:          'Mumbai',
          lat:           19.067,
          lng:           72.865,
          date:          new Date(Date.now() + 259200000),
          startTime:     '09:00',
          endTime:       '13:00',
          duration:      4,
          workersNeeded: 1,
          hourlyRate:    200,
          isUrgent:      false,
          urgentFee:     0,
          status:        'OPEN',
        },
      ],
      skipDuplicates: true,
    })
  }

  console.log('✅ Seed complete!')
  console.log('📱 Demo accounts:')
  console.log('   Admin:    9999999900 / admin123')
  console.log('   Employer: 9999999901 / demo123')
  console.log('   Worker:   9999999902 / demo123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
