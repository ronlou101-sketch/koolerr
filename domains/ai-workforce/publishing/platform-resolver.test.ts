import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLATFORMS,
  PLATFORM_DISPLAY_NAMES,
  filterToAllowedPlatforms,
  normalizePlatform,
  resolveAllowedPlatforms,
  toAllowedPlatform,
} from './platform-resolver'
import { SUPPORTED_PLATFORMS } from './types'

describe('platform resolver', () => {
  it('maps canonical IDs and aliases to canonical IDs', () => {
    expect(normalizePlatform('facebook')).toBe('facebook')
    expect(normalizePlatform('Facebook')).toBe('facebook')
    expect(normalizePlatform('Instagram')).toBe('instagram')
    expect(normalizePlatform('Tik Tok')).toBe('tiktok')
    expect(normalizePlatform('YouTube Shorts')).toBe('youtube-shorts')
    expect(normalizePlatform('youtube')).toBe('youtube-shorts')
    expect(normalizePlatform('youtube_shorts')).toBe('youtube-shorts')
    expect(normalizePlatform('LinkedIn')).toBe('linkedin')
    expect(normalizePlatform('Google Business Profile')).toBe('google-business-profile')
    expect(normalizePlatform('GBP')).toBe('google-business-profile')
  })

  it('returns null for unrecognized or non-string values', () => {
    expect(normalizePlatform('twitter')).toBeNull()
    expect(normalizePlatform('')).toBeNull()
    expect(normalizePlatform(42)).toBeNull()
    expect(normalizePlatform(null)).toBeNull()
  })

  it('dedupes and returns the fixed canonical order', () => {
    expect(resolveAllowedPlatforms(['LinkedIn', 'instagram', 'Facebook', 'facebook'])).toEqual([
      'facebook',
      'instagram',
      'linkedin',
    ])
  })

  it('drops unrecognized entries but keeps recognized ones', () => {
    expect(resolveAllowedPlatforms(['Twitter', 'TikTok'])).toEqual(['tiktok'])
  })

  it('defaults to Facebook + Instagram for missing, empty, or all-unrecognized input', () => {
    expect(resolveAllowedPlatforms(undefined)).toEqual(['facebook', 'instagram'])
    expect(resolveAllowedPlatforms([])).toEqual(['facebook', 'instagram'])
    expect(resolveAllowedPlatforms(['Twitter', 'Threads'])).toEqual(['facebook', 'instagram'])
    expect(resolveAllowedPlatforms('facebook')).toEqual(['facebook', 'instagram'])
  })

  it('returns a fresh copy of the default (callers cannot mutate it)', () => {
    const a = resolveAllowedPlatforms(undefined)
    a.push('tiktok')
    expect(resolveAllowedPlatforms(undefined)).toEqual(['facebook', 'instagram'])
    expect(DEFAULT_PLATFORMS).toEqual(['facebook', 'instagram'])
  })

  it('accepts a value only when it resolves into the allowed set', () => {
    expect(toAllowedPlatform('Instagram', ['facebook', 'instagram'])).toBe('instagram')
    expect(toAllowedPlatform('tiktok', ['facebook', 'instagram'])).toBeNull()
    expect(toAllowedPlatform('nonsense', ['facebook'])).toBeNull()
  })

  it('filters a list to the allowed set, deduped, in canonical order, adding nothing', () => {
    expect(
      filterToAllowedPlatforms(
        ['tiktok', 'Instagram', 'facebook', 'instagram'],
        ['facebook', 'instagram']
      )
    ).toEqual(['facebook', 'instagram'])
  })

  it('has a display name for every supported platform', () => {
    for (const p of SUPPORTED_PLATFORMS) expect(PLATFORM_DISPLAY_NAMES[p]).toBeTruthy()
  })
})
