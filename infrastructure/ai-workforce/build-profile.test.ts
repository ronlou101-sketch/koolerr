import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationId } from '@/shared/types'

vi.mock('@/domains/business-brain', () => ({
  businessBrainService: { listAllMemories: vi.fn() },
}))

const ORG = 'org_test' as OrganizationId

function wizardMemory(content: Record<string, unknown>) {
  return {
    source: 'ai-workforce-wizard',
    type: 'company_identity',
    createdAt: new Date('2026-10-01T00:00:00Z'),
    content,
  }
}

describe('buildBusinessProfileFromMemories', () => {
  let listMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const brain = await import('@/domains/business-brain')
    listMock = vi.mocked(brain.businessBrainService.listAllMemories)
  })

  async function build(content: Record<string, unknown>) {
    listMock.mockResolvedValue({ ok: true, value: [wizardMemory(content)] })
    const { buildBusinessProfileFromMemories } = await import('./build-profile')
    return buildBusinessProfileFromMemories(ORG)
  }

  it('resolves allowed platforms from stored preferredPlatforms (canonical, ordered)', async () => {
    const profile = await build({
      businessName: 'Acme',
      location: 'West Palm Beach, FL',
      preferredPlatforms: ['Instagram', 'LinkedIn', 'facebook', 'Twitter'],
    })
    expect(profile?.allowedPlatforms).toEqual(['facebook', 'instagram', 'linkedin'])
    expect(profile?.notes).toContain('Target platforms: Facebook, Instagram, LinkedIn')
    expect(profile?.notes).not.toContain('Twitter')
  })

  it('defaults to Facebook + Instagram when no platforms are stored', async () => {
    const profile = await build({ businessName: 'Acme', location: 'West Palm Beach, FL' })
    expect(profile?.allowedPlatforms).toEqual(['facebook', 'instagram'])
  })

  it('resolves the timezone from a supported service-area location', async () => {
    const profile = await build({ businessName: 'Acme', location: 'West Palm Beach, FL' })
    expect(profile?.timezone).toBe('America/New_York')
  })

  it('sets timezone null (omitted) for an unsupported or missing location', async () => {
    expect((await build({ businessName: 'Acme', location: 'Phoenix, AZ' }))?.timezone).toBeNull()
    expect((await build({ businessName: 'Acme' }))?.timezone).toBeNull()
  })

  it('does not rewrite stored values', async () => {
    const content = {
      businessName: 'Acme',
      location: 'West Palm Beach, FL',
      preferredPlatforms: ['Instagram'],
    }
    const snapshot = structuredClone(content)
    const profile = await build(content)
    expect(content).toEqual(snapshot)
    expect(profile?.location).toBe('West Palm Beach, FL')
  })

  it('returns null when no wizard memory exists', async () => {
    listMock.mockResolvedValue({ ok: true, value: [] })
    const { buildBusinessProfileFromMemories } = await import('./build-profile')
    expect(await buildBusinessProfileFromMemories(ORG)).toBeNull()
  })
})
