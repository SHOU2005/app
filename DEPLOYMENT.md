# Switch – Deployment Guide

## Quick Start (Dev)

```bash
npm install
cp .env.example .env.local
# Fill in your DATABASE_URL and JWT_SECRET
npm run dev
# → http://localhost:3000
```

## Database Setup (PostgreSQL)

```bash
# With a real DATABASE_URL set:
npm run db:push       # Push schema to DB
npm run db:seed       # Seed demo data
npm run db:studio     # GUI browser for DB
```

### Demo Accounts (after seeding)
| Role     | Phone       | Password |
|----------|-------------|----------|
| Admin    | 9999999900  | admin123 |
| Employer | 9999999901  | demo123  |
| Worker   | 9999999902  | demo123  |

---

## Deploy to Vercel + Railway

### 1. Database (Railway)
1. Go to [railway.app](https://railway.app) → New Project → PostgreSQL
2. Copy the `DATABASE_URL` from Railway dashboard
3. Run schema push: `DATABASE_URL=<your-url> npm run db:push`

### 2. Deploy Frontend + API (Vercel)
```bash
npm install -g vercel
vercel login
vercel --prod
```

Set these environment variables in Vercel dashboard:
```
DATABASE_URL=<railway postgresql url>
JWT_SECRET=<random 32+ char string>
RAZORPAY_KEY_ID=<your razorpay key>
RAZORPAY_KEY_SECRET=<your razorpay secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<same as above>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Install as PWA (Android APK-like)
After deploying to Vercel:
1. Open the URL in Chrome on Android
2. Tap the 3-dot menu → "Add to Home Screen"
3. App installs like a native APK with splash screen

---

## Project Structure

```
switch/
├── app/
│   ├── page.tsx              ← Premium landing page
│   ├── login/page.tsx        ← Login with demo accounts
│   ├── register/page.tsx     ← Role-based registration
│   ├── employer/
│   │   ├── dashboard/        ← Shift overview + stats
│   │   ├── post-shift/       ← 3-step shift posting
│   │   ├── bookings/         ← All shifts + status filter
│   │   └── profile/          ← Account settings
│   ├── worker/
│   │   ├── dashboard/        ← Earnings + nearby jobs
│   │   ├── jobs/             ← Job feed with accept/reject
│   │   ├── earnings/         ← Full earnings history
│   │   ├── onboarding/       ← KYC: Aadhaar + selfie
│   │   └── profile/          ← Worker profile + skills
│   ├── admin/
│   │   ├── dashboard/        ← Platform stats + revenue
│   │   ├── workers/          ← KYC approval queue
│   │   ├── bookings/         ← All platform bookings
│   │   └── complaints/       ← Issue resolution
│   └── api/
│       ├── auth/             ← Login, register, me, logout
│       ├── shifts/           ← CRUD + matching
│       ├── bookings/         ← Booking lifecycle
│       ├── ratings/          ← Worker ratings
│       └── admin/            ← KYC, stats
├── components/
│   ├── ui/                   ← Button, Input, Badge, Avatar...
│   ├── shared/               ← BottomNav, TopBar, SplashScreen
│   ├── employer/             ← ShiftCard
│   └── worker/               ← WorkerCard
├── lib/
│   ├── auth.ts               ← JWT + bcrypt
│   ├── matching.ts           ← Haversine distance algorithm
│   ├── prisma.ts             ← DB client
│   └── utils.ts              ← Helpers + formatters
└── prisma/
    ├── schema.prisma         ← Full DB schema
    └── seed.ts               ← Demo data seeder
```

---

## Business Pricing Logic

| Who        | Amount     |
|------------|------------|
| Customer   | ₹200/hr    |
| Worker     | ₹150/hr    |
| Platform   | ₹50/hr     |
| Urgent fee | +₹99       |
| Replace    | +₹49       |

Implemented in `lib/utils.ts` → `calculateShiftCost()`

## Matching Algorithm

File: `lib/matching.ts`

Priority scoring (0–100):
1. **Distance** (50pts): Haversine formula, penalizes >10km
2. **Rating** (30pts): Worker rating × 30/5
3. **Experience** (20pts): Shifts completed (caps at 50)

Returns top 5 workers sorted by score.
