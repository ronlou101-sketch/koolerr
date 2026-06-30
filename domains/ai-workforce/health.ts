import type {
  WorkforceHealth,
  DepartmentHealth,
  ProviderHealth,
  HealthStatus,
  DepartmentId,
  ProviderId,
} from './types'
import { PROVIDER_REGISTRY } from './providers'
import { WORKFORCE_REGISTRY } from './employees'
import { DEPARTMENT_REGISTRY } from './departments'

function departmentHealth(departmentId: DepartmentId): DepartmentHealth {
  const employees = WORKFORCE_REGISTRY.filter((e) => e.department === departmentId)
  const activeEmployees = employees.filter((e) => e.status === 'active').length

  // Collect all unique provider IDs used by employees in this department
  const providerIdSet = new Set<ProviderId>()
  for (const e of employees) {
    providerIdSet.add(e.primaryProvider)
    if (e.fallbackProvider) providerIdSet.add(e.fallbackProvider)
  }
  const providerIds = [...providerIdSet]
  const configuredCount = providerIds.filter((id) => PROVIDER_REGISTRY[id].configuredInEnv).length
  const totalCount = providerIds.length

  const status: HealthStatus =
    totalCount === 0 || configuredCount === 0
      ? 'not-configured'
      : configuredCount < totalCount
        ? 'degraded'
        : 'healthy'

  const notes =
    status === 'not-configured'
      ? `${totalCount} provider${totalCount === 1 ? '' : 's'} require configuration`
      : `${configuredCount} of ${totalCount} providers configured`

  return {
    departmentId,
    status,
    activeEmployeeCount: activeEmployees,
    totalEmployeeCount: employees.length,
    configuredProviderCount: configuredCount,
    totalProviderCount: totalCount,
    notes,
  }
}

function providerHealth(providerId: ProviderId): ProviderHealth {
  const provider = PROVIDER_REGISTRY[providerId]
  return {
    providerId,
    status: provider.configuredInEnv ? 'healthy' : 'not-configured',
    configured: provider.configuredInEnv,
    notes: provider.configuredInEnv
      ? `${provider.name} active`
      : `${provider.name} — add API credentials to environment variables`,
  }
}

export function getWorkforceHealth(): WorkforceHealth {
  const departmentIds = Object.keys(DEPARTMENT_REGISTRY) as DepartmentId[]
  const providerIds = Object.keys(PROVIDER_REGISTRY) as ProviderId[]

  const departments = departmentIds.map(departmentHealth)
  const providers = providerIds.map(providerHealth)

  const configuredCount = providers.filter((p) => p.configured).length
  const totalCount = providers.length

  const overall: HealthStatus =
    configuredCount === 0 ? 'not-configured' : configuredCount < totalCount ? 'degraded' : 'healthy'

  const blockedBy = providers.filter((p) => !p.configured).map((p) => p.notes)

  return {
    overall,
    departments,
    providers,
    executionQueue: {
      status: 'not-configured',
      queuedJobs: 0,
      processingJobs: 0,
      failedJobs: 0,
    },
    readyForProduction: configuredCount === totalCount,
    blockedBy,
  }
}
