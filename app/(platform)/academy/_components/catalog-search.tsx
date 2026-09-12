'use client'

import { useState } from 'react'
import Link from 'next/link'
import { searchCatalog } from '../_lib/search'
import type { CatalogSearchResult } from '../_lib/search'

/** Copy shown when `searchCatalog` returns no matches for a non-empty query. */
export const CATALOG_SEARCH_NO_RESULTS = 'No matching lessons or courses.'

/**
 * Local view-model the catalog-search control renders.
 *
 * Calls only `searchCatalog`. Empty/whitespace queries keep that contract:
 * unfiltered catalog in source order, no error. No network or ranking.
 */
export function catalogSearchView(query: string) {
  const results = searchCatalog(query)
  return {
    results,
    isEmptyQuery: query.trim().length === 0,
    isNoResult: results.length === 0 && query.trim().length > 0,
    resultIds: results.map((result) => result.id),
  }
}

function hrefFor(result: CatalogSearchResult): string {
  switch (result.kind) {
    case 'onboardingPath':
      return result.courseIds[0] ? `/academy/${result.courseIds[0]}` : '/academy'
    case 'course':
      return `/academy/${result.id}`
    case 'module':
      return `/academy/${result.course.id}`
    case 'lesson':
      return `/academy/${result.course.id}/${result.id}`
  }
}

function kindLabel(kind: CatalogSearchResult['kind']): string {
  switch (kind) {
    case 'onboardingPath':
      return 'Path'
    case 'course':
      return 'Course'
    case 'module':
      return 'Module'
    case 'lesson':
      return 'Lesson'
  }
}

function resultKey(result: CatalogSearchResult): string {
  switch (result.kind) {
    case 'onboardingPath':
    case 'course':
      return `${result.kind}:${result.id}`
    case 'module':
      return `${result.kind}:${result.course.id}:${result.id}`
    case 'lesson':
      return `${result.kind}:${result.course.id}:${result.id}`
  }
}

function resultDescription(result: CatalogSearchResult): string {
  switch (result.kind) {
    case 'onboardingPath':
    case 'course':
      return result.description
    case 'module':
      return result.course.title
    case 'lesson':
      return result.summary
  }
}

/**
 * Hermetic catalog-search control for the existing `/academy` page.
 *
 * Filters the in-repo catalog through `searchCatalog` only. Matching and
 * no-result states render locally; empty/whitespace input shows the unfiltered
 * catalog in source order.
 */
export function CatalogSearch() {
  const [query, setQuery] = useState('')
  const view = catalogSearchView(query)

  return (
    <section className="space-y-3" aria-label="Search the catalog">
      <div>
        <label htmlFor="academy-catalog-search" className="text-sm font-semibold text-foreground">
          Search the catalog
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Find a path, course, or lesson. Leave the box empty to see the full catalog in order.
        </p>
        <input
          id="academy-catalog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search paths, courses, and lessons"
          autoComplete="off"
          className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {view.isNoResult ? (
        <p className="text-sm text-muted-foreground" role="status">
          {CATALOG_SEARCH_NO_RESULTS}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {view.results.map((result) => (
            <li key={resultKey(result)}>
              <Link
                href={hrefFor(result)}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {kindLabel(result.kind)}
                  </span>
                  <span className="text-sm font-medium text-foreground">{result.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{resultDescription(result)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
