/**
 * Validated ID factories.
 *
 * Each factory validates that the raw string is non-empty before branding it.
 * The cast inside each factory is intentional and justified — it is the ONE
 * authorised location where a plain string becomes a branded ID type.
 *
 * Use these at system boundaries (form data, route params, external API
 * payloads) where TypeScript cannot prove the value's type. Do NOT use
 * them to silence legitimate type errors inside domain logic.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2 — Permanent Platform Primitives.
 */

import type {
  BusinessBrainId,
  DeliverableId,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  UserId,
  WorkforceId,
} from './platform'

export function asTenantId(raw: string): TenantId {
  if (!raw) throw new Error('TenantId must be a non-empty string')
  return raw as TenantId
}

export function asOrganizationId(raw: string): OrganizationId {
  if (!raw) throw new Error('OrganizationId must be a non-empty string')
  return raw as OrganizationId
}

export function asUserId(raw: string): UserId {
  if (!raw) throw new Error('UserId must be a non-empty string')
  return raw as UserId
}

export function asWorkforceId(raw: string): WorkforceId {
  if (!raw) throw new Error('WorkforceId must be a non-empty string')
  return raw as WorkforceId
}

export function asDigitalEmployeeId(raw: string): DigitalEmployeeId {
  if (!raw) throw new Error('DigitalEmployeeId must be a non-empty string')
  return raw as DigitalEmployeeId
}

export function asEngagementRunId(raw: string): EngagementRunId {
  if (!raw) throw new Error('EngagementRunId must be a non-empty string')
  return raw as EngagementRunId
}

export function asDeliverableId(raw: string): DeliverableId {
  if (!raw) throw new Error('DeliverableId must be a non-empty string')
  return raw as DeliverableId
}

export function asBusinessBrainId(raw: string): BusinessBrainId {
  if (!raw) throw new Error('BusinessBrainId must be a non-empty string')
  return raw as BusinessBrainId
}
