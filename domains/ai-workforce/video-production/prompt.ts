import type { CreativeBrief } from '../creative/types'
import type { SupportedPlatform } from '../publishing/types'
import { resolveAllowedPlatforms, toAllowedPlatform } from '../publishing/platform-resolver'
import type { VideoProductionBrief, VideoScript } from './types'

/**
 * Report-truth: the video brief is a CONCEPT only. These fields describe produced or
 * render-ready media (render jobs, avatar/voice IDs, asset files, export files). No
 * verified render records exist when the brief is planned, so they are always empty —
 * the model's output for them is discarded rather than trusted.
 */
export const VIDEO_UNVERIFIED_PRODUCTION_FIELDS = [
  'renderQueue',
  'avatarAssignments',
  'voiceAssignments',
  'assetManifest',
  'exportTargets',
] as const

/** Allowed platforms for a creative brief, via the shared platform resolver. */
function allowedPlatformsFor(brief: CreativeBrief): SupportedPlatform[] {
  return resolveAllowedPlatforms(
    brief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.allowedPlatforms
  )
}

/**
 * System context injected into every video production plan invocation.
 * Instructs the provider to return the full VideoProductionBrief as structured JSON.
 */
export const VIDEO_PRODUCTION_SYSTEM_CONTEXT = `You are Koolerr's Video Production Department — the video concept team.
You receive a completed Creative Brief and turn it into a video CONCEPT brief: concept, angle, script direction, and talking points.
Nothing has been filmed, rendered, or produced. Never state or imply that a video, file, or render exists.
Never name production tools or providers, avatar IDs, voice IDs, file names, file paths, render jobs, or upload/publishing instructions.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every array field must contain at least 3 specific items — except renderQueue, avatarAssignments, voiceAssignments, assetManifest, and exportTargets, which must be empty arrays.`

/**
 * Serialises the key creative fields used for production plan generation.
 * Focuses on the production-relevant sections of the CreativeBrief.
 */
function summariseCreative(brief: CreativeBrief): string {
  const business = brief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessName
  const category = brief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessCategory

  return [
    `Business: ${business} (${category})`,
    ``,
    `Visual Style: ${brief.visualStyle}`,
    `Branding Guidelines: ${brief.brandingGuidelines}`,
    `Avatar Direction: ${brief.avatarDirection}`,
    `Voice Direction: ${brief.voiceDirection}`,
    ``,
    `Music Direction: ${brief.musicDirection}`,
    `Motion Graphics: ${brief.motionGraphics}`,
    `Editing Instructions: ${brief.editingInstructions}`,
    `Call to Action: ${brief.callToAction}`,
    ``,
    `Shot List: ${brief.shotList.join(' | ')}`,
    `Storyboard: ${brief.storyboard.join(' | ')}`,
    ``,
    `Scene Ideas: ${brief.scenePrompts.join(' | ')}`,
    `Spokesperson Talking Points: ${brief.videoPrompts.join(' | ')}`,
    ``,
    `Hook Variations: ${brief.hookVariations.join(' | ')}`,
    `B-Roll Ideas: ${brief.bRollIdeas.join(' | ')}`,
    ``,
    `Target Platforms: ${allowedPlatformsFor(brief).join(', ')}`,
  ].join('\n')
}

/**
 * Builds the full video production prompt from a CreativeBrief.
 * The prompt requests JSON output matching the VideoProductionBrief schema exactly.
 */
export function buildVideoProductionPrompt(creativeBrief: CreativeBrief): string {
  const business = creativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessName

  return `You are producing a video CONCEPT brief for the following business.
Use ONLY the creative brief below. This is a concept — no video has been filmed, rendered, or produced.

=== CREATIVE BRIEF ===
${summariseCreative(creativeBrief)}

=== YOUR TASK ===
Produce a Video Concept Brief as a JSON object with this exact structure (no markdown, no code fences):

{
  "productionPlan": "3-4 sentence video concept for ${business} — the angle, the story, and the key talking points (a concept only; nothing has been produced)",
  "renderSettings": "Concept-level format notes only — orientation and intended length. No tools, providers, codecs, or render configuration.",
  "estimatedRuntime": "Intended video length only, e.g. '30 seconds' — no production-time estimates",
  "renderQueue": [],
  "sceneTimeline": [
    "Scene 1: [0:00-0:03] Hook — what is shown and what is said",
    "Scene 2: [0:03-0:10] Problem — what is shown and what is said",
    "Scene 3: [0:10-0:25] Solution — what is shown and what is said",
    "Scene 4: [0:25-0:30] Call to action — what is shown and what is said"
  ],
  "avatarAssignments": [],
  "voiceAssignments": [],
  "cameraMovements": [
    "Camera idea 1: scene, movement, purpose",
    "Camera idea 2: scene, movement, purpose",
    "Camera idea 3: scene, movement, purpose"
  ],
  "motionEffects": [
    "Motion idea 1: scene, effect, purpose",
    "Motion idea 2: scene, effect, purpose",
    "Motion idea 3: scene, effect, purpose"
  ],
  "transitions": [
    "Transition idea 1: between which scenes, style",
    "Transition idea 2: between which scenes, style",
    "Transition idea 3: between which scenes, style"
  ],
  "captionTimeline": [
    "Caption 1: [0:00-0:03] on-screen text",
    "Caption 2: [0:03-0:10] on-screen text",
    "Caption 3: [0:10-0:25] on-screen text"
  ],
  "bRollTimeline": [
    "B-roll idea 1: scene description and purpose",
    "B-roll idea 2: scene description and purpose",
    "B-roll idea 3: scene description and purpose"
  ],
  "musicTimeline": [
    "Music idea 1: mood, tempo, where it is used",
    "Music idea 2: mood, tempo, where it is used",
    "Music idea 3: mood, tempo, where it is used"
  ],
  "assetManifest": [],
  "qualityChecklist": [
    "Concept check 1: what to check and the pass criteria",
    "Concept check 2: what to check and the pass criteria",
    "Concept check 3: what to check and the pass criteria"
  ],
  "exportTargets": [],
  "approvalChecklist": [
    "Review point 1: what the business should confirm before any production",
    "Review point 2: what the business should confirm before any production",
    "Review point 3: what the business should confirm before any production"
  ]
}

Requirements:
- All content must be specific to ${business} and use only facts from the creative brief
- renderQueue, avatarAssignments, voiceAssignments, assetManifest, and exportTargets MUST be empty arrays []
- Never name production tools or providers, avatar IDs, voice IDs, file names, file paths, render jobs, upload paths, or publishing instructions
- Never state or imply that a video has been produced, rendered, or is available
- Do not invent offers, discounts, guarantees, hours/availability, or credentials
- sceneTimeline must align with the storyboard from the Creative Brief`
}

// ── Video script writer ──────────────────────────────────────────────────────

/**
 * System context for spokesperson video-script generation. Requests a compact JSON
 * object carrying the spoken script and its delivery metadata.
 */
export const VIDEO_SCRIPT_WRITER_SYSTEM_CONTEXT = `You are Koolerr's spokesperson script writer.
You turn a Creative Brief into a single, spoken video script for an on-camera brand spokesperson.
Write natural, spoken words only — what the spokesperson says to camera — not stage directions or scene notes.
Keep it tight: a 30-60 second script (roughly 70-150 words) that opens with a hook and ends with the call to action.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.`

/**
 * Builds the spokesperson video-script prompt from a CreativeBrief. Requests JSON
 * with the spoken script plus platform and estimated duration.
 */
export function buildVideoScriptPrompt(creativeBrief: CreativeBrief): string {
  const business = creativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessName
  const platforms = allowedPlatformsFor(creativeBrief)

  return `Write one spokesperson video script for ${business}, using ONLY the creative brief below.

=== CREATIVE BRIEF ===
${summariseCreative(creativeBrief)}

=== YOUR TASK ===
Return a JSON object with this exact structure (no markdown, no code fences):

{
  "title": "Short title for this script",
  "script": "The full spoken script — natural spoken words only, opening with a hook from the brief's Hook Variations and closing with the Call to Action",
  "platform": "exactly one of: ${platforms.join(', ')}",
  "estimatedDurationSec": 45
}

Requirements:
- "script" is what the spokesperson says out loud — no scene directions, no camera notes, no labels.
- Ground the message in this business's brief; do not invent offers not supported by it.
- 70-150 words; end on the brief's Call to Action.`
}

/**
 * Parses the raw provider response into a VideoScript. Lenient by design — a plain
 * (non-JSON) response is treated as the script itself, with sensible defaults — so a
 * usable script is always produced rather than failing the artifact.
 */
export function parseVideoScript(
  rawContent: string,
  allowedPlatforms: readonly SupportedPlatform[] = resolveAllowedPlatforms(undefined)
): VideoScript {
  const cleaned = rawContent
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  let parsed: Record<string, unknown> | null = null
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as Record<string, unknown>
      } catch {
        parsed = null
      }
    }
  }

  const script =
    typeof parsed?.script === 'string' && parsed.script.trim() ? (parsed.script as string) : cleaned
  const title =
    typeof parsed?.title === 'string' && parsed.title.trim()
      ? (parsed.title as string)
      : 'Spokesperson Script'
  // Shared resolver: an out-of-set or missing platform is discarded and replaced by
  // the first allowed platform — the model can never introduce its own platform.
  const allowed =
    allowedPlatforms.length > 0 ? allowedPlatforms : resolveAllowedPlatforms(undefined)
  const platform = toAllowedPlatform(parsed?.platform, allowed) ?? allowed[0]
  const estimatedDurationSec =
    typeof parsed?.estimatedDurationSec === 'number' && parsed.estimatedDurationSec > 0
      ? (parsed.estimatedDurationSec as number)
      : 45

  return { title, script, platform, estimatedDurationSec }
}

/**
 * Parses the raw provider JSON response into a typed VideoProductionBrief.
 * Throws if the response cannot be parsed or is missing required fields.
 */
export function parseVideoProductionBrief(
  rawContent: string,
  sourceCreativeBrief: CreativeBrief
): VideoProductionBrief {
  let parsed: Record<string, unknown>

  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[VIDEO_PRODUCTION_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  const requiredStringFields = ['productionPlan', 'renderSettings', 'estimatedRuntime'] as const

  const requiredArrayFields = [
    'sceneTimeline',
    'cameraMovements',
    'motionEffects',
    'transitions',
    'captionTimeline',
    'bRollTimeline',
    'musicTimeline',
    'qualityChecklist',
    'approvalChecklist',
  ] as const

  for (const field of requiredStringFields) {
    if (typeof parsed[field] !== 'string' || !parsed[field]) {
      throw new Error(
        `[VIDEO_PRODUCTION_DEPT] Missing or invalid field "${field}" in video production response`
      )
    }
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(parsed[field]) || (parsed[field] as unknown[]).length === 0) {
      throw new Error(
        `[VIDEO_PRODUCTION_DEPT] Missing or empty array field "${field}" in video production response`
      )
    }
  }

  return {
    productionPlan: parsed.productionPlan as string,
    renderSettings: parsed.renderSettings as string,
    estimatedRuntime: parsed.estimatedRuntime as string,
    // Concept-only brief: unverified production fields are never trusted (always []).
    renderQueue: [],
    sceneTimeline: parsed.sceneTimeline as string[],
    avatarAssignments: [],
    voiceAssignments: [],
    cameraMovements: parsed.cameraMovements as string[],
    motionEffects: parsed.motionEffects as string[],
    transitions: parsed.transitions as string[],
    captionTimeline: parsed.captionTimeline as string[],
    bRollTimeline: parsed.bRollTimeline as string[],
    musicTimeline: parsed.musicTimeline as string[],
    assetManifest: [],
    qualityChecklist: parsed.qualityChecklist as string[],
    exportTargets: [],
    approvalChecklist: parsed.approvalChecklist as string[],
    generatedAt: new Date(),
    sourceCreativeBrief,
  }
}
