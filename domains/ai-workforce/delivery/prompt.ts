import type { ApprovalDecision } from '../approval/types'
import type { PublishingPackage } from '../publishing/types'
import type { DeliveryPackage } from './types'

/**
 * System context injected into every delivery invocation.
 * Instructs the provider to return a customer-ready DeliveryPackage as JSON.
 */
export const DELIVERY_SYSTEM_CONTEXT = `You are Koolerr's Delivery Department — the final step before content reaches the customer.
You receive an approved set of publishing packages and prepare a customer-ready delivery summary.
Your output is displayed directly on the customer's Koolerr dashboard.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Write the customerSummary in first-person plural ("Your content is ready…") — warm, professional, and clear.
Every publishingInstruction must be specific, actionable, and tailored to its platform.`

/** Formats a single approved package into a customer-facing summary line. */
function summariseApprovedPackage(pkg: PublishingPackage): string {
  return `  [${pkg.platform}] ${pkg.title} — ${pkg.videoReference} | ${pkg.publishDate} ${pkg.publishTime} ${pkg.timezone}`
}

/** Serialises the approval decision and upstream context for the delivery prompt. */
function summariseApproval(decision: ApprovalDecision): string {
  const strategy =
    decision.sourcePublishingJob.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief
  const profile = strategy.sourceResearchBrief.sourceProfile
  const approvedCount = decision.approvedPackages.length

  const approvedPkgs = decision.sourcePublishingJob.packages.filter((p) =>
    decision.approvedPackages.includes(p.platform)
  )

  return [
    `Business: ${profile.businessName} (${profile.businessCategory}) — ${profile.location}`,
    ``,
    `Approval outcome: ${decision.overallDecision}`,
    `Quality score: ${decision.qualityScore}/100 | Readability: ${decision.readabilityScore}/100 | Confidence: ${decision.confidence}%`,
    `Approval notes: ${decision.approvalNotes}`,
    ``,
    `Approved packages (${approvedCount}):`,
    approvedPkgs.map(summariseApprovedPackage).join('\n'),
    ``,
    `Brand Positioning: ${strategy.brandPositioning}`,
    `Core Messaging: ${strategy.coreMessaging}`,
    `Hashtag recommendations: ${strategy.hashtagRecommendations.join(', ')}`,
    `CTA library: ${strategy.ctaLibrary.join(' | ')}`,
  ].join('\n')
}

/**
 * Builds the full delivery prompt from an ApprovalDecision.
 * Requests a JSON object with all DeliveryPackage content fields.
 * Metadata fields (packageId, generatedAt, deliveredAt, status, readyForCustomer)
 * are set by the service — not requested from the AI.
 */
export function buildDeliveryPrompt(approvalDecision: ApprovalDecision): string {
  const profile =
    approvalDecision.sourcePublishingJob.videoProductionBrief.sourceCreativeBrief
      .sourceStrategyBrief.sourceResearchBrief.sourceProfile

  const approvedPkgs = approvalDecision.sourcePublishingJob.packages.filter((p) =>
    approvalDecision.approvedPackages.includes(p.platform)
  )

  const platformList = approvedPkgs.map((p) => p.platform).join(', ')

  return `You are preparing the final customer delivery package for ${profile.businessName}.

=== APPROVAL SUMMARY ===
${summariseApproval(approvalDecision)}

=== YOUR TASK ===
Produce a complete Delivery Package as a JSON object with this exact structure (no markdown, no code fences):

{
  "customerSummary": "Your [X] social media content packages for ${profile.businessName} are approved and ready. [2-3 sentences describing what's included and what the customer should do next.]",
  "deliverables": [
    "Facebook video package — 30s spokesperson video with caption, hashtags, and CTA",
    "Instagram Reel package — 30s reel with hook-optimised caption and hashtag set",
    "TikTok package — 30s short-form video with native CTA and trending audio guidance",
    "YouTube Shorts package — 30s short with channel-optimised title and description",
    "LinkedIn package — professional tone video with industry insight caption",
    "Google Business Profile package — local SEO-optimised post with single CTA button"
  ],
  "platformPackages": [
    "Facebook (${profile.businessName}): Title · Caption preview · CTA · Schedule: [date time tz]",
    "Instagram: Title · Caption preview · CTA · Schedule: [date time tz]",
    "TikTok: Title · Caption preview · CTA · Schedule: [date time tz]",
    "YouTube Shorts: Title · Caption preview · CTA · Schedule: [date time tz]",
    "LinkedIn: Title · Caption preview · CTA · Schedule: [date time tz]",
    "Google Business Profile: Title · Caption preview · CTA · Schedule: [date time tz]"
  ],
  "downloadLinks": [
    "packages/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/facebook-package.zip",
    "packages/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/instagram-package.zip",
    "packages/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/tiktok-package.zip",
    "packages/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/youtube-shorts-package.zip",
    "packages/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/linkedin-package.zip",
    "packages/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/google-business-profile-package.zip"
  ],
  "thumbnails": [
    "thumbnails/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/facebook-thumb.jpg",
    "thumbnails/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/instagram-thumb.jpg",
    "thumbnails/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/tiktok-thumb.jpg",
    "thumbnails/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/youtube-shorts-thumb.jpg",
    "thumbnails/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/linkedin-thumb.jpg",
    "thumbnails/${profile.businessName.toLowerCase().replace(/\\s+/g, '-')}/google-business-profile-thumb.jpg"
  ],
  "publishingInstructions": [
    "Facebook: Log in to your Facebook Business page, click Create Post, upload the video file from your Facebook package, paste the caption, and schedule for the recommended date and time.",
    "Instagram: Open Instagram Creator Studio, select your account, upload the video as a Reel, paste the caption and hashtags, then schedule for the recommended date and time.",
    "TikTok: Log in to TikTok Business Center, click Create, upload the video, paste the caption with hashtags, add the recommended sound, and schedule for optimal posting time.",
    "YouTube Shorts: Log in to YouTube Studio, click Upload, select the video, paste the title and description with hashtags in the first line, set visibility to Public, and publish at the recommended time.",
    "LinkedIn: From your LinkedIn Company Page, click Start a post, upload the video, paste the professional caption, and schedule via LinkedIn's native scheduling or a third-party tool.",
    "Google Business Profile: Log in to Google Business Profile, click Add update, select Add photos or video, upload the asset, paste the post text (no hashtags), and select the CTA button type."
  ],
  "recommendedSchedule": "Post across all platforms on [date] between 9:00-10:00 AM CST for peak engagement. Facebook and Instagram first (9:00 AM), LinkedIn at 9:30 AM for the professional morning window, TikTok and YouTube Shorts at 9:45 AM, and Google Business Profile last at 10:00 AM.",
  "approvalMetadata": "Approved by Koolerr QA Lead on [date]. Quality score: ${approvalDecision.qualityScore}/100. Readability: ${approvalDecision.readabilityScore}/100. Confidence: ${approvalDecision.confidence}%. Platforms approved: ${platformList}. ${approvalDecision.approvalNotes}"
}

Requirements:
- customerSummary must be warm, professional, and written directly to the customer (use "Your content")
- deliverables must have one entry per approved platform (${approvedPkgs.length} items)
- platformPackages must have one entry per approved platform with title, caption preview, CTA, and schedule
- downloadLinks and thumbnails must have one path per approved platform
- publishingInstructions must be specific and step-by-step for each platform — no generic instructions
- recommendedSchedule must reference the actual publish dates from the approved packages
- approvalMetadata must reference the actual approval scores`
}

/**
 * Parses the raw provider JSON response into the content fields of a DeliveryPackage.
 * Metadata fields (packageId, generatedAt, deliveredAt, status, readyForCustomer) are
 * set by the caller — this function validates and returns only the AI-generated content.
 * Throws if the response cannot be parsed or any required field is missing/invalid.
 */
export function parseDeliveryPackage(
  rawContent: string,
  sourceApprovalDecision: ApprovalDecision
): DeliveryPackage {
  let parsed: Record<string, unknown>

  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[DELIVERY_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  const requiredStrings = ['customerSummary', 'recommendedSchedule', 'approvalMetadata'] as const

  // Non-empty arrays — always required; the AI must produce content for each.
  const requiredNonEmptyArrays = [
    'deliverables',
    'platformPackages',
    'publishingInstructions',
  ] as const

  // Arrays required to be present but may be empty (no file storage yet in this phase).
  const requiredArrays = ['downloadLinks', 'thumbnails'] as const

  for (const field of requiredStrings) {
    if (typeof parsed[field] !== 'string' || !parsed[field]) {
      throw new Error(`[DELIVERY_DEPT] Missing or invalid string field "${field}"`)
    }
  }

  for (const field of requiredNonEmptyArrays) {
    if (!Array.isArray(parsed[field]) || (parsed[field] as unknown[]).length === 0) {
      throw new Error(`[DELIVERY_DEPT] Missing or empty array field "${field}"`)
    }
  }

  for (const field of requiredArrays) {
    if (!Array.isArray(parsed[field])) {
      throw new Error(`[DELIVERY_DEPT] Missing array field "${field}"`)
    }
  }

  const now = new Date()

  return {
    packageId: crypto.randomUUID(),
    customerSummary: parsed.customerSummary as string,
    deliverables: parsed.deliverables as string[],
    platformPackages: parsed.platformPackages as string[],
    downloadLinks: parsed.downloadLinks as string[],
    thumbnails: parsed.thumbnails as string[],
    publishingInstructions: parsed.publishingInstructions as string[],
    recommendedSchedule: parsed.recommendedSchedule as string,
    approvalMetadata: parsed.approvalMetadata as string,
    generatedAt: now,
    deliveredAt: now,
    status: 'ready',
    readyForCustomer: true,
    sourceApprovalDecision,
  }
}
