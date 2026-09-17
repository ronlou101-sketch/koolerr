import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'LiveRunsPanel.tsx'),
  'utf8'
)

describe('LiveRunsPanel thin Home status (c40f0ece)', () => {
  it('does not mount the 7-step workforce checklist on Home', () => {
    expect(source).not.toMatch(/from ['"].*AIWorkforceProgress['"]/)
    expect(source).not.toContain('<AIWorkforceProgress')
    expect(source).not.toContain('Creating your video')
    expect(source).not.toContain('run.objective')
  })
})
