'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCompanyIdentity, saveBrandVoice, saveProduct } from './actions'

type Step = 'company' | 'brand' | 'product' | 'done'

const STEPS: Step[] = ['company', 'brand', 'product', 'done']
const STEP_LABELS = ['Your Company', 'Brand Voice', 'What You Offer', 'Ready']

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'inspirational', label: 'Inspirational' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('company')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Company step state
  const [description, setDescription] = useState('')
  const [mission, setMission] = useState('')

  // Brand step state
  const [tone, setTone] = useState('professional')
  const [audience, setAudience] = useState('')
  const [guidelines, setGuidelines] = useState('')

  // Product step state
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')

  const stepIndex = STEPS.indexOf(step)

  async function handleCompany(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await saveCompanyIdentity({ description, mission })
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to save')
      return
    }
    setStep('brand')
  }

  async function handleBrand(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await saveBrandVoice({ tone, audience, guidelines })
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to save')
      return
    }
    setStep('product')
  }

  async function handleProduct(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await saveProduct({ name: productName, description: productDescription })
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to save')
      return
    }
    setStep('done')
  }

  function handleSkip() {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Set up your Business Brain</h1>
          {step !== 'done' && (
            <span className="text-sm text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length - 1}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {STEPS.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex - (step === 'done' ? 0 : 1) ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{STEP_LABELS[stepIndex]}</p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Step: Company */}
      {step === 'company' && (
        <form
          onSubmit={handleCompany}
          className="space-y-5 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <h2 className="text-base font-medium text-foreground">Tell us about your company</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your workforce will use this to understand what you do.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              What does your company do?
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="We build project management software for remote engineering teams…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Mission or tagline{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Making remote work feel less remote"
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {/* Step: Brand */}
      {step === 'brand' && (
        <form
          onSubmit={handleBrand}
          className="space-y-5 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <h2 className="text-base font-medium text-foreground">Define your brand voice</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your copywriter will write in this voice.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTone(opt.value)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    tone === opt.value
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
            <label className="block text-sm font-medium text-foreground">Target audience</label>
            <input
              type="text"
              required
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="CTOs and engineering managers at Series A–C startups"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Writing guidelines{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Avoid jargon. Use concrete examples. Always end with a clear CTA."
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading || !audience.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {/* Step: Product */}
      {step === 'product' && (
        <form
          onSubmit={handleProduct}
          className="space-y-5 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <h2 className="text-base font-medium text-foreground">What do you offer?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Add your main product or service so your workforce knows what to write about.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Product or service name
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Relay"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              rows={3}
              required
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="An async standup tool that integrates with GitHub and Jira to surface blockers before your morning sync."
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading || !productName.trim() || !productDescription.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Your workforce is ready</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Business Brain is loaded with context. Your Content Workforce knows your company,
            your voice, and what you offer.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push('/runs')}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start your first run
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
