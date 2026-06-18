/**
 * Result type for explicit error handling without exceptions.
 *
 * Use instead of throw/catch for expected failure paths so callers are
 * forced by the type system to handle both success and failure.
 *
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §2.4 — Error Handling.
 */

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
