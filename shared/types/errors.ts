import type { Result } from './result'

/**
 * Platform-level error codes.
 *
 * Each code maps to a specific failure category within the platform.
 * All domain services return PlatformError on failure — never raw Error objects.
 */
export const PlatformErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TENANT_ISOLATION_VIOLATION: 'TENANT_ISOLATION_VIOLATION',
  TRUST_ENGINE_REJECTION: 'TRUST_ENGINE_REJECTION',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  MODEL_GATEWAY_ERROR: 'MODEL_GATEWAY_ERROR',
  ORCHESTRATION_ERROR: 'ORCHESTRATION_ERROR',
  BILLING_ERROR: 'BILLING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type PlatformErrorCode = (typeof PlatformErrorCode)[keyof typeof PlatformErrorCode]

export interface PlatformError {
  code: PlatformErrorCode
  message: string
  context?: Record<string, unknown>
}

/** Convenience alias: Result with a PlatformError on the failure path. */
export type PlatformResult<T> = Result<T, PlatformError>
