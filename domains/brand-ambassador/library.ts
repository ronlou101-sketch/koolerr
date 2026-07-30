import type { BrandAmbassadorLibraryEntry } from './types'

/**
 * Brand Ambassador Library — curated, provider-agnostic spokespeople.
 *
 * Each entry is a persistent identity (name, persona, appearance, voice, seed),
 * independent of any render provider. `providerRefs` is intentionally omitted
 * until concrete provider assets (e.g. a HeyGen avatar) are curated for an entry
 * — we do not invent provider ids. Rendering (a later slice) resolves an entry's
 * identity to whatever provider is used, falling back to platform defaults.
 *
 * BUILD auto-assigns a distinct entry per organization (deterministic, stable).
 * GROW lets the customer choose a different entry. SCALE replaces it with a
 * custom-trained ambassador.
 */
export const BRAND_AMBASSADOR_LIBRARY: readonly BrandAmbassadorLibraryEntry[] = [
  {
    id: 'ava',
    displayName: 'Ava',
    role: 'Brand Ambassador',
    persona: 'Warm, upbeat neighborhood spokesperson who makes the business feel approachable.',
    personalityTraits: ['warm', 'upbeat', 'trustworthy', 'clear'],
    appearanceDescription:
      'Friendly professional in a solid-color polo, soft studio lighting, neutral background.',
    voiceDescription: 'Warm, conversational, mid-pitch with a friendly cadence.',
    seed: 1001,
  },
  {
    id: 'marcus',
    displayName: 'Marcus',
    role: 'Brand Ambassador',
    persona: 'Confident, credible presenter who conveys expertise and reliability.',
    personalityTraits: ['confident', 'credible', 'calm', 'articulate'],
    appearanceDescription:
      'Composed professional in a collared shirt, clean modern office backdrop, even lighting.',
    voiceDescription: 'Steady, assured baritone with measured pacing.',
    seed: 1002,
  },
  {
    id: 'sofia',
    displayName: 'Sofia',
    role: 'Brand Ambassador',
    persona: 'Energetic, modern spokesperson tuned for short-form social video.',
    personalityTraits: ['energetic', 'modern', 'relatable', 'expressive'],
    appearanceDescription:
      'Bright, contemporary look with vibrant lighting suited to vertical social clips.',
    voiceDescription: 'Lively, expressive, quick and engaging.',
    seed: 1003,
  },
  {
    id: 'leo',
    displayName: 'Leo',
    role: 'Brand Ambassador',
    persona: 'Down-to-earth, practical spokesperson for trades and local services.',
    personalityTraits: ['down-to-earth', 'practical', 'sincere', 'friendly'],
    appearanceDescription:
      'Approachable everyday professional, natural lighting, simple real-world setting.',
    voiceDescription: 'Genuine, grounded, unhurried and clear.',
    seed: 1004,
  },
  {
    id: 'nina',
    displayName: 'Nina',
    role: 'Brand Ambassador',
    persona: 'Polished, premium spokesperson for high-end and professional brands.',
    personalityTraits: ['polished', 'elegant', 'precise', 'reassuring'],
    appearanceDescription:
      'Refined professional in tailored attire, soft premium studio lighting, minimal backdrop.',
    voiceDescription: 'Smooth, articulate, calm and confident.',
    seed: 1005,
  },
  {
    id: 'theo',
    displayName: 'Theo',
    role: 'Brand Ambassador',
    persona: 'Bright, helpful explainer spokesperson for onboarding and demos.',
    personalityTraits: ['helpful', 'clear', 'patient', 'optimistic'],
    appearanceDescription:
      'Friendly presenter in casual-professional attire, clean well-lit explainer setting.',
    voiceDescription: 'Clear, friendly, instructional with a positive tone.',
    seed: 1006,
  },
] as const

/** Stable, deterministic string hash (FNV-1a, 32-bit). Same input → same output across processes. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Look up a library entry by id. */
export function getLibraryEntry(id: string): BrandAmbassadorLibraryEntry | undefined {
  return BRAND_AMBASSADOR_LIBRARY.find((e) => e.id === id)
}

/**
 * Deterministically pick a distinct default ambassador for an organization.
 * Stable across processes and re-runs, so an org always resolves to the same
 * default spokesperson (persistent identity).
 */
export function pickDefaultAmbassador(organizationId: string): BrandAmbassadorLibraryEntry {
  const index = hashString(organizationId) % BRAND_AMBASSADOR_LIBRARY.length
  return BRAND_AMBASSADOR_LIBRARY[index]
}
