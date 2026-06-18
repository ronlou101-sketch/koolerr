/**
 * Structured Platform Logger
 *
 * Production: emits newline-delimited JSON to stdout for log aggregation.
 * Development: emits readable prefixed messages to the console.
 *
 * Rules (FOUNDATION_002_ENGINEERING_PRINCIPLES.md §2.5 — Logging Philosophy):
 * - Never log secrets, credentials, or API keys.
 * - Never log Business Brain contents in raw form.
 * - Never log personally identifiable information.
 * - Always scope consequential events with tenantId / organizationId.
 * - Use the correct level:
 *     debug  — development diagnostics only
 *     info   — significant business events
 *     warn   — conditions that may indicate a problem
 *     error  — failures that require attention
 */

export interface LogContext {
  tenantId?: string
  organizationId?: string
  userId?: string
  workforceId?: string
  engagementRunId?: string
  [key: string]: unknown
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const consoleMethods: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'production') {
    consoleMethods[level](
      JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    )
  } else {
    const hasContext = context && Object.keys(context).length > 0
    if (hasContext) {
      consoleMethods[level](`[${level.toUpperCase()}] ${message}`, context)
    } else {
      consoleMethods[level](`[${level.toUpperCase()}] ${message}`)
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    log('debug', message, context)
  },
  info(message: string, context?: LogContext): void {
    log('info', message, context)
  },
  warn(message: string, context?: LogContext): void {
    log('warn', message, context)
  },
  error(message: string, context?: LogContext): void {
    log('error', message, context)
  },
}
