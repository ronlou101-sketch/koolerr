/**
 * Test helpers for the Identity domain.
 *
 * Returns a fresh IdentityService and its backing repo so tests can
 * inspect or pre-populate state (e.g. injecting expired sessions).
 */
import { InMemoryIdentityRepository } from './in-memory-repository'
import { IdentityService as IdentityServiceClass } from './service'
import type { IIdentityRepository } from './repository'

export interface IdentityTestHarness {
  service: IdentityServiceClass
  repo: IIdentityRepository
}

export function IdentityService(): IdentityTestHarness {
  const repo = new InMemoryIdentityRepository()
  return { service: new IdentityServiceClass(repo), repo }
}
