import { describe, it, expect } from 'vitest'
import { COURSES, ONBOARDING_PATHS } from '../_lib/catalog'
import { searchCatalog } from '../_lib/search'
import { CATALOG_SEARCH_NO_RESULTS, catalogSearchView } from './catalog-search'

/**
 * Vitest runs in the `node` environment for this repo (see vitest.config.ts) and
 * no DOM test environment is installed, so these tests cover the catalog-search
 * view-model the `/academy` control renders — not a mounted input. The control
 * calls only `searchCatalog`; empty/whitespace, match, no-result, and source
 * order must match that contract.
 */

function unfilteredIds(): string[] {
  const ids = ONBOARDING_PATHS.map((path) => path.id)
  for (const course of COURSES) ids.push(course.id)
  for (const course of COURSES) {
    for (const mod of course.modules) {
      ids.push(mod.id)
      for (const lesson of mod.lessons) ids.push(lesson.id)
    }
  }
  return ids
}

// ── empty / whitespace ────────────────────────────────────────────────────────

describe('catalog search empty / whitespace', () => {
  it('renders the unfiltered catalog in source order and does not error', () => {
    const empty = catalogSearchView('')
    const whitespace = catalogSearchView('   \t\n')
    const expected = unfilteredIds()

    expect(empty.isEmptyQuery).toBe(true)
    expect(whitespace.isEmptyQuery).toBe(true)
    expect(empty.isNoResult).toBe(false)
    expect(whitespace.isNoResult).toBe(false)
    expect(empty.results).toEqual(searchCatalog(''))
    expect(whitespace.results).toEqual(searchCatalog('   \t\n'))
    expect(empty.resultIds).toEqual(expected)
    expect(whitespace.resultIds).toEqual(expected)
    expect(empty.results.map((result) => result.kind)).toEqual([
      ...ONBOARDING_PATHS.map(() => 'onboardingPath' as const),
      ...COURSES.map(() => 'course' as const),
      ...COURSES.flatMap((course) =>
        course.modules.flatMap((mod) => [
          'module' as const,
          ...mod.lessons.map(() => 'lesson' as const),
        ])
      ),
    ])
  })
})

// ── matching result ───────────────────────────────────────────────────────────

describe('catalog search matching result', () => {
  it('renders every local match in catalog source order', () => {
    const view = catalogSearchView('Brain')

    expect(view.isEmptyQuery).toBe(false)
    expect(view.isNoResult).toBe(false)
    expect(view.results).toEqual(searchCatalog('Brain'))
    expect(view.resultIds).toEqual([
      'founder',
      'operator',
      'getting-started',
      'business-brain',
      'build-your-brain',
      'brain-basics',
    ])
    expect(view.results.map((result) => result.kind)).toEqual([
      'onboardingPath',
      'onboardingPath',
      'course',
      'course',
      'lesson',
      'module',
    ])
  })
})

// ── no result ─────────────────────────────────────────────────────────────────

describe('catalog search no result', () => {
  it('renders the local no-result state when nothing matches', () => {
    const view = catalogSearchView('zzz-no-catalog-match-qqq')

    expect(view.results).toEqual([])
    expect(view.resultIds).toEqual([])
    expect(view.isNoResult).toBe(true)
    expect(view.isEmptyQuery).toBe(false)
    expect(CATALOG_SEARCH_NO_RESULTS.length).toBeGreaterThan(0)
  })
})

// ── source order ──────────────────────────────────────────────────────────────

describe('catalog search source order', () => {
  it('keeps catalog source order for matching results', () => {
    const view = catalogSearchView('Koolerr')

    expect(view.results).toEqual(searchCatalog('Koolerr'))
    expect(view.resultIds).toEqual(['getting-started', 'what-is-koolerr'])
    expect(view.results.map((result) => result.kind)).toEqual(['course', 'lesson'])
    expect(catalogSearchView('koolerr').resultIds).toEqual(view.resultIds)
  })
})
