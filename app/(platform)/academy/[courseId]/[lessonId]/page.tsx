import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { getLesson } from '../../_lib/catalog'
import { nextLessonId, prevLessonId } from '../../_lib/progress'
import { LessonVideo } from '../../_components/lesson-video'
import { LessonCompleteButton } from '../../_components/progress-widgets'

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export default async function LessonPage({ params }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { courseId, lessonId } = await params
  const found = getLesson(courseId, lessonId)
  if (!found) notFound()

  const { course, lesson } = found
  const prevId = prevLessonId(course, lesson.id)
  const nextId = nextLessonId(course, lesson.id)
  const content = lesson.content

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/academy" className="hover:text-foreground">
          Academy
        </Link>
        <span>/</span>
        <Link href={`/academy/${course.id}`} className="hover:text-foreground">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>
        <p className="mt-1 text-xs text-muted-foreground">{lesson.estimatedMinutes} min</p>
      </div>

      <LessonVideo videoUrl={lesson.videoUrl} title={lesson.title} />

      <Section title="Overview">
        <p className="text-sm leading-relaxed text-muted-foreground">{content.overview}</p>
      </Section>

      <Section title="Step-by-step walkthrough">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          {content.walkthrough.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Best practices">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {content.bestPractices.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Common mistakes">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {content.commonMistakes.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3">
          {content.troubleshooting.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium text-foreground">{item.problem}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.solution}</p>
            </div>
          ))}
        </div>
      </Section>

      {lesson.resources && lesson.resources.length > 0 && (
        <Section title="Resources & downloads">
          <div className="flex flex-wrap gap-2">
            {lesson.resources.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {r.label} →
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Completion + navigation */}
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <LessonCompleteButton courseId={course.id} lessonId={lesson.id} />
        <div className="flex items-center justify-between">
          {prevId ? (
            <Link
              href={`/academy/${course.id}/${prevId}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Previous lesson
            </Link>
          ) : (
            <span />
          )}
          {nextId ? (
            <Link
              href={`/academy/${course.id}/${nextId}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Next lesson →
            </Link>
          ) : (
            <Link
              href={`/academy/${course.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Back to course →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
