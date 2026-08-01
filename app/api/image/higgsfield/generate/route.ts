import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { creativeDepartment } from '@/domains/ai-workforce/creative'

// Higgsfield polls until the image is ready; Vercel Pro function timeout caps at 5 minutes.
export const maxDuration = 300

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let prompt: string
  let creativeId: string | null = null
  try {
    const body = (await request.json()) as { prompt?: unknown; creativeId?: unknown }
    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    prompt = body.prompt.trim()
    creativeId = typeof body.creativeId === 'string' ? body.creativeId : null
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Render via the single authoritative render path (ADR-025 §2). The department
  // service owns the workforce/run/trust/gateway/store sequence; this route only
  // validates input and maps the result to HTTP.
  const result = await creativeDepartment.renderImage({
    organizationId: ctx.organizationId,
    prompt,
    creativeId,
  })

  if (!result.ok) {
    const status = result.error.code === 'WORKFORCE_NOT_FOUND' ? 404 : 500
    return NextResponse.json({ error: result.error.message }, { status })
  }

  return NextResponse.json({
    imageUrl: result.value.assetUrl,
    deliverableId: result.value.deliverableId,
    engagementRunId: result.value.engagementRunId,
  })
}
