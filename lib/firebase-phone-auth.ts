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
    s.onerror = () => reject(new Error(`Failed to load Firebase scripts`))
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

// Renders a visible "I'm not a robot" checkbox and waits for the user to tick it.
// Visible reCAPTCHA works in Capacitor WebView as long as the domain is in Firebase
// Authorized Domains (Firebase Console → Authentication → Settings → Authorized domains).
function waitForRecaptcha(auth: any, containerId: string): Promise<void> {
  clearVerifier()
  return new Promise((resolve, reject) => {
    verifier = new (window as any).firebase.auth.RecaptchaVerifier(containerId, {
      size: 'normal',
      callback: () => resolve(),
      'expired-callback': () => {
        clearVerifier()
        reject(new Error('Verification expired. Tap Send OTP again.'))
      },
    }, auth.app)
    verifier.render().catch(reject)
  })
}

export async function sendPhoneCode(phoneDigits: string): Promise<string> {
  const auth = await getFirebaseAuth()
  const containerId = 'firebase-recaptcha'

  // Make container visible so user can see and tap the checkbox
  const el = document.getElementById(containerId)
  if (el) { el.style.display = 'flex'; el.style.justifyContent = 'center' }

  await waitForRecaptcha(auth, containerId)

  // Hide after solved
  if (el) el.style.display = 'none'

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
