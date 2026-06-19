import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { businessBrainService } from '@/domains/business-brain'
import { logger } from '@/shared/lib/logger'
import type { OrganizationId, TenantId } from '@/shared/types'

/**
 * CTO Agent Context Seeder
 *
 * Loads Koolerr platform knowledge into the Business Brain so Atlas has
 * persistent, queryable context on every Engagement Run.
 *
 * Knowledge seeded (stored as Business Brain memories):
 *   - Platform charter and mission (FOUNDATION_000)
 *   - Architecture decisions and invariants (FOUNDATION_001)
 *   - Engineering principles and standards (FOUNDATION_002)
 *   - Development roadmap and phase status (FOUNDATION_003)
 *   - Product principles (FOUNDATION_004)
 *   - Founder decision log (FOUNDATION_005)
 *   - Claude Code operating instructions (CLAUDE.md)
 *   - Phase 2 baseline report (PHASE_2_BASELINE.md)
 *   - ADR index with summaries (all 17 ADRs)
 *   - Recent git history (last 30 commits)
 *
 * Idempotent: skips seeding if CTO context memories already exist.
 * Call with force=true to re-seed after major repository changes.
 *
 * See docs/adr/ADR-018-cto-agent-workforce.md
 */

const REPO_ROOT = process.cwd()
const CTO_CONTEXT_SCOPE = 'cto_agent'

function readFile(filePath: string, maxChars = 4000): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.length > maxChars
      ? content.slice(0, maxChars) + '\n\n[truncated — full content in repository]'
      : content
  } catch {
    return ''
  }
}

function gitLog(): string {
  try {
    return execSync('git log --oneline -30', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } catch {
    return '(git log unavailable)'
  }
}

function buildADRIndex(): string {
  try {
    const adrDir = path.join(REPO_ROOT, 'docs', 'adr')
    const files = fs
      .readdirSync(adrDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
    const summaries = files.map((file) => {
      const content = fs.readFileSync(path.join(adrDir, file), 'utf-8')
      const firstLines = content.split('\n').slice(0, 8).join('\n')
      return `### ${file}\n${firstLines}`
    })
    return summaries.join('\n\n')
  } catch {
    return '(ADR index unavailable)'
  }
}

export async function seedCTOContext(
  organizationId: OrganizationId,
  tenantId: TenantId,
  force = false
): Promise<void> {
  // Check if already seeded
  if (!force) {
    const existing = await businessBrainService.listAllMemories(organizationId)
    if (existing.ok) {
      const hasCTOContext = existing.value.some((m) => m.relevanceScope.includes(CTO_CONTEXT_SCOPE))
      if (hasCTOContext) {
        logger.info('[CTO_SEEDER] CTO context already in Business Brain — skipping seed', {
          organizationId,
        })
        return
      }
    }
  }

  logger.info('[CTO_SEEDER] Seeding CTO Agent context into Business Brain', { organizationId })

  const memories: Array<{
    title: string
    body: string
    scope: string[]
    type: 'knowledge' | 'decision' | 'sop'
  }> = [
    {
      title: 'Platform Charter & Mission',
      body: readFile(path.join(REPO_ROOT, 'Foundation', 'FOUNDATION_000_CHARTER.md'), 3000),
      scope: [CTO_CONTEXT_SCOPE, 'mission'],
      type: 'knowledge',
    },
    {
      title: 'Platform Architecture — Permanent Technical Constitution',
      body: readFile(path.join(REPO_ROOT, 'Foundation', 'FOUNDATION_001_ARCHITECTURE.md'), 5000),
      scope: [CTO_CONTEXT_SCOPE, 'architecture'],
      type: 'knowledge',
    },
    {
      title: 'Engineering Principles & Standards',
      body: readFile(
        path.join(REPO_ROOT, 'Foundation', 'FOUNDATION_002_ENGINEERING_PRINCIPLES.md'),
        3000
      ),
      scope: [CTO_CONTEXT_SCOPE, 'standards'],
      type: 'knowledge',
    },
    {
      title: 'Development Roadmap — Phase Status',
      body: readFile(
        path.join(REPO_ROOT, 'Foundation', 'FOUNDATION_003_DEVELOPMENT_ROADMAP.md'),
        4000
      ),
      scope: [CTO_CONTEXT_SCOPE, 'roadmap'],
      type: 'knowledge',
    },
    {
      title: 'Product Principles',
      body: readFile(
        path.join(REPO_ROOT, 'Foundation', 'FOUNDATION_004_PRODUCT_PRINCIPLES.md'),
        3000
      ),
      scope: [CTO_CONTEXT_SCOPE, 'product'],
      type: 'knowledge',
    },
    {
      title: 'Founder Decision Log',
      body: readFile(
        path.join(REPO_ROOT, 'Foundation', 'FOUNDATION_005_FOUNDER_DECISION_LOG.md'),
        3000
      ),
      scope: [CTO_CONTEXT_SCOPE, 'decisions'],
      type: 'decision',
    },
    {
      title: 'Claude Code Operating Instructions (CLAUDE.md)',
      body: readFile(path.join(REPO_ROOT, 'CLAUDE.md'), 6000),
      scope: [CTO_CONTEXT_SCOPE, 'standards', 'workflow'],
      type: 'sop',
    },
    {
      title: 'Phase 2 Baseline — Repository State at Phase 3 Start',
      body: readFile(path.join(REPO_ROOT, 'PHASE_2_BASELINE.md'), 6000),
      scope: [CTO_CONTEXT_SCOPE, 'roadmap', 'baseline'],
      type: 'knowledge',
    },
    {
      title: 'ADR Index — All Architecture Decision Records',
      body: buildADRIndex(),
      scope: [CTO_CONTEXT_SCOPE, 'architecture', 'decisions'],
      type: 'knowledge',
    },
    {
      title: 'Git History — Recent Commits',
      body: gitLog(),
      scope: [CTO_CONTEXT_SCOPE, 'development', 'history'],
      type: 'knowledge',
    },
  ]

  let seeded = 0
  for (const memory of memories) {
    if (
      !memory.body ||
      memory.body === '(git log unavailable)' ||
      memory.body === '(ADR index unavailable)'
    ) {
      logger.warn(`[CTO_SEEDER] Skipping empty memory: ${memory.title}`)
      continue
    }
    const result = await businessBrainService.storeMemory({
      tenantId,
      organizationId,
      memory: {
        organizationId,
        type: memory.type,
        content: { title: memory.title, body: memory.body },
        source: 'cto_agent:context_seeder',
        relevanceScope: memory.scope,
      },
    })
    if (result.ok) {
      seeded++
    } else {
      logger.warn(`[CTO_SEEDER] Failed to store memory "${memory.title}": ${result.error.message}`)
    }
  }

  logger.info(`[CTO_SEEDER] Context seeding complete — ${seeded} memories stored`, {
    organizationId,
  })
}
