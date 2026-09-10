# KOOLERR_CONSTITUTION.md

> Foreman canonical Source-of-Truth (SoT) entry: constitutional authority and precedence.
> Evidence-based. Does not replace Foundation documents.

| Field | Value |
| --- | --- |
| **Canonical working branch (founder-authorized SoT locus)** | `feat/phase-5-6-launch-integrity` |
| **HEAD before this SoT pack commit** | `b5283625f7e6f78a9382a9a51d4340abdee0f2da` |
| **Sources** | `Foundation/FOUNDATION_000_CHARTER.md`, `Foundation/FOUNDATION_001`–`005`, `CLAUDE.md`, `docs/KOOLERR_ENGINEERING_CHARTER.md` |

---

## Highest authority

Per `Foundation/FOUNDATION_000_CHARTER.md`:

- The Charter is the highest governing document of Koolerr.
- Every future decision—technical, operational, financial, product, or strategic—must align with it.
- If any future document conflicts with the Charter, **the Charter prevails**.

Purpose / vision / mission (summarized from Charter, not restated as new doctrine):

- **Purpose:** transform how work is performed; build the operating system for AI Workforces.
- **Vision:** Operating System for AI Workforces — businesses hire intelligent departments of Digital Employees toward measurable outcomes.
- **Mission:** empower every business to operate with enterprise capabilities through trustworthy AI Workforces.

Permanent platform primitives named in the Charter include: Business Brain, Workforce Engine, Digital Employees, Model Gateway, Trust Engine, Orchestration Engine, Consent & Rights Ledger, Deliverable Framework.

---

## Authority hierarchy (evidence)

### From `CLAUDE.md` (Claude Code operating instructions)

1. `Foundation/FOUNDATION_000_CHARTER.md`
2. `Foundation/FOUNDATION_001_ARCHITECTURE.md`
3. `Foundation/FOUNDATION_002_ENGINEERING_PRINCIPLES.md`
4. `Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md`
5. `Foundation/FOUNDATION_004_PRODUCT_PRINCIPLES.md`
6. `Foundation/FOUNDATION_005_FOUNDER_DECISION_LOG.md`

Conflict rule in `CLAUDE.md`: when Foundation documents conflict with each other, the **lower-numbered** document prevails. When session instructions conflict with Foundation, Foundation prevails.

### From `docs/KOOLERR_ENGINEERING_CHARTER.md` §1

1. **NORTH_STAR.md** — cited in Engineering Charter as highest product vision authority (note: **no `NORTH_STAR.md` at repo root** was observed at SoT pack creation; unresolved reference — see `DECISIONS.md`).
2. `FOUNDATION_000_CHARTER.md`
3. `FOUNDATION_001`–`005`
4. `KOOLERR_ENGINEERING_CHARTER.md` (operationalizes Foundation; must not contradict it)
5. ADRs in `docs/adr/`
6. Initiative / slice / milestone plans
7. Prompts
8. Individual implementation decisions

Conflict rules from Engineering Charter: Foundation wins over Engineering Charter; Engineering Charter wins over prompts; ADRs win over implementations unless formally superseded.

### From `Foundation/FOUNDATION_005` Decision 013

Foundation documents are the highest architectural authority; no engineering/product/business decision overrides them.

---

## Standing of this SoT pack

This nine-file Foreman SoT pack is an **operational index and operating contract** for agents and humans. It does **not** supersede Foundation, ADRs, or the Engineering Charter. Where this pack and those sources disagree, **preserve both** and escalate — see `DECISIONS.md` unresolved conflicts.
