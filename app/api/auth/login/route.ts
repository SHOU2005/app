import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_CONFIG } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  phone:    z.string().length(10),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const user = await prisma.user.findUnique({
      where:   { phone: data.phone },
      include: { workerProfile: true, employerProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Phone not registered. Please create an account.' }, { status: 401 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'No password set. Please register again to set a password.' }, { status: 401 })
    }

    if (!(await comparePassword(data.password, user.password))) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }

    const token = signToken({ userId: user.id, role: user.role as 'EMPLOYER' | 'WORKER' | 'ADMIN' | 'CAPTAIN' | 'OPS', phone: user.phone })

    const res = NextResponse.json({
      user: {
        id:              user.id,
        name:            user.name,
        phone:           user.phone,
        role:            user.role,
        avatar:          user.avatar,
        workerProfile:   user.workerProfile,
        employerProfile: user.employerProfile,
      },
    })

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
