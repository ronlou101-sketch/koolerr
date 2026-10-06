import type { ApprovalDecision } from '../approval/types'
import { filterToAllowedPlatforms, PLATFORM_DISPLAY_NAMES } from '../publishing/platform-resolver'
import type { PublishingPackage, SupportedPlatform } from '../publishing/types'
import type { DeliveryPackage, MediaTruth } from './types'

/**
 * System context injected into every delivery invocation.
 *
 * Report truth (Architect a9838a2c + Founder-ratified inventory): the AI writes only the
 * customer summary and text-only publishing steps. Platforms, media, schedule, quality
 * summary, and status are built by the parser from verified run context.
 */
export const DELIVERY_SYSTEM_CONTEXT = `You are Koolerr's Delivery Department. You summarise prepared social post packages for the business owner to review.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
The content has NOT been approved by the customer, published, or delivered. Never say it is approved, ready, published, or delivered.
Never invent business claims, offers, prices, guarantees, credentials, response times, file names, paths, links, or account IDs.
Only mention video, images, or uploads when the prompt states that verified media exists.`

/** Default media truth when none was supplied: no verified media, video status unknown. */
export const UNKNOWN_MEDIA_TRUTH: MediaTruth = { images: [], video: { state: 'unavailable' } }

/** Approved packages restricted to the job's allowed platforms, in package order. */
export function selectApprovedPackages(decision: ApprovalDecision): PublishingPackage[] {
  const allowed = decision.sourcePublishingJob.allowedPlatforms
  const approved = allowed
    ? filterToAllowedPlatforms(decision.approvedPackages, allowed)
    : decision.approvedPackages
  const seen = new Set<SupportedPlatform>()
  return decision.sourcePublishingJob.packages.filter((p) => {
    if (!approved.includes(p.platform) || seen.has(p.platform)) return false
    seen.add(p.platform)
    return true
  })
}

function displayName(platform: SupportedPlatform): string {
  return PLATFORM_DISPLAY_NAMES[platform]
}

function preview(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

/** Schedule text for one package — only from the business-timezone schedule. */
export function packageScheduleText(pkg: PublishingPackage): string {
  if (!pkg.publishDate || !pkg.timezone) return 'Not scheduled'
  return pkg.publishTime
    ? `${pkg.publishDate} at ${pkg.publishTime} (${pkg.timezone})`
    : `${pkg.publishDate} (${pkg.timezone})`
}

/** The video-state line. The three states are never merged. */
export function videoStateLine(media: MediaTruth): string {
  switch (media.video.state) {
    case 'verified':
      return `Video: ${media.video.videos.length} verified video(s) available.`
    case 'none':
      return 'Video: not produced for this campaign.'
    case 'unavailable':
      return 'Video: status unavailable.'
  }
}

function hasVerifiedMedia(media: MediaTruth): boolean {
  return media.images.length > 0 || media.video.state === 'verified'
}

function mediaFacts(media: MediaTruth): string {
  const images =
    media.images.length > 0 ? `Verified images: ${media.images.length}.` : 'Verified images: none.'
  return `${images} ${videoStateLine(media)}`
}

/** Serialises the approval decision and verified context for the delivery prompt. */
function summariseApproval(
  decision: ApprovalDecision,
  approvedPkgs: PublishingPackage[],
  media: MediaTruth
): string {
  const strategy =
    decision.sourcePublishingJob.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief
  const profile = strategy.sourceResearchBrief.sourceProfile

  return [
    `Business: ${profile.businessName} (${profile.businessCategory}) — ${profile.location}`,
    `Business Facts (the ONLY source of business claims): ${profile.notes ?? 'none provided'}`,
    ``,
    `Prepared post packages (${approvedPkgs.length}):`,
    approvedPkgs
      .map((p) => `  [${displayName(p.platform)}] ${p.title} | ${packageScheduleText(p)}`)
      .join('\n'),
    ``,
    `Media: ${mediaFacts(media)}`,
  ].join('\n')
}

/**
 * Builds the delivery prompt. The AI is asked only for the customer summary and one
 * text-only publishing step list per prepared platform; everything else is built by
 * the parser from verified context.
 */
export function buildDeliveryPrompt(
  approvalDecision: ApprovalDecision,
  mediaTruth: MediaTruth = UNKNOWN_MEDIA_TRUTH
): string {
  const profile =
    approvalDecision.sourcePublishingJob.videoProductionBrief.sourceCreativeBrief
      .sourceStrategyBrief.sourceResearchBrief.sourceProfile
  const approvedPkgs = selectApprovedPackages(approvalDecision)
  const names = approvedPkgs.map((p) => displayName(p.platform))
  const scheduled = approvedPkgs.some((p) => p.publishDate && p.timezone)
  const instructionSchema = names
    .map((n) => `    "${n}: <step-by-step instructions for posting the text package on ${n}>"`)
    .join(',\n')

  return `You are summarising prepared post packages for ${profile.businessName} to review.

=== CONTEXT ===
${summariseApproval(approvalDecision, approvedPkgs, mediaTruth)}

=== YOUR TASK ===
Return a JSON object with this exact structure (no markdown, no code fences):

{
  "customerSummary": "<2-3 sentences to the business owner describing the prepared post packages and that they are waiting for their review>",
  "publishingInstructions": [
${instructionSchema}
  ]
}

Requirements:
- publishingInstructions: exactly one entry per platform listed above (${names.join(', ')}), each starting with the platform name — no other platforms
- Instructions cover posting the caption, hashtags, and call to action as text${hasVerifiedMedia(mediaTruth) ? ' and attaching the verified media' : '; do NOT mention video, images, uploads, or files'}
- ${scheduled ? 'Use only the schedule shown above; do not add other dates or times' : 'Do not mention any date, time, or timezone — the business timezone is unknown'}
- Do not say the content is approved, ready, published, or delivered
- Do not invent business claims, offers, prices, file names, links, or account IDs`
}

// ── Server-built customer text (never taken from AI) ───────────────────────────

function packageWord(count: number): string {
  return count === 1 ? 'post package' : 'post packages'
}

/**
 * Customer summary built only from verified run context: business name, resolved
 * platforms, and what media actually exists. Never dates, claims, or status words.
 */
function buildCustomerSummary(profileName: string, names: string[], media: MediaTruth): string {
  const count = names.length
  const list = names.join(', ')
  const mediaLine =
    media.video.state === 'verified' && media.images.length > 0
      ? ` Verified images and video from this campaign are included.`
      : media.video.state === 'verified'
        ? ` Verified video from this campaign is included.`
        : media.images.length > 0
          ? ` Verified images from this campaign are included.`
          : ''
  return (
    `Your ${count} ${packageWord(count)} for ${profileName} (${list}) have been prepared ` +
    `and are waiting for your review. Each includes a caption, hashtags, and a call to action.` +
    mediaLine
  )
}

/**
 * One posting-step line per platform, built from verified context only.
 * Mentions attaching media only when verified media exists; mentions a schedule
 * only when the business-timezone schedule is present.
 */
function buildPublishingInstruction(name: string, scheduled: boolean, media: MediaTruth): string {
  const mediaStep =
    media.video.state === 'verified' && media.images.length > 0
      ? 'attach the verified images and video, '
      : media.video.state === 'verified'
        ? 'attach the verified video, '
        : media.images.length > 0
          ? 'attach the verified image(s), '
          : ''
  const finish = scheduled
    ? 'then publish or schedule it for the date and time shown'
    : 'then publish it at a time that works for you'
  return (
    `${name}: open your ${name} account, create a new post, paste the caption and hashtags, ` +
    `add the call to action, ${mediaStep}${finish}.`
  )
}

/** Builds the schedule section from the packages' business-timezone schedule only. */
function buildRecommendedSchedule(pkgs: PublishingPackage[]): string {
  const scheduled = pkgs.filter((p) => p.publishDate && p.timezone)
  if (scheduled.length === 0) {
    return 'Not scheduled: the business timezone could not be determined from the business location.'
  }
  return scheduled.map((p) => `${displayName(p.platform)}: ${packageScheduleText(p)}`).join('; ')
}

const OUTCOME_TEXT: Record<ApprovalDecision['overallDecision'], string> = {
  APPROVED: 'passed',
  REVISE: 'passed with revisions suggested',
  REJECT: 'did not pass',
}

/** Server-built quality summary: scores only — no reviewer identity, role, or date. */
function buildApprovalMetadata(decision: ApprovalDecision, names: string[]): string {
  return (
    `Automated quality check ${OUTCOME_TEXT[decision.overallDecision]} — quality ${decision.qualityScore}/100, ` +
    `readability ${decision.readabilityScore}/100, confidence ${decision.confidence}%. ` +
    `Platforms checked: ${names.join(', ')}. This is an automated check, not a customer decision.`
  )
}

/**
 * Parses the provider response and builds the DeliveryPackage from verified context.
 * The parser never sets a ready/delivered state: status is always 'prepared'.
 * Throws if the response cannot be parsed or no approved package exists.
 */
export function parseDeliveryPackage(
  rawContent: string,
  sourceApprovalDecision: ApprovalDecision,
  mediaTruth: MediaTruth = UNKNOWN_MEDIA_TRUTH
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

  if (typeof parsed.customerSummary !== 'string' || !parsed.customerSummary) {
    throw new Error(`[DELIVERY_DEPT] Missing or invalid string field "customerSummary"`)
  }
  if (!Array.isArray(parsed.publishingInstructions)) {
    throw new Error(`[DELIVERY_DEPT] Missing array field "publishingInstructions"`)
  }

  const approvedPkgs = selectApprovedPackages(sourceApprovalDecision)
  if (approvedPkgs.length === 0) {
    throw new Error('[DELIVERY_DEPT] Missing or empty array field "approvedPackages"')
  }

  const profile =
    sourceApprovalDecision.sourcePublishingJob.videoProductionBrief.sourceCreativeBrief
      .sourceStrategyBrief.sourceResearchBrief.sourceProfile
  const names = approvedPkgs.map((p) => displayName(p.platform))
  const scheduled = approvedPkgs.some((p) => p.publishDate && p.timezone)

  // Customer-facing summary and posting steps are always built from verified run
  // context. AI text for these fields is discarded so invented dates, timezones,
  // offers, and status words cannot reach the report (Architect a9838a2c).
  const customerSummary = buildCustomerSummary(profile.businessName, names, mediaTruth)
  const publishingInstructions = names.map((name) =>
    buildPublishingInstruction(name, scheduled, mediaTruth)
  )

  const deliverables = [
    ...approvedPkgs.map(
      (p) => `${displayName(p.platform)} post package — caption, hashtags, and call to action`
    ),
    ...(mediaTruth.images.length > 0
      ? [`Images: ${mediaTruth.images.length} verified image(s).`]
      : []),
    videoStateLine(mediaTruth),
  ]

  const platformPackages = approvedPkgs.map(
    (p) =>
      `${displayName(p.platform)}: ${p.title} · ${preview(p.caption)} · CTA: ${p.callToAction} · ` +
      `Schedule: ${packageScheduleText(p)}`
  )

  return {
    packageId: crypto.randomUUID(),
    customerSummary,
    deliverables,
    platformPackages,
    downloadLinks: [],
    thumbnails: mediaTruth.images.map((i) => i.imageUrl),
    publishingInstructions,
    recommendedSchedule: buildRecommendedSchedule(approvedPkgs),
    approvalMetadata: buildApprovalMetadata(sourceApprovalDecision, names),
    generatedAt: new Date(),
    status: 'prepared',
    mediaTruth,
    sourceApprovalDecision,
  }
}
