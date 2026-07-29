'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CampaignCreator } from '../../_components/campaign-creator'

/**
 * "New campaign" entry point on the Campaigns page (Experience Phase 13 Slice C).
 *
 * A single button opens a modal that hosts the shared CampaignCreator flow, so
 * Campaigns becomes the one place a customer goes to start a campaign — no more
 * "go to Pipeline". Presentation only; the creation flow underneath is unchanged.
 *
 * Accessibility mirrors the mobile-nav drawer: a labelled modal dialog, focus
 * moves to Close on open, Escape closes, focus returns to the trigger on close.
 * If a campaign was started while open, the server-rendered list is refreshed on
 * close so the new campaign appears.
 */
export function NewCampaignModal({
  label = 'New campaign',
  variant = 'primary',
}: {
  label?: string
  variant?: 'primary' | 'ghost'
}) {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

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

  function close() {
    setOpen(false)
    // Reveal the freshly-started campaign in the list behind the modal.
    if (started) {
      setStarted(false)
      router.refresh()
    }
  }

  const triggerClass =
    variant === 'primary'
      ? 'shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
      : 'inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="New campaign"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative mt-8 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">New campaign</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tell me what you&apos;d like your marketing to accomplish, and I&apos;ll take it
                  from there.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close"
                onClick={close}
                className="shrink-0 text-muted-foreground hover:text-foreground"
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

            <CampaignCreator onStarted={() => setStarted(true)} />
          </div>
        </div>
      )}
    </>
  )
}
