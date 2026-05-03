import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_CONFIG } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, role, referralCode } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })
    }

    // Verify OTP from database
    const record = await prisma.otpLog.findFirst({
      where: {
        phone,
        otp:      String(otp),
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    // Mark OTP as used
    await prisma.otpLog.update({ where: { id: record.id }, data: { verified: true } })

    const ADMIN_PHONE = '9205617375'

    // Resolve referral code → captainProfileId
    let captainRefId: string | undefined
    if (referralCode) {
      const cap = await prisma.captainProfile.findUnique({ where: { referralCode: String(referralCode).toUpperCase().trim() } })
      if (cap) captainRefId = cap.id
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      if (phone === ADMIN_PHONE) {
        user = await prisma.user.create({
          data: { phone, name: 'Admin', role: 'ADMIN', password: '' },
        })
      } else if (role === 'CAPTAIN') {
        user = await prisma.user.create({
          data: { phone, name: `Captain ${phone.slice(-4)}`, role: 'CAPTAIN', password: '' },
        })
        await prisma.captainProfile.create({ data: { userId: user.id, status: 'PENDING' } })
      } else if (role === 'OPS') {
        user = await prisma.user.create({
          data: { phone, name: `Ops ${phone.slice(-4)}`, role: 'OPS', password: '' },
        })
        await prisma.opsProfile.create({ data: { userId: user.id } })
      } else {
        const userRole = (role === 'EMPLOYER' ? 'EMPLOYER' : 'WORKER') as 'EMPLOYER' | 'WORKER'
        user = await prisma.user.create({
          data: { phone, name: `User ${phone.slice(-4)}`, role: userRole, password: '', ...(captainRefId && { captainReferralId: captainRefId }) },
        })
        if (userRole === 'WORKER') {
          await prisma.workerProfile.create({ data: { userId: user.id, ...(captainRefId && { captainReferralId: captainRefId }) } })
        } else {
          await prisma.employerProfile.create({ data: { userId: user.id, ...(captainRefId && { captainReferralId: captainRefId }) } })
        }
      }
    }

    // Admin can log into any app — sign token with the requested role
    const isAdmin = phone === ADMIN_PHONE
    const tokenRole = isAdmin
      ? ((role || 'WORKER') as 'EMPLOYER' | 'WORKER' | 'CAPTAIN' | 'OPS')
      : (user.role as 'EMPLOYER' | 'WORKER' | 'ADMIN' | 'CAPTAIN' | 'OPS')

    // Ensure admin has the required profile for whichever app they're accessing
    if (isAdmin) {
      if (tokenRole === 'EMPLOYER') {
        await prisma.employerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} })
      } else if (tokenRole === 'WORKER') {
        await prisma.workerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} })
      } else if (tokenRole === 'CAPTAIN') {
        await prisma.captainProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, status: 'ACTIVE' }, update: {} })
      } else if (tokenRole === 'OPS') {
        await prisma.opsProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} })
      }
    }

    const token = signToken({ userId: user.id, role: tokenRole, phone: user.phone })

    const res = NextResponse.json({ success: true, role: tokenRole })
    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
