'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { LogOut, User } from 'lucide-react'
import { activeMenuIndex, focusMenuItem, isMenuNavigationKey } from './nav-dropdown-focus'

/**
 * Account menu (profile dropdown) for the platform header.
 *
 * Consolidates account actions behind a compact, always-visible profile button so they
 * stay reachable at every viewport width — the long nav can no longer push "Sign out"
 * off-screen. Opens a dropdown showing the signed-in email and a Sign out action; closes
 * on outside click or Escape, returning focus to the trigger. Sign out still submits the
 * existing server action, so the auth flow is unchanged.
 *
 * Keyboard: the trigger opens the menu with Enter/Space (native button) or with
 * ArrowDown/ArrowUp, which land on the first and last item respectively. Opening always
 * moves focus into the menu, so a keyboard user is never left pointing at a menu they
 * cannot reach. Inside, ArrowDown/ArrowUp cycle and Home/End jump to the ends; Escape
 * closes and returns focus to the trigger.
 *
 * This is a disclosure menu, not a dialog: focus is placed into it but not trapped, so
 * Tab still walks out to the rest of the header.
 *
 * The roving logic is imported from `nav-dropdown-focus` rather than reimplemented — the
 * two header dropdowns must answer the same keys the same way, and one implementation
 * cannot drift from itself. Only `[role="menuitem"]` participates, so the "Signed in as"
 * header block is skipped by arrow navigation without needing to be marked.
 */
export function AccountMenu({
  signOutAction,
  email,
}: {
  signOutAction: () => void | Promise<void>
  email?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Which end of the menu the pending open should land on. A ref, not state,
  // because it must not itself trigger the render that reads it.
  const openIntentRef = useRef<'first' | 'last'>('first')
  const menuId = useId()
  const initial = (email?.trim()?.[0] ?? 'U').toUpperCase()

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
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        // Only while open: the menu element does not exist to point at otherwise.
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-foreground hover:bg-muted/70"
      >
        {email ? initial : <User className="h-4 w-4" aria-hidden="true" />}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-card shadow-xl"
        >
          {email && (
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium text-foreground">{email}</p>
            </div>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
