'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getSupabaseClient } from '@/shared/lib/supabase'

type Stage =
  | 'provisioning'
  | 'provisioning_error'
  | 'set_password'
  | 'signing_in'
  | 'existing_account'
  | 'done'

const MAX_CLIENT_RETRIES = 3

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [stage, setStage] = useState<Stage>('provisioning')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const runProvisioning = useCallback(async () => {
    if (!sessionId) {
      setStage('provisioning_error')
      setError('No checkout session found. Please contact support.')
      return
    }

    setStage('provisioning')
    setError(null)

    try {
      const response = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = (await response.json()) as {
        email?: string
        isNewAccount?: boolean
        error?: string
        paymentStatus?: string
        message?: string
      }

      if (response.status === 402) {
        setStage('provisioning_error')
        setError(
          'Payment has not been confirmed yet. Please wait a moment and try again, or contact support if this persists.'
        )
        return
      }

      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? 'Account setup failed')
      }

      if (!data.email) {
        throw new Error('Unexpected response from server')
      }

      setEmail(data.email)

      if (data.isNewAccount === false) {
        // Customer already had a Koolerr account — plan was upgraded, prompt sign-in.
        setStage('existing_account')
      } else {
        setStage('set_password')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRetryCount((prev) => prev + 1)
      setStage('provisioning_error')
      setError(msg)
    }
  }, [sessionId])

  // Run provisioning automatically on mount.
  useEffect(() => {
    // If already authenticated, go straight to dashboard.
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace('/dashboard')
        return
      }
      runProvisioning()
    })
  }, [runProvisioning, router])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Set the password on the newly created account.
      const setRes = await fetch('/api/checkout/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const setData = (await setRes.json()) as {
        success?: boolean
        message?: string
        error?: string
      }
      if (!setRes.ok) {
        throw new Error(setData.message ?? setData.error ?? 'Failed to set password')
      }

      // Sign in with the newly created credentials.
      setStage('signing_in')
      const supabase = getSupabaseClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        throw new Error(signInError.message)
      }

      setStage('done')
      router.push('/dashboard')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStage('set_password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex">
          <Image
            src="/Koolerr_Logo_Wordmark.png"
            alt="Koolerr"
            width={3840}
            height={1274}
            className="h-14 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Provisioning spinner */}
        {stage === 'provisioning' && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm font-medium text-foreground">Setting up your account…</p>
            <p className="mt-1 text-xs text-muted-foreground">This usually takes a few seconds.</p>
          </div>
        )}

        {/* Provisioning error + retry */}
        {stage === 'provisioning_error' && (
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  className="h-5 w-5 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-foreground">Account setup incomplete</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your payment was successful, but we ran into a problem setting up your account.
              </p>
            </div>

            {error && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            {retryCount < MAX_CLIENT_RETRIES ? (
              <button
                onClick={runProvisioning}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Retry setup
              </button>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Setup is taking longer than expected. Your payment was captured and your account
                  will be ready shortly.
                </p>
                <p className="text-sm text-muted-foreground">
                  Email us at{' '}
                  <a
                    href="mailto:team@koolerr.com"
                    className="font-medium text-primary hover:underline"
                  >
                    team@koolerr.com
                  </a>{' '}
                  and we will get you access immediately.
                </p>
                <button
                  onClick={() => {
                    setRetryCount(0)
                    runProvisioning()
                  }}
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Try one more time
                </button>
              </div>
            )}
          </div>
        )}

        {/* Password creation form */}
        {stage === 'set_password' && (
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-6">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-center text-xl font-semibold text-foreground">
                Payment confirmed
              </h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Create a password to access your account.
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="mt-1 block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-foreground"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Repeat your password"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>
        )}

        {/* Signing in spinner */}
        {stage === 'signing_in' && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm font-medium text-foreground">Signing you in…</p>
          </div>
        )}

        {/* Existing account — upgraded plan, prompt sign-in */}
        {stage === 'existing_account' && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Plan upgraded</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your subscription has been upgraded. Sign in with your existing password to continue.
            </p>
            <Link
              href="/login"
              className="mt-6 block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
