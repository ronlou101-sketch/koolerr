import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'

vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/business-brain', () => ({
  businessBrainService: { storeMemory: vi.fn() },
}))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: { listWorkforces: vi.fn(), triggerEngagementRun: vi.fn() },
}))
vi.mock('@/infrastructure/ai-workforce/pipeline', () => ({ runAIWorkforcePipeline: vi.fn() }))
vi.mock('@/infrastructure/ai-workforce/build-profile', () => ({
  buildBusinessProfileFromMemories: vi.fn(),
}))
vi.mock('@/shared/config/env', () => ({
  env: { platform: { tenantId: vi.fn().mockReturnValue('tenant_test' as TenantId) } },
}))

import { saveBusinessProfile } from './actions'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { createPlatformContext } from '@/shared/context'

const CTX = createPlatformContext({
  tenantId: 'tenant_test' as TenantId,
  organizationId: 'org_test' as OrganizationId,
  actor: { type: 'user', userId: 'user_1' as UserId, sessionId: 'sess_1', role: 'owner' },
  requestId: 'req_1',
})

const VALID_PROFILE = {
  businessName: 'Acme Corp',
  businessCategory: 'Technology',
  industry: 'SaaS',
  location: 'London',
  primaryService: 'Cloud software',
  targetAudience: 'SMBs',
  brandVoice: 'Professional',
}

beforeEach(() => {
  vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
  vi.mocked(businessBrainService.storeMemory).mockResolvedValue({ ok: true, value: {} as never })
})

describe('saveBusinessProfile', () => {
  it('returns not-authenticated when there is no session', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const result = await saveBusinessProfile(VALID_PROFILE)
    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns an error when businessName is empty', async () => {
    const result = await saveBusinessProfile({ ...VALID_PROFILE, businessName: '' })
    expect(result).toEqual({ success: false, error: 'businessName is required' })
  })

  it('returns an error when businessName is whitespace only', async () => {
    const result = await saveBusinessProfile({ ...VALID_PROFILE, businessName: '   ' })
    expect(result).toEqual({ success: false, error: 'businessName is required' })
  })

  it('returns an error when businessCategory is empty', async () => {
    const result = await saveBusinessProfile({ ...VALID_PROFILE, businessCategory: '' })
    expect(result).toEqual({ success: false, error: 'businessCategory is required' })
  })

  it('returns an error when businessCategory is whitespace only', async () => {
    const result = await saveBusinessProfile({ ...VALID_PROFILE, businessCategory: '   ' })
    expect(result).toEqual({ success: false, error: 'businessCategory is required' })
  })

  it('stores the profile and returns success when required fields are present', async () => {
    const result = await saveBusinessProfile(VALID_PROFILE)
    expect(result).toEqual({ success: true })
    expect(businessBrainService.storeMemory).toHaveBeenCalledOnce()
  })

  it('does not require businessGoals or preferredPlatforms to complete Day-1', async () => {
    const result = await saveBusinessProfile(VALID_PROFILE)
    expect(result).toEqual({ success: true })
    expect(businessBrainService.storeMemory).toHaveBeenCalledOnce()
  })

  it('does not widen server required fields beyond businessName and businessCategory', async () => {
    const result = await saveBusinessProfile({
      businessName: 'Acme Corp',
      businessCategory: 'Technology',
      industry: '',
      location: '',
      primaryService: '',
      targetAudience: '',
      brandVoice: '',
    })
    expect(result).toEqual({ success: true })
  })

  it('still persists company_identity with brand voice for kept Day-1 fields', async () => {
    await saveBusinessProfile(VALID_PROFILE)
    expect(businessBrainService.storeMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        memory: expect.objectContaining({
          type: 'company_identity',
          source: 'ai-workforce-wizard',
          content: expect.objectContaining({
            businessName: 'Acme Corp',
            brandVoice: 'Professional',
            primaryService: 'Cloud software',
            targetAudience: 'SMBs',
          }),
        }),
      })
    )
  })

  it('accepts optional strategy and presence fields without requiring them', async () => {
    const result = await saveBusinessProfile({
      ...VALID_PROFILE,
      businessGoals: 'Growth',
      preferredPlatforms: ['linkedin'],
      competitiveAdvantages: 'Speed',
    })
    expect(result).toEqual({ success: true })
  })

  it('returns an error when storeMemory fails', async () => {
    vi.mocked(businessBrainService.storeMemory).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL', message: 'DB error' } as never,
    })
    const result = await saveBusinessProfile(VALID_PROFILE)
    expect(result).toEqual({ success: false, error: 'DB error' })
  })
})
