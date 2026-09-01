# ApnaTutor — Progress Journal

> Update this **in the same session as the code change**, never later. If a session ends without a changelog entry, the next session starts blind.

**Current milestone:** M1 — Accounts, profiles & trust
**Overall:** ███░░░░ M0 done · M1: auth + catalog done, profiles next · landing page and design system built

---

## Next 3 actions

Read this first when resuming. Keep it to exactly three, always current.

1. `M1-09` **file storage** — `FileStorage` interface + local-disk impl, photo and document upload with content-sniffed MIME validation, sanitised filenames. Unblocks `M1-08.6` (qualification documents) and the profile photo, which is the last thing standing between a complete profile and 100%.
2. `M1-10` verification ladder — submit ID and education documents, admin approve/reject, `verification_level` derivation, badges on the public profile.
3. `M1-07.2` student profile endpoints, then `M1-11`/`M1-12` — the frontend auth screens and tutor onboarding wizard that drive all of this.

Full breakdown in [TASKS.md](./TASKS.md); open decisions and debt in [PENDING.md](./PENDING.md).

---

## Milestone status

| Milestone | Status |
|---|---|
| M0 — Foundation | ✅ Done (2026-08-31) |
| M1 — Accounts, profiles & trust | 🟡 Next |
| M2 — Catalog & discovery | ⬜ Not started |
| M3 — Requirements & lead loop | ⬜ Not started |
| M4 — Credits & payments | ⬜ Not started |
| M5 — Reviews, admin & trust | ⬜ Not started |
| M6 — Polish & launch | ⬜ Not started |

---

## Changelog

### 2026-08-31 — Project born

**Decided**
- Name **ApnaTutor**, India-first, lead-credit business model (not booking-commission).
- Spring Boot REST backend + Next.js frontend + native PostgreSQL, no Docker.
- Full rationale for all ten founding decisions is in the SoT decision log.

**Environment audit (this machine)**
- Found: JDK 26, Maven/Gradle caches, IntelliJ.
- Missing: Node, Git, PostgreSQL, Maven CLI, any LTS JDK.
- Resolution: installed Node 24.19.0 LTS + Git 2.55.0 via winget; PostgreSQL 18 installing. Maven CLI not needed — the Maven wrapper (`mvnw.cmd`) is bundled. Stayed on JDK 26 rather than installing an LTS, because Spring Initializr lists Java 26 as supported for Boot 4.1.1 (ADR #4, with Temurin 21 as the documented fallback).

**Built**
- Repo at `C:\Users\HP\IdeaProjects\apnatutor`.
- Backend scaffolded from Spring Initializr: Boot 4.1.1, Java 26, Maven, with Web MVC, Security, Data JPA, Validation, Actuator, Flyway, PostgreSQL driver, Lombok, config processor.
- `docs/SOURCE_OF_TRUTH.md`, `docs/PLAN.md`, `docs/PROGRESS.md`.

**M0 completed — verified, not assumed**
- PostgreSQL 18.6 installed as service `postgresql-x64-18`; `psql` added to the user PATH; `apnatutor` role and both databases created with `pg_trgm`.
- Next.js 16.3.3 / React 19.2.8 / Tailwind 4 scaffolded.
- Single repo-root `.env` now feeds both apps — backend via `spring.config.import` (no dotenv dependency; Spring parses it natively with the `[.properties]` hint), frontend via `loadEnvConfig("..")` in `next.config.ts`. JWT secret generated with `crypto.randomBytes(48)`.
- `SecurityConfig` added: default-deny with an explicit public allowlist, CORS bound to the configured frontend origin, BCrypt encoder.
- **Verification actually run:** `mvnw verify` → BUILD SUCCESS, 1 test, 0 failures. `npm run build` → clean, TypeScript passed. `/actuator/health` → `status: UP`, `db: UP`. Page fetched from `localhost:3000` contained three server-rendered `UP` pills — so Next→Boot→Postgres is proven end to end, and proven *in the HTML source*, which is what the SEO strategy depends on.

**Notes for next time**
- Spring Boot 4.x renamed things: the starter is `spring-boot-starter-webmvc`, not `-web`, and test support is split into per-starter `*-test` artifacts. Boot 3 tutorials will not match this `pom.xml`.
- Local Postgres superuser password is `postgres`; app role is `apnatutor`/`apnatutor`. Local only.
- Deliberately deferred from M0 to M1: global error handler, `ApiError` shape, pagination wrapper, springdoc. There were no endpoints to apply them to yet, and building them against imagined endpoints tends to produce the wrong abstraction.

### 2026-08-31 — V1 task tree

**Added**
- `docs/TASKS.md` — 71 tasks with subtasks across M0–M6, permanent `M1-03.2` style IDs meant for commit messages.
- `docs/PENDING.md` — open decisions, blockers, deliberate debt, risk register. Kept deliberately distinct from the task list: it holds what a checklist cannot, and is not a copy of the unticked boxes.

**Restructured to stop status drift**
- PLAN.md lost its M1–M6 checkboxes; it now owns milestone *shape and rationale* only. TASKS.md is the sole place a box gets ticked. Its open-questions table moved into PENDING.md §1.

**Two sequencing bugs found and fixed while decomposing**
- **Catalog moved M2 → M1** (`M1-06`). Tutor profiles need subjects, boards, grades and locations to attach to; the onboarding wizard is unbuildable without them. Would have stalled mid-M1.
- **Credit ledger moved M4 → M3** (`M3-05`). The unlock endpoint spends credits, so M3 could not have been finished or tested with the ledger a milestone away. Admin credit grants now let the whole loop be exercised before any payment code exists.

**Also captured**
- The CSRF gap on the refresh endpoint is now tracked debt (PENDING.md T1) with its repayment pinned to `M1-04.5`, rather than living only as a code comment.

### 2026-08-31 — Backend and frontend split into independent projects

**Restructured** (ADR #11). `backend/` and `frontend/` are now self-contained: each has its own `.env`, `.env.example`, `.gitignore`, `README.md` and `CLAUDE.md`, and neither reads a file outside its own directory. One git repo is retained so an API change and its client update can land in a single commit.

- `.env` → `backend/.env`; new `frontend/.env.local`. **This reverses the earlier shared repo-root `.env`**, which coupled the two at the filesystem level.
- `scripts/` → `backend/scripts/` (they are database scripts, backend-owned).
- `application.yml` now imports `./.env` only, never `../.env`.
- `next.config.ts` returned to a plain config — the custom `loadEnvConfig("..")` existed *only* because the file was in the parent. Next loads `.env.local` from its own directory by default.
- Root `.gitignore` trimmed to genuinely cross-cutting rules; each project owns its build-specific ones.
- Shared product docs stay in `docs/` — the business rules bind both sides, and splitting them would invite two diverging copies.

**Caught during the split:** `frontend/.gitignore` ships with a blanket `.env*` rule from create-next-app, which would have silently swallowed the new `.env.example`. Added a `!.env.example` negation.

**Verified after restructuring:** `mvnw verify` green, `npm run build` clean, and the full chain re-checked live — `/actuator/health` `UP`/`db: UP` and three server-rendered `UP` pills at `localhost:3000`.

### 2026-08-31 — M1-01 shared web plumbing (mostly)

- `ErrorCode` — stable machine codes with HTTP status attached to each, so the two cannot drift across handlers. Includes the M3/M4 codes SoT already names as contract.
- `ApiError` — the single error shape; `fieldErrors` omitted from JSON unless present.
- `ApiException` + factories, with stack-trace capture disabled: these are expected outcomes on hot paths, not faults.
- `GlobalExceptionHandler` — body/parameter validation, unreadable body, authentication, access denied, unmapped URL, and a catch-all. **Internals are logged, never returned.**
- `PageResponse<T>` with an entity→DTO mapping overload. Spring's `Page` is deliberately not serialised directly — its JSON shape is a version-dependent implementation detail.
- `CorrelationIdFilter` — honours an inbound `X-Correlation-Id`, **sanitised and length-capped** before it reaches a log line, clears MDC in a `finally` so pooled threads cannot inherit a stale ID. Log pattern updated to print it.

**`M1-01.4` (springdoc) — first recorded as blocked, then unblocked the same day. See the correction below.**

### 2026-08-31 — M1-01.4 springdoc: correction and unblock

**The blocker was not real.** I called springdoc unavailable for Spring Boot 4 on the strength of Maven Central's `solrsearch` API reporting 2.8.6 as the latest version. That field is cached and lags actual releases. The repository's own `maven-metadata.xml` lists 3.0.0-M1 through **3.1.0**, and the 3.x line is the Boot 4 line.

**Now working:**
- springdoc-openapi 3.1.0 pinned via a `springdoc.version` property (not managed by the Boot parent).
- `OpenApiConfig` — API metadata plus a declared `bearerAuth` scheme, so Swagger UI's Authorize button works the moment M1-04 issues tokens. Without it every protected endpoint would be untestable from the browser.
- Docs gated behind `APNATUTOR_API_DOCS_ENABLED`, **to be turned off in production** — an always-on schema dump is free reconnaissance.
- SecurityConfig permits the exact doc paths, including bare `/v3/api-docs` and `/v3/api-docs.yaml`.

**Verified live, not just compiled:** `/v3/api-docs` returns an OpenAPI 3.1.0 document titled "ApnaTutor API v1" with the `bearerAuth` scheme present, and `/swagger-ui.html` returns 200.

**Lesson recorded in `backend/CLAUDE.md` and PENDING.md:** to check whether a dependency version exists, read `repo1.maven.org/.../maven-metadata.xml`, not the search API. M1-01 is now complete except `M1-01.6` (idempotency).

### 2026-08-31 — M1-02, M1-03, M1-04: identity, OTP and JWT sessions

Phone + OTP authentication works end to end. **42 tests pass**, and the flow was also exercised live against the dev database.

**Schema** (`V2__identity.sql`, `V3__idempotency.sql`)
- `users`, `otp_codes`, `refresh_tokens`, `idempotency_keys`, with enum values constrained in the database as well as in Java, and `set_updated_at` triggers throughout.
- Email uniqueness is a *case-insensitive partial* index — two accounts must not differ only by capitalisation, but any number may have no email.

**`PhoneNumbers`** — E.164 normalisation, which turned out to matter more than expected. Without it the same person typing `98765 43210` and `+919876543210` gets two accounts, splits their reviews and credits across both, and sidesteps the OTP send-rate limit by varying the formatting. 22 unit tests cover it.

**OTP** — `SecureRandom` codes, BCrypt-hashed before storage, constant-time comparison, single-use, superseded by any newer code, 5 attempts per code, 5 sends per hour per phone. Registered and unregistered numbers return byte-identical responses, asserted by test — otherwise the endpoint is a free oracle for discovering which numbers hold accounts.

**Sessions** — 15-minute HS256 access tokens via Spring Security's Nimbus support (chosen over JJWT, which would have dragged in Jackson 2 against Boot 4's Jackson 3). 30-day refresh tokens stored as SHA-256, never in the clear, rotated on every use, with family-wide revocation on reuse. Bearer validation uses Spring's `oauth2ResourceServer` rather than a hand-rolled filter.

**Debt T1 repaid** (`M1-04.5`): the refresh route is cookie-authenticated, so the global CSRF disable does not protect it. It now requires `SameSite=Strict` plus an `X-Refresh-Request` header that HTML forms cannot set.

#### Three bugs caught before they shipped

1. **`ddl-auto: validate` caught a schema drift** — `token_hash` declared `CHAR(64)` in SQL against a `String` field expecting `VARCHAR`. `VARCHAR` is the better choice regardless: `CHAR` space-pads, which is a quiet hazard for a value compared for exact equality.

2. **The OTP attempt counter was being rolled back.** Recording a failed attempt and then rejecting the request are contradictory demands on one transaction: the rejection throws, the transaction is marked rollback-only, and the increment is discarded. The cap would never fire and a six-digit code — one million possibilities — would be brute-forceable. Fixed with `OtpAttemptRecorder` (`REQUIRES_NEW`).

3. **The same bug in refresh-token reuse detection**, found by the test written for it. `rotate()` revoked the compromised family and then threw, rolling the revocation back — detection that detects and then forgets, leaving a stolen token working until expiry. Fixed with `TokenFamilyRevoker` (`REQUIRES_NEW`).

> **Pattern worth remembering:** any security decision that must survive the exception reporting it needs its own transaction. Two instances in one milestone suggests there will be more — the M3 unlock path is the next place to watch.

**Also found:** Flyway's `cleanOnValidationError` was **removed in Flyway 9/10**, so the setting in `application-test.yml` was silently doing nothing. Replaced with an explicit `FlywayMigrationStrategy` in `TestFlywayConfig` that cleans and re-migrates, which also gives every test run the from-zero rebuild `M6-07` depends on.

### 2026-09-01 — M1-06 catalog, and the frontend design system

**Catalog** (`V4__catalog.sql`, `V5__catalog_seed.sql`) — 70 subjects across 7 categories, 10 boards, 19 grade levels, 10 cities, and localities (Hyderabad 20, Bengaluru 14, others shallow). Public endpoints under `/api/v1/public/catalog`, cached 6 hours: this is read on nearly every page load, changes maybe monthly, and is identical for every visitor.

**Launch-city assumption made rather than blocking.** Hyderabad is seeded deepest. Slugs only become permanent once a search engine indexes them, which is M6, so this stays cheap to change until then. Other cities are deliberately shallow — seeding hundreds of localities where we have no tutors creates empty pages, which `M2-08.4` has to mark `noindex` anyway. Decision D1 remains open in PENDING.md.

**Design system** — white ground, a single blue accent. Blue is doing real work here rather than being a preference: this is a marketplace where a parent hands a stranger their phone number and lets them into their home, so the palette has to read institutional and safe. One accent hue used sparingly also means anything rendered in blue is unambiguously *the* action on the page.

- Tokens in `globals.css` via Tailwind 4 `@theme`: a blue ramp, slate neutrals (a trace of blue so they sit with the accent rather than fight it), a constrained ~1.25 type scale, and brand-tinted shadows.
- Primitives in `components/ui.tsx` — hand-rolled rather than a component library, which for this many elements would cost more in bundle size and override-fighting than it saves.
- One `Container` sets page width everywhere, so section edges line up.
- 44px minimum touch targets; most traffic will be a thumb on a mid-range Android phone.
- One consistent `:focus-visible` ring, `prefers-reduced-motion` respected, a skip-to-content link, and `sr-only` labels where a visible one would clutter.
- **No dark mode, deliberately.** Every screen is designed against white, and a half-considered dark variant is worse than none.

**Pages** — landing, `/tutors`, `/login`, `/for-tutors`, `/post-requirement`. All Server Components except login. The homepage prerenders statically with hourly revalidation and ships **zero client JavaScript**, which is what the SEO strategy actually depends on.

**Login is real** and drives the M1 auth API end to end. The access token is held in React state and nowhere else — not `localStorage`, not `sessionStorage`, since anything readable by JavaScript is readable by a successful XSS. Refresh-on-load belongs in a shared auth provider (`M1-11.3`).

**Empty states are honest.** `/tutors` says there are no tutors rather than rendering fake cards, and `/post-requirement` disables its fields rather than silently discarding input. A demo that looks populated but is not makes real progress impossible to distinguish from a mockup.

**Caught while building:** Spring Data does not scan repository interfaces nested inside a class — the failure is an unhelpful "no qualifying bean" at startup. Also renamed `Location.city_` to `cityLevel`, because Spring Data treats `_` in a derived query name as a property-path separator, so `findByCity_True` would parse as `city.true`.

### 2026-09-01 — Dev mode with seeded test accounts, and a real background

**Signing in with no SMS provider.** A single `apnatutor.dev.enabled` switch, not three independent flags — one thing to turn off is one thing to forget to turn off. It seeds one account per role (`9999900001` student, `9999900002` tutor, `9999900003` admin, OTP `123456`), bypasses SMS for those numbers, skips their hourly send cap, and returns generated codes in the `/auth/otp/request` response so the login screen can fill them in.

**`DevModeGuard` is the control that makes this safe.** It refuses to start the application if dev mode is on alongside a real SMS provider or a `prod` profile. Left enabled in production, seeded accounts with a published OTP are an unauthenticated login for anyone who reads the README — so this is enforced by a startup failure, not a comment. Four tests cover it.

Seeded through an `ApplicationRunner` rather than a Flyway migration, deliberately: a migration runs in every environment it reaches, so published-credential accounts would land in production on the first deploy.

Test accounts are also **off in the test profile** — the auth tests assert real rate limits and random codes, and a fixed OTP would quietly bypass exactly what they exist to verify.

**Background redesign.** The flat white was reading as unfinished. Now layered: aurora colour fields, a masked dot field, hand-placed blurred orbs, and an feTurbulence film grain — the grain being the layer that actually matters, since it breaks up the smooth gradient ramps that band visibly on cheap panels, which is most of this audience's hardware. Section boundaries use a fading hairline rather than a full-width border. All CSS, no images, no JavaScript.

**Deliberately against the current trend.** The 2026 SaaS design writing converges on dark mode plus glassmorphism as a default. That language is aimed at developers evaluating B2B tools; here the visitor is a parent deciding who to let into their home, and dark glass reads as a crypto product rather than a trusted service. White and blue stays.

Hero stat tiles show real catalog counts (70+ subjects, 10 cities) and the unlock cap — capability claims, not invented user numbers, which the product could not back up on day one.

### 2026-09-01 — Landing page design iteration (three commits, one of them a revert)

**A design was built and rejected. Recording it so nobody rebuilds it.** The first attempt layered aurora gradients, blurred orbs and film grain over the white ground. The user's verdict was blunt and correct: it added decoration where the page needed hierarchy. Reverted in `62dcda9`. If richer backgrounds come up again, the lesson is that texture is not the lever — layout and type are.

**What replaced it, after asking rather than guessing again.** Given four directions, the user chose *show the product, don't describe it*:

- Hero is now asymmetric: pitch and search on a hard left axis, tutor result cards on the right. A parent understands "verified tutors near you" in about a second from seeing a badge, rating, fee and locality — body copy cannot do that.
- `TutorCard` is the **real** component, not hero art. It renders live search results in M2, so its interface is the shape the search endpoint must return.
- Category icons with per-category colour, and city **landmark glyphs** (Charminar, Gateway of India, Gopuram, Howrah Bridge…) instead of ten identical map pins. Blue stays the only action colour; these hues live in icon tiles and never on a control.
- Background: three overlapping gradient stops rather than one flat tint, plus a blue-tinted section band replacing flat grey.

**A real layout bug, spotted from a screenshot.** The card column rendered ~800px against a ~480px left column, and `items-center` vertically centred the short one — producing a large dead space above the headline. Constraining the card column to a fixed viewport fixed the alignment and enabled the marquee in the same change.

**Looping card marquee.** List rendered twice, strip translated exactly `-50%`, so the loop has no seam. Pauses on hover and focus-within. Needed an explicit reduced-motion override: the blanket rule collapsing all animations to 0.01ms would have frozen the strip halfway scrolled off, so it is cancelled outright instead.

**`/tutors/[slug]` profile page** — the real `M2-06` page built early against example data, prerendered static. **No phone number appears on it and none will when the data is real**: contact details are what tutors pay to unlock, so a public profile leaking one removes the business model rather than degrading it. The page explains where the number is instead of leaving the visitor hunting, and the reviews section says reviews will appear rather than inventing any.

**Process failure worth recording:** commits `62dcda9`, `b8fd365` and `cb2fd10` shipped without touching these docs, despite CLAUDE.md requiring it in the same session. Caught only because the user asked. Backfilled here.

### 2026-09-01 — M1-08 tutor profiles, the core inventory

**63 tests pass** (up from 46). Everything downstream — search, the lead feed, unlocks — needs these to exist.

**Schema** (`V6__profiles.sql`): `tutor_profiles`, `tutor_subjects`, `tutor_locations`, `tutor_qualifications`, plus a deliberately thin `student_profiles`. Fees in paise as `BIGINT`. Subjects are per-tutor-per-subject with their own fee, grades and boards, because a tutor may reasonably charge more for Class 12 Physics than Class 8 Maths.

**Completeness scoring is weighted, not an even split.** Subjects and location outweigh a bio because a profile without them cannot be matched to a requirement at all — it is invisible however well written. Gates publishing at 60%, and an edit that drops a live profile below the bar **unpublishes it automatically**, since a half-empty listing in front of parents reflects on every other tutor. It also returns a plain-language list of what is still missing: "60% complete" tells a tutor they are stuck without telling them what to do.

**Ownership is structural rather than a check** (`M1-05.3`). There is no "update tutor {id}" endpoint at all — every route acts on the token's own user. No parameter tampering can reach another tutor's profile, because there is no parameter to tamper with. Covered by a tutor-vs-tutor isolation test.

**Two response types, not one with conditionals.** `OwnerView` has everything; `PublicView` has no phone, no email, no date of birth, no document URLs. Separate types because a conditional is something a future edit can silently get wrong — if a field is absent from the type, no code path can leak it. Asserted by a test that greps the public response for each.

#### Three bugs found by the tests

1. **`MultipleBagFetchException`** — my `@EntityGraph` tried to join-fetch three `List` collections at once, which Hibernate cannot do. I had been optimising a non-hot path: a profile read is one row for one user, while search is the hot path and never touches these collections. Removed the graph and let them load lazily inside the transaction.
2. **`@Transactional(readOnly = true)` on a method that writes.** `getOwnProfile` creates the profile on first access, so the very first fetch failed with a 500.
3. **Jackson 3 flipped `FAIL_ON_NULL_FOR_PRIMITIVES` to true.** Boot 4 ships Jackson 3, so an omitted `boolean` in a request body is now a hard parse error instead of defaulting to `false`. Request DTOs now use boxed types with explicit defaults, rather than disabling the check globally for every endpoint. Recorded in `backend/CLAUDE.md` — this will recur on every DTO from here.

### 2026-09-01 — Backgrounds, section panels, and a visual browse grid

**A cascade bug, caught from a screenshot.** "Are you a tutor?" was invisible on its dark panel and the blue panel's heading rendered near-black — both marked `text-white`. The base block in `globals.css` was **unlayered**, and unlayered CSS beats layered CSS regardless of specificity, so `h1,h2,h3,h4 { color: ink-900 }` silently overrode every white heading in the application. Wrapping it in `@layer base` fixed it everywhere.

> Worth noting how this was found: my verification greps rendered HTML, and the HTML was always correct. The failure existed only in computed styles. Screenshots catch a class of bug that markup assertions structurally cannot.

**Section panels.** Every section is now a rounded panel on a page canvas rather than a full-bleed band. Panels give each section a real edge, and because they all sit in the same `Container` their edges line up down the page — most of what makes a layout read as deliberate. One radius everywhere; mixing radii is what makes a page look assembled from parts.

**The canvas needed real weight.** First attempt used `ink-50` (#f8fafc), barely a shade off white, so panels had nothing to sit against and the page still read as flat white. Replaced with a dedicated `--color-canvas` blue-grey (#e6edf7): luminance ratio against white goes from ~1.04 to ~1.18. Same root cause fixed in several inner surfaces that were near-white on near-white.

**Visual browse grid**, after UrbanPro was given as a reference. Categories are now grouped with a five-column tile grid each, rather than text chips.

**Deliberately not stock photography**, unlike the reference. Seventy photos is several megabytes on a mid-range Android on a patchy connection; every photo needs a licence traceable to launch; and a stock photo of a smiling student implies a classroom that does not exist yet. Generated gradient-and-glyph tiles cost nothing and claim nothing. The trade is real — photographs carry more warmth — and if photography is commissioned later only `SubjectTile` changes.

Hero stats moved inline under the search, pipe-separated. They remain capability claims (subjects, cities, free) rather than user counts: an incumbent can legitimately print "55 lakh students", and we cannot.

---

## Known issues

- **`CorsConfigurationSource` cannot be injected by type** in Spring Boot 4 — `mvcHandlerMappingIntrospector` also implements it, so `@Bean SecurityFilterChain(HttpSecurity, CorsConfigurationSource)` fails startup with `NoUniqueBeanDefinitionException`. Fixed by calling the `corsConfigurationSource()` bean method directly. Watch for the same trap with any other type Spring MVC implements incidentally.
- Mockito warns it is self-attaching as a JVM agent, which future JDKs will disallow. Harmless today; when it becomes an error, add Mockito as an explicit `-javaagent` in the Surefire config. Plausibly arrives sooner on Java 26 than on an LTS (ADR #4).

---

## Blockers

*None.*
