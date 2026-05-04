import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_CONFIG } from '@/lib/auth'
import { ADMIN_PHONE } from '@/lib/config'

// Legacy password-based captain login (kept for backwards compat).
// New logins use /api/auth/firebase-verify via OTP.
export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      return NextResponse.json({ error: 'Phone not registered. Please create an account.' }, { status: 404 })
    }

    // Admin can access captain portal — verify using stored bcrypt hash only
    if (phone === ADMIN_PHONE) {
      if (!user.password) {
        return NextResponse.json({ error: 'Admin account not set up.' }, { status: 401 })
      }
      const valid = await comparePassword(password, user.password)
      if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
      await prisma.captainProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, status: 'ACTIVE' },
        update: {},
      })
      const token = signToken({ userId: user.id, role: 'CAPTAIN', phone: user.phone })
      const res = NextResponse.json({ success: true, role: 'CAPTAIN' })
      res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
      return res
    }

    if (user.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Not a captain account' }, { status: 403 })
    }
    if (!user.password) {
      return NextResponse.json({ error: 'Please use OTP login.' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })

    const token = signToken({ userId: user.id, role: 'CAPTAIN', phone: user.phone })
    const res = NextResponse.json({ success: true, role: 'CAPTAIN' })
    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err) {
    console.error('captain-login error:', err)
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 })
  }
}
