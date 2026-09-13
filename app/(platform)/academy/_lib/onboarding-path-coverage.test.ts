/**
 * Phase 9 hermetic onboarding-path coverage — founder path includes
 * campaign-architect (Architect c2bb7a49 / 8636e349). Marketer still
 * includes campaign-architect exactly once; operator does not.
 * Billing remains on founder and operator; marketer does not include it.
 *
 * In-process assertions over ONBOARDING_PATHS only. No network, providers,
 * UI, or catalog course/lesson edits.
 */
import { describe, expect, it } from 'vitest'
import { ONBOARDING_PATHS } from './catalog'

const COURSE_ID = 'campaign-architect'
const BILLING_COURSE_ID = 'billing'

function pathById(id: string) {
  return ONBOARDING_PATHS.find((path) => path.id === id)
}

describe('Phase 9 hermetic onboarding-path coverage', () => {
  it('includes campaign-architect in the marketer path exactly once', () => {
    const marketer = pathById('marketer')
    expect(marketer).toBeDefined()
    expect(marketer!.courseIds.filter((id) => id === COURSE_ID)).toHaveLength(1)
    expect(marketer!.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'ai-workforce',
      'deliverables-approvals',
      COURSE_ID,
    ])
  })

  it('includes campaign-architect in the founder path exactly once', () => {
    const founder = pathById('founder')
    expect(founder).toBeDefined()
    expect(founder!.courseIds.filter((id) => id === COURSE_ID)).toHaveLength(1)
    expect(founder!.courseIds).toEqual([
      'getting-started',
      'ai-workforce',
      'deliverables-approvals',
      BILLING_COURSE_ID,
      COURSE_ID,
    ])
  })

  it('does not include campaign-architect in the operator path', () => {
    const operator = pathById('operator')
    expect(operator).toBeDefined()
    expect(operator!.courseIds.includes(COURSE_ID)).toBe(false)
  })

  it('includes billing in the founder path exactly once', () => {
    const founder = pathById('founder')
    expect(founder).toBeDefined()
    expect(founder!.courseIds.filter((id) => id === BILLING_COURSE_ID)).toHaveLength(1)
    expect(founder!.courseIds).toEqual([
      'getting-started',
      'ai-workforce',
      'deliverables-approvals',
      BILLING_COURSE_ID,
      COURSE_ID,
    ])
  })

  it('includes billing in the operator path exactly once', () => {
    const operator = pathById('operator')
    expect(operator).toBeDefined()
    expect(operator!.courseIds.filter((id) => id === BILLING_COURSE_ID)).toHaveLength(1)
    expect(operator!.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'deliverables-approvals',
      BILLING_COURSE_ID,
    ])
  })

  it('does not include billing in the marketer path', () => {
    const marketer = pathById('marketer')
    expect(marketer).toBeDefined()
    expect(marketer!.courseIds.includes(BILLING_COURSE_ID)).toBe(false)
  })
})
