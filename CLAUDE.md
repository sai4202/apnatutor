# ApnaTutor

India-first tutor marketplace. Students post tuition requirements free; tutors spend credits to unlock contact details. UrbanPro's model, built from scratch.

## Two independent projects

```
backend/    Spring Boot REST API   -> see backend/CLAUDE.md
frontend/   Next.js app            -> see frontend/CLAUDE.md
docs/       shared product docs
```

**`backend/` and `frontend/` are self-contained.** Each has its own `.env`, `.gitignore`, README and agent instructions, and each builds, tests and runs from its own directory. Neither reads a file outside itself; they meet only over HTTP.

**When working inside a project, read that project's `CLAUDE.md`** — it carries the build commands, stack gotchas and conventions. This file is only the map.

They share one git repo so an API change and its client update can land in a single commit. That is the only coupling; do not add more.

## Shared docs — read before changing behaviour

Each file has exactly one job. Do not duplicate status between them; that is how they drift.

1. **`docs/SOURCE_OF_TRUTH.md`** — canonical. Domain glossary, business rules with real numbers, data model, API conventions, decision log. **If anything contradicts it, it is wrong.** Changing a rule means editing this file in the same commit.
2. **`docs/TASKS.md`** — the V1 task tree, `M1-03.2` style IDs. **The only place a box gets ticked.** Reference task IDs in commit messages; never renumber them.
3. **`docs/PENDING.md`** — open decisions, blockers, deliberate debt, risks. Read at the start of each milestone.
4. **`docs/PROGRESS.md`** — dated journal of what shipped. Start at "Next 3 actions".
5. **`docs/PLAN.md`** — milestone shape and done-criteria. No checkboxes by design.

## Environment

Windows + PowerShell. `&&` does not chain — use `;` or `if ($?) { }`.

No Docker anywhere in this project (ADR #5): PostgreSQL 18 runs as a native Windows service, and integration tests use a real local test database rather than Testcontainers.

## Housekeeping

When you finish a chunk of work, in the same session:

1. Tick the boxes in `docs/TASKS.md` — status lives there and nowhere else.
2. Add a dated changelog entry to `docs/PROGRESS.md` and refresh its "Next 3 actions".
3. Update `docs/PENDING.md` if you resolved a decision, hit a blocker, or knowingly took on debt.

A session that ends without this leaves the next one blind.
