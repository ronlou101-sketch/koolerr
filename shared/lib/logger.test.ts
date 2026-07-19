import { describe, it, expect } from 'vitest'
import { serializeError } from './logger'

describe('serializeError()', () => {
  it('serializes an Error with its name, message, and stack', () => {
    const result = serializeError(new Error('boom'))
    expect(result.name).toBe('Error')
    expect(result.message).toBe('boom')
    expect(typeof result.stack).toBe('string')
  })

  it('preserves a custom Error subclass name', () => {
    class TimeoutError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'TimeoutError'
      }
    }
    expect(serializeError(new TimeoutError('slow')).name).toBe('TimeoutError')
  })

  it('includes the digest when present (Next.js server errors)', () => {
    const err = Object.assign(new Error('x'), { digest: 'abc123' })
    expect(serializeError(err).digest).toBe('abc123')
  })

  it('omits the digest when it is not a string', () => {
    const err = Object.assign(new Error('x'), { digest: 42 })
    expect(serializeError(err).digest).toBeUndefined()
  })

  it('handles a plain string thrown value', () => {
    const result = serializeError('plain failure')
    expect(result.name).toBe('NonError')
    expect(result.message).toBe('plain failure')
  })

  it('handles a non-error object without throwing', () => {
    const result = serializeError({ code: 500, detail: 'nope' })
    expect(result.name).toBe('NonError')
    expect(result.message).toContain('500')
  })

  it('handles a circular object without throwing', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(() => serializeError(circular)).not.toThrow()
    expect(serializeError(circular).name).toBe('NonError')
  })
})
