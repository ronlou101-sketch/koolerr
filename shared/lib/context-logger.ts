import type { PlatformContext } from '@/shared/context'
import { type LogContext, logger } from './logger'

/**
 * Context-Aware Logger
 *
 * Creates a request-scoped logger that automatically includes
 * tenantId, organizationId, and requestId in every log call.
 *
 * Usage:
 *   // At the request boundary, once:
 *   const log = createContextLogger(ctx)
 *
 *   // Throughout the request:
 *   log.info('[DOMAIN] Something happened', { extra: 'field' })
 *   // → includes tenantId, organizationId, requestId automatically
 *
 * Why this exists:
 * The global logger is correct for startup and module-level events where
 * there is no request context. Once a PlatformContext is established, all
 * logging should be bound to that context so every log line carries the
 * tenant attribution required by FOUNDATION_002 §2.5.
 *
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §2.5 — Logging Philosophy.
 * See FOUNDATION_001_ARCHITECTURE.md §8.3 — Tenant Isolation.
 */

export interface ContextLogger {
  debug(message: string, extra?: LogContext): void
  info(message: string, extra?: LogContext): void
  warn(message: string, extra?: LogContext): void
  error(message: string, extra?: LogContext): void
}

/**
 * Create a logger pre-bound to the current request's PlatformContext.
 * Extra fields passed at call time are merged on top of the context fields.
 */
export function createContextLogger(ctx: PlatformContext): ContextLogger {
  const base: LogContext = {
    tenantId: ctx.tenantId,
    organizationId: ctx.organizationId,
    requestId: ctx.requestId,
    ...(ctx.actor.type === 'user'
      ? { userId: ctx.actor.userId }
      : ctx.actor.type === 'api_key'
        ? { apiKeyId: ctx.actor.keyId }
        : { serviceId: ctx.actor.serviceId }),
  }

  return {
    debug(message: string, extra?: LogContext): void {
      logger.debug(message, { ...base, ...extra })
    },
    info(message: string, extra?: LogContext): void {
      logger.info(message, { ...base, ...extra })
    },
    warn(message: string, extra?: LogContext): void {
      logger.warn(message, { ...base, ...extra })
    },
    error(message: string, extra?: LogContext): void {
      logger.error(message, { ...base, ...extra })
    },
  }
}
