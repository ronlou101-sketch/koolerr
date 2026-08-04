import type { CreativeBrief } from '../creative/types'
import type { VideoProductionBrief, VideoScript } from './types'

/**
 * System context injected into every video production plan invocation.
 * Instructs the provider to return the full VideoProductionBrief as structured JSON.
 */
export const VIDEO_PRODUCTION_SYSTEM_CONTEXT = `You are Koolerr's Video Production Department — the production orchestration intelligence.
You receive a completed Creative Brief and translate it into a complete video production package.
You decide WHAT gets rendered, WHEN, HOW, and in WHAT ORDER — producing exact instructions for every production tool.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every array field must contain at least 3 specific, actionable production items.
All render instructions must be specific enough to execute without further clarification.`

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
    `Scene Prompts (Higgsfield): ${brief.scenePrompts.join(' | ')}`,
    `Image Prompts (Higgsfield): ${brief.imagePrompts.join(' | ')}`,
    `Video Prompts (HeyGen): ${brief.videoPrompts.join(' | ')}`,
    ``,
    `Hook Variations: ${brief.hookVariations.join(' | ')}`,
    `B-Roll Ideas: ${brief.bRollIdeas.join(' | ')}`,
    ``,
    `Publishing Assets: ${brief.publishingAssets.join(' | ')}`,
  ].join('\n')
}

/**
 * Builds the full video production prompt from a CreativeBrief.
 * The prompt requests JSON output matching the VideoProductionBrief schema exactly.
 */
export function buildVideoProductionPrompt(creativeBrief: CreativeBrief): string {
  const business = creativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessName

  return `You are producing a complete video production package for the following business.
Use ONLY the creative brief below — do not invent assets not supported by it.

=== CREATIVE BRIEF ===
${summariseCreative(creativeBrief)}

=== YOUR TASK ===
Produce a complete Video Production Brief as a JSON object with this exact structure (no markdown, no code fences):

{
  "productionPlan": "3-4 sentence master production plan — sequence, tools, and execution strategy for all ${business} video assets",
  "renderSettings": "2-3 sentence technical render configuration — resolution, frame rate, codec, colour space, and output quality settings",
  "estimatedRuntime": "Total estimated production runtime with breakdown — e.g. '4h 30m total: HeyGen 1h, Higgsfield 2h, ElevenLabs 30m, Post-processing 1h'",
  "renderQueue": [
    "Render job 1: tool, scene ID, duration, priority, dependencies",
    "Render job 2: tool, scene ID, duration, priority, dependencies",
    "Render job 3: tool, scene ID, duration, priority, dependencies"
  ],
  "sceneTimeline": [
    "Scene 1: [0:00-0:03] Hook — HeyGen avatar intro, voice-over track A, caption layer 1",
    "Scene 2: [0:03-0:10] Problem — Higgsfield B-roll, music bed, caption layer 2",
    "Scene 3: [0:10-0:25] Solution — HeyGen spokesperson, Higgsfield overlay, voice-over track B",
    "Scene 4: [0:25-0:30] CTA — Full screen graphic, ${business} logo, CTA text"
  ],
  "avatarAssignments": [
    "Avatar assignment 1: scene reference, avatar ID/type, script excerpt, delivery instruction, clothing",
    "Avatar assignment 2: scene reference, avatar ID/type, script excerpt, delivery instruction, clothing",
    "Avatar assignment 3: scene reference, avatar ID/type, script excerpt, delivery instruction, clothing"
  ],
  "voiceAssignments": [
    "Voice assignment 1: scene reference, voice type, script text, emotion, pace, ElevenLabs settings",
    "Voice assignment 2: scene reference, voice type, script text, emotion, pace, ElevenLabs settings",
    "Voice assignment 3: scene reference, voice type, script text, emotion, pace, ElevenLabs settings"
  ],
  "cameraMovements": [
    "Camera move 1: scene, movement type (pan/tilt/zoom/static), speed, start position, end position, purpose",
    "Camera move 2: scene, movement type, speed, start position, end position, purpose",
    "Camera move 3: scene, movement type, speed, start position, end position, purpose"
  ],
  "motionEffects": [
    "Motion effect 1: scene, effect type, duration, intensity, trigger point",
    "Motion effect 2: scene, effect type, duration, intensity, trigger point",
    "Motion effect 3: scene, effect type, duration, intensity, trigger point"
  ],
  "transitions": [
    "Transition 1: between scenes X and Y, type (cut/fade/dissolve/wipe), duration, direction",
    "Transition 2: between scenes Y and Z, type, duration, direction",
    "Transition 3: between scenes Z and CTA, type, duration, direction"
  ],
  "captionTimeline": [
    "Caption 1: [0:00-0:03] text content, position, font, size, colour, animation style",
    "Caption 2: [0:03-0:10] text content, position, font, size, colour, animation style",
    "Caption 3: [0:10-0:25] text content, position, font, size, colour, animation style"
  ],
  "bRollTimeline": [
    "B-roll 1: [timecode] scene description, source (Higgsfield prompt reference), duration, audio treatment",
    "B-roll 2: [timecode] scene description, source, duration, audio treatment",
    "B-roll 3: [timecode] scene description, source, duration, audio treatment"
  ],
  "musicTimeline": [
    "Music cue 1: [0:00-0:30] track description, tempo, mood, volume level (-18dB), fade in/out",
    "Music cue 2: [timecode] stinger or accent, usage, volume, trigger",
    "Music cue 3: [timecode] CTA music swell, description, volume, duration"
  ],
  "assetManifest": [
    "Asset 1: type, filename convention, source tool, dimensions, duration, purpose",
    "Asset 2: type, filename convention, source tool, dimensions, duration, purpose",
    "Asset 3: type, filename convention, source tool, dimensions, duration, purpose"
  ],
  "qualityChecklist": [
    "QC item 1: check description, pass criteria, tool or reviewer responsible",
    "QC item 2: check description, pass criteria, tool or reviewer responsible",
    "QC item 3: check description, pass criteria, tool or reviewer responsible"
  ],
  "exportTargets": [
    "Export 1: platform, format, resolution, frame rate, bitrate, filename, delivery method",
    "Export 2: platform, format, resolution, frame rate, bitrate, filename, delivery method",
    "Export 3: platform, format, resolution, frame rate, bitrate, filename, delivery method"
  ],
  "approvalChecklist": [
    "Approval item 1: checkpoint description, approver role, criteria, stage gate",
    "Approval item 2: checkpoint description, approver role, criteria, stage gate",
    "Approval item 3: checkpoint description, approver role, criteria, stage gate"
  ]
}

Requirements:
- All content must be specific to ${business}
- renderQueue items must reference specific HeyGen or Higgsfield jobs
- sceneTimeline must align with the storyboard from the Creative Brief
- avatarAssignments must reference HeyGen avatar configuration
- voiceAssignments must reference ElevenLabs voice settings
- exportTargets must list every deliverable with platform and technical spec
- approvalChecklist must cover brand alignment, technical quality, and content accuracy`
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

  return `Write one spokesperson video script for ${business}, using ONLY the creative brief below.

=== CREATIVE BRIEF ===
${summariseCreative(creativeBrief)}

=== YOUR TASK ===
Return a JSON object with this exact structure (no markdown, no code fences):

{
  "title": "Short title for this script",
  "script": "The full spoken script — natural spoken words only, opening with a hook from the brief's Hook Variations and closing with the Call to Action",
  "platform": "the primary target platform, e.g. facebook, instagram, tiktok, youtube",
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
export function parseVideoScript(rawContent: string): VideoScript {
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
  const platform =
    typeof parsed?.platform === 'string' && parsed.platform.trim()
      ? (parsed.platform as string)
      : 'facebook'
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
    'renderQueue',
    'sceneTimeline',
    'avatarAssignments',
    'voiceAssignments',
    'cameraMovements',
    'motionEffects',
    'transitions',
    'captionTimeline',
    'bRollTimeline',
    'musicTimeline',
    'assetManifest',
    'qualityChecklist',
    'exportTargets',
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
    renderQueue: parsed.renderQueue as string[],
    sceneTimeline: parsed.sceneTimeline as string[],
    avatarAssignments: parsed.avatarAssignments as string[],
    voiceAssignments: parsed.voiceAssignments as string[],
    cameraMovements: parsed.cameraMovements as string[],
    motionEffects: parsed.motionEffects as string[],
    transitions: parsed.transitions as string[],
    captionTimeline: parsed.captionTimeline as string[],
    bRollTimeline: parsed.bRollTimeline as string[],
    musicTimeline: parsed.musicTimeline as string[],
    assetManifest: parsed.assetManifest as string[],
    qualityChecklist: parsed.qualityChecklist as string[],
    exportTargets: parsed.exportTargets as string[],
    approvalChecklist: parsed.approvalChecklist as string[],
    generatedAt: new Date(),
    sourceCreativeBrief,
  }
}
