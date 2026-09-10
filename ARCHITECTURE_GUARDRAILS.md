# ARCHITECTURE_GUARDRAILS.md

> Foreman SoT: non-negotiables preserved from Foundation + CLAUDE.md. Do not invent or weaken.

| Field | Value |
| --- | --- |
| **Primary sources** | `Foundation/FOUNDATION_000`–`002`, `CLAUDE.md` Non-Negotiable Rules, `docs/KOOLERR_ENGINEERING_CHARTER.md`, `docs/adr/` |
| **Canonical working branch** | `feat/phase-5-6-launch-integrity` |

---

## Non-negotiable rules (mirrored from `CLAUDE.md` + Foundation)

1. **Never place provider-specific AI code outside the Model Gateway.** (`FOUNDATION_001` §9 / Gateway contract; Charter Principle 7 / Engineering Charter provider independence.)
2. **Never access another domain's data directly.** Use that domain's public interface. (`FOUNDATION_001` domain boundaries; `FOUNDATION_002`.)
3. **Never store memory in a Digital Employee.** All knowledge belongs to the Business Brain. (Charter permanent principles; `FOUNDATION_001`.)
4. **Never bypass the Trust Engine for any AI invocation.** (`FOUNDATION_001` Trust Engine.)
5. **Never transmit customer data outside the platform without a logged consent event.** (`FOUNDATION_001` Consent & Rights Ledger.)
6. **Never commit secrets, credentials, or API keys to version control.** (`FOUNDATION_001` §8.4 Secrets Management; `FOUNDATION_002`.)
7. **Never introduce architectural changes without an Architecture Decision Record.** (`CLAUDE.md`; Engineering Charter ADR gates; `FOUNDATION_005` Decision 015.)
8. **Never duplicate logic that already exists elsewhere on the platform.** (`FOUNDATION_002`.)
9. **Never make destructive changes without explicit user/founder approval.** (`CLAUDE.md`; Engineering Charter additive-by-default.)
10. **No tenant data without RLS.** (`FOUNDATION_001` non-negotiable #8; ADR-012 RLS enforcement.)

---

## Deployment / auth / DB guardrails (do not weaken)

- **Production deploy** requires Founder approval (Engineering Charter: CTO cannot deploy without Founder; engineer must escalate before production deploy). ADR-022: Vercel + single production Supabase project.
- **Auth:** ADR-005 — Supabase Auth, middleware sessions, PlatformContext, RBAC; API keys for M2M.
- **Billing / Stripe / WorkOS / secrets:** out of scope for agent drive-by changes; deferred Stripe webhook-secret hardening explicitly needs founder exception (`PHASE_7_COMPLETION.md` 7.5).
- **Additive DB changes** default; destructive DB ops require Founder approval (Engineering Charter).

---

## Prefer extension over modification

Per `CLAUDE.md` and Engineering Charter: extend existing architecture before inventing new; favor long-term architecture over short-term convenience; no silent architectural debt.

---

## This SoT pack must not

- Modify `app/`, `supabase/`, Vercel config, WorkOS/Stripe wiring, or secrets.
- Call Architect Preview MCP unless founder directs.
- Install Claude Code.
- Merge to `master` or deploy.
