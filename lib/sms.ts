// SMS sending removed — OTP is handled entirely by Firebase Phone Auth.
// This stub exists only so existing imports don't break during the transition.

export async function sendSMS(_to: string, _otp: string): Promise<void> {
  console.log(`[SMS] Firebase handles OTP delivery. No external SMS provider configured.`)
}

export function buildOTPMessage(otp: string): string {
  return `${otp} is your Switch OTP. Valid for 10 minutes. Do not share with anyone.`
}
