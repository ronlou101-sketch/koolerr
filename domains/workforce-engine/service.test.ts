import { beforeEach, describe, expect, it } from 'vitest'
import { PlatformErrorCode } from '@/shared/types'
import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  Workforce,
  WorkforceId,
} from '@/shared/types'
import { WorkforceEngineService } from './service'
import { InMemoryWorkforceEngineRepository } from './in-memory-repository'
import type { IWorkforceEngineRepository } from './repository'

// ── Fixtures ────────────────────────────────────────────────────────────────

const TENANT = 'tenant_wf' as TenantId
const ORG = 'org_wf' as OrganizationId
const OTHER_ORG = 'org_other' as OrganizationId

function makeService() {
  return new WorkforceEngineService(new InMemoryWorkforceEngineRepository())
}

async function registerBaseWorkforce(
  service: WorkforceEngineService,
  overrides: Partial<Parameters<WorkforceEngineService['registerWorkforce']>[0]> = {}
): Promise<Workforce> {
  const result = await service.registerWorkforce({
    tenantId: TENANT,
    organizationId: ORG,
    name: 'Content Team',
    businessFunction: 'Content Marketing',
    digitalEmployees: [],
    ...overrides,
  })
  if (!result.ok) throw new Error('setup: registerWorkforce failed')
  return result.value
}

const EMPLOYEE_DEF = {
  name: 'Writer',
  role: 'writer',
  responsibilities: ['draft copy'],
  permittedTools: ['openai'],
}

/** A repository whose every method throws — exercises the INTERNAL_ERROR catch paths. */
const throwingRepo: IWorkforceEngineRepository = {
  saveWorkforce: async () => {
    throw new Error('boom')
  },
  findWorkforceById: async () => {
    throw new Error('boom')
  },
  listWorkforcesByOrganization: async () => {
    throw new Error('boom')
  },
  saveDigitalEmployee: async () => {
    throw new Error('boom')
  },
  findDigitalEmployeeById: async () => {
    throw new Error('boom')
  },
  listDigitalEmployeesByWorkforce: async () => {
    throw new Error('boom')
  },
  saveEngagementRun: async () => {
    throw new Error('boom')
  },
  findEngagementRunById: async () => {
    throw new Error('boom')
  },
  listEngagementRunsByOrganization: async () => {
    throw new Error('boom')
  },
}

// ── Workforces ──────────────────────────────────────────────────────────────

describe('WorkforceEngineService — workforces', () => {
  let service: WorkforceEngineService
  beforeEach(() => {
    service = makeService()
  })

  it('registers a workforce with active status and empty goals', async () => {
    const result = await service.registerWorkforce({
      tenantId: TENANT,
      organizationId: ORG,
      name: 'Content Team',
      businessFunction: 'Content Marketing',
      digitalEmployees: [],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toMatch(/^workforce_/)
      expect(result.value.status).toBe('active')
      expect(result.value.goals).toEqual([])
      expect(result.value.businessFunction).toBe('Content Marketing')
    }
  })

  it('registers nested digital employees during workforce registration', async () => {
    const wf = await registerBaseWorkforce(service, { digitalEmployees: [EMPLOYEE_DEF] })
    const employees = await service.listDigitalEmployees(wf.id, ORG)
    expect(employees.ok).toBe(true)
    if (employees.ok) expect(employees.value).toHaveLength(1)
  })

  it('getWorkforce returns the workforce for its owning organization', async () => {
    const wf = await registerBaseWorkforce(service)
    const result = await service.getWorkforce(wf.id, ORG)
    expect(result.ok).toBe(true)
  })

  it('getWorkforce returns NOT_FOUND for an unknown id', async () => {
    const result = await service.getWorkforce('workforce_missing' as WorkforceId, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getWorkforce enforces tenant isolation', async () => {
    const wf = await registerBaseWorkforce(service)
    const result = await service.getWorkforce(wf.id, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })

  it('listWorkforces returns only the organization’s workforces', async () => {
    await registerBaseWorkforce(service)
    await service.registerWorkforce({
      tenantId: TENANT,
      organizationId: OTHER_ORG,
      name: 'Other',
      businessFunction: 'SEO',
      digitalEmployees: [],
    })
    const result = await service.listWorkforces(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })

  it('listWorkforces is empty for an organization with none', async () => {
    const result = await service.listWorkforces(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(0)
  })

  it('registerWorkforce returns INTERNAL_ERROR when the repository throws', async () => {
    const failing = new WorkforceEngineService(throwingRepo)
    const result = await failing.registerWorkforce({
      tenantId: TENANT,
      organizationId: ORG,
      name: 'X',
      businessFunction: 'Y',
      digitalEmployees: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.INTERNAL_ERROR)
  })
})

// ── Digital Employees ─────────────────────────────────────────────────────────

describe('WorkforceEngineService — digital employees', () => {
  let service: WorkforceEngineService
  let workforce: Workforce
  beforeEach(async () => {
    service = makeService()
    workforce = await registerBaseWorkforce(service)
  })

  it('registers a digital employee under a workforce', async () => {
    const result = await service.registerDigitalEmployee({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      ...EMPLOYEE_DEF,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toMatch(/^employee_/)
      expect(result.value.status).toBe('active')
      expect(result.value.workforceId).toBe(workforce.id)
    }
  })

  it('registerDigitalEmployee fails when the workforce does not exist', async () => {
    const result = await service.registerDigitalEmployee({
      tenantId: TENANT,
      workforceId: 'workforce_missing' as WorkforceId,
      organizationId: ORG,
      ...EMPLOYEE_DEF,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getDigitalEmployee returns NOT_FOUND for an unknown id', async () => {
    const result = await service.getDigitalEmployee('employee_missing' as DigitalEmployeeId, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getDigitalEmployee enforces tenant isolation', async () => {
    const created = await service.registerDigitalEmployee({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      ...EMPLOYEE_DEF,
    })
    if (!created.ok) throw new Error('setup failed')
    const result = await service.getDigitalEmployee(created.value.id, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })

  it('listDigitalEmployees fails when the workforce does not exist', async () => {
    const result = await service.listDigitalEmployees('workforce_missing' as WorkforceId, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('listDigitalEmployees returns only that workforce’s employees', async () => {
    await service.registerDigitalEmployee({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      ...EMPLOYEE_DEF,
    })
    const otherWf = await service.registerWorkforce({
      tenantId: TENANT,
      organizationId: ORG,
      name: 'Second',
      businessFunction: 'SEO',
      digitalEmployees: [EMPLOYEE_DEF],
    })
    if (!otherWf.ok) throw new Error('setup failed')
    const result = await service.listDigitalEmployees(workforce.id, ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
  })

  it('updateDigitalEmployee updates responsibilities and status', async () => {
    const created = await service.registerDigitalEmployee({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      ...EMPLOYEE_DEF,
    })
    if (!created.ok) throw new Error('setup failed')
    const result = await service.updateDigitalEmployee({
      tenantId: TENANT,
      digitalEmployeeId: created.value.id,
      organizationId: ORG,
      responsibilities: ['edit copy'],
      status: 'inactive',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.responsibilities).toEqual(['edit copy'])
      expect(result.value.status).toBe('inactive')
    }
  })

  it('updateDigitalEmployee returns NOT_FOUND for an unknown id', async () => {
    const result = await service.updateDigitalEmployee({
      tenantId: TENANT,
      digitalEmployeeId: 'employee_missing' as DigitalEmployeeId,
      organizationId: ORG,
      status: 'inactive',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('updateDigitalEmployee enforces tenant isolation', async () => {
    const created = await service.registerDigitalEmployee({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      ...EMPLOYEE_DEF,
    })
    if (!created.ok) throw new Error('setup failed')
    const result = await service.updateDigitalEmployee({
      tenantId: TENANT,
      digitalEmployeeId: created.value.id,
      organizationId: OTHER_ORG,
      status: 'inactive',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })
})

// ── Engagement Runs ───────────────────────────────────────────────────────────

describe('WorkforceEngineService — engagement runs', () => {
  let service: WorkforceEngineService
  let workforce: Workforce
  beforeEach(async () => {
    service = makeService()
    workforce = await registerBaseWorkforce(service)
  })

  it('triggerEngagementRun creates a pending run with no deliverables', async () => {
    const result = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'Launch campaign',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.id).toMatch(/^run_/)
      expect(result.value.status).toBe('pending')
      expect(result.value.deliverableIds).toEqual([])
      expect(result.value.participantIds).toEqual([])
    }
  })

  it('triggerEngagementRun threads participantIds and parentRunId', async () => {
    const parent = 'run_parent' as EngagementRunId
    const participant = 'employee_1' as DigitalEmployeeId
    const result = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'Child run',
      participantIds: [participant],
      parentRunId: parent,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.participantIds).toEqual([participant])
      expect(result.value.parentRunId).toBe(parent)
    }
  })

  it('triggerEngagementRun fails when the workforce does not exist', async () => {
    const result = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: 'workforce_missing' as WorkforceId,
      organizationId: ORG,
      objective: 'x',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getEngagementRun returns NOT_FOUND for an unknown id', async () => {
    const result = await service.getEngagementRun('run_missing' as EngagementRunId, ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('getEngagementRun enforces tenant isolation', async () => {
    const run = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'x',
    })
    if (!run.ok) throw new Error('setup failed')
    const result = await service.getEngagementRun(run.value.id, OTHER_ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })

  it('listEngagementRuns returns only the organization’s runs', async () => {
    await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'a',
    })
    const result = await service.listEngagementRuns(ORG)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(1)
    const other = await service.listEngagementRuns(OTHER_ORG)
    expect(other.ok).toBe(true)
    if (other.ok) expect(other.value).toHaveLength(0)
  })

  it('updateEngagementRunStatus returns NOT_FOUND for an unknown run', async () => {
    const result = await service.updateEngagementRunStatus({
      tenantId: TENANT,
      id: 'run_missing' as EngagementRunId,
      status: 'running',
      updatedAt: new Date(),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('updateEngagementRunStatus sets startedAt when moving to running', async () => {
    const run = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'x',
    })
    if (!run.ok) throw new Error('setup failed')
    const when = new Date('2026-05-01T00:00:00Z')
    const result = await service.updateEngagementRunStatus({
      tenantId: TENANT,
      id: run.value.id,
      status: 'running',
      updatedAt: when,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.status).toBe('running')
      expect(result.value.startedAt).toEqual(when)
      expect(result.value.completedAt).toBeUndefined()
    }
  })

  it('updateEngagementRunStatus sets completedAt when moving to completed', async () => {
    const run = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'x',
    })
    if (!run.ok) throw new Error('setup failed')
    const when = new Date('2026-06-01T00:00:00Z')
    const result = await service.updateEngagementRunStatus({
      tenantId: TENANT,
      id: run.value.id,
      status: 'completed',
      updatedAt: when,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.completedAt).toEqual(when)
  })

  it('updateEngagementRunStatus sets completedAt when moving to failed', async () => {
    const run = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'x',
    })
    if (!run.ok) throw new Error('setup failed')
    const when = new Date('2026-06-02T00:00:00Z')
    const result = await service.updateEngagementRunStatus({
      tenantId: TENANT,
      id: run.value.id,
      status: 'failed',
      updatedAt: when,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.completedAt).toEqual(when)
  })

  it('updateEngagementRunStatus does not set timestamps for non-terminal, non-running states', async () => {
    const run = await service.triggerEngagementRun({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      objective: 'x',
    })
    if (!run.ok) throw new Error('setup failed')
    const result = await service.updateEngagementRunStatus({
      tenantId: TENANT,
      id: run.value.id,
      status: 'awaiting_approval',
      updatedAt: new Date(),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.startedAt).toBeUndefined()
      expect(result.value.completedAt).toBeUndefined()
    }
  })

  it('listEngagementRuns returns INTERNAL_ERROR when the repository throws', async () => {
    const failing = new WorkforceEngineService(throwingRepo)
    const result = await failing.listEngagementRuns(ORG)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.INTERNAL_ERROR)
  })
})

// ── updateWorkforce ───────────────────────────────────────────────────────────

describe('WorkforceEngineService — updateWorkforce', () => {
  let service: WorkforceEngineService
  let workforce: Workforce
  beforeEach(async () => {
    service = makeService()
    workforce = await registerBaseWorkforce(service)
  })

  it('updates goals, replacing the existing array', async () => {
    const result = await service.updateWorkforce({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      goals: ['grow leads', 'improve SEO'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.goals).toEqual(['grow leads', 'improve SEO'])
  })

  it('updates status', async () => {
    const result = await service.updateWorkforce({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: ORG,
      status: 'inactive',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('inactive')
  })

  it('returns NOT_FOUND for an unknown workforce', async () => {
    const result = await service.updateWorkforce({
      tenantId: TENANT,
      workforceId: 'workforce_missing' as WorkforceId,
      organizationId: ORG,
      status: 'inactive',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('enforces tenant isolation', async () => {
    const result = await service.updateWorkforce({
      tenantId: TENANT,
      workforceId: workforce.id,
      organizationId: OTHER_ORG,
      status: 'inactive',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(PlatformErrorCode.TENANT_ISOLATION_VIOLATION)
  })
})
