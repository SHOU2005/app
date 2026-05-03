import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_CONFIG } from '@/lib/auth'

const PROJECT_ID   = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID || 'hearus-4f2fe'
const API_KEY      = process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY    || ''
const CREDS_B64    = process.env.HEARUS_FIREBASE_CREDENTIALS_BASE64   || ''

// ── Option A: Admin SDK via service account (preferred when HEARUS_FIREBASE_CREDENTIALS_BASE64 is set)
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
      } catch {
        return null
      }
    }
    return adminVerify
  } catch {
    return null
  }
}

// ── Option B: REST accounts:lookup (fallback when only API_KEY is available)
async function verifyViaREST(idToken: string): Promise<{ phone: string } | null> {
  if (!API_KEY) return null
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const user = data.users?.[0]
    if (!user?.phoneNumber) return null
    const phone = user.phoneNumber.replace(/^\+91/, '')
    return { phone }
  } catch {
    return null
  }
}

async function verifyFirebaseIdToken(idToken: string): Promise<{ phone: string } | null> {
  const adminFn = await getAdminVerifier()
  if (adminFn) return adminFn(idToken)
  return verifyViaREST(idToken)
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, role, referralCode } = await req.json()

    if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 })
    }

    const verified = await verifyFirebaseIdToken(idToken)
    if (!verified) {
      return NextResponse.json({ error: 'Invalid or expired Firebase token' }, { status: 401 })
    }

    const { phone } = verified
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Could not extract phone number from token' }, { status: 400 })
    }

    const ADMIN_PHONE = '9205617375'

    // Resolve referral code → captainProfileId
    let captainRefId: string | undefined
    if (referralCode) {
      const cap = await prisma.captainProfile.findUnique({ where: { referralCode: String(referralCode).toUpperCase().trim() } })
      if (cap) captainRefId = cap.id
    }

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

    const response = NextResponse.json({ success: true, role: tokenRole })
    response.cookies.set(COOKIE_CONFIG.name, token, COOKIE_CONFIG.options)
    return response
  } catch (err) {
    console.error('firebase-verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
