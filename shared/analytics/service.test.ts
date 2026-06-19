import { describe, expect, it } from 'vitest'
import type {
  BusinessMemory,
  BusinessMemoryId,
  BusinessMemoryType,
  Deliverable,
  DeliverableId,
  DeliverableStatus,
  DeliverableType,
  EngagementRun,
  EngagementRunId,
  EngagementRunStatus,
  OrganizationId,
  WorkforceId,
} from '@/shared/types'
import { computeOrganizationReport } from './service'

const ORG_ID = 'org_test' as OrganizationId
const WORKFORCE_ID = 'workforce_test' as WorkforceId

function makeRun(status: EngagementRunStatus): EngagementRun {
  return {
    id: `run_${crypto.randomUUID()}` as EngagementRunId,
    organizationId: ORG_ID,
    workforceId: WORKFORCE_ID,
    objective: 'Test objective',
    status,
    participantIds: [],
    deliverableIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeDeliverable(type: DeliverableType, status: DeliverableStatus): Deliverable {
  return {
    id: `deliverable_${crypto.randomUUID()}` as DeliverableId,
    organizationId: ORG_ID,
    engagementRunId: 'run_test' as EngagementRunId,
    type,
    title: 'Test deliverable',
    content: {},
    status,
    version: 1,
    attributedTo: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeMemory(type: BusinessMemoryType): BusinessMemory {
  return {
    id: `memory_${crypto.randomUUID()}` as BusinessMemoryId,
    businessBrainId: 'brain_test' as import('@/shared/types').BusinessBrainId,
    organizationId: ORG_ID,
    type,
    content: {},
    source: 'test',
    relevanceScope: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('computeOrganizationReport — empty state', () => {
  it('returns all-zero report when no data exists', () => {
    const report = computeOrganizationReport(ORG_ID, [], [], [])
    expect(report.organizationId).toBe(ORG_ID)
    expect(report.engagementRuns.total).toBe(0)
    expect(report.engagementRuns.completed).toBe(0)
    expect(report.engagementRuns.failed).toBe(0)
    expect(report.engagementRuns.successRate).toBeNull()
    expect(report.deliverables.total).toBe(0)
    expect(report.deliverables.published).toBe(0)
    expect(report.deliverables.pendingReview).toBe(0)
    expect(report.businessBrain.totalMemories).toBe(0)
  })
})

describe('computeOrganizationReport — engagement runs', () => {
  it('counts total runs correctly', () => {
    const runs = [makeRun('completed'), makeRun('pending'), makeRun('running')]
    const report = computeOrganizationReport(ORG_ID, runs, [], [])
    expect(report.engagementRuns.total).toBe(3)
  })

  it('counts completed and failed correctly', () => {
    const runs = [makeRun('completed'), makeRun('completed'), makeRun('failed'), makeRun('pending')]
    const report = computeOrganizationReport(ORG_ID, runs, [], [])
    expect(report.engagementRuns.completed).toBe(2)
    expect(report.engagementRuns.failed).toBe(1)
  })

  it('computes successRate as completed / terminal', () => {
    const runs = [makeRun('completed'), makeRun('completed'), makeRun('failed')]
    const report = computeOrganizationReport(ORG_ID, runs, [], [])
    expect(report.engagementRuns.successRate).toBeCloseTo(2 / 3)
  })

  it('returns successRate of 1.0 when all terminal runs are completed', () => {
    const runs = [makeRun('completed'), makeRun('completed')]
    const report = computeOrganizationReport(ORG_ID, runs, [], [])
    expect(report.engagementRuns.successRate).toBe(1)
  })

  it('returns null successRate when no terminal runs exist', () => {
    const runs = [makeRun('pending'), makeRun('running')]
    const report = computeOrganizationReport(ORG_ID, runs, [], [])
    expect(report.engagementRuns.successRate).toBeNull()
  })

  it('returns null successRate with zero runs', () => {
    const report = computeOrganizationReport(ORG_ID, [], [], [])
    expect(report.engagementRuns.successRate).toBeNull()
  })

  it('groups runs by status correctly', () => {
    const runs = [makeRun('completed'), makeRun('completed'), makeRun('pending'), makeRun('failed')]
    const report = computeOrganizationReport(ORG_ID, runs, [], [])
    expect(report.engagementRuns.byStatus.completed).toBe(2)
    expect(report.engagementRuns.byStatus.pending).toBe(1)
    expect(report.engagementRuns.byStatus.failed).toBe(1)
  })
})

describe('computeOrganizationReport — deliverables', () => {
  it('counts total deliverables', () => {
    const deliverables = [
      makeDeliverable('blog_post', 'draft'),
      makeDeliverable('email', 'published'),
      makeDeliverable('report', 'pending_review'),
    ]
    const report = computeOrganizationReport(ORG_ID, [], deliverables, [])
    expect(report.deliverables.total).toBe(3)
  })

  it('counts published deliverables', () => {
    const deliverables = [
      makeDeliverable('blog_post', 'published'),
      makeDeliverable('email', 'published'),
      makeDeliverable('report', 'draft'),
    ]
    const report = computeOrganizationReport(ORG_ID, [], deliverables, [])
    expect(report.deliverables.published).toBe(2)
  })

  it('counts pending_review deliverables', () => {
    const deliverables = [
      makeDeliverable('blog_post', 'pending_review'),
      makeDeliverable('email', 'draft'),
    ]
    const report = computeOrganizationReport(ORG_ID, [], deliverables, [])
    expect(report.deliverables.pendingReview).toBe(1)
  })

  it('groups deliverables by type', () => {
    const deliverables = [
      makeDeliverable('blog_post', 'published'),
      makeDeliverable('blog_post', 'draft'),
      makeDeliverable('email', 'pending_review'),
    ]
    const report = computeOrganizationReport(ORG_ID, [], deliverables, [])
    expect(report.deliverables.byType.blog_post).toBe(2)
    expect(report.deliverables.byType.email).toBe(1)
  })
})

describe('computeOrganizationReport — business brain', () => {
  it('counts total memories', () => {
    const memories = [makeMemory('brand'), makeMemory('policy'), makeMemory('customer')]
    const report = computeOrganizationReport(ORG_ID, [], [], memories)
    expect(report.businessBrain.totalMemories).toBe(3)
  })

  it('groups memories by type', () => {
    const memories = [makeMemory('brand'), makeMemory('brand'), makeMemory('policy')]
    const report = computeOrganizationReport(ORG_ID, [], [], memories)
    expect(report.businessBrain.byType.brand).toBe(2)
    expect(report.businessBrain.byType.policy).toBe(1)
  })
})
