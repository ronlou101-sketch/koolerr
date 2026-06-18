# ADR-012: RLS Enforcement — JWT Hook and auth_user_id

**Status:** Accepted  
**Phase:** Phase 2 Pre-requisite Hardening  
**Date:** 2026-06-18

---

## Context

All 22 platform tables have Row Level Security enabled and policies that call `current_tenant_id()`, a helper function defined as:

```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS text AS $$
  SELECT auth.jwt() ->> 'tenant_id';
$$ LANGUAGE sql STABLE;
```

For this to enforce anything, two conditions must both be true:

1. The JWT presented with each request must contain a `tenant_id` claim.
2. The request must use a session-scoped Supabase client (not the service-role key).

**Condition 1 was never satisfied.** There was no Supabase custom access token hook to inject `tenant_id` into the JWT. The hook also needs a way to resolve the user's `tenant_id` from the Supabase Auth UUID — but the platform `users` table had no column linking a Supabase Auth UUID to a platform user record.

**Condition 2 remains incomplete.** All current repositories use the service-role key (which bypasses RLS regardless of JWT claims). Full DB-layer enforcement requires session-scoped clients, deferred to a future hardening phase.

This ADR documents the changes that satisfy Condition 1 and create the preconditions for Condition 2.

---

## Decision

### 1. Add `auth_user_id` to the `users` table (migration 009)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id text UNIQUE;
CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
```

`auth_user_id` stores the Supabase Auth UUID (`auth.users.id`) for each platform user. It is populated at provisioning time and is the lookup key the JWT hook uses to resolve `tenant_id`.

### 2. JWT hook function (migration 009)

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  claims        jsonb;
  user_tenant_id text;
BEGIN
  SELECT tenant_id INTO user_tenant_id
  FROM public.users
  WHERE auth_user_id = (event ->> 'user_id');

  claims := event -> 'claims';

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, anon, authenticated;
```

This function is called by Supabase Auth whenever it mints an access token. It adds `tenant_id` as a custom JWT claim so that `current_tenant_id()` returns the correct value for authenticated users.

**Graceful degradation:** if no platform user record is found (e.g., the user was created before this migration, or the provisioning flow has not yet run), the hook returns the event unchanged. The user's JWT contains no `tenant_id` claim, `current_tenant_id()` returns `NULL`, and all RLS policies deny access when using a session-scoped client. The service-role key path (used by all current repositories) is unaffected.

### 3. Thread `authUserId` through the identity domain

`User.authUserId?: string` — added to the domain type, `CreateUserInput`, the Supabase repository row mapper/serializer, and the in-memory repository (which stores `User` objects as-is, so no structural change was needed).

### 4. Thread `authUserId` through provisioning call sites

`provisionPlatformAccount(email, organizationName, authUserId?)` — the optional third parameter is passed from both call sites:

- `app/(auth)/signup/actions.ts` — passes `authUser.id`
- `app/auth/callback/route.ts` — passes `authUser.id`

New users provisioned after this change will have `auth_user_id` set immediately at account creation.

### 5. Manual step required after deploying

The hook function must be registered in the Supabase dashboard:

```
Authentication → Hooks → Enable "Custom Access Token"
Function: public.custom_access_token_hook
```

This step cannot be automated via SQL migration — it requires dashboard interaction.

---

## Files Changed

| File                                                  | Change                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `supabase/migrations/20260618000009_rls_jwt_hook.sql` | NEW — `auth_user_id` column + JWT hook function + permissions           |
| `domains/identity/types.ts`                           | `User.authUserId?: string` added                                        |
| `domains/identity/service.ts`                         | `CreateUserInput.authUserId?: string` added; threaded into `createUser` |
| `domains/identity/supabase-repository.ts`             | `UserRow.auth_user_id`, `mapUser`, `userToRow` updated                  |
| `infrastructure/auth/provision.ts`                    | `authUserId?` parameter added; passed to `createUser`                   |
| `app/(auth)/signup/actions.ts`                        | Passes `authUser.id` to `provisionPlatformAccount`                      |
| `app/auth/callback/route.ts`                          | Passes `authUser.id` to `provisionPlatformAccount`                      |

---

## What this change activates

For every new user provisioned after this migration and dashboard hook registration:

1. The platform `users` row will have `auth_user_id` set.
2. On every Supabase Auth token issue, the hook will inject `tenant_id` into the JWT.
3. `current_tenant_id()` will return the user's `tenant_id` for authenticated requests.
4. **When repositories switch to session-scoped clients**, all 22 tables will enforce tenant isolation at the DB layer automatically — no policy changes needed.

---

## Risks and Remaining Limitations

- **Service-role bypass:** All current repositories still use the service-role key, which bypasses RLS. DB-layer enforcement is not yet active. This is the next hardening item (switching to session-scoped clients).

- **Existing users without `auth_user_id`:** Users provisioned before this migration have `auth_user_id = NULL`. Their JWTs will carry no `tenant_id` claim, so when session-scoped clients are introduced they will lose DB access until backfilled. A backfill script should be run against `auth.users` before switching to session-scoped clients.

- **Dashboard registration required:** The hook will not fire until registered manually. Until then, the JWT claim is absent and DB-layer RLS is inoperative for session-scoped requests.

- **Race condition at provisioning:** If Supabase Auth issues a token between account creation and the first `saveUser` call that sets `auth_user_id`, that token will have no `tenant_id` claim. The next token issuance (on next sign-in or refresh) will include the claim correctly. This is acceptable — the provisioning flow does not make any Supabase-client requests between those two points.
