import { describe, it, expect } from 'vitest'
import { COURSES, ONBOARDING_PATHS, getCourse } from './catalog'
import { searchCatalog } from './search'
import type { CatalogSearchResult } from './search'

const gettingStarted = getCourse('getting-started')!

function unfilteredIds(): string[] {
  const ids = ONBOARDING_PATHS.map((p) => p.id)
  for (const course of COURSES) ids.push(course.id)
  for (const course of COURSES) {
    for (const mod of course.modules) {
      ids.push(mod.id)
      for (const lesson of mod.lessons) ids.push(lesson.id)
    }
  }
  return ids
}

function resultIds(results: CatalogSearchResult[]): string[] {
  return results.map((r) => r.id)
}

// ── matching result ───────────────────────────────────────────────────────────

describe('searchCatalog() matching result', () => {
  it('returns a course whose title contains the query, with only catalog projection fields', () => {
    const results = searchCatalog('Mastering the Business Brain')
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      kind: 'course',
      id: 'business-brain',
      title: 'Mastering the Business Brain',
      description:
        'Understand how the Brain stores knowledge, how the workforce reads it, and how to keep it healthy.',
      audience: 'Owners and operators',
      icon: '🧠',
    })
    expect(results[0]).not.toHaveProperty('modules')
    expect(results[0]).not.toHaveProperty('score')
    expect(results[0]).not.toHaveProperty('rank')
    expect(results[0]).not.toHaveProperty('highlight')
  })

  it('is case-insensitive and matches a whole-string substring on lesson title/summary', () => {
    const results = searchCatalog('first ENGAGEMENT run')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      kind: 'lesson',
      id: 'launch-a-run',
      title: 'Launch Your First Engagement Run',
      summary: 'Trigger the workforce and watch it work through seven departments.',
      estimatedMinutes: 8,
      course: { id: 'ai-workforce', title: 'Running the AI Workforce' },
      module: { id: 'pipeline', title: 'The Pipeline' },
    })
    expect(results[0]).not.toHaveProperty('content')
    expect(results[0]).not.toHaveProperty('videoUrl')
    expect(results[0]).not.toHaveProperty('resources')
  })
})

// ── multiple results ──────────────────────────────────────────────────────────

describe('searchCatalog() multiple results', () => {
  it('returns every matching entity, each projected from the catalog contract', () => {
    const results = searchCatalog('Brain')
    expect(resultIds(results)).toEqual([
      'founder',
      'operator',
      'getting-started',
      'business-brain',
      'build-your-brain',
      'brain-basics',
    ])
    expect(results.map((r) => r.kind)).toEqual([
      'onboardingPath',
      'onboardingPath',
      'course',
      'course',
      'lesson',
      'module',
    ])
    const courseHit = results.find((r) => r.id === 'getting-started')
    expect(courseHit).toMatchObject({
      kind: 'course',
      title: gettingStarted.title,
      description: gettingStarted.description,
      audience: gettingStarted.audience,
      icon: gettingStarted.icon,
    })
  })
})

// ── no result ─────────────────────────────────────────────────────────────────

describe('searchCatalog() no result', () => {
  it('returns an empty list when no matchable field contains the query', () => {
    expect(searchCatalog('zzz-no-catalog-match-qqq')).toEqual([])
  })

  it('does not match ids, icons, lesson body, or video URLs', () => {
    expect(searchCatalog('getting-started')).toEqual([])
    expect(searchCatalog('🚀')).toEqual([])
    expect(searchCatalog('discrete units of Business Memory')).toEqual([])
    expect(searchCatalog('ofq9igptory9j22i')).toEqual([])
  })
})

// ── empty / whitespace query ──────────────────────────────────────────────────

describe('searchCatalog() empty / whitespace query', () => {
  it('returns the unfiltered catalog in source order and does not error', () => {
    const empty = searchCatalog('')
    const whitespace = searchCatalog('   \t\n')
    const expected = unfilteredIds()

    expect(empty.length).toBe(expected.length)
    expect(resultIds(empty)).toEqual(expected)
    expect(resultIds(whitespace)).toEqual(expected)
    expect(empty.map((r) => r.kind)).toEqual([
      ...ONBOARDING_PATHS.map(() => 'onboardingPath' as const),
      ...COURSES.map(() => 'course' as const),
      ...COURSES.flatMap((c) =>
        c.modules.flatMap((m) => ['module' as const, ...m.lessons.map(() => 'lesson' as const)])
      ),
    ])
  })
})

// ── deterministic order ───────────────────────────────────────────────────────

describe('searchCatalog() deterministic result order', () => {
  it('yields the same sequence for the same query against the same catalog', () => {
    const a = searchCatalog('Koolerr')
    const b = searchCatalog('koolerr')
    expect(a).toEqual(b)
    expect(resultIds(a)).toEqual(resultIds(searchCatalog('Koolerr')))
    // Source order: matching onboarding paths, then matching courses, then
    // matching modules/lessons under each course — not relevance rank.
    expect(resultIds(a)).toEqual(['getting-started', 'what-is-koolerr'])
    expect(a.map((r) => r.kind)).toEqual(['course', 'lesson'])

    const emptyA = searchCatalog('')
    const emptyB = searchCatalog('')
    expect(emptyA).toEqual(emptyB)
    expect(resultIds(emptyA)).toEqual(unfilteredIds())
  })
})
