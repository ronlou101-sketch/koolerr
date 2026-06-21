'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/shared/lib/supabase'
import { provision } from '@/app/(auth)/signup/actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      console.log('[LOGIN] step 1 — calling signInWithPassword')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log(
        '[LOGIN] step 1 result —',
        authError ? `FAIL: ${authError.message}` : `OK user=${authData.user?.id}`
      )

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      console.log('[LOGIN] step 2 — calling provision()')
      const accountResult = await provision('')
      console.log('[LOGIN] step 2 result —', JSON.stringify(accountResult))

      if (!accountResult.success) {
        setError(`Account setup failed: ${accountResult.error}`)
        setLoading(false)
        return
      }

      const destination = accountResult.alreadyProvisioned ? '/dashboard' : '/onboarding'
      console.log('[LOGIN] step 3 — routing to', destination)
      router.push(destination)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[LOGIN] uncaught exception —', msg)
      setError(`Login error: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your Koolerr workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="you@company.com"
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
