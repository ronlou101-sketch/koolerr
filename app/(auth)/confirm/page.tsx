import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>
}) {
  const { token_hash, type, next } = await searchParams

  if (!token_hash || !type) {
    redirect('/login?error=missing_token')
  }

  async function confirmReset(formData: FormData) {
    'use server'
    const hash = formData.get('token_hash') as string
    const otpType = formData.get('type') as EmailOtpType
    const destination = (formData.get('next') as string) || '/reset-password'

    const supabase = await createSessionServerClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: hash, type: otpType })

    if (error) {
      redirect('/login?error=confirm_failed')
    }

    redirect(destination)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Click the button below to confirm your identity and set a new password.
      </p>
      <form action={confirmReset} className="mt-6">
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next ?? '/reset-password'} />
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Confirm password reset
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
