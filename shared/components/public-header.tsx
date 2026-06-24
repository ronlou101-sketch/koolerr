'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/Koolerr_Logo_Trimmed.png"
            alt="Koolerr"
            width={3840}
            height={1441}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          <Link
            href="/features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/support"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Support
          </Link>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background sm:hidden">
          <nav className="flex flex-col p-4">
            <Link
              href="/features"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/support"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Support
            </Link>
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
              <Link
                href="/login"
                className="rounded-md border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-foreground px-3 py-2.5 text-center text-sm font-semibold text-background"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
