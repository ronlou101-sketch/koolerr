import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { getCourse } from '../_lib/catalog'
import { CourseProgressBadge, LessonStatusDot } from '../_components/progress-widgets'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function CoursePage({ params }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { courseId } = await params
  const course = getCourse(courseId)
  if (!course) notFound()

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/academy" className="hover:text-foreground">
            Academy
          </Link>
          <span>/</span>
          <span>{course.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              <span className="mr-2" aria-hidden="true">
                {course.icon}
              </span>
              {course.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">For: {course.audience}</p>
          </div>
          <div className="shrink-0 pt-1">
            <CourseProgressBadge courseId={course.id} />
          </div>
        </div>
      </div>

      {course.modules.map((mod) => (
        <section key={mod.id} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{mod.title}</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {mod.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/academy/${course.id}/${lesson.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <LessonStatusDot courseId={course.id} lessonId={lesson.id} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{lesson.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{lesson.summary}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {lesson.estimatedMinutes} min
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
