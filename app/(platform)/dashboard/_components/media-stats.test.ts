import { describe, it, expect } from 'vitest'
import { computeMediaStats } from './media-stats'
import type { Deliverable, DeliverableType, DeliverableStatus } from '@/shared/types'

function makeDeliverable(type: DeliverableType, status: DeliverableStatus = 'draft'): Deliverable {
  return {
    id: 'del_test' as Deliverable['id'],
    organizationId: 'org_test' as Deliverable['organizationId'],
    engagementRunId: 'run_test' as Deliverable['engagementRunId'],
    type,
    title: 'Test Deliverable',
    content: {},
    status,
    version: 1,
    attributedTo: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }
}

describe('computeMediaStats', () => {
  it('returns zeros for empty array', () => {
    expect(computeMediaStats([])).toEqual({
      total: 0,
      scripts: 0,
      videos: 0,
      images: 0,
      pendingReview: 0,
      approved: 0,
    })
  })

  it('excludes non-media deliverable types', () => {
    const stats = computeMediaStats([
      makeDeliverable('blog_post'),
      makeDeliverable('advertisement'),
      makeDeliverable('email'),
    ])
    expect(stats.total).toBe(0)
  })

  it('counts each media type individually', () => {
    const stats = computeMediaStats([
      makeDeliverable('video_script'),
      makeDeliverable('video'),
      makeDeliverable('image'),
    ])
    expect(stats).toEqual({
      total: 3,
      scripts: 1,
      videos: 1,
      images: 1,
      pendingReview: 0,
      approved: 0,
    })
  })

  it('counts multiple deliverables of the same type', () => {
    const stats = computeMediaStats([
      makeDeliverable('video_script'),
      makeDeliverable('video_script'),
      makeDeliverable('image'),
    ])
    expect(stats.scripts).toBe(2)
    expect(stats.images).toBe(1)
    expect(stats.total).toBe(3)
  })

  it('counts pending_review status across media types', () => {
    const stats = computeMediaStats([
      makeDeliverable('video_script', 'pending_review'),
      makeDeliverable('video', 'pending_review'),
      makeDeliverable('image', 'draft'),
    ])
    expect(stats.pendingReview).toBe(2)
  })

  it('counts approved status across media types', () => {
    const stats = computeMediaStats([
      makeDeliverable('video_script', 'approved'),
      makeDeliverable('image', 'draft'),
      makeDeliverable('video', 'rejected'),
    ])
    expect(stats.approved).toBe(1)
  })

  it('excludes non-media types when mixed with media types', () => {
    const stats = computeMediaStats([
      makeDeliverable('blog_post', 'approved'),
      makeDeliverable('video_script', 'approved'),
      makeDeliverable('image', 'pending_review'),
    ])
    expect(stats.total).toBe(2)
    expect(stats.approved).toBe(1)
    expect(stats.pendingReview).toBe(1)
  })

  it('counts published status as neither pendingReview nor approved', () => {
    const stats = computeMediaStats([makeDeliverable('video', 'published')])
    expect(stats.total).toBe(1)
    expect(stats.pendingReview).toBe(0)
    expect(stats.approved).toBe(0)
  })
})
