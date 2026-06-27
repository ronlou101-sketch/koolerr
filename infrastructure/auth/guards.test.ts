import { describe, expect, it } from 'vitest'
import { createPlatformContext } from '@/shared/context'
import type { PlatformContext } from '@/shared/context'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'
import { OWNER_ALWAYS_PATHS, isOwner, isOwnerAlwaysPath } from './guards'

/**
 * Owner Protection Guard Tests
 *
 * Verifies the permanent access guarantees for the Owner role:
 *  1. isOwner() identifies owner actors correctly.
 *  2. isOwnerAlwaysPath() covers every path in OWNER_ALWAYS_PATHS and rejects
 *     customer feature-gate paths.
 *  3. Regression: an Owner with a billing_only subscription (expired or
 *     canceled) can access every administrative recovery route, while
 *     customer subscription enforcement remains unchanged for non-administrative
 *     features and for non-Owner roles.
 *
 * The gate condition tested here mirrors app/(platform)/layout.tsx exactly:
 *   accessLevel === 'billing_only' && !pathname.startsWith('/billing') && !ownerCanAccess
 * If that condition changes, this test must be updated in lockstep.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT = 'tenant_test' as TenantId
const ORG = 'org_test' as OrganizationId

function makeUserCtx(role: 'owner' | 'admin' | 'member' | 'viewer'): PlatformContext {
  return createPlatformContext({
    tenantId: TENANT,
    organizationId: ORG,
    actor: {
      type: 'user',
      userId: `user_${role}` as UserId,
      sessionId: `sess_${role}`,
      role,
    },
    requestId: `req_${role}`,
  })
}

const ownerCtx = makeUserCtx('owner')
const adminCtx = makeUserCtx('admin')
const memberCtx = makeUserCtx('member')
const viewerCtx = makeUserCtx('viewer')

const apiKeyCtx: PlatformContext = {
  tenantId: TENANT,
  organizationId: ORG,
  actor: { type: 'api_key', keyId: 'key_1', organizationId: ORG },
  requestId: 'req_apikey',
}

/**
 * Mirrors the gate condition in app/(platform)/layout.tsx.
 * Returns true when the subscription gate would block the request.
 */
function gateWouldBlock(
  accessLevel: 'full' | 'soft' | 'billing_only',
  pathname: string,
  ctx: PlatformContext | null
): boolean {
  const ownerCanAccess = ctx !== null && isOwner(ctx) && isOwnerAlwaysPath(pathname)
  return accessLevel === 'billing_only' && !pathname.startsWith('/billing') && !ownerCanAccess
}

// Customer feature-gate paths that must remain subscription-gated for everyone.
const FEATURE_PATHS = ['/runs', '/cto', '/analytics', '/runs/abc-123', '/cto/session/1']

// ---------------------------------------------------------------------------
// isOwner()
// ---------------------------------------------------------------------------

describe('isOwner()', () => {
  it('returns true for owner role', () => {
    expect(isOwner(ownerCtx)).toBe(true)
  })

  it('returns false for admin role', () => {
    expect(isOwner(adminCtx)).toBe(false)
  })

  it('returns false for member role', () => {
    expect(isOwner(memberCtx)).toBe(false)
  })

  it('returns false for viewer role', () => {
    expect(isOwner(viewerCtx)).toBe(false)
  })

  it('returns false for api_key actor', () => {
    expect(isOwner(apiKeyCtx)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isOwnerAlwaysPath()
// ---------------------------------------------------------------------------

describe('isOwnerAlwaysPath()', () => {
  it.each(OWNER_ALWAYS_PATHS)('returns true for %s', (path) => {
    expect(isOwnerAlwaysPath(path)).toBe(true)
  })

  it('returns true for sub-paths of owner-always prefixes', () => {
    expect(isOwnerAlwaysPath('/settings/users')).toBe(true)
    expect(isOwnerAlwaysPath('/settings/api-keys')).toBe(true)
    expect(isOwnerAlwaysPath('/settings/integrations')).toBe(true)
    expect(isOwnerAlwaysPath('/billing/subscription')).toBe(true)
    expect(isOwnerAlwaysPath('/audit/2026-06')).toBe(true)
  })

  it.each(FEATURE_PATHS)('returns false for feature path %s', (path) => {
    expect(isOwnerAlwaysPath(path)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Regression: Owner with billing_only subscription (expired / canceled)
// ---------------------------------------------------------------------------

describe('Owner protection — billing_only subscription state', () => {
  describe('Owner can access every administrative recovery route', () => {
    it.each(OWNER_ALWAYS_PATHS)(
      'Owner at %s is not blocked when subscription is billing_only',
      (path) => {
        expect(gateWouldBlock('billing_only', path, ownerCtx)).toBe(false)
      }
    )

    it('Owner at /settings/users is not blocked (future settings sub-route)', () => {
      expect(gateWouldBlock('billing_only', '/settings/users', ownerCtx)).toBe(false)
    })

    it('Owner at /settings/api-keys is not blocked (future settings sub-route)', () => {
      expect(gateWouldBlock('billing_only', '/settings/api-keys', ownerCtx)).toBe(false)
    })
  })

  describe('Customer subscription enforcement unchanged for feature paths', () => {
    it.each(FEATURE_PATHS)(
      'Owner at feature path %s is still blocked when subscription is billing_only',
      (path) => {
        expect(gateWouldBlock('billing_only', path, ownerCtx)).toBe(true)
      }
    )
  })
})

// ---------------------------------------------------------------------------
// Regression: Non-owner customer behavior is unchanged
// ---------------------------------------------------------------------------

describe('Non-owner subscription enforcement — unchanged behavior', () => {
  const nonOwnerCases: Array<[string, PlatformContext]> = [
    ['admin', adminCtx],
    ['member', memberCtx],
    ['viewer', viewerCtx],
  ]

  describe('/billing remains accessible to all roles (existing behavior)', () => {
    it.each(nonOwnerCases)('%s at /billing is not blocked', (_label, ctx) => {
      expect(gateWouldBlock('billing_only', '/billing', ctx)).toBe(false)
    })
  })

  describe('Owner-always paths are gated for non-owners when billing_only', () => {
    const adminOnlyPaths = OWNER_ALWAYS_PATHS.filter((p) => p !== '/billing')

    it.each(nonOwnerCases)('%s is blocked on /dashboard when billing_only', (_label, ctx) => {
      expect(gateWouldBlock('billing_only', '/dashboard', ctx)).toBe(true)
    })

    it.each(nonOwnerCases)('%s is blocked on /audit when billing_only', (_label, ctx) => {
      expect(gateWouldBlock('billing_only', '/audit', ctx)).toBe(true)
    })

    it.each(nonOwnerCases)('%s is blocked on /settings when billing_only', (_label, ctx) => {
      expect(gateWouldBlock('billing_only', '/settings', ctx)).toBe(true)
    })

    // Verify the full non-/billing set is gated for admins
    it.each(adminOnlyPaths)('admin is blocked on %s when billing_only', (path) => {
      expect(gateWouldBlock('billing_only', path, adminCtx)).toBe(true)
    })
  })

  describe('Feature paths are gated for non-owners when billing_only (unchanged)', () => {
    it.each(nonOwnerCases)('%s at /runs is blocked when billing_only', (_label, ctx) => {
      expect(gateWouldBlock('billing_only', '/runs', ctx)).toBe(true)
    })

    it.each(nonOwnerCases)('%s at /cto is blocked when billing_only', (_label, ctx) => {
      expect(gateWouldBlock('billing_only', '/cto', ctx)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Regression: soft and full access levels are unaffected
// ---------------------------------------------------------------------------

describe('Gate does not trigger for soft or full access levels', () => {
  it('Owner is never blocked at soft access level', () => {
    for (const path of OWNER_ALWAYS_PATHS) {
      expect(gateWouldBlock('soft', path, ownerCtx)).toBe(false)
    }
  })

  it('Admin is never blocked at soft access level', () => {
    expect(gateWouldBlock('soft', '/runs', adminCtx)).toBe(false)
    expect(gateWouldBlock('soft', '/dashboard', adminCtx)).toBe(false)
  })

  it('Owner is never blocked at full access level', () => {
    for (const path of [...OWNER_ALWAYS_PATHS, ...FEATURE_PATHS]) {
      expect(gateWouldBlock('full', path, ownerCtx)).toBe(false)
    }
  })

  it('Admin is never blocked at full access level', () => {
    for (const path of FEATURE_PATHS) {
      expect(gateWouldBlock('full', path, adminCtx)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Regression: null context (provisioning failure) still fails open
// ---------------------------------------------------------------------------

describe('Null context (provisioning failure) fails open', () => {
  it('null ctx at any path does not trigger billing_only gate differently than before', () => {
    // With null ctx, ownerCanAccess is false — same as a non-owner.
    // /billing is still accessible (existing behavior).
    expect(gateWouldBlock('billing_only', '/billing', null)).toBe(false)
    // All other paths would be gated — same as before.
    expect(gateWouldBlock('billing_only', '/dashboard', null)).toBe(true)
    expect(gateWouldBlock('billing_only', '/runs', null)).toBe(true)
  })
})
