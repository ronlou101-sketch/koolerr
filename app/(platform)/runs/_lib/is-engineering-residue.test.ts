import { describe, expect, it } from 'vitest'
import { isEngineeringResidue } from './is-engineering-residue'

describe('isEngineeringResidue()', () => {
  describe('positive residue (safe to demote)', () => {
    it.each([
      ['HeyGen video generation for script: stage6-e2e-final'],
      ['HeyGen video generation for script: abc-123'],
      ['heygen video generation for script: x'],
      ['Higgsfield image generation: a sunset over Phoenix'],
      ['HIGGSFIELD IMAGE GENERATION: foo'],
      ['stage6-e2e-final'],
      ['stage6-e2e-retest3'],
      ['stage6-e2e-test'],
      ['leftover stage6-e2e check'],
      ['step2e-verify'],
      ['run step2e-verify now'],
      ['e2e-final'],
      ['e2e-test'],
      ['e2e-retest'],
    ])('classifies %j as residue', (objective) => {
      expect(isEngineeringResidue(objective)).toBe(true)
    })
  })

  describe('customer false positives (must stay in the primary scan)', () => {
    it.each([
      ['Create a video testimonial for my HVAC business'],
      ['Use HeyGen to create a video testimonial for my HVAC business'],
      ['HeyGen can help my HVAC business'],
      ['HeyGen-style video for my salon'],
      ['Please generate a HeyGen video for my HVAC business'],
      ['Launch spring promo'],
      ['Write blog about our new service'],
      ['Image generation: a single plain red square'],
      ['video generation for my product'],
      ['final e2e review of our campaign'],
      ['test the new campaign'],
      ['e2e final walkthrough'],
    ])('does not classify %j as residue', (objective) => {
      expect(isEngineeringResidue(objective)).toBe(false)
    })
  })

  it('never infers residue from failed+empty — it only reads the objective string', () => {
    expect(isEngineeringResidue('Finish the landing page video')).toBe(false)
    expect(isEngineeringResidue.length).toBe(1)
  })

  it('treats empty or non-string input as not residue', () => {
    expect(isEngineeringResidue('')).toBe(false)
    expect(isEngineeringResidue('   ')).toBe(false)
    expect(isEngineeringResidue(undefined as unknown as string)).toBe(false)
  })
})
