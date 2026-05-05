import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_CONFIG } from '@/lib/auth'
import { ADMIN_PHONE, isValidRole } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, role, name, city, referralCode } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })
    }

    const record = await prisma.otpLog.findFirst({
      where: {
        phone,
        otp: String(otp),
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    await prisma.otpLog.update({ where: { id: record.id }, data: { verified: true } })

    if (role && !isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    let captainRefId: string | undefined
    if (referralCode) {
      const cap = await prisma.captainProfile.findUnique({
        where: { referralCode: String(referralCode).toUpperCase().trim() },
      })
      if (cap) captainRefId = cap.id
    }

    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      const displayName = name?.trim() || `User ${phone.slice(-4)}`
      if (phone === ADMIN_PHONE) {
        user = await prisma.user.create({ data: { phone, name: 'Admin', role: 'ADMIN', password: '' } })
      } else if (role === 'CAPTAIN') {
        user = await prisma.user.create({ data: { phone, name: displayName, role: 'CAPTAIN', password: '' } })
        await prisma.captainProfile.create({ data: { userId: user.id, status: 'PENDING' } })
      } else if (role === 'OPS') {
        user = await prisma.user.create({ data: { phone, name: displayName, role: 'OPS', password: '' } })
        await prisma.opsProfile.create({ data: { userId: user.id } })
      } else {
        const userRole = (role === 'EMPLOYER' ? 'EMPLOYER' : 'WORKER') as 'EMPLOYER' | 'WORKER'
        user = await prisma.user.create({
          data: {
            phone,
            name: displayName,
            role: userRole,
            password: '',
            city: city?.trim() || undefined,
            ...(captainRefId && { captainReferralId: captainRefId }),
          },
        })
        if (userRole === 'WORKER') {
          await prisma.workerProfile.create({
            data: { userId: user.id, ...(captainRefId && { captainReferralId: captainRefId }) },
          })
        } else {
          await prisma.employerProfile.create({ data: { userId: user.id } })
        }
      }
    } else if (name?.trim() && !user.name) {
      await prisma.user.update({ where: { id: user.id }, data: { name: name.trim() } })
    }

    const isAdmin = phone === ADMIN_PHONE
    let tokenRole: 'EMPLOYER' | 'WORKER' | 'ADMIN' | 'CAPTAIN' | 'OPS'
    if (isAdmin) {
      tokenRole = (role || 'OPS') as typeof tokenRole
    } else if (role && role !== user.role) {
      const profileExists =
        (role === 'CAPTAIN'  && await prisma.captainProfile.findUnique({ where: { userId: user.id } })) ||
        (role === 'OPS'      && await prisma.opsProfile.findUnique({ where: { userId: user.id } })) ||
        (role === 'EMPLOYER' && await prisma.employerProfile.findUnique({ where: { userId: user.id } })) ||
        (role === 'WORKER'   && await prisma.workerProfile.findUnique({ where: { userId: user.id } }))
      tokenRole = profileExists ? (role as typeof tokenRole) : (user.role as typeof tokenRole)
    } else {
      tokenRole = user.role as typeof tokenRole
    }

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
    console.error('verify-whatsapp-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
