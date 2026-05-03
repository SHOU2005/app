'use client'

const AUTH_CONFIG = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY    || '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN     || 'relay-15824.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID || 'relay-15824',
  storageBucket:     'relay-15824.firebasestorage.app',
  messagingSenderId: '444335957190',
  appId:             '1:444335957190:web:d06c1343c6b6fb296de3c7',
  measurementId:     'G-P46ZYXQJ62',
}

const APP_NAME = 'relay-auth'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Firebase scripts'))
    document.head.appendChild(s)
  })
}

async function getFirebaseAuth(): Promise<any> {
  await loadScript('https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js')
  await loadScript('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth-compat.js')
  const fb = (window as any).firebase
  const existing = fb.apps?.find((a: any) => a.name === APP_NAME)
  const app = existing || fb.initializeApp(AUTH_CONFIG, APP_NAME)
  return fb.auth(app)
}

let verifier: any = null

function clearVerifier() {
  if (verifier) {
    try { verifier.clear() } catch {}
    verifier = null
  }
}

function ensureContainer(): string {
  const id = 'sw-recaptcha-root'
  if (!document.getElementById(id)) {
    const el = document.createElement('div')
    el.id = id
    el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    document.body.appendChild(el)
  }
  return id
}

export async function sendPhoneCode(phoneDigits: string): Promise<string> {
  const auth = await getFirebaseAuth()

  clearVerifier()

  const containerId = ensureContainer()
  verifier = new (window as any).firebase.auth.RecaptchaVerifier(
    containerId,
    { size: 'invisible' },
    auth.app,
  )

  try {
    const result = await auth.signInWithPhoneNumber(`+91${phoneDigits}`, verifier)
    ;(window as any).__firebaseConfirmation = result
    return result.verificationId || 'pending'
  } catch (err) {
    clearVerifier()
    throw err
  }
}

export async function confirmPhoneCode(code: string): Promise<{ idToken: string; phone: string }> {
  const result = (window as any).__firebaseConfirmation
  if (!result) throw new Error('No pending verification. Tap Send OTP first.')
  const credential = await result.confirm(code)
  const idToken: string = await credential.user.getIdToken()
  const phone: string   = credential.user.phoneNumber || ''
  ;(window as any).__firebaseConfirmation = null
  clearVerifier()
  return { idToken, phone }
}

export function isFirebaseAuthEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY
}
