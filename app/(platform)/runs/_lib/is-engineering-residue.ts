/**
 * Presentation-only classifier for engineering / render-check residue on Work.
 *
 * EngagementRun has no tags, environment, or dogfooding flag — only `objective`.
 * Demotion therefore requires positive title evidence from known vendor/e2e
 * prefixes. Failed status and empty deliverables are never inputs: inferring
 * residue from those would hide genuine unfinished customer work.
 *
 * Architect lock bef9971b / parent ac421b6f (Domain 1 Work-first).
 */

const HEYGEN_VIDEO_GENERATION = /^HeyGen video generation\b/i
const HIGGSFIELD_IMAGE_GENERATION = /^Higgsfield image generation\b/i
const STAGE6_E2E = /\bstage6-e2e\b/i
const STEP2E_VERIFY = /\bstep2e-verify\b/i
const E2E_FINAL_TEST_RETEST = /\be2e-(final|test|retest)\b/i

/**
 * Returns true only when `objective` matches a high-confidence residue pattern.
 * Customer titles that merely mention HeyGen, video, or testimonials stay false.
 */
export function isEngineeringResidue(objective: string): boolean {
  if (typeof objective !== 'string') return false

  const text = objective.trim()
  if (!text) return false

  return (
    HEYGEN_VIDEO_GENERATION.test(text) ||
    HIGGSFIELD_IMAGE_GENERATION.test(text) ||
    STAGE6_E2E.test(text) ||
    STEP2E_VERIFY.test(text) ||
    E2E_FINAL_TEST_RETEST.test(text)
  )
}
