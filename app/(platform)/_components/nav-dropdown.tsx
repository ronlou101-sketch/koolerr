'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '../_lib/nav-items'
import { activeMenuIndex, focusMenuItem, isMenuNavigationKey } from './nav-dropdown-focus'

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

/**
 * Desktop header dropdown for a labelled nav group ("More" and "⌘ Owner").
 *
 * Presentation only — it renders links to existing routes. Closes on outside
 * click, Escape, or navigation; highlights the trigger when the current route
 * belongs to the group. Mirrors the AccountMenu dropdown pattern for a11y.
 *
 * Keyboard: the trigger opens the menu with Enter/Space (native button) or with
 * ArrowDown/ArrowUp, which land on the first and last item respectively. Opening
 * always moves focus into the menu, so a keyboard user is never left pointing at
 * a menu they cannot reach. Inside, ArrowDown/ArrowUp cycle and Home/End jump to
 * the ends; Escape closes and returns focus to the trigger.
 *
 * This is a disclosure menu, not a dialog: focus is placed into it but not
 * trapped, so Tab still walks out to the rest of the header.
 */
export function NavDropdown({
  label,
  items,
  ariaLabel,
}: {
  label: string
  items: NavItem[]
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Which end of the menu the pending open should land on. A ref, not state,
  // because it must not itself trigger the render that reads it.
  const openIntentRef = useRef<'first' | 'last'>('first')
  const menuId = useId()
  const pathname = usePathname()
  const groupActive = items.some((i) => isActivePath(pathname, i.href))

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)

    // Entering from outside the menu (index -1), so ArrowDown/ArrowUp resolve to
    // the first/last item.
    focusMenuItem(menuRef.current, openIntentRef.current === 'last' ? 'ArrowUp' : 'ArrowDown', -1)
    openIntentRef.current = 'first'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  // Close the menu whenever the route changes (link click / back-forward).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /** ArrowDown/ArrowUp on the trigger open the menu at that end and enter it. */
  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    if (open) {
      // Already showing — focus walked back out to the trigger, so just re-enter.
      focusMenuItem(menuRef.current, e.key, -1)
      return
    }
    openIntentRef.current = e.key === 'ArrowUp' ? 'last' : 'first'
    setOpen(true)
  }

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isMenuNavigationKey(e.key)) return
    // Swallow the key only when focus moved — otherwise arrows would scroll the
    // page out from under the menu.
    if (focusMenuItem(menuRef.current, e.key, activeMenuIndex(menuRef.current))) {
      e.preventDefault()
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        // Only while open: the menu element does not exist to point at otherwise.
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex items-center gap-1 whitespace-nowrap text-sm hover:text-foreground ${
          groupActive ? 'font-medium text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-card py-1 shadow-xl"
        >
          {items.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={`block px-3 py-2 text-sm hover:bg-muted hover:text-foreground ${
                  active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
