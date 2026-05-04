import { prisma } from './prisma'

const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send'
// Use legacy server key if set; FIREBASE_CREDENTIALS_BASE64 is accepted as an alias
const SERVER_KEY = process.env.FIREBASE_SERVER_KEY || ''

export interface PushPayload {
  title: string
  body:  string
  url?:  string
  data?: Record<string, string>
}

// Send to a single FCM token
async function sendToToken(token: string, payload: PushPayload): Promise<boolean> {
  if (!SERVER_KEY) {
    console.log(`[FCM-DEV] push to ${token.slice(0, 20)}… — "${payload.title}: ${payload.body}"`)
    return true
  }

  const res = await fetch(FCM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `key=${SERVER_KEY}`,
    },
    body: JSON.stringify({
      to: token,
      notification: { title: payload.title, body: payload.body, icon: '/icon-192.png', click_action: payload.url || '/' },
      data: { ...payload.data, url: payload.url || '/' },
      priority: 'high',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[FCM] send failed:', res.status, text)
    return false
  }

  const json = await res.json()
  // success: 1 means delivered; failure means token is stale — clean it
  if (json.failure === 1) {
    console.warn('[FCM] stale token, clearing from DB')
    await prisma.user.updateMany({ where: { fcmToken: token }, data: { fcmToken: null } })
    return false
  }
  return true
}

// Send to a user by userId (looks up their FCM token + saves to Notification table)
export async function pushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  // 1. Persist notification in DB regardless of push success
  await prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      body:  payload.body,
      data:  payload.data ? JSON.stringify(payload.data) : undefined,
    },
  })

  // 2. Look up FCM token
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } })
  if (user?.fcmToken) {
    await sendToToken(user.fcmToken, payload).catch(console.error)
  }
}

// ── Pre-built notification helpers ────────────────────────────────────────────

export async function notifyWorkerAssigned(employerId: string, workerName: string, jobTitle: string, jobId: string) {
  await pushToUser(employerId, {
    title: `Worker assigned — ${jobTitle}`,
    body:  `${workerName} is on the way to your location`,
    url:   `/employer/job/${jobId}`,
    data:  { type: 'WORKER_ASSIGNED', jobId },
  })
}

export async function notifyNewJob(workerId: string, jobTitle: string, location: string, shiftId: string) {
  await pushToUser(workerId, {
    title: `New job near you — ${jobTitle}`,
    body:  `${location} · Tap to view details`,
    url:   `/worker/jobs`,
    data:  { type: 'NEW_JOB', shiftId },
  })
}

export async function notifyJobStarted(workerId: string, jobTitle: string, jobId: string) {
  await pushToUser(workerId, {
    title: 'Job started ✅',
    body:  `Your shift for "${jobTitle}" has begun. Good luck!`,
    url:   `/worker/shifts`,
    data:  { type: 'JOB_STARTED', jobId },
  })
}

export async function notifyJobCompleted(workerId: string, amount: number, jobTitle: string) {
  await pushToUser(workerId, {
    title: `Shift complete — ₹${amount} earned`,
    body:  `Great work on "${jobTitle}"! Payment will be processed shortly.`,
    url:   `/worker/earnings`,
    data:  { type: 'JOB_COMPLETED' },
  })
}

export async function notifyPaymentReceived(workerId: string, amount: number) {
  await pushToUser(workerId, {
    title: `₹${amount} credited to your account`,
    body:  'Payment received. Check your earnings.',
    url:   `/worker/earnings`,
    data:  { type: 'PAYMENT_RECEIVED' },
  })
}
