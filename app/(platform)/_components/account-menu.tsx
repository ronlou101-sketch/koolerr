'use client'

import { useEffect, useRef, useState } from 'react'
import { LogOut, User } from 'lucide-react'

/**
 * Account menu (profile dropdown) for the platform header.
 *
 * Consolidates account actions behind a compact, always-visible profile button so they
 * stay reachable at every viewport width — the long nav can no longer push "Sign out"
 * off-screen. Opens a dropdown showing the signed-in email and a Sign out action; closes
 * on outside click or Escape, returning focus to the trigger. Sign out still submits the
 * existing server action, so the auth flow is unchanged.
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
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-foreground hover:bg-muted/70"
      >
        {email ? initial : <User className="h-4 w-4" aria-hidden="true" />}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
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
