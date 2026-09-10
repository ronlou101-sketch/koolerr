import { describe, expect, it } from 'vitest'
import {
  VIDEO_AVATARS,
  VIDEO_VOICES,
  DEFAULT_AVATAR_ID,
  DEFAULT_VOICE_ID,
  isValidVideoAvatar,
  isValidVideoVoice,
  isValidVideoSelection,
  videoLanguages,
  videoVoicesForLanguage,
  getVideoAvatar,
} from './avatar-catalog'

describe('cost-verified avatar catalog (Step 4B)', () => {
  it('exposes only cost-verified Avatar III (~$1/min) avatars — strict allowlist', () => {
    expect(VIDEO_AVATARS).toHaveLength(6)
    // Default stays the confirmed Armando (front).
    expect(VIDEO_AVATARS[0].avatarId).toBe('Armando_Casual_Front_public')
    expect(DEFAULT_AVATAR_ID).toBe('Armando_Casual_Front_public')
    // Every exposed avatar is Avatar III at the ~$1/min tier.
    for (const a of VIDEO_AVATARS) {
      expect(a.engine).toBe('Avatar III')
      expect(a.costTier).toMatch(/\$1\/min/)
    }
  })

  it('rejects the pricier Lorenzo photo avatar and any unknown avatar', () => {
    expect(isValidVideoAvatar('Armando_Casual_Front_public')).toBe(true)
    // Lorenzo (photo avatar, ~$3/min) must NOT be selectable.
    expect(isValidVideoAvatar('f5c6986bebd14deab71f1182771c57b9')).toBe(false)
    expect(isValidVideoAvatar('some_random_avatar')).toBe(false)
    expect(getVideoAvatar('some_random_avatar')).toBeUndefined()
  })
})

describe('curated voices', () => {
  it('has 13 unique real voice ids and a valid default', () => {
    expect(VIDEO_VOICES).toHaveLength(13)
    const ids = VIDEO_VOICES.map((v) => v.voiceId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(isValidVideoVoice(DEFAULT_VOICE_ID)).toBe(true)
    expect(DEFAULT_VOICE_ID).toBe('8661cd40d6c44c709e2d0031c0186ada')
  })

  it('validates known vs unknown voices', () => {
    expect(isValidVideoVoice('8661cd40d6c44c709e2d0031c0186ada')).toBe(true)
    expect(isValidVideoVoice('not_a_real_voice')).toBe(false)
  })

  it('offers the six curated languages and filters voices by language', () => {
    expect(videoLanguages()).toEqual([
      'English',
      'French',
      'German',
      'Italian',
      'Portuguese',
      'Spanish',
    ])
    const en = videoVoicesForLanguage('English')
    expect(en.length).toBeGreaterThan(0)
    expect(en.every((v) => v.language === 'English')).toBe(true)
  })
})

describe('isValidVideoSelection (compatibility)', () => {
  it('accepts an in-catalog avatar + voice pair', () => {
    expect(isValidVideoSelection(DEFAULT_AVATAR_ID, DEFAULT_VOICE_ID)).toEqual({ ok: true })
  })
  it('rejects an unknown avatar with a reason', () => {
    const r = isValidVideoSelection('nope', DEFAULT_VOICE_ID)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/avatar/)
  })
  it('rejects an unknown voice with a reason', () => {
    const r = isValidVideoSelection(DEFAULT_AVATAR_ID, 'nope')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/voice/)
  })
})
