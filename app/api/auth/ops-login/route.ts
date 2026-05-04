import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_CONFIG } from '@/lib/auth'
import { ADMIN_PHONE } from '@/lib/config'

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
      return NextResponse.json({ error: 'Account not found' }, { status: 401 })
    }

    // Only ADMIN or OPS users can access the ops portal
    if (user.role !== 'ADMIN' && user.role !== 'OPS') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'No password set for this account.' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    await prisma.opsProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    })

    const token = signToken({ userId: user.id, role: 'OPS', phone: user.phone })
    const res = NextResponse.json({ success: true, role: 'OPS' })
    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err) {
    console.error('ops-login error:', err)
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 })
  }
}
