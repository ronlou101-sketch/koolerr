import type { ResearchBrief } from '../research/types'
import type {
  StrategyBrief,
  CustomerPersona,
  ContentCalendarEntry,
  WeeklyPostingSchedule,
} from './types'

/**
 * System context injected into every strategy invocation.
 * Instructs OpenAI to return the full StrategyBrief as structured JSON.
 */
export const STRATEGY_SYSTEM_CONTEXT = `You are Koolerr's Strategy Department — the creative intelligence team.
You receive a completed Research Brief and transform it into a production blueprint.
You decide WHAT content to create, HOW to position the brand, and HOW to convert attention into customers.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every array field must contain at least 3 specific, actionable items tailored to the business.`

/**
 * Serialises a ResearchBrief into a compact prompt-safe string.
 * Avoids full JSON dump — surfaces the fields most useful for strategy generation.
 */
function summariseResearch(brief: ResearchBrief): string {
  return [
    `Business: ${brief.sourceProfile.businessName} (${brief.sourceProfile.businessCategory})`,
    `Location: ${brief.sourceProfile.location}`,
    brief.sourceProfile.website ? `Website: ${brief.sourceProfile.website}` : null,
    ``,
    `Company Overview: ${brief.companyOverview}`,
    `Industry Overview: ${brief.industryOverview}`,
    `Local Market: ${brief.localMarketAnalysis}`,
    ``,
    `Competitors: ${brief.competitorAnalysis.join(' | ')}`,
    `Customer Pain Points: ${brief.customerPainPoints.join(' | ')}`,
    `FAQs: ${brief.frequentlyAskedQuestions.join(' | ')}`,
    ``,
    `SEO Opportunities: ${brief.seoOpportunities.join(', ')}`,
    `High-Performing Topics: ${brief.highPerformingContentTopics.join(', ')}`,
    `Trending Social Ideas: ${brief.trendingSocialMediaIdeas.join(', ')}`,
    ``,
    `Marketing Angles: ${brief.recommendedMarketingAngles.join(' | ')}`,
    `Offers: ${brief.recommendedOffers.join(' | ')}`,
    `CTAs: ${brief.recommendedCallsToAction.join(' | ')}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

/**
 * Builds the full strategy prompt from a ResearchBrief.
 * The prompt requests structured JSON output that maps directly to StrategyBrief.
 */
export function buildStrategyPrompt(researchBrief: ResearchBrief): string {
  const businessName = researchBrief.sourceProfile.businessName

  return `You are producing a complete content strategy for the following business.
Use ONLY the research below — do not invent facts not supported by it.

=== RESEARCH BRIEF ===
${summariseResearch(researchBrief)}

=== YOUR TASK ===
Produce a complete Strategy Brief as a JSON object with this exact structure (no markdown, no code fences):

{
  "brandPositioning": "One compelling sentence positioning ${businessName} against competitors",
  "coreMessaging": "2-3 sentence core messaging framework covering value proposition, proof, and promise",
  "targetAudience": "2-3 sentence target audience definition — who they are, where they are, what drives them",
  "customerPersonas": [
    {
      "name": "Persona name (e.g. 'The Busy Homeowner')",
      "description": "2 sentence description of this persona",
      "painPoints": ["pain point 1", "pain point 2"],
      "goals": ["goal 1", "goal 2"]
    }
  ],
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "monthlyContentCalendar": [
    { "week": 1, "theme": "theme name", "topics": ["topic 1", "topic 2", "topic 3"] },
    { "week": 2, "theme": "theme name", "topics": ["topic 1", "topic 2", "topic 3"] },
    { "week": 3, "theme": "theme name", "topics": ["topic 1", "topic 2", "topic 3"] },
    { "week": 4, "theme": "theme name", "topics": ["topic 1", "topic 2", "topic 3"] }
  ],
  "weeklyPostingSchedule": {
    "monday": "content type or topic idea",
    "tuesday": "content type or topic idea",
    "wednesday": "content type or topic idea",
    "thursday": "content type or topic idea",
    "friday": "content type or topic idea",
    "saturday": "content type or topic idea",
    "sunday": "content type or topic idea"
  },
  "videoConcepts": ["video concept 1", "video concept 2", "video concept 3"],
  "reelHooks": ["hook 1", "hook 2", "hook 3"],
  "scriptOutlines": ["outline 1", "outline 2", "outline 3"],
  "captionIdeas": ["caption 1", "caption 2", "caption 3"],
  "ctaLibrary": ["CTA 1", "CTA 2", "CTA 3", "CTA 4"],
  "hashtagRecommendations": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "campaignIdeas": ["campaign 1", "campaign 2", "campaign 3"],
  "offerRecommendations": ["offer 1", "offer 2", "offer 3"],
  "creativeDirection": "2-3 sentence visual and tonal creative direction for all production",
  "productionNotes": "2-3 sentence practical notes for Video, Voice, and Creative departments",
  "successMetrics": ["metric 1", "metric 2", "metric 3"]
}

Requirements:
- Every item must be tailored specifically to ${businessName}
- customerPersonas must have 2-3 entries
- monthlyContentCalendar must have exactly 4 entries (weeks 1-4)
- weeklyPostingSchedule must include all 7 days
- All content must be conversion-focused, not generic`
}

/**
 * Parses the raw OpenAI JSON response into a typed StrategyBrief.
 * Throws if the response cannot be parsed or is missing required fields.
 */
export function parseStrategyBrief(
  rawContent: string,
  sourceResearchBrief: ResearchBrief
): StrategyBrief {
  let parsed: Record<string, unknown>

  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[STRATEGY_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  const requiredStringFields = [
    'brandPositioning',
    'coreMessaging',
    'targetAudience',
    'creativeDirection',
    'productionNotes',
  ] as const

  const requiredArrayFields = [
    'contentPillars',
    'videoConcepts',
    'reelHooks',
    'scriptOutlines',
    'captionIdeas',
    'ctaLibrary',
    'hashtagRecommendations',
    'campaignIdeas',
    'offerRecommendations',
    'successMetrics',
  ] as const

  for (const field of requiredStringFields) {
    if (typeof parsed[field] !== 'string' || !parsed[field]) {
      throw new Error(`[STRATEGY_DEPT] Missing or invalid field "${field}" in strategy response`)
    }
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(parsed[field]) || (parsed[field] as unknown[]).length === 0) {
      throw new Error(
        `[STRATEGY_DEPT] Missing or empty array field "${field}" in strategy response`
      )
    }
  }

  if (
    !Array.isArray(parsed.customerPersonas) ||
    (parsed.customerPersonas as unknown[]).length === 0
  ) {
    throw new Error('[STRATEGY_DEPT] Missing or empty "customerPersonas" in strategy response')
  }

  if (
    !Array.isArray(parsed.monthlyContentCalendar) ||
    (parsed.monthlyContentCalendar as unknown[]).length === 0
  ) {
    throw new Error(
      '[STRATEGY_DEPT] Missing or empty "monthlyContentCalendar" in strategy response'
    )
  }

  if (typeof parsed.weeklyPostingSchedule !== 'object' || parsed.weeklyPostingSchedule === null) {
    throw new Error('[STRATEGY_DEPT] Missing "weeklyPostingSchedule" in strategy response')
  }

  return {
    brandPositioning: parsed.brandPositioning as string,
    coreMessaging: parsed.coreMessaging as string,
    targetAudience: parsed.targetAudience as string,
    customerPersonas: parsed.customerPersonas as CustomerPersona[],
    contentPillars: parsed.contentPillars as string[],
    monthlyContentCalendar: parsed.monthlyContentCalendar as ContentCalendarEntry[],
    weeklyPostingSchedule: parsed.weeklyPostingSchedule as WeeklyPostingSchedule,
    videoConcepts: parsed.videoConcepts as string[],
    reelHooks: parsed.reelHooks as string[],
    scriptOutlines: parsed.scriptOutlines as string[],
    captionIdeas: parsed.captionIdeas as string[],
    ctaLibrary: parsed.ctaLibrary as string[],
    hashtagRecommendations: parsed.hashtagRecommendations as string[],
    campaignIdeas: parsed.campaignIdeas as string[],
    offerRecommendations: parsed.offerRecommendations as string[],
    creativeDirection: parsed.creativeDirection as string,
    productionNotes: parsed.productionNotes as string,
    successMetrics: parsed.successMetrics as string[],
    generatedAt: new Date(),
    sourceResearchBrief,
  }
}
