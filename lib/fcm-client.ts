'use client'

// Firebase config — must match the service worker
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDPdQI8ev_YvRv1nN4QA_g19h8ohjJaj3M',
  authDomain:        'relay-15824.firebaseapp.com',
  projectId:         'relay-15824',
  storageBucket:     'relay-15824.firebasestorage.app',
  messagingSenderId: '444335957190',
  appId:             '1:444335957190:web:d06c1343c6b6fb296de3c7',
  measurementId:     'G-P46ZYXQJ62',
}

// VAPID key — from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// Add this to .env as NEXT_PUBLIC_FIREBASE_VAPID_KEY
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

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

async function getFirebaseMessaging(): Promise<any> {
  await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
  await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')
  const w = window as any
  if (!w.firebase.apps?.some((a: any) => a.name === '[DEFAULT]')) w.firebase.initializeApp(FIREBASE_CONFIG)
  return w.firebase.messaging()
}

export async function registerFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    // Ensure SW is registered
    if (!('serviceWorker' in navigator)) return null
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    const messaging = await getFirebaseMessaging()
    const token: string = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg })

    if (!token) return null

    // Save token to our backend
    await fetch('/api/push/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })

    return token
  } catch (err) {
    console.warn('[FCM] token registration failed:', err)
    return null
  }
}

export async function setupForegroundMessages(onMessage: (payload: any) => void) {
  if (typeof window === 'undefined') return
  try {
    const messaging = await getFirebaseMessaging()
    messaging.onMessage((payload: any) => onMessage(payload))
  } catch (err) {
    console.warn('[FCM] foreground listener failed:', err)
  }
}
