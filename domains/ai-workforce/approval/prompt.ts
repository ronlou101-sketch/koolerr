import type { PublishingJob, PublishingPackage, SupportedPlatform } from '../publishing/types'
import { SUPPORTED_PLATFORMS } from '../publishing/types'
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
  return [
    `[${pkg.platform}]`,
    `  Title: ${pkg.title}`,
    `  Caption: ${captionPreview}`,
    `  CTA: ${pkg.callToAction}`,
    `  Hashtags: ${pkg.hashtags.join(', ') || '(none)'}`,
    `  Scheduling: ${pkg.publishDate} ${pkg.publishTime} ${pkg.timezone}`,
    `  Video reference: ${pkg.videoReference}`,
    `  Delivery assets: ${pkg.deliveryAssets.join(', ')}`,
    `  Approval required: ${pkg.approvalRequired}`,
  ].join('\n')
}

/** Serialises the publishing job and its upstream chain into a review summary. */
function summarisePublishingJob(job: PublishingJob): string {
  const strategy = job.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief
  const profile = strategy.sourceResearchBrief.sourceProfile
  const creative = job.videoProductionBrief.sourceCreativeBrief

  return [
    `Business: ${profile.businessName} (${profile.businessCategory}) — ${profile.location}`,
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
 * The prompt requests a structured ApprovalDecision as JSON.
 */
export function buildApprovalPrompt(publishingJob: PublishingJob): string {
  const profile =
    publishingJob.videoProductionBrief.sourceCreativeBrief.sourceStrategyBrief.sourceResearchBrief
      .sourceProfile
  const platforms = publishingJob.packages.map((p) => p.platform)

  return `You are conducting a quality review and approval decision for ${profile.businessName}'s publishing packages.

=== PUBLISHING JOB ===
${summarisePublishingJob(publishingJob)}

=== EVALUATION CRITERIA ===
1. Brand alignment — Does every caption, title, and CTA reflect the brand positioning and core messaging?
2. Platform compliance — Does each package meet the specific requirements, tone, and format of its platform?
3. Content quality — Are captions compelling, well-written, and free of factual errors or typos?
4. CTA effectiveness — Is every call-to-action clear, native to the platform, and conversion-focused?
5. Scheduling correctness — Are publish dates, times, and timezones properly specified?
6. Asset completeness — Are video references and delivery assets correctly populated?
7. Compliance and safety — Is there anything legally or ethically problematic in any package?

=== YOUR TASK ===
Produce a complete Approval Decision as a JSON object with this exact structure (no markdown, no code fences):

{
  "overallDecision": "APPROVED",
  "confidence": 90,
  "qualityScore": 88,
  "readabilityScore": 92,
  "readyForDelivery": true,
  "criticalIssues": [],
  "brandingIssues": [],
  "complianceIssues": [],
  "platformIssues": [],
  "requiredChanges": [],
  "revisionInstructions": "No revisions required.",
  "approvalNotes": "All packages meet brand, quality, and platform standards. Ready for delivery.",
  "approvedPackages": ${JSON.stringify(platforms)},
  "rejectedPackages": []
}

Outcome rules:
- APPROVED: qualityScore >= 80 AND no criticalIssues AND no complianceIssues → readyForDelivery must be true
- REVISE: qualityScore 60–79 OR brandingIssues OR platformIssues exist → readyForDelivery must be false; requiredChanges must be non-empty
- REJECT: qualityScore < 60 OR criticalIssues OR complianceIssues exist → readyForDelivery must be false; criticalIssues or complianceIssues must be non-empty

Package-level fields:
- approvedPackages: platform identifiers from this list that passed review — ${JSON.stringify(SUPPORTED_PLATFORMS)}
- rejectedPackages: platform identifiers that failed and must be reworked

Requirements:
- overallDecision must be exactly "APPROVED", "REVISE", or "REJECT"
- confidence, qualityScore, and readabilityScore must be integers 0–100
- readyForDelivery must be a boolean (true only for APPROVED)
- approvedPackages and rejectedPackages must only contain values from: ${SUPPORTED_PLATFORMS.join(', ')}
- All issue arrays may be empty for APPROVED decisions
- revisionInstructions and approvalNotes must be non-empty strings`
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
    approvedPackages: parsed.approvedPackages as SupportedPlatform[],
    rejectedPackages: parsed.rejectedPackages as SupportedPlatform[],
    generatedAt: new Date(),
    sourcePublishingJob,
  }
}
