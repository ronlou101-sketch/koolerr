'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { flattenVisibleNavMenu, type NavItem, type NavNode } from '../_lib/nav-items'
import {
  FOCUSABLE_SELECTOR,
  describeFocusCandidate,
  focusTrapTarget,
  isFocusCandidate,
} from './mobile-nav-focus'
import { BottomNav } from './bottom-nav'

/**
 * Groups a primary item with its nested destinations.
 *
 * Peers stay peers (Home / Work / Business). Children nest under Work and
 * Business so they are not promoted to primary items. Desktop uses the same
 * SoT via NavDropdown; this helper is the drawer equivalent.
 */
export function drawerPrimaryGroups(primary: NavItem[]): { peer: NavItem; nested: NavNode[] }[] {
  return primary.map((peer) => ({ peer, nested: peer.children ?? [] }))
}

/**
 * Mobile navigation for the platform chrome.
 *
 * Rendered only below the `sm` breakpoint (the desktop bar handles larger screens).
 * A hamburger opens a right-side drawer that mirrors the desktop groups: the
 * primary peers first (with Work / Business children nested), then a "More"
 * section, then a founder-only "Owner" section. Tapping a link or the backdrop
 * closes it. Advanced under Business starts collapsed until expanded.
 *
 * The persistent bottom bar (Home / Work / Ask+ / Business / More) is composed
 * here so More and the hamburger share one drawer. Ask(+) is an action, not a
 * route — it reuses CampaignCreator inside BottomNav. Owner-only tools are not
 * listed in this More drawer; they stay on ⌘ Owner (Architect lock c40f0ece).
 *
 * Accessibility: the panel is a labelled modal dialog. On open, focus moves to the
 * Close button; Escape closes it; on close, focus returns to the trigger. While it
 * is open, Tab and Shift+Tab cycle within the panel rather than escaping to the
 * page behind it.
 */

export function MobileNav({
  primary,
  more,
  owner: _owner,
}: {
  primary: NavItem[]
  more: NavItem[]
  /** Founder Owner tools — kept on ⌘ Owner chrome; not rendered in customer More. */
  owner: NavItem[]
}) {
  void _owner
  const [open, setOpen] = useState(false)
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(() => new Set())
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => isFocusCandidate(describeFocusCandidate(el)))

      if (focusables.length === 0) {
        // Nothing inside to land on — refuse the move rather than let focus leave.
        e.preventDefault()
        return
      }

      const active = document.activeElement
      const target = focusTrapTarget(
        focusables,
        active instanceof HTMLElement ? active : null,
        e.shiftKey
      )
      if (!target) return

      e.preventDefault()
      target.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) setExpandedLabels(new Set())
  }, [open])

  const toggleGroup = (groupLabel: string) => {
    setExpandedLabels((prev) => {
      const next = new Set(prev)
      if (next.has(groupLabel)) next.delete(groupLabel)
      else next.add(groupLabel)
      return next
    })
  }

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
          ref={dialogRef}
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

            {drawerPrimaryGroups(primary).map(({ peer, nested }) => (
              <div key={peer.href}>
                {renderLink(peer)}
                {nested.length > 0 ? (
                  <div className="ml-2 border-l border-border pl-1">
                    {flattenVisibleNavMenu(nested, expandedLabels).map((node) => {
                      if (node.kind === 'group') {
                        return (
                          <button
                            key={node.label}
                            type="button"
                            aria-expanded={node.expanded}
                            onClick={() => toggleGroup(node.label)}
                            className={`flex w-full items-center justify-between gap-2 rounded-md py-2 text-left text-sm text-foreground hover:bg-muted ${
                              node.depth > 0 ? 'pl-5 pr-3' : 'px-3'
                            }`}
                          >
                            <span>{node.label}</span>
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                node.expanded ? 'rotate-180' : ''
                              }`}
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )
                      }
                      return (
                        <Link
                          key={node.href}
                          href={node.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between gap-2 rounded-md py-2 text-sm text-foreground hover:bg-muted ${
                            node.depth > 0 ? 'pl-5 pr-3' : 'px-3'
                          }`}
                        >
                          <span>{node.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ))}

            {more.length > 0 && (
              <>
                {sectionHeader('More')}
                {more.map(renderLink)}
              </>
            )}
          </nav>
        </div>
      )}

      <BottomNav primary={primary} moreOpen={open} onMoreClick={() => setOpen(true)} />
    </div>
  )
}
