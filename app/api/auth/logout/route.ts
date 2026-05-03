import { NextResponse } from 'next/server'
import { COOKIE_CONFIG } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' })
  res.cookies.delete(COOKIE_CONFIG.name)
  return res
}
