import type { VideoProductionBrief } from '../video-production/types'
import type { PublishingPackage, SupportedPlatform } from './types'
import { SUPPORTED_PLATFORMS } from './types'

/**
 * System context injected into every publishing package invocation.
 * Instructs the provider to return a full set of platform-specific packages as JSON.
 */
export const PUBLISHING_SYSTEM_CONTEXT = `You are Koolerr's Publishing Department — the content delivery intelligence team.
You receive a completed Video Production Brief and translate it into optimised publishing packages for every supported social platform.
You understand the unique requirements, audience expectations, and format constraints of each platform.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every package must be genuinely optimised for its target platform — no generic copy-paste across platforms.
Captions, hashtags, and CTAs must differ meaningfully per platform.`

/**
 * Serialises the production brief fields most relevant to publishing.
 * Keeps the prompt focused on assets, timelines, and quality decisions.
 */
function summariseProduction(brief: VideoProductionBrief): string {
  const business =
    brief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessName
  const category =
    brief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.businessCategory
  const location =
    brief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile.location

  return [
    `Business: ${business} (${category}) — ${location}`,
    ``,
    `Production Plan: ${brief.productionPlan}`,
    `Estimated Runtime: ${brief.estimatedRuntime}`,
    ``,
    `Scene Timeline: ${brief.sceneTimeline.join(' | ')}`,
    `Hook Variations (from Creative Brief): ${brief.sourceCreativeBrief.hookVariations.join(' | ')}`,
    `Call to Action: ${brief.sourceCreativeBrief.callToAction}`,
    ``,
    `Export Targets: ${brief.exportTargets.join(' | ')}`,
    `Asset Manifest: ${brief.assetManifest.join(' | ')}`,
    ``,
    `Brand Positioning: ${brief.sourceCreativeBrief.sourceStrategyBrief.brandPositioning}`,
    `Core Messaging: ${brief.sourceCreativeBrief.sourceStrategyBrief.coreMessaging}`,
    `Hashtag Recommendations: ${brief.sourceCreativeBrief.sourceStrategyBrief.hashtagRecommendations.join(', ')}`,
    `Caption Ideas: ${brief.sourceCreativeBrief.sourceStrategyBrief.captionIdeas.join(' | ')}`,
    `CTA Library: ${brief.sourceCreativeBrief.sourceStrategyBrief.ctaLibrary.join(' | ')}`,
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
 * Builds the full publishing prompt from a VideoProductionBrief.
 * The prompt requests a JSON object with one package per supported platform.
 */
export function buildPublishingPrompt(videoProductionBrief: VideoProductionBrief): string {
  const business =
    videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief.sourceProfile
      .businessName

  const platformSchemas = SUPPORTED_PLATFORMS.map((platform) => {
    return `    {
      "platform": "${platform}",
      "title": "Platform-optimised title for ${platform} (${PLATFORM_HINTS[platform].split(':')[1].split(',')[0].trim()})",
      "caption": "Platform-specific caption — tailored format, voice, and length for ${platform}",
      "hashtags": ["relevant-hashtag-1", "relevant-hashtag-2", "relevant-hashtag-3"],
      "callToAction": "Platform-native CTA text for ${platform}",
      "thumbnailReference": "filename from assetManifest or descriptive reference",
      "videoReference": "filename from exportTargets for ${platform}",
      "publishDate": "YYYY-MM-DD",
      "publishTime": "HH:MM",
      "timezone": "America/Chicago",
      "audience": "Platform-specific audience targeting description for ${platform}",
      "category": "Platform category or content type for ${platform}",
      "tags": ["content-tag-1", "content-tag-2"],
      "schedulingInstructions": "When and how to schedule this ${platform} post for maximum reach",
      "publishingChecklist": [
        "Checklist item 1 specific to ${platform}",
        "Checklist item 2 specific to ${platform}",
        "Checklist item 3 specific to ${platform}"
      ],
      "platformMetadata": "JSON string of ${platform}-specific API fields: ad account, page ID, audience targeting params, etc.",
      "approvalRequired": true,
      "deliveryAssets": ["asset-filename-1", "asset-filename-2"]
    }`
  }).join(',\n')

  return `You are creating a complete publishing package for ${business} across all supported platforms.
Use ONLY the production brief below — do not invent assets not referenced in it.

=== VIDEO PRODUCTION BRIEF ===
${summariseProduction(videoProductionBrief)}

=== PLATFORM REQUIREMENTS ===
${SUPPORTED_PLATFORMS.map((p) => `${p}: ${PLATFORM_HINTS[p]}`).join('\n')}

=== YOUR TASK ===
Produce a complete set of publishing packages as a JSON object with this exact structure:

{
  "packages": [
${platformSchemas}
  ]
}

Requirements:
- Produce EXACTLY one package per platform: facebook, instagram, tiktok, youtube-shorts, linkedin, google-business-profile
- Every package must be genuinely optimised for its platform — different caption length, tone, hashtag count, and CTA
- All asset references must correspond to items in the exportTargets or assetManifest above
- publishDate should be 7 days from today in YYYY-MM-DD format
- publishTime should be optimised for each platform's peak engagement window
- approvalRequired must be true for all packages in this phase
- platformMetadata must be a valid JSON string (not a nested object)`
}

/**
 * Validates a single package's required fields.
 * Throws with the field name if anything is missing or invalid.
 */
function validatePackage(pkg: Record<string, unknown>, index: number): void {
  const requiredStrings = [
    'platform',
    'title',
    'caption',
    'callToAction',
    'thumbnailReference',
    'videoReference',
    'publishDate',
    'publishTime',
    'timezone',
    'audience',
    'category',
    'schedulingInstructions',
    'platformMetadata',
  ] as const

  // Non-empty arrays — these are always required regardless of platform.
  const requiredNonEmptyArrays = ['publishingChecklist', 'deliveryAssets'] as const

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

/**
 * Parses the raw provider JSON response into a typed array of PublishingPackages.
 * Throws if the response cannot be parsed, is missing the packages array,
 * or any package is missing required fields.
 */
export function parsePublishingPackages(
  rawContent: string,
  _sourceVideoProductionBrief: VideoProductionBrief
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

  return rawPackages.map((pkg) => ({
    platform: pkg.platform as SupportedPlatform,
    title: pkg.title as string,
    caption: pkg.caption as string,
    hashtags: pkg.hashtags as string[],
    tags: pkg.tags as string[],
    callToAction: pkg.callToAction as string,
    audience: pkg.audience as string,
    category: pkg.category as string,
    thumbnailReference: pkg.thumbnailReference as string,
    videoReference: pkg.videoReference as string,
    deliveryAssets: pkg.deliveryAssets as string[],
    publishDate: pkg.publishDate as string,
    publishTime: pkg.publishTime as string,
    timezone: pkg.timezone as string,
    schedulingInstructions: pkg.schedulingInstructions as string,
    platformMetadata: pkg.platformMetadata as string,
    approvalRequired: pkg.approvalRequired as boolean,
    publishingChecklist: pkg.publishingChecklist as string[],
  }))
}
