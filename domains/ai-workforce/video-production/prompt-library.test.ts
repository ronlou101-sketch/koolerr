import { describe, expect, it } from 'vitest'
import {
  VIDEO_CONCEPTS,
  VIDEO_DURATION_PRESETS,
  MAX_VIDEO_SECONDS,
  isValidVideoDuration,
  getVideoConcept,
} from './prompt-library'

describe('video concept library (Step 4A)', () => {
  it('offers the curated set of concepts with unique ids and complete fields', () => {
    expect(VIDEO_CONCEPTS.length).toBeGreaterThanOrEqual(7)
    const ids = VIDEO_CONCEPTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length) // unique
    for (const c of VIDEO_CONCEPTS) {
      expect(c.title.trim()).not.toBe('')
      expect(c.description.trim()).not.toBe('')
      expect(c.starterScript.trim().length).toBeGreaterThan(20)
      expect(isValidVideoDuration(c.suggestedDurationSec)).toBe(true)
    }
  })

  it('includes the founder-listed concept themes', () => {
    const ids = VIDEO_CONCEPTS.map((c) => c.id)
    for (const theme of [
      'promotional-offer',
      'service-introduction',
      'educational-tip',
      'social-ad',
    ]) {
      expect(ids).toContain(theme)
    }
  })

  it('getVideoConcept resolves a known id and rejects an unknown one', () => {
    expect(getVideoConcept('promotional-offer')?.title).toBeTruthy()
    expect(getVideoConcept('nope')).toBeUndefined()
  })
})

describe('duration model (cost control)', () => {
  it('exposes exactly the 30/60/90/120 presets with a 120s hard max', () => {
    expect([...VIDEO_DURATION_PRESETS]).toEqual([30, 60, 90, 120])
    expect(MAX_VIDEO_SECONDS).toBe(120)
  })

  it('accepts only the presets', () => {
    expect(isValidVideoDuration(30)).toBe(true)
    expect(isValidVideoDuration(120)).toBe(true)
    expect(isValidVideoDuration(45)).toBe(false)
    expect(isValidVideoDuration(121)).toBe(false)
    expect(isValidVideoDuration(0)).toBe(false)
  })
})
