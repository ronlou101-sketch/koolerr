import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FEATURES } from './page'

const pageSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'), 'utf8')

const FEATURES_BLOCK = pageSource.slice(
  pageSource.indexOf('export const FEATURES'),
  pageSource.indexOf('const STEPS')
)

const FAQ_BLOCK = pageSource.slice(
  pageSource.indexOf('const FAQS'),
  pageSource.indexOf('export default')
)

describe('landing FEATURES (Architect 94274eb9 / D8)', () => {
  it('keeps customer-journey features: workforce, Business Brain, and approvals', () => {
    const titles = FEATURES.map((f) => f.title)
    expect(titles).toContain('AI Marketing Workforce')
    expect(titles).toContain('Business Brain')
    expect(titles).toContain('Human Approvals')
  })

  it('omits Mission Control, Full Audit Trail, and CTO Agent—Atlas from FEATURES', () => {
    const titles = FEATURES.map((f) => f.title)
    expect(titles).not.toContain('Mission Control')
    expect(titles).not.toContain('Full Audit Trail')
    expect(titles).not.toContain('CTO Agent — Atlas')
    expect(FEATURES_BLOCK).not.toContain('Mission Control')
    expect(FEATURES_BLOCK).not.toContain('Full Audit Trail')
    expect(FEATURES_BLOCK).not.toContain('CTO Agent')
  })
})

describe('landing FAQ (out of scope for this slice)', () => {
  it('leaves the existing FAQ questions in place', () => {
    expect(FAQ_BLOCK).toContain("q: 'What exactly is an AI workforce?'")
    expect(FAQ_BLOCK).toContain("q: 'How is this different from ChatGPT or other AI tools?'")
    expect(FAQ_BLOCK).toContain("q: 'Do I need technical skills to use Koolerr?'")
    expect(FAQ_BLOCK).toContain("q: 'Will the content sound like my brand?'")
    expect(FAQ_BLOCK).toContain("q: 'Can I control what the AI does?'")
    expect(FAQ_BLOCK).toContain("q: 'What happens to my data?'")
  })
})
