import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, COOKIE_CONFIG } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name:     z.string().min(2),
  phone:    z.string().length(10),
  password: z.string().min(6),
  role:     z.enum(['EMPLOYER', 'WORKER']),
  city:     z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { phone: data.phone } })
    if (existing) {
      return NextResponse.json({ error: 'Phone already registered' }, { status: 409 })
    }

    const hashed = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name:     data.name,
        phone:    data.phone,
        password: hashed,
        role:     data.role,
        ...(data.role === 'EMPLOYER'
          ? { employerProfile: { create: { city: data.city } } }
          : { workerProfile:   { create: { city: data.city } } }),
      },
      include: { employerProfile: true, workerProfile: true },
    })

    const token = signToken({ userId: user.id, role: user.role as 'EMPLOYER' | 'WORKER' | 'ADMIN', phone: user.phone })

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      token,
    }, { status: 201 })

    res.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return res
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
