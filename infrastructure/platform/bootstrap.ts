import {
  _configureBillingRepository,
  billingService,
  createBillingUsageSink,
} from '@/domains/billing'
import { _configureBusinessBrainRepository } from '@/domains/business-brain'
import { _configureDeliverablesRepository } from '@/domains/deliverables'
import { _configureDogfoodingRepository } from '@/domains/dogfooding'
import { SupabaseDogfoodingRepository } from '@/domains/dogfooding/supabase-repository'
import { _configureIdentityRepository } from '@/domains/identity'
import { _configureWorkforceEngineRepository } from '@/domains/workforce-engine'
import { _configureConsentRepository } from '@/shared/consent'
import { _configureAuditLogger, SupabaseAuditLogger } from '@/shared/audit'
import {
  _configureTrustRepository,
  _loadTrustRulesFromRepository,
  SupabaseTrustRuleRepository,
} from '@/shared/trust'
import { _configureApprovalRepository, SupabaseApprovalRepository } from '@/shared/approval'
import {
  _configureOrchestrationRepository,
  SupabaseOrchestrationRepository,
} from '@/shared/orchestration'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'
import { _registerProvider, _registerUsageSink, modelGateway } from '@/shared/model-gateway'
import { AnthropicAdapter } from '@/shared/model-gateway/anthropic-adapter'
import { ManusAdapter } from '@/shared/model-gateway/manus-adapter'
import { OpenAIAdapter } from '@/shared/model-gateway/openai-adapter'
import { HeyGenAdapter } from '@/shared/model-gateway/heygen-adapter'
import { HiggsfieldAdapter } from '@/shared/model-gateway/higgsfield-adapter'
import { ElevenLabsAdapter } from '@/shared/model-gateway/elevenlabs-adapter'
import { logger } from '@/shared/lib/logger'

import { SupabaseBillingRepository } from '@/domains/billing/supabase-repository'
import { SupabaseBusinessBrainRepository } from '@/domains/business-brain/supabase-repository'
import { SupabaseDeliverablesRepository } from '@/domains/deliverables/supabase-repository'
import { SupabaseIdentityRepository } from '@/domains/identity/supabase-repository'
import { SupabaseWorkforceEngineRepository } from '@/domains/workforce-engine/supabase-repository'
import { SupabaseConsentRepository } from '@/shared/consent/supabase-repository'

import type { OrganizationId } from '@/shared/types'

/**
 * Platform Bootstrap
 *
 * The composition root for the Koolerr platform. Wires all cross-cutting
 * singleton integrations and returns a status confirming what was initialized.
 *
 * Must be called once at application startup before the first request is
 * handled. The function is idempotent — calling it more than once is safe
 * and produces only a warning log on subsequent calls.
 *
 * What bootstrap does:
 * 1. Creates the server-side Supabase client (service-role key — bypasses RLS).
 * 2. Instantiates all Supabase repository implementations.
 * 3. Calls _configureXRepository() on each domain to swap the in-memory
 *    fallback with the persisted Supabase implementation.
 * 4. Registers the billing usage sink with the Model Gateway so that every
 *    successful AI invocation automatically records a billing usage event
 *    (FOUNDATION_001 §4 — "The Model Gateway emits usage events to billing").
 *
 * Supabase repositories use the service-role key in this phase. Phase 11
 * (Identity & Authentication) will switch to session-scoped clients so that
 * Row-Level Security is enforced at the database layer.
 *
 * The infrastructure/ layer is the only place that may import from both
 * shared/ and domains/ in the same file. All other layers must respect
 * the shared → domain coupling prohibition.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §1.2 — Modular Monolith Philosophy.
 * See FOUNDATION_001_ARCHITECTURE.md §4 — Data Ownership Rules.
 */

let bootstrapped = false

export interface PlatformBootstrapResult {
  readonly status: 'ok'
  /** True if this call performed initialization; false if already bootstrapped. */
  readonly initialized: boolean
  /** AI providers currently registered with the Model Gateway. */
  readonly registeredProviders: string[]
  readonly usageSinkRegistered: true
  /** True when Supabase repository implementations are active. */
  readonly repositoriesConfigured: boolean
}

export async function bootstrapPlatform(): Promise<PlatformBootstrapResult> {
  if (bootstrapped) {
    logger.warn(
      '[PLATFORM] bootstrapPlatform() called more than once — skipping re-initialization.'
    )
    return {
      status: 'ok',
      initialized: false,
      registeredProviders: modelGateway.registeredProviders(),
      usageSinkRegistered: true,
      repositoriesConfigured: true,
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Create the server-side Supabase client (service-role key).
  //    Phase 11 will switch to session-scoped clients for RLS enforcement.
  // ---------------------------------------------------------------------------
  const supabase = createServerSupabaseClient()

  // ---------------------------------------------------------------------------
  // 2. Wire the consent repository's tenant resolver.
  //    ConsentRecord only carries organizationId, but the DB row needs tenant_id.
  //    This closure queries the organizations table to resolve it at write time.
  // ---------------------------------------------------------------------------
  async function getTenantId(organizationId: OrganizationId): Promise<string> {
    const { data, error } = await supabase
      .from('organizations')
      .select('tenant_id')
      .eq('id', organizationId)
      .single()
    if (error || !data) {
      throw new Error(`[BOOTSTRAP] Could not resolve tenantId for organization ${organizationId}`)
    }
    return (data as { tenant_id: string }).tenant_id
  }

  // ---------------------------------------------------------------------------
  // 3. Configure all domain repositories with Supabase implementations.
  //    Each _configure call replaces the in-memory fallback singleton.
  //    Order matters for the billing sink wiring in step 4 (billing must be
  //    configured before the sink is created so billingService refers to the
  //    Supabase-backed instance).
  // ---------------------------------------------------------------------------
  _configureIdentityRepository(new SupabaseIdentityRepository(supabase))
  _configureBusinessBrainRepository(new SupabaseBusinessBrainRepository(supabase))
  _configureWorkforceEngineRepository(new SupabaseWorkforceEngineRepository(supabase))
  _configureDeliverablesRepository(new SupabaseDeliverablesRepository(supabase))
  _configureBillingRepository(new SupabaseBillingRepository(supabase))
  _configureConsentRepository(new SupabaseConsentRepository(supabase, getTenantId))
  _configureDogfoodingRepository(new SupabaseDogfoodingRepository(supabase))

  // ---------------------------------------------------------------------------
  // 3b. Wire the Supabase Audit Logger.
  //     Replaces the ConsoleAuditLogger stub. All audit events from this point
  //     forward are persisted to the audit_events table.
  // ---------------------------------------------------------------------------
  _configureAuditLogger(new SupabaseAuditLogger(supabase))

  // ---------------------------------------------------------------------------
  // 3b-2. Wire the Orchestration Engine repository.
  //       Workflow state is now durable across server restarts. The engine
  //       uses write-through caching: in-memory for active execution speed,
  //       Supabase as recovery source after process restart.
  // ---------------------------------------------------------------------------
  _configureOrchestrationRepository(new SupabaseOrchestrationRepository(supabase))

  // ---------------------------------------------------------------------------
  // 3c. Wire the Trust Rule repository and load all persisted rules into memory.
  //     Rules registered at provisioning time are persisted to trust_rules.
  //     Reloading here means rules survive server restarts without any per-run
  //     re-registration workaround.
  // ---------------------------------------------------------------------------
  _configureTrustRepository(new SupabaseTrustRuleRepository(supabase))
  await _loadTrustRulesFromRepository()

  // ---------------------------------------------------------------------------
  // 3d. Wire the Approval Workflow repository.
  //     ApprovalRequests are persisted to approval_requests and survive restarts.
  // ---------------------------------------------------------------------------
  _configureApprovalRepository(new SupabaseApprovalRepository(supabase))

  // ---------------------------------------------------------------------------
  // 4. Wire the billing usage sink into the Model Gateway.
  //    Called AFTER _configureBillingRepository() so that billingService
  //    (a live ESM export) already refers to the Supabase-backed instance.
  //    From this point forward, every successful Model Gateway invocation
  //    automatically emits a model_invocation usage event to billing.
  // ---------------------------------------------------------------------------
  const usageSink = createBillingUsageSink(billingService)
  _registerUsageSink(usageSink)

  // ---------------------------------------------------------------------------
  // 5. Register the Anthropic provider adapter.
  //    Only registered when ANTHROPIC_API_KEY is present so that the server
  //    starts cleanly in environments where the key is not yet configured.
  // ---------------------------------------------------------------------------
  if (process.env.ANTHROPIC_API_KEY) {
    _registerProvider(new AnthropicAdapter(), true)
    logger.info('[PLATFORM] Anthropic provider adapter registered')
  } else {
    logger.warn(
      '[PLATFORM] ANTHROPIC_API_KEY not set — Model Gateway has no provider registered. ' +
        'Set ANTHROPIC_API_KEY before triggering Engagement Runs.'
    )
  }

  // ---------------------------------------------------------------------------
  // 5b. Register the Manus provider adapter.
  //     Manus powers the AI Workforce Research Department.
  //     Only registered when MANUS_API_KEY is present.
  // ---------------------------------------------------------------------------
  if (process.env.MANUS_API_KEY) {
    _registerProvider(new ManusAdapter())
    logger.info('[PLATFORM] Manus provider adapter registered')
  } else {
    logger.warn(
      '[PLATFORM] MANUS_API_KEY not set — Manus research provider is not available. ' +
        'Set MANUS_API_KEY to enable the AI Workforce Research Department.'
    )
  }

  // ---------------------------------------------------------------------------
  // 5c. Register the OpenAI provider adapter.
  //     OpenAI powers the AI Workforce Strategy Department (and fallback
  //     paths for Research, QA, and Delivery departments).
  //     Only registered when OPENAI_API_KEY is present.
  // ---------------------------------------------------------------------------
  if (process.env.OPENAI_API_KEY) {
    _registerProvider(new OpenAIAdapter())
    logger.info('[PLATFORM] OpenAI provider adapter registered')
  } else {
    logger.warn(
      '[PLATFORM] OPENAI_API_KEY not set — OpenAI provider is not available. ' +
        'Set OPENAI_API_KEY to enable the AI Workforce Strategy Department.'
    )
  }

  // ---------------------------------------------------------------------------
  // 5d. Register creative / media provider adapters (Phase 4 plug-in points).
  //     These adapters are registered when API keys are present but their
  //     invoke() methods will throw until Phase 4 video generation is wired.
  //     Registration now means bootstrap output already surfaces their status.
  // ---------------------------------------------------------------------------
  if (process.env.HEYGEN_API_KEY) {
    _registerProvider(new HeyGenAdapter())
    logger.info('[PLATFORM] HeyGen provider adapter registered')
  } else {
    logger.warn('[PLATFORM] HEYGEN_API_KEY not set — HeyGen video generation not available.')
  }

  if (process.env.HIGGSFIELD_API_KEY) {
    _registerProvider(new HiggsfieldAdapter())
    logger.info('[PLATFORM] Higgsfield provider adapter registered')
  } else {
    logger.warn(
      '[PLATFORM] HIGGSFIELD_API_KEY not set — Higgsfield creative generation not available.'
    )
  }

  if (process.env.ELEVENLABS_API_KEY) {
    _registerProvider(new ElevenLabsAdapter())
    logger.info('[PLATFORM] ElevenLabs provider adapter registered')
  } else {
    logger.warn('[PLATFORM] ELEVENLABS_API_KEY not set — ElevenLabs voice synthesis not available.')
  }

  bootstrapped = true

  const registeredProviders = modelGateway.registeredProviders()

  logger.info('[PLATFORM] Platform bootstrapped successfully', {
    registeredProviders:
      registeredProviders.length > 0
        ? registeredProviders
        : '(none — register a provider adapter before invoking the Model Gateway)',
    usageSinkRegistered: true,
    repositoriesConfigured: true,
  })

  return {
    status: 'ok',
    initialized: true,
    registeredProviders,
    usageSinkRegistered: true,
    repositoriesConfigured: true,
  }
}

/** Returns true if bootstrapPlatform() has been called. */
export function isPlatformBootstrapped(): boolean {
  return bootstrapped
}
