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
      return required('NEXT_PUBLIC_SUPABASE_URL')
    },
    anonKey(): string {
      return required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    },
  },
}
