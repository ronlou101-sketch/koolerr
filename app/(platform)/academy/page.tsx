import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { COURSES, ONBOARDING_PATHS, courseLessons, getCourse } from './_lib/catalog'
import { OverallProgress, CourseProgressBadge } from './_components/progress-widgets'

export default async function AcademyPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Koolerr Academy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn to get the most out of your AI workforce — courses, walkthroughs, and best practices
          for every part of the platform.
        </p>
      </div>

      <OverallProgress />

      {/* Guided onboarding paths by customer type */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Guided paths</h2>
        <p className="text-xs text-muted-foreground">
          New here? Pick the path that matches you and follow the recommended course order.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ONBOARDING_PATHS.map((path) => {
            const firstCourse = getCourse(path.courseIds[0])
            const firstLesson = firstCourse ? courseLessons(firstCourse)[0] : undefined
            const startHref =
              firstCourse && firstLesson
                ? `/academy/${firstCourse.id}/${firstLesson.id}`
                : '/academy'
            return (
              <div
                key={path.id}
                className="flex flex-col rounded-lg border border-border bg-card p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {path.customerType}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-foreground">{path.title}</h3>
                <p className="mt-1 flex-1 text-xs text-muted-foreground">{path.description}</p>
                <ol className="mt-3 space-y-1">
                  {path.courseIds.map((cid, i) => {
                    const c = getCourse(cid)
                    return (
                      <li key={cid} className="text-xs text-muted-foreground">
                        {i + 1}. {c?.title ?? cid}
                      </li>
                    )
                  })}
                </ol>
                <Link
                  href={startHref}
                  className="mt-3 inline-block rounded-md bg-primary px-3 py-1.5 text-center text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start this path →
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Full course catalog */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Course catalog</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <Link
              key={course.id}
              href={`/academy/${course.id}`}
              className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {course.icon}
                </span>
                <CourseProgressBadge courseId={course.id} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{course.title}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{course.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {course.audience} · {courseLessons(course).length} lessons
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
