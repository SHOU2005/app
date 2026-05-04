import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_CONFIG } from '@/lib/auth'
import { ADMIN_PHONE, isValidRole } from '@/lib/config'

const API_KEY   = process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY  || ''
const CREDS_B64 = process.env.HEARUS_FIREBASE_CREDENTIALS_BASE64 || ''

let adminVerify: ((token: string) => Promise<{ phone: string } | null>) | null = null

async function getAdminVerifier() {
  if (adminVerify) return adminVerify
  if (!CREDS_B64) return null
  try {
    const admin = (await import('firebase-admin')).default
    const creds   = JSON.parse(Buffer.from(CREDS_B64, 'base64').toString('utf-8'))
    const appName = 'hearus-admin'
    const app = admin.apps.find(a => a?.name === appName)
      || admin.initializeApp({ credential: admin.credential.cert(creds) }, appName)
    const auth = admin.auth(app)
    adminVerify = async (idToken: string) => {
      try {
        const decoded = await auth.verifyIdToken(idToken)
        const phone = (decoded.phone_number || '').replace(/^\+91/, '')
        if (!phone) return null
        return { phone }
      } catch { return null }
    }
    return adminVerify
  } catch { return null }
}

async function verifyViaREST(idToken: string): Promise<{ phone: string } | null> {
  if (!API_KEY) return null
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const user = data.users?.[0]
    if (!user?.phoneNumber) return null
    return { phone: user.phoneNumber.replace(/^\+91/, '') }
  } catch { return null }
}

async function verifyFirebaseIdToken(idToken: string): Promise<{ phone: string } | null> {
  const adminFn = await getAdminVerifier()
  if (adminFn) return adminFn(idToken)
  return verifyViaREST(idToken)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      idToken, role, referralCode,
      name: providedName,
      city,
      companyName,
      ownerName,
      territory,
    } = body

    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 })

    // Validate requested role
    if (role && !isValidRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const verified = await verifyFirebaseIdToken(idToken)
    if (!verified) return NextResponse.json({ error: 'Invalid or expired Firebase token' }, { status: 401 })

    const { phone } = verified
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Could not extract phone number from token' }, { status: 400 })
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
      const displayName = providedName?.trim() || `User ${phone.slice(-4)}`

      if (phone === ADMIN_PHONE) {
        user = await prisma.user.create({
          data: { phone, name: displayName, role: 'ADMIN', password: '' },
        })
      } else if (role === 'CAPTAIN') {
        user = await prisma.user.create({
          data: { phone, name: displayName, role: 'CAPTAIN', password: '' },
        })
        await prisma.captainProfile.create({
          data: { userId: user.id, status: 'PENDING', ...(territory ? { territory } : {}) },
        })
      } else if (role === 'OPS') {
        user = await prisma.user.create({
          data: { phone, name: displayName, role: 'OPS', password: '' },
        })
        await prisma.opsProfile.create({ data: { userId: user.id } })
      } else {
        const userRole = (role === 'EMPLOYER' ? 'EMPLOYER' : 'WORKER') as 'EMPLOYER' | 'WORKER'
        user = await prisma.user.create({
          data: {
            phone,
            name: displayName,
            role: userRole,
            password: '',
            ...(captainRefId ? { captainReferralId: captainRefId } : {}),
          },
        })
        if (userRole === 'WORKER') {
          await prisma.workerProfile.create({
            data: {
              userId: user.id,
              ...(captainRefId ? { captainReferralId: captainRefId } : {}),
              ...(city ? { city } : {}),
            },
          })
        } else {
          await prisma.employerProfile.create({
            data: {
              userId: user.id,
              ...(captainRefId ? { captainReferralId: captainRefId } : {}),
              ...(city ? { city } : {}),
              ...(companyName ? { companyName } : {}),
              ...(ownerName ? { ownerName } : {}),
            },
          })
        }
      }
    } else if (providedName?.trim() && user.name !== providedName.trim()) {
      // Update name on login if provided (e.g. registration re-attempt)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: providedName.trim() },
      })
    }

    const isAdmin = phone === ADMIN_PHONE

    // For existing users logging in via a specific app, honour the requested role
    // if they already have (or just created) a profile for it.
    let tokenRole: 'EMPLOYER' | 'WORKER' | 'ADMIN' | 'CAPTAIN' | 'OPS'
    if (isAdmin) {
      tokenRole = (role || 'WORKER') as typeof tokenRole
    } else if (role && role !== user.role) {
      // Verify the user actually has a profile for the requested role before issuing that token
      let hasProfile = false
      if (role === 'CAPTAIN') {
        hasProfile = !!(await prisma.captainProfile.findUnique({ where: { userId: user.id } }))
        if (!hasProfile) {
          // Auto-create profile so captain registration from login page works
          await prisma.captainProfile.create({ data: { userId: user.id, status: 'PENDING', ...(territory ? { territory } : {}) } })
          await prisma.user.update({ where: { id: user.id }, data: { role: 'CAPTAIN' } })
          hasProfile = true
        }
      } else if (role === 'OPS') {
        hasProfile = !!(await prisma.opsProfile.findUnique({ where: { userId: user.id } }))
        if (!hasProfile) {
          await prisma.opsProfile.create({ data: { userId: user.id } })
          await prisma.user.update({ where: { id: user.id }, data: { role: 'OPS' } })
          hasProfile = true
        }
      } else if (role === 'EMPLOYER') {
        hasProfile = !!(await prisma.employerProfile.findUnique({ where: { userId: user.id } }))
        if (!hasProfile) {
          await prisma.employerProfile.create({ data: { userId: user.id, ...(city ? { city } : {}), ...(companyName ? { companyName } : {}) } })
          await prisma.user.update({ where: { id: user.id }, data: { role: 'EMPLOYER' } })
          hasProfile = true
        }
      } else if (role === 'WORKER') {
        hasProfile = !!(await prisma.workerProfile.findUnique({ where: { userId: user.id } }))
        if (!hasProfile) {
          await prisma.workerProfile.create({ data: { userId: user.id, ...(city ? { city } : {}) } })
          await prisma.user.update({ where: { id: user.id }, data: { role: 'WORKER' } })
          hasProfile = true
        }
      }
      tokenRole = hasProfile ? (role as typeof tokenRole) : (user.role as typeof tokenRole)
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
    const response = NextResponse.json({ success: true, role: tokenRole })
    response.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return response
  } catch (err) {
    console.error('firebase-verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
