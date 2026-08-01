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
// Brand identity
//
// Provider-agnostic brand-identity payload injected into a render invocation.
// Carries resolved provider references and visual-consistency hints only —
// never a provider SDK type — so no provider-specific type crosses the gateway
// boundary (ADR-025 §1, §3; FOUNDATION_001 §6.3).
//
// The payload is deliberately optional and additive: an invocation without a
// BrandIdentity behaves exactly as before. Each adapter consumes only the
// fields relevant to its provider and falls back to environment defaults when a
// field is absent (ADR-025 §1). The render path populates this from the
// organization's Brand Ambassador (ADR-024) in a later slice — the gateway does
// not resolve it.
// ---------------------------------------------------------------------------

export interface BrandIdentity {
  /** Resolved spokesperson avatar reference (e.g. HeyGen avatar id). */
  avatarId?: string
  /** Resolved spokesperson voice reference (e.g. HeyGen voice id). */
  voiceId?: string
  /** Reference image URLs, for providers that accept URL-based visual references. */
  referenceImageUrls?: string[]
  /** Deterministic seed for reproducible generation. */
  seed?: number
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
  /**
   * Optional provider-agnostic brand identity. When present, adapters map the
   * fields relevant to their provider; when absent, adapters use env defaults
   * and behavior is unchanged (ADR-025 §1).
   */
  brandIdentity?: BrandIdentity
}

export interface NormalizedModelResponse {
  content: string
  model: string
  tokensUsed: number
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Gateway request / response
// What a domain passes to the gateway. Includes full platform scope for
// Trust Engine enforcement, audit attribution, and billing event emission.
// ---------------------------------------------------------------------------

export interface GatewayRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  digitalEmployeeId: DigitalEmployeeId
  engagementRunId: EngagementRunId
  /**
   * The business action being performed (e.g. 'write_blog_post', 'research_topic').
   * Must match a registered TrustRule action for this Digital Employee.
   * The Trust Engine evaluates this action before the invocation proceeds.
   */
  action: string
  prompt: string
  /** Optional system-level context injected before the user prompt. */
  systemContext?: string
  /** Preferred provider. Gateway selects default if omitted. */
  provider?: ModelProvider
  model?: string
  maxTokens?: number
  /**
   * Optional provider-agnostic brand identity, forwarded verbatim to the
   * provider adapter. Absent → unchanged behavior (ADR-025 §1). The gateway
   * performs no provider-specific handling of this payload; the adapter maps it.
   */
  brandIdentity?: BrandIdentity
}

export interface GatewayResponse {
  content: string
  provider: ModelProvider
  model: string
  tokensUsed: number
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Usage event sink
//
// The Model Gateway emits a usage event after every successful invocation
// (FOUNDATION_001 §4). The sink is registered at startup by the billing
// domain so that shared/ does not import from domains/ directly.
// ---------------------------------------------------------------------------

export interface GatewayUsageData {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  action: string
  provider: ModelProvider
  model: string
  tokensUsed: number
  latencyMs: number
}

/**
 * Implemented by the billing domain and registered at startup via
 * _registerUsageSink(). The Model Gateway holds a reference to this
 * interface only — never to billing's concrete implementation.
 */
export interface IUsageEventSink {
  recordUsage(data: GatewayUsageData): Promise<void>
}

// ---------------------------------------------------------------------------
// Gateway interface
// ---------------------------------------------------------------------------

export interface IModelGateway {
  /**
   * Submit an AI invocation request.
   *
   * The gateway enforces in order:
   * 1. Trust Engine check — rejects if denied or requires_approval
   * 2. Provider dispatch
   * 3. Usage event emission via registered IUsageEventSink
   * 4. Audit logging of every outcome
   *
   * Throws if the Trust Engine denies the action, if no provider is
   * available, or if the provider adapter throws.
   */
  invoke(request: GatewayRequest): Promise<GatewayResponse>

  /** Returns the names of currently registered providers. */
  registeredProviders(): ModelProvider[]
}
