import { describe, expect, it } from 'vitest'
import { PlatformErrorCode } from '@/shared/types'
import type { DigitalEmployeeId, WorkforceId } from '@/shared/types'
import {
  OTHER_ORG_ID,
  TEST_ORG_ID,
  TEST_TENANT_ID,
  makeWorkforceEngineService,
  seedDigitalEmployee,
  seedWorkforce,
} from './service.test-helpers'

// ---------------------------------------------------------------------------
// updateWorkforce
// ---------------------------------------------------------------------------

describe('updateWorkforce', () => {
  it('returns NOT_FOUND when workforce does not exist', async () => {
    const { service } = makeWorkforceEngineService()
    const result = await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId: 'workforce_nonexistent' as WorkforceId,
      organizationId: TEST_ORG_ID,
      goals: ['Grow traffic'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('returns TENANT_ISOLATION_VIOLATION when org does not match', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service, TEST_ORG_ID)
    const result = await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: OTHER_ORG_ID,
      goals: ['Grow traffic'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })

  it('replaces goals when goals is provided', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const result = await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: TEST_ORG_ID,
      goals: ['Publish 10 articles per month', 'Increase engagement by 20%'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.goals).toEqual([
        'Publish 10 articles per month',
        'Increase engagement by 20%',
      ])
    }
  })

  it('updates status when status is provided', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const result = await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: TEST_ORG_ID,
      status: 'inactive',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('inactive')
  })

  it('can update goals and status together', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const result = await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: TEST_ORG_ID,
      goals: ['Scale content output'],
      status: 'inactive',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.goals).toEqual(['Scale content output'])
      expect(result.value.status).toBe('inactive')
    }
  })

  it('does not change goals when goals is not provided', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    // First set some goals
    await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: TEST_ORG_ID,
      goals: ['Original goal'],
    })
    // Now update only status
    const result = await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: TEST_ORG_ID,
      status: 'active',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.goals).toEqual(['Original goal'])
  })

  it('persists the update — getWorkforce returns new values', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    await service.updateWorkforce({
      tenantId: TEST_TENANT_ID,
      workforceId,
      organizationId: TEST_ORG_ID,
      goals: ['Persisted goal'],
    })
    const fetched = await service.getWorkforce(workforceId, TEST_ORG_ID)
    expect(fetched.ok).toBe(true)
    if (fetched.ok) expect(fetched.value.goals).toEqual(['Persisted goal'])
  })
})

// ---------------------------------------------------------------------------
// updateDigitalEmployee
// ---------------------------------------------------------------------------

describe('updateDigitalEmployee', () => {
  it('returns NOT_FOUND when digital employee does not exist', async () => {
    const { service } = makeWorkforceEngineService()
    const result = await service.updateDigitalEmployee({
      tenantId: TEST_TENANT_ID,
      digitalEmployeeId: 'employee_nonexistent' as DigitalEmployeeId,
      organizationId: TEST_ORG_ID,
      responsibilities: ['New task'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('returns TENANT_ISOLATION_VIOLATION when org does not match', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const employeeId = await seedDigitalEmployee(service, workforceId)
    const result = await service.updateDigitalEmployee({
      tenantId: TEST_TENANT_ID,
      digitalEmployeeId: employeeId,
      organizationId: OTHER_ORG_ID,
      responsibilities: ['New task'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })

  it('replaces responsibilities when provided', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const employeeId = await seedDigitalEmployee(service, workforceId)
    const result = await service.updateDigitalEmployee({
      tenantId: TEST_TENANT_ID,
      digitalEmployeeId: employeeId,
      organizationId: TEST_ORG_ID,
      responsibilities: ['Write SEO meta descriptions', 'Audit existing content'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.responsibilities).toEqual([
        'Write SEO meta descriptions',
        'Audit existing content',
      ])
    }
  })

  it('updates status when provided', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const employeeId = await seedDigitalEmployee(service, workforceId)
    const result = await service.updateDigitalEmployee({
      tenantId: TEST_TENANT_ID,
      digitalEmployeeId: employeeId,
      organizationId: TEST_ORG_ID,
      status: 'inactive',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('inactive')
  })

  it('does not change responsibilities when not provided', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const employeeId = await seedDigitalEmployee(service, workforceId)
    const result = await service.updateDigitalEmployee({
      tenantId: TEST_TENANT_ID,
      digitalEmployeeId: employeeId,
      organizationId: TEST_ORG_ID,
      status: 'active',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.responsibilities).toEqual(['Draft blog posts', 'Review drafts'])
    }
  })

  it('persists the update — getDigitalEmployee returns new values', async () => {
    const { service } = makeWorkforceEngineService()
    const workforceId = await seedWorkforce(service)
    const employeeId = await seedDigitalEmployee(service, workforceId)
    await service.updateDigitalEmployee({
      tenantId: TEST_TENANT_ID,
      digitalEmployeeId: employeeId,
      organizationId: TEST_ORG_ID,
      responsibilities: ['Persisted responsibility'],
    })
    const fetched = await service.getDigitalEmployee(employeeId, TEST_ORG_ID)
    expect(fetched.ok).toBe(true)
    if (fetched.ok) {
      expect(fetched.value.responsibilities).toEqual(['Persisted responsibility'])
    }
  })
})
