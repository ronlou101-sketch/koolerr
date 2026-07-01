import type { StrategyBrief } from '../strategy/types'
import type { CreativeBrief } from './types'

/**
 * System context injected into every creative brief invocation.
 * Instructs the provider to return the full CreativeBrief as structured JSON.
 */
export const CREATIVE_SYSTEM_CONTEXT = `You are Koolerr's Creative Department — the production intelligence team.
You receive a completed Strategy Brief and translate it into a production blueprint.
You decide HOW things should look, sound, and feel — and provide exact instructions for every production tool.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every array field must contain at least 3 specific, production-ready items.`

/**
 * Serialises the key strategy fields used for creative brief generation.
 * Keeps the prompt focused on creative-relevant sections.
 */
function summariseStrategy(brief: StrategyBrief): string {
  const personas = brief.customerPersonas.map((p) => `${p.name}: ${p.description}`).join(' | ')

  return [
    `Business: ${brief.sourceResearchBrief.sourceProfile.businessName} (${brief.sourceResearchBrief.sourceProfile.businessCategory})`,
    `Location: ${brief.sourceResearchBrief.sourceProfile.location}`,
    ``,
    `Brand Positioning: ${brief.brandPositioning}`,
    `Core Messaging: ${brief.coreMessaging}`,
    `Creative Direction: ${brief.creativeDirection}`,
    `Production Notes: ${brief.productionNotes}`,
    ``,
    `Target Audience: ${brief.targetAudience}`,
    `Customer Personas: ${personas}`,
    ``,
    `Content Pillars: ${brief.contentPillars.join(' | ')}`,
    `Video Concepts: ${brief.videoConcepts.join(' | ')}`,
    `Reel Hooks: ${brief.reelHooks.join(' | ')}`,
    `Script Outlines: ${brief.scriptOutlines.join(' | ')}`,
    ``,
    `CTAs: ${brief.ctaLibrary.join(' | ')}`,
    `Offers: ${brief.offerRecommendations.join(' | ')}`,
    `Campaign Ideas: ${brief.campaignIdeas.join(' | ')}`,
    `Hashtags: ${brief.hashtagRecommendations.join(', ')}`,
  ].join('\n')
}

/**
 * Builds the full creative prompt from a StrategyBrief.
 * The prompt requests JSON output matching the CreativeBrief schema exactly.
 */
export function buildCreativePrompt(strategyBrief: StrategyBrief): string {
  const businessName = strategyBrief.sourceResearchBrief.sourceProfile.businessName

  return `You are producing a complete creative production brief for the following business.
Use ONLY the strategy below — do not invent facts not supported by it.

=== STRATEGY BRIEF ===
${summariseStrategy(strategyBrief)}

=== YOUR TASK ===
Produce a complete Creative Brief as a JSON object with this exact structure (no markdown, no code fences):

{
  "visualStyle": "2-3 sentence description of the overall visual aesthetic, colour palette, and visual tone for all ${businessName} content",
  "brandingGuidelines": "2-3 sentence practical guidelines for logo use, colour application, typography, and brand consistency across all assets",
  "avatarDirection": "2-3 sentence direction for AI avatar setup — appearance, clothing, tone, and presentation style for spokesperson videos",
  "voiceDirection": "2-3 sentence direction for AI voice — voice type, pace, tone, emotion, and audio characteristics for all narrated content",
  "shotList": [
    "Shot 1 description — angle, subject, duration, purpose",
    "Shot 2 description — angle, subject, duration, purpose",
    "Shot 3 description — angle, subject, duration, purpose"
  ],
  "storyboard": [
    "Scene 1: [0-3s] Opening hook — describe visual and audio",
    "Scene 2: [3-10s] Problem or context — describe visual and audio",
    "Scene 3: [10-25s] Solution and proof — describe visual and audio",
    "Scene 4: [25-30s] CTA — describe visual and audio"
  ],
  "scenePrompts": [
    "Higgsfield cinematic prompt 1 — full scene description for video generation",
    "Higgsfield cinematic prompt 2 — full scene description for video generation",
    "Higgsfield cinematic prompt 3 — full scene description for video generation"
  ],
  "imagePrompts": [
    "Higgsfield image prompt 1 — detailed visual description for image generation",
    "Higgsfield image prompt 2 — detailed visual description for image generation",
    "Higgsfield image prompt 3 — detailed visual description for image generation"
  ],
  "videoPrompts": [
    "HeyGen spokesperson prompt 1 — script excerpt and delivery instruction",
    "HeyGen spokesperson prompt 2 — script excerpt and delivery instruction",
    "HeyGen spokesperson prompt 3 — script excerpt and delivery instruction"
  ],
  "hookVariations": [
    "Hook variation 1 — exact opening line for first 3 seconds",
    "Hook variation 2 — exact opening line for first 3 seconds",
    "Hook variation 3 — exact opening line for first 3 seconds"
  ],
  "thumbnailIdeas": [
    "Thumbnail 1 — visual description, text overlay, and emotional trigger",
    "Thumbnail 2 — visual description, text overlay, and emotional trigger",
    "Thumbnail 3 — visual description, text overlay, and emotional trigger"
  ],
  "bRollIdeas": [
    "B-roll idea 1 — scene, subject, and purpose",
    "B-roll idea 2 — scene, subject, and purpose",
    "B-roll idea 3 — scene, subject, and purpose"
  ],
  "musicDirection": "2-3 sentence direction for music — genre, tempo, mood, and energy level to complement the visual content",
  "motionGraphics": "2-3 sentence direction for motion graphics — text overlays, transition styles, animated elements, and lower thirds",
  "callToAction": "The single most compelling CTA for ${businessName} — exact words, placement, and visual treatment",
  "editingInstructions": "2-3 sentence post-production guide — cut style, pacing, colour grading, audio mix, and final output specs",
  "publishingAssets": [
    "Asset 1: format, dimensions, duration, platform, purpose",
    "Asset 2: format, dimensions, duration, platform, purpose",
    "Asset 3: format, dimensions, duration, platform, purpose"
  ]
}

Requirements:
- All content must be specific to ${businessName}
- scenePrompts and imagePrompts must be detailed enough to pass directly to Higgsfield
- videoPrompts must be detailed enough to configure a HeyGen spokesperson video
- hookVariations must be immediately usable as opening lines — no placeholders
- publishingAssets must list every deliverable with platform and spec`
}

/**
 * Parses the raw provider JSON response into a typed CreativeBrief.
 * Throws if the response cannot be parsed or is missing required fields.
 */
export function parseCreativeBrief(
  rawContent: string,
  sourceStrategyBrief: StrategyBrief
): CreativeBrief {
  let parsed: Record<string, unknown>

  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[CREATIVE_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  const requiredStringFields = [
    'visualStyle',
    'brandingGuidelines',
    'avatarDirection',
    'voiceDirection',
    'musicDirection',
    'motionGraphics',
    'callToAction',
    'editingInstructions',
  ] as const

  const requiredArrayFields = [
    'shotList',
    'storyboard',
    'scenePrompts',
    'imagePrompts',
    'videoPrompts',
    'hookVariations',
    'thumbnailIdeas',
    'bRollIdeas',
    'publishingAssets',
  ] as const

  for (const field of requiredStringFields) {
    if (typeof parsed[field] !== 'string' || !parsed[field]) {
      throw new Error(`[CREATIVE_DEPT] Missing or invalid field "${field}" in creative response`)
    }
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(parsed[field]) || (parsed[field] as unknown[]).length === 0) {
      throw new Error(
        `[CREATIVE_DEPT] Missing or empty array field "${field}" in creative response`
      )
    }
  }

  return {
    visualStyle: parsed.visualStyle as string,
    brandingGuidelines: parsed.brandingGuidelines as string,
    avatarDirection: parsed.avatarDirection as string,
    voiceDirection: parsed.voiceDirection as string,
    shotList: parsed.shotList as string[],
    storyboard: parsed.storyboard as string[],
    scenePrompts: parsed.scenePrompts as string[],
    imagePrompts: parsed.imagePrompts as string[],
    videoPrompts: parsed.videoPrompts as string[],
    hookVariations: parsed.hookVariations as string[],
    thumbnailIdeas: parsed.thumbnailIdeas as string[],
    bRollIdeas: parsed.bRollIdeas as string[],
    musicDirection: parsed.musicDirection as string,
    motionGraphics: parsed.motionGraphics as string,
    callToAction: parsed.callToAction as string,
    editingInstructions: parsed.editingInstructions as string,
    publishingAssets: parsed.publishingAssets as string[],
    generatedAt: new Date(),
    sourceStrategyBrief,
  }
}
