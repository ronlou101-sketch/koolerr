import { err, ok, PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult } from '@/shared/types'
import { businessBrainService, type IBusinessBrainService } from '@/domains/business-brain'
import { pickDefaultAmbassador } from './library'
import type {
  AssignDefaultBrandAmbassadorInput,
  BrandAmbassadorIdentity,
  BrandAmbassadorLibraryEntry,
} from './types'

/** Business Memory type + source used to persist the Brand Ambassador identity. */
const VISUAL_IDENTITY_TYPE = 'visual_identity' as const
const AMBASSADOR_SOURCE = 'brand-ambassador' as const

/**
 * Brand Ambassador domain service.
 *
 * Owns the persistent, provider-agnostic spokesperson identity for an
 * organization, stored in the Business Brain as a `visual_identity` memory
 * (latest-wins per org, mirroring how `company_identity` is stored/read). This
 * service never touches a render provider — it only reads/writes identity.
 */
export interface IBrandAmbassadorService {
  /** The current Brand Ambassador identity, or null if none is assigned yet. */
  resolveBrandAmbassador(
    organizationId: OrganizationId
  ): Promise<PlatformResult<BrandAmbassadorIdentity | null>>

  /**
   * Assign the organization's default Brand Ambassador (BUILD behavior): a
   * distinct library spokesperson, deterministic and persistent. Idempotent —
   * if an identity already exists, it is returned unchanged.
   */
  assignDefaultBrandAmbassador(
    input: AssignDefaultBrandAmbassadorInput
  ): Promise<PlatformResult<BrandAmbassadorIdentity>>
}

export class BrandAmbassadorService implements IBrandAmbassadorService {
  constructor(private readonly brain: IBusinessBrainService) {}

  async resolveBrandAmbassador(
    organizationId: OrganizationId
  ): Promise<PlatformResult<BrandAmbassadorIdentity | null>> {
    const result = await this.brain.queryMemory({
      organizationId,
      types: [VISUAL_IDENTITY_TYPE],
    })
    if (!result.ok) return result

    // Latest-wins: newest visual_identity memory is the active identity.
    const latest = [...result.value.memories].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0]
    if (!latest) return ok(null)

    return ok(latest.content as unknown as BrandAmbassadorIdentity)
  }

  async assignDefaultBrandAmbassador(
    input: AssignDefaultBrandAmbassadorInput
  ): Promise<PlatformResult<BrandAmbassadorIdentity>> {
    // Idempotent: never create a second identity for an org that already has one.
    const existing = await this.resolveBrandAmbassador(input.organizationId)
    if (!existing.ok) return existing
    if (existing.value) return ok(existing.value)

    const entry = pickDefaultAmbassador(input.organizationId)
    const identity = buildDefaultIdentity(entry, input.ambassadorEmployeeId)

    const stored = await this.brain.storeMemory({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      memory: {
        organizationId: input.organizationId,
        type: VISUAL_IDENTITY_TYPE,
        content: identity as unknown as Record<string, unknown>,
        source: AMBASSADOR_SOURCE,
        relevanceScope: ['all', 'brand', 'creative'],
      },
    })
    if (!stored.ok) return err(stored.error)

    return ok(identity)
  }
}

/** Build a provider-agnostic identity from a library entry for a specific employee. */
function buildDefaultIdentity(
  entry: BrandAmbassadorLibraryEntry,
  ambassadorEmployeeId: AssignDefaultBrandAmbassadorInput['ambassadorEmployeeId']
): BrandAmbassadorIdentity {
  return {
    ambassadorEmployeeId,
    libraryId: entry.id,
    displayName: entry.displayName,
    role: entry.role,
    persona: entry.persona,
    personalityTraits: [...entry.personalityTraits],
    appearance: {
      description: entry.appearanceDescription,
      referenceImageUrls: [],
    },
    voice: { description: entry.voiceDescription },
    branding: {},
    seed: entry.seed,
    source: 'auto-assigned',
    providerRefs: entry.providerRefs ?? {},
  }
}

/** Singleton wired to the Business Brain domain. */
export const brandAmbassadorService: IBrandAmbassadorService = new BrandAmbassadorService(
  businessBrainService
)
