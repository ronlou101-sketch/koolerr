'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveBusinessProfile, triggerAIWorkforce, type CustomerProfile } from './actions'

// ── Step definition ─────────────────────────────────────────────────────────
// Architect lock 2ea2c816 — Day-1 required path only. Strategy and Online
// Presence remain on CustomerProfile (optional) so the capability is not
// deleted; they are not required wizard steps.

type Step = 'business-info' | 'services' | 'audience' | 'brand-identity' | 'review' | 'launching'

const WIZARD_STEPS: Step[] = [
  'business-info',
  'services',
  'audience',
  'brand-identity',
  'review',
  'launching',
]

const STEP_LABELS: Record<Step, string> = {
  'business-info': 'Business Info',
  services: 'Services',
  audience: 'Your Audience',
  'brand-identity': 'Brand Identity',
  review: 'Review & Launch',
  launching: 'Launching',
}

const VOICE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
]

const PERSONALITY_OPTIONS = [
  'Trustworthy',
  'Innovative',
  'Caring',
  'Bold',
  'Reliable',
  'Energetic',
  'Sophisticated',
  'Fun',
  'Expert',
  'Approachable',
]

const cardCls = 'space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6'

// ── CSS class helpers ────────────────────────────────────────────────────────

const inputCls =
  'mt-1 block w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring'

const textareaCls = inputCls

const labelCls = 'block text-sm font-medium text-foreground'

const optionalSpan = <span className="font-normal text-muted-foreground">(optional)</span>

const continueBtnCls =
  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'

const backBtnCls = 'text-sm text-muted-foreground hover:text-foreground'

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('business-info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Business Info ──────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')

  // ── Services ───────────────────────────────────────────────────────────────
  const [primaryService, setPrimaryService] = useState('')
  const [additionalServices, setAdditionalServices] = useState('')
  const [serviceArea, setServiceArea] = useState('')

  // ── Audience ───────────────────────────────────────────────────────────────
  const [targetAudience, setTargetAudience] = useState('')
  const [idealCustomer, setIdealCustomer] = useState('')

  // ── Brand Identity ─────────────────────────────────────────────────────────
  const [brandVoice, setBrandVoice] = useState('professional')
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const wizardStepIndex = WIZARD_STEPS.indexOf(step)
  const isWizardStep = wizardStepIndex >= 0

  function togglePersonality(trait: string) {
    setSelectedPersonality((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    )
  }

  function buildProfile(): CustomerProfile {
    return {
      businessName: businessName.trim(),
      businessCategory: businessCategory.trim(),
      industry: industry.trim(),
      location: location.trim(),
      website: website.trim() || undefined,
      primaryService: primaryService.trim(),
      additionalServices: additionalServices.trim() || undefined,
      serviceArea: serviceArea.trim() || undefined,
      targetAudience: targetAudience.trim(),
      idealCustomer: idealCustomer.trim() || undefined,
      brandVoice,
      brandPersonality: selectedPersonality.length > 0 ? selectedPersonality.join(', ') : undefined,
      // Strategy / presence remain on the profile contract (optional). Day-1
      // does not collect them, so they persist as empty rather than required.
      competitiveAdvantages: undefined,
      businessGoals: undefined,
      preferredPlatforms: [],
      facebookUrl: undefined,
      instagramUrl: undefined,
      tiktokUrl: undefined,
      youtubeUrl: undefined,
      linkedinUrl: undefined,
      googleBusinessUrl: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      logoUrl: undefined,
      additionalNotes: undefined,
    }
  }

  async function handleLaunch() {
    setLoading(true)
    setError(null)
    setStep('launching')

    try {
      const profile = buildProfile()

      // Save comprehensive profile to Brain
      const saveResult = await saveBusinessProfile(profile)
      if (!saveResult.success) {
        setError(saveResult.error ?? "We couldn't save your profile. Please try again.")
        setStep('review')
        setLoading(false)
        return
      }

      // Trigger AI Workforce pipeline
      const triggerResult = await triggerAIWorkforce()
      setLoading(false)

      if (!triggerResult.success) {
        setError(triggerResult.error ?? "We couldn't start your marketing team. Please try again.")
        setStep('review')
        return
      }

      router.push(
        triggerResult.engagementRunId
          ? `/dashboard?ai_run=${triggerResult.engagementRunId}`
          : '/dashboard'
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something didn't work on our end. Please try again."
      )
      setStep('review')
      setLoading(false)
    }
  }

  // ── Progress bar ───────────────────────────────────────────────────────────

  const wizardTotal = WIZARD_STEPS.filter((s) => s !== 'launching').length

  function ProgressBar() {
    const activeIndex = Math.min(wizardStepIndex, wizardTotal - 1)
    return (
      <div className="mb-6 min-w-0">
        <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
          <h1 className="min-w-0 text-lg font-semibold text-foreground">
            Set up your Marketing Team
          </h1>
          {isWizardStep && step !== 'launching' && (
            <span className="shrink-0 text-sm text-muted-foreground">
              Step {activeIndex + 1} of {wizardTotal}
            </span>
          )}
        </div>
        <div className="flex min-w-0 gap-1">
          {Array.from({ length: wizardTotal }).map((_, i) => (
            <div
              key={i}
              className={`h-1 min-w-0 flex-1 rounded-full transition-colors ${
                i <= activeIndex && step !== 'launching' ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        {step !== 'launching' && (
          <p className="mt-1 text-xs text-muted-foreground">{STEP_LABELS[step]}</p>
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto min-w-0 max-w-xl space-y-6 overflow-x-hidden">
      <ProgressBar />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* ── Step: Business Info ─────────────────────────────────────────────── */}
      {step === 'business-info' && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-medium text-foreground">Tell us about your business</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              This becomes your marketing team&apos;s primary brief.
            </p>
          </div>
          <div>
            <label className={labelCls}>Business name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputCls}
              placeholder="Sunshine HVAC Services"
            />
          </div>
          <div>
            <label className={labelCls}>Business category</label>
            <input
              type="text"
              required
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className={inputCls}
              placeholder="HVAC repair & installation"
            />
          </div>
          <div>
            <label className={labelCls}>Industry / niche</label>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputCls}
              placeholder="Home services / trades"
            />
          </div>
          <div>
            <label className={labelCls}>City & state</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputCls}
              placeholder="Phoenix, AZ"
            />
          </div>
          <div>
            <label className={labelCls}>Website {optionalSpan}</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputCls}
              placeholder="https://sunshinehvac.com"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (
                  !businessName.trim() ||
                  !businessCategory.trim() ||
                  !industry.trim() ||
                  !location.trim()
                ) {
                  setError('Please fill in all required fields')
                  return
                }
                setError(null)
                setStep('services')
              }}
              disabled={
                !businessName.trim() ||
                !businessCategory.trim() ||
                !industry.trim() ||
                !location.trim()
              }
              className={continueBtnCls}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Services ──────────────────────────────────────────────────── */}
      {step === 'services' && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-medium text-foreground">What do you offer?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your workforce will write content around these services.
            </p>
          </div>
          <div>
            <label className={labelCls}>Primary service</label>
            <input
              type="text"
              required
              value={primaryService}
              onChange={(e) => setPrimaryService(e.target.value)}
              className={inputCls}
              placeholder="AC repair & tune-up"
            />
          </div>
          <div>
            <label className={labelCls}>Additional services {optionalSpan}</label>
            <textarea
              rows={2}
              value={additionalServices}
              onChange={(e) => setAdditionalServices(e.target.value)}
              className={textareaCls}
              placeholder="Furnace installation, duct cleaning, smart thermostat setup"
            />
          </div>
          <div>
            <label className={labelCls}>Service area {optionalSpan}</label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              className={inputCls}
              placeholder="Greater Phoenix metro area — Scottsdale, Tempe, Mesa"
            />
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('business-info')} className={backBtnCls}>
              Back
            </button>
            <button
              onClick={() => {
                if (!primaryService.trim()) {
                  setError('Primary service is required')
                  return
                }
                setError(null)
                setStep('audience')
              }}
              disabled={!primaryService.trim()}
              className={continueBtnCls}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Audience ──────────────────────────────────────────────────── */}
      {step === 'audience' && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-medium text-foreground">Who do you serve?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your workforce will tailor every piece of content to reach these people.
            </p>
          </div>
          <div>
            <label className={labelCls}>Target audience</label>
            <input
              type="text"
              required
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className={inputCls}
              placeholder="Homeowners aged 35–65 in Phoenix who value reliability"
            />
          </div>
          <div>
            <label className={labelCls}>Ideal customer description {optionalSpan}</label>
            <textarea
              rows={3}
              value={idealCustomer}
              onChange={(e) => setIdealCustomer(e.target.value)}
              className={textareaCls}
              placeholder="A homeowner who's had bad experiences with unreliable contractors. They want clear pricing, on-time service, and someone who explains the problem before fixing it."
            />
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('services')} className={backBtnCls}>
              Back
            </button>
            <button
              onClick={() => {
                if (!targetAudience.trim()) {
                  setError('Target audience is required')
                  return
                }
                setError(null)
                setStep('brand-identity')
              }}
              disabled={!targetAudience.trim()}
              className={continueBtnCls}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Brand Identity ────────────────────────────────────────────── */}
      {step === 'brand-identity' && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-medium text-foreground">Define your brand</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your marketing team will write in this voice and personality.
            </p>
          </div>
          <div>
            <label className={labelCls}>Brand voice</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VOICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBrandVoice(opt.value)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    brandVoice === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Brand personality {optionalSpan}</label>
            <p className="mb-2 mt-0.5 text-xs text-muted-foreground">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => togglePersonality(trait)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedPersonality.includes(trait)
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('audience')} className={backBtnCls}>
              Back
            </button>
            <button
              onClick={() => {
                setError(null)
                setStep('review')
              }}
              className={continueBtnCls}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Review & Launch ───────────────────────────────────────────── */}
      {step === 'review' && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-medium text-foreground">Review your profile</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your marketing team will use this to produce content. You can update it later from
              your profile settings.
            </p>
          </div>
          <dl className="min-w-0 divide-y divide-border text-sm">
            <ReviewRow label="Business" value={`${businessName} — ${businessCategory}`} />
            <ReviewRow label="Industry" value={industry} />
            <ReviewRow label="Location" value={location} />
            {website && <ReviewRow label="Website" value={website} />}
            <ReviewRow label="Primary service" value={primaryService} />
            {additionalServices && <ReviewRow label="Other services" value={additionalServices} />}
            {serviceArea && <ReviewRow label="Service area" value={serviceArea} />}
            <ReviewRow label="Target audience" value={targetAudience} />
            {idealCustomer && <ReviewRow label="Ideal customer" value={idealCustomer} />}
            <ReviewRow label="Brand voice" value={brandVoice} />
            {selectedPersonality.length > 0 && (
              <ReviewRow label="Brand personality" value={selectedPersonality.join(', ')} />
            )}
          </dl>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">
              Ready to launch your marketing team?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clicking Launch will save your profile and put your marketing team to work on your
              behalf.
            </p>
          </div>
          <div className="flex justify-between gap-3">
            <button type="button" onClick={() => setStep('brand-identity')} className={backBtnCls}>
              Back
            </button>
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Starting…' : 'Launch Marketing Team'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Launching ─────────────────────────────────────────────────── */}
      {step === 'launching' && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Getting your marketing team started…
          </h2>
          <p className="text-sm text-muted-foreground">
            Saving your business profile and dispatching your team. You&apos;ll be redirected to
            your dashboard where you can watch the pipeline run in real time.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Review row helper ────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-4 py-2">
      <dt className="w-28 shrink-0 text-xs font-medium text-muted-foreground sm:w-32">{label}</dt>
      <dd className="min-w-0 break-words text-xs text-foreground">{value}</dd>
    </div>
  )
}
