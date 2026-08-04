/**
 * Report deliverable view model (Slice CR-5, ADR-025 §6/§8).
 *
 * A `type:'report'` deliverable stores a Delivery `DeliveryPackage` as its content
 * (customerSummary, deliverables[], platformPackages[], publishingInstructions[],
 * recommendedSchedule, approvalMetadata, …). The generic renderer read
 * body/contentBrief/draft — fields a DeliveryPackage does not have — so the report
 * rendered blank. This pure helper normalizes the stored content into display-ready
 * sections, reading every field defensively so a partial or legacy package degrades
 * gracefully instead of crashing.
 */

export interface ReportSection {
  label: string
  items: string[]
}

export interface ReportView {
  summary: string | null
  sections: ReportSection[]
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

/** Ordered list fields → customer-facing section labels. */
const LIST_SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['deliverables', "What's included"],
  ['platformPackages', 'Your platform packages'],
  ['publishingInstructions', 'How to publish'],
]

/** Ordered single-value fields → customer-facing section labels. */
const TEXT_SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['recommendedSchedule', 'Recommended schedule'],
  ['approvalMetadata', 'Quality review'],
]

/**
 * Normalize a report deliverable's stored content into a display view.
 * Only populated fields become sections; missing/empty fields are omitted.
 */
export function toReportView(content: Record<string, unknown>): ReportView {
  const sections: ReportSection[] = []

  for (const [key, label] of LIST_SECTIONS) {
    const items = asTextList(content[key])
    if (items.length > 0) sections.push({ label, items })
  }

  for (const [key, label] of TEXT_SECTIONS) {
    const text = asText(content[key])
    if (text) sections.push({ label, items: [text] })
  }

  return { summary: asText(content.customerSummary), sections }
}

/** True when the content has no report fields worth rendering (caller may fall back). */
export function isReportViewEmpty(view: ReportView): boolean {
  return view.summary === null && view.sections.length === 0
}
