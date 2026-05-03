/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'twilio', 'firebase-admin'],
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'res.cloudinary.com', 'ui-avatars.com'],
  },
  async headers() {
    return [
      {
        // Tell the WebView never to cache HTML — always re-fetch from the dev server.
        // This prevents stale chunk 404s after a server restart.
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
