import { describe, it, expect } from 'vitest'
import type {
  BusinessBrainId,
  BusinessMemory,
  BusinessMemoryId,
  OrganizationId,
} from '@/shared/types'
import { findRunFailure } from './run-failure'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeMemory(overrides: Partial<BusinessMemory> = {}): BusinessMemory {
  return {
    id: 'mem_1' as BusinessMemoryId,
    businessBrainId: 'brain_1' as BusinessBrainId,
    organizationId: 'org_1' as OrganizationId,
    type: 'knowledge',
    content: {},
    source: 'ai-workforce-pipeline',
    relevanceScope: ['run_1'],
    version: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('findRunFailure()', () => {
  it('returns null when there are no memories', () => {
    expect(findRunFailure([])).toBeNull()
  })

  it('returns null when no memory has a failed status', () => {
    const memories = [
      makeMemory({ content: { step: 'research', status: 'completed' } }),
      makeMemory({ content: { step: 'strategy', status: 'running' } }),
    ]
    expect(findRunFailure(memories)).toBeNull()
  })

  it('extracts department and reason from explicit failure fields', () => {
    const memories = [
      makeMemory({
        content: {
          status: 'failed',
          failedAtDepartment: 'strategy',
          failureReason: 'Strategy provider unavailable',
        },
      }),
    ]
    expect(findRunFailure(memories)).toEqual({
      department: 'strategy',
      reason: 'Strategy provider unavailable',
    })
  })

  it('falls back to step and error for legacy failure memories', () => {
    const memories = [
      makeMemory({ content: { status: 'failed', step: 'creative', error: 'Boom' } }),
    ]
    expect(findRunFailure(memories)).toEqual({ department: 'creative', reason: 'Boom' })
  })

  it('ignores memories from other sources', () => {
    const memories = [
      makeMemory({ source: 'wizard', content: { status: 'failed', step: 'research' } }),
    ]
    expect(findRunFailure(memories)).toBeNull()
  })

  it('returns the most recent failure when multiple exist', () => {
    const memories = [
      makeMemory({
        createdAt: new Date('2026-01-01'),
        content: { status: 'failed', failedAtDepartment: 'research', failureReason: 'old' },
      }),
      makeMemory({
        createdAt: new Date('2026-02-01'),
        content: { status: 'failed', failedAtDepartment: 'delivery', failureReason: 'new' },
      }),
    ]
    expect(findRunFailure(memories)?.department).toBe('delivery')
  })
})
