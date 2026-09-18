import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'), 'utf8')

describe('Usage meters (Architect lock 77d3fbc7 / ac421b6f Domain 2)', () => {
  it('explains that Engagement Runs are not Work campaign counts', () => {
    expect(pageSource).toContain('This is not a count of')
    expect(pageSource).toContain('href="/runs"')
    expect(pageSource).toContain('Work shows every campaign your team started (history)')
    expect(pageSource).toContain('this meter can be 0 even when')
    expect(pageSource).toContain('Work lists many campaigns')
  })

  it('names Work Capacity units, period, overage, and next action from existing data', () => {
    expect(pageSource).toContain('measured')
    expect(pageSource).toContain('in tokens')
    expect(pageSource).toContain('unit="tokens"')
    expect(pageSource).toContain('capacityOverage')
    expect(pageSource).toContain('tokens over the')
    expect(pageSource).toContain('token allowance for {capacityPeriod}')
    expect(pageSource).toContain('href="/billing"')
    expect(pageSource).toContain('review your plan on Billing')
    expect(pageSource).toContain('href="/support"')
    expect(pageSource).toContain('contact Support')
  })

  it('does not introduce unsupported billing or charge claims', () => {
    expect(pageSource).not.toMatch(/charg(e|ed|es)|overage fee|will be billed|invoice/i)
    expect(pageSource).not.toContain('recordUsageEvent')
    expect(pageSource).not.toContain('upgrade required')
  })
})
