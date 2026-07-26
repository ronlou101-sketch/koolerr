'use client'

import { useState } from 'react'

/**
 * Objective textarea + preset chips for the CTO Agent form.
 *
 * Client component so the preset chips can populate the textarea on click
 * (the previous server-rendered buttons had no handler and did nothing). The
 * field keeps name="objective" so it still submits with the existing server
 * action — no change to the form action or the CTO run logic.
 */
export function ObjectiveField({ presets }: { presets: string[] }) {
  const [value, setValue] = useState('')

  return (
    <>
      <textarea
        name="objective"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="e.g. Generate implementation plan for Phase 3 Milestone 2"
        required
      />
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setValue(preset)}
            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
            aria-label={`Use preset: ${preset}`}
          >
            {preset.length > 60 ? preset.slice(0, 57) + '…' : preset}
          </button>
        ))}
      </div>
    </>
  )
}
