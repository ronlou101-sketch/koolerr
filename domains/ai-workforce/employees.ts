import type { AIEmployee, DepartmentId } from './types'

export const WORKFORCE_REGISTRY: AIEmployee[] = [
  // ── Research Department ──────────────────────────────────────────────────────
  {
    id: 'research-lead',
    name: 'Research Lead',
    role: 'Senior Research Agent',
    description:
      'Leads deep research operations — market intelligence, competitive analysis, trend synthesis',
    department: 'research',
    responsibilities: [
      'Market and competitive research',
      'Customer insight synthesis',
      'Trend analysis and forecasting',
      'Research brief production for Strategy & Copy',
    ],
    primaryProvider: 'manus',
    fallbackProvider: 'openai',
    capabilities: ['deep-research', 'web-search', 'data-analysis', 'summarization'],
    status: 'not-configured',
    priority: 'high',
  },
  {
    id: 'brand-researcher',
    name: 'Brand Researcher',
    role: 'Brand Intelligence Analyst',
    description:
      'Analyses customer brand positioning, audience, and voice to inform all downstream content',
    department: 'research',
    responsibilities: [
      'Brand audit and positioning analysis',
      'Audience persona development',
      'Voice and tone documentation',
      'Content opportunity identification',
    ],
    primaryProvider: 'openai',
    fallbackProvider: 'manus',
    capabilities: ['deep-research', 'data-analysis', 'content-strategy', 'summarization'],
    status: 'not-configured',
    priority: 'medium',
  },

  // ── Strategy & Copy Department ───────────────────────────────────────────────
  {
    id: 'content-strategist',
    name: 'Content Strategist',
    role: 'Lead Content Strategist',
    description:
      'Translates research into content strategies and production briefs for all departments',
    department: 'strategy-copy',
    responsibilities: [
      'Content strategy development',
      'Production brief writing',
      'Editorial calendar planning',
      'Cross-department content coordination',
    ],
    primaryProvider: 'openai',
    fallbackProvider: null,
    capabilities: ['content-strategy', 'text-generation', 'summarization'],
    status: 'not-configured',
    priority: 'high',
  },
  {
    id: 'senior-copywriter',
    name: 'Senior Copywriter',
    role: 'Principal Copywriter',
    description:
      'Writes high-quality, on-brand copy across all formats — long-form, short-form, scripts, ads',
    department: 'strategy-copy',
    responsibilities: [
      'Long-form content creation',
      'Ad copy and video scripts',
      'Brand voice application',
      'Copy editing and refinement',
    ],
    primaryProvider: 'openai',
    fallbackProvider: null,
    capabilities: ['copywriting', 'text-generation', 'content-strategy'],
    status: 'not-configured',
    priority: 'high',
  },

  // ── Video Department ─────────────────────────────────────────────────────────
  {
    id: 'video-producer',
    name: 'Video Producer',
    role: 'Lead Video Producer',
    description: 'Produces AI spokesperson and brand videos using HeyGen',
    department: 'video',
    responsibilities: [
      'Spokesperson video production',
      'Script-to-video execution',
      'Avatar and scene configuration',
      'Video output handoff to QA',
    ],
    primaryProvider: 'heygen',
    fallbackProvider: 'higgsfield',
    capabilities: ['video-generation'],
    status: 'not-configured',
    priority: 'high',
  },
  {
    id: 'creative-video-director',
    name: 'Creative Video Director',
    role: 'Creative Video Director',
    description: 'Directs cinematic and creative video production using Higgsfield',
    department: 'video',
    responsibilities: [
      'Cinematic video production',
      'Creative video direction',
      'Social content creation',
      'Brand video production',
    ],
    primaryProvider: 'higgsfield',
    fallbackProvider: 'heygen',
    capabilities: ['video-generation', 'image-generation'],
    status: 'not-configured',
    priority: 'medium',
  },

  // ── Voice Department ─────────────────────────────────────────────────────────
  {
    id: 'voice-artist',
    name: 'Voice Artist',
    role: 'AI Voice Artist',
    description: 'Produces professional voice audio — narration, voiceovers, and brand audio',
    department: 'voice',
    responsibilities: [
      'Voiceover production for video content',
      'Narration and podcast audio',
      'Brand voice consistency enforcement',
      'Audio handoff to QA',
    ],
    primaryProvider: 'elevenlabs',
    fallbackProvider: null,
    capabilities: ['voice-synthesis', 'audio-generation'],
    status: 'not-configured',
    priority: 'medium',
  },

  // ── Creative Department ──────────────────────────────────────────────────────
  {
    id: 'creative-director',
    name: 'Creative Director',
    role: 'Creative Director',
    description: 'Leads creative visual direction and produces imagery and brand visuals',
    department: 'creative',
    responsibilities: [
      'Creative concept development',
      'Visual asset production',
      'Brand visual consistency',
      'Creative quality standards',
    ],
    primaryProvider: 'higgsfield',
    fallbackProvider: null,
    capabilities: ['image-generation', 'video-generation'],
    status: 'not-configured',
    priority: 'medium',
  },

  // ── Quality Assurance Department ─────────────────────────────────────────────
  {
    id: 'qa-lead',
    name: 'QA Lead',
    role: 'Quality Assurance Lead',
    description:
      'Reviews all outputs for brand alignment, accuracy, tone, and delivery standards before release',
    department: 'quality-assurance',
    responsibilities: [
      'Content quality review across all formats',
      'Brand alignment verification',
      'Accuracy and compliance checking',
      'Delivery standards enforcement',
    ],
    primaryProvider: 'openai',
    fallbackProvider: null,
    capabilities: ['qa-review', 'text-generation', 'summarization'],
    status: 'not-configured',
    priority: 'critical',
  },

  // ── Delivery Department ──────────────────────────────────────────────────────
  {
    id: 'delivery-manager',
    name: 'Delivery Manager',
    role: 'Delivery Operations Manager',
    description:
      'Packages and delivers completed work to customers in their preferred format and channel',
    department: 'delivery',
    responsibilities: [
      'Output packaging and formatting',
      'Customer delivery coordination',
      'Delivery confirmation and tracking',
      'Post-delivery support handoff',
    ],
    primaryProvider: 'openai',
    fallbackProvider: null,
    capabilities: ['text-generation', 'summarization'],
    status: 'not-configured',
    priority: 'high',
  },
]

export function getEmployee(id: string): AIEmployee | undefined {
  return WORKFORCE_REGISTRY.find((e) => e.id === id)
}

export function getEmployeesByDepartment(departmentId: DepartmentId): AIEmployee[] {
  return WORKFORCE_REGISTRY.filter((e) => e.department === departmentId)
}

export function getActiveEmployees(): AIEmployee[] {
  return WORKFORCE_REGISTRY.filter((e) => e.status === 'active')
}
