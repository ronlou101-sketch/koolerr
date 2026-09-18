import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isEngineeringResidue } from './_lib/is-engineering-residue'

const dir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(dir, 'page.tsx'), 'utf8')
const detailSource = readFileSync(join(dir, '[id]/page.tsx'), 'utf8')
const workPageSource = readFileSync(join(dir, '../work/page.tsx'), 'utf8')

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

describe('Work residue demotion (Architect lock bef9971b / ac421b6f Domain 1)', () => {
  it('classifies residue with the shared helper and keeps customer HVAC work in the primary scan', () => {
    expect(pageSource).toContain("from './_lib/is-engineering-residue'")
    expect(pageSource).toContain('isEngineeringResidue(run.objective)')
    expect(pageSource).toContain('primaryRuns')
    expect(pageSource).toContain('residueRuns')
    expect(isEngineeringResidue('Create a video testimonial for my HVAC business')).toBe(false)
    expect(isEngineeringResidue('HeyGen video generation for script: stage6-e2e-final')).toBe(true)
  })

  it('places residue in a collapsed secondary section instead of deleting it', () => {
    expect(pageSource).toContain('<details')
    expect(pageSource).toContain('Older system checks')
    expect(pageSource).toContain('residueRuns.map')
    expect(pageSource).toContain('href={`/runs/${run.id}`}')
    expect(pageSource).not.toContain('residueRuns.filter')
  })

  it('keeps headline aggregates honest across all engagement runs', () => {
    expect(pageSource).toContain('runs.length')
    expect(pageSource).toContain("r.status === 'completed'")
    expect(pageSource).toContain("r.status === 'pending' || r.status === 'running'")
    expect(pageSource).toContain('listed')
    expect(pageSource).toContain('separately below')
    expect(pageSource).toContain('Totals include every campaign.')
  })

  it('does not rewrite status labels or infer residue from failed+empty alone', () => {
    expect(pageSource).toContain('RUN_STATUS_LABELS[run.status]')
    expect(pageSource).not.toMatch(/status === ['"]failed['"].*deliverableIds\.length === 0/)
    expect(pageSource).not.toContain("RUN_STATUS_LABELS.failed =")
    expect(detailSource).not.toContain("RUN_STATUS_LABELS.failed =")
  })

  it('keeps findRunFailure for real failures and explains residue as a system render check', () => {
    expect(detailSource).toContain('findRunFailure')
    expect(detailSource).toContain('isEngineeringResidue')
    expect(detailSource).toContain('System render check')
    expect(detailSource).toContain('Start a new campaign from Work')
    expect(detailSource).toContain('href="/support"')
    expect(detailSource).toContain('run.status === \'failed\' && !residue')
  })
})

