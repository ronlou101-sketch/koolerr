/**
 * Customer-facing copy for the root error boundary, plus the single piece of
 * error-derived data that boundary is permitted to display.
 *
 * This lives outside `app/error.tsx` so the rule it encodes — nothing from the
 * thrown Error reaches the screen except an opaque support reference
 * (FOUNDATION_004_PRODUCT_PRINCIPLES.md §12: never show technical error
 * messages, stack traces, or system codes to customers) — is expressed as pure
 * functions this repo's node-environment vitest can actually exercise. There is
 * no DOM test environment here, so a rendered-component assertion is not
 * available.
 */

/** Shown in place of the thrown error's own message. Fixed copy, never interpolated. */
export const ROOT_ERROR_TITLE = 'Something went wrong'

/** The plain-language explanation and next step, in the customer's language. */
export const ROOT_ERROR_BODY =
  "Sorry about that — this page didn't load the way it should. Try again in a moment."

/**
 * Returns the opaque reference a customer can quote to support, or `null` when
 * there is nothing quotable.
 *
 * Next.js replaces a server error's real message with an unguessable `digest`
 * hash before it reaches the browser, which is why the digest — and only the
 * digest — is safe to show. Every other field on the Error (message, stack,
 * cause) is implementation detail and must never be rendered. Returning `null`
 * for a missing or blank digest keeps an empty "Reference:" line off the screen.
 */
export function supportReference(error: { digest?: string } | null | undefined): string | null {
  const digest = error?.digest
  if (typeof digest !== 'string') return null

  const trimmed = digest.trim()
  return trimmed.length > 0 ? trimmed : null
}
