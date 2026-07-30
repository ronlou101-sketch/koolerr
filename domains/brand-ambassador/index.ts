/**
 * Brand Ambassador Domain — Public Interface
 *
 * Owns: the organization's persistent, provider-agnostic spokesperson identity
 *       (a `visual_identity` Business Memory) and the curated Ambassador Library.
 *
 * Does not own: render providers, rendering, billing, workforce provisioning.
 *               The Brand Ambassador is a first-class Digital Employee (owned by
 *               the Workforce Engine); this domain owns only its IDENTITY.
 *
 * See docs/adr/ADR-024-brand-ambassador.md.
 */
export * from './types'
export { brandAmbassadorService, BrandAmbassadorService } from './service'
export type { IBrandAmbassadorService } from './service'
export {
  BRAND_AMBASSADOR_LIBRARY,
  getLibraryEntry,
  pickDefaultAmbassador,
  hashString,
} from './library'
