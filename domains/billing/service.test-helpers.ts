/**
 * Test helpers for the Billing domain.
 *
 * Provides a factory function that creates a fresh BillingService backed
 * by the InMemoryBillingRepository so unit tests have isolated state.
 */
import { InMemoryBillingRepository } from './in-memory-repository'
import { BillingService as BillingServiceClass } from './service'

/** Create a fresh BillingService with isolated in-memory state. */
export function BillingService(): BillingServiceClass {
  return new BillingServiceClass(new InMemoryBillingRepository())
}
