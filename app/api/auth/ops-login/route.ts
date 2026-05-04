import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, hashPassword, signToken, COOKIE_CONFIG } from '@/lib/auth'

const ADMIN_PHONE = '9205617375'
const ADMIN_PASSWORD_HASH = '$2a$12$ZeisDv5LaQxEtFuA6MIId.ApOsqVPgKQIumFqGdMIgekiBBTUKHNS'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 })
    }

    // Find or auto-create the admin user on first login
    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      if (phone === ADMIN_PHONE) {
        user = await prisma.user.create({
          data: { phone, name: 'Admin', role: 'ADMIN', password: ADMIN_PASSWORD_HASH },
        })
      } else {
        return NextResponse.json({ error: 'Account not found' }, { status: 401 })
      }
    }

    // Only ADMIN or OPS users can access the ops portal
    if (user.role !== 'ADMIN' && user.role !== 'OPS') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify password
    const passwordToCheck = phone === ADMIN_PHONE && !user.password
      ? ADMIN_PASSWORD_HASH
      : user.password

    const valid = await comparePassword(password, passwordToCheck)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Ensure admin has an OpsProfile
    await prisma.opsProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    })

    // If stored password was the seeded hash but user.password was empty, update it now
    if (phone === ADMIN_PHONE && !user.password) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: ADMIN_PASSWORD_HASH },
      })
    }

    const token = signToken({ userId: user.id, role: 'OPS', phone: user.phone })
    const res = NextResponse.json({ success: true, role: 'OPS' })
    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err) {
    console.error('ops-login error:', err)
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 })
  }
}
