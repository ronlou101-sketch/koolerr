import type { DogfoodingObjective } from '@/domains/dogfooding'

const KOOLERR_CONTEXT = `Koolerr is a B2B AI SaaS platform that gives businesses an autonomous AI workforce. Instead of hiring teams of employees, Koolerr customers deploy AI Digital Employees — specialized agents for research, strategy, copywriting, video production, voice synthesis, and delivery — that run 24/7, execute complex multi-department workflows, and produce high-quality content outputs at scale. Target customers: growth-stage SaaS founders, marketing agencies, and ecommerce brands spending $3k-$50k/month on content and marketing.`

export const RESEARCHER_SYSTEM_CONTEXT = `You are the Marketing Researcher for Koolerr's internal marketing department. You are a world-class B2B SaaS market researcher specializing in AI-powered automation tools.

${KOOLERR_CONTEXT}

Your job: produce structured market research that will inform campaign strategy. Always respond with valid JSON.`

export const STRATEGIST_SYSTEM_CONTEXT = `You are the Marketing Strategist for Koolerr's internal marketing department. You design high-converting campaign strategies for B2B SaaS products.

${KOOLERR_CONTEXT}

Your job: translate research into concrete campaign structures with clear targeting, channels, and budget allocation. Always respond with valid JSON.`

export const CMO_SYSTEM_CONTEXT = `You are the Chief Marketing Officer for Koolerr's internal marketing department. You set the strategic direction for all marketing activity.

${KOOLERR_CONTEXT}

Your job: produce a comprehensive marketing plan that aligns campaigns to business objectives, defines KPIs, and establishes clear messaging. Always respond with valid JSON.`

export const COPYWRITER_SYSTEM_CONTEXT = `You are the Marketing Copywriter for Koolerr's internal marketing department. You write high-converting direct response copy for paid social ads.

${KOOLERR_CONTEXT}

Your job: write 3 distinct ad copy variants per campaign — each with a different angle, hook, and CTA. Focus on specific pain points, tangible outcomes, and urgency. Always respond with valid JSON.`

export const CREATIVE_DIRECTOR_SYSTEM_CONTEXT = `You are the Creative Director for Koolerr's internal marketing department. You design visual creative strategies for paid social campaigns. You write Higgsfield image prompts and spokesperson video concepts.

${KOOLERR_CONTEXT}

Your job: produce 2 image creatives (Higgsfield prompts) and 1 spokesperson video creative per campaign. Always respond with valid JSON.`

export const VIDEO_SCRIPT_WRITER_SYSTEM_CONTEXT = `You are the Video Producer for Koolerr's internal marketing department. You write tight, high-converting spokesperson scripts for HeyGen AI video generation.

${KOOLERR_CONTEXT}

Your job: write a 30–60 second spokesperson script that will be delivered by an AI avatar. The script must be direct, conversational, and end with a clear call to action. Always respond with valid JSON.`

export function buildResearchPrompt(objective: DogfoodingObjective): string {
  return `Conduct market research for the following Koolerr marketing objective:

OBJECTIVE: ${objective.title}
DESCRIPTION: ${objective.description}
GOAL TYPE: ${objective.goalType}
TARGET AUDIENCE: ${objective.targetAudience ?? 'Not specified — identify the best ICP'}

Produce research in this exact JSON structure:
{
  "icp": {
    "primaryPersona": "string (job title, company type, size)",
    "painPoints": ["string", "..."],
    "desiredOutcomes": ["string", "..."],
    "buyingTriggers": ["string", "..."]
  },
  "marketAngles": ["string", "..."],
  "competitorWeaknesses": ["string", "..."],
  "keyMessages": ["string", "..."],
  "channelInsights": {
    "recommendedChannels": ["string", "..."],
    "reasoning": "string"
  },
  "researchSummary": "string (2-3 paragraphs)"
}`
}

export function buildStrategyPrompt(
  objective: DogfoodingObjective,
  researchSummary: string
): string {
  return `Design a campaign strategy for the following Koolerr marketing objective.

OBJECTIVE: ${objective.title}
GOAL TYPE: ${objective.goalType}
TOTAL BUDGET: $${(objective.budgetCents / 100).toFixed(0)}
RESEARCH BRIEF:
${researchSummary}

Produce a campaign strategy in this exact JSON structure:
{
  "campaigns": [
    {
      "name": "string",
      "objectiveSummary": "string (1-2 sentences)",
      "targetAudience": {
        "primaryPersona": "string",
        "ageRange": "string",
        "interests": ["string"],
        "behaviors": ["string"]
      },
      "channels": ["facebook", "instagram", "linkedin", "..."],
      "budgetPercent": 100,
      "durationWeeks": 4,
      "keyMessages": ["string", "..."],
      "successMetrics": ["string", "..."]
    }
  ],
  "strategyRationale": "string"
}

Include 1-3 campaigns that together cover the full budget.`
}

export function buildCMOPlanPrompt(
  objective: DogfoodingObjective,
  researchSummary: string,
  strategySummary: string
): string {
  return `Produce a comprehensive marketing plan for the following Koolerr objective.

OBJECTIVE: ${objective.title}
DESCRIPTION: ${objective.description}
GOAL TYPE: ${objective.goalType}
BUDGET: $${(objective.budgetCents / 100).toFixed(0)}

RESEARCH BRIEF:
${researchSummary}

CAMPAIGN STRATEGY:
${strategySummary}

Produce a marketing plan in this exact JSON structure:
{
  "title": "string",
  "executiveSummary": "string (3-4 sentences covering goal, approach, and expected outcomes)",
  "targetAudience": {
    "primaryPersona": "string",
    "secondaryPersona": "string or null",
    "geographies": ["string"],
    "companySize": "string"
  },
  "messagingPillars": [
    "string (core message 1)",
    "string (core message 2)",
    "string (core message 3)"
  ],
  "channelMix": [
    "string (channel: percentage allocation)"
  ],
  "campaignPhases": [
    {
      "phase": "number",
      "name": "string",
      "duration": "string",
      "focus": "string",
      "budget": "string"
    }
  ],
  "kpis": [
    "string (metric: target)"
  ]
}`
}

export function buildCopywriterPrompt(
  campaignName: string,
  targetAudience: Record<string, unknown>,
  messagingPillars: string[]
): string {
  const audience = JSON.stringify(targetAudience, null, 2)
  const pillars = messagingPillars.join('\n- ')

  return `Write 3 ad copy variants for this Koolerr campaign.

CAMPAIGN: ${campaignName}
TARGET AUDIENCE:
${audience}

MESSAGING PILLARS:
- ${pillars}

Each variant should use a different angle and hook. Focus on specific outcomes, not features.

Produce copy in this exact JSON structure:
{
  "variants": [
    {
      "variantName": "string (e.g. 'Pain-Point Hook', 'ROI Angle', 'FOMO Variant')",
      "headline": "string (max 40 chars, attention-grabbing)",
      "primaryText": "string (2-3 sentences, pain → solution → outcome)",
      "callToAction": "string (e.g. 'Start Free Trial', 'See It In Action', 'Book a Demo')",
      "description": "string (1 sentence, optional reinforcement)"
    }
  ]
}`
}

export function buildCreativeDirectorPrompt(
  campaignName: string,
  targetAudience: Record<string, unknown>,
  messagingPillars: string[]
): string {
  const audience = JSON.stringify(targetAudience, null, 2)
  const pillars = messagingPillars.join(', ')

  return `Design visual creative direction for this Koolerr ad campaign. Produce 2 Higgsfield image creatives and 1 HeyGen spokesperson video creative.

CAMPAIGN: ${campaignName}
TARGET AUDIENCE:
${audience}

MESSAGING PILLARS: ${pillars}

Context: Koolerr is a B2B AI SaaS. Creatives should convey: AI power, speed, clarity, professional trust. NOT: robotic, cold, sci-fi clichés.

Produce creative direction in this exact JSON structure:
{
  "visualStrategy": "string (overall visual direction and mood)",
  "creatives": [
    {
      "type": "image",
      "concept": "string (brief concept description)",
      "prompt": "string (detailed Higgsfield generation prompt — describe the scene, mood, lighting, composition, style in 2-3 sentences)",
      "adFormat": "square",
      "metadata": {
        "angle": "string",
        "emotion": "string",
        "colorPalette": "string"
      }
    },
    {
      "type": "image",
      "concept": "string",
      "prompt": "string",
      "adFormat": "square",
      "metadata": {
        "angle": "string",
        "emotion": "string",
        "colorPalette": "string"
      }
    },
    {
      "type": "video",
      "concept": "string (what the spokesperson introduces and the emotional hook)",
      "prompt": "string (key messages and tone for the spokesperson — 2-3 sentences of direction)",
      "adFormat": "landscape",
      "metadata": {
        "angle": "string (e.g. 'pain-point hook', 'ROI demo', 'social proof')",
        "emotion": "string",
        "speakerRole": "string (e.g. 'CEO', 'Marketing Director', 'AI expert')"
      }
    }
  ]
}

Return exactly 3 creatives: 2 of type image, 1 of type video.`
}

export function buildVideoScriptPrompt(
  creativeDirection: string,
  campaignName: string,
  messagingPillars: string[]
): string {
  const pillars = messagingPillars.length > 0 ? messagingPillars.join('\n- ') : 'None specified'

  return `Write a 30–60 second spokesperson script for this Koolerr campaign video.

CAMPAIGN: ${campaignName}
CREATIVE DIRECTION:
${creativeDirection}

MESSAGING PILLARS:
- ${pillars}

Requirements:
- Conversational and direct — written exactly as the spokesperson will speak it
- Opens with a pain point or hook in the first 5 seconds
- Delivers the core value proposition in the middle
- Ends with a single clear call to action
- Between 75 and 150 words
- No stage directions, emojis, or formatting marks — spoken text only

Produce the script in this exact JSON structure:
{
  "title": "string (descriptive name for this script, e.g. 'Pain-Point Hook — 45s')",
  "platform": "string (primary placement: 'facebook', 'instagram', 'youtube', or 'linkedin')",
  "estimatedDurationSec": 45,
  "script": "string (the complete spoken script — every word the spokesperson will say)"
}`
}
