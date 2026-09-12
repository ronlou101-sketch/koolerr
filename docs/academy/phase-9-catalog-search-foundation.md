# Phase 9 — Academy Catalog Search Foundation (Hermetic)

> **Status:** Founder-approved **docs/spec slice only** (2026-09-12). **Not complete. Not
> implemented. Not released.**
>
> **Named by** Architect **7126fa69**. **Allowlist approved by** Architect **32681030**
> (`authorized_scope: docs`).
>
> This specification defines **simple keyword matching** over the existing in-repo Academy
> catalog. Advanced filters and facets are **deferred**. It does **not** implement runtime
> search, and it does **not** complete Phase 8 or Phase 9.

---

## Authority and non-claims

| Fact | Binding record |
| --- | --- |
| Phase 8 — Final Product Validation | **DEFERRED/HELD** (Founder 2026-09-12). Live-provider requirement remains **unresolved / not closed**. Hermetic evidence on master (PRs **#21**, **#22**, **#23**, **#28**) is **preserved**. Phase 8 is **not complete**. |
| This slice | Academy Catalog Search Foundation (Hermetic) — docs/spec only |
| Existing `app/(platform)/academy` catalog | **Not** Phase 9 complete |
| Phase 9 — Koolerr Academy | **Not complete / not implemented / not released** |

Do not read this file as a Phase 8 or Phase 9 completion claim.

---

## Purpose

Specify a **hermetic**, **in-catalog** keyword search over the code-defined Academy catalog
already declared in `app/(platform)/academy/_lib/catalog.ts`.

The catalog is static and in-repo (`COURSES`, `ONBOARDING_PATHS`, and the exported lookup
helpers). This slice depends on that availability and on the **stable fields already on
those types**. It does not add fields, tags, or a second catalog.

---

## Search surface

The search surface is the **existing Academy catalog** presented on the in-platform Academy
route (`/academy`, customer-facing label “Learn”):

1. **Onboarding paths** — `ONBOARDING_PATHS`
2. **Courses** — `COURSES`
3. **Modules and lessons** nested under those courses — `Course.modules` / `Module.lessons`

Search reads only that in-repo catalog. It does not query providers, other platform
surfaces, or an external index.

---

## Input contract

| Input | Contract |
| --- | --- |
| Name | `query` |
| Type | string |
| Normalization | Trim leading and trailing whitespace. Compare case-insensitively. |
| Empty after trim | Treat as an **empty query** (see Empty-query behavior). Whitespace-only is empty. |
| Semantics | One simple keyword / phrase. The trimmed string is matched as a whole substring. No operators, no boolean logic, no wildcards, no stemming, no fuzzy match, no facets, no filters. |

No other inputs are specified (no tag, audience, duration, or path filters). Those are
advanced filters / facets and are **deferred**.

---

## Catalog fields (existing contract only)

The catalog contract in `app/(platform)/academy/_lib/catalog.ts` defines these types and
fields. **There are no tag or facet fields.** Do not invent them.

### `Course`

`id`, `title`, `description`, `audience`, `icon`, `modules`

### `Module`

`id`, `title`, `lessons`

### `Lesson`

`id`, `title`, `summary`, `estimatedMinutes`, optional `videoUrl`, `content`, optional `resources`

`Lesson.content` is `LessonContent`: `overview`, `walkthrough`, `bestPractices`,
`commonMistakes`, `troubleshooting` (`TroubleshootingItem`: `problem`, `solution`).
`Lesson.resources` items are `LessonResource`: `label`, `href`.

### `OnboardingPath`

`id`, `customerType`, `title`, `description`, `courseIds`

---

## Matchable fields

Simple keyword matching uses **title** plus the descriptive metadata fields that actually
exist on each entity. No tags exist on this catalog; none are matched.

| Entity | Matchable fields | Not matchable (this spec) |
| --- | --- | --- |
| Course | `title`, `description`, `audience` | `id`, `icon`, `modules` (container) |
| Module | `title` | `id`, `lessons` (container) |
| Lesson | `title`, `summary` | `id`, `estimatedMinutes`, `videoUrl`, `content` (lesson body), `resources` |
| OnboardingPath | `title`, `description`, `customerType` | `id`, `courseIds` (id list) |

A catalog entity **matches** when the normalized `query` is a case-insensitive substring of
**any** of that entity’s matchable fields.

Lesson body (`content.*`) and resource labels are **not** catalog-listing metadata and are
out of scope for this foundation. Identifiers, icons, numeric duration, and optional video
URLs are not keyword metadata.

---

## Returned catalog fields

Each result is a projection of an existing catalog entity. Do not add score, rank,
highlight, or invented metadata.

Parent identity uses existing `id` / `title` fields on the parent course or module so a
result can be located in the catalog. Those are not new fields.

### Course result

`id`, `title`, `description`, `audience`, `icon`

### Module result

`id`, `title`, plus parent course `id` and `title`

### Lesson result

`id`, `title`, `summary`, `estimatedMinutes`, plus parent course `id` / `title` and parent
module `id` / `title`

### Onboarding-path result

`id`, `customerType`, `title`, `description`, `courseIds`

Optional `videoUrl` and `resources` remain on the `Lesson` type but are **not** required
on a search result. Lesson `content` is not returned by catalog search.

---

## Empty-query behavior

If `query` is empty after trim (including whitespace-only):

- Do **not** error.
- Return the **unfiltered catalog** in source order: every `ONBOARDING_PATHS` entry, every
  `COURSES` entry, and every nested module and lesson.
- This is the same set the Academy catalog already exposes; search does not hide it.

---

## No-results behavior

If `query` is non-empty after trim and no catalog entity matches:

- Return an **empty result list**.
- Surface a no-results state.
- Do **not** substitute recommendations, other courses, live-provider content, or results
  from outside this catalog.

---

## Deterministic ordering

Ordering is **catalog source order**, not relevance rank:

1. Onboarding paths in `ONBOARDING_PATHS` array order.
2. Courses in `COURSES` array order.
3. Under each matching-or-included course: modules in `course.modules` order; lessons in
   `module.lessons` order.

The same `query` against the same in-repo catalog must produce the same sequence every
time. No personalization, recency, or popularity reordering.

---

## Dependencies

- In-repo catalog availability: `COURSES`, `ONBOARDING_PATHS`, and the existing types /
  helpers in `app/(platform)/academy/_lib/catalog.ts`.
- Stable fields listed above. This spec adds none.

---

## Explicitly excluded

This slice does **not** specify or authorize:

- Live-provider results or any provider call
- Federated or global search outside the Academy catalog
- Analytics
- Personalization
- External indexing
- AMG (remains **parked / NOT ACTIVATED**)
- Credentials, secrets, or new environment variables
- Runtime implementation, UI code, executable tests, or fixtures that need network
- Advanced filters / facets (deferred by Architect **7126fa69**)
- Phase 8 live-provider / Zone A work (Founder **DEFERRED/HELD**)
- A claim that Phase 8 or Phase 9 is complete

---

## Documentary hermetic test-plan outline

Outline only — **cases, not executable tests**. Do not add test files or network fixtures.

| Case | Intent |
| --- | --- |
| Matching result | A non-empty query that appears in a matchable field (for example a course `title`) returns that entity with only the returned catalog fields above. |
| Multiple results | A query that matches more than one entity returns all matches, each projected from the existing catalog contract. |
| No result | A query that matches no matchable field returns an empty list (no-results behavior). |
| Empty / whitespace query | `""` and whitespace-only queries are empty queries: unfiltered catalog, no error. |
| Deterministic result order | The same query against the same catalog yields the same sequence (source order; not rank). |

---

## Allowlist for this docs slice (Architect **32681030**)

1. `docs/academy/phase-9-catalog-search-foundation.md` (this file; new)
2. `README.md`
3. `CLAUDE.md`
4. `DECISIONS.md`
5. `CURRENT_STATE.md`
6. `ACTIVE_SLICE.md`
7. `COMPLETED_WORK.md`
8. `docs/status.json`
