/**
 * Koolerr Academy — hermetic catalog search (Phase 9 foundation library).
 *
 * Isolated keyword matching over the in-repo catalog in `catalog.ts`. No network,
 * providers, UI, or ranking: trim + case-insensitive whole-string substring match
 * against the matchable fields named in
 * `docs/academy/phase-9-catalog-search-foundation.md`. An empty/whitespace query
 * returns the unfiltered catalog in source order and never errors.
 */

import { COURSES, ONBOARDING_PATHS } from './catalog'
import type { Course, Lesson, Module, OnboardingPath } from './catalog'

/** Catalog entity kind carried on each search projection (not a rank or facet). */
export type CatalogSearchResultKind = 'onboardingPath' | 'course' | 'module' | 'lesson'

export interface CatalogSearchOnboardingPathResult {
  kind: 'onboardingPath'
  id: string
  customerType: string
  title: string
  description: string
  courseIds: string[]
}

export interface CatalogSearchCourseResult {
  kind: 'course'
  id: string
  title: string
  description: string
  audience: string
  icon: string
}

export interface CatalogSearchModuleResult {
  kind: 'module'
  id: string
  title: string
  course: { id: string; title: string }
}

export interface CatalogSearchLessonResult {
  kind: 'lesson'
  id: string
  title: string
  summary: string
  estimatedMinutes: number
  course: { id: string; title: string }
  module: { id: string; title: string }
}

export type CatalogSearchResult =
  | CatalogSearchOnboardingPathResult
  | CatalogSearchCourseResult
  | CatalogSearchModuleResult
  | CatalogSearchLessonResult

function containsNormalized(field: string, needle: string): boolean {
  return field.toLowerCase().includes(needle)
}

function matchesAny(fields: string[], needle: string): boolean {
  return fields.some((field) => containsNormalized(field, needle))
}

function projectOnboardingPath(path: OnboardingPath): CatalogSearchOnboardingPathResult {
  return {
    kind: 'onboardingPath',
    id: path.id,
    customerType: path.customerType,
    title: path.title,
    description: path.description,
    courseIds: [...path.courseIds],
  }
}

function projectCourse(course: Course): CatalogSearchCourseResult {
  return {
    kind: 'course',
    id: course.id,
    title: course.title,
    description: course.description,
    audience: course.audience,
    icon: course.icon,
  }
}

function projectModule(mod: Module, course: Course): CatalogSearchModuleResult {
  return {
    kind: 'module',
    id: mod.id,
    title: mod.title,
    course: { id: course.id, title: course.title },
  }
}

function projectLesson(lesson: Lesson, course: Course, mod: Module): CatalogSearchLessonResult {
  return {
    kind: 'lesson',
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    course: { id: course.id, title: course.title },
    module: { id: mod.id, title: mod.title },
  }
}

function matchesOnboardingPath(path: OnboardingPath, needle: string): boolean {
  return matchesAny([path.title, path.description, path.customerType], needle)
}

function matchesCourse(course: Course, needle: string): boolean {
  return matchesAny([course.title, course.description, course.audience], needle)
}

function matchesModule(mod: Module, needle: string): boolean {
  return containsNormalized(mod.title, needle)
}

function matchesLesson(lesson: Lesson, needle: string): boolean {
  return matchesAny([lesson.title, lesson.summary], needle)
}

/**
 * Search the in-repo Academy catalog.
 *
 * Empty/whitespace `query` returns every onboarding path, course, module, and
 * lesson in catalog source order. A non-empty query returns only entities whose
 * matchable fields contain the trimmed string as a case-insensitive substring.
 * No-match returns `[]`. Order is always catalog source order (not relevance).
 */
export function searchCatalog(query: string): CatalogSearchResult[] {
  const needle = query.trim().toLowerCase()
  const includeAll = needle.length === 0
  const results: CatalogSearchResult[] = []

  for (const path of ONBOARDING_PATHS) {
    if (includeAll || matchesOnboardingPath(path, needle)) {
      results.push(projectOnboardingPath(path))
    }
  }

  for (const course of COURSES) {
    if (includeAll || matchesCourse(course, needle)) {
      results.push(projectCourse(course))
    }
  }

  for (const course of COURSES) {
    for (const mod of course.modules) {
      if (includeAll || matchesModule(mod, needle)) {
        results.push(projectModule(mod, course))
      }
      for (const lesson of mod.lessons) {
        if (includeAll || matchesLesson(lesson, needle)) {
          results.push(projectLesson(lesson, course, mod))
        }
      }
    }
  }

  return results
}
