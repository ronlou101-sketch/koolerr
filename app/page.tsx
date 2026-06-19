import { redirect } from 'next/navigation'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export default async function Home() {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
