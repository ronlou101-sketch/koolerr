/**
 * Auth Infrastructure — Public Interface
 *
 * Exports the two request-boundary context resolution functions used by
 * Server Components, Route Handlers, and Server Actions.
 *
 * See infrastructure/auth/resolve.ts for full documentation.
 */

export { getApiKeyPlatformContext, getRequestPlatformContext } from './resolve'
export { provisionPlatformAccount } from './provision'
export type { ProvisionError, ProvisionResult } from './provision'
