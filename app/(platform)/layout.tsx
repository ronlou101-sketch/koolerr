import Image from 'next/image'
import Link from 'next/link'
import { signOut } from './layout-actions'

export const runtime = 'nodejs'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="ml-1 inline-flex items-center">
              <Image
                src="/Koolerr_Logo_Trimmed.png"
                alt="Koolerr"
                width={3840}
                height={1441}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              <Link
                href="/cto"
                className="text-sm font-medium text-foreground hover:text-foreground"
              >
                CTO Agent
              </Link>
              <Link href="/runs" className="text-sm text-muted-foreground hover:text-foreground">
                Runs
              </Link>
              <Link
                href="/workforces"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Workforces
              </Link>
              <Link
                href="/approvals"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Approvals
              </Link>
              <Link href="/brain" className="text-sm text-muted-foreground hover:text-foreground">
                Brain
              </Link>
              <Link href="/consent" className="text-sm text-muted-foreground hover:text-foreground">
                Consent
              </Link>
              <Link href="/audit" className="text-sm text-muted-foreground hover:text-foreground">
                Audit
              </Link>
              <Link href="/usage" className="text-sm text-muted-foreground hover:text-foreground">
                Usage
              </Link>
              <Link
                href="/analytics"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Analytics
              </Link>
              <Link href="/revenue" className="text-sm text-muted-foreground hover:text-foreground">
                Revenue
              </Link>
              <Link
                href="/mission-control"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Mission Control
              </Link>
              <Link href="/billing" className="text-sm text-muted-foreground hover:text-foreground">
                Billing
              </Link>
            </nav>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
