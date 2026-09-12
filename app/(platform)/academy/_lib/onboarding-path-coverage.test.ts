/**
 * Phase 9 hermetic onboarding-path coverage — marketer path includes
 * campaign-architect (Architect c3883718).
 *
 * In-process assertions over ONBOARDING_PATHS only. No network, providers,
 * UI, or catalog course/lesson edits.
 */
import { describe, expect, it } from 'vitest'
import { ONBOARDING_PATHS } from './catalog'

const COURSE_ID = 'campaign-architect'

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

  it('does not include campaign-architect in the founder path', () => {
    const founder = pathById('founder')
    expect(founder).toBeDefined()
    expect(founder!.courseIds.includes(COURSE_ID)).toBe(false)
  })

  it('does not include campaign-architect in the operator path', () => {
    const operator = pathById('operator')
    expect(operator).toBeDefined()
    expect(operator!.courseIds.includes(COURSE_ID)).toBe(false)
  })

  it('leaves founder course membership and order unchanged', () => {
    const founder = pathById('founder')
    expect(founder).toBeDefined()
    expect(founder!.courseIds).toEqual([
      'getting-started',
      'ai-workforce',
      'deliverables-approvals',
    ])
  })

  it('leaves operator course membership and order unchanged', () => {
    const operator = pathById('operator')
    expect(operator).toBeDefined()
    expect(operator!.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'deliverables-approvals',
    ])
  })
})
