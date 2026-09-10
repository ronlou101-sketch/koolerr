# Stale SoT PR Triage (Disposition Record)

**Status:** Disposition record only — **non-operative**  
**Date:** 2026-09-10  
**Comparison baseline:** master `b11f03e4fd3837f1e1d000aa85cba1a6cd40df3c` (`b11f03e` — merge of PR #29 SoT tip reconcile)  
**Architect:** `1a552740…` (allowlist); recommendation lineage `5db4c146…`  
**Founder authorization:** triage disposition record only; AMG remains **parked**  
**Authors:** KOOLERR FOREMAN / Claude under Architect + Founder direction

> **Hard constraints.** This file is a **read-only disposition record**. Creating or merging it
> performs **no** merge, close, rebase, update, comment, review submission, branch modification, or
> other remote PR operation on PRs **#7**, **#9**, **#11**, **#14**, **#15**, or any other PR
> (including **PR #1**). Recommendations below are **not** executed actions.

---

## Scope / exclusions

**In scope:** disposition recommendations for exactly PRs **#7**, **#9**, **#11**, **#14**, **#15**.

**Out of scope / hard exclusions:**
- Any remote PR operation (merge / close / rebase / comment / review / branch edit)
- **PR #1** (separate product line; untouched)
- AMG activation or AMG policy edits
- Resolution, alteration, or reinterpretation of **C2–C7**
- Credentials, secrets, live-provider work, deploy, code, tests, CI
- Inventing Independent QA evidence

**Founder-reserved:** executing any close/merge/rebase on the listed PRs remains a Founder decision after this record.

---

## Summary table

| PR | Title (concise) | Recommended disposition | Executed? |
| --- | --- | --- | --- |
| #7 | SoT after NavDropdown PR #6 | **Superseded by master** — recommend Founder **close without merge** | No |
| #9 | SoT after AccountMenu PR #8 | **Superseded by master** — recommend Founder **close without merge** | No |
| #11 | SoT after empty/error PR #10 | **Superseded by master** — recommend Founder **close without merge** | No |
| #14 | SoT after root-error PR #12 | **Superseded by master** — recommend Founder **close without merge** | No |
| #15 | SoT after global-error PR #13 | **Superseded by master** — recommend Founder **close without merge** | No |

Shared rationale: each PR is a historical docs-only SoT catch-up for a11y/error-UI merges. Later SoT reconciles on master (notably Phase **7.9** PR **#24** and tip reconcile PR **#29**) already carry current tip state through PRs **#24–#28**. Merging these stale PRs would reintroduce obsolete tip/slice language and risk conflicting with reconciled SoT.

---

## PR #7

- **Number / URL:** [#7](https://github.com/ronlou101-sketch/koolerr/pull/7)
- **Title:** docs(sot): reconcile SoT after NavDropdown PR #6
- **Head:** `docs/sot-post-pr6-reconcile` @ `5b5d419d92b7…`
- **Files in PR:** `ACTIVE_SLICE.md`, `COMPLETED_WORK.md`, `CURRENT_STATE.md`, `DECISIONS.md`
- **Observed stale/overlap vs master `b11f03e`:** PR body records SoT after PR #6 (`b2f9327…`). Master tip SoT (PR **#29**) already documents later a11y/error slices and PRs **#24–#28**. PR #9’s own notes already called #7 superseded (left open).
- **Recommended disposition:** **Superseded by master** — retain for Founder review; recommend **close without merge**.
- **Evidence:** PR files are SoT-only catch-up; tip reconcile on master is newer and broader; no unique Phase 8 / AMG facts present only on #7.
- **Founder-reserved blocker:** closing requires explicit Founder action (this record does not close it).

---

## PR #9

- **Number / URL:** [#9](https://github.com/ronlou101-sketch/koolerr/pull/9)
- **Title:** docs(sot): reconcile SoT after AccountMenu PR #8
- **Head:** `docs/sot-post-pr8-reconcile` @ `64af793736f6…`
- **Files in PR:** `ACTIVE_SLICE.md`, `COMPLETED_WORK.md`, `CURRENT_STATE.md`, `DECISIONS.md`
- **Observed stale/overlap vs master `b11f03e`:** Catch-up after PR #8; notes claim #7 superseded. Later open PRs #11/#14/#15 and master PR #29 supersede this tip state.
- **Recommended disposition:** **Superseded by master** — recommend **close without merge**.
- **Evidence:** Same four SoT paths as later reconciles; master tip already records AccountMenu-era work among closed historical slices and current tip after #24–#28.
- **Founder-reserved blocker:** close remains Founder-gated.

---

## PR #11

- **Number / URL:** [#11](https://github.com/ronlou101-sketch/koolerr/pull/11)
- **Title:** docs(sot): reconcile SoT after empty/error PR #10
- **Head:** `docs/sot-post-pr10-reconcile` @ `376692008738…`
- **Files in PR:** `ACTIVE_SLICE.md`, `COMPLETED_WORK.md`, `CURRENT_STATE.md`, `DECISIONS.md`
- **Observed stale/overlap vs master `b11f03e`:** Catch-up after PR #10; notes claim #7/#9 superseded. Superseded by later SoT PRs and master #29.
- **Recommended disposition:** **Superseded by master** — recommend **close without merge**.
- **Evidence:** Docs-only SoT; tip language predates Phase 7.9 / AMG / hermetic evidence records now on master.
- **Founder-reserved blocker:** close remains Founder-gated.

---

## PR #14

- **Number / URL:** [#14](https://github.com/ronlou101-sketch/koolerr/pull/14)
- **Title:** docs(sot): reconcile SoT after root-error PR #12
- **Head:** `docs/sot-post-pr12-reconcile` @ `944240429966…`
- **Files in PR:** `ACTIVE_SLICE.md`, `COMPLETED_WORK.md`, `CURRENT_STATE.md`, `DECISIONS.md`
- **Observed stale/overlap vs master `b11f03e`:** Catch-up after PR #12; notes claim #7/#9/#11 superseded. Superseded by #15 chain intent and master #29.
- **Recommended disposition:** **Superseded by master** — recommend **close without merge**.
- **Evidence:** Same SoT four-file pattern; no unique facts absent from master tip reconcile.
- **Founder-reserved blocker:** close remains Founder-gated.

---

## PR #15

- **Number / URL:** [#15](https://github.com/ronlou101-sketch/koolerr/pull/15)
- **Title:** docs(sot): reconcile SoT after global-error PR #13
- **Head:** `docs/sot-post-pr13-reconcile` @ `496e6b5c2c39…`
- **Files in PR:** `ACTIVE_SLICE.md`, `COMPLETED_WORK.md`, `CURRENT_STATE.md`, `DECISIONS.md`
- **Observed stale/overlap vs master `b11f03e`:** Latest of the early SoT catch-up chain after PR #13; notes claim #7/#9/#11/#14 superseded. Still older than Phase **7.9** (#24) and tip reconcile (#29) on master.
- **Recommended disposition:** **Superseded by master** — recommend **close without merge**.
- **Evidence:** Master SoT tip already includes post-#13 history plus #16–#28 operational facts; merging #15 would regress tip/slice wording.
- **Founder-reserved blocker:** close remains Founder-gated.

---

## Cross-cutting notes

1. **Chain of self-supersession:** Later PRs in this set already documented earlier ones as superseded while leaving them open — matching the observed open set.
2. **No still-valid unique content identified** on these five heads relative to master `b11f03e` for current-tip authority; if Founder believes a specific historical O-record wording must be preserved verbatim from one head, that is a **Founder decision** (not selected here).
3. **C2–C7:** all five PRs claimed C conflicts unchanged; this triage does **not** resolve C2–C7.
4. **PR #1:** not in scope; remains **OPEN** / untouched.
5. **AMG:** remains **parked** / **NOT ACTIVATED**; unaffected by this record.

---

## Next Founder actions (optional; not executed here)

1. Review this disposition record.
2. If agreed: **close without merge** PRs #7, #9, #11, #14, #15 (Founder-executed or Founder-authorized).
3. Do **not** merge these PRs into master.
