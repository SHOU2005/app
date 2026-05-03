export async function sendSMS(to: string, otp: string): Promise<void> {
  // In production: integrate MSG91 / Fast2SMS / Twilio here
  console.log(`\n📱 OTP for +91${to} → ${otp}\n`)
}

export function buildOTPMessage(otp: string): string {
  return `${otp} is your Switch OTP. Valid for 10 minutes. Do not share with anyone.`
}
