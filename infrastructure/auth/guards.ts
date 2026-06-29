import type { PlatformContext } from '@/shared/context'

/**
 * Owner Protection Guards
 *
 * OWNER_ALWAYS_PATHS is the canonical, centralized list of routes that an Owner
 * must always be able to access regardless of subscription state. Every layout,
 * middleware, or route handler that enforces subscription or role gating must
 * consult this list — never duplicate or scatter these path decisions elsewhere.
 *
 * WHY: The subscription gate in app/(platform)/layout.tsx must never lock an
 * Owner out of administrative and recovery functionality. Owners hold the
 * highest privilege and are responsible for billing recovery, organization
 * management, and platform administration. If a subscription lapses, the Owner
 * must always be able to reach the routes needed to correct that state.
 *
 * INVARIANT: Any route added to the platform for administrative, organizational,
 * or account management purposes belongs in this list. Feature-use routes
 * (AI runs, CTO Agent, analytics) are not administrative and must not be added.
 *
 * FUTURE ROUTES: All settings and administrative pages must live under the
 * /settings prefix so they are covered automatically. Any other new
 * administrative route must be added here explicitly.
 *
 * See docs/adr/ADR-022-owner-protection.md
 */
export const OWNER_ALWAYS_PATHS = [
  '/dashboard', // Platform landing page — always accessible to Owner
  '/billing', // Subscription and payment management
  '/workforces', // Workforce management and administration
  '/approvals', // Review and approve AI-generated actions
  '/brain', // Business Brain — organizational knowledge
  '/consent', // Revoke AI employee permissions
  '/audit', // Audit trail and compliance records
  '/usage', // Platform usage tracking
  '/revenue', // Revenue data and business management
  '/mission-control', // Platform control and administration
  '/settings', // Organization settings, user management, API keys, integrations
  '/tracker', // Development tracker — admin-only, always accessible to Owner
  '/tower', // Founder Command Center — admin-only, always accessible to Owner
] as const

/**
 * Returns true if the actor in the given context holds the Owner role.
 *
 * Use this predicate everywhere role-based decisions are made — never compare
 * role strings inline. Keeping all Owner checks routed through this function
 * ensures that a future rename or extension of the role model does not require
 * scattered find-and-replace.
 */
export function isOwner(ctx: PlatformContext): boolean {
  return ctx.actor.type === 'user' && ctx.actor.role === 'owner'
}

/**
 * Returns true if the given pathname falls under an owner-always path prefix.
 * Matching is prefix-based: '/settings/users' matches the '/settings' entry.
 */
export function isOwnerAlwaysPath(pathname: string): boolean {
  return (OWNER_ALWAYS_PATHS as readonly string[]).some((p) => pathname.startsWith(p))
}
