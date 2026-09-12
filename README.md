# Koolerr

AI Workforce Platform — V1

---

## Roadmap

The Active Execution Roadmap is **Phases 7–12** (see
[`Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md`](Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md)).
Founder-resolved **C1 Version A** binds this README and [`CLAUDE.md`](CLAUDE.md): Phase 7 is
complete. **Founder override (2026-09-12, sequencing only):** Phase 8 is **DEFERRED/HELD**;
the approved next slice is **Phase 9 Academy Catalog Search Foundation (Hermetic)** —
docs/spec only. Do **not** treat Tracker/`docs/status.json` Phase 8–10 complete claims as
next-step authority for this sequence.

| Phase  | Name                     | Status                                                                 |
| ------ | ------------------------ | ---------------------------------------------------------------------- |
| **7**  | Launch Readiness         | ✅ Complete (`phase-7-complete`)                                       |
| **8**  | Final Product Validation | **DEFERRED/HELD** (Founder 2026-09-12) — live-provider unresolved; hermetic evidence preserved; **not complete / not closed** |
| **9**  | Koolerr Academy          | **Next (docs/spec slice)** — Academy Catalog Search Foundation (Hermetic); **not complete / not implemented / not released** |
| **10** | Private Beta             | Planned                                                                |
| **11** | Public Launch            | Planned                                                                |
| **12** | Scale & Optimization     | Planned                                                                |

**Phase 8 status:** **DEFERRED/HELD.** Founder (2026-09-12) stopped live-provider testing:
no new credentials, no provider calls, no Zone A. Hermetic evidence on master (PRs **#21**,
**#22**, **#23**, **#28**) is preserved. The live-provider requirement remains **unresolved /
not closed**. Phase 8 is **not complete**.

**Phase 8 scope (when resumed; still non-reserved):** end-to-end customer-journey validation;
provider-validation evidence requirements (HeyGen, Higgsfield, ElevenLabs, etc. as already
mentioned); performance validation; production bug fixes discovered through validation;
**no new features** unless required to complete the customer journey. Phase 8 docs scope does
**not** authorize deploy, migrations, or production credential/secret handling.

**Reserved (not part of this Phase 8 docs scope):** Campaign Rendering **M2 prove-in-production**
(deploy, migrations, production credentials/secrets, live production proof) remains **reserved**
and requires separate Founder authorization — not implied by Phase 8 start or by this docs slice.

**Phase 9 — Academy Catalog Search Foundation (Hermetic)** is the Founder-approved next
docs/spec slice (Architect **7126fa69** named it; Architect **32681030** approved the 8-path
docs allowlist). Simple keyword matching only; advanced filters/facets deferred. Spec:
[`docs/academy/phase-9-catalog-search-foundation.md`](docs/academy/phase-9-catalog-search-foundation.md).
The existing `app/(platform)/academy` catalog is **not** Phase 9 complete. Phase 9 is **not
complete / not implemented / not released**. Full Academy remains a required production phase
before onboarding the first customer; this slice does not implement it.

---

## Tech Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Framework  | Next.js 15 (App Router)   |
| Language   | TypeScript 5              |
| Styling    | Tailwind CSS + shadcn/ui  |
| Database   | Supabase (Postgres + RLS) |
| AI         | Anthropic Claude          |
| Billing    | Stripe                    |
| Linting    | ESLint (Next.js config)   |
| Formatting | Prettier                  |
| Git hooks  | Husky + lint-staged       |

---

## Production Deployment (Vercel + Supabase)

### Step 1 — Apply database migrations

In the Supabase Dashboard → SQL Editor, run each file in `supabase/migrations/` in order (001 through 015).

### Step 2 — Seed the initial tenant

In the Supabase SQL Editor, run `supabase/seed.sql`. Copy the UUID it returns — this is your `PLATFORM_TENANT_ID`.

### Step 3 — Register the custom access token hook

In the Supabase Dashboard:
`Authentication → Hooks → Custom Access Token → public.custom_access_token_hook`

This enables database-layer tenant isolation (RLS) for all authenticated users.

### Step 4 — Deploy to Vercel

1. Push this repository to GitHub.
2. Create a new Vercel project and import the GitHub repository.
3. In Vercel → Project → Settings → Environment Variables, set the following:

**Required:**

| Variable                        | Where to find it                                |
| ------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → Project Settings → API     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Dashboard → Project Settings → API     |
| `PLATFORM_TENANT_ID`            | UUID from Step 2                                |
| `ANTHROPIC_API_KEY`             | console.anthropic.com                           |
| `NEXT_PUBLIC_APP_URL`           | Your production URL, e.g. `https://koolerr.com` |

**Optional (platform degrades gracefully if omitted):**

| Variable                  | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `STRIPE_SECRET_KEY`       | Stripe billing (Checkout + Portal)             |
| `STRIPE_WEBHOOK_SECRET`   | Stripe webhook signature verification          |
| `STRIPE_STARTER_PRICE_ID` | Stripe price ID for Starter plan               |
| `STRIPE_GROWTH_PRICE_ID`  | Stripe price ID for Growth plan                |
| `GITHUB_TOKEN`            | GitHub issue creation from coordination briefs |

4. Trigger a deployment (or push to the `master` branch).

### Step 5 — Verify production

1. Visit your production URL. You should see the landing page.
2. Sign up with a new account. Provisioning creates: User, Organization, Business Brain, Content Workforce, CTO Workforce (Atlas), and a free-tier Subscription.
3. Complete onboarding, then navigate to CTO Agent and trigger a V1 Readiness Assessment.

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your local Supabase project values
npm run dev
```

---

## Available Scripts

| Script                 | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the development server     |
| `npm run build`        | Build for production             |
| `npm run start`        | Start the production server      |
| `npm run lint`         | Run ESLint                       |
| `npm run typecheck`    | Run TypeScript type checking     |
| `npm run test`         | Run the test suite (vitest)      |
| `npm run format`       | Format all files with Prettier   |
| `npm run format:check` | Check formatting without writing |

---

## Repository Structure

```
Foundation/         Governing documents — read before making structural changes
app/                Next.js App Router (layouts, pages, global styles)
domains/            Bounded domain contexts (identity, business-brain, etc.)
shared/             Platform-wide utilities, Model Gateway, Trust Engine
infrastructure/     Platform bootstrap, Workforces, Auth provisioning
supabase/           Migrations and seed SQL
docs/adr/           Architecture Decision Records
scripts/            Automation and tooling
public/             Static assets
```

See `CLAUDE.md` for AI coding agent operating instructions.

See `Foundation/` for all governing architecture and product documents.

---

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component>
```

Components are installed to `shared/components/ui/` as configured in `components.json`.
