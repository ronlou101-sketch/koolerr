# ADR-001: Use Result<T,E> for Domain Service Error Handling

**Date:** 2026-06-17
**Status:** Accepted

## Context

Domain services need to communicate failure to callers in a way that is:

- **Type-safe** — callers cannot accidentally use a failed result as a success
- **Exhaustive** — the type system forces callers to handle both outcomes
- **Explicit** — errors are a first-class concern, not an afterthought
- **Composable** — error-returning functions can be chained without try/catch

The alternatives considered were:

1. **Exceptions (throw/catch)** — errors escape the type system; callers may forget to wrap in try/catch; stack-unwinding has hidden costs; no TypeScript guarantee that a function throws or what it throws
2. **Nullable returns (T | null)** — loses error detail; null and "entity not found" are ambiguous; callers may propagate null silently
3. **Optional/Maybe pattern** — same expressiveness problem as null; loses error code and message

## Decision

All domain service interfaces return `PlatformResult<T>`, which is an alias for `Result<T, PlatformError>`:

```typescript
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
```

`PlatformError` carries a structured `code` (from `PlatformErrorCode`) plus a human-readable `message` and optional typed `context`.

Domain service callers are required to check `result.ok` before accessing `result.value`. TypeScript narrows the type correctly in both branches, so accessing `result.value` in the `!result.ok` branch is a compile-time error.

Internal helpers `ok(value)` and `err(error)` from `shared/types/result.ts` construct the two variants without verbosity.

## Consequences

- Every domain service call site is explicit about the success/failure branch — no silent error swallowing
- Adding a new `PlatformErrorCode` updates the discriminated union without requiring new exception classes
- The Result pattern composes well with async/await — no need for try/catch inside service implementations
- Infrastructure adapters (Supabase repositories) will wrap storage errors in `err({ code: INTERNAL_ERROR, ... })` before returning, keeping the domain layer unaware of the storage technology
- The pattern is unfamiliar to engineers coming from exception-heavy backgrounds; on-boarding cost is real but acceptable given the long-term correctness gain

See `shared/types/result.ts` and `shared/types/errors.ts`.
