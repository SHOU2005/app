import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, COOKIE_CONFIG } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, name, password, city } = await req.json()

    if (!phone || !name?.trim() || !password) {
      return NextResponse.json({ error: 'Phone, name and password are required' }, { status: 400 })
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: 'Phone already registered. Please login.' }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { phone, name: name.trim(), role: 'CAPTAIN', password: hashed },
    })

    await prisma.captainProfile.create({
      data: { userId: user.id, territory: city?.trim() || null, status: 'PENDING' },
    })

    const token = signToken({ userId: user.id, role: 'CAPTAIN', phone: user.phone })
    const res = NextResponse.json({ success: true, role: 'CAPTAIN' })
    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err) {
    console.error('captain-register error:', err)
    return NextResponse.json({ error: 'Registration failed. Try again.' }, { status: 500 })
  }
}
