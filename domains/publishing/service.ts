import { err, ok, PlatformErrorCode } from '@/shared/types'
import type {
  Deliverable,
  DeliverableId,
  OrganizationId,
  PlatformResult,
  PublishJobId,
} from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import { deliverablesService } from '@/domains/deliverables'
import { channelsService, type ChannelConnection, type PublishingChannel } from '@/domains/channels'
import type { IPublishJobsRepository } from './repository'
import { InMemoryPublishJobsRepository } from './in-memory-repository'
import { assertPublishable } from './eligibility'
import {
  publishIdempotencyKey,
  type EnqueuePublishJobInput,
  type PublishJob,
  type PublishResult,
} from './types'

/** Attempt cap before a publish job is terminally failed. */
export const PUBLISH_JOB_MAX_ATTEMPTS = 3

/** Cross-domain lookups, injectable for tests; default to the live singletons. */
export interface PublishJobsDeps {
  getDeliverable: (id: DeliverableId, org: OrganizationId) => Promise<PlatformResult<Deliverable>>
  getConnection: (
    org: OrganizationId,
    channel: PublishingChannel
  ) => Promise<PlatformResult<ChannelConnection | null>>
}

export interface IPublishJobsService {
  /**
   * Enqueue a "publish now" job after checking eligibility (approved video +
   * org-owned connected channel). Idempotent — a duplicate request while a job
   * is active/published returns the existing job (never a duplicate upload).
   */
  enqueue(input: EnqueuePublishJobInput): Promise<PlatformResult<PublishJob>>
  getJob(id: PublishJobId): Promise<PlatformResult<PublishJob | null>>
  claimPending(limit: number): Promise<PlatformResult<PublishJob[]>>
  markProcessing(id: PublishJobId): Promise<PlatformResult<PublishJob | null>>
  /** Persist the resumable-upload session URL + content length (crash-safe recovery). */
  saveUploadSession(
    id: PublishJobId,
    uploadSessionUrl: string,
    uploadContentLength: number
  ): Promise<PlatformResult<void>>
  markPublished(id: PublishJobId, result: PublishResult): Promise<PlatformResult<PublishJob | null>>
  markFailed(
    id: PublishJobId,
    errorCode: string,
    errorMessage: string
  ): Promise<PlatformResult<PublishJob | null>>
}

export class PublishJobsService implements IPublishJobsService {
  private readonly getDeliverable: PublishJobsDeps['getDeliverable']
  private readonly getConnection: PublishJobsDeps['getConnection']

  constructor(
    private readonly repo: IPublishJobsRepository,
    deps?: Partial<PublishJobsDeps>
  ) {
    // Lazy wrappers preserve the live singleton binding (bootstrap swaps repos
    // after module load), while allowing tests to inject fakes.
    this.getDeliverable =
      deps?.getDeliverable ?? ((id, org) => deliverablesService.getDeliverable(id, org))
    this.getConnection =
      deps?.getConnection ?? ((org, channel) => channelsService.getConnection(org, channel))
  }

  async enqueue(input: EnqueuePublishJobInput): Promise<PlatformResult<PublishJob>> {
    try {
      const deliverableResult = await this.getDeliverable(input.deliverableId, input.organizationId)
      const deliverable = deliverableResult.ok ? deliverableResult.value : null

      const connectionResult = await this.getConnection(input.organizationId, 'youtube')
      const connection = connectionResult.ok ? connectionResult.value : null

      const eligible = assertPublishable({
        organizationId: input.organizationId,
        channelConnectionId: input.channelConnectionId,
        deliverable,
        connection,
      })
      if (!eligible.ok) return eligible

      const key = publishIdempotencyKey(
        input.organizationId,
        input.deliverableId,
        input.channelConnectionId
      )
      const job = await this.repo.enqueue(input, key)
      logger.info('[PUBLISH_JOBS] Job enqueued', {
        organizationId: input.organizationId,
        deliverableId: input.deliverableId,
        status: job.status,
      })
      return ok(job)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async getJob(id: PublishJobId): Promise<PlatformResult<PublishJob | null>> {
    try {
      return ok(await this.repo.findById(id))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async claimPending(limit: number): Promise<PlatformResult<PublishJob[]>> {
    try {
      return ok(await this.repo.claimPending(limit))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async markProcessing(id: PublishJobId): Promise<PlatformResult<PublishJob | null>> {
    try {
      return ok(await this.repo.markProcessing(id))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async saveUploadSession(
    id: PublishJobId,
    uploadSessionUrl: string,
    uploadContentLength: number
  ): Promise<PlatformResult<void>> {
    try {
      await this.repo.saveUploadSession(id, uploadSessionUrl, uploadContentLength)
      return ok(undefined)
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async markPublished(
    id: PublishJobId,
    result: PublishResult
  ): Promise<PlatformResult<PublishJob | null>> {
    try {
      return ok(await this.repo.markPublished(id, result))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }

  async markFailed(
    id: PublishJobId,
    errorCode: string,
    errorMessage: string
  ): Promise<PlatformResult<PublishJob | null>> {
    try {
      return ok(await this.repo.markFailed(id, errorCode, errorMessage, PUBLISH_JOB_MAX_ATTEMPTS))
    } catch (e) {
      return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
    }
  }
}

// Singleton — defaults to in-memory; bootstrap swaps in the Supabase repo.
export let publishJobsService: IPublishJobsService = new PublishJobsService(
  new InMemoryPublishJobsRepository()
)

export function _configurePublishJobsRepository(repo: IPublishJobsRepository): void {
  publishJobsService = new PublishJobsService(repo)
}
