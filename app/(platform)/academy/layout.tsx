import type { ReactNode } from 'react'
import { AcademyProgressProvider } from './_components/progress-context'

/**
 * Academy layout — wraps all Academy routes in the client-side progress provider so
 * lesson completion is shared and persisted across the catalog, course, and lesson views.
 * Access is inherited from the platform layout: every authenticated user has full Academy
 * access (no separate billing or role gate), so beta customers have it on Day 1.
 */
export default function AcademyLayout({ children }: { children: ReactNode }) {
  return <AcademyProgressProvider>{children}</AcademyProgressProvider>
}
