# ApnaTutor — working notes for Claude

India-first tutor marketplace. Students post tuition requirements free; tutors spend credits to unlock contact details. UrbanPro's model, built from scratch.

## Read these first

Each file has exactly one job. Do not duplicate status between them — that is how they drift.

1. **`docs/SOURCE_OF_TRUTH.md`** — canonical. Domain glossary, business rules with real numbers, data model, API conventions, and the architecture decision log. **If anything contradicts it, it is wrong.** Changing a rule means editing this file in the same commit.
2. **`docs/TASKS.md`** — the V1 task tree, `M1-03.2` style IDs. **The only place a box gets ticked.** Reference task IDs in commit messages; never renumber them.
3. **`docs/PENDING.md`** — open decisions, blockers, deliberate debt, risks. Read at the start of each milestone.
4. **`docs/PROGRESS.md`** — dated journal of what shipped. Start at "Next 3 actions".
5. **`docs/PLAN.md`** — milestone shape and done-criteria. No checkboxes by design.

## Layout

```
backend/    Spring Boot 4.1.1, Java 26, Maven (wrapper only - no global mvn)
frontend/   Next.js + TypeScript + Tailwind
scripts/    db-setup.sql, db-reset.ps1
docs/       the three files above
```

## Commands

```powershell
cd backend;  .\mvnw.cmd spring-boot:run      # API on :8080
cd backend;  .\mvnw.cmd verify               # unit + integration tests
cd frontend; npm run dev                     # UI on :3000
.\scripts\db-reset.ps1                       # wipe + replay migrations
```

## Configuration

**One `.env` at the repo root, read by both apps.** Never introduce a second one.

- Backend: `spring.config.import` in `application.yml` loads it as a property source (no dotenv dependency — Spring parses it natively via the `[.properties]` hint). It tries `./.env` and `../.env`, since the working directory differs between running from the repo root and from `backend/`.
- Frontend: `next.config.ts` calls `loadEnvConfig("..")` — Next only auto-discovers `.env` in its own directory, so the parent is passed explicitly.

`.env` is git-ignored. When you add a variable, add it to `.env.example` too. Everything has a working local default, so a missing `.env` degrades rather than crashes (`optional:` prefix) — real deployments supply actual environment variables instead of a file.

## Environment specifics

- **Windows + PowerShell.** `&&` does not chain — use `;` or `if ($?) { }`.
- **No Docker anywhere.** PostgreSQL 18 runs as a native Windows service. This is a deliberate choice (ADR #5), not an oversight.
- **Therefore no Testcontainers.** Integration tests run against the real local `apnatutor_test` database.
- **Java 26**, not an LTS (ADR #4). If a bytecode-manipulating library breaks, the documented fallback is Temurin 21.
- **No global Maven.** Always `.\mvnw.cmd`.
- Local Postgres superuser password is `postgres`; app role is `apnatutor` / `apnatutor`. Local only.

## Spring Boot 4 gotchas

Boot 4 renamed things, so most tutorials and Boot 3 answers will not match this `pom.xml`:
- The web starter is `spring-boot-starter-webmvc`, **not** `spring-boot-starter-web`.
- Test support is split per-starter: `spring-boot-starter-webmvc-test`, `-data-jpa-test`, etc., instead of one `spring-boot-starter-test`.

Check the actual `pom.xml` before assuming a dependency name.

## Next.js 16 gotcha

Next 16 has breaking changes relative to most training data and tutorials. Authoritative docs ship inside the repo at `frontend/node_modules/next/dist/docs/` — **read the relevant guide there before writing frontend code**, rather than relying on remembered App Router conventions.

`frontend/AGENTS.md` and `frontend/CLAUDE.md` are generated and re-added by `next dev`. Leave them committed; deleting them just recreates an uncommitted change.

## Rules that are not negotiable

These exist to keep v2 (booking, lesson payments, commission) additive instead of a rewrite. Both are explained in SOURCE_OF_TRUTH.md §4.

1. **`credit_transactions` is append-only.** No UPDATE, no DELETE. `credit_wallets.balance` is a cache; the ledger is the authority. Any disagreement means the ledger is right.
2. **`lead_unlocks` is a generic engagement record**, carrying `engagement_type`. A v2 booking is another type on the same connection graph.

Plus:
- **Money is stored in paise as `BIGINT`.** Never float. Column names end in `_paise`.
- **Credits are integers.** Never fractional.
- **Flyway migrations are forward-only.** Never edit one that has been applied — write a new one. `ddl-auto` is `validate` everywhere, including local.
- **Entities never leave the service layer.** Controllers speak DTOs (records).
- **Cross-module calls go through service interfaces**, never another module's repository or entity.
- **Secrets come from env vars only.** `.env.example` documents the shape; nothing secret is committed.
- `unlock_cost_credits` is **locked onto the requirement at creation**. Repricing must never move the price of a lead a tutor is already looking at.

## Housekeeping

When you finish a chunk of work, in the same session:

1. Tick the boxes in `docs/TASKS.md` (status lives there and nowhere else).
2. Add a dated changelog entry to `docs/PROGRESS.md` and refresh its "Next 3 actions".
3. Update `docs/PENDING.md` if you resolved a decision, hit a blocker, or knowingly took on debt.

A session that ends without this leaves the next one blind.
