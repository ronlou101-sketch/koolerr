/**
 * Model Gateway — Public Interface
 *
 * The single entry point for all AI model invocations on the platform.
 * No domain invokes an AI provider directly — ever.
 * Provider-specific code lives exclusively inside this module.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.12 — Model Gateway.
 * See FOUNDATION_001_ARCHITECTURE.md §6 — AI Provider Strategy.
 */

export * from './types'
export { modelGateway, _registerProvider } from './gateway'
