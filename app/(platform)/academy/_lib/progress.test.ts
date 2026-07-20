import { describe, it, expect } from 'vitest'
import { COURSES, getCourse, courseLessons, lessonKey, allLessonKeys } from './catalog'
import {
  courseProgress,
  isCourseComplete,
  overallProgress,
  nextLessonId,
  prevLessonId,
  parseCompleted,
  serializeCompleted,
} from './progress'

const gettingStarted = getCourse('getting-started')!

function keysFor(courseId: string): string[] {
  return courseLessons(getCourse(courseId)!).map((l) => lessonKey(courseId, l.id))
}

// ── catalog integrity ─────────────────────────────────────────────────────────

describe('Academy catalog integrity', () => {
  it('exposes at least one course with lessons', () => {
    expect(COURSES.length).toBeGreaterThan(0)
    expect(courseLessons(gettingStarted).length).toBeGreaterThan(0)
  })

  it('has unique course ids', () => {
    const ids = COURSES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique lesson ids within each course and 5 teaching sections per lesson', () => {
    for (const course of COURSES) {
      const ids = courseLessons(course).map((l) => l.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const lesson of courseLessons(course)) {
        expect(lesson.content.overview.length).toBeGreaterThan(0)
        expect(lesson.content.walkthrough.length).toBeGreaterThan(0)
        expect(lesson.content.bestPractices.length).toBeGreaterThan(0)
        expect(lesson.content.commonMistakes.length).toBeGreaterThan(0)
        expect(lesson.content.troubleshooting.length).toBeGreaterThan(0)
      }
    }
  })

  it('produces globally-unique lesson keys', () => {
    const keys = allLessonKeys()
    expect(new Set(keys).size).toBe(keys.length)
  })
})

// ── progress math ─────────────────────────────────────────────────────────────

describe('courseProgress()', () => {
  it('is 0% with no completions', () => {
    const stat = courseProgress(gettingStarted, new Set())
    expect(stat.completed).toBe(0)
    expect(stat.pct).toBe(0)
  })

  it('is 100% when every lesson is complete', () => {
    const completed = new Set(keysFor('getting-started'))
    const stat = courseProgress(gettingStarted, completed)
    expect(stat.completed).toBe(stat.total)
    expect(stat.pct).toBe(100)
    expect(isCourseComplete(gettingStarted, completed)).toBe(true)
  })

  it('rounds partial progress', () => {
    const [first] = keysFor('getting-started')
    const stat = courseProgress(gettingStarted, new Set([first]))
    expect(stat.completed).toBe(1)
    expect(stat.pct).toBe(Math.round((1 / stat.total) * 100))
    expect(isCourseComplete(gettingStarted, new Set([first]))).toBe(false)
  })

  it('ignores completion keys from other courses', () => {
    const otherKeys = keysFor('business-brain')
    const stat = courseProgress(gettingStarted, new Set(otherKeys))
    expect(stat.completed).toBe(0)
  })
})

describe('overallProgress()', () => {
  it('spans every course', () => {
    const all = new Set(allLessonKeys())
    const stat = overallProgress(COURSES, all)
    expect(stat.total).toBe(allLessonKeys().length)
    expect(stat.pct).toBe(100)
  })
})

// ── navigation ────────────────────────────────────────────────────────────────

describe('nextLessonId / prevLessonId', () => {
  it('returns null past the ends', () => {
    const lessons = courseLessons(gettingStarted)
    expect(prevLessonId(gettingStarted, lessons[0].id)).toBeNull()
    expect(nextLessonId(gettingStarted, lessons[lessons.length - 1].id)).toBeNull()
  })

  it('walks forward and backward between adjacent lessons', () => {
    const lessons = courseLessons(gettingStarted)
    if (lessons.length >= 2) {
      expect(nextLessonId(gettingStarted, lessons[0].id)).toBe(lessons[1].id)
      expect(prevLessonId(gettingStarted, lessons[1].id)).toBe(lessons[0].id)
    }
  })
})

// ── storage (de)serialization ───────────────────────────────────────────────────

describe('parseCompleted / serializeCompleted', () => {
  it('returns an empty set for null or garbage', () => {
    expect(parseCompleted(null).size).toBe(0)
    expect(parseCompleted('not json').size).toBe(0)
    expect(parseCompleted('{"a":1}').size).toBe(0)
  })

  it('round-trips valid keys', () => {
    const keys = new Set(keysFor('getting-started'))
    const round = parseCompleted(serializeCompleted(keys))
    expect(round).toEqual(keys)
  })

  it('drops stale keys not present in the catalog', () => {
    const raw = JSON.stringify(['getting-started/what-is-koolerr', 'ghost-course/ghost-lesson'])
    const parsed = parseCompleted(raw)
    expect(parsed.has('getting-started/what-is-koolerr')).toBe(true)
    expect(parsed.has('ghost-course/ghost-lesson')).toBe(false)
  })
})
