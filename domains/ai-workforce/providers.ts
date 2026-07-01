import type { Provider, ProviderId, DepartmentId } from './types'

export const PROVIDER_REGISTRY: Record<ProviderId, Provider> = {
  manus: {
    id: 'manus',
    name: 'Manus',
    description:
      'Autonomous research agent for deep market research, competitive analysis, and strategic synthesis',
    departments: ['research', 'strategy-copy'],
    capabilities: [
      'deep-research',
      'web-search',
      'data-analysis',
      'summarization',
      'content-strategy',
    ],
    // Derived at module load time so health checks reflect actual env state.
    status: process.env.MANUS_API_KEY ? 'active' : 'not-configured',
    supportedTasks: [
      'market-research',
      'competitive-analysis',
      'content-brief',
      'trend-analysis',
      'customer-insight-synthesis',
    ],
    configuredInEnv: !!process.env.MANUS_API_KEY,
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Language model for strategy, copywriting, QA review, and analysis',
    departments: ['research', 'strategy-copy', 'quality-assurance', 'delivery'],
    capabilities: [
      'text-generation',
      'copywriting',
      'content-strategy',
      'qa-review',
      'summarization',
      'code-generation',
    ],
    // Derived at module load time so health checks reflect actual env state.
    status: process.env.OPENAI_API_KEY ? 'active' : 'not-configured',
    supportedTasks: [
      'content-strategy',
      'copy-generation',
      'qa-review',
      'brief-synthesis',
      'editorial-review',
    ],
    configuredInEnv: !!process.env.OPENAI_API_KEY,
  },

  heygen: {
    id: 'heygen',
    name: 'HeyGen',
    description:
      'AI spokesperson video generation — produces on-brand video content with AI avatars',
    departments: ['video'],
    capabilities: ['video-generation'],
    // Derived at module load time so health checks reflect actual env state.
    status: process.env.HEYGEN_API_KEY ? 'active' : 'not-configured',
    supportedTasks: ['spokesperson-video', 'product-explainer', 'marketing-video', 'avatar-video'],
    configuredInEnv: !!process.env.HEYGEN_API_KEY,
  },

  higgsfield: {
    id: 'higgsfield',
    name: 'Higgsfield',
    description: 'AI creative video production — cinematic and brand video generation',
    departments: ['video', 'creative'],
    capabilities: ['video-generation', 'image-generation'],
    // Derived at module load time so health checks reflect actual env state.
    status: process.env.HIGGSFIELD_API_KEY ? 'active' : 'not-configured',
    supportedTasks: ['cinematic-video', 'creative-video', 'brand-video', 'social-content'],
    configuredInEnv: !!process.env.HIGGSFIELD_API_KEY,
  },

  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice synthesis — human-quality voice audio for any content format',
    departments: ['voice'],
    capabilities: ['voice-synthesis', 'audio-generation'],
    // Derived at module load time so health checks reflect actual env state.
    status: process.env.ELEVENLABS_API_KEY ? 'active' : 'not-configured',
    supportedTasks: ['voiceover', 'narration', 'podcast-audio', 'video-voiceover', 'brand-voice'],
    configuredInEnv: !!process.env.ELEVENLABS_API_KEY,
  },
}

export function getProvider(id: ProviderId): Provider {
  return PROVIDER_REGISTRY[id]
}

export function getProvidersByDepartment(departmentId: DepartmentId): Provider[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.departments.includes(departmentId))
}

export function getActiveProviders(): Provider[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.status === 'active')
}

export function getConfiguredProviders(): Provider[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.configuredInEnv)
}
