import { asTenantId } from '@/shared/types'

/**
 * Environment Configuration
 *
 * Single source of truth for all environment variable access.
 * No other file reads process.env directly — always go through this module.
 *
 * Supabase accessors are functions (lazy) so they throw only when called,
 * not at module load time. The app can import this module safely before
 * .env.local is configured — the error surfaces at the point of use.
 *
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §6.4 — Secret Management.
 */

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Required environment variable "${key}" is not set.\n` +
        `Copy .env.example to .env.local and fill in the required values.`
    )
  }
  return value
}

export const env = {
  node: {
    env: (process.env.NODE_ENV ?? 'development') as string,
    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  supabase: {
    url(): string {
      // Must use literal dotted access — Next.js's webpack DefinePlugin only
      // replaces process.env.NEXT_PUBLIC_* when the key is a compile-time
      // string literal. Dynamic bracket access (process.env[key]) is not
      // replaced and evaluates to undefined in browser bundles.
      const value = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!value) {
        throw new Error(
          'Required environment variable "NEXT_PUBLIC_SUPABASE_URL" is not set.\n' +
            'Copy .env.example to .env.local and fill in the required values.'
        )
      }
      return value
    },
    anonKey(): string {
      const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!value) {
        throw new Error(
          'Required environment variable "NEXT_PUBLIC_SUPABASE_ANON_KEY" is not set.\n' +
            'Copy .env.example to .env.local and fill in the required values.'
        )
      }
      return value
    },
    /**
     * Service role key for server-side repository operations.
     * This key bypasses Row-Level Security — it must NEVER be exposed
     * to the client or committed to version control.
     * Used only by the server-side Supabase client in repository implementations.
     */
    serviceRoleKey(): string {
      return required('SUPABASE_SERVICE_ROLE_KEY')
    },
  },
  platform: {
    /**
     * The Tenant ID this deployment serves.
     * Used in Phase 11+ to resolve a PlatformContext from an authenticated
     * Supabase Auth session. In Phase 1, each deployment is single-tenant.
     */
    tenantId() {
      return asTenantId(required('PLATFORM_TENANT_ID'))
    },
  },
  pipeline: {
    /**
     * Maximum AI Workforce pipeline runs a single organization may start per
     * rolling 24 hours. Guards against runaway provider spend from repeated
     * triggers. Override with PIPELINE_DAILY_RUN_LIMIT; defaults to 10. Invalid
     * or non-positive values fall back to the default.
     */
    dailyRunLimit(): number {
      const raw = process.env.PIPELINE_DAILY_RUN_LIMIT
      const parsed = raw ? Number(raw) : NaN
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 10
    },
  },
}
