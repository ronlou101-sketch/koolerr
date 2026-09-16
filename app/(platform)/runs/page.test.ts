import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'), 'utf8')
const workPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../work/page.tsx'),
  'utf8'
)

describe('Work hub depth on /runs (Architect lock f764eda3)', () => {
  it('presents Work — not Campaigns — as the primary heading identity', () => {
    expect(pageSource).toContain('>Work</h1>')
    expect(pageSource).not.toContain('>Campaigns</h1>')
  })

  it('keeps the existing run list destination at /runs/:id', () => {
    expect(pageSource).toContain('href={`/runs/${run.id}`}')
    expect(pageSource).not.toMatch(/redirect\(['"]\/work['"]\)/)
    expect(pageSource).not.toMatch(/redirect\(['"]\/campaigns['"]\)/)
  })

  it('keeps the existing New campaign create affordance', () => {
    expect(pageSource).toContain('NewCampaignModal')
    expect(pageSource).toContain("from './_components/new-campaign-modal'")
    expect(pageSource).toContain('<NewCampaignModal />')
    expect(pageSource).toContain('label="Start your first campaign"')
  })

  it('preserves the /work hub In progress destination at /runs', () => {
    expect(workPageSource).toContain("from '../_lib/nav-items'")
    expect(workPageSource).toContain('WORK_NAV.map')
    expect(workPageSource).toContain("'/runs': 'See what your team is working on now.'")
  })

  it('does not introduce a new route or alias', () => {
    expect(pageSource).not.toMatch(/redirect\(['"]\/(?!login)/)
    expect(pageSource).not.toContain('permanentRedirect')
  })

  it('keeps the page from horizontal scrolling on phone and desktop', () => {
    expect(pageSource).toContain('overflow-x-hidden')
    expect(pageSource).toContain('min-w-0')
    expect(pageSource).toContain('break-words')
    expect(pageSource).toContain('flex-wrap')
  })
})
