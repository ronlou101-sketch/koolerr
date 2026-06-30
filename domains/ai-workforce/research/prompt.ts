import type { BusinessProfile, ResearchBrief } from './types'

/**
 * System context injected into every research invocation.
 * Instructs the provider to return structured JSON.
 */
export const RESEARCH_SYSTEM_CONTEXT = `You are Koolerr's Research Department — an elite market research team.
Your task is to produce a comprehensive, structured research brief for a local business.
You MUST respond with valid JSON only. No prose. No markdown. No code fences.
The JSON must conform exactly to the schema provided in the user prompt.
Every array field must contain at least 3 specific, actionable items.`

/**
 * Builds the structured research prompt from a business profile.
 * The prompt requests JSON output that maps directly to ResearchBrief.
 */
export function buildResearchPrompt(profile: BusinessProfile): string {
  const profileLines = [
    `Business Name: ${profile.businessName}`,
    `Business Category: ${profile.businessCategory}`,
    `Location: ${profile.location}`,
    profile.website ? `Website: ${profile.website}` : null,
    profile.serviceArea ? `Service Area: ${profile.serviceArea}` : null,
    profile.notes ? `Additional Notes: ${profile.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return `Conduct a comprehensive market research brief for the following business:

${profileLines}

Return ONLY a JSON object with this exact structure (no markdown, no code fences):

{
  "companyOverview": "2-3 sentence overview of the company's position, strengths, and market role",
  "industryOverview": "2-3 sentence overview of the industry, trends, and market size",
  "localMarketAnalysis": "2-3 sentence analysis of the local market conditions, demand, and opportunity",
  "competitorAnalysis": ["competitor 1 insight", "competitor 2 insight", "competitor 3 insight"],
  "customerPainPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "frequentlyAskedQuestions": ["question 1?", "question 2?", "question 3?"],
  "seoOpportunities": ["keyword or topic 1", "keyword or topic 2", "keyword or topic 3"],
  "highPerformingContentTopics": ["topic 1", "topic 2", "topic 3"],
  "trendingSocialMediaIdeas": ["idea 1", "idea 2", "idea 3"],
  "recommendedMarketingAngles": ["angle 1", "angle 2", "angle 3"],
  "recommendedOffers": ["offer 1", "offer 2", "offer 3"],
  "recommendedCallsToAction": ["CTA 1", "CTA 2", "CTA 3"]
}

Requirements:
- Every item must be specific to ${profile.businessName} and ${profile.location}
- Competitor analysis must name real or likely local competitors
- SEO opportunities must include search terms customers actually use
- All recommendations must be actionable within 30 days`
}

/**
 * Parses the raw provider response into a typed ResearchBrief.
 * Throws if the response cannot be parsed or is missing required fields.
 */
export function parseResearchBrief(
  rawContent: string,
  sourceProfile: BusinessProfile
): ResearchBrief {
  let parsed: Record<string, unknown>

  try {
    // Strip any accidental markdown code fences before parsing
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error(
      `[RESEARCH_DEPT] Provider returned non-JSON content. ` +
        `Content preview: ${rawContent.slice(0, 200)}`
    )
  }

  const requiredStringFields = [
    'companyOverview',
    'industryOverview',
    'localMarketAnalysis',
  ] as const
  const requiredArrayFields = [
    'competitorAnalysis',
    'customerPainPoints',
    'frequentlyAskedQuestions',
    'seoOpportunities',
    'highPerformingContentTopics',
    'trendingSocialMediaIdeas',
    'recommendedMarketingAngles',
    'recommendedOffers',
    'recommendedCallsToAction',
  ] as const

  for (const field of requiredStringFields) {
    if (typeof parsed[field] !== 'string' || !parsed[field]) {
      throw new Error(`[RESEARCH_DEPT] Missing or invalid field "${field}" in research response`)
    }
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(parsed[field]) || (parsed[field] as unknown[]).length === 0) {
      throw new Error(
        `[RESEARCH_DEPT] Missing or empty array field "${field}" in research response`
      )
    }
  }

  return {
    companyOverview: parsed.companyOverview as string,
    industryOverview: parsed.industryOverview as string,
    localMarketAnalysis: parsed.localMarketAnalysis as string,
    competitorAnalysis: parsed.competitorAnalysis as string[],
    customerPainPoints: parsed.customerPainPoints as string[],
    frequentlyAskedQuestions: parsed.frequentlyAskedQuestions as string[],
    seoOpportunities: parsed.seoOpportunities as string[],
    highPerformingContentTopics: parsed.highPerformingContentTopics as string[],
    trendingSocialMediaIdeas: parsed.trendingSocialMediaIdeas as string[],
    recommendedMarketingAngles: parsed.recommendedMarketingAngles as string[],
    recommendedOffers: parsed.recommendedOffers as string[],
    recommendedCallsToAction: parsed.recommendedCallsToAction as string[],
    generatedAt: new Date(),
    sourceProfile,
  }
}
