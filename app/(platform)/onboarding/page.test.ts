import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'), 'utf8')

const WIZARD_STEPS_MATCH = pageSource.match(/const WIZARD_STEPS: Step\[\] = \[([\s\S]*?)\]/)

function wizardSteps(): string[] {
  expect(WIZARD_STEPS_MATCH).not.toBeNull()
  return (WIZARD_STEPS_MATCH?.[1].match(/'([^']+)'/g) ?? []).map((token) => token.replace(/'/g, ''))
}

describe('Day-1 onboarding path (Architect lock 2ea2c816)', () => {
  it('requires business-info → services → audience → brand-identity → review → launching', () => {
    expect(wizardSteps()).toEqual([
      'business-info',
      'services',
      'audience',
      'brand-identity',
      'review',
      'launching',
    ])
  })

  it('does not include strategy or presence as required Day-1 steps', () => {
    expect(wizardSteps()).not.toContain('strategy')
    expect(wizardSteps()).not.toContain('presence')
    expect(pageSource).not.toMatch(/setStep\('strategy'\)/)
    expect(pageSource).not.toMatch(/setStep\('presence'\)/)
    expect(pageSource).not.toMatch(/step === 'strategy'/)
    expect(pageSource).not.toMatch(/step === 'presence'/)
  })

  it('routes brand-identity Continue to review, and review Back to brand-identity', () => {
    const brandBlock = pageSource.slice(
      pageSource.indexOf("{step === 'brand-identity' &&"),
      pageSource.indexOf("{step === 'review' &&")
    )
    const reviewBlock = pageSource.slice(pageSource.indexOf("{step === 'review' &&"))

    expect(brandBlock).toContain("setStep('review')")
    expect(brandBlock).not.toContain("setStep('strategy')")
    expect(reviewBlock).toContain("setStep('brand-identity')")
    expect(reviewBlock).not.toContain("setStep('presence')")
  })

  it('launches onto the existing /dashboard Home, not a new post-onboarding screen', () => {
    expect(pageSource).toContain("'/dashboard'")
    expect(pageSource).toContain('`/dashboard?ai_run=${triggerResult.engagementRunId}`')
    expect(pageSource).not.toMatch(/router\.push\(['"]\/(?!dashboard)/)
  })

  it('keeps field-min on the Day-1 steps that remain required', () => {
    expect(pageSource).toContain('!businessName.trim()')
    expect(pageSource).toContain('!businessCategory.trim()')
    expect(pageSource).toContain('!industry.trim()')
    expect(pageSource).toContain('!location.trim()')
    expect(pageSource).toContain('!primaryService.trim()')
    expect(pageSource).toContain('!targetAudience.trim()')
    expect(pageSource).not.toContain('!businessGoals.trim()')
    expect(pageSource).not.toContain('Business goals are required')
  })

  it('does not gate review or launch on strategy or presence fields', () => {
    expect(pageSource).not.toContain('label="Content goals"')
    expect(pageSource).not.toContain('label="Platforms"')
    expect(pageSource).not.toContain('label="Advantages"')
    expect(pageSource).toContain('preferredPlatforms: []')
    expect(pageSource).toContain('businessGoals: undefined')
  })

  it('keeps the mobile form from horizontal scrolling and keeps Continue/Launch in flow', () => {
    expect(pageSource).toContain('overflow-x-hidden')
    expect(pageSource).toContain('min-w-0')
    expect(pageSource).toContain('break-words')
    expect(pageSource).toContain('flex-wrap')
    expect(pageSource).toContain('Continue')
    expect(pageSource).toContain('Launch Marketing Team')
  })
})
