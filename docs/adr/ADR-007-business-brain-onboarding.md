# ADR-007: Business Brain Onboarding & Dashboard

**Status:** Accepted  
**Phase:** 14 — Business Brain Onboarding & Real Dashboard  
**Date:** 2026-06-18

---

## Context

After Phase 13, a new user could sign up, get a Content Workforce, and immediately trigger runs — but all runs would execute with "(No business context stored yet)" because the Business Brain was empty. The Phase 1 success criteria explicitly requires that a customer can "onboard their Business Brain" before using their workforce.

Additionally, the dashboard showed raw UUIDs (Organization ID, Tenant ID, Actor, Request ID) — not a customer-facing experience.

---

## Decisions

### 1. Onboarding is a mandatory step for fresh accounts

**Decision:** Both post-signup code paths (immediate session and email-confirmation callback) redirect to `/onboarding` when `alreadyProvisioned: false`. The dashboard itself also redirects to `/onboarding` if the Brain contains zero memories — a safety net for any provisioning path that doesn't redirect explicitly.

**Rationale:** The Business Brain is the foundational context for all Digital Employee work. Letting customers skip directly to running content without any Brain context produces poor-quality output that would damage trust in the platform before it is established. Onboarding is not optional in Phase 1.

**Alternative rejected:** Making onboarding skippable from the start. The onboarding wizard already has per-step "Skip for now" buttons, which is sufficient flexibility. The overall onboarding redirect is not skippable by default.

---

### 2. Onboarding stores structured memories, not freeform text

**Decision:** Each onboarding step stores a typed `BusinessMemory` with a specific `BusinessMemoryType` (`company_identity`, `brand`, `product`) and structured `content` fields.

**Rationale:** Unstructured text in the Business Brain cannot be retrieved by type or filtered by relevance scope. The content workforce executor queries by specific types (`brand`, `company_identity`, `product`). Storing onboarding data as typed memories means it's immediately retrievable and useful to the Digital Employees without any transformation step.

---

### 3. Dashboard redirects to onboarding when Brain is empty

**Decision:** `DashboardPage` calls `businessBrainService.queryMemory()` and redirects to `/onboarding` if `totalCount === 0`.

**Rationale:** This is a server-side redirect with no client-side flash. It handles the case where a user navigates directly to `/dashboard` without completing onboarding, or where the onboarding redirect from the auth callback was skipped for any reason. It's a resilient safeguard, not the primary navigation path.

---

### 4. `provision` server action return type now exposes `alreadyProvisioned`

**Decision:** The return type of `provision()` in `app/(auth)/signup/actions.ts` was updated from `{ success: true }` to `{ success: true; alreadyProvisioned: boolean }`. The runtime was already returning this field (it flows through from `provisionPlatformAccount`); the type annotation just did not reflect it.

**Rationale:** The signup client needs to know whether to redirect to `/onboarding` or `/dashboard`. This is the minimal change required — no new logic, just correcting an incomplete type annotation.

---

### 5. Brain page is read-only in Phase 1

**Decision:** `/brain` shows all stored memories in a read-only view. Memory editing, deletion, and bulk import are Phase 2 scope.

**Rationale:** Phase 1 success criteria requires that Engagement Run outputs are "reflected in the Business Brain" and that customers can see what their workforce knows. Read-only satisfies both requirements. Memory management UI adds scope and complexity that belongs in Phase 2 (Customer Dashboard).

---

## Known Limitations

- **Single memory per type per onboarding:** The onboarding wizard stores one `company_identity`, one `brand`, and one `product` memory. Adding additional products, updating brand voice, or editing identity are Phase 2 operations.
- **No org name editing:** The Organization was created with the name from signup (or "My Organization" for the email-confirmation path). Renaming is Phase 2.
- **Brain memory count is the onboarding gate:** If all memories are deleted (currently impossible through the UI), the dashboard would redirect to onboarding again. This is acceptable behavior — the Brain should always have context.
