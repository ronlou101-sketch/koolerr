/**
 * Platform Bootstrap — Public Interface
 *
 * The composition root for the Koolerr platform. Call bootstrapPlatform()
 * once at application startup before handling any requests.
 *
 * The infrastructure/ layer is the only layer permitted to import from
 * both shared/ and domains/ simultaneously. It is the composition root
 * of the modular monolith.
 *
 * Usage (Next.js App Router — typically in app/layout.tsx or a dedicated
 * platform initialization module):
 *
 *   import { bootstrapPlatform } from '@/infrastructure/platform'
 *   bootstrapPlatform()
 *
 * See FOUNDATION_001_ARCHITECTURE.md §1.2 — Modular Monolith Philosophy.
 */

export type { PlatformBootstrapResult } from './bootstrap'
export { bootstrapPlatform, isPlatformBootstrapped } from './bootstrap'
