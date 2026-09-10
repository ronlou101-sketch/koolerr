import { err, ok, PlatformErrorCode } from '@/shared/types'
import type { Deliverable, PlatformResult } from '@/shared/types'
import type { ChannelConnection } from '@/domains/channels'

/**
 * Pure publish-eligibility decision (Step 3D-2A, Part F). A deliverable is
 * publishable only when it is an APPROVED VIDEO, and the requested channel
 * connection must belong to the SAME organization and be connected. No side
 * effects — this changes no approval semantics; it only decides eligibility.
 */
export function assertPublishable(params: {
  organizationId: string
  channelConnectionId: string
  deliverable: Deliverable | null
  connection: ChannelConnection | null
}): PlatformResult<true> {
  const { organizationId, channelConnectionId, deliverable, connection } = params

  if (!deliverable) {
    return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Deliverable not found' })
  }
  // Org ownership of the deliverable (defense-in-depth; caller already scopes).
  if (deliverable.organizationId !== organizationId) {
    return err({
      code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
      message: 'Deliverable does not belong to this organization',
    })
  }
  if (deliverable.type !== 'video') {
    return err({
      code: PlatformErrorCode.VALIDATION_ERROR,
      message: `Only video deliverables can be published (got '${deliverable.type}')`,
    })
  }
  if (deliverable.status !== 'approved') {
    return err({
      code: PlatformErrorCode.VALIDATION_ERROR,
      message: `Deliverable must be 'approved' to publish (got '${deliverable.status}')`,
    })
  }

  if (!connection) {
    return err({ code: PlatformErrorCode.NOT_FOUND, message: 'YouTube connection not found' })
  }
  if (connection.organizationId !== organizationId) {
    return err({
      code: PlatformErrorCode.TENANT_ISOLATION_VIOLATION,
      message: 'Channel connection does not belong to this organization',
    })
  }
  if (connection.id !== channelConnectionId) {
    return err({
      code: PlatformErrorCode.VALIDATION_ERROR,
      message: 'Channel connection id does not match the organization’s connection',
    })
  }
  if (connection.status !== 'connected') {
    return err({
      code: PlatformErrorCode.UNAUTHORIZED,
      message: `Channel connection is '${connection.status}' — reconnect required`,
    })
  }

  return ok(true)
}
