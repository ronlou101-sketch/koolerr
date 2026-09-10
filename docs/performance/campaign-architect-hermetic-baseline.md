# Campaign Architect — Hermetic Performance Baseline (Phase 8)

Architect requestIds: `de6815fb` (slice) + `d9b878be` (allowlist)

## Explicit scope boundaries

| This baseline **IS** | This baseline is **NOT** |
| --- | --- |
| Hermetic local Vitest timing for the Campaign Architect dogfooding path | **NOT** production-capacity / load / soak testing |
| In-memory repositories + mocked `modelGateway` | **NOT** live-provider latency or throughput |
| Repeatable small sequential profile with generous ceilings | **NOT** M2 production proof |
| Guardrail that the journey still succeeds under local noise | **NOT** a SLA for hosted environments |

## Scenario

End-to-end path measured per sample:

1. `createCampaign` (dogfooding product entry)
2. Engagement run trigger + `runDogfoodingPipeline` (mocked gateway only)
3. Deliverables list assertion (`video_script` present for the run)

Same functional assertions as the hermetic journey E2E, timed as a unit.

## Hermetic setup

Copied into `tests/e2e/dogfooding-campaign-architect.performance.test.ts` (does **not** import or edit the journey file):

- `InMemoryDogfoodingRepository`
- `InMemoryDeliverablesRepository`
- `InMemoryWorkforceEngineRepository`
- `InMemoryBusinessBrainRepository`
- Deterministic `modelGateway.invoke` double (no network, secrets, or live providers)
- Logger mocked to silence side effects
- Fresh in-memory repos before **each** sequential sample

## Profile, metrics, and thresholds

| Knob | Value | Rationale |
| --- | --- | --- |
| Profile | `SEQUENTIAL_RUNS = 5` | Small, repeatable; avoids singleton-repo races from concurrency |
| Clock | `performance.now()` wall duration of one full journey | Simple local Vitest metric |
| Per-run ceiling | `PER_RUN_CEILING_MS = 5000` | Hermetic body is typically tens of ms; generous headroom for cold transform / GC / shared-box noise |
| Total ceiling | `TOTAL_CEILING_MS = 25000` | Covers five samples + setup resets without flaky hard SLA |
| Success gate | Journey assertions must pass every sample | Timing alone is insufficient — path must still complete |

Recorded sample stats (logged as JSON on the test): `minMs`, `maxMs`, `meanMs`, `medianMs`, and the raw `durationsMs` array.

Assumptions:

- Local Vitest / Node on a developer or agent box (not a dedicated perf lab).
- First-file transform cost may appear outside the timed loop; per-run numbers reflect the journey body after modules are loaded.
- Thresholds intentionally absorb variance; tighten only with documented evidence from repeated local runs.

## How to run

```bash
npx vitest run tests/e2e/dogfooding-campaign-architect.performance.test.ts
```

## How to update this baseline

1. Run the performance test several times locally; capture the JSON stats line from stdout.
2. Confirm journeys still succeed and observed `max` / `mean` remain well below ceilings.
3. If hardware or pipeline shape changes and ceilings become chronically tight **or** trivially loose, adjust `SEQUENTIAL_RUNS`, `PER_RUN_CEILING_MS`, and/or `TOTAL_CEILING_MS` in the performance test **and** update the table above in the same change.
4. Keep allowlist discipline: only the performance test + this doc (do not edit the journey E2E for baseline churn).
5. Never interpret this file as authorization for live-provider, production-capacity, or M2 claims.

## Related

- Functional hermetic journey: `tests/e2e/dogfooding-campaign-architect.journey.test.ts` (byte-stable; not modified by this baseline)
