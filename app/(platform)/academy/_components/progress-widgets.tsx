'use client'

import { COURSES, getCourse, lessonKey } from '../_lib/catalog'
import { courseProgress, isCourseComplete, overallProgress } from '../_lib/progress'
import { useAcademyProgress } from './progress-context'

/** Overall progress bar across the whole catalog (catalog page + dashboard). */
export function OverallProgress() {
  const { completed, hydrated } = useAcademyProgress()
  const stat = overallProgress(COURSES, completed)
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Your progress</span>
        <span className="text-muted-foreground">
          {hydrated ? `${stat.completed} / ${stat.total} lessons · ${stat.pct}%` : '…'}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${hydrated ? stat.pct : 0}%` }}
        />
      </div>
    </div>
  )
}

/** Compact per-course progress label for catalog cards and the course header. */
export function CourseProgressBadge({ courseId }: { courseId: string }) {
  const { completed, hydrated } = useAcademyProgress()
  const course = getCourse(courseId)
  if (!course) return null
  const stat = courseProgress(course, completed)
  const done = isCourseComplete(course, completed)
  if (!hydrated) {
    return <span className="text-xs text-muted-foreground">{stat.total} lessons</span>
  }
  return (
    <span className={`text-xs font-medium ${done ? 'text-green-600' : 'text-muted-foreground'}`}>
      {done ? '✓ Complete' : `${stat.completed}/${stat.total} · ${stat.pct}%`}
    </span>
  )
}

/** Completed/not-completed indicator for a lesson row. */
export function LessonStatusDot({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { isDone, hydrated } = useAcademyProgress()
  const done = hydrated && isDone(lessonKey(courseId, lessonId))
  return (
    <span
      aria-label={done ? 'Completed' : 'Not completed'}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
        done ? 'bg-green-100 text-green-700' : 'border border-border text-muted-foreground'
      }`}
    >
      {done ? '✓' : ''}
    </span>
  )
}

/** Mark-complete toggle on the lesson page. */
export function LessonCompleteButton({
  courseId,
  lessonId,
}: {
  courseId: string
  lessonId: string
}) {
  const { isDone, toggle, hydrated } = useAcademyProgress()
  const key = lessonKey(courseId, lessonId)
  const done = hydrated && isDone(key)
  return (
    <button
      type="button"
      onClick={() => toggle(key)}
      disabled={!hydrated}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        done
          ? 'border border-green-600 text-green-700 hover:bg-green-50'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
    >
      {done ? '✓ Completed — mark incomplete' : 'Mark lesson complete'}
    </button>
  )
}
