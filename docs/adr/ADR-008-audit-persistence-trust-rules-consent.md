# ADR-008: Audit Logger Persistence, Trust Rule Persistence, and Consent Integration

**Status:** Accepted  
**Phase:** 15 — Audit Logger Persistence + Trust Rule Persistence + Consent Integration  
**Date:** 2026-06-18

---

## Context

Phase 1 exit criteria from FOUNDATION_003 require:

1. "All AI actions are logged, attributed, and auditable." — The `ConsoleAuditLogger` stub satisfied the interface contract but wrote to stdout only. No persistence, no queryability, no customer-visible audit trail.
2. The Trust Engine was in-memory only. Rules provisioned during account creation were lost on every server restart, requiring a brittle re-registration workaround in the executor (`registerContentTrustRules()` was called at the start of every run).
3. "The Consent & Rights Ledger must be active before the first customer is onboarded." — The Consent Ledger infrastructure existed (Supabase-backed, implemented in earlier phases) but content workforce trust rules did not require consent and no consent grants were recorded during provisioning. The ledger was deployed but inert.

All three gaps were non-negotiables that had to close before Phase 1 could be declared complete.

---

## Decisions

### 1. Supabase Audit Logger replaces the ConsoleAuditLogger at bootstrap

**Decision:** `shared/audit/supabase-logger.ts` implements `IAuditLogger` using the service-role Supabase client. A `_configureAuditLogger(impl)` function (analogous to `_configureXRepository` for domain services) allows bootstrap to swap the implementation at startup. All call sites are unchanged — they hold a reference to the `auditLogger` proxy object, which delegates to whichever implementation is currently configured.

**Rationale:** The proxy pattern matches how all other singletons are handled on this platform (domains, model gateway, consent ledger). Callers written against the permanent `IAuditLogger` interface require no modification when the implementation is swapped. The console fallback remains active in CI/build environments where Supabase env vars are absent, so builds never fail on missing credentials.

**Outcome mapping:** The DB `audit_events.outcome` CHECK constraint is `('success', 'denied', 'error')` but `AuditOutcome` in TypeScript uses `'failure'`. The TypeScript type is kept as-is (renaming would break all existing call sites) and the Supabase logger maps `'failure'` ↔ `'error'` at the boundary. This mapping is documented inline and isolated to `supabase-logger.ts`.

---

### 2. Trust rules are persisted to the `trust_rules` table and loaded at bootstrap

**Decision:** `shared/trust/repository.ts` introduces `ITrustRuleRepository` with `saveRule()` and `listAllRules()`. The `TrustEngine` gains `_configureTrustRepository()` and `_loadRulesFromRepository()`. `registerRule()` now fires an async persist in addition to the synchronous in-memory update. Bootstrap calls `_configureTrustRepository(new SupabaseTrustRuleRepository(supabase))` followed by `await _loadTrustRulesFromRepository()`.

**Rationale:** The root cause of the re-registration workaround in the executor was that rules existed only in memory. Persisting rules at provisioning time and reloading them at startup eliminates the problem entirely — no per-run workaround needed, no hidden coupling between the executor and the provisioning module.

**`registerRule()` remains synchronous:** The in-memory update happens synchronously so callers (provisioning) can proceed immediately. The DB persist is fire-and-forget with a `logger.warn()` on failure. Rule registration during account provisioning is not latency-sensitive.

**Upsert semantics:** The `trust_rules` table has a UNIQUE constraint on `(digital_employee_id, action)`. The repository uses `upsert` with `onConflict: 'digital_employee_id,action'`, matching the deduplication behavior already in the in-memory engine.

---

### 3. Bootstrap is now async

**Decision:** `bootstrapPlatform()` returns `Promise<PlatformBootstrapResult>`. `instrumentation.ts` adds `await` before the call.

**Rationale:** Loading trust rules from the DB requires an async repository call. All other steps in bootstrap were synchronous and remain unchanged — only the trust rule load is awaited. The Next.js `register()` function in `instrumentation.ts` is already async, so `await bootstrapPlatform()` requires a one-line change there.

---

### 4. Content Workforce trust rules require `content_creation` consent

**Decision:** All three content workforce trust rules (`research_topic`, `write_blog_post`, `review_content`) now carry `requiredConsentScope: 'content_creation'`. During account provisioning, after registering rules, `provisionContentWorkforce` grants consent for each action via `consentLedger.grant()` on behalf of the new organization owner.

**Rationale:** The Consent & Rights Ledger was functional but inert — no rules required consent, so it was never consulted. Adding `requiredConsentScope` to content workflow rules makes the Trust Engine actively check the ledger before every AI invocation. The consent grant during provisioning represents the customer's acceptance of Terms of Service at account creation, which is standard SaaS practice. This is a non-expiring consent grant for each specific action; revocation is available through the ledger if needed in Phase 2.

**`provisionContentWorkforce` signature change:** Accepts `grantedBy: UserId` as a third parameter. The `userId` is already available in `provisionPlatformAccount` (the only caller) at the point of the Step 6 call.

---

### 5. Re-registration workaround in the executor is removed

**Decision:** The `registerContentTrustRules()` call at the top of `executeContentEngagementRun()` is removed entirely. Bootstrap now ensures all persisted rules are loaded before the first request is handled.

**Rationale:** The workaround existed because rules were in-memory only. Now that rules are persisted and reloaded at bootstrap, the executor has no reason to know about provisioning internals. Removing the coupling makes the executor cleaner and the system more correct.

---

### 6. Audit Trail page at `/audit`

**Decision:** A new Server Component at `app/(platform)/audit/page.tsx` queries `auditLogger.query()` for the 100 most recent events for the organization and renders them in a table. A nav link is added to the platform layout.

**Rationale:** Auditability is only meaningful if customers can see the audit trail. The page is read-only, shows the most recent 100 events, and labels actors, actions, resources, and outcomes in human-readable terms. Filtering, pagination, and export are Phase 2 scope.

---

## Known Limitations

- **Audit outcome type mismatch:** TypeScript's `AuditOutcome` uses `'failure'` but the DB uses `'error'`. The mapping is in `supabase-logger.ts` and is the correct place for it. Resolving the mismatch at the type level (renaming `'failure'` to `'error'` everywhere) is a future cleanup task — the behavior is correct as-is.
- **Trust rule loading failure is non-fatal:** If the DB is unreachable at bootstrap, `_loadTrustRulesFromRepository()` logs a warning and returns without throwing. This means rules start empty on that server instance. The first provisioned account's rules will be registered in-memory and DB during that session. This is acceptable in Phase 1 where single-instance deployment is assumed.
- **Consent grants are non-expiring:** Content consent grants issued during provisioning have no `expiresAt`. Expiry management and consent renewal are Phase 2 scope.
- **Audit page shows all event types:** The page does not filter by event type. A sophisticated user can see Trust Engine checks, model gateway invocations, and consent grants. Filtering by category is Phase 2 scope.
