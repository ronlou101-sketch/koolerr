import type { ConsentId, ConsentRecord, OrganizationId, TenantId, UserId } from '@/shared/types'

/**
 * Consent & Rights Ledger Types
 *
 * The Consent & Rights Ledger is the permanent record of every permission,
 * consent, and rights decision made within the platform. It is append-only.
 * Past consents are never erased — they are superseded by updated consents.
 *
 * Customers can always inspect what has been consented to and by whom.
 * This is the foundation of customer trust.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 * See FOUNDATION_004_PRODUCT_PRINCIPLES.md §4 — Trust Before Automation.
 */

// ---------------------------------------------------------------------------
// Consent scope
// Defines the category of action a customer is authorizing.
// Adding a new capability that requires customer consent must add a scope here.
// ---------------------------------------------------------------------------

export type ConsentScope =
  | 'content_creation'
  | 'content_publishing'
  | 'email_sending'
  | 'social_media_posting'
  | 'customer_communication'
  | 'data_export'
  | 'external_api_access'
  | 'autonomous_action'
  | 'business_brain_write'

// ---------------------------------------------------------------------------
// Ledger operations
// ---------------------------------------------------------------------------

export interface ConsentGrantInput {
  tenantId: TenantId
  organizationId: OrganizationId
  grantedBy: UserId
  scope: ConsentScope
  /** The specific action being consented to, e.g. "publish_blog_post". */
  action: string
  /** Optional expiry. Non-expiring consents remain active until explicitly revoked. */
  expiresAt?: Date
}

export interface ConsentRevokeInput {
  tenantId: TenantId
  consentId: ConsentId
  organizationId: OrganizationId
  revokedBy: UserId
}

export interface ConsentFilter {
  organizationId: OrganizationId
  scope?: ConsentScope
  action?: string
  /** When true, returns only active (non-revoked, non-expired) consents. */
  activeOnly?: boolean
}

// ---------------------------------------------------------------------------
// Ledger interface
// ---------------------------------------------------------------------------

export interface IConsentLedger {
  /**
   * Record a new consent grant.
   * Emits a consent.granted audit event.
   */
  grant(input: ConsentGrantInput): Promise<ConsentRecord>

  /**
   * Revoke a previously granted consent.
   * The original record is never deleted — its status is updated to 'revoked'.
   * Emits a consent.revoked audit event.
   */
  revoke(input: ConsentRevokeInput): Promise<ConsentRecord>

  /**
   * Check whether active consent exists for a specific action.
   * Returns the matching record or null if no active consent is found.
   */
  check(organizationId: OrganizationId, action: string): Promise<ConsentRecord | null>

  /**
   * Return the full consent history for an organization.
   * Includes revoked and expired records — the ledger is append-only.
   */
  history(filter: ConsentFilter): Promise<ConsentRecord[]>
}
