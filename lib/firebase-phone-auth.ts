'use client'

const AUTH_CONFIG = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_AUTH_API_KEY    || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN     || 'hearus-4f2fe.firebaseapp.com',
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID || 'hearus-4f2fe',
}

const APP_NAME = 'hearus'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

async function getFirebaseAuth(): Promise<any> {
  await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
  await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js')

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

function createVerifier(auth: any, containerId: string): any {
  clearVerifier()
  verifier = new (window as any).firebase.auth.RecaptchaVerifier(containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => { clearVerifier() },
  }, auth.app)
  return verifier
}

export async function sendPhoneCode(phoneDigits: string): Promise<string> {
  const auth = await getFirebaseAuth()

  // Ensure reCAPTCHA container exists in DOM
  let container = document.getElementById('firebase-recaptcha')
  if (!container) {
    container = document.createElement('div')
    container.id = 'firebase-recaptcha'
    document.body.appendChild(container)
  }

  // Always create a fresh verifier — stale token causes Firebase to fall back to voice call
  const rv = createVerifier(auth, 'firebase-recaptcha')
  const fullPhone = `+91${phoneDigits}`

  try {
    const result = await auth.signInWithPhoneNumber(fullPhone, rv)
    ;(window as any).__firebaseConfirmation = result
    return result.verificationId || 'pending'
  } catch (err) {
    clearVerifier()
    throw err
  }
}

export async function confirmPhoneCode(code: string): Promise<{ idToken: string; phone: string }> {
  const result = (window as any).__firebaseConfirmation
  if (!result) throw new Error('No pending verification. Call sendPhoneCode first.')

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
