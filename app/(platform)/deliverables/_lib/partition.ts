import type { Deliverable } from '@/shared/types'

/** Deliverable types shown in the media sections; everything else is a document. */
const MEDIA_TYPES = new Set(['video_script', 'video', 'image'])

export interface PartitionedDeliverables {
  scripts: Deliverable[]
  videos: Deliverable[]
  images: Deliverable[]
  /** All non-media deliverables (reports, strategies, plans, etc.), newest-first. */
  documents: Deliverable[]
}

/**
 * Splits an organization's deliverables into the sections the Deliverables page
 * renders: video scripts, videos, images, and everything else as documents.
 * Documents are sorted newest-first; the media groups preserve input order.
 */
export function partitionDeliverables(all: Deliverable[]): PartitionedDeliverables {
  const media = all.filter((d) => MEDIA_TYPES.has(d.type))
  const documents = all
    .filter((d) => !MEDIA_TYPES.has(d.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const byType = (type: string) => media.filter((d) => d.type === type)

  return {
    scripts: byType('video_script'),
    videos: byType('video'),
    images: byType('image'),
    documents,
  }
}
