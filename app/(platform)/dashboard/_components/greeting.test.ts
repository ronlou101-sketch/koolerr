import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  HOME_ASK_CTA,
  HOME_ASK_GOALS,
  HOME_ASK_PLUS_LABEL,
  HOME_ASK_SUPPORTING,
  HOME_ASK_TITLE,
  HOME_OUTCOME_TILES,
  HOME_PROMPT_PLACEHOLDER,
  homeAskPrefill,
  visibleHomeOutcomeTiles,
} from './greeting'

const greetingSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'greeting.tsx'),
  'utf8'
)

const dashboardPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../page.tsx'),
  'utf8'
)

const liveRunsPanelSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'LiveRunsPanel.tsx'),
  'utf8'
)

describe('Home H2 UX (Architect c40f0ece)', () => {
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

  it('hides the Review card when nothing needs the customer', () => {
    expect(visibleHomeOutcomeTiles(false).map((tile) => tile.id)).toEqual(['content', 'customers'])
    expect(visibleHomeOutcomeTiles(true).map((tile) => tile.id)).toEqual([
      'content',
      'customers',
      'review',
    ])
    expect(dashboardPageSource).toContain('showReview={attentionCount > 0}')
  })

  it('places outcome tiles before Ask(+) in the first-viewport hierarchy', () => {
    const tilesIdx = greetingSource.indexOf('tiles.map')
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

  it('wires Ask(+) to CampaignCreator with locked Ask Koolerr wording', () => {
    expect(greetingSource).toContain('CampaignCreator')
    expect(greetingSource).toContain(`aria-label={HOME_ASK_PLUS_LABEL}`)
    expect(HOME_ASK_PLUS_LABEL).toBe('Ask Koolerr')
    expect(HOME_ASK_TITLE).toBe('Ask Koolerr')
    expect(HOME_ASK_SUPPORTING).toBe('What do you need?')
    expect(HOME_ASK_CTA).toBe('Start')
    expect(HOME_PROMPT_PLACEHOLDER).toBe('Or just tell Koolerr what you need…')
    expect(greetingSource).toContain('placeholder={HOME_PROMPT_PLACEHOLDER}')
    expect(greetingSource).toContain('submitLabel={HOME_ASK_CTA}')
    expect(greetingSource).toContain('question={HOME_ASK_SUPPORTING}')
    expect(greetingSource).not.toContain('New campaign')
    expect(greetingSource).not.toContain('Create campaign')
    expect(greetingSource).not.toContain('AI marketing team')
    expect(greetingSource).not.toMatch(/href=["']\/pipeline["']/)
    expect(dashboardPageSource).not.toMatch(/href=["']\/pipeline["']/)
  })

  it('pre-fills content/marketing vs customers/leads; blank Ask has no outcome', () => {
    expect(homeAskPrefill('content', '').initialGoal).toBe('content')
    expect(homeAskPrefill('customers', '').initialGoal).toBe('leads')
    expect(homeAskPrefill('blank', '')).toEqual({
      initialGoal: '',
      initialCustomTopic: '',
      initialFocus: '',
    })
    expect(homeAskPrefill('blank', 'Need weekend bookings').initialGoal).toBe('other')
    expect(homeAskPrefill('blank', 'Need weekend bookings').initialCustomTopic).toBe(
      'Need weekend bookings'
    )
    expect(homeAskPrefill('content', 'focus on lawns').initialFocus).toBe('focus on lawns')
    expect(HOME_ASK_GOALS[0]).toEqual({
      key: 'content',
      label: 'Create the next piece of marketing',
    })
    expect(HOME_ASK_GOALS.some((goal) => goal.key === 'leads')).toBe(true)
  })

  it('keeps Review pointed at /approvals', () => {
    const review = HOME_OUTCOME_TILES.find((tile) => tile.id === 'review')
    expect(review && 'href' in review ? review.href : null).toBe('/approvals')
  })
})

describe('Thin Home composition (Architect c40f0ece)', () => {
  it('keeps greeting + working status + one Work destination', () => {
    expect(dashboardPageSource).toContain('Greeting')
    expect(dashboardPageSource).toContain(
      'What would you like Koolerr to do for your business today?'
    )
    expect(dashboardPageSource).toContain('Koolerr is working for you')
    expect(dashboardPageSource).toContain('href="/work"')
    expect(dashboardPageSource).toContain("orgName?.trim() || 'your business'")
  })

  it('hides Learn, campaign health, recent activity, recommended-next-step, and video checklist from Home', () => {
    expect(dashboardPageSource).not.toContain('LearnCta')
    expect(dashboardPageSource).not.toContain('Campaign health')
    expect(dashboardPageSource).not.toContain('Recommended next step')
    expect(dashboardPageSource).not.toContain('Creating your video')
    expect(dashboardPageSource).not.toContain('computeMediaStats')
    expect(dashboardPageSource).not.toContain('timeAgo')
    expect(dashboardPageSource).not.toMatch(/STEP 1/)
    expect(dashboardPageSource).not.toMatch(/Coach/)
    expect(liveRunsPanelSource).not.toMatch(/from ['"].*AIWorkforceProgress['"]/)
    expect(liveRunsPanelSource).not.toContain('<AIWorkforceProgress')
    expect(liveRunsPanelSource).not.toContain('Creating your video')
    expect(liveRunsPanelSource).not.toContain('run.objective')
  })
})
