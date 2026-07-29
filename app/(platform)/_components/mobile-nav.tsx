'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { NavItem } from '../_lib/nav-items'

/**
 * Mobile navigation drawer for the platform header (Phase 11 grouped IA).
 *
 * Rendered only below the `sm` breakpoint (the desktop bar handles larger screens).
 * A hamburger opens a right-side drawer that mirrors the desktop groups: the
 * primary items first, then a "More" section, then a founder-only "Owner" section.
 * Tapping a link or the backdrop closes it.
 *
 * Accessibility: the panel is a labelled modal dialog. On open, focus moves to the
 * Close button; Escape closes it; on close, focus returns to the trigger.
 */
export function MobileNav({
  primary,
  more,
  owner,
}: {
  primary: NavItem[]
  more: NavItem[]
  owner: NavItem[]
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [open])

  const renderLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
    >
      <span>{item.label}</span>
      {item.badge ? (
        <span
          aria-label={`${item.badge} awaiting review`}
          className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-xs font-semibold leading-5 text-white"
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  )

  const sectionHeader = (label: string) => (
    <p className="mt-3 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
  )

  return (
    <div className="sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex items-center text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav
            aria-label="Main navigation"
            className="absolute right-0 top-0 flex h-full w-64 max-w-[80%] flex-col gap-1 overflow-y-auto border-l border-border bg-card p-4 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {primary.map(renderLink)}

            {more.length > 0 && (
              <>
                {sectionHeader('More')}
                {more.map(renderLink)}
              </>
            )}

            {owner.length > 0 && (
              <>
                {sectionHeader('Owner')}
                {owner.map(renderLink)}
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
