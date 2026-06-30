import type { Department, DepartmentId } from './types'

export const DEPARTMENT_REGISTRY: Record<DepartmentId, Department> = {
  research: {
    id: 'research',
    name: 'Research Department',
    description:
      'Gathers market intelligence, performs competitive analysis, and synthesizes insights for every engagement',
    mission:
      'Ensure every piece of content is grounded in accurate, current, and strategic intelligence',
    pipelinePosition: 1,
    inputFrom: [],
    outputTo: ['strategy-copy'],
  },

  'strategy-copy': {
    id: 'strategy-copy',
    name: 'Strategy & Copy Department',
    description:
      'Transforms research into strategic frameworks and high-quality written content across all formats',
    mission: 'Produce compelling, on-brand content that drives customer action',
    pipelinePosition: 2,
    inputFrom: ['research'],
    outputTo: ['video', 'voice', 'creative', 'quality-assurance'],
  },

  video: {
    id: 'video',
    name: 'Video Department',
    description:
      'Produces AI-generated video content — spokesperson videos, cinematic formats, and social content',
    mission: 'Create video that performs and represents every brand with excellence',
    pipelinePosition: 3,
    inputFrom: ['strategy-copy'],
    outputTo: ['quality-assurance'],
  },

  voice: {
    id: 'voice',
    name: 'Voice Department',
    description:
      'Generates professional voice audio — narration, voiceovers, and branded audio content',
    mission: 'Give every brand a consistent, professional voice',
    pipelinePosition: 3,
    inputFrom: ['strategy-copy'],
    outputTo: ['quality-assurance'],
  },

  creative: {
    id: 'creative',
    name: 'Creative Department',
    description:
      'Produces creative and visual assets — imagery, brand visuals, and creative direction',
    mission: 'Elevate every engagement with creative that stops the scroll',
    pipelinePosition: 3,
    inputFrom: ['strategy-copy'],
    outputTo: ['quality-assurance'],
  },

  'quality-assurance': {
    id: 'quality-assurance',
    name: 'Quality Assurance Department',
    description:
      'Reviews all outputs for brand alignment, accuracy, tone, and delivery standards before release',
    mission: 'Nothing ships that does not meet the standard',
    pipelinePosition: 4,
    inputFrom: ['strategy-copy', 'video', 'voice', 'creative'],
    outputTo: ['delivery'],
  },

  delivery: {
    id: 'delivery',
    name: 'Delivery Department',
    description:
      'Packages, formats, and delivers final outputs to customers through their preferred channels',
    mission: 'Deliver work in the exact format, timing, and channel the customer expects',
    pipelinePosition: 5,
    inputFrom: ['quality-assurance'],
    outputTo: [],
  },
}

export function getDepartment(id: DepartmentId): Department {
  return DEPARTMENT_REGISTRY[id]
}

export function getDepartmentsInOrder(): Department[] {
  return Object.values(DEPARTMENT_REGISTRY).sort((a, b) => a.pipelinePosition - b.pipelinePosition)
}
