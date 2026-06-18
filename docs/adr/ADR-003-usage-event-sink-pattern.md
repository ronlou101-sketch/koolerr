# ADR-003: IUsageEventSink Decouples the Model Gateway from the Billing Domain

**Date:** 2026-06-17
**Status:** Accepted

## Context

The Model Gateway lives in `shared/` and must emit a usage event to the Billing domain after every successful AI invocation (FOUNDATION_001 §4: "The Model Gateway emits usage events to billing"). However, the platform's module boundary rules prohibit `shared/` from importing `domains/`:

- `shared/` may not import from `domains/`
- `infrastructure/` is the only layer permitted to import from both simultaneously

A direct import of `IBillingService` or `billingService` inside `shared/model-gateway/gateway.ts` would violate this boundary. But without some coupling mechanism, the Model Gateway cannot record usage.

Alternatives considered:

1. **Direct import** — `gateway.ts` imports `billingService` from `domains/billing`. Violates the boundary rule; creates a permanent architectural entanglement between the platform's most fundamental primitive and a domain service.
2. **Event bus / pub-sub** — The gateway emits a generic usage event to an in-process bus; the billing domain subscribes. Avoids the coupling problem but introduces event ordering complexity, delivery guarantees, and a new infrastructure primitive not otherwise needed.
3. **Interface injection (chosen)** — Define `IUsageEventSink` in `shared/model-gateway/types.ts`; the gateway depends only on the interface. The billing domain provides a concrete implementation in `domains/billing/usage-sink.ts`. The bootstrap composition root (`infrastructure/platform/bootstrap.ts`) wires them together at startup.

## Decision

`IUsageEventSink` is defined in `shared/model-gateway/types.ts` — entirely within `shared/`:

```typescript
export interface IUsageEventSink {
  recordUsage(data: GatewayUsageData): Promise<void>
}
```

The `ModelGateway` exposes `registerUsageSink(sink: IUsageEventSink)`. At startup, `bootstrapPlatform()` in `infrastructure/platform/bootstrap.ts` calls `createBillingUsageSink(billingService)` and registers the result with the gateway.

The gateway holds a reference to the `IUsageEventSink` interface only. It never imports `billingService` or any domain type.

## Consequences

- The `shared/ → domains/` boundary is never violated
- Swapping the billing implementation requires only a change to the bootstrap — nothing in the gateway needs to change
- The `infrastructure/` layer's role as the sole cross-boundary composition root is preserved and demonstrated concretely
- If no usage sink is registered (e.g., during tests that do not call `bootstrapPlatform()`), the gateway logs a warning and continues — usage is not billed, but the invocation is not blocked
- The pattern is reusable: any future case where `shared/` needs to communicate to a domain can follow the same interface-injection-at-bootstrap pattern

See `shared/model-gateway/types.ts`, `domains/billing/usage-sink.ts`, and `infrastructure/platform/bootstrap.ts`.
