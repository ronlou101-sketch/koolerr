import type { Deliverable, DeliverableType } from '@/shared/types'

const MEDIA_TYPES = new Set<DeliverableType>(['video_script', 'video', 'image'])

export interface MediaStats {
  total: number
  scripts: number
  videos: number
  images: number
  pendingReview: number
  approved: number
}

export function computeMediaStats(deliverables: Deliverable[]): MediaStats {
  const media = deliverables.filter((d) => MEDIA_TYPES.has(d.type))
  return {
    total: media.length,
    scripts: media.filter((d) => d.type === 'video_script').length,
    videos: media.filter((d) => d.type === 'video').length,
    images: media.filter((d) => d.type === 'image').length,
    pendingReview: media.filter((d) => d.status === 'pending_review').length,
    approved: media.filter((d) => d.status === 'approved').length,
  }
}
