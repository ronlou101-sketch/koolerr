import { describe, it, expect } from 'vitest'
import {
  BRAND_AMBASSADOR_LIBRARY,
  getLibraryEntry,
  hashString,
  pickDefaultAmbassador,
} from './library'

describe('Brand Ambassador Library', () => {
  it('is non-empty and every entry is provider-agnostic (no invented provider ids)', () => {
    expect(BRAND_AMBASSADOR_LIBRARY.length).toBeGreaterThan(0)
    for (const e of BRAND_AMBASSADOR_LIBRARY) {
      expect(e.id).toBeTruthy()
      expect(e.displayName).toBeTruthy()
      expect(e.role).toBe('Brand Ambassador')
      expect(Array.isArray(e.personalityTraits)).toBe(true)
      expect(typeof e.seed).toBe('number')
      // providerRefs are optional and, by default, un-curated (no fake ids).
      expect(e.providerRefs).toBeUndefined()
    }
  })

  it('has unique entry ids', () => {
    const ids = BRAND_AMBASSADOR_LIBRARY.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hashString is deterministic and stable', () => {
    expect(hashString('org_abc')).toBe(hashString('org_abc'))
    expect(hashString('org_abc')).not.toBe(hashString('org_xyz'))
  })

  it('pickDefaultAmbassador is deterministic per organization', () => {
    const a = pickDefaultAmbassador('org_12345')
    const b = pickDefaultAmbassador('org_12345')
    expect(a.id).toBe(b.id)
  })

  it('pickDefaultAmbassador always returns a real library entry', () => {
    for (const org of ['org_a', 'org_b', 'org_c', 'org_d', 'org_e', 'org_f', 'org_g']) {
      const picked = pickDefaultAmbassador(org)
      expect(getLibraryEntry(picked.id)).toBeDefined()
    }
  })

  it('distributes across the library for different organizations', () => {
    const orgs = Array.from({ length: 200 }, (_, i) => `org_${i}`)
    const chosen = new Set(orgs.map((o) => pickDefaultAmbassador(o).id))
    // With 200 orgs across a small library, we expect more than one distinct pick.
    expect(chosen.size).toBeGreaterThan(1)
  })
})
