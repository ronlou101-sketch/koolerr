import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import {
  VIDEO_CONCEPTS,
  VIDEO_DURATION_PRESETS,
  VIDEO_AVATARS,
  VIDEO_VOICES,
  DEFAULT_AVATAR_ID,
  DEFAULT_VOICE_ID,
  videoLanguages,
} from '@/domains/ai-workforce/video-production'
import { CreateVideoForm } from './create-video-form'

/**
 * Customer video creation experience (Step 4A). Lets a customer start from a
 * curated concept, write their own script, or have the AI draft one — pick a
 * length (30/60/90/120s), review/edit, and submit for production. Avatar, voice,
 * model, and resolution stay locked to the approved brand defaults (cost control).
 */
export default async function CreateVideoPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [countE, secondsE] = await Promise.all([
    billingService.checkEntitlement({
      organizationId: ctx.organizationId,
      feature: 'spokesperson_video',
      quantityRequested: 1,
    }),
    billingService.checkEntitlement({
      organizationId: ctx.organizationId,
      feature: 'spokesperson_video_seconds',
      quantityRequested: 1,
    }),
  ])

  // null == unlimited/unknown (never block); finite == remaining allowance.
  const remainingCount =
    countE.ok && Number.isFinite(countE.value.limit)
      ? Math.max(0, countE.value.limit - countE.value.used)
      : null
  const remainingSeconds =
    secondsE.ok && Number.isFinite(secondsE.value.limit)
      ? Math.max(0, secondsE.value.limit - secondsE.value.used)
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Create a video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a concept, write your own, or let your team draft it — then choose a spokesperson,
          voice, and language.
        </p>
      </div>

      <CreateVideoForm
        concepts={VIDEO_CONCEPTS.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          tone: c.tone,
          suggestedDurationSec: c.suggestedDurationSec,
          starterScript: c.starterScript,
        }))}
        durations={[...VIDEO_DURATION_PRESETS]}
        avatars={VIDEO_AVATARS.map((a) => ({
          avatarId: a.avatarId,
          name: a.name,
          gender: a.gender,
          appearance: a.appearance,
          previewImageUrl: a.previewImageUrl,
        }))}
        voices={VIDEO_VOICES.map((v) => ({
          voiceId: v.voiceId,
          name: v.name,
          language: v.language,
          gender: v.gender,
        }))}
        languages={videoLanguages()}
        defaultAvatarId={DEFAULT_AVATAR_ID}
        defaultVoiceId={DEFAULT_VOICE_ID}
        remainingCount={remainingCount}
        remainingSeconds={remainingSeconds}
      />
    </div>
  )
}
