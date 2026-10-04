/**
 * Deliverable-type contract test (Founder t213u; Architect review 63e8eedd, lock f7ebf2dc).
 *
 * Compares the application's `DeliverableType` union (shared/types/platform.ts)
 * with the DB `deliverables_type_check` allowed values, parsed from the repo
 * migrations (the latest definition wins). The app/DB divergence that exists
 * today is deferred, not fixed, so it is listed explicitly in KNOWN_APP_ONLY_GAPS.
 * The test fails when:
 *   - a NEW app-only type appears (not in the allowlist);
 *   - an allowlisted gap becomes DB-allowed (remove it from the allowlist);
 *   - the DB allows a type the app does not declare.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const PLATFORM_TYPES = join(ROOT, 'shared/types/platform.ts')
const MIGRATIONS_DIR = join(ROOT, 'supabase/migrations')

/**
 * Documented, deferred app-only types. The DB CHECK does not allow these yet.
 * - video_script: schema fix deferred under Phase 8 HOLD (Architect 63e8eedd;
 *   run_2728a588 could not persist its script).
 * - CTO workforce types (infrastructure/cto-workforce/executor.ts) and
 *   github_issue_draft: same pre-existing drift, not yet dispositioned.
 * Do NOT broaden this list without an approved decision.
 */
const KNOWN_APP_ONLY_GAPS = [
  'video_script',
  'coordination_brief',
  'v1_readiness_report',
  'code_review',
  'milestone_report',
  'blocker_report',
  'implementation_plan',
  'github_issue_draft',
] as const

function quotedValues(list: string): string[] {
  return [...list.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1])
}

/** Extracts the string-literal members of `export type DeliverableType = ...`. */
export function parseAppDeliverableTypes(source: string): string[] {
  const m = source.match(/export\s+type\s+DeliverableType\s*=([\s\S]*?)(?:\n\s*\n|\nexport\s)/)
  if (!m) throw new Error('DeliverableType union not found in platform.ts')
  return quotedValues(m[1])
}

/**
 * Returns the allowed `type` values from the last migration (in filename order)
 * that defines the deliverables type CHECK. It handles both the CREATE TABLE form
 * and a later `ADD CONSTRAINT deliverables_type_check CHECK (type IN (...))`.
 */
export function parseDbDeliverableTypes(migrations: Array<{ name: string; sql: string }>): {
  types: string[]
  source: string
} {
  let found: { types: string[]; source: string } | null = null
  const sorted = [...migrations].sort((a, b) => a.name.localeCompare(b.name))
  for (const { name, sql } of sorted) {
    const stripped = sql.replace(/--[^\n]*/g, '')
    const patterns = [
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?deliverables\s*\([\s\S]*?\btype\s+text[^,]*?CHECK\s*\(\s*type\s+IN\s*\(([^)]*)\)/i,
      /ADD\s+CONSTRAINT\s+deliverables_type_check\s+CHECK\s*\(\s*type\s+IN\s*\(([^)]*)\)/i,
    ]
    for (const re of patterns) {
      const m = stripped.match(re)
      if (m) found = { types: quotedValues(m[1]), source: name }
    }
  }
  if (!found) throw new Error('deliverables_type_check definition not found in migrations')
  return found
}

function loadMigrations(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS_DIR, name), 'utf8') }))
}

function diff(a: readonly string[], b: readonly string[]): string[] {
  const bs = new Set(b)
  return a.filter((x) => !bs.has(x)).sort()
}

describe('deliverable type contract: app DeliverableType vs DB deliverables_type_check', () => {
  const appTypes = parseAppDeliverableTypes(readFileSync(PLATFORM_TYPES, 'utf8'))
  const db = parseDbDeliverableTypes(loadMigrations())

  it('parses both sides non-trivially', () => {
    expect(appTypes.length).toBeGreaterThan(5)
    expect(db.types.length).toBeGreaterThan(5)
    expect(appTypes).toContain('report')
    expect(db.types).toContain('report')
  })

  it('has no NEW app-only type beyond the documented known gaps', () => {
    const appOnly = diff(appTypes, db.types)
    expect(diff(appOnly, KNOWN_APP_ONLY_GAPS)).toEqual([])
  })

  it('keeps the known-gap allowlist honest (every listed gap is still app-only)', () => {
    const appOnly = diff(appTypes, db.types)
    // A listed type the DB now allows (or the app no longer declares) must be removed.
    expect(diff(KNOWN_APP_ONLY_GAPS, appOnly)).toEqual([])
  })

  it('has no DB-only type the app does not declare', () => {
    expect(diff(db.types, appTypes)).toEqual([])
  })
})

describe('deliverable type contract: parser and detection behavior', () => {
  const app = `export type DeliverableType =\n  | 'report'\n  | 'video'\n  | 'video_script'\n\nexport type X = 1\n`
  const create = {
    name: '001_create.sql',
    sql: `CREATE TABLE IF NOT EXISTS deliverables (\n id text,\n type text NOT NULL\n -- comment ('ignored')\n CHECK (type IN ('report', 'video')),\n title text\n);`,
  }

  it('parses the TS union and the CREATE TABLE CHECK', () => {
    expect(parseAppDeliverableTypes(app)).toEqual(['report', 'video', 'video_script'])
    expect(parseDbDeliverableTypes([create]).types).toEqual(['report', 'video'])
  })

  it('a later ADD CONSTRAINT migration supersedes the CREATE TABLE definition', () => {
    const widen = {
      name: '002_widen.sql',
      sql: `ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;\nALTER TABLE deliverables ADD CONSTRAINT deliverables_type_check CHECK (type IN ('report','video','video_script'));`,
    }
    const parsed = parseDbDeliverableTypes([widen, create])
    expect(parsed.source).toBe('002_widen.sql')
    expect(parsed.types).toEqual(['report', 'video', 'video_script'])
  })

  it('detects a new app-only type, a closed gap, and a DB-only type', () => {
    const appTypes = ['report', 'video', 'video_script', 'brand_new']
    const dbTypes = ['report', 'video', 'legacy_only']
    const allow = ['video_script', 'code_review']
    const appOnly = diff(appTypes, dbTypes)
    expect(diff(appOnly, allow)).toEqual(['brand_new'])
    expect(diff(allow, appOnly)).toEqual(['code_review'])
    expect(diff(dbTypes, appTypes)).toEqual(['legacy_only'])
  })
})
