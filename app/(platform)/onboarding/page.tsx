'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveBusinessProfile, triggerAIWorkforce, type CustomerProfile } from './actions'

// ── Step definition ─────────────────────────────────────────────────────────

type Step =
  | 'company'
  | 'brand'
  | 'product'
  | 'business-info'
  | 'services'
  | 'audience'
  | 'brand-identity'
  | 'strategy'
  | 'presence'
  | 'review'
  | 'launching'
  | 'done'

const WIZARD_STEPS: Step[] = [
  'business-info',
  'services',
  'audience',
  'brand-identity',
  'strategy',
  'presence',
  'review',
  'launching',
]

const STEP_LABELS: Record<Step, string> = {
  company: 'Your Company',
  brand: 'Brand Voice',
  product: 'What You Offer',
  'business-info': 'Business Info',
  services: 'Services',
  audience: 'Your Audience',
  'brand-identity': 'Brand Identity',
  strategy: 'Strategy',
  presence: 'Online Presence',
  review: 'Review & Launch',
  launching: 'Launching',
  done: 'Ready',
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

const PLATFORM_OPTIONS = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube Shorts', label: 'YouTube Shorts' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Google Business Profile', label: 'Google Business' },
]

// ── CSS class helpers ────────────────────────────────────────────────────────

const inputCls =
  'mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring'

const textareaCls = inputCls

const labelCls = 'block text-sm font-medium text-foreground'

const optionalSpan = <span className="font-normal text-muted-foreground">(optional)</span>

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

  // ── Strategy ───────────────────────────────────────────────────────────────
  const [competitiveAdvantages, setCompetitiveAdvantages] = useState('')
  const [businessGoals, setBusinessGoals] = useState('')

  // ── Online Presence ────────────────────────────────────────────────────────
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // ── Helpers ────────────────────────────────────────────────────────────────

  const wizardStepIndex = WIZARD_STEPS.indexOf(step)
  const isWizardStep = wizardStepIndex >= 0

  function togglePersonality(trait: string) {
    setSelectedPersonality((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    )
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
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
      competitiveAdvantages: competitiveAdvantages.trim() || undefined,
      businessGoals: businessGoals.trim(),
      preferredPlatforms: selectedPlatforms,
      facebookUrl: facebookUrl.trim() || undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      tiktokUrl: tiktokUrl.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      googleBusinessUrl: googleBusinessUrl.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
    }
  }

  async function handleLaunch() {
    setLoading(true)
    setError(null)
    setStep('launching')

    const profile = buildProfile()

    // Save comprehensive profile to Brain
    const saveResult = await saveBusinessProfile(profile)
    if (!saveResult.success) {
      setError(saveResult.error ?? 'Failed to save profile')
      setStep('review')
      setLoading(false)
      return
    }

    // Trigger AI Workforce pipeline
    const triggerResult = await triggerAIWorkforce()
    setLoading(false)

    if (!triggerResult.success) {
      setError(triggerResult.error ?? 'Failed to start AI Workforce')
      setStep('review')
      return
    }

    router.push(
      triggerResult.engagementRunId
        ? `/dashboard?ai_run=${triggerResult.engagementRunId}`
        : '/dashboard'
    )
  }

  // ── Progress bar ───────────────────────────────────────────────────────────

  const wizardTotal = WIZARD_STEPS.filter((s) => s !== 'launching').length

  function ProgressBar() {
    const activeIndex = Math.min(wizardStepIndex, wizardTotal - 1)
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Set up your AI Workforce</h1>
          {isWizardStep && step !== 'launching' && (
            <span className="text-sm text-muted-foreground">
              Step {activeIndex + 1} of {wizardTotal}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: wizardTotal }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= activeIndex - (step === 'review' ? 0 : 0) && step !== 'launching'
                  ? 'bg-primary'
                  : i < activeIndex
                    ? 'bg-primary'
                    : 'bg-muted'
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
    <div className="mx-auto max-w-xl space-y-6">
      <ProgressBar />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* ── Step: Business Info ─────────────────────────────────────────────── */}
      {step === 'business-info' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-medium text-foreground">Tell us about your business</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              This becomes your AI Workforce&apos;s primary brief.
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
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Services ──────────────────────────────────────────────────── */}
      {step === 'services' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
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
            <button
              type="button"
              onClick={() => setStep('business-info')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
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
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Audience ──────────────────────────────────────────────────── */}
      {step === 'audience' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
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
            <button
              type="button"
              onClick={() => setStep('services')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
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
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Brand Identity ────────────────────────────────────────────── */}
      {step === 'brand-identity' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-medium text-foreground">Define your brand</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your copywriter will write in this voice and personality.
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
            <button
              type="button"
              onClick={() => setStep('audience')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={() => {
                setError(null)
                setStep('strategy')
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Strategy ──────────────────────────────────────────────────── */}
      {step === 'strategy' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-medium text-foreground">Your competitive strategy</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your workforce will highlight what makes you the obvious choice.
            </p>
          </div>
          <div>
            <label className={labelCls}>Competitive advantages {optionalSpan}</label>
            <textarea
              rows={3}
              value={competitiveAdvantages}
              onChange={(e) => setCompetitiveAdvantages(e.target.value)}
              className={textareaCls}
              placeholder="Same-day service, upfront pricing, licensed & insured, 5-star Google rating, 20 years local"
            />
          </div>
          <div>
            <label className={labelCls}>Business goals for content</label>
            <textarea
              rows={3}
              required
              value={businessGoals}
              onChange={(e) => setBusinessGoals(e.target.value)}
              className={textareaCls}
              placeholder="Generate more service calls from Facebook and Google. Build trust with homeowners before they need emergency service. Grow seasonal maintenance plan signups."
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('brand-identity')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (!businessGoals.trim()) {
                  setError('Business goals are required')
                  return
                }
                setError(null)
                setStep('presence')
              }}
              disabled={!businessGoals.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Online Presence ───────────────────────────────────────────── */}
      {step === 'presence' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-medium text-foreground">Your online presence</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Choose where you want your AI Workforce to publish content.
            </p>
          </div>
          <div>
            <label className={labelCls}>Preferred platforms</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedPlatforms.includes(p.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedPlatforms.includes('Facebook') && (
              <div>
                <label className={labelCls}>Facebook URL {optionalSpan}</label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className={inputCls}
                  placeholder="facebook.com/yourpage"
                />
              </div>
            )}
            {selectedPlatforms.includes('Instagram') && (
              <div>
                <label className={labelCls}>Instagram URL {optionalSpan}</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className={inputCls}
                  placeholder="instagram.com/yourhandle"
                />
              </div>
            )}
            {selectedPlatforms.includes('TikTok') && (
              <div>
                <label className={labelCls}>TikTok URL {optionalSpan}</label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  className={inputCls}
                  placeholder="tiktok.com/@yourhandle"
                />
              </div>
            )}
            {selectedPlatforms.includes('YouTube Shorts') && (
              <div>
                <label className={labelCls}>YouTube URL {optionalSpan}</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className={inputCls}
                  placeholder="youtube.com/@yourchannel"
                />
              </div>
            )}
            {selectedPlatforms.includes('LinkedIn') && (
              <div>
                <label className={labelCls}>LinkedIn URL {optionalSpan}</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className={inputCls}
                  placeholder="linkedin.com/company/yourcompany"
                />
              </div>
            )}
            {selectedPlatforms.includes('Google Business Profile') && (
              <div>
                <label className={labelCls}>Google Business URL {optionalSpan}</label>
                <input
                  type="url"
                  value={googleBusinessUrl}
                  onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                  className={inputCls}
                  placeholder="g.page/yourpage"
                />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Business email {optionalSpan}</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputCls}
                placeholder="hello@yourbusiness.com"
              />
            </div>
            <div>
              <label className={labelCls}>Business phone {optionalSpan}</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={inputCls}
                placeholder="(602) 555-1234"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Logo URL {optionalSpan}</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className={inputCls}
              placeholder="https://yoursite.com/logo.png"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Direct link to your logo image (PNG or JPG)
            </p>
          </div>
          <div>
            <label className={labelCls}>Anything else for your AI team? {optionalSpan}</label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className={textareaCls}
              placeholder="Avoid mentioning competitors. Always include our phone number. Seasonal promotions run March–May and September–November."
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('strategy')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={() => {
                setError(null)
                setStep('review')
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Review & Launch
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Review & Launch ───────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="text-base font-medium text-foreground">Review your profile</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your AI Workforce will use this to produce content. You can update it later from your
              profile settings.
            </p>
          </div>
          <dl className="divide-y divide-border text-sm">
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
            {competitiveAdvantages && (
              <ReviewRow label="Advantages" value={competitiveAdvantages} />
            )}
            <ReviewRow label="Content goals" value={businessGoals} />
            {selectedPlatforms.length > 0 && (
              <ReviewRow label="Platforms" value={selectedPlatforms.join(', ')} />
            )}
            {contactEmail && <ReviewRow label="Contact email" value={contactEmail} />}
            {contactPhone && <ReviewRow label="Contact phone" value={contactPhone} />}
          </dl>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">
              Ready to launch your AI Workforce?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clicking Launch will save your profile and start your 7-department AI team — Research,
              Strategy, Creative, Video, Publishing, Approval, and Delivery — all working on your
              behalf.
            </p>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('presence')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Starting…' : 'Launch AI Workforce'}
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
          <h2 className="text-lg font-semibold text-foreground">Launching your AI Workforce…</h2>
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
    <div className="flex gap-4 py-2">
      <dt className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-xs text-foreground">{value}</dd>
    </div>
  )
}
