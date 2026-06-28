import { readFileSync } from 'fs'
import { join } from 'path'

export type ItemStatus = 'complete' | 'in-progress' | 'not-started' | 'blocked'
export type BlockerStatus = 'pending' | 'blocked' | 'needs-review' | 'resolved' | 'waiting'

export interface ChecklistItem {
  status: ItemStatus
  text: string
}

export interface ChecklistGroup {
  heading: string | null
  items: ChecklistItem[]
}

export interface PhaseData {
  number: number
  name: string
  status: ItemStatus
  percent: number
  description: string
  groups: ChecklistGroup[]
}

export interface BlockerData {
  id: string
  title: string
  phase: number
  owner: string
  status: BlockerStatus
}

export interface LedgerEntry {
  date: string
  phase: string
  mission: string
  completed: string
}

export interface ObjectiveItem {
  label: string
  done: boolean
}

export interface TrackerData {
  lastUpdated: string
  overallPercent: number
  currentMission: string
  currentPhaseName: string
  phases: PhaseData[]
  objectiveItems: ObjectiveItem[]
  blockers: BlockerData[]
  ledger: LedgerEntry[]
}

function extractSection(text: string, header: string): string {
  const start = text.indexOf(header)
  if (start === -1) return ''
  const after = text.indexOf('\n## ', start + header.length)
  return after === -1 ? text.slice(start) : text.slice(start, after)
}

function emojiToStatus(raw: string): ItemStatus {
  if (raw.includes('✅')) return 'complete'
  if (raw.includes('🟡')) return 'in-progress'
  if (raw.includes('🚫')) return 'blocked'
  return 'not-started'
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePhaseTable(
  section: string
): Array<{ number: number; name: string; status: ItemStatus; percent: number }> {
  return section
    .split('\n')
    .filter((l) => /^\|\s*\d+/.test(l))
    .map((row) => {
      const cols = row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
      return {
        number: parseInt(cols[0] ?? '0', 10),
        name: cols[1] ?? '',
        status: emojiToStatus(cols[2] ?? ''),
        percent: parseInt((cols[3] ?? '0').replace(/[~%]/g, ''), 10) || 0,
      }
    })
}

function parsePhaseChecklist(content: string): { description: string; groups: ChecklistGroup[] } {
  const lines = content.split('\n')
  const groups: ChecklistGroup[] = []
  let currentGroup: ChecklistGroup | null = null
  const descLines: string[] = []
  let inItems = false

  for (const line of lines) {
    if (line.startsWith('### Phase ') || line.startsWith('---') || line.startsWith('> ⚠️')) continue

    const headingMatch = line.match(/^\s*\*\*([^*]+)\*\*\s*$/)
    if (headingMatch) {
      if (currentGroup) groups.push(currentGroup)
      currentGroup = { heading: headingMatch[1]!.trim(), items: [] }
      inItems = true
      continue
    }

    const itemMatch = line.match(/^-\s+(✅|🟡|⬜|🚫)\s+(.+)/)
    if (itemMatch) {
      if (!currentGroup) {
        currentGroup = { heading: null, items: [] }
        inItems = true
      }
      currentGroup.items.push({
        status: emojiToStatus(itemMatch[1]!),
        text: stripInline(itemMatch[2]!.trim()),
      })
      continue
    }

    if (!inItems && line.trim() && !line.startsWith('>') && !line.startsWith('#')) {
      descLines.push(line.trim())
    }
  }

  if (currentGroup && currentGroup.items.length > 0) groups.push(currentGroup)

  return { description: descLines.filter(Boolean).join(' '), groups }
}

function parseLedger(section: string): LedgerEntry[] {
  return section
    .split('\n')
    .filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l))
    .map((row) => {
      const cols = row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
      return {
        date: cols[0] ?? '',
        phase: cols[1] ?? '',
        mission: cols[2] ?? '',
        completed: cols[3] ?? '',
      }
    })
    .reverse()
}

function parseBlockers(section: string): BlockerData[] {
  return section
    .split('\n')
    .filter((l) => /^\|\s*B-\d+/.test(l))
    .map((row) => {
      const cols = row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
      const raw = (cols[4] ?? '').toLowerCase()
      let status: BlockerStatus = 'pending'
      if (raw.includes('✅') || raw.includes('resolved')) status = 'resolved'
      else if (raw.includes('🚫') || (raw.includes('blocked') && !raw.includes('not-started')))
        status = 'blocked'
      else if (raw.includes('needs review')) status = 'needs-review'
      else if (raw.includes('waiting')) status = 'waiting'
      return {
        id: cols[0] ?? '',
        title: stripInline(cols[1] ?? ''),
        phase: parseInt(cols[2] ?? '0', 10) || 0,
        owner: cols[3] ?? '',
        status,
      }
    })
}

function parseObjectiveItems(section: string): ObjectiveItem[] {
  return section
    .split('\n')
    .filter((l) => /^-\s+\[[x ]\]/.test(l))
    .map((l) => {
      const m = l.match(/^-\s+\[([x ])\]\s+(.+)/)!
      return { done: m[1] === 'x', label: stripInline(m[2]!) }
    })
}

export function parseTracker(): TrackerData {
  const text = readFileSync(join(process.cwd(), 'docs', 'KOOLERR_MASTER_TRACKER.md'), 'utf-8')

  const lastUpdatedSection = extractSection(text, '## Last Updated')
  const lastUpdated = lastUpdatedSection.match(/\*\*(\d{4}-\d{2}-\d{2})\*\*/)?.[1] ?? ''

  const sec2 = extractSection(text, '## 2. Overall Completion')
  const overallPercent = parseInt(sec2.match(/\*\*~?(\d+)%\*\*/)?.[1] ?? '0', 10)
  const phaseTable = parsePhaseTable(sec2)

  const sec5 = extractSection(text, '## 5. Current Phase')
  const currentPhaseName = sec5.match(/\*\*Phase \d+ — ([^*\n]+)\*\*/)?.[1]?.trim() ?? ''

  const sec6 = extractSection(text, '## 6. Session Objective')
  const currentMission = sec6.match(/\*\*Current Mission:\*\*\s*(.+)/)?.[1]?.trim() ?? ''
  const objectiveItems = parseObjectiveItems(sec6)

  const sec7 = extractSection(text, '## 7. Phase Checklists')
  const phaseChecklists = new Map<number, string>()
  let curPhaseNum: number | null = null
  let curPhaseLines: string[] = []
  for (const line of sec7.split('\n')) {
    const m = line.match(/^### Phase (\d+)/)
    if (m) {
      if (curPhaseNum !== null) phaseChecklists.set(curPhaseNum, curPhaseLines.join('\n'))
      curPhaseNum = parseInt(m[1]!, 10)
      curPhaseLines = [line]
    } else if (curPhaseNum !== null) {
      curPhaseLines.push(line)
    }
  }
  if (curPhaseNum !== null) phaseChecklists.set(curPhaseNum, curPhaseLines.join('\n'))

  const phases: PhaseData[] = phaseTable.map((pt) => {
    const { description, groups } = parsePhaseChecklist(phaseChecklists.get(pt.number) ?? '')
    return { ...pt, description, groups }
  })

  const sec9 = extractSection(text, '## 9. Blockers')
  const blockers = parseBlockers(sec9)

  const sec3 = extractSection(text, '## 3. Progress Ledger')
  const ledger = parseLedger(sec3)

  return {
    lastUpdated,
    overallPercent,
    currentMission,
    currentPhaseName,
    phases,
    objectiveItems,
    blockers,
    ledger,
  }
}
