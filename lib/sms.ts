// SMS OTP sender — tries providers in order: Fast2SMS → 2Factor → Twilio → console (dev)

async function sendFast2SMS(to: string, otp: string): Promise<void> {
  // route 'otp' uses Fast2SMS OTP template — no DLT registration required
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method:  'POST',
    headers: {
      authorization: process.env.FAST2SMS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route:     'otp',
      variables_values: otp,
      flash:     0,
      numbers:   to,
    }),
  })
  const data = await res.json()
  if (!res.ok || data.return === false) {
    throw new Error(`Fast2SMS error: ${JSON.stringify(data)}`)
  }
}

async function sendTwoFactor(to: string, otp: string): Promise<void> {
  const key = process.env.TWOFACTOR_API_KEY!
  const url  = `https://2factor.in/API/V1/${key}/SMS/+91${to}/${otp}/AUTOGEN3`
  const res  = await fetch(url)
  const data = await res.json()
  if (data.Status !== 'Success') {
    throw new Error(`2Factor error: ${JSON.stringify(data)}`)
  }
}

async function sendTwilio(to: string, message: string): Promise<void> {
  const twilio = (await import('twilio')).default
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to:   `+91${to}`,
  })
}

export async function sendSMS(to: string, otp: string): Promise<void> {
  // Fast2SMS — try first, fall through on failure (requires website verification for OTP route)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      await sendFast2SMS(to, otp)
      return
    } catch (e) {
      console.warn('[SMS] Fast2SMS failed, trying next provider:', e)
    }
  }

  // 2Factor — Indian OTP gateway
  if (process.env.TWOFACTOR_API_KEY) {
    try {
      await sendTwoFactor(to, otp)
      return
    } catch (e) {
      console.warn('[SMS] 2Factor failed, trying next provider:', e)
    }
  }

  // Twilio — international fallback
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    await sendTwilio(to, buildOTPMessage(otp))
    return
  }

  // Dev fallback — print to terminal
  console.log(`\n[SMS-DEV] ──────────────────────────────`)
  console.log(`  To  : +91 ${to}`)
  console.log(`  OTP : ${otp}`)
  console.log(`────────────────────────────────────────\n`)
}

export function buildOTPMessage(otp: string): string {
  return `${otp} is your Switch OTP. Valid for 10 minutes. Do not share with anyone.`
}
