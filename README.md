# Tend MVP

Tend is a Next.js 14 MVP for booking local service providers. Customers browse providers, select an available slot, pay through Paystack, and review completed bookings. Providers manage their profile, services, hours, active status, bookings, and Google Calendar-backed availability.

## Stack

- Next.js 14 App Router with TypeScript
- PostgreSQL with Prisma
- Auth.js / NextAuth Google OAuth
- Google Calendar API through `googleapis`
- Paystack checkout and signed webhooks
- Resend-backed `sendEmail()` abstraction
- Tailwind CSS with flat solid colors only

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
RESEND_API_KEY=
CANCELLATION_WINDOW_HOURS=24
ENCRYPTION_KEY=
SOLANA_RPC_URL=
MERCHANT_WALLET_PUBLIC_KEY=
```

For local development, set `NEXTAUTH_URL` to your local app URL. In production, set it to the deployed Vercel URL.

`ENCRYPTION_KEY` can be any long random secret. It is hashed to an AES-256 key for stored Google refresh tokens.

3. Run migrations and seed local data:

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. Start the app:

```bash
npm run dev
```

## Payment And Booking Rules

- Booking creation stores `PENDING_PAYMENT` and initializes Paystack checkout.
- `/api/webhooks/paystack` verifies `x-paystack-signature` before trusting the payload.
- Only the webhook changes a paid booking to `CONFIRMED`.
- Payment confirmation, cancellation state changes, refunds, and review aggregation use Prisma transactions around local database changes.
- Confirmed bookings create a provider Google Calendar event after the Paystack webhook succeeds.
- Rescheduling updates the same booking row and patches the existing Google Calendar event.
- Cancellation uses `CANCELLATION_WINDOW_HOURS` to decide whether to request a full Paystack refund.

## API Surface

- `POST /api/auth/[...nextauth]`
- `POST /api/onboarding/role`
- `GET /api/providers`
- `GET /api/providers/[id]`
- `POST /api/providers/me`
- `POST /api/providers/me/open-hours`
- `POST /api/providers/me/services`
- `PATCH /api/providers/me/services/[id]`
- `GET /api/providers/[id]/availability?date=YYYY-MM-DD&serviceId=...`
- `POST /api/bookings`
- `POST /api/webhooks/paystack`
- `PATCH /api/bookings/[id]/cancel`
- `PATCH /api/bookings/[id]/reschedule`
- `POST /api/bookings/[id]/review`
- `GET /api/bookings/me`
- `GET /api/bookings/provider`
- `POST /api/cron/reminders`

## Vercel Cron

Configure a cron job to hit:

```text
POST /api/cron/reminders
```

The route marks elapsed bookings as `COMPLETED` and sends 24-hour and 1-hour reminder emails when the request falls inside the reminder window.

## Solana Pay Demo Checkout

This demo flow adds a Solana Pay checkout without changing the existing Paystack booking flow. Set `MERCHANT_WALLET_PUBLIC_KEY` to the receiving wallet address. `SOLANA_RPC_URL` is optional and defaults to Solana devnet.

To test:

```bash
solana config set --url devnet
solana airdrop 2
npm install
npm run prisma:migrate
npm run dev
```

Open a booking confirmation screen that renders `SolanaPayCheckout` with a booking id, then pay the QR code or wallet link using Phantom set to devnet. The status endpoint polls Solana devnet by payment reference and marks the booking payment as `CONFIRMED` after `validateTransfer()` confirms the recipient, amount, and reference.

## Stretch Goals Not Built

- Admin dashboard
- In-app messaging
- Multi-service bundles
- Provider payout and settlement tooling beyond receiving payment
- PostGIS-grade geo search
