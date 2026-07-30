import type { DigitalEmployeeId, OrganizationId, TenantId } from '@/shared/types'

/**
 * Brand Ambassador — the organization's persistent, recognizable spokesperson.
 *
 * The Brand Ambassador is a first-class Digital Employee (it has a row in
 * `digital_employees`) that represents the company itself — across marketing,
 * sales, support, onboarding, and future conversational experiences. Its
 * IDENTITY (persona, appearance, voice, brand assets) lives here, in the
 * Business Brain as a `visual_identity` memory — never on the employee row and
 * never coupled to a render provider.
 *
 * Provider-agnostic by design: the identity is neutral. `providerRefs` is the
 * ONLY provider-specific data — an optional map that render providers (HeyGen,
 * Higgsfield, ElevenLabs, or any future provider) consume to visualize this
 * spokesperson. The Business Brain never imports a provider SDK.
 */

/** Which provider owns each concrete asset. Optional — populated as assets are curated/trained. */
export interface BrandAmbassadorProviderRefs {
  /** HeyGen spokesperson video: avatar + voice ids. */
  heygen?: { avatarId?: string; voiceId?: string }
  /** Higgsfield image character reference (for cross-campaign consistency). */
  higgsfield?: { characterId?: string }
  /** ElevenLabs voice id (voice-over / cloned voice at SCALE). */
  elevenlabs?: { voiceId?: string }
}

/** Optional brand assets attached to the ambassador (logo, colors) — GROW+ uploads. */
export interface BrandAmbassadorBranding {
  logoUrl?: string
  colorPalette?: { primary?: string; secondary?: string; accent?: string }
}

/**
 * How the ambassador was established:
 * - 'auto-assigned'    → BUILD: a distinct default from the library, cannot be changed.
 * - 'library-selected' → GROW: the customer chose a different library ambassador.
 * - 'custom-trained'   → SCALE: a private avatar trained from the owner's likeness.
 */
export type BrandAmbassadorSource = 'auto-assigned' | 'library-selected' | 'custom-trained'

/** The provider-agnostic identity stored as a `visual_identity` Business Memory. */
export interface BrandAmbassadorIdentity {
  /**
   * Stable id for this first-class Digital Employee. Minted at assignment and
   * persisted in the Business Brain — it is NOT a row in the operational
   * Workforce Engine (`digital_employees`). Typed as DigitalEmployeeId so it can
   * attribute rendered deliverables (`attributedTo`) without a workforce row.
   */
  ambassadorId: DigitalEmployeeId
  /** The library entry this identity was seeded from (null once fully custom-trained). */
  libraryId: string | null
  displayName: string
  role: string
  persona: string
  personalityTraits: string[]
  appearance: {
    description: string
    /** Provider-agnostic reference frames (Blob URLs). Empty for a default ambassador. */
    referenceImageUrls: string[]
  }
  voice: {
    description: string
  }
  branding: BrandAmbassadorBranding
  /** Deterministic seed for cross-campaign image consistency. */
  seed: number
  source: BrandAmbassadorSource
  providerRefs: BrandAmbassadorProviderRefs
}

/** A curated, provider-agnostic spokesperson customers can be assigned or choose from. */
export interface BrandAmbassadorLibraryEntry {
  id: string
  displayName: string
  role: string
  persona: string
  personalityTraits: string[]
  appearanceDescription: string
  voiceDescription: string
  seed: number
  previewImageUrl?: string
  /** Optional provider asset mapping — filled as provider assets are curated (Slice 2 / ops). */
  providerRefs?: BrandAmbassadorProviderRefs
}

export interface AssignDefaultBrandAmbassadorInput {
  tenantId: TenantId
  organizationId: OrganizationId
}
