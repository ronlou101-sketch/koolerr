import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CAMPAIGN_CREATOR_QUESTION, CAMPAIGN_CREATOR_SUBMIT_LABEL, GOALS } from './campaign-creator'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'campaign-creator.tsx'),
  'utf8'
)

describe('CampaignCreator H2 optional Ask props (c40f0ece)', () => {
  it('keeps Work defaults for question and submit label', () => {
    expect(CAMPAIGN_CREATOR_QUESTION).toBe('What do you want your AI marketing team to do?')
    expect(CAMPAIGN_CREATOR_SUBMIT_LABEL).toBe('Create campaign')
    expect(source).toContain('question = CAMPAIGN_CREATOR_QUESTION')
    expect(source).toContain('submitLabel = CAMPAIGN_CREATOR_SUBMIT_LABEL')
  })

  it('does not change the POST /api/pipeline/run contract', () => {
    expect(source).toContain("fetch('/api/pipeline/run'")
    expect(source).toContain('JSON.stringify({ topic, brief: focus.trim() || undefined })')
    expect(source).not.toMatch(/JSON\.stringify\(\{[^}]*outcome/)
  })

  it('accepts optional initial goal/topic/focus without renaming Work goals', () => {
    expect(source).toContain('initialGoal = ')
    expect(source).toContain('initialCustomTopic = ')
    expect(source).toContain('initialFocus = ')
    expect(GOALS.map((goal) => goal.key)).toEqual([
      'leads',
      'calls',
      'appointments',
      'service',
      'awareness',
      'repeat',
      'other',
    ])
  })
})
