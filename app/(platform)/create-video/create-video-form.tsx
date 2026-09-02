'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Concept {
  id: string
  title: string
  description: string
  tone: string
  suggestedDurationSec: number
  starterScript: string
}

/** Cost-verified catalog options passed from the server (never arbitrary ids). */
interface AvatarOpt {
  avatarId: string
  name: string
  gender: string
  appearance: string
  previewImageUrl?: string
}
interface VoiceOpt {
  voiceId: string
  name: string
  language: string
  gender: string
}

interface Props {
  concepts: Concept[]
  durations: number[]
  avatars: AvatarOpt[]
  voices: VoiceOpt[]
  languages: string[]
  defaultAvatarId: string
  defaultVoiceId: string
  /** Remaining video count; null = unlimited/unknown (never blocks). */
  remainingCount: number | null
  /** Remaining video seconds; null = unlimited/unknown (never blocks). */
  remainingSeconds: number | null
}

type Mode = 'concept' | 'custom' | 'assist'

export function CreateVideoForm({
  concepts,
  durations,
  avatars,
  voices,
  languages,
  defaultAvatarId,
  defaultVoiceId,
  remainingCount,
  remainingSeconds,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('concept')
  const [title, setTitle] = useState('My video')
  const [script, setScript] = useState('')
  const [durationSec, setDurationSec] = useState(60)

  // Spokesperson selection — defaults to the confirmed low-cost Armando + Michael C.
  const defaultVoice = voices.find((v) => v.voiceId === defaultVoiceId)
  const [avatarId, setAvatarId] = useState(defaultAvatarId)
  const [language, setLanguage] = useState(defaultVoice?.language ?? languages[0] ?? 'English')
  const [voiceId, setVoiceId] = useState(defaultVoiceId)
  const voicesForLang = useMemo(
    () => voices.filter((v) => v.language === language),
    [voices, language]
  )

  // Changing language always re-selects the first available voice for that language,
  // so the submitted voiceId is guaranteed to belong to the chosen language.
  function changeLanguage(next: string) {
    setLanguage(next)
    const first = voices.find((v) => v.language === next)
    if (first) setVoiceId(first.voiceId)
  }

  // AI-assist inputs
  const [description, setDescription] = useState('')
  const [tone, setTone] = useState('')
  const [cta, setCta] = useState('')
  const [assistState, setAssistState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [assistError, setAssistError] = useState<string | null>(null)

  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script])

  const outOfVideos = remainingCount !== null && remainingCount <= 0
  const notEnoughSeconds = remainingSeconds !== null && remainingSeconds < durationSec
  const canSubmit = script.trim().length > 0 && !outOfVideos && !notEnoughSeconds

  function applyConcept(c: Concept) {
    setScript(c.starterScript)
    setTitle(c.title)
    setDurationSec(c.suggestedDurationSec)
  }

  async function draftWithAI() {
    if (!description.trim()) return
    setAssistState('loading')
    setAssistError(null)
    try {
      const res = await fetch('/api/video/script/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, targetDurationSec: durationSec, tone, cta }),
      })
      const data = (await res.json()) as { title?: string; script?: string; error?: string }
      if (!res.ok || !data.script) throw new Error(data.error ?? 'Draft failed')
      setScript(data.script)
      if (data.title) setTitle(data.title)
      setAssistState('idle')
    } catch {
      setAssistError("We couldn't draft that script. Try rephrasing your idea.")
      setAssistState('error')
    }
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitState('loading')
    setSubmitError(null)
    try {
      const res = await fetch('/api/video/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, script, targetDurationSec: durationSec, avatarId, voiceId }),
      })
      const data = (await res.json()) as { deliverableId?: string | null; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Video creation failed')
      if (data.deliverableId) {
        router.push(`/deliverables/${data.deliverableId}`)
      } else {
        setSubmitState('idle')
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "We couldn't create your video.")
      setSubmitState('error')
    }
  }

  const tabClass = (m: Mode) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      mode === m
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="space-y-6">
      {/* Remaining allowance */}
      <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {remainingCount === null
          ? 'Create a spokesperson video from your plan.'
          : `You have ${remainingCount} video${remainingCount === 1 ? '' : 's'}${
              remainingSeconds !== null ? ` and ~${Math.floor(remainingSeconds / 60)} minutes` : ''
            } left this billing period.`}
      </div>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabClass('concept')} onClick={() => setMode('concept')}>
          Start from a concept
        </button>
        <button type="button" className={tabClass('custom')} onClick={() => setMode('custom')}>
          Write my own
        </button>
        <button type="button" className={tabClass('assist')} onClick={() => setMode('assist')}>
          Help me write it
        </button>
      </div>

      {/* Concept picker */}
      {mode === 'concept' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {concepts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => applyConcept(c)}
              className="rounded-lg border border-border bg-card p-4 text-left hover:border-ring"
            >
              <div className="text-sm font-medium text-foreground">{c.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {c.tone} · ~{c.suggestedDurationSec}s
              </p>
            </button>
          ))}
        </div>
      )}

      {/* AI-assist */}
      {mode === 'assist' && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <label className="block text-sm font-medium text-foreground">
            Describe the video you want
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Promote our spring cleaning special, friendly tone, mention 20% off and free quotes."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Tone (optional)"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Call to action (optional)"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={draftWithAI}
            disabled={assistState === 'loading' || !description.trim()}
            className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {assistState === 'loading' ? 'Drafting…' : 'Draft my script'}
          </button>
          {assistError && <p className="text-xs text-destructive">{assistError}</p>}
        </div>
      )}

      {/* Duration */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Length</label>
        <div className="flex flex-wrap gap-2">
          {durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDurationSec(d)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                durationSec === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Maximum 120 seconds. Consumes {durationSec}s of your video minutes when produced.
        </p>
      </div>

      {/* Spokesperson (avatar) — only curated, cost-verified options are shown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Spokesperson</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {avatars.map((a) => (
            <button
              key={a.avatarId}
              type="button"
              onClick={() => setAvatarId(a.avatarId)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left ${
                avatarId === a.avatarId
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-ring'
              }`}
            >
              {a.previewImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.previewImageUrl}
                  alt={a.name}
                  className="h-14 w-14 shrink-0 rounded object-cover"
                />
              )}
              <span>
                <span className="block text-sm font-medium text-foreground">{a.name}</span>
                <span className="block text-xs text-muted-foreground">{a.appearance}</span>
                <span className="block text-[11px] capitalize text-muted-foreground">
                  {a.gender}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Language + voice */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Language</label>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Voice</label>
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {voicesForLang.map((v) => (
              <option key={v.voiceId} value={v.voiceId}>
                {v.name} ({v.gender})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title + script editor (review/edit) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Video title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Script <span className="text-muted-foreground">(review and edit before creating)</span>
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={8}
          placeholder="Your spokesperson will say exactly what you write here."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground"
        />
        <p className="text-xs text-muted-foreground">
          {wordCount} words · about {Math.max(1, Math.round(wordCount / 2.5))}s of speech
        </p>
      </div>

      {/* Guards + submit */}
      {outOfVideos && (
        <p className="text-sm text-destructive">
          You’ve used all your videos for this billing period.
        </p>
      )}
      {!outOfVideos && notEnoughSeconds && (
        <p className="text-sm text-destructive">
          Not enough video minutes left for a {durationSec}s video — choose a shorter length.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || submitState === 'loading'}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitState === 'loading' ? 'Creating your video…' : 'Create video'}
        </button>
      </div>
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
    </div>
  )
}
