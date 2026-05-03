export async function sendSMS(to: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY

  if (!apiKey) {
    // No SMS provider configured — print OTP to server console for dev/testing
    console.log(`\n📱 OTP for +91${to} → ${otp}\n`)
    return
  }

  try {
    const res = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}` +
      `&route=otp&variables_values=${otp}&flash=0&numbers=${to}`,
      { method: 'GET' }
    )
    const data = await res.json()
    if (!data.return) console.error('[Fast2SMS]', data.message)
  } catch (err) {
    console.error('[SMS] Delivery failed, OTP was:', otp, err)
  }
}

export function buildOTPMessage(otp: string): string {
  return `${otp} is your Switch OTP. Valid for 10 minutes. Do not share with anyone.`
}
