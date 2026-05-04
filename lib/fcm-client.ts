'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDviuzdGV3ZANmLNi8om0oE0ruXysSAzvc',
  authDomain:        'hearus-4f2fe.firebaseapp.com',
  databaseURL:       'https://hearus-4f2fe-default-rtdb.firebaseio.com',
  projectId:         'hearus-4f2fe',
  storageBucket:     'hearus-4f2fe.appspot.com',
  messagingSenderId: '616412616901',
  appId:             '1:616412616901:web:7b514459578ab2981478ac',
  measurementId:     'G-86G1T2CBPD',
}

const APP_NAME = 'switchnow'
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

function getFirebaseApp() {
  return getApps().find(a => a.name === APP_NAME) ?? initializeApp(FIREBASE_CONFIG, APP_NAME)
}

export async function registerFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null

  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    const app = getFirebaseApp()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg })

    if (!token) return null

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

export async function setupForegroundMessages(onMsg: (payload: any) => void) {
  if (typeof window === 'undefined') return
  try {
    const app = getFirebaseApp()
    const messaging = getMessaging(app)
    onMessage(messaging, onMsg)
  } catch (err) {
    console.warn('[FCM] foreground listener failed:', err)
  }
}
