# Independent QA Gate #2 — Evidence Manifest Template

**Status:** **DEFINITION-ONLY** (not operational; not enforced)  
**Date:** 2026-09-10  
**Parent:** [README.md](./README.md)  
**Owner designation:** **TBD** (Founder follow-up)

> **Shared status (binding).**
>
> - **AMG / Auto-Merge Governance remains NOT ACTIVATED.**
> - These docs are **definition-only**; they do **not** create enforcement or approval authority.
> - Independent QA Gate #2 owner designation remains **TBD** (Founder follow-up); do not imply an assigned owner.
> - **Temporary Foreman QA is not Independent QA.**

---

## Hard constraint

**Do not** place secrets, credentials, tokens, private keys, or production data in this manifest or linked paste-ins. Use redacted pointers / non-sensitive artifact links only.

---

## Template

Copy fields below into a Gate #2 package (issue comment, PR note, or sibling record). Replace placeholders; leave unused optional fields as `N/A`.

```markdown
# Gate #2 Evidence Manifest

| Field | Value |
| --- | --- |
| Manifest ID | <!-- e.g. G2-EVID-YYYYMMDD-### --> |
| Change / PR reference | <!-- URL or number --> |
| Commit SHA(s) | <!-- full or short SHAs --> |
| Artifact identifiers / links | <!-- docs, logs, CI-less local command transcripts, SoT paths — no secrets --> |
| Reviewer identity or role placeholder | <!-- role placeholder only until owner designated; TBD OK --> |
| Independence attestation | <!-- "I am not the change author or submitting Foreman for this package" + date --> |
| Review date | <!-- YYYY-MM-DD (America/New_York labeled if needed) --> |
| Checklist results summary | <!-- pass/fail per C1–C9 or link to filled checklist --> |
| Linked validation outputs | <!-- commands run + result summary; attach/link non-sensitive logs --> |
| Findings | <!-- none | list --> |
| Exceptions | <!-- none | list with rationale --> |
| Disposition (link) | <!-- pointer to disposition record --> |
| Timestamp (UTC and local) | <!-- ISO-8601 UTC + America/New_York label --> |
| AMG status acknowledgment | NOT ACTIVATED — this manifest creates no enforcement |
| Owner acknowledgment | Gate #2 owner remains TBD |
```

### Artifact link table (expand as needed)

| Artifact ID | Description | Link / path | Sensitive? |
| --- | --- | --- | --- |
| A1 | | | No |
| A2 | | | No |
