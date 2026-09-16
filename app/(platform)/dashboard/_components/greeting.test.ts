import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HOME_OUTCOME_TILES } from './greeting'

const greetingSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'greeting.tsx'),
  'utf8'
)

const dashboardPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../page.tsx'),
  'utf8'
)

describe('Home visual north-star (Architect 8e01c1ed)', () => {
  it('uses outcome language for the three Home tiles', () => {
    expect(HOME_OUTCOME_TILES.map((tile) => tile.label)).toEqual([
      'Create content',
      'Get more customers',
      'Review your work',
    ])
    expect(HOME_OUTCOME_TILES).toHaveLength(3)
  })

  it('does not add a Phase 8 video outcome tile', () => {
    expect(HOME_OUTCOME_TILES).toHaveLength(3)
    expect(HOME_OUTCOME_TILES.map((tile) => tile.id)).toEqual(['content', 'customers', 'review'])
    expect(HOME_OUTCOME_TILES.some((tile) => /video/i.test(tile.label))).toBe(false)
    expect(HOME_OUTCOME_TILES.some((tile) => /video/i.test(tile.id))).toBe(false)
  })

  it('places outcome tiles before Ask(+) in the first-viewport hierarchy', () => {
    const tilesIdx = greetingSource.indexOf('HOME_OUTCOME_TILES.map')
    const askIdx = greetingSource.indexOf('id="home-ask"')
    expect(tilesIdx).toBeGreaterThan(-1)
    expect(askIdx).toBeGreaterThan(tilesIdx)
  })

  it('does not send create tiles to /pipeline', () => {
    for (const tile of HOME_OUTCOME_TILES) {
      if (tile.kind === 'create') {
        expect('href' in tile).toBe(false)
      }
    }
    const hrefs = HOME_OUTCOME_TILES.flatMap((tile) => ('href' in tile ? [tile.href] : []))
    expect(hrefs).not.toContain('/pipeline')
    expect(hrefs).toContain('/approvals')
  })

  it('wires Ask(+) to the existing CampaignCreator, not a /pipeline link', () => {
    expect(greetingSource).toContain('CampaignCreator')
    expect(greetingSource).toContain('aria-label="Ask+"')
    expect(greetingSource).not.toMatch(/href=["']\/pipeline["']/)
    expect(dashboardPageSource).not.toMatch(/href=["']\/pipeline["']/)
  })
})
