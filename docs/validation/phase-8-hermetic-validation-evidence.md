# Phase 8 hermetic validation evidence

| Field | Value |
| --- | --- |
| **Status** | **Phase 8 hermetic validation evidence only** — **not** live-provider validation; **not** production-ready |
| **Date/time (UTC)** | 2026-09-10T21:35:23Z |
| **Date/time (America/New_York)** | 2026-09-10 17:35:23 EDT (UTC-4) |
| **Immutable evaluated revision** | `c685e9533218bf1525b9988c2bf1ee81f677afb8` (`c685e95…`; matches master base) |
| **Branch** | `docs/phase-8-hermetic-validation-evidence` |
| **Architect requestId** | `35bdddf6…` |
| **Founder** | `t100u` |
| **Allowlist** | This file only (`docs/validation/phase-8-hermetic-validation-evidence.md`) |

## Explicit non-claims

- Hermetic pass **≠** live-provider validation.
- Hermetic pass **≠** production readiness.
- Hermetic pass **≠** security readiness.
- Hermetic pass **≠** deployment readiness.
- **AMG parked**; **PR #1 untouched**; **C2–C7 unresolved**.
- No credentials were requested, stored, or exposed.
- No live OpenAI / HeyGen / Higgsfield / ElevenLabs calls were made.

## Exact commands used

Captured from `/workspace/koolerr` at revision `c685e9533218bf1525b9988c2bf1ee81f677afb8`:

```bash
git rev-parse HEAD
# c685e9533218bf1525b9988c2bf1ee81f677afb8

date -u
# Thu Sep 10 21:35:23 UTC 2026

node -v
# v20.19.2

npx vitest --version
# vitest/4.1.9 linux-x64 node-v20.19.2

npx vitest run tests/e2e/dogfooding-campaign-architect.journey.test.ts
# full non-secret output → /tmp/hermetic-journey.txt

npx vitest run tests/e2e/dogfooding-campaign-architect.performance.test.ts
# full non-secret output → /tmp/hermetic-perf.txt
```

Companion (evidence only; not a substitute for the two suite commands above):  
`npx vitest run tests/e2e/dogfooding-campaign-architect.performance.test.ts --reporter=verbose` to surface the suite’s `console.info` JSON sample stats.

## Runtime / tool versions

| Tool | Version |
| --- | --- |
| Node | `v20.19.2` |
| Vitest (local, package.json `^4.1.9`) | `4.1.9` (`vitest/4.1.9 linux-x64 node-v20.19.2`) |
| OS (agent box) | Linux (hermetic Vitest `node` environment) |

**Note:** Working tree had no checked-in `node_modules`. Local install was provided via symlink to an existing on-box clone’s `node_modules` (vitest `4.1.9`) so suites resolve project deps without live-provider credentials. Bare `npx vitest` before that symlink resolved a remote Vitest 5.x and failed config load (`Cannot find module 'vitest/config'`). No package files, tests, baselines, AMG docs, or ADR-027 were modified.

## Per-command results

### 1) Journey E2E — `dogfooding-campaign-architect.journey.test.ts`

| Metric | Value |
| --- | --- |
| Exit status | **0** |
| Test files | 1 passed (1) |
| Tests | **1 passed (1)** |
| Vitest start | 21:34:52 UTC |
| Duration | **514ms** (transform 224ms, setup 0ms, import 280ms, tests 13ms, environment 0ms) |
| Log | `/tmp/hermetic-journey.txt` |

**Embedded non-secret summary:**

```
RUN  v4.1.9 /workspace/koolerr

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  21:34:52
   Duration  514ms (transform 224ms, setup 0ms, import 280ms, tests 13ms, environment 0ms)

EXIT:0
```

(Plugin advisory only: `vite-tsconfig-paths` detected; not a failure.)

### 2) Performance hermetic — `dogfooding-campaign-architect.performance.test.ts`

| Metric | Value |
| --- | --- |
| Exit status | **0** |
| Test files | 1 passed (1) |
| Tests | **1 passed (1)** |
| Vitest start | 21:34:54 UTC |
| Duration | **500ms** (transform 204ms, setup 0ms, import 262ms, tests 19ms, environment 0ms) |
| Log | `/tmp/hermetic-perf.txt` |

**Embedded non-secret summary (canonical run):**

```
RUN  v4.1.9 /workspace/koolerr

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  21:34:54
   Duration  500ms (transform 204ms, setup 0ms, import 262ms, tests 19ms, environment 0ms)

EXIT:0
```

**Sample stats** (from companion `--reporter=verbose` run at 21:35:17 UTC; same suite, hermetic path):

```json
{
  "scenario": "createCampaign→engagement_run→deliverables",
  "profile": "sequential",
  "sequentialRuns": 5,
  "perRunCeilingMs": 5000,
  "totalCeilingMs": 25000,
  "durationsMs": [1.41, 1.57, 1.66, 2.22, 15.61],
  "minMs": 1.41,
  "maxMs": 15.61,
  "meanMs": 4.5,
  "medianMs": 1.66,
  "totalElapsedMs": 23.41,
  "note": "Hermetic local Vitest baseline — NOT production capacity / NOT live-provider / NOT M2"
}
```

Ceilings held: per-run max 15.61ms ≪ 5000ms; total 23.41ms ≪ 25000ms. These timings are **local hermetic** only — **not** live-provider latency and **not** production capacity.

## Environment assumptions

- Hermetic Vitest **node** environment (no browser/Playwright requirement for these suites).
- **Mocked** `modelGateway` (in-process `vi.fn` double); deterministic JSON/text responses labeled `gpt-4o-hermetic`.
- **No** live OpenAI / HeyGen / Higgsfield / ElevenLabs (or other provider) HTTP.
- **No** env secrets, deploy steps, or production endpoints exercised.
- In-memory repositories only; fresh state per test / per sequential sample.
- Repository-defined hermetic suites (`npm test` ≡ `vitest run`); commands above are the scoped E2E + perf subsets.

## Mocks / fixtures / stubs (read-only from the two test files)

Shared hermetic boundaries (both files; doubles live in-file):

| Boundary | Mechanism |
| --- | --- |
| `@/shared/model-gateway` | `vi.mock` → `modelGateway.invoke = vi.fn()` with deterministic `installDeterministicModelGateway()` |
| `@/shared/lib/logger` | `vi.mock` → no-op `info` / `warn` / `error` |
| Dogfooding persistence | `InMemoryDogfoodingRepository` via `_configureDogfoodingRepository` |
| Deliverables persistence | `InMemoryDeliverablesRepository` via `_configureDeliverablesRepository` |
| Workforce engine persistence | `InMemoryWorkforceEngineRepository` via `_configureWorkforceEngineRepository` |
| Business brain persistence | `InMemoryBusinessBrainRepository` via `_configureBusinessBrainRepository` |

Gateway actions stubbed: `market_research`, `create_campaign_strategy`, `create_marketing_plan`, `write_ad_copy`, `create_creative_direction` (includes video creative), `write_video_script`. Unexpected actions throw.

**Journey fixtures:** tenant `tenant_phase8_e2e`, org `org_phase8_dogfood_journey`, deterministic script title/body; path `createCampaign` → engagement run + `runDogfoodingPipeline` → listed `video_script` deliverable.

**Perf fixtures:** tenant `tenant_phase8_perf`, org `org_phase8_dogfood_perf`; `SEQUENTIAL_RUNS = 5`, `PER_RUN_CEILING_MS = 5000`, `TOTAL_CEILING_MS = 25000`; same create→run→deliverables path timed with `performance.now()`.

Real services under test (not mocked): `dogfoodingService`, `deliverablesService`, `workforceEngineService`, `businessBrainService`, `runDogfoodingPipeline`.

## Network-isolation posture

- In-process Vitest mocks only; no live HTTP to model/media providers.
- No Playwright / browser automation in these suites.
- No credentialed API clients exercised.
- Isolation is **test-double based**, not a network sandbox/firewall proof.

## Known limitations

- Evidence covers only the two named hermetic suites, not the full `vitest run` corpus.
- Agent box had empty `node_modules` until a local symlink; environment is not a dedicated perf lab.
- Perf numbers absorb cold transform / GC / shared-box noise; ceilings are intentionally generous.
- Logger and gateway doubles hide real observability and provider failure modes.
- In-memory repos do not prove Supabase/RLS/production persistence.
- Video/script deliverable content is gateway-stubbed text — not rendered media from HeyGen/Higgsfield/ElevenLabs.

## Validation gaps

- No live-provider end-to-end Campaign Architect path.
- No production deploy / smoke / security assessment.
- No M2 / production-capacity / load / soak proof.
- No Independent QA sign-off recorded here.
- Full suite / typecheck / build not re-run as part of this evidence-only doc.
- Media generation, billing, and external channel publish paths not exercised.

## Remaining Founder-executed live-provider validation dependency

**Founder-executed** live-provider validation remains required before any live-provider or production claim. That work must use Founder-held credentials and environments; this evidence document does **not** request, store, or expose secrets, and does **not** authorize or substitute for that step.

## Governance posture (unchanged)

- **AMG parked** (Accepted — not Activated; auto-merge eligibility remains empty until separate Founder activation).
- **PR #1 untouched.**
- **C2–C7 unresolved.**
- This commit is documentation evidence only under Architect `35bdddf6…` / Founder `t100u` authorization for hermetic recording — not activation, not merge policy change, not ADR-027 edit.

## Conclusion

Both repository-defined hermetic suites **passed** at immutable revision `c685e9533218bf1525b9988c2bf1ee81f677afb8` (journey exit 0, 1/1; perf exit 0, 1/1).  

**Hermetic pass ≠ live-provider / production / security / deployment readiness.**
