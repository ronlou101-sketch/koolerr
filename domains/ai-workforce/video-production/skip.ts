import type { CreativeBrief } from '../creative/types'
import type { VideoProductionBrief } from './types'

/** Marker text stamped onto every field of a skipped video production brief. */
export const VIDEO_SKIPPED_NOTE =
  'Video production was skipped for this run — no video assets were generated.'

/**
 * Builds a minimal, valid VideoProductionBrief that marks video production as skipped.
 *
 * The AI Workforce pipeline treats the Video Production step as non-fatal: when the
 * department cannot produce a plan (e.g. no text provider configured, malformed
 * response), aborting the whole engagement run would discard the completed research,
 * strategy, and creative work. Instead the pipeline records the step as skipped and
 * hands this fallback brief to the Publishing Department, which clearly signals that
 * no video assets exist so downstream packages are prepared without video.
 *
 * Why a builder in the domain rather than an ad-hoc object in the pipeline: the
 * VideoProductionBrief shape belongs to this domain. Constructing it here keeps the
 * pipeline from depending on the internal field layout of another domain's type.
 */
export function buildSkippedVideoProductionBrief(
  sourceCreativeBrief: CreativeBrief
): VideoProductionBrief {
  return {
    productionPlan: VIDEO_SKIPPED_NOTE,
    renderSettings: 'N/A — video skipped',
    estimatedRuntime: '0s',
    renderQueue: [],
    sceneTimeline: [],
    avatarAssignments: [],
    voiceAssignments: [],
    cameraMovements: [],
    motionEffects: [],
    transitions: [],
    captionTimeline: [],
    bRollTimeline: [],
    musicTimeline: [],
    assetManifest: [],
    exportTargets: [],
    qualityChecklist: [VIDEO_SKIPPED_NOTE],
    approvalChecklist: [VIDEO_SKIPPED_NOTE],
    generatedAt: new Date(),
    sourceCreativeBrief,
  }
}
