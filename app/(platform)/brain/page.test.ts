import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'), 'utf8')

describe('Brain canonical total (Architect lock 77d3fbc7 / ac421b6f Domain 2)', () => {
  it('uses intelligence.trends.totalMemories as the sole customer-visible Brain total', () => {
    expect(pageSource).toContain('intelligence.trends.totalMemories')
    expect(pageSource).toContain('canonicalTotal')
    expect(pageSource).toContain(
      "`${canonicalTotal} ${canonicalTotal === 1 ? 'memory' : 'memories'} — what your workforce knows about your business.`"
    )
  })

  it('does not present queryMemory length or totalCount as the org total', () => {
    expect(pageSource).toContain('limit: 200')
    expect(pageSource).not.toContain('const { memories, totalCount }')
    expect(pageSource).not.toMatch(/\$\{totalCount\} \$\{totalCount === 1 \? 'memory'/)
    expect(pageSource).not.toMatch(/memories\.length === 0\s*\?\s*'No memories stored yet/)
    expect(pageSource).toContain('will not estimate a total from')
    expect(pageSource).toContain("typeof intelligence.trends.totalMemories === 'number'")
  })

  it('labels knowledge-type pattern counts as a subset, not a second total', () => {
    expect(pageSource).toContain("insight.type === 'pattern'")
    expect(pageSource).toContain(
      'This is a subset for this knowledge type — not a second Business Brain'
    )
    expect(pageSource).not.toContain('memories total')
  })

  it('softens dogfooding sources and UUID leads in the default memory list', () => {
    expect(pageSource).toContain('displayMemorySource')
    expect(pageSource).toContain("source.startsWith('dogfooding')")
    expect(pageSource).toContain('Internal check')
    expect(pageSource).toContain('UUID_VALUE')
    expect(pageSource).toContain('displayContentValue')
    expect(pageSource).not.toContain('Source: {memory.source}')
  })
})
