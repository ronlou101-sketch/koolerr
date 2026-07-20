import type { Course } from './catalog'
import { courseLessons, lessonKey, allLessonKeys } from './catalog'

/** The localStorage key under which completed lesson keys are stored. */
export const ACADEMY_PROGRESS_STORAGE_KEY = 'koolerr_academy_progress_v1'

export interface ProgressStat {
  completed: number
  total: number
  pct: number
}

function pct(completed: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}

/** Progress for a single course given the set of completed lesson keys. */
export function courseProgress(course: Course, completed: Set<string>): ProgressStat {
  const keys = courseLessons(course).map((l) => lessonKey(course.id, l.id))
  const done = keys.filter((k) => completed.has(k)).length
  return { completed: done, total: keys.length, pct: pct(done, keys.length) }
}

export function isCourseComplete(course: Course, completed: Set<string>): boolean {
  const stat = courseProgress(course, completed)
  return stat.total > 0 && stat.completed === stat.total
}

/** Overall progress across every course in the catalog. */
export function overallProgress(courses: Course[], completed: Set<string>): ProgressStat {
  const allKeys = courses.flatMap((c) => courseLessons(c).map((l) => lessonKey(c.id, l.id)))
  const done = allKeys.filter((k) => completed.has(k)).length
  return { completed: done, total: allKeys.length, pct: pct(done, allKeys.length) }
}

/** The next lesson in a course after the given lesson, or null if it is the last. */
export function nextLessonId(course: Course, lessonId: string): string | null {
  const lessons = courseLessons(course)
  const i = lessons.findIndex((l) => l.id === lessonId)
  if (i < 0 || i === lessons.length - 1) return null
  return lessons[i + 1].id
}

/** The previous lesson in a course before the given lesson, or null if it is the first. */
export function prevLessonId(course: Course, lessonId: string): string | null {
  const lessons = courseLessons(course)
  const i = lessons.findIndex((l) => l.id === lessonId)
  if (i <= 0) return null
  return lessons[i - 1].id
}

/**
 * Parses the raw localStorage value into a set of completed lesson keys.
 * Tolerant of missing/corrupt data — always returns a usable set, never throws.
 * Only keys that still exist in the catalog are retained (stale keys are dropped).
 */
export function parseCompleted(raw: string | null): Set<string> {
  if (!raw) return new Set()
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return new Set()
  }
  if (!Array.isArray(parsed)) return new Set()
  const valid = new Set(allLessonKeys())
  return new Set(parsed.filter((k): k is string => typeof k === 'string' && valid.has(k)))
}

/** Serializes a set of completed lesson keys for storage. */
export function serializeCompleted(completed: Set<string>): string {
  return JSON.stringify([...completed])
}
