import { describe, expect, it } from 'vitest'

import { isReportViewEmpty, toReportView } from './report-view'

const FULL = {
  packageId: 'pkg_1',
  customerSummary: 'Your campaign is ready to publish.',
  deliverables: ['3 ad variants', '1 spokesperson video'],
  platformPackages: ['Facebook: 2 posts', 'Instagram: 1 reel'],
  publishingInstructions: ['Post the reel first', 'Boost the top variant'],
  recommendedSchedule: 'Mon 9am, Wed 12pm, Fri 4pm',
  approvalMetadata: 'Approved — quality score 92/100',
  downloadLinks: [],
  thumbnails: [],
}

describe('toReportView', () => {
  it('maps a full delivery package into summary + ordered sections', () => {
    const view = toReportView(FULL)
    expect(view.summary).toBe('Your campaign is ready to publish.')
    expect(view.sections.map((s) => s.label)).toEqual([
      "What's included",
      'Your platform packages',
      'How to publish',
      'Recommended schedule',
      'Quality review',
    ])
    expect(view.sections[0].items).toEqual(['3 ad variants', '1 spokesperson video'])
    expect(view.sections[3].items).toEqual(['Mon 9am, Wed 12pm, Fri 4pm'])
  })

  it('omits missing and empty fields (partial package)', () => {
    const view = toReportView({
      customerSummary: 'Partial.',
      deliverables: [],
      platformPackages: ['X: 1 post'],
    })
    expect(view.summary).toBe('Partial.')
    expect(view.sections.map((s) => s.label)).toEqual(['Your platform packages'])
  })

  it('filters non-string / blank array entries defensively', () => {
    const view = toReportView({
      deliverables: ['ok', '', '   ', 42, null, undefined],
    })
    expect(view.sections).toEqual([{ label: "What's included", items: ['ok'] }])
  })

  it('tolerates a wrong-shaped content object without throwing', () => {
    const view = toReportView({ body: 'legacy', deliverables: 'not-an-array', customerSummary: 5 })
    expect(view.summary).toBeNull()
    expect(view.sections).toEqual([])
    expect(isReportViewEmpty(view)).toBe(true)
  })

  it('isReportViewEmpty is false when any field is present', () => {
    expect(isReportViewEmpty(toReportView({ customerSummary: 'hi' }))).toBe(false)
    expect(isReportViewEmpty(toReportView({}))).toBe(true)
  })
})
