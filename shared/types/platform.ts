/**
 * Platform Primitive Type Definitions
 *
 * Authoritative TypeScript types for every platform primitive defined in
 * FOUNDATION_001_ARCHITECTURE.md §2 — Permanent Platform Primitives.
 *
 * Rules:
 * - No business logic lives here. Types only.
 * - ID types are branded to prevent mixing entity IDs at compile time.
 * - These types are the shared vocabulary of all domains.
 * - Internals of each domain may extend these — never contradict them.
 */

// ---------------------------------------------------------------------------
// Branded ID types
// Prevents accidentally passing an OrganizationId where a TenantId is expected.
// ---------------------------------------------------------------------------

type Branded<T, B extends string> = T & { readonly __brand: B }

export type TenantId = Branded<string, 'TenantId'>
export type OrganizationId = Branded<string, 'OrganizationId'>
export type UserId = Branded<string, 'UserId'>
export type BusinessBrainId = Branded<string, 'BusinessBrainId'>
export type BusinessMemoryId = Branded<string, 'BusinessMemoryId'>
export type WorkforceId = Branded<string, 'WorkforceId'>
export type DigitalEmployeeId = Branded<string, 'DigitalEmployeeId'>
export type EngagementRunId = Branded<string, 'EngagementRunId'>
export type DeliverableId = Branded<string, 'DeliverableId'>
export type ConsentId = Branded<string, 'ConsentId'>
export type UsageEventId = Branded<string, 'UsageEventId'>

// ---------------------------------------------------------------------------
// Tenant
// Top-level account holder. Every piece of platform data belongs to a Tenant.
// Tenant isolation is absolute. See FOUNDATION_001 §8.3.
// ---------------------------------------------------------------------------

export type TenantStatus = 'active' | 'suspended' | 'terminated'

export interface Tenant {
  id: TenantId
  status: TenantStatus
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Organization
// The primary business entity within a Tenant.
// ---------------------------------------------------------------------------

export type OrganizationStatus = 'active' | 'inactive'

export interface Organization {
  id: OrganizationId
  tenantId: TenantId
  name: string
  status: OrganizationStatus
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Business Brain
// Permanent, cumulative memory of an Organization.
// Digital Employees never own memory — everything returns here.
// See FOUNDATION_001 §2.3.
// ---------------------------------------------------------------------------

export interface BusinessBrain {
  id: BusinessBrainId
  organizationId: OrganizationId
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Business Memory
// Individual unit of knowledge stored within the Business Brain.
// See FOUNDATION_001 §2.4.
// ---------------------------------------------------------------------------

export type BusinessMemoryType =
  | 'company_identity'
  | 'brand'
  | 'product'
  | 'service'
  | 'pricing'
  | 'policy'
  | 'sop'
  | 'customer'
  | 'asset'
  | 'knowledge'
  | 'preference'
  | 'decision'

export interface BusinessMemory {
  id: BusinessMemoryId
  businessBrainId: BusinessBrainId
  organizationId: OrganizationId
  type: BusinessMemoryType
  content: Record<string, unknown>
  source: string
  relevanceScope: string[]
  version: number
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Workforce
// A department composed of Digital Employees.
// See FOUNDATION_001 §2.6.
// ---------------------------------------------------------------------------

export type WorkforceStatus = 'active' | 'inactive'

export interface Workforce {
  id: WorkforceId
  organizationId: OrganizationId
  name: string
  businessFunction: string
  status: WorkforceStatus
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Digital Employee
// An AI agent with defined responsibilities, tools, and permission boundaries.
// Never owns memory. See FOUNDATION_001 §2.7.
// ---------------------------------------------------------------------------

export type DigitalEmployeeStatus = 'active' | 'inactive'

export interface DigitalEmployee {
  id: DigitalEmployeeId
  workforceId: WorkforceId
  organizationId: OrganizationId
  name: string
  role: string
  responsibilities: string[]
  permittedTools: string[]
  status: DigitalEmployeeStatus
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Engagement Run
// A discrete unit of work. Every Engagement Run produces a Deliverable.
// See FOUNDATION_001 §2.8.
// ---------------------------------------------------------------------------

export type EngagementRunStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'

export interface EngagementRun {
  id: EngagementRunId
  organizationId: OrganizationId
  workforceId: WorkforceId
  objective: string
  status: EngagementRunStatus
  participantIds: DigitalEmployeeId[]
  deliverableIds: DeliverableId[]
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Deliverable
// The completed output of an Engagement Run. What customers pay for.
// See FOUNDATION_001 §2.9.
// ---------------------------------------------------------------------------

export type DeliverableType =
  | 'blog_post'
  | 'advertisement'
  | 'email'
  | 'proposal'
  | 'report'
  | 'strategy'
  | 'image'
  | 'video'
  | 'hiring_packet'
  | 'customer_response'

export type DeliverableStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published'

export interface Deliverable {
  id: DeliverableId
  organizationId: OrganizationId
  engagementRunId: EngagementRunId
  type: DeliverableType
  title: string
  content: Record<string, unknown>
  status: DeliverableStatus
  version: number
  attributedTo: DigitalEmployeeId[]
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Consent Record
// Append-only record of every customer permission grant.
// See FOUNDATION_001 §2.11.
// ---------------------------------------------------------------------------

export type ConsentStatus = 'active' | 'revoked'

export interface ConsentRecord {
  id: ConsentId
  organizationId: OrganizationId
  grantedBy: UserId
  scope: string
  action: string
  status: ConsentStatus
  grantedAt: Date
  expiresAt?: Date
  revokedAt?: Date
}

// ---------------------------------------------------------------------------
// Trust Rule
// Defines what a Digital Employee may do and at what autonomy level.
// See FOUNDATION_001 §2.10.
// ---------------------------------------------------------------------------

export type AutonomyLevel = 'supervised' | 'semi_autonomous' | 'autonomous'

export interface TrustRule {
  id: string
  organizationId: OrganizationId
  digitalEmployeeId: DigitalEmployeeId
  action: string
  requiresApproval: boolean
  autonomyLevel: AutonomyLevel
}

// ---------------------------------------------------------------------------
// Model Gateway
// Contract types for all AI invocations. No domain invokes a provider directly.
// See FOUNDATION_001 §2.12 and §6.
// ---------------------------------------------------------------------------

export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral'

export interface ModelRequest {
  organizationId: OrganizationId
  workforceId: WorkforceId
  digitalEmployeeId: DigitalEmployeeId
  engagementRunId: EngagementRunId
  prompt: string
  provider?: ModelProvider
  model?: string
  maxTokens?: number
}

export interface ModelResponse {
  content: string
  provider: ModelProvider
  model: string
  tokensUsed: number
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Billing
// Usage tracking and entitlement enforcement per Tenant.
// See FOUNDATION_001 §2.14.
// ---------------------------------------------------------------------------

export type UsageEventType = 'engagement_run' | 'deliverable' | 'model_invocation' | 'storage'

export interface UsageEvent {
  id: UsageEventId
  organizationId: OrganizationId
  type: UsageEventType
  quantity: number
  metadata: Record<string, unknown>
  occurredAt: Date
}
