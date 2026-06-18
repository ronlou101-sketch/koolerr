/**
 * Orchestration Engine — Public Interface
 *
 * Coordinates multi-step, multi-agent workflows. Manages dependency
 * resolution, step sequencing, failure recovery, and progress tracking.
 *
 * The engine coordinates execution. Digital Employees perform the work.
 * Business logic does not live here.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.13 — Orchestration Engine.
 */

export * from './types'
export { orchestrationEngine } from './engine'
