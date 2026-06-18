import type {
  DigitalEmployeeId,
  EngagementRunId,
  ModelProvider,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'

/**
 * Model Gateway Types
 *
 * All AI model invocations on the platform route through the Model Gateway.
 * No domain invokes a provider directly. Provider-specific code lives
 * exclusively inside this module.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.12 — Model Gateway.
 * See FOUNDATION_001_ARCHITECTURE.md §6 — AI Provider Strategy.
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §10 — Rule 1.
 */

// ---------------------------------------------------------------------------
// Provider adapter interface
// Each supported AI provider implements this interface inside this module.
// No provider-specific type or import ever leaves this module.
// ---------------------------------------------------------------------------

export interface IModelProviderAdapter {
  readonly provider: ModelProvider
  invoke(request: NormalizedModelRequest): Promise<NormalizedModelResponse>
}

// ---------------------------------------------------------------------------
// Normalized request / response
// Internal types that adapters translate to/from provider-specific formats.
// Domains only ever see these types — never provider API types.
// ---------------------------------------------------------------------------

export interface NormalizedModelRequest {
  prompt: string
  model?: string
  maxTokens?: number
  /** System-level context injected by the gateway before forwarding. */
  systemContext?: string
}

export interface NormalizedModelResponse {
  content: string
  model: string
  tokensUsed: number
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Gateway request
// What a domain passes to the gateway. Includes full platform scope for
// audit attribution and entitlement checks.
// ---------------------------------------------------------------------------

export interface GatewayRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  digitalEmployeeId: DigitalEmployeeId
  engagementRunId: EngagementRunId
  prompt: string
  /** Preferred provider. Gateway selects default if omitted. */
  provider?: ModelProvider
  model?: string
  maxTokens?: number
}

export interface GatewayResponse {
  content: string
  provider: ModelProvider
  model: string
  tokensUsed: number
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Gateway interface
// ---------------------------------------------------------------------------

export interface IModelGateway {
  /**
   * Submit an AI invocation request.
   *
   * The gateway is responsible for:
   * - Provider selection and routing
   * - Token accounting and usage event emission
   * - Retry and fallback logic
   * - Response validation
   * - Audit logging of every invocation
   */
  invoke(request: GatewayRequest): Promise<GatewayResponse>

  /** Returns the names of currently registered providers. */
  registeredProviders(): ModelProvider[]
}
