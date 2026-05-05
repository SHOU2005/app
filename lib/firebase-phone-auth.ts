'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyCk1e3yCrlsn0V6qDa43OwTeLaYuNKX2sE',
  authDomain:        'hearus-4f2fe.firebaseapp.com',
  projectId:         'hearus-4f2fe',
  storageBucket:     'hearus-4f2fe.appspot.com',
  messagingSenderId: '616412616901',
  appId:             '1:616412616901:web:5f83157adc3e01fd1478ac',
}

const CONTAINER_ID = 'sw-rc-root'

let _auth: ReturnType<typeof getAuth> | null = null
let _verifier: RecaptchaVerifier | null = null

function getAuth_() {
  if (_auth) return _auth
  const app = getApps().find(a => a.name === 'switchnow') ?? initializeApp(FIREBASE_CONFIG, 'switchnow')
  _auth = getAuth(app)
  return _auth
}

function getContainer(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = CONTAINER_ID
    el.style.cssText = 'position:fixed;bottom:0;right:0;z-index:-1;opacity:0;pointer-events:none;width:1px;height:1px'
    document.body.appendChild(el)
  }
  return el
}

function resetVerifier() {
  if (_verifier) {
    try { _verifier.clear() } catch {}
    _verifier = null
  }
  // Clear inner html so reCAPTCHA can re-render fresh
  const el = document.getElementById(CONTAINER_ID)
  if (el) el.innerHTML = ''
}

function buildVerifier(): RecaptchaVerifier {
  const auth = getAuth_()
  getContainer() // ensure container exists in DOM
  return new RecaptchaVerifier(auth, CONTAINER_ID, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': resetVerifier,
  })
}

const ERROR_MAP: Record<string, string> = {
  'auth/invalid-phone-number':      'Invalid phone number.',
  'auth/too-many-requests':         'Too many attempts. Please wait a few minutes and try again.',
  'auth/captcha-check-failed':      'reCAPTCHA check failed. Reload the page and try again.',
  'auth/invalid-app-credential':    'reCAPTCHA failed. Reload the page and try again.',
  'auth/quota-exceeded':            'SMS quota exceeded. Try again later.',
  'auth/billing-not-enabled':       'Firebase billing not enabled.',
  'auth/user-disabled':             'This number has been disabled.',
  'auth/invalid-verification-code': 'Wrong OTP. Please check and try again.',
  'auth/code-expired':              'OTP expired. Please request a new one.',
  'auth/session-expired':           'Session expired. Please request a new OTP.',
  'auth/missing-verification-code': 'Please enter the 6-digit OTP.',
}

export async function sendPhoneCode(phoneDigits: string): Promise<void> {
  resetVerifier()
  _verifier = buildVerifier()
  try {
    const result = await signInWithPhoneNumber(getAuth_(), `+91${phoneDigits}`, _verifier)
    ;(window as any).__fbConfirm = result
  } catch (err: any) {
    resetVerifier()
    throw new Error(ERROR_MAP[err?.code] ?? err?.message ?? 'Failed to send OTP. Please try again.')
  }
}

export async function confirmPhoneCode(code: string): Promise<{ idToken: string; phone: string }> {
  const result = (window as any).__fbConfirm
  if (!result) throw new Error('Session expired. Please request a new OTP.')
  try {
    const cred    = await result.confirm(code)
    const idToken = await cred.user.getIdToken()
    const phone   = (cred.user.phoneNumber ?? '').replace(/^\+91/, '')
    ;(window as any).__fbConfirm = null
    resetVerifier()
    return { idToken, phone }
  } catch (err: any) {
    throw new Error(ERROR_MAP[err?.code] ?? err?.message ?? 'OTP verification failed.')
  }
}
