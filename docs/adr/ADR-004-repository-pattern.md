# ADR-004: Repository Pattern for Domain Service Persistence

**Date:** 2026-06-18
**Status:** Accepted

## Context

Domain services were originally implemented with in-memory Maps as the storage layer. This was the correct Phase 1 approach — it kept services testable and allowed all platform infrastructure to be built and verified before any database decisions were made.

Phase 10 introduces durable persistence. The domain services needed to be connected to a real storage backend (Supabase) without:

1. Mixing storage logic with business logic inside the service
2. Making the service depend directly on the Supabase client (which would bind the domain to a specific technology)
3. Requiring the service interface (seen by callers) to change
4. Losing the ability to test without a database

## Decision

A **repository interface** is defined in each domain (`domains/<name>/repository.ts` and `shared/consent/repository.ts`). The interface declares exactly the storage operations the service needs — no more. The service depends on the interface, not on any concrete implementation.

Two implementations exist for each interface:

1. **In-memory**: Extracted from the original service class. Contains the same Map-based logic. Used when no database is configured (development, unit tests).
2. **Supabase**: Connects to Supabase using a server-side client. Used in production after `bootstrapPlatform()` is called.

The bootstrap composition root (`infrastructure/platform/bootstrap.ts`) creates the Supabase repositories and injects them via `_configureXRepository()` functions. This naming convention (underscore prefix) signals infrastructure-layer intent — the same convention used by `_registerProvider` and `_registerUsageSink`.

### tenantId on write operations

Domain entity types (e.g., `BusinessMemory`, `Workforce`) do not carry `tenantId` — it is derivable from `organizationId` via the `organizations` table. However, the database schema includes a `tenant_id` column on all tables for efficient RLS enforcement (avoids a join per query).

To populate `tenant_id` on INSERT without changing entity types, write methods on repository interfaces that create new records accept `tenantId` as an explicit parameter. Update-style saves use an upsert WHERE the `tenant_id` is preserved from the existing row (set only on INSERT, never changed).

### Append-only invariants

The Consent repository exposes no delete operation. The `saveRecord()` method upserts — revocations update the record's `status` field in place. This preserves the ledger's append-only invariant at the interface level, not just by convention.

### Entitlement limits and Infinity

`Entitlement.limit` is `number` in TypeScript and may be `Infinity` (unlimited). The database stores `null` for unlimited. Repository implementations translate `Infinity` ↔ `null` at the boundary.

## Consequences

- Domain services contain only business logic; repository classes contain only storage logic
- Swapping the database backend requires updating the repository implementations and the bootstrap — nothing else
- The in-memory implementation enables testing without Supabase credentials
- The service singleton is initialized with the in-memory fallback; bootstrap replaces it with Supabase before the first request is handled
- Future repository implementations (read replicas, edge caching) require no service changes

See `domains/*/repository.ts` and `shared/consent/repository.ts`.
