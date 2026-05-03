export const metadata = {
  title: 'Privacy Policy – Switch',
  description: 'Privacy Policy for Switch worker and employer apps.',
}

export default function PrivacyPolicy() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '0 auto', padding: '40px 24px', color: '#111', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Last updated: 3 May 2026</p>

      <p>Switch ("we", "our", or "us") operates the Switch Worker and Switch Employer mobile applications (the "Apps"). This Privacy Policy explains what information we collect, why we collect it, and how we protect it.</p>

      <Section title="1. Information We Collect">
        <p><strong>Account information</strong> — name, mobile number, and password when you register.</p>
        <p><strong>Profile information</strong> — for workers: skills, city, profile photo, Aadhaar details (for KYC); for employers: company name and address.</p>
        <p><strong>Location</strong> — precise GPS location to show nearby jobs and auto-fill job addresses. We collect location only while the App is in use, unless you grant background location for active-shift tracking.</p>
        <p><strong>Camera &amp; photos</strong> — used to capture KYC documents (Aadhaar / selfie) and profile pictures. Images are uploaded securely and not shared with third parties.</p>
        <p><strong>SMS</strong> — read incoming SMS to auto-fill OTP during login/verification. We do not store or transmit SMS content.</p>
        <p><strong>Contacts</strong> — read contacts for the referral feature only. Contact data is never uploaded to our servers.</p>
        <p><strong>Phone state</strong> — device identifiers used for fraud prevention and to initiate calls to employers or support.</p>
        <p><strong>Payment information</strong> — payments are processed by Razorpay. We store only the transaction ID and amount; we never store card or bank details.</p>
        <p><strong>Usage data</strong> — crash reports, page views, and feature interactions to improve the Apps.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul style={{ paddingLeft: 20 }}>
          <li>Create and manage your account</li>
          <li>Match workers to relevant job shifts</li>
          <li>Process payments and issue earnings</li>
          <li>Send push notifications for job alerts and booking updates</li>
          <li>Auto-read OTP for seamless login</li>
          <li>Verify identity through KYC (workers only)</li>
          <li>Improve App performance and fix bugs</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing">
        <p>We do <strong>not</strong> sell your personal data. We share data only with:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Razorpay</strong> — payment processing</li>
          <li><strong>Firebase (Google)</strong> — push notifications</li>
          <li><strong>Supabase</strong> — secure cloud database hosting</li>
          <li><strong>Vercel</strong> — App hosting and serverless functions</li>
          <li><strong>Law enforcement</strong> — when required by applicable law</li>
        </ul>
        <p>Employers see a worker's name, rating, and phone number only after a booking is confirmed.</p>
      </Section>

      <Section title="4. Permissions We Request">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', border: '1px solid #e0e0e0' }}>Permission</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', border: '1px solid #e0e0e0' }}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Location (Fine &amp; Coarse)', 'Show nearby jobs; auto-fill address in job posting'],
              ['Background Location', 'Active shift tracking (requested separately)'],
              ['Camera', 'KYC document capture; profile photo'],
              ['Read &amp; Receive SMS', 'Auto-read OTP for login'],
              ['Read Contacts', 'Referral feature'],
              ['Call Phone', 'Direct call to employer or support'],
              ['Read Phone State', 'Device fraud prevention'],
              ['Post Notifications', 'Job alerts, booking updates'],
              ['Vibrate', 'Alert for urgent nearby jobs'],
              ['Storage / Media', 'Upload KYC documents and profile images'],
              ['Microphone', 'Voice-based job search (future feature)'],
              ['Biometric', 'Quick login via fingerprint'],
            ].map(([perm, purpose]) => (
              <tr key={perm}>
                <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0', fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: perm }} />
                <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="5. Data Retention">
        <p>We retain your data for as long as your account is active. You may request deletion by contacting us at the address below. Booking and payment records are retained for 7 years to meet legal and tax requirements.</p>
      </Section>

      <Section title="6. Data Security">
        <p>All data is transmitted over HTTPS (TLS 1.2+). Passwords are hashed with bcrypt. Sensitive fields (Aadhaar numbers) are encrypted at rest. Access to production databases is restricted to authorised personnel only.</p>
      </Section>

      <Section title="7. Children's Privacy">
        <p>The Apps are not directed at children under 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us data, contact us immediately and we will delete it.</p>
      </Section>

      <Section title="8. Your Rights">
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
          <li><strong>Correction</strong> — update inaccurate information via your in-app profile</li>
          <li><strong>Deletion</strong> — request account and data deletion</li>
          <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
          <li><strong>Withdraw consent</strong> — revoke any permission via your device settings</li>
        </ul>
      </Section>

      <Section title="9. Third-Party Links">
        <p>The Apps may link to external websites or services (e.g., Google Maps). We are not responsible for the privacy practices of those third parties.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you via a push notification or in-app message when we make material changes. Continued use of the Apps after changes constitutes acceptance.</p>
      </Section>

      <Section title="11. Contact Us">
        <p>If you have any questions about this Privacy Policy or wish to exercise your data rights, contact us at:</p>
        <p style={{ background: '#f5f5f5', padding: '16px 20px', borderRadius: 10, marginTop: 8 }}>
          <strong>Switch</strong><br />
          Email: <a href="mailto:support@switchnow.in" style={{ color: '#111' }}>support@switchnow.in</a><br />
          App ID (Worker): com.switchnow.workerapp<br />
          App ID (Employer): com.switchnow.employerapp
        </p>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, borderBottom: '2px solid #f0f0f0', paddingBottom: 8 }}>{title}</h2>
      {children}
    </section>
  )
}
