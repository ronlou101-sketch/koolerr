import type { PublishingJob, PublishingPackage, SupportedPlatform } from '../publishing/types'
import { filterToAllowedPlatforms, resolveAllowedPlatforms } from '../publishing/platform-resolver'
import type { ApprovalDecision, ApprovalOutcome } from './types'

/**
 * System context injected into every approval invocation.
 * Instructs the provider to return a structured ApprovalDecision as JSON.
 */
export const APPROVAL_SYSTEM_CONTEXT = `You are Koolerr's Approval Department — the quality gate between publishing and delivery.
You receive a complete set of publishing packages and produce a structured approval decision.
Evaluate brand alignment, content quality, platform compliance, and readiness for customer delivery.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Be specific and actionable in all issue descriptions and revision instructions.
overallDecision must be exactly one of: APPROVED, REVISE, or REJECT.`

/** Formats a single package into a compact review summary. */
function summarisePackage(pkg: PublishingPackage): string {
  const captionPreview = pkg.caption.length > 180 ? pkg.caption.slice(0, 180) + '…' : pkg.caption
  const scheduling = pkg.publishDate
    ? `${pkg.publishDate} ${pkg.publishTime} ${pkg.timezone}`.replace(/\s+/g, ' ').trim()
    : 'not scheduled (business timezone unknown — no dates or times may appear)'
  return [
    `[${pkg.platform}]`,
    `  Title: ${pkg.title}`,
    `  Caption: ${captionPreview}`,
    `  CTA: ${pkg.callToAction}`,
    `  Hashtags: ${pkg.hashtags.join(', ') || '(none)'}`,
    `  Scheduling: ${scheduling}`,
    `  Approval required: ${pkg.approvalRequired}`,
  ].join('\n')
}

/** Allowed platforms for a publishing job (shared resolver). */
export function resolveApprovalPlatforms(job: PublishingJob): SupportedPlatform[] {
  const profile =
    job.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief
      .sourceProfile
  return job.allowedPlatforms && job.allowedPlatforms.length > 0
    ? resolveAllowedPlatforms(job.allowedPlatforms)
    : resolveAllowedPlatforms(profile.allowedPlatforms)
}

/** Serialises the publishing job and its upstream chain into a review summary. */
function summarisePublishingJob(job: PublishingJob): string {
  const strategy = job.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief
  const profile = strategy.sourceResearchBrief.sourceProfile
  const creative = job.videoProductionBrief.sourceCreativeBrief

  return [
    `Business: ${profile.businessName} (${profile.businessCategory}) — ${profile.location}`,
    `Business Facts (the ONLY permitted source of business claims): ${profile.notes ?? 'none provided'}`,
    `Allowed platforms: ${resolveApprovalPlatforms(job).join(', ')}`,
    `Verified media: none — no video, image, or file has been produced or verified`,
    ``,
    `Brand Positioning: ${strategy.brandPositioning}`,
    `Core Messaging: ${strategy.coreMessaging}`,
    `Creative Direction: ${creative.visualStyle}`,
    `Brand Guidelines: ${creative.brandingGuidelines}`,
    ``,
    `Packages to review (${job.packages.length}):`,
    ``,
    job.packages.map(summarisePackage).join('\n\n'),
  ].join('\n')
}

/**
 * Builds the full approval prompt from a PublishingJob.
 * The prompt requests a structured ApprovalDecision as JSON. The schema carries no
 * pre-filled verdict, scores, notes, or platform list — the reviewer must decide.
 */
export function buildApprovalPrompt(publishingJob: PublishingJob): string {
  const profile =
    publishingJob.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief
      .sourceProfile
  const allowed = resolveApprovalPlatforms(publishingJob)

  return `You are conducting a quality review and approval decision for ${profile.businessName}'s publishing packages.

=== PUBLISHING JOB ===
${summarisePublishingJob(publishingJob)}

=== EVALUATION CRITERIA ===
1. Brand alignment — Does every caption, title, and CTA reflect the brand positioning and core messaging?
2. Platform compliance — Does each package meet the specific requirements, tone, and format of its platform?
3. Content quality — Are captions compelling, well-written, and free of factual errors or typos?
4. CTA effectiveness — Is every call-to-action clear, native to the platform, and conversion-focused?
5. Scheduling correctness — If a schedule is given, is it consistent? If the timezone is unknown, the copy must contain no dates or times.
6. Truthfulness — Every business claim (offers, discounts, free services, pricing, guarantees, hours/availability such as 24/7, response times, credentials, policies) must appear in the Business Facts. Any invented claim is a complianceIssue.
7. No fabrication — No file names, file paths, account/page/ad/channel IDs, or references to a video, image, or download (none exists). Any such reference is a criticalIssue.
8. Compliance and safety — Is there anything legally or ethically problematic in any package?

=== YOUR TASK ===
Produce an Approval Decision as a JSON object with this structure (no markdown, no code fences). Replace every value with your own assessment of THESE packages:

{
  "overallDecision": "one of APPROVED, REVISE, REJECT",
  "confidence": "integer 0-100",
  "qualityScore": "integer 0-100",
  "readabilityScore": "integer 0-100",
  "readyForDelivery": "boolean — true only for APPROVED",
  "criticalIssues": ["each blocking issue you found"],
  "brandingIssues": ["each branding issue you found"],
  "complianceIssues": ["each compliance or truthfulness issue you found"],
  "platformIssues": ["each platform issue you found"],
  "requiredChanges": ["each change required before delivery"],
  "revisionInstructions": "Specific revision steps for these packages",
  "approvalNotes": "Your specific assessment of these packages and the reason for your decision",
  "approvedPackages": ["platform ids that passed review"],
  "rejectedPackages": ["platform ids that failed review"]
}

Outcome rules:
- APPROVED: qualityScore >= 80 AND no criticalIssues AND no complianceIssues → readyForDelivery must be true
- REVISE: qualityScore 60–79 OR brandingIssues OR platformIssues exist → readyForDelivery must be false; requiredChanges must be non-empty
- REJECT: qualityScore < 60 OR criticalIssues OR complianceIssues exist → readyForDelivery must be false; criticalIssues or complianceIssues must be non-empty

Package-level fields:
- approvedPackages: platform identifiers from this list that passed review — ${JSON.stringify(allowed)}
- rejectedPackages: platform identifiers from this list that failed and must be reworked

Requirements:
- overallDecision must be exactly "APPROVED", "REVISE", or "REJECT"
- confidence, qualityScore, and readabilityScore must be integers 0–100
- readyForDelivery must be a boolean (true only for APPROVED)
- approvedPackages and rejectedPackages must only contain values from: ${allowed.join(', ')}
- Issue arrays are empty only when you found no issue of that kind
- revisionInstructions and approvalNotes must be non-empty strings written for these specific packages`
}

/**
 * Parses the raw provider JSON response into a typed ApprovalDecision.
 * Throws if the response cannot be parsed or any required field is missing/invalid.
 */
export function parseApprovalDecision(
  rawContent: string,
  sourcePublishingJob: PublishingJob
): ApprovalDecision {
  let parsed: Record<string, unknown>

  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[APPROVAL_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  const validOutcomes: ApprovalOutcome[] = ['APPROVED', 'REVISE', 'REJECT']
  if (!validOutcomes.includes(parsed.overallDecision as ApprovalOutcome)) {
    throw new Error(
      `[APPROVAL_DEPT] Invalid "overallDecision": "${String(parsed.overallDecision)}". ` +
        `Must be APPROVED, REVISE, or REJECT.`
    )
  }

  for (const numField of ['confidence', 'qualityScore', 'readabilityScore'] as const) {
    const val = parsed[numField]
    if (typeof val !== 'number' || val < 0 || val > 100) {
      throw new Error(
        `[APPROVAL_DEPT] Missing or invalid numeric field "${numField}" (must be 0–100)`
      )
    }
  }

  if (typeof parsed.readyForDelivery !== 'boolean') {
    throw new Error('[APPROVAL_DEPT] Missing or invalid boolean field "readyForDelivery"')
  }

  for (const strField of ['revisionInstructions', 'approvalNotes'] as const) {
    if (typeof parsed[strField] !== 'string' || !parsed[strField]) {
      throw new Error(`[APPROVAL_DEPT] Missing or invalid string field "${strField}"`)
    }
  }

  const requiredArrayFields = [
    'criticalIssues',
    'brandingIssues',
    'complianceIssues',
    'platformIssues',
    'requiredChanges',
    'approvedPackages',
    'rejectedPackages',
  ] as const

  for (const arrField of requiredArrayFields) {
    if (!Array.isArray(parsed[arrField])) {
      throw new Error(`[APPROVAL_DEPT] Missing array field "${arrField}"`)
    }
  }

  return {
    overallDecision: parsed.overallDecision as ApprovalOutcome,
    confidence: parsed.confidence as number,
    qualityScore: parsed.qualityScore as number,
    readabilityScore: parsed.readabilityScore as number,
    readyForDelivery: parsed.readyForDelivery as boolean,
    criticalIssues: parsed.criticalIssues as string[],
    brandingIssues: parsed.brandingIssues as string[],
    complianceIssues: parsed.complianceIssues as string[],
    platformIssues: parsed.platformIssues as string[],
    requiredChanges: parsed.requiredChanges as string[],
    revisionInstructions: parsed.revisionInstructions as string,
    approvalNotes: parsed.approvalNotes as string,
    // Shared resolver: platforms outside the allowed set are discarded, never expanded.
    approvedPackages: filterToAllowedPlatforms(
      parsed.approvedPackages as unknown[],
      resolveApprovalPlatforms(sourcePublishingJob)
    ),
    rejectedPackages: filterToAllowedPlatforms(
      parsed.rejectedPackages as unknown[],
      resolveApprovalPlatforms(sourcePublishingJob)
    ),
    generatedAt: new Date(),
    sourcePublishingJob,
  }
}
