'use client'

import { useEffect, useState } from 'react'

/**
 * Time-of-day greeting for the dashboard header.
 *
 * Client component so the greeting reflects the viewer's local time (server
 * time could be a different timezone). Renders "Good morning" on the server and
 * as the initial client state — matching to avoid hydration mismatch — then
 * corrects to afternoon/evening after mount. Presentation only.
 */
export function Greeting({ subtitle }: { subtitle: string }) {
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
