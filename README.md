# TypedHand

Turn typed text into your own natural-looking handwriting, then export it as a
print-ready PDF. A commercial SaaS built with Next.js 15, Supabase, and Stripe.

- **Personal handwriting** — users fill in a template by hand, upload it, and we
  convert it to a TTF font. The editor writes only in the user's own hand.
- **Live editor** with adjustable size, spacing, line height, slant, messiness
  and rotation — rendered on A4 proportions, WYSIWYG PDF export.
- **Three tiers** — every tier gets unlimited exports and every editor control;
  they differ only by extras. Free (watermark, up to 2 fonts), Plus (€2.99, no
  watermark, up to 5 fonts), Pro (€5.99, multi-page PDFs, up to 10 fonts +
  Spanish/French templates). The internal tier key for Plus is still `student`.
- **Auth** via Supabase (email + password, email verification, password reset).
- **Billing** via Stripe (Checkout, Customer Portal, promo codes, webhooks).
- **Admin dashboard** with user and export stats.
- **Product analytics** — optional PostHog funnel tracking (landing → signup →
  export → upgrade); no-op without `NEXT_PUBLIC_POSTHOG_KEY`.

---

## Tech stack

| Concern   | Choice                                   |
| --------- | ---------------------------------------- |
| Framework | Next.js 15 (App Router) + React 19       |
| Styling   | Tailwind CSS                             |
| Auth + DB | Supabase (Postgres, Auth, Storage)       |
| Payments  | Stripe Billing                           |
| Exports   | Native canvas renderer + `jsPDF` (PDF)   |
| Fonts     | User-uploaded handwriting → TTF (font-worker); UI via `next/font` |
| Hosting   | Vercel                                   |

---

## 1. Local setup

```bash
git clone <your-repo> typedhand
cd typedhand
npm install
cp .env.local.example .env.local   # then fill in the values (see below)
npm run dev                        # http://localhost:3000
```

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable                            | Where to get it                                       |
| ----------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase → Project Settings → API                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase → Project Settings → API                     |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase → Project Settings → API (keep secret!)      |
| `STRIPE_SECRET_KEY`                 | Stripe → Developers → API keys                        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| Stripe → Developers → API keys                        |
| `STRIPE_WEBHOOK_SECRET`             | From `stripe listen` (local) or the Dashboard (prod)  |
| `STRIPE_PRICE_STUDENT`              | Stripe Price ID for the €2.99 product                 |
| `STRIPE_PRICE_PRO`                  | Stripe Price ID for the €5.99 product                 |
| `NEXT_PUBLIC_APP_URL`               | `http://localhost:3000` locally; your domain in prod  |
| `NEXT_PUBLIC_APP_NAME`              | `TypedHand`                                           |
| `NEXT_PUBLIC_APP_DOMAIN`            | `typedhand.com`                                       |

---

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`.
   This creates the `profiles` and `exports` tables, RLS policies, the
   new-user trigger, and the `personal-fonts` storage bucket (Phase 2).
3. In **Authentication → URL Configuration**, set the Site URL to your app URL
   and add `<APP_URL>/auth/callback` to the **Redirect URLs**.
4. (Optional) In **Authentication → Email**, confirm "Confirm email" is enabled
   so signups require verification.

### Create the admin account

The admin dashboard at `/admin` is gated on `profiles.is_admin`.

1. Sign up through the app with your admin email (and verify it).
2. In the Supabase SQL Editor, run:

   ```sql
   UPDATE public.profiles
   SET is_admin = true, tier = 'pro'
   WHERE email = 'admin@typedhand.com';   -- your admin email
   ```

---

## 3. Stripe setup

### Products and prices

1. In the Stripe Dashboard, create two **recurring** products:
   - **Student** — €2.99 / month → copy its Price ID into `STRIPE_PRICE_STUDENT`.
   - **Pro** — €5.99 / month → copy its Price ID into `STRIPE_PRICE_PRO`.

### Webhook (local development)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_…` secret it prints into `STRIPE_WEBHOOK_SECRET`. The handler
processes `checkout.session.completed`, `customer.subscription.updated`, and
`customer.subscription.deleted`.

### Webhook (production)

In **Developers → Webhooks**, add an endpoint pointing at
`https://typedhand.com/api/webhooks/stripe`, subscribe to the three events
above, and copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

### Customer Portal

Enable the **Customer Portal** in Stripe (Settings → Billing → Customer portal)
so the "Manage subscription" button works.

### Promo codes

Create codes under **Products → Coupons / Promotion codes** (e.g. `SCHOOL50`
for 50% off the first 3 months). Checkout already has
`allow_promotion_codes: true`, so the code field appears automatically — no
extra code needed.

---

## 4. Deploying to Vercel

1. Push the repo to GitHub and import it into Vercel.
2. Add every variable from the table above in **Project → Settings →
   Environment Variables** (set `NEXT_PUBLIC_APP_URL` to your production URL).
3. Deploy. Then:
   - Add the production webhook in Stripe (see above).
   - Add `<prod-url>/auth/callback` to Supabase Redirect URLs.

---

## 5. Before going live — legal pages ⚠️

`/impressum`, `/datenschutz`, and `/agb` ship as **placeholder structure only**
(marked with `[PLACEHOLDER]`). You **must** replace them with real content
before launch:

- **Datenschutz** — generate via
  [datenschutz-generator.de](https://www.datenschutz-generator.de).
- **Impressum** — your real provider details (§ 5 DDG; TMG was replaced by the
  Digitale-Dienste-Gesetz on 14 May 2024).
- **AGB** — have your subscription terms reviewed by a lawyer.

---

## Project structure

```
app/                 Routes (App Router) + API routes
components/           UI, layout, editor, landing, dashboard, auth components
lib/                  Supabase + Stripe clients, fonts, tier logic, constants
supabase/migrations/ SQL schema
middleware.ts        Route protection + session refresh
```

## Roadmap

Personal handwriting-font upload is **shipped** (template download → fill in by
hand → upload → TTF conversion via the `font-worker`, stored in the
`personal-fonts` bucket; saved PDF exports live in the `exports` bucket). Still
on the roadmap: social sharing, referrals, team accounts, and a mobile app.
