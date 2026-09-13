/**
 * Phase 9 hermetic catalog coverage — Campaign Architect + Billing courses,
 * plus catalog-wide O14 baseline verification (15 lessons / five blocks /
 * 5+10 video / three paths).
 *
 * In-process assertions over the static catalog in `catalog.ts`. No network,
 * providers, UI, fixtures, env, or schema expansion. Verification only —
 * does not mark Phase 9 complete.
 */
import { describe, expect, it } from 'vitest'
import {
  COURSES,
  ONBOARDING_PATHS,
  allLessonKeys,
  courseLessons,
  getCourse,
} from './catalog'
import type { Lesson, LessonContent } from './catalog'

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

function catalogLessons(): Lesson[] {
  return COURSES.flatMap((course) => courseLessons(course))
}

function hasPopulatedVideoUrl(lesson: Lesson): boolean {
  return typeof lesson.videoUrl === 'string' && lesson.videoUrl.length > 0
}

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
      BILLING_COURSE_ID,
      COURSE_ID,
    ])
    expect(ONBOARDING_PATHS[0]?.courseIds.filter((id) => id === BILLING_COURSE_ID)).toHaveLength(1)
    expect(ONBOARDING_PATHS[0]?.courseIds.filter((id) => id === COURSE_ID)).toHaveLength(1)
    expect(ONBOARDING_PATHS[1]?.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'ai-workforce',
      'deliverables-approvals',
      'campaign-architect',
    ])
    expect(ONBOARDING_PATHS[1]?.courseIds.filter((id) => id === COURSE_ID)).toHaveLength(1)
    expect(ONBOARDING_PATHS[2]?.courseIds).toEqual([
      'getting-started',
      'business-brain',
      'deliverables-approvals',
      BILLING_COURSE_ID,
    ])
    expect(ONBOARDING_PATHS[2]?.courseIds.filter((id) => id === BILLING_COURSE_ID)).toHaveLength(1)
    expect(
      ONBOARDING_PATHS.filter((path) => path.id !== 'founder' && path.id !== 'marketer').every(
        (path) => !path.courseIds.includes(COURSE_ID)
      )
    ).toBe(true)
    expect(
      ONBOARDING_PATHS.filter((path) => path.id !== 'founder' && path.id !== 'operator').every(
        (path) => !path.courseIds.includes(BILLING_COURSE_ID)
      )
    ).toBe(true)
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

describe('Phase 9 hermetic catalog coverage — O14 catalog-wide baseline', () => {
  it('has exactly 15 lessons across the catalog', () => {
    expect(catalogLessons()).toHaveLength(15)
    expect(allLessonKeys()).toHaveLength(15)
  })

  it('every lesson has all five LessonContent teaching blocks populated', () => {
    const lessons = catalogLessons()
    expect(lessons).toHaveLength(15)

    for (const lesson of lessons) {
      expectLessonContentPopulated(lesson.content)
    }
  })

  it('video inventory is exactly 5 lessons with videoUrl and 10 without', () => {
    const lessons = catalogLessons()
    expect(lessons).toHaveLength(15)

    const withVideo = lessons.filter((lesson) => hasPopulatedVideoUrl(lesson))
    const withoutVideo = lessons.filter((lesson) => !hasPopulatedVideoUrl(lesson))

    expect(withVideo).toHaveLength(5)
    expect(withoutVideo).toHaveLength(10)

    for (const lesson of withVideo) {
      expect(typeof lesson.videoUrl).toBe('string')
      expect(lesson.videoUrl!.length).toBeGreaterThan(0)
    }

    for (const lesson of withoutVideo) {
      expect(lesson).not.toHaveProperty('videoUrl')
      expect(lesson.videoUrl).toBeUndefined()
    }
  })

  it('keeps the three existing onboarding paths and their current courseIds unchanged', () => {
    expect(ONBOARDING_PATHS).toHaveLength(3)
    expect(ONBOARDING_PATHS.map((path) => path.id)).toEqual(['founder', 'marketer', 'operator'])
    expect(ONBOARDING_PATHS[0]?.courseIds).toEqual([
      'getting-started',
      'ai-workforce',
      'deliverables-approvals',
      BILLING_COURSE_ID,
      COURSE_ID,
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
      BILLING_COURSE_ID,
    ])
  })
})
