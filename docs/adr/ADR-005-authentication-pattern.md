# ADR-005 — Authentication Pattern (Phase 11)

**Date:** 2026-06-18
**Status:** Accepted
**Context:** Phase 11 — Identity & Authentication

---

## Context

Phase 10 wired all domain repositories to Supabase using the service-role key. There was no user-facing authentication — all repository calls bypassed Row-Level Security (RLS). Phase 11 must introduce:

1. Cookie-based user sessions via Supabase Auth
2. A Next.js middleware layer that keeps sessions alive
3. Resolution of an authenticated session into a `PlatformContext`
4. Role-Based Access Control (RBAC) enforcement at the application layer

The platform must also support machine-to-machine requests via API keys (issued by `identityService.issueApiKey()`), which do not use sessions.

---

## Decisions

### 1. Supabase Auth for user identity

**Decision:** Use Supabase Auth as the authentication provider. All user signup, login, and session lifecycle (including token refresh, logout, and magic link / OAuth if enabled) are delegated to Supabase Auth.

**Rationale:**

- Supabase Auth is already the persistence layer for the platform. Keeping auth in the same system avoids a separate auth service and reduces operational complexity.
- Supabase Auth sessions are JWT-based. JWTs can be extended with custom claims (see §5 below for the RLS path).
- `@supabase/ssr` provides a purpose-built Next.js App Router integration with cookie management and automatic token refresh.

**Alternative considered:** Custom JWT sessions stored in the platform `sessions` table. Rejected because it duplicates the functionality Supabase Auth provides, adds key-management complexity, and does not integrate with Supabase RLS without the same custom claims work.

### 2. Email → platform User mapping (single-tenant, Phase 11 MVP)

**Decision:** When resolving a session to a `PlatformContext`, look up the platform `User` by the authenticated Supabase Auth user's email address, scoped to the tenant identified by the `PLATFORM_TENANT_ID` environment variable.

**Rationale:**

- Phase 1 targets single-tenant deployments. Each Supabase project serves one company (one `TenantId`). `PLATFORM_TENANT_ID` identifies this deployment's tenant at runtime.
- The `users` table has a `UNIQUE(email, tenant_id)` constraint — the combination uniquely identifies a platform user within the single-tenant deployment.
- Avoids requiring a `supabase_auth_id` column on the `users` table before the Supabase Auth sign-up flow is wired (Phase 12).

**Known limitation:** In a multi-tenant deployment (Phase 3+), a user might exist in more than one tenant with the same email. At that point, `PLATFORM_TENANT_ID` will be removed in favour of embedding the `tenant_id` in the Supabase Auth JWT via a custom hook (see §5).

### 3. `role` embedded in `PlatformActorUser`

**Decision:** Add `role: UserRole` to `PlatformActorUser`. The role is resolved from the user's `UserOrganizationMembership` at context-creation time and embedded in the actor.

**Rationale:**

- RBAC checks (`requireRole`) are synchronous and need no DB call — the role is available from the context passed into every domain service method.
- `PlatformContext` is already organization-scoped, so the role is meaningful — a user may have different roles in different organizations, but within a single request the organization is fixed.
- `UserRole` was moved from `domains/identity/types.ts` to `shared/types/platform.ts` to avoid a `shared → domain` import dependency in `shared/context/types.ts`.

### 4. Session-scoped client for auth; service-role for data (Phase 11)

**Decision:** In Phase 11, Supabase Auth session validation uses the session-scoped client (`createSessionServerClient`). All domain repository operations continue to use the service-role client from Phase 10.

**Rationale:**

- Full RLS enforcement via session-scoped clients requires the `tenant_id` to be present in the Supabase Auth JWT. Supabase does not include custom claims by default — they must be added via a Supabase Auth Hook (a PostgreSQL function triggered on each token sign or refresh).
- Configuring the Auth Hook requires access to the Supabase dashboard and cannot be done in code. This is deferred to a post-Phase-11 step.
- In the interim, **application-layer isolation is enforced**:
  - `PlatformContext` carries the verified `tenantId` and `organizationId`
  - Domain services pass these to repository calls
  - Repository WHERE clauses always include `tenant_id = $1` and `organization_id = $2`
  - `guardTenant` / `guardOrganization` helpers in `shared/guards/` verify entity ownership

This is acceptable for Phase 1: the service-role client runs only on the server, never reaches the browser, and is paired with application-layer tenant guards. RLS adds a defense-in-depth layer that will be activated once the JWT hook is configured.

### 5. Path to full RLS enforcement (post-Phase-11)

To enable the `current_tenant_id()` RLS policies set up in Phase 10:

1. Create a Supabase Auth Hook in the Supabase dashboard:
   ```sql
   CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
   RETURNS jsonb
   LANGUAGE plpgsql AS $$
   DECLARE
     claims jsonb;
     tenant_id text;
   BEGIN
     SELECT u.tenant_id INTO tenant_id
     FROM public.users u
     WHERE u.email = event->>'email';
     claims := event->'claims';
     IF tenant_id IS NOT NULL THEN
       claims := jsonb_set(claims, '{tenant_id}', to_jsonb(tenant_id));
     END IF;
     RETURN jsonb_set(event, '{claims}', claims);
   END;
   $$;
   ```
2. Enable the hook in Supabase Auth settings → Hooks → Custom Access Token.
3. Switch repository clients from service-role to session-scoped (`createSessionServerClient`).
4. Remove `PLATFORM_TENANT_ID` env var — `tenantId` will come from the JWT claim.

Until this is done, the service-role client is a deliberate, documented exception — not a shortcut.

### 6. API key authentication

**Decision:** API key requests use a `Bearer koo_xxx` Authorization header. `getApiKeyPlatformContext()` in `infrastructure/auth/` validates the key via `identityService.validateApiKey()` and builds a `PlatformActorApiKey` context. API key actors do not carry a `role` — they are org-scoped service credentials. Endpoints that require human-role checks explicitly reject API key actors via `requireRole()`.

---

## Consequences

**Positive:**

- Users can sign in with Supabase Auth; their identity flows into every domain service call via `PlatformContext`.
- RBAC is synchronous and zero-cost at the call site — no extra DB query needed.
- The session middleware keeps tokens alive transparently.
- The path to full RLS enforcement is documented and actionable.

**Negative / open items:**

- `PLATFORM_TENANT_ID` is a single-tenant constraint that must be revisited in Phase 3.
- Platform `User` records must exist before `getRequestPlatformContext()` returns a non-null context. The sign-up flow (Phase 12) must call `identityService.createUser()` after Supabase Auth registration.
- RLS is not yet enforced at the database layer for user-facing requests. Application-layer guards are the current isolation mechanism.

---

## Files introduced or modified

| File                             | Change                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| `@supabase/ssr`                  | Installed                                                     |
| `.env.example`                   | Added `SUPABASE_SERVICE_ROLE_KEY`, `PLATFORM_TENANT_ID`       |
| `shared/config/env.ts`           | Added `env.platform.tenantId()`                               |
| `shared/types/platform.ts`       | Added `UserRole`                                              |
| `domains/identity/types.ts`      | Re-export `UserRole` from shared for backward compat          |
| `shared/context/types.ts`        | Added `role: UserRole` to `PlatformActorUser`                 |
| `shared/lib/supabase.ts`         | Switched to `createBrowserClient` from `@supabase/ssr`        |
| `shared/lib/supabase-session.ts` | New — session-scoped server client factory                    |
| `middleware.ts`                  | New — session refresh + route protection                      |
| `infrastructure/auth/resolve.ts` | New — `getRequestPlatformContext`, `getApiKeyPlatformContext` |
| `infrastructure/auth/index.ts`   | New — public interface                                        |
| `shared/auth/rbac.ts`            | New — `requireRole`, `hasMinimumRole`                         |
| `shared/auth/index.ts`           | New — public interface                                        |
