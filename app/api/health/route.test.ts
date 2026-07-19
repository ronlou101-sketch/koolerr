import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
  it('returns 200', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('reports status ok with operational fields', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(typeof body.timestamp).toBe('string')
    expect(typeof body.uptimeSeconds).toBe('number')
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(typeof body.environment).toBe('string')
  })

  it('does not expose any customer or sensitive fields', async () => {
    const res = await GET()
    const body = await res.json()
    expect(Object.keys(body).sort()).toEqual([
      'environment',
      'status',
      'timestamp',
      'uptimeSeconds',
    ])
  })
})
