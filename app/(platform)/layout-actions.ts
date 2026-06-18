'use server'

import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createSessionServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
