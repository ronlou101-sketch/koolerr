import { describe, it, expect } from 'vitest'
import type { CreativeBrief } from '../creative/types'
import { buildSkippedVideoProductionBrief, VIDEO_SKIPPED_NOTE } from './skip'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeCreativeBrief(): CreativeBrief {
  return {
    visualStyle: 'Clean, modern',
    brandingGuidelines: 'Blue and white',
    avatarDirection: 'Friendly presenter',
    voiceDirection: 'Warm, confident',
    shotList: ['Opening shot'],
    storyboard: ['Scene 1'],
    scenePrompts: ['Prompt 1'],
    imagePrompts: ['Image 1'],
    videoPrompts: ['Video 1'],
    hookVariations: ['Hook 1'],
    thumbnailIdeas: ['Thumb 1'],
    bRollIdeas: ['B-roll 1'],
    musicDirection: 'Upbeat',
    motionGraphics: 'Subtle',
    callToAction: 'Call now',
    editingInstructions: 'Fast cuts',
    publishingAssets: ['Asset 1'],
    generatedAt: new Date('2026-01-01'),
    sourceStrategyBrief: {} as CreativeBrief['sourceStrategyBrief'],
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('buildSkippedVideoProductionBrief()', () => {
  it('returns a brief with the skip note as the production plan', () => {
    const brief = buildSkippedVideoProductionBrief(makeCreativeBrief())
    expect(brief.productionPlan).toBe(VIDEO_SKIPPED_NOTE)
  })

  it('preserves the source creative brief for downstream traceability', () => {
    const creativeBrief = makeCreativeBrief()
    const brief = buildSkippedVideoProductionBrief(creativeBrief)
    expect(brief.sourceCreativeBrief).toBe(creativeBrief)
  })

  it('returns empty production queues so no render jobs are attempted', () => {
    const brief = buildSkippedVideoProductionBrief(makeCreativeBrief())
    expect(brief.renderQueue).toEqual([])
    expect(brief.sceneTimeline).toEqual([])
    expect(brief.avatarAssignments).toEqual([])
    expect(brief.voiceAssignments).toEqual([])
    expect(brief.exportTargets).toEqual([])
  })

  it('marks the quality and approval checklists with the skip note', () => {
    const brief = buildSkippedVideoProductionBrief(makeCreativeBrief())
    expect(brief.qualityChecklist).toContain(VIDEO_SKIPPED_NOTE)
    expect(brief.approvalChecklist).toContain(VIDEO_SKIPPED_NOTE)
  })

  it('reports zero runtime and a non-empty render settings note', () => {
    const brief = buildSkippedVideoProductionBrief(makeCreativeBrief())
    expect(brief.estimatedRuntime).toBe('0s')
    expect(brief.renderSettings.length).toBeGreaterThan(0)
  })

  it('stamps a generatedAt timestamp', () => {
    const brief = buildSkippedVideoProductionBrief(makeCreativeBrief())
    expect(brief.generatedAt).toBeInstanceOf(Date)
  })
})
