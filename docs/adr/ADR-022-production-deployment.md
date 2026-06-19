# ADR-022: Production Deployment Architecture

**Date:** 2026-06-19
**Status:** Accepted
**Phase:** 4 — Production Deployment & Validation

---

## Context

Koolerr V1 is ready for production deployment following completion of Phase 3 (M1–M4). This ADR records the decisions made about deployment target, environment configuration, and the production bootstrapping sequence.

---

## Decisions

### Decision 1: Vercel as the deployment target

**Chosen:** Vercel

**Rationale:**

- Zero-configuration for Next.js 15 App Router (automatic detection, no `vercel.json` required for default behaviour).
- Supports all required Next.js features: Server Components, Server Actions, Route Handlers, Edge Middleware, `instrumentation.ts` startup hook.
- Edge network with automatic SSL.
- Environment variable management per-environment (development / preview / production).
- Free tier sufficient for V1 launch. Scales to Pro without architecture changes.

**Rejected:** Railway, Fly.io, self-hosted.
These require explicit Dockerfile or server configuration and add operational overhead that is not justified at V1.

---

### Decision 2: Single production Supabase project

**Chosen:** One Supabase project for production, separate from any local or preview projects.

**Rationale:**

- All 15 migrations are applied once to the production project.
- Row-Level Security and the custom access token hook are configured once.
- Using separate projects for staging vs. production avoids cross-contamination of tenant data and Supabase Auth users.

**Manual step required:** After applying migrations, register `public.custom_access_token_hook` in the Supabase Dashboard:
`Authentication → Hooks → Custom Access Token → public.custom_access_token_hook`

---

### Decision 3: Single-tenant deployment for V1

**Chosen:** One `PLATFORM_TENANT_ID` per Vercel deployment.

**Rationale:**

- All V1 users belong to the same platform tenant. Multi-tenant SaaS is a Phase 4+ concern.
- The tenant record is seeded once via `supabase/seed.sql` and its UUID is set as `PLATFORM_TENANT_ID`.
- Changing to multi-tenant later requires no platform architecture changes — the tenant isolation model already supports it.

---

### Decision 4: No `vercel.json` for V1

**Chosen:** Zero Vercel configuration file.

**Rationale:**

- Vercel auto-detects Next.js 15 with correct defaults (Node.js runtime, `instrumentation.ts` enabled, all routes dynamic-by-default).
- Adding `vercel.json` only when a specific override is needed avoids configuration drift.

---

### Decision 5: `instrumentation.ts` as the bootstrap entry point

**Chosen:** `instrumentation.ts` at the project root (already present).

**Rationale:**

- Next.js 15 runs `instrumentation.ts` once at server startup before the first request.
- `bootstrapPlatform()` is called here to wire all Supabase repository implementations, the Model Gateway, the Anthropic adapter, and the billing usage sink.
- Route handlers must NOT call `bootstrapPlatform()` at module level — this runs during Next.js build-time page-data collection when server-only env vars are unavailable, causing build failures (fixed in Phase 4 M1).

---

### Decision 6: Required vs. optional environment variables

**Required for V1 launch:**

| Variable                        | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (public, embedded at build)                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, embedded at build)                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key — bypasses RLS; server-only                               |
| `PLATFORM_TENANT_ID`            | UUID from `supabase/seed.sql` output                                       |
| `ANTHROPIC_API_KEY`             | Required for Engagement Runs (Atlas + Workforces)                          |
| `NEXT_PUBLIC_APP_URL`           | Production URL, e.g. `https://koolerr.com` — used for Stripe redirect URLs |

**Optional at launch (safe to omit):**

| Variable                  | Description                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`       | Stripe billing; upgrade/portal flows show "not configured" when absent  |
| `STRIPE_WEBHOOK_SECRET`   | Required only when Stripe webhook events are sent                       |
| `STRIPE_STARTER_PRICE_ID` | Stripe price ID for the Starter plan                                    |
| `STRIPE_GROWTH_PRICE_ID`  | Stripe price ID for the Growth plan                                     |
| `GITHUB_TOKEN`            | Personal Access Token; GitHub issue creation skips silently when absent |

---

## Consequences

- Production setup requires four manual steps: apply migrations, seed tenant, register JWT hook, set env vars.
- Stripe and GitHub integrations are additive — the platform launches without them and they are enabled by adding env vars to the Vercel dashboard.
- The `PLATFORM_TENANT_ID` is the only deployment-specific value that must be seeded from the database before users can sign up.
