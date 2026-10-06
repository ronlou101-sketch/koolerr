import type { VideoProductionBrief } from '../video-production/types'
import type { PublishingPackage, PublishingSchedule, SupportedPlatform } from './types'
import {
  PLATFORM_DISPLAY_NAMES,
  resolveAllowedPlatforms,
  toAllowedPlatform,
} from './platform-resolver'

/**
 * System context injected into every publishing package invocation.
 * Instructs the provider to return platform-specific packages as JSON.
 */
export const PUBLISHING_SYSTEM_CONTEXT = `You are Koolerr's Publishing Department — the content delivery intelligence team.
You receive a completed video concept brief and write optimised text post packages for the campaign's allowed platforms only.
You understand the unique requirements, audience expectations, and format constraints of each platform.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every package must be genuinely optimised for its target platform — no generic copy-paste across platforms.
Captions, hashtags, and CTAs must differ meaningfully per platform.
Never invent business claims, file names, file paths, account or page IDs, or media that does not exist.`

/** Options that ground a publishing prompt/parse in the run's verified context. */
export interface PublishingPromptOptions {
  /** Allowed platforms (shared resolver). Defaults to the profile's resolved set. */
  allowedPlatforms?: readonly SupportedPlatform[]
  /** Business-timezone schedule; null/absent → dates and times omitted. */
  schedule?: PublishingSchedule | null
}

function profileOf(brief: VideoProductionBrief) {
  return brief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile
}

/** Resolves the allowed platform set for a brief via the shared resolver. */
export function resolvePublishingPlatforms(
  brief: VideoProductionBrief,
  options: PublishingPromptOptions = {}
): SupportedPlatform[] {
  return options.allowedPlatforms && options.allowedPlatforms.length > 0
    ? resolveAllowedPlatforms(options.allowedPlatforms)
    : resolveAllowedPlatforms(profileOf(brief).allowedPlatforms)
}

/**
 * Serialises the concept brief fields most relevant to publishing.
 * No media has been produced or verified at this stage, so none is referenced.
 */
function summariseProduction(brief: VideoProductionBrief): string {
  const profile = profileOf(brief)
  const strategy = brief.sourceCreativeBrief.sourceStrategyBrief

  return [
    `Business: ${profile.businessName} (${profile.businessCategory}) — ${profile.location}`,
    `Business Facts (the ONLY source of business claims): ${profile.notes ?? 'none provided'}`,
    ``,
    `Video Concept: ${brief.productionPlan}`,
    `Scene Timeline: ${brief.sceneTimeline.join(' | ')}`,
    `Hook Variations (from Creative Brief): ${brief.sourceCreativeBrief.hookVariations.join(' | ')}`,
    `Call to Action: ${brief.sourceCreativeBrief.callToAction}`,
    ``,
    `Media: no video, image, or file has been produced or verified for this campaign.`,
    ``,
    `Brand Positioning: ${strategy.brandPositioning}`,
    `Core Messaging: ${strategy.coreMessaging}`,
    `Hashtag Recommendations: ${strategy.hashtagRecommendations.join(', ')}`,
    `Caption Ideas: ${strategy.captionIdeas.join(' | ')}`,
    `CTA Library: ${strategy.ctaLibrary.join(' | ')}`,
    ``,
    `Approval Checklist: ${brief.approvalChecklist.join(' | ')}`,
  ].join('\n')
}

/**
 * Platform-specific format hints injected per package in the schema instructions.
 * Keeps the AI from producing generic, platform-agnostic copy.
 */
const PLATFORM_HINTS: Record<SupportedPlatform, string> = {
  facebook:
    'Facebook: longer captions welcome (up to 63,206 chars), emotional storytelling, link-friendly, community CTA ("Comment below", "Share this"), video up to 240 min, optimal 1-3 minutes',
  instagram:
    'Instagram: captions 2,200 chars max, hook in first line (no truncation), 3-30 hashtags in first comment or caption, CTA drives to bio link, Reels 15-90s preferred',
  tiktok:
    'TikTok: captions 2,200 chars max, 3-5 hashtags only (algorithm-sensitive), strong first-3s hook is critical, trending sounds reference optional, 15-60s optimal, CTA must feel native',
  'youtube-shorts':
    'YouTube Shorts: titles 100 chars max, descriptions 5,000 chars, 3-15 hashtags in description, first hashtag becomes the label, under 60s required, CTA drives to channel or subscribe',
  linkedin:
    'LinkedIn: professional tone, industry insight framing, 3,000 char caption max, 3-5 hashtags, no more than 5 emojis, CTA drives to website or contact, video up to 10 min',
  'google-business-profile':
    'Google Business Profile: posts up to 1,500 chars, no hashtags (ignored by algorithm), single CTA button type (Call/Book/Learn more/Order/Buy/Sign up), local SEO keywords natural in body text, photos/videos supported, posts expire after 7 days unless Event type',
}

/**
 * Builds the publishing prompt from a VideoProductionBrief.
 * Requests exactly one text post package per ALLOWED platform. Asset references,
 * platform IDs, dates, timezone, and scheduling text are set by the service — never
 * requested from the model.
 */
export function buildPublishingPrompt(
  videoProductionBrief: VideoProductionBrief,
  options: PublishingPromptOptions = {}
): string {
  const business = profileOf(videoProductionBrief).businessName
  const platforms = resolvePublishingPlatforms(videoProductionBrief, options)
  const schedule = options.schedule ?? null

  const timeLine = schedule
    ? `      "publishTime": "HH:MM — best local posting time in ${schedule.timezone}",\n`
    : ''

  const platformSchemas = platforms
    .map((platform) => {
      return `    {
      "platform": "${platform}",
      "title": "Platform-optimised title for ${PLATFORM_DISPLAY_NAMES[platform]} (${PLATFORM_HINTS[platform].split(':')[1].split(',')[0].trim()})",
      "caption": "Platform-specific caption — tailored format, voice, and length for ${PLATFORM_DISPLAY_NAMES[platform]}",
      "hashtags": ["relevant-hashtag-1", "relevant-hashtag-2", "relevant-hashtag-3"],
      "callToAction": "Platform-native CTA text for ${PLATFORM_DISPLAY_NAMES[platform]}",
${timeLine}      "audience": "Platform-specific audience targeting description for ${PLATFORM_DISPLAY_NAMES[platform]}",
      "category": "Platform category or content type for ${PLATFORM_DISPLAY_NAMES[platform]}",
      "tags": ["content-tag-1", "content-tag-2"],
      "publishingChecklist": [
        "Checklist item 1 specific to ${PLATFORM_DISPLAY_NAMES[platform]}",
        "Checklist item 2 specific to ${PLATFORM_DISPLAY_NAMES[platform]}",
        "Checklist item 3 specific to ${PLATFORM_DISPLAY_NAMES[platform]}"
      ],
      "approvalRequired": true
    }`
    })
    .join(',\n')

  const scheduleRequirement = schedule
    ? `- publishTime must be HH:MM local time in ${schedule.timezone}; do not write any date, timezone name, or abbreviation anywhere in the copy`
    : `- The business timezone is unknown: do not write any date, time, timezone, or schedule anywhere in the copy`

  return `You are creating publishing packages for ${business} for these platforms only: ${platforms.join(', ')}.
Use ONLY the brief below — do not invent assets, media, or facts not stated in it.

=== VIDEO CONCEPT BRIEF ===
${summariseProduction(videoProductionBrief)}

=== PLATFORM REQUIREMENTS ===
${platforms.map((p) => `${p}: ${PLATFORM_HINTS[p]}`).join('\n')}

=== YOUR TASK ===
Produce publishing packages as a JSON object with this exact structure:

{
  "packages": [
${platformSchemas}
  ]
}

Requirements:
- Produce EXACTLY one package per platform listed above (${platforms.join(', ')}) — no other platforms
- Every package must be genuinely optimised for its platform — different caption length, tone, hashtag count, and CTA
- Write text post copy only: do not reference, attach, or promise any video, reel, image, file, link, or download — none has been produced
- Business claims come ONLY from the Business Facts: never invent offers, discounts, free services, pricing, guarantees, hours/availability (e.g. 24/7), response times, credentials, or policies
- Never include file names, file paths, URLs you were not given, or account/page/ad/channel IDs
${scheduleRequirement}
- approvalRequired must be true for all packages in this phase`
}

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Validates a single package's model-generated fields.
 * Throws with the field name if anything is missing or invalid.
 */
function validatePackage(pkg: Record<string, unknown>, index: number): void {
  const requiredStrings = [
    'platform',
    'title',
    'caption',
    'callToAction',
    'audience',
    'category',
  ] as const

  // Non-empty arrays — always required regardless of platform.
  const requiredNonEmptyArrays = ['publishingChecklist'] as const

  // Arrays that must be present but may be empty (e.g. hashtags on Google Business Profile).
  const requiredArrays = ['hashtags', 'tags'] as const

  for (const field of requiredStrings) {
    if (typeof pkg[field] !== 'string' || !pkg[field]) {
      throw new Error(`[PUBLISHING_DEPT] Package[${index}] missing or invalid field "${field}"`)
    }
  }

  for (const field of requiredNonEmptyArrays) {
    if (!Array.isArray(pkg[field]) || (pkg[field] as unknown[]).length === 0) {
      throw new Error(`[PUBLISHING_DEPT] Package[${index}] missing or empty array field "${field}"`)
    }
  }

  for (const field of requiredArrays) {
    if (!Array.isArray(pkg[field])) {
      throw new Error(`[PUBLISHING_DEPT] Package[${index}] missing array field "${field}"`)
    }
  }

  if (typeof pkg.approvalRequired !== 'boolean') {
    throw new Error(
      `[PUBLISHING_DEPT] Package[${index}] missing or invalid boolean field "approvalRequired"`
    )
  }
}

/** Service-built scheduling text — truthful, from the run schedule only. */
function schedulingText(schedule: PublishingSchedule | null, publishTime: string): string {
  if (!schedule) {
    return 'Not scheduled: the business timezone could not be determined from its location.'
  }
  return publishTime
    ? `Publish on ${schedule.publishDate} at ${publishTime} (${schedule.timezone}).`
    : `Publish on ${schedule.publishDate} (${schedule.timezone}); choose a posting time.`
}

/**
 * Parses the raw provider JSON response into typed PublishingPackages.
 *
 * Report truth: packages for platforms outside the allowed set are dropped (the model
 * can never add a platform); duplicates keep the first package. Asset references,
 * platform metadata, dates, timezone, and scheduling text are set here from verified
 * run context — any model-supplied values for them are discarded.
 * Throws if the response cannot be parsed, a package is invalid, or no package
 * targets an allowed platform.
 */
export function parsePublishingPackages(
  rawContent: string,
  sourceVideoProductionBrief: VideoProductionBrief,
  options: PublishingPromptOptions = {}
): PublishingPackage[] {
  let parsed: Record<string, unknown>

  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[PUBLISHING_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  if (!Array.isArray(parsed.packages) || parsed.packages.length === 0) {
    throw new Error(`[PUBLISHING_DEPT] Response missing or empty "packages" array`)
  }

  const rawPackages = parsed.packages as Record<string, unknown>[]

  rawPackages.forEach((pkg, i) => validatePackage(pkg, i))

  const allowed = resolvePublishingPlatforms(sourceVideoProductionBrief, options)
  const schedule = options.schedule ?? null
  const seen = new Set<SupportedPlatform>()
  const packages: PublishingPackage[] = []

  for (const pkg of rawPackages) {
    const platform = toAllowedPlatform(pkg.platform, allowed)
    if (!platform || seen.has(platform)) continue
    seen.add(platform)

    const rawTime = typeof pkg.publishTime === 'string' ? pkg.publishTime.trim() : ''
    const publishTime = schedule && HH_MM.test(rawTime) ? rawTime : ''

    packages.push({
      platform,
      title: pkg.title as string,
      caption: pkg.caption as string,
      hashtags: pkg.hashtags as string[],
      tags: pkg.tags as string[],
      callToAction: pkg.callToAction as string,
      audience: pkg.audience as string,
      category: pkg.category as string,
      thumbnailReference: '',
      videoReference: '',
      deliveryAssets: [],
      publishDate: schedule ? schedule.publishDate : '',
      publishTime,
      timezone: schedule ? schedule.timezone : '',
      schedulingInstructions: schedulingText(schedule, publishTime),
      platformMetadata: '{}',
      approvalRequired: pkg.approvalRequired as boolean,
      publishingChecklist: pkg.publishingChecklist as string[],
    })
  }

  if (packages.length === 0) {
    throw new Error(
      `[PUBLISHING_DEPT] Response missing or empty packages for allowed platforms (${allowed.join(', ')})`
    )
  }

  return packages
}
