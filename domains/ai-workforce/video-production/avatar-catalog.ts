/**
 * Curated, COST-VERIFIED HeyGen avatar/voice catalog for customer video creation
 * (Step 4B). Only entries whose cost tier has been confirmed are exposed, so a
 * customer can never select an expensive ($3–$4/min) avatar.
 *
 * AVATARS: verified as standard **Avatar III** (Studio Avatar, 720p) = the ~$1/min
 * tier — either in the HeyGen dashboard or via the read-only /v3/avatars/looks API
 * (avatar_type=studio_avatar with supported_api_engines listing ONLY avatar_iii, so
 * no pricier engine can run). Real HeyGen `avatar_id`s only — never invented. Add
 * more entries here only as each is verified ~$1/min by one of those two methods.
 *
 * VOICES: real HeyGen `voice_id`s from the account catalog. Voice choice is
 * cost-neutral (the spoken audio is part of the standard avatar-video minute), so
 * language/voice selection does not change the video's cost tier.
 *
 * COMPATIBILITY: HeyGen's /v2/video/generate pairs any avatar with any voice, so a
 * selection is valid whenever both the avatar and the voice are in this curated
 * catalog (see isValidVideoSelection).
 */

export interface VideoAvatarOption {
  /** Real HeyGen avatar_id (character.type 'avatar'). */
  avatarId: string
  name: string
  gender: 'male' | 'female'
  /** Short appearance descriptor (attire/setting). */
  appearance: string
  /** HeyGen engine (dashboard-verified). */
  engine: string
  /** Verified cost tier. */
  costTier: string
  previewImageUrl?: string
}

/** Dashboard-verified low-cost avatars (Avatar III, ~$1/min). */
export const VIDEO_AVATARS: readonly VideoAvatarOption[] = [
  {
    avatarId: 'Armando_Casual_Front_public',
    name: 'Armando',
    gender: 'male',
    appearance: 'Casual, front-facing presenter',
    engine: 'Avatar III',
    costTier: 'standard · ~$1/min @ 720p (verified)',
    previewImageUrl:
      'https://files2.heygen.ai/avatar/v3/fa717f667b7b4e41b0d7e4fd320ab080_43280/preview_talk_1.webp',
  },
  {
    avatarId: 'Abigail_expressive_2024112501',
    name: 'Abigail',
    gender: 'female',
    appearance: 'Expressive, upper-body framing',
    engine: 'Avatar III',
    costTier: 'standard · ~$1/min @ 720p (verified)',
    previewImageUrl:
      'https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp',
  },
  {
    avatarId: 'Candace_Beige_Dress_Front',
    name: 'Candace',
    gender: 'female',
    appearance: 'Beige dress, front-facing presenter',
    engine: 'Avatar III',
    costTier: 'standard · ~$1/min @ 720p (verified)',
    previewImageUrl:
      'https://files2.heygen.ai/avatar/v3/bb948a1bf0fb4f9b9b2039cf3ed2013d_34520/preview_target.webp',
  },
  {
    avatarId: 'Judith_expressive_2024120201',
    name: 'Judith',
    gender: 'female',
    appearance: 'Expressive, upper-body framing',
    engine: 'Avatar III',
    costTier: 'standard · ~$1/min @ 720p (verified)',
    previewImageUrl:
      'https://files2.heygen.ai/avatar/v3/13efef4d129e4f16ae6b350e225389b0_45830/preview_talk_4.webp',
  },
  {
    avatarId: 'Crisanto_Business_Front_public',
    name: 'Crisanto',
    gender: 'male',
    appearance: 'Business attire, front-facing presenter',
    engine: 'Avatar III',
    costTier: 'standard · ~$1/min @ 720p (verified)',
    previewImageUrl:
      'https://files2.heygen.ai/avatar/v3/fe8d76f83ac745c58c9e36c86f1c46b3_48730/preview_target.webp',
  },
  {
    avatarId: 'Armando_Casual_Side_public',
    name: 'Armando (Side)',
    gender: 'male',
    appearance: 'Casual, side-angle presenter',
    engine: 'Avatar III',
    costTier: 'standard · ~$1/min @ 720p (verified)',
    previewImageUrl:
      'https://files2.heygen.ai/avatar/v3/36dff2ade72644a4a3103341a0bfe7d5_43290/preview_talk_2.webp',
  },
]

/** Default spokesperson: the confirmed ~$1/min Armando (Avatar III). */
export const DEFAULT_AVATAR_ID = 'Armando_Casual_Front_public'

export interface VideoVoiceOption {
  /** Real HeyGen voice_id. */
  voiceId: string
  name: string
  language: string
  gender: 'male' | 'female'
}

/** Curated multi-language voices (real HeyGen voice_ids; cost-neutral). */
export const VIDEO_VOICES: readonly VideoVoiceOption[] = [
  {
    voiceId: '8661cd40d6c44c709e2d0031c0186ada',
    name: 'Michael C',
    language: 'English',
    gender: 'male',
  },
  {
    voiceId: '42d00d4aac5441279d8536cd6b52c53c',
    name: 'Hope',
    language: 'English',
    gender: 'female',
  },
  {
    voiceId: '6be73833ef9a4eb0aeee399b8fe9d62b',
    name: 'Andrew',
    language: 'English',
    gender: 'male',
  },
  {
    voiceId: '1425077382494b1cbc650fecda716444',
    name: 'Mark',
    language: 'Spanish',
    gender: 'male',
  },
  {
    voiceId: '1eca26cb214c4f66976339251282b341',
    name: 'Camila Vega',
    language: 'Spanish',
    gender: 'female',
  },
  {
    voiceId: '1793597be96946fabf72a90adc112fc6',
    name: 'Nicolas',
    language: 'French',
    gender: 'male',
  },
  {
    voiceId: '19034eae6fb84f8b81461d0fe2326be4',
    name: 'MaMicha',
    language: 'French',
    gender: 'female',
  },
  {
    voiceId: '14d0507412584941a26a093c46051035',
    name: 'Günther',
    language: 'German',
    gender: 'male',
  },
  {
    voiceId: '148b505539a04ed98a3c2188515183cc',
    name: 'Leonie',
    language: 'German',
    gender: 'female',
  },
  {
    voiceId: '14be84ff0ad848d79bd867a79a870f4a',
    name: 'Yuri',
    language: 'Portuguese',
    gender: 'male',
  },
  {
    voiceId: 'ab40d65529a74f0e83528a1c2133a3b0',
    name: 'Serene Sofia',
    language: 'Portuguese',
    gender: 'female',
  },
  {
    voiceId: '1dec321f1a0e4c9a8f9d807dc89de2cf',
    name: 'Aravinda C.',
    language: 'Italian',
    gender: 'male',
  },
  {
    voiceId: '49a8e79358994a949e968847edc71159',
    name: 'Ivanna',
    language: 'Italian',
    gender: 'female',
  },
]

/** Default voice: Michael C (English male), matching the default avatar. */
export const DEFAULT_VOICE_ID = '8661cd40d6c44c709e2d0031c0186ada'

export function getVideoAvatar(avatarId: string): VideoAvatarOption | undefined {
  return VIDEO_AVATARS.find((a) => a.avatarId === avatarId)
}
export function getVideoVoice(voiceId: string): VideoVoiceOption | undefined {
  return VIDEO_VOICES.find((v) => v.voiceId === voiceId)
}
export function isValidVideoAvatar(avatarId: string): boolean {
  return VIDEO_AVATARS.some((a) => a.avatarId === avatarId)
}
export function isValidVideoVoice(voiceId: string): boolean {
  return VIDEO_VOICES.some((v) => v.voiceId === voiceId)
}

/** Unique languages offered, sorted. */
export function videoLanguages(): string[] {
  return [...new Set(VIDEO_VOICES.map((v) => v.language))].sort()
}
export function videoVoicesForLanguage(language: string): VideoVoiceOption[] {
  return VIDEO_VOICES.filter((v) => v.language === language)
}

/**
 * A selection is valid when both the avatar and the voice are in the curated,
 * cost-verified catalog (HeyGen allows any avatar+voice pairing). Returns a reason
 * on failure so the caller can surface a clear message.
 */
export function isValidVideoSelection(
  avatarId: string,
  voiceId: string
): { ok: boolean; reason?: string } {
  if (!isValidVideoAvatar(avatarId)) return { ok: false, reason: 'unknown or unavailable avatar' }
  if (!isValidVideoVoice(voiceId)) return { ok: false, reason: 'unknown or unavailable voice' }
  return { ok: true }
}
