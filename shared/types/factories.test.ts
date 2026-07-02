import { describe, expect, it } from 'vitest'
import {
  asBusinessBrainId,
  asDeliverableId,
  asDigitalEmployeeId,
  asEngagementRunId,
  asOrganizationId,
  asTenantId,
  asUserId,
  asWorkforceId,
} from './factories'

/**
 * Validated ID factory tests (P1-10).
 *
 * Each factory must:
 *   - Return the branded type unchanged when the raw string is non-empty
 *   - Throw when passed an empty string (not just a type cast guard)
 */

describe('ID factories', () => {
  const FACTORIES = [
    { name: 'asTenantId', fn: asTenantId },
    { name: 'asOrganizationId', fn: asOrganizationId },
    { name: 'asUserId', fn: asUserId },
    { name: 'asWorkforceId', fn: asWorkforceId },
    { name: 'asDigitalEmployeeId', fn: asDigitalEmployeeId },
    { name: 'asEngagementRunId', fn: asEngagementRunId },
    { name: 'asDeliverableId', fn: asDeliverableId },
    { name: 'asBusinessBrainId', fn: asBusinessBrainId },
  ] as const

  for (const { name, fn } of FACTORIES) {
    describe(name, () => {
      it('returns the raw string unchanged when non-empty', () => {
        const raw = `${name}_test_value`
        expect(fn(raw)).toBe(raw)
      })

      it('throws when passed an empty string', () => {
        expect(() => fn('')).toThrow()
      })
    })
  }

  // Spot-check return values to confirm they are the exact same string reference
  it('asTenantId preserves the original string value', () => {
    const id = asTenantId('tenant_abc')
    expect(id).toBe('tenant_abc')
  })

  it('asEngagementRunId preserves run_ prefixed IDs', () => {
    const id = asEngagementRunId('run_00000000-0000-0000-0000-000000000001')
    expect(id).toBe('run_00000000-0000-0000-0000-000000000001')
  })
})
