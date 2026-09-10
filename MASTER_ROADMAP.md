# MASTER_ROADMAP.md

> Foreman SoT: roadmap map with **explicit source conflicts**. Do not silently reconcile.

| Field | Value |
| --- | --- |
| **Canonical working branch** | `feat/phase-5-6-launch-integrity` |
| **HEAD before this SoT pack commit** | `b5283625f7e6f78a9382a9a51d4340abdee0f2da` |
| **`origin/master` at SoT creation** | `95dab5fb…` (`95dab5f feat(billing): meter spokesperson video usage by rendered seconds`) |
| **Ahead of master** | **5 commits** on feat (`git rev-list --left-right --count origin/master...HEAD` → `0 5`) |

---

## Declared “official” Launch Roadmap (Phases 7–12)

Cited by multiple sources as the Active Execution Roadmap in `Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md`, mirrored in `docs/KOOLERR_MASTER_TRACKER.md` and (claimed) `docs/status.json`.

### Version A — README.md + CLAUDE.md (Phase 7 done; Phase 8 next)

| Phase | Name | Status per README / CLAUDE.md |
| --- | --- | --- |
| 7 | Launch Readiness | ✅ Complete (`phase-7-complete`) |
| 8 | Final Product Validation | **Next (awaiting approval)** |
| 9 | Koolerr Academy | Planned — required before any beta customer |
| 10 | Private Beta | Planned |
| 11 | Public Launch | Planned |
| 12 | Scale & Optimization | Planned |

Evidence: `README.md` Roadmap table; `CLAUDE.md` § Current Phase.

### Version B — FOUNDATION_003 + MASTER_TRACKER + status.json current[10] (Phases 7–9 done; Phase 10 in progress)

| Phase | Name | Status per FOUNDATION_003 / Tracker / status.json |
| --- | --- | --- |
| 7 | Launch Readiness | ✅ Complete (`phase-7-complete`) |
| 8 | Final Product Validation | ✅ Complete (`phase-8-complete`) |
| 9 | Koolerr Academy | ✅ Complete (`phase-9-complete`) |
| 10 | Private Beta | 🔄 In progress (`phase-10-beta-milestone-2` / Milestone 2 Complete) |
| 11 | Public Launch | ⬜ Planned |
| 12 | Scale & Optimization | ⬜ Planned |

Evidence:

- `Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md` Active Execution Roadmap table (Last Updated note 2026-07-20).
- `docs/KOOLERR_MASTER_TRACKER.md` Launch Roadmap table + §5 Current Phase.
- `docs/status.json` `current[10]` OFFICIAL ROADMAP string claiming Phases 7–9 complete and Phase 10 in progress; `remaining[0–2]` Phase 10 ongoing / 11 / 12.

**CONFLICT (do not resolve here):** README/CLAUDE assert Phase 8 is next; FOUNDATION_003 / Tracker / status.json assert Phases 8–9 complete and Phase 10 in progress. Founder must pick the binding narrative — listed in `DECISIONS.md`.

---

## Parallel / historical numbering (preserved)

- **Architectural Phase 1–5+** in `FOUNDATION_003` (long-term platform evolution) — distinct from Launch Phases 7–12.
- **Historical delivery Phase 1–10** in Tracker Progress Ledger — preserved as history; Launch 7–12 supersedes for forward work (`FOUNDATION_003`, Tracker disambiguation notes).
- **Experience Workstream** (incl. Phase 13 Slices A/B/C) runs alongside Launch roadmap (`FOUNDATION_003`, `docs/PHASE_13_EXPERIENCE_WORKSTREAM.md`, ADR-023). Tracker warns: “Phase 11/12” is ambiguous — qualify **Launch** vs **Experience**.
- **Branch name** `feat/phase-5-6-launch-integrity` refers to product Phases 5–6 (Core V1 Experiences / Launch Integrity) documented in `docs/status.json` current entries and `PHASE_7_COMPLETION.md` preamble — not Launch Phase numbers 5–6.

---

## Product work visible on this feat branch (ahead of master)

Commits `origin/master..HEAD` (newest first):

1. `b528362` docs: record Step 6 provider verification
2. `f1dabd6` fix(video): improve create video selection visibility
3. `cf1d2ab` docs: record Step 5 production proof
4. `97aa008` feat(video): complete customer video creation experience
5. `9a48b27` feat(publishing): add resilient YouTube publishing and cron auth

`docs/status.json` `current[0–2]` record Step 6 / Step 5 / Step 4 as complete & founder-accepted (provider verification, production video proof, customer video creation). Treat as **branch evidence**, not as silently merging the README vs Tracker phase conflict.
