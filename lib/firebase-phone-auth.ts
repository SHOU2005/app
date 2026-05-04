'use client'

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'

// Firebase client config is public by design — safe to hardcode
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyCk1e3yCrlsn0V6qDa43OwTeLaYuNKX2sE',
  authDomain:        'hearus-4f2fe.firebaseapp.com',
  projectId:         'hearus-4f2fe',
  storageBucket:     'hearus-4f2fe.appspot.com',
  messagingSenderId: '616412616901',
  appId:             '1:616412616901:web:5f83157adc3e01fd1478ac',
}

const APP_NAME = 'switchnow'

function getFirebaseAuth() {
  const app = getApps().find(a => a.name === APP_NAME) ?? initializeApp(FIREBASE_CONFIG, APP_NAME)
  const auth = getAuth(app)
  if (process.env.NODE_ENV === 'development') {
    auth.settings.appVerificationDisabledForTesting = true
  }
  return auth
}

let verifier: RecaptchaVerifier | null = null

function clearVerifier() {
  if (verifier) {
    try { verifier.clear() } catch {}
    verifier = null
  }
  const old = document.getElementById('sw-rc-root')
  if (old) old.remove()
}

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.id = 'sw-rc-root'
  el.style.cssText = 'position:fixed;bottom:0;right:0;width:0;height:0;overflow:hidden;z-index:-1'
  document.body.appendChild(el)
  return el
}

export async function sendPhoneCode(phoneDigits: string): Promise<string> {
  const auth = getFirebaseAuth()
  clearVerifier()
  const container = createContainer()

  verifier = new RecaptchaVerifier(auth, container, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => { clearVerifier() },
  })

  try {
    await verifier.render()
    const result = await signInWithPhoneNumber(auth, `+91${phoneDigits}`, verifier)
    ;(window as any).__fbConfirm = result
    return 'sent'
  } catch (err: any) {
    clearVerifier()
    const msg: Record<string, string> = {
      'auth/billing-not-enabled':  'Firebase billing not enabled. Enable in Google Cloud Console.',
      'auth/invalid-phone-number': 'Invalid phone number.',
      'auth/too-many-requests':    'Too many attempts. Please wait and try again.',
      'auth/captcha-check-failed': 'reCAPTCHA check failed. Reload and try again.',
    }
    throw new Error(msg[err?.code] ?? err?.message ?? 'Failed to send OTP')
  }
}

export async function confirmPhoneCode(code: string): Promise<{ idToken: string; phone: string }> {
  const result = (window as any).__fbConfirm
  if (!result) throw new Error('Session expired. Please tap Send OTP again.')
  try {
    const credential = await result.confirm(code)
    const idToken: string = await credential.user.getIdToken()
    const phone: string   = (credential.user.phoneNumber || '').replace(/^\+91/, '')
    ;(window as any).__fbConfirm = null
    clearVerifier()
    return { idToken, phone }
  } catch (err: any) {
    const msg: Record<string, string> = {
      'auth/invalid-verification-code': 'Wrong OTP. Please check and try again.',
      'auth/code-expired':              'OTP expired. Please request a new one.',
    }
    throw new Error(msg[err?.code] ?? err?.message ?? 'OTP verification failed')
  }
}
