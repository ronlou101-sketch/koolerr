/**
 * Consent & Rights Ledger — Public Interface
 *
 * The permanent, append-only record of every permission, consent, and
 * rights decision on the platform. Customers can always inspect what
 * has been consented to and by whom.
 *
 * Records are never deleted. Revocation updates status — it does not
 * remove the history.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.11 — Consent & Rights Ledger.
 */

export * from './types'
export { consentLedger, _configureConsentRepository } from './ledger'
