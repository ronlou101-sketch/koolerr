# ADR-002: Enforce Trust Engine and Consent Ledger Inside the Model Gateway

**Date:** 2026-06-17
**Status:** Accepted

## Context

FOUNDATION_001 §2.10 is unambiguous: **no AI invocation bypasses the Trust Engine — ever.** It also states the Trust Engine enforces consent requirements before sensitive actions.

Two enforcement strategies were considered:

1. **Caller-site enforcement** — every caller of `ModelGateway.invoke()` is expected to call `trustEngine.check()` first, then only call the gateway if permitted
2. **Gateway-internal enforcement** — `ModelGateway.invoke()` always calls `trustEngine.check()` itself before dispatching to any AI provider

Strategy 1 is architecturally unsafe: it relies on every future engineer who calls the Model Gateway to remember to pre-check the Trust Engine. One missed call is a security and compliance violation. Over time, as more callers are added, the probability of a missed check approaches 1.

Strategy 2 is architecturally enforced: there is one path to an AI invocation (`ModelGateway.invoke()`), and the Trust Engine check happens on every call, unconditionally. No caller can accidentally bypass it. The invariant is maintained by the gateway, not by the discipline of callers.

The same reasoning applies to consent: enforcement inside the Trust Engine itself (which is called by the gateway) ensures consent is always checked before an AI action proceeds.

## Decision

`ModelGateway.invoke()` calls `trustEngine.check()` as the **first operation** before any provider dispatch. If the outcome is `'denied'` or `'requires_approval'`, the gateway throws immediately without invoking any AI provider and without recording a usage event.

The Trust Engine's `check()` method calls `consentLedger.check()` when a TrustRule specifies `requiredConsentScope`. This keeps the consent enforcement logic inside the Trust Engine rather than scattered across callers.

The enforcement order is:

```
ModelGateway.invoke()
  → trustEngine.check()           (must return 'permitted')
      → consentLedger.check()     (if rule has requiredConsentScope)
  → audit: invocation_requested
  → provider dispatch
  → audit: invocation_completed
  → usage sink emission
```

## Consequences

- The Trust Engine non-negotiable from FOUNDATION_001 is structurally impossible to violate — not just a convention
- Adding a new AI provider adapter does not require remembering to add a Trust Engine pre-check; the gateway handles it
- Consent checking is co-located with permission checking in the Trust Engine, keeping both enforcement concerns in one place
- The gateway cannot be used as a "raw" provider client even in tests — every invocation goes through the trust check; tests that need unconditional invocation must register appropriate trust rules

See `shared/model-gateway/gateway.ts`, `shared/trust/engine.ts`, and `shared/consent/ledger.ts`.
