import { SUPPORTED_PLATFORMS } from './types'
import type { SupportedPlatform } from './types'

/**
 * Platform resolver — the single source of truth for which platforms a campaign
 * may target (Founder policies 6–11, Architect 586f0159 / a9838a2c).
 *
 * - Canonical IDs are exactly SUPPORTED_PLATFORMS, always returned in that order.
 * - Stored selections are matched case-insensitively, ignoring spaces, hyphens and
 *   underscores, against the canonical IDs plus a fixed alias table.
 * - Unrecognised values (e.g. "X", "Twitter") are discarded; duplicates collapse.
 * - Empty, absent, malformed, or entirely unrecognised selections resolve to
 *   exactly Facebook + Instagram. Partial selections keep only the supported ones.
 * - Saved values are never rewritten — this is a pure read-side normalisation.
 */

/** Fallback when no supported platform is selected. */
export const DEFAULT_PLATFORMS: readonly SupportedPlatform[] = ['facebook', 'instagram']

/** Customer-facing display names for each canonical platform ID. */
export const PLATFORM_DISPLAY_NAMES: Readonly<Record<SupportedPlatform, string>> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  'youtube-shorts': 'YouTube Shorts',
  linkedin: 'LinkedIn',
  'google-business-profile': 'Google Business Profile',
}

/** Normalised key → canonical ID. Keys have spaces, hyphens and underscores removed. */
const PLATFORM_ALIASES: Readonly<Record<string, SupportedPlatform>> = {
  facebook: 'facebook',
  instagram: 'instagram',
  tiktok: 'tiktok',
  linkedin: 'linkedin',
  youtubeshorts: 'youtube-shorts',
  youtube: 'youtube-shorts',
  googlebusinessprofile: 'google-business-profile',
  googlebusiness: 'google-business-profile',
  gbp: 'google-business-profile',
}

function aliasKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '')
}

/** Maps one stored or generated platform value to its canonical ID, or null. */
export function normalizePlatform(value: unknown): SupportedPlatform | null {
  if (typeof value !== 'string') return null
  return PLATFORM_ALIASES[aliasKey(value)] ?? null
}

/**
 * Resolves a stored platform selection into the allowed platform set.
 * Always returns a non-empty list of canonical IDs in canonical order.
 */
export function resolveAllowedPlatforms(raw: unknown): SupportedPlatform[] {
  const selected = new Set<SupportedPlatform>()
  if (Array.isArray(raw)) {
    for (const value of raw) {
      const platform = normalizePlatform(value)
      if (platform) selected.add(platform)
    }
  }
  if (selected.size === 0) return [...DEFAULT_PLATFORMS]
  return SUPPORTED_PLATFORMS.filter((platform) => selected.has(platform))
}

/** Returns the canonical platform for `value` only when it is inside `allowed`. */
export function toAllowedPlatform(
  value: unknown,
  allowed: readonly SupportedPlatform[]
): SupportedPlatform | null {
  const platform = normalizePlatform(value)
  return platform && allowed.includes(platform) ? platform : null
}

/** Filters a list of platform values down to canonical IDs inside `allowed` (deduped, ordered). */
export function filterToAllowedPlatforms(
  values: readonly unknown[],
  allowed: readonly SupportedPlatform[]
): SupportedPlatform[] {
  const kept = new Set<SupportedPlatform>()
  for (const value of values) {
    const platform = toAllowedPlatform(value, allowed)
    if (platform) kept.add(platform)
  }
  return SUPPORTED_PLATFORMS.filter((platform) => kept.has(platform))
}
