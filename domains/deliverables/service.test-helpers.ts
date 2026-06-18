/**
 * Test helpers for the Deliverables domain.
 *
 * Returns a fresh DeliverablesService backed by the in-memory repository
 * so each test has isolated state with no shared singletons.
 */
import { InMemoryDeliverablesRepository } from './in-memory-repository'
import { DeliverablesService as DeliverablesServiceClass } from './service'

export function DeliverablesService(): DeliverablesServiceClass {
  return new DeliverablesServiceClass(new InMemoryDeliverablesRepository())
}
