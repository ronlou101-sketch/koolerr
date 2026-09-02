/**
 * Customer video-creation building blocks (Step 4A).
 *
 * Pure, code-defined data + validation for the customer-facing "Create a Video"
 * experience: a curated library of video concepts the customer can start from and
 * customize, plus the locked duration model (30/60/90/120s, hard max 120s) that
 * keeps production cost controlled (Step 3). No provider IDs, no cost levers —
 * avatar/voice/model/resolution remain the approved brand defaults.
 */

/** Locked duration presets shown to the customer (seconds). */
export const VIDEO_DURATION_PRESETS = [30, 60, 90, 120] as const
export type VideoDurationSec = (typeof VIDEO_DURATION_PRESETS)[number]

/** Hard maximum spokesperson-video length (Step 3 cost control). */
export const MAX_VIDEO_SECONDS = 120

/** True only for an allowed preset (30/60/90/120). */
export function isValidVideoDuration(seconds: number): seconds is VideoDurationSec {
  return (VIDEO_DURATION_PRESETS as readonly number[]).includes(seconds)
}

/**
 * A curated, provider-agnostic video concept. `starterScript` is an editable
 * spokesperson script the customer can customize — it is NOT auto-rendered; the
 * customer always reviews/edits before submitting for production.
 */
export interface VideoConcept {
  id: string
  /** Short, customer-facing name. */
  title: string
  /** One line describing when to use this concept. */
  description: string
  /** Suggested tone (guidance only; the customer controls the final script). */
  tone: string
  /** A sensible default length for this concept. */
  suggestedDurationSec: VideoDurationSec
  /** Editable starter script with [bracketed] placeholders for the customer to fill in. */
  starterScript: string
}

/** The curated concept library (Step 4A requirement 1). */
export const VIDEO_CONCEPTS: readonly VideoConcept[] = [
  {
    id: 'promotional-offer',
    title: 'Promotional Offer',
    description: 'Announce a limited-time deal or discount and drive sign-ups.',
    tone: 'Energetic and persuasive',
    suggestedDurationSec: 30,
    starterScript:
      "Hi, I'm [name] from [business]. For a limited time, [describe your offer] — that's [key benefit] at [price or discount]. It won't last long, so [call to action, e.g. book today at ...]. We can't wait to help you.",
  },
  {
    id: 'service-introduction',
    title: 'Service Introduction',
    description: 'Introduce a product or service and what makes it worth it.',
    tone: 'Warm and confident',
    suggestedDurationSec: 60,
    starterScript:
      "Hi, I'm [name] from [business]. We help [who you help] [achieve what outcome]. Here's how it works: [briefly explain your service]. What makes us different is [your edge]. If that sounds like what you need, [call to action].",
  },
  {
    id: 'educational-tip',
    title: 'Educational Tip',
    description: 'Share a quick, genuinely useful how-to that builds trust.',
    tone: 'Friendly and helpful',
    suggestedDurationSec: 60,
    starterScript:
      "Here's a quick tip from [business]: [share one specific, useful tip]. The reason it matters is [why it helps]. Try it this week — and if you'd like a hand with [related service], [call to action].",
  },
  {
    id: 'testimonial-style',
    title: 'Customer Success Story',
    description: 'Tell a short before/after story that highlights real results.',
    tone: 'Sincere and reassuring',
    suggestedDurationSec: 60,
    starterScript:
      "One of our customers came to us with [the problem]. Here at [business], we [what you did]. The result? [the outcome / result]. If you're facing something similar, we'd love to help — [call to action].",
  },
  {
    id: 'seasonal-promotion',
    title: 'Seasonal Promotion',
    description: 'Tie your message to a season, holiday, or time-of-year moment.',
    tone: 'Cheerful and timely',
    suggestedDurationSec: 30,
    starterScript:
      "It's [season or holiday], and [business] has something special for you: [describe your seasonal offer]. Whether you're [use case], now's the perfect time. [call to action] before [deadline].",
  },
  {
    id: 'faq-answer',
    title: 'Answer a Common Question',
    description: 'Answer a question customers ask a lot — clearly and simply.',
    tone: 'Clear and approachable',
    suggestedDurationSec: 60,
    starterScript:
      "A question we hear a lot at [business] is: [the question]. The short answer is [your answer]. In practice, that means [a little detail]. If you've been wondering the same thing, [call to action].",
  },
  {
    id: 'social-ad',
    title: 'Social Media Ad',
    description: 'A punchy, scroll-stopping ad built for social feeds.',
    tone: 'Bold and fast-paced',
    suggestedDurationSec: 30,
    starterScript:
      '[Hook — grab attention in one line]. At [business], we [what you do] so you can [benefit]. [One proof point]. [Call to action] — link below.',
  },
]

/** Look up a concept by id (undefined if not curated). */
export function getVideoConcept(id: string): VideoConcept | undefined {
  return VIDEO_CONCEPTS.find((c) => c.id === id)
}
