import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, hashPassword, signToken, COOKIE_CONFIG } from '@/lib/auth'

const ADMIN_PHONE = '9205617375'
const ADMIN_PASSWORD = 'admin123'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 })
    }

    let user = await prisma.user.findUnique({ where: { phone } })

    // Admin: auto-create and accept fixed password
    if (phone === ADMIN_PHONE) {
      if (!user) {
        const hashed = await hashPassword(ADMIN_PASSWORD)
        user = await prisma.user.create({
          data: { phone, name: 'Admin', role: 'ADMIN', password: hashed },
        })
      }
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
      }
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

    if (!user) {
      return NextResponse.json({ error: 'Phone not registered. Please create an account.' }, { status: 404 })
    }
    if (user.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Not a captain account' }, { status: 403 })
    }
    if (!user.password) {
      return NextResponse.json({ error: 'No password set. Please register again.' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, role: 'CAPTAIN', phone: user.phone })
    const res = NextResponse.json({ success: true, role: 'CAPTAIN' })
    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err) {
    console.error('captain-login error:', err)
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 })
  }
}
