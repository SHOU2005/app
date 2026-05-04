'use client'

// hearus-4f2fe Firebase project config (public client-side values)
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyCk1e3yCrlsn0V6qDa43OwTeLaYuNKX2sE',
  authDomain:        'hearus-4f2fe.firebaseapp.com',
  projectId:         'hearus-4f2fe',
  storageBucket:     'hearus-4f2fe.appspot.com',
  messagingSenderId: '616412616901',
  appId:             '1:616412616901:web:5f83157adc3e01fd1478ac',
}

const APP_NAME = 'switchnow'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load: ${src}`))
    document.head.appendChild(s)
  })
}

async function getFirebaseAuth(): Promise<any> {
  await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js')
  await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js')
  const fb = (window as any).firebase
  const existing = fb.apps?.find((a: any) => a.name === APP_NAME)
  const app = existing ?? fb.initializeApp(FIREBASE_CONFIG, APP_NAME)
  return fb.auth(app)
}

let verifier: any = null

function clearVerifier() {
  if (verifier) {
    try { verifier.clear() } catch {}
    verifier = null
  }
  // Remove old container so it can be recreated fresh
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
  const auth = await getFirebaseAuth()
  clearVerifier()
  const container = createContainer()

  verifier = new (window as any).firebase.auth.RecaptchaVerifier(container, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => { clearVerifier() },
  }, auth.app)

  try {
    const result = await auth.signInWithPhoneNumber(`+91${phoneDigits}`, verifier)
    ;(window as any).__fbConfirm = result
    return 'sent'
  } catch (err: any) {
    clearVerifier()
    // Surface a human-readable message
    const msg: Record<string, string> = {
      'auth/billing-not-enabled':  'Firebase billing not enabled. Enable reCAPTCHA Enterprise API in Google Cloud Console.',
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
