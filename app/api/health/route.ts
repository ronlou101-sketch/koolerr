import { NextResponse } from 'next/server'
import { env } from '@/shared/config/env'

/**
 * GET /api/health — lightweight liveness / operational readout.
 *
 * For uptime monitors and load balancers. Intentionally unauthenticated and
 * domain-free: it reports only non-sensitive process status (no customer data and
 * no Auth, Billing, Business Brain, or persistence access) and always returns 200.
 * For the deeper "is the platform configured for a customer" check, see
 * GET /api/readiness.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.node.env,
  })
}
