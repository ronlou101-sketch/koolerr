# ACTIVE_SLICE.md

> Foreman SoT: the **one** active slice for agent work right now.

| Field | Value |
| --- | --- |
| **Canonical working branch** | `feat/phase-5-6-launch-integrity` |
| **HEAD before SoT pack commit** | `b5283625f7e6f78a9382a9a51d4340abdee0f2da` |
| **HEAD after SoT pack commit** | *(filled in commit / PR body; see git)* |

---

## Active slice (this work)

**Name:** Establish Foreman operating foundation / canonical Source-of-Truth pack.

**Scope:**

- Create exactly nine root markdown SoT files (this pack).
- Commit and push on `feat/phase-5-6-launch-integrity`.
- Open PR to `master`.
- **Do not** merge. **Do not** deploy. **Do not** change app / infra / secrets.

**Done when:** PR open with exactly these nine files added (plus any pre-existing branch commits noted), founder can review conflicts listed in `DECISIONS.md`.

---

## Explicitly NOT claimed complete by this slice

Do **not** mark as complete solely because of this documentation PR:

- Launch Phase 8 / 9 / 10 product outcomes (sources conflict — see `MASTER_ROADMAP.md`).
- Campaign Rendering production M2 / full runtime proof.
- Independent QA pass.
- Any app feature, migration, billing, auth, or provider change.

Product “current” strings in `docs/status.json` (Steps 4–6, CR-*, Phase 13, etc.) remain **historical / parallel evidence** until founder re-points live status after SoT adoption.
