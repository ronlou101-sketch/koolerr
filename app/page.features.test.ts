import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'), 'utf8')

const FEATURES_BLOCK = pageSource.slice(
  pageSource.indexOf('const FEATURES'),
  pageSource.indexOf('const STEPS')
)

const FAQ_BLOCK = pageSource.slice(
  pageSource.indexOf('const FAQS'),
  pageSource.indexOf('export default')
)

const SHOWCASE_BLOCK = pageSource.slice(
  pageSource.indexOf('Real roles. AI-powered.'),
  pageSource.indexOf('Visual mockup')
)

function featureTitles(block: string): string[] {
  return [...block.matchAll(/title:\s*'([^']+)'/g)].map((match) => match[1])
}

describe('landing FEATURES (Architect 94274eb9 / D8)', () => {
  it('keeps customer-journey features: workforce, Business Brain, and approvals', () => {
    const titles = featureTitles(FEATURES_BLOCK)
    expect(titles).toEqual(['AI Marketing Workforce', 'Business Brain', 'Human Approvals'])
  })

  it('omits owner/operator surfaces from FEATURES', () => {
    const titles = featureTitles(FEATURES_BLOCK)
    expect(titles).not.toContain('Mission Control')
    expect(titles).not.toContain('Full Audit Trail')
    expect(titles).not.toContain('CTO Agent — Atlas')
  })
})

describe('public landing does not advertise owner/operator tools', () => {
  it('does not sell CTO Agent, Atlas, Mission Control, or Audit Trail', () => {
    expect(pageSource).not.toMatch(/CTO Agent/i)
    expect(pageSource).not.toMatch(/\bAtlas\b/)
    expect(pageSource).not.toMatch(/Mission Control/i)
    expect(pageSource).not.toMatch(/audit trail/i)
  })

  it('keeps the AI workforce showcase to customer marketing roles', () => {
    expect(SHOWCASE_BLOCK).toContain('Content Strategist')
    expect(SHOWCASE_BLOCK).toContain('Copywriter')
    expect(SHOWCASE_BLOCK).toContain('Editor')
    expect(SHOWCASE_BLOCK).not.toMatch(/CTO Agent/i)
    expect(SHOWCASE_BLOCK).not.toMatch(/\bAtlas\b/)
  })
})

describe('landing FAQ (customer-journey framing)', () => {
  it('keeps workforce, brain, and approval questions without owner-tool copy', () => {
    expect(FAQ_BLOCK).toContain("q: 'What exactly is an AI workforce?'")
    expect(FAQ_BLOCK).toContain("q: 'How is this different from ChatGPT or other AI tools?'")
    expect(FAQ_BLOCK).toContain("q: 'Do I need technical skills to use Koolerr?'")
    expect(FAQ_BLOCK).toContain("q: 'Will the content sound like my brand?'")
    expect(FAQ_BLOCK).toContain("q: 'Can I control what the AI does?'")
    expect(FAQ_BLOCK).toContain("q: 'What happens to my data?'")
    expect(FAQ_BLOCK).not.toMatch(/CTO Agent/i)
    expect(FAQ_BLOCK).not.toMatch(/\bAtlas\b/)
    expect(FAQ_BLOCK).not.toMatch(/Mission Control/i)
    expect(FAQ_BLOCK).not.toMatch(/audit trail/i)
  })
})
