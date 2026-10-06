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

// ── Server-side truth checks ───────────────────────────────────────────────────

const STATUS_CLAIM = /\b(approved|approval|ready|published|delivered|live)\b/i
const MEDIA_MENTION =
  /\b(video|videos|reel|reels|clip|footage|image|images|photo|photos|upload|attach|thumbnail|file|files)\b/i
const FABRICATED_REFERENCE =
  /\b[\w-]+\.(mp4|mov|jpg|jpeg|png|gif|zip|pdf)\b|https?:\/\/|\b(page[_ ]id|ad[_ ]account|channel[_ ]id|place[_ ]id|act_\d+)\b/i
const SCHEDULE_MENTION =
  /\b\d{1,2}:\d{2}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s?(am|pm)\b|\b(EST|EDT|CST|CDT|MST|MDT|PST|PDT|UTC|GMT|Central|Eastern|Pacific|Mountain)\b|\bChicago\b/i

function fallbackSummary(profileName: string, names: string[]): string {
  return (
    `Your ${names.length} post package(s) for ${profileName} (${names.join(', ')}) have been prepared ` +
    `and are waiting for your review. Each includes a caption, hashtags, and a call to action.`
  )
}

function fallbackInstruction(name: string, scheduled: boolean): string {
  return (
    `${name}: open your ${name} account, create a new post, paste the caption and hashtags, ` +
    `add the call to action, then ${scheduled ? 'publish or schedule it for the date and time shown' : 'publish it when you are ready'}.`
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
    `Platforms checked: ${names.join(', ')}. This is an automated check, not customer approval.`
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
  const verifiedMedia = hasVerifiedMedia(mediaTruth)
  const scheduled = approvedPkgs.some((p) => p.publishDate && p.timezone)

  const isTruthful = (text: string): boolean =>
    !STATUS_CLAIM.test(text) &&
    !FABRICATED_REFERENCE.test(text) &&
    (verifiedMedia || !MEDIA_MENTION.test(text)) &&
    (scheduled || !SCHEDULE_MENTION.test(text))

  const summary = parsed.customerSummary.trim()
  const customerSummary =
    summary && isTruthful(summary) ? summary : fallbackSummary(profile.businessName, names)

  const aiInstructions = (parsed.publishingInstructions as unknown[]).filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  )
  const publishingInstructions = names.map((name) => {
    const match = aiInstructions.find((s) => s.trim().toLowerCase().startsWith(name.toLowerCase()))
    return match && isTruthful(match) ? match.trim() : fallbackInstruction(name, scheduled)
  })

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
