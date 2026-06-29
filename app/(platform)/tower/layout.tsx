import { notFound } from 'next/navigation'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { TowerNav } from './_components/TowerNav'

// All /tower/* routes inherit this founder gate. Sub-pages need no additional check.
export const dynamic = 'force-dynamic'

export default async function TowerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email !== 'ronlou101@gmail.com') notFound()

  return (
    <div className="flex gap-8">
      <TowerNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
