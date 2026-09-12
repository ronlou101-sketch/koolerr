/**
 * Phase 9 hermetic catalog coverage — Campaign Architect + Billing courses.
 *
 * In-process assertions over the static catalog in `catalog.ts`. No network,
 * providers, UI, or schema expansion.
 */
import { describe, expect, it } from 'vitest'
import { COURSES, ONBOARDING_PATHS, courseLessons, getCourse } from './catalog'
import type { LessonContent } from './catalog'

const COURSE_ID = 'campaign-architect'
const BILLING_COURSE_ID = 'billing'

const EXISTING_COURSE_IDS = [
  'getting-started',
  'business-brain',
  'ai-workforce',
  'deliverables-approvals',
] as const

const REQUIRED_CONTENT_KEYS: (keyof LessonContent)[] = [
  'overview',
  'walkthrough',
  'bestPractices',
  'commonMistakes',
  'troubleshooting',
]

function expectLessonContentPopulated(content: LessonContent) {
  expect(Object.keys(content)).toEqual(expect.arrayContaining(REQUIRED_CONTENT_KEYS))

  expect(typeof content.overview).toBe('string')
  expect(content.overview.length).toBeGreaterThan(0)

  expect(Array.isArray(content.walkthrough)).toBe(true)
  expect(content.walkthrough.length).toBeGreaterThan(0)
  expect(content.walkthrough.every((step) => step.length > 0)).toBe(true)

  expect(Array.isArray(content.bestPractices)).toBe(true)
  expect(content.bestPractices.length).toBeGreaterThan(0)
  expect(content.bestPractices.every((item) => item.length > 0)).toBe(true)

  expect(Array.isArray(content.commonMistakes)).toBe(true)
  expect(content.commonMistakes.length).toBeGreaterThan(0)
  expect(content.commonMistakes.every((item) => item.length > 0)).toBe(true)

  expect(Array.isArray(content.troubleshooting)).toBe(true)
  expect(content.troubleshooting.length).toBeGreaterThan(0)
  for (const item of content.troubleshooting) {
    expect(item.problem.length).toBeGreaterThan(0)
    expect(item.solution.length).toBeGreaterThan(0)
  }
}

describe('Phase 9 hermetic catalog coverage — Campaign Architect', () => {
  it('adds exactly one Campaign Architect course', () => {
    const matches = COURSES.filter((course) => course.id === COURSE_ID)
    expect(matches).toHaveLength(1)

    const course = getCourse(COURSE_ID)
    expect(course).toBeDefined()
    expect(course!.title).toBe('Campaign Architect')
    expect(course!.id).toBe(COURSE_ID)
  })

  it('has exactly five lessons', () => {
    const course = getCourse(COURSE_ID)
    expect(course).toBeDefined()
    expect(courseLessons(course!)).toHaveLength(5)
  })

  it('each lesson conforms to LessonContent with required teaching blocks populated', () => {
    const course = getCourse(COURSE_ID)
    expect(course).toBeDefined()

    for (const lesson of courseLessons(course!)) {
      expectLessonContentPopulated(lesson.content)
    }
  })

  it('has no videoUrl on any lesson of the new course', () => {
    const course = getCourse(COURSE_ID)
    expect(course).toBeDefined()

    for (const lesson of courseLessons(course!)) {
      expect(lesson).not.toHaveProperty('videoUrl')
      expect(lesson.videoUrl).toBeUndefined()
    }
  })

  it('leaves existing courses and ONBOARDING_PATHS unchanged', () => {
    expect(COURSES.map((course) => course.id)).toEqual([
      ...EXISTING_COURSE_IDS,
      COURSE_ID,
      BILLING_COURSE_ID,
    ])
    expect(courseLessons(getCourse('getting-started')!)).toHaveLength(2)
    expect(courseLessons(getCourse('business-brain')!)).toHaveLength(1)
    expect(courseLessons(getCourse('ai-workforce')!)).toHaveLength(1)
    expect(courseLessons(getCourse('deliverables-approvals')!)).toHaveLength(1)

    expect(ONBOARDING_PATHS.map((path) => path.id)).toEqual(['founder', 'marketer', 'operator'])
    expect(ONBOARDING_PATHS[0]?.courseIds).toEqual([
      'getting-started',
      'ai-workforce',
      'deliverables-approvals',
    ])
    expect(ONBOARDING_PATHS[1]?.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'ai-workforce',
      'deliverables-approvals',
      'campaign-architect',
    ])
    expect(ONBOARDING_PATHS[2]?.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'deliverables-approvals',
    ])
    expect(
      ONBOARDING_PATHS.filter((path) => path.id !== 'marketer').every(
        (path) => !path.courseIds.includes(COURSE_ID)
      )
    ).toBe(true)
    expect(ONBOARDING_PATHS.every((path) => !path.courseIds.includes(BILLING_COURSE_ID))).toBe(true)
  })
})

describe('Phase 9 hermetic catalog coverage — Billing', () => {
  it('adds exactly one Billing course', () => {
    const matches = COURSES.filter((course) => course.id === BILLING_COURSE_ID)
    expect(matches).toHaveLength(1)

    const course = getCourse(BILLING_COURSE_ID)
    expect(course).toBeDefined()
    expect(course!.title).toBe('Billing, Plans & Subscription')
    expect(course!.id).toBe(BILLING_COURSE_ID)
  })

  it('has exactly five lessons', () => {
    const course = getCourse(BILLING_COURSE_ID)
    expect(course).toBeDefined()
    expect(courseLessons(course!)).toHaveLength(5)
  })

  it('each lesson conforms to LessonContent with required teaching blocks populated', () => {
    const course = getCourse(BILLING_COURSE_ID)
    expect(course).toBeDefined()

    for (const lesson of courseLessons(course!)) {
      expectLessonContentPopulated(lesson.content)
    }
  })

  it('has no videoUrl on any lesson of the new course', () => {
    const course = getCourse(BILLING_COURSE_ID)
    expect(course).toBeDefined()

    for (const lesson of courseLessons(course!)) {
      expect(lesson).not.toHaveProperty('videoUrl')
      expect(lesson.videoUrl).toBeUndefined()
    }
  })
})
