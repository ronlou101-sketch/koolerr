import { describe, it, expect } from 'vitest'
import type {
  Deliverable,
  DeliverableId,
  DeliverableType,
  EngagementRunId,
  OrganizationId,
} from '@/shared/types'
import { partitionDeliverables } from './partition'

function makeDeliverable(type: DeliverableType, overrides: Partial<Deliverable> = {}): Deliverable {
  return {
    id: `del_${type}_${Math.random().toString(36).slice(2, 7)}` as DeliverableId,
    organizationId: 'org_1' as OrganizationId,
    engagementRunId: 'run_1' as EngagementRunId,
    type,
    title: `A ${type}`,
    status: 'draft',
    content: {},
    attributedTo: [],
    version: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('partitionDeliverables()', () => {
  it('returns empty groups for no deliverables', () => {
    expect(partitionDeliverables([])).toEqual({
      scripts: [],
      videos: [],
      images: [],
      documents: [],
    })
  })

  it('routes media types into their groups', () => {
    const result = partitionDeliverables([
      makeDeliverable('video_script'),
      makeDeliverable('video'),
      makeDeliverable('image'),
    ])
    expect(result.scripts).toHaveLength(1)
    expect(result.videos).toHaveLength(1)
    expect(result.images).toHaveLength(1)
    expect(result.documents).toHaveLength(0)
  })

  it('routes all non-media types into documents', () => {
    const result = partitionDeliverables([
      makeDeliverable('report'),
      makeDeliverable('strategy'),
      makeDeliverable('blog_post'),
      makeDeliverable('v1_readiness_report'),
    ])
    expect(result.documents).toHaveLength(4)
    expect(result.scripts).toHaveLength(0)
    expect(result.videos).toHaveLength(0)
    expect(result.images).toHaveLength(0)
  })

  it('sorts documents newest-first', () => {
    const result = partitionDeliverables([
      makeDeliverable('report', { id: 'old' as DeliverableId, createdAt: new Date('2026-01-01') }),
      makeDeliverable('report', { id: 'new' as DeliverableId, createdAt: new Date('2026-06-01') }),
      makeDeliverable('report', { id: 'mid' as DeliverableId, createdAt: new Date('2026-03-01') }),
    ])
    expect(result.documents.map((d) => d.id)).toEqual(['new', 'mid', 'old'])
  })

  it('keeps multiple deliverables of the same media type together', () => {
    const result = partitionDeliverables([
      makeDeliverable('image'),
      makeDeliverable('image'),
      makeDeliverable('video_script'),
    ])
    expect(result.images).toHaveLength(2)
    expect(result.scripts).toHaveLength(1)
  })
})
