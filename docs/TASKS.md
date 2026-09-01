# ApnaTutor — V1 Task Tree

> **This file owns task status.** It is the one place a box gets ticked. PLAN.md describes the shape and reasoning of each milestone; PROGRESS.md is the dated journal; PENDING.md is the filtered view of what is open, blocked, or undecided. If those disagree with this file about whether something is done, **this file is right**.

**Legend:** `☑` done · `▶` in progress · `☐` not started · `⊘` blocked · `⏸` deferred

**Task IDs are permanent.** Reference them in commits (`M1-03: add OTP rate limiting`) and never renumber — a stale ID in git history is worse than a gap in the sequence.

| Milestone | Tasks | Done |
|---|---|---|
| M0 — Foundation | 12 | 12 ☑ |
| M1 — Accounts, profiles & trust | 12 | 4 ☑, 3 ▶ |
| M2 — Discovery & SEO | 8 | 2 ▶ (frontend built ahead of the API) |
| M3 — Requirements & the lead loop | 11 | 0 |
| M4 — Credits & payments | 8 | 0 |
| M5 — Reviews, admin & trust | 10 | 0 |
| M6 — Polish & launch | 10 | 0 |
| **V1 total** | **71** (260 subtasks) | **12** |

---

## Two sequencing corrections to the original plan

Found while breaking the work down. Both are dependency inversions that would have caused a stall mid-milestone.

**1. Catalog moved from M2 → M1.** A tutor profile cannot be built without subjects, boards, grades and locations to attach to it — the onboarding wizard's central screen is "what do you teach, and where". Leaving the catalog in M2 would have meant either a half-built profile or throwaway scaffolding. Catalog schema and seed is now `M1-06`, before tutor profiles at `M1-08`. M2 keeps everything genuinely about *discovery*: search, masking, public pages, SEO.

**2. Credit ledger moved from M4 → M3.** The unlock endpoint spends credits, so it cannot be built or tested without a wallet and ledger. Splitting them across milestones would have left M3 unfinishable. The ledger and wallet are now `M3-05`; M4 keeps what is genuinely about *money coming in*: Razorpay, packages, invoices, refunds. Admin credit grants in `M3-05` let the whole M3 loop be tested before any payment code exists.

---

## M0 — Foundation ☑

Complete 2026-08-31, commit `02208c3`.

- ☑ `M0-01` Install Node 24.19.0 LTS + Git 2.55.0
- ☑ `M0-02` Install PostgreSQL 18.6 as native Windows service, `psql` on PATH
- ☑ `M0-03` Backend scaffold — Spring Boot 4.1.1, Java 26, Maven wrapper
- ☑ `M0-04` Frontend scaffold — Next.js 16.3.3, React 19.2.8, Tailwind 4
- ☑ `M0-05` `backend/scripts/db-setup.sql` — role, both databases, `pg_trgm`
- ☑ `M0-06` `backend/scripts/db-reset.ps1` — from-zero rebuild
- ☑ `M0-07` `application.yml` + test profile
- ☑ `M0-08` Per-project config — `backend/.env`, `frontend/.env.local` (ADR #11)
- ☑ `M0-09` `V1__baseline.sql` — `pg_trgm`, `set_updated_at()` trigger function
- ☑ `M0-10` `SecurityConfig` — default-deny, public allowlist, CORS, BCrypt
- ☑ `M0-11` Chain verified end to end: Next → Boot → Postgres all `UP`, server-rendered
- ☑ `M0-12` `git init`, per-project `.gitignore` / `.env.example` / `README.md` / `CLAUDE.md`, shared `docs/`

---

## M1 — Accounts, profiles & trust

**Goal:** a tutor registers by phone, builds a complete profile, uploads an ID, and an admin approves it.

### ▶ `M1-01` Shared web plumbing
*Deferred out of M0 deliberately — there were no endpoints to shape it against.*
- ☑ `M1-01.1` `ApiError` record + `ErrorCode` enum (stable machine codes, SoT §6)
- ☑ `M1-01.2` `@RestControllerAdvice` — validation, auth, forbidden, not-found, conflict, fallback
- ☑ `M1-01.3` `PageResponse<T>` wrapper matching the SoT pagination contract
- ☑ `M1-01.4` springdoc-openapi 3.1.0 + `/swagger-ui` — **unblocked**; 3.x is the Boot 4 line (2.x targets Boot 3)
- ☑ `M1-01.5` Correlation-ID filter + structured request logging
- ▶ `M1-01.6` `Idempotency-Key` infrastructure — **table done** (`V3__idempotency.sql`); interceptor still to write. Needed by M3-07 and M4-02, so it can wait until there is a money-moving endpoint to wrap.

### ☑ `M1-02` Identity schema
- ☑ `M1-02.1` `V2__identity.sql` — `users`, `otp_codes`, `refresh_tokens`
- ☑ `M1-02.2` Indexes: unique on `phone`, unique **case-insensitive partial** on `email`
- ☑ `M1-02.3` Attach `set_updated_at` trigger to each table
- ☑ `M1-02.4` JPA entities + repositories; enums as strings, never ordinals
- ☑ `M1-02.5` `ddl-auto: validate` passes — and immediately earned its keep by catching a `CHAR`/`VARCHAR` drift on `token_hash`

### ☑ `M1-03` OTP flow
- ☑ `M1-03.1` `SmsSender` interface + `ConsoleSmsSender` dev stub, selected by config
- ☑ `M1-03.2` `OtpService` — generate via `SecureRandom`, **BCrypt-hash before storing**, verify, consume
- ☑ `M1-03.3` Rate limits (SoT §3.4): 10 min TTL, 5 attempts/code, 5 sends/hour/phone
- ☑ `M1-03.4` `POST /auth/otp/request`, `POST /auth/otp/verify`
- ☑ `M1-03.5` Registration path: verify OTP on an unknown phone → create user with chosen role. Self-registering as `ADMIN` is refused.
- ☑ `M1-03.6` Tests: happy path, wrong code, replay, superseded code, attempt cap, send cap
- ☑ `M1-03.7` Enumeration defence — byte-identical response for registered and unregistered numbers, asserted by test
- ☑ `M1-03.8` `PhoneNumbers` E.164 normalisation, so one human cannot become two accounts by typing a space differently *(added — not in the original breakdown)*

### ☑ `M1-04` JWT sessions
- ☑ `M1-04.1` `TokenService` — issue/validate via Spring Security Nimbus, secret from env, **startup fails if under 32 bytes**
- ☑ `M1-04.2` Access token 15 min; refresh token 30 days, **stored as SHA-256, never in the clear**
- ☑ `M1-04.3` Refresh rotation + reuse detection (a replayed token revokes the whole family)
- ☑ `M1-04.4` HttpOnly / Secure / SameSite=Strict refresh cookie, path-scoped to `/api/v1/auth`
- ☑ `M1-04.5` **CSRF defence on the refresh endpoint** — repays PENDING T1. `SameSite=Strict` plus a required `X-Refresh-Request` header that HTML forms cannot set.
- ☑ `M1-04.6` Bearer validation via Spring's `oauth2ResourceServer` — no hand-rolled auth filter
- ☑ `M1-04.7` `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`

### ▶ `M1-05` Authorization
- ☑ `M1-05.1` `CurrentUser` record + argument resolver; throws rather than injecting null
- ☑ `M1-05.2` `@EnableMethodSecurity` on; JWT `role` claim mapped to a `ROLE_` authority
- ☐ `M1-05.3` Ownership checks — nothing is owned yet; lands with profiles in `M1-07`/`M1-08`
- ▶ `M1-05.4` Tests: unauthenticated and tampered-token cases done. Student-vs-tutor separation waits for the first role-restricted endpoint.

### ☑ `M1-06` Catalog schema & seed *(moved from M2 — see corrections above)*
- ☑ `M1-06.1` `V4__catalog.sql` — `subjects` (self-referencing tree), `boards`, `grade_levels`, `locations`
- ☑ `M1-06.2` Seed subject taxonomy — **70 subjects across 7 categories**: School Tuition, Exam Preparation, Languages, Computers & IT, Music & Dance, Study Abroad Tests, Hobbies & Sports
- ☑ `M1-06.3` Seed 10 boards (CBSE, ICSE, 5 state boards, IB, IGCSE, NIOS) and 19 grade levels
- ▶ `M1-06.4` Seed locations — 10 cities live; Hyderabad 20 localities, Bengaluru 14, others shallow. **Depth still pending decision D1**; deliberately shallow elsewhere because empty city×subject pages are an SEO liability (`M2-08.4`).
- ☑ `M1-06.5` Unique slugs on subjects and locations, chosen to read naturally in a URL
- ☑ `M1-06.6` Read-only catalog endpoints under `/api/v1/public/catalog`, cached 6h

### ☐ `M1-07` Student profile
- ☐ `M1-07.1` `V4__profiles.sql` — `student_profiles`
- ☐ `M1-07.2` Create-on-first-login, read, update endpoints
- ☐ `M1-07.3` Tests

### ☐ `M1-08` Tutor profile
- ☐ `M1-08.1` `V4__profiles.sql` — `tutor_profiles`, `tutor_subjects`, `tutor_locations`, `tutor_qualifications`
- ☐ `M1-08.2` Core CRUD — bio, photo, gender, experience, languages, demo, availability
- ☐ `M1-08.3` Fees: `fee_min`/`fee_max` in **paise**, unit, negotiable flag
- ☐ `M1-08.4` Subject selection with per-subject grades and boards
- ☐ `M1-08.5` Teaching modes + serviceable locations + travel radius
- ☐ `M1-08.6` Qualifications with document upload
- ☐ `M1-08.7` Profile completeness calculation
- ☐ `M1-08.8` Publish / unpublish — an incomplete profile must not be publishable
- ☐ `M1-08.9` Tests

### ☐ `M1-09` File storage
- ☐ `M1-09.1` `FileStorage` interface + `LocalFileStorage`, provider chosen by config
- ☐ `M1-09.2` Upload endpoint with size + **content-sniffed** MIME validation (never trust the extension)
- ☐ `M1-09.3` Sanitised, non-guessable stored filenames
- ☐ `M1-09.4` Serve endpoint — **ID documents must be admin-only, never publicly addressable**
- ☐ `M1-09.5` Image resize/compress for profile photos
- ☐ `M1-09.6` Tests including a malicious-filename case

### ☐ `M1-10` Verification
- ☐ `M1-10.1` `V5__verification.sql` — `verifications`
- ☐ `M1-10.2` Submit endpoints for ID and education documents
- ☐ `M1-10.3` Admin approve/reject with rejection reason
- ☐ `M1-10.4` `verification_level` derivation (PHONE → EMAIL → ID → EDUCATION)
- ☐ `M1-10.5` Badges surfaced on the public profile response
- ☐ `M1-10.6` Hook point for the M4 signup bonus at `ID_VERIFIED`

### ☐ `M1-11` Frontend — auth
- ☐ `M1-11.1` Phone entry + OTP screens, resend cooldown
- ☐ `M1-11.2` Role choice at signup (Student/Parent vs Tutor)
- ☐ `M1-11.3` Session handling, silent refresh, logout
- ☐ `M1-11.4` Route protection + role-based redirects
- ☐ `M1-11.5` Error states driven by `ErrorCode`, never by message text

### ☐ `M1-12` Frontend — profiles
- ☐ `M1-12.1` Tutor onboarding wizard, resumable, with completeness meter
- ☐ `M1-12.2` Subject/grade/board picker against the catalog
- ☐ `M1-12.3` Location + travel radius picker
- ☐ `M1-12.4` Photo and document upload with preview
- ☐ `M1-12.5` Profile editor
- ☐ `M1-12.6` Student profile screen

---

## M2 — Discovery & SEO

**Goal:** a parent finds relevant tutors fast, and a city×subject page ranks.

### ☐ `M2-01` Search service
- ☐ `M2-01.1` Query builder: subject + location, with filters for fee, mode, gender, experience, rating, verified-only, board, grade
- ☐ `M2-01.2` Sorting: relevance, rating, fee, experience, recently active
- ☐ `M2-01.3` Pagination via `PageResponse`
- ☐ `M2-01.4` Only published, active, non-suspended tutors appear
- ☐ `M2-01.5` Tests per filter and for filter combinations

### ☐ `M2-02` Search performance
- ☐ `M2-02.1` GIN/trigram indexes on searchable text
- ☐ `M2-02.2` Composite indexes for the hot filter paths
- ☐ `M2-02.3` **`EXPLAIN ANALYZE` on the hot path — no sequential scans**
- ☐ `M2-02.4` Seed a realistic volume of tutors and re-measure

### ☐ `M2-03` Contact masking
- ☐ `M2-03.1` Single shared masking utility — one implementation, used everywhere
- ☐ `M2-03.2` Applied at the DTO boundary so an entity can never leak a phone number
- ☐ `M2-03.3` **Tests asserting no unmasked contact appears in any public response** — this is the single highest-consequence bug class in the product

### ☐ `M2-04` Public endpoints
- ☐ `M2-04.1` `GET /public/tutors` search
- ☐ `M2-04.2` `GET /public/tutors/{slug}` masked profile
- ☐ `M2-04.3` Cache headers appropriate to public pages

### ▶ `M2-05` Frontend — search
*Shell built early, ahead of the backend, while designing the site.*
- ▶ `M2-05.1` Search page with filter sidebar — layout done, filters inert until `M2-01`
- ☑ `M2-05.2` Result cards — `TutorCard` component, built for real use and previewed with example data
- ☐ `M2-05.3` Filter state in the URL so results are shareable and back works
- ▶ `M2-05.4` Empty state done (honest: says there are no tutors rather than faking cards); loading and error states pending

### ▶ `M2-06` Frontend — tutor profile page
*Built early against example data. When the profile endpoint lands the lookup becomes a fetch; the page itself does not change.*
- ☑ `M2-06.1` Full profile layout — about, subjects, qualifications, class details, reviews placeholder
- ☑ `M2-06.2` "Post your requirement" CTA, and an explanation of why no phone number is shown
- ☑ `M2-06.3` **No contact detail anywhere on the page** — verified by test in the build check
- ☐ `M2-06.4` Swap `EXAMPLE_TUTORS` for the real endpoint (PENDING T11)

### ☐ `M2-07` SEO landing pages
- ☐ `M2-07.1` `/tutors/[city]/[subject]` — server-rendered
- ☐ `M2-07.2` `/tutors/[city]/[locality]/[subject]` — server-rendered
- ☐ `M2-07.3` Unique title/meta/H1 per page, generated from real data
- ☐ `M2-07.4` Internal linking between related city/subject pages
- ☐ `M2-07.5` **Verify pages render fully with JavaScript disabled**

### ☐ `M2-08` SEO plumbing
- ☐ `M2-08.1` Generated `sitemap.xml` covering all city×subject combinations
- ☐ `M2-08.2` `robots.txt`
- ☐ `M2-08.3` JSON-LD structured data (`Person`/`Service`, `AggregateRating` once reviews exist)
- ☐ `M2-08.4` Canonical URLs; thin or empty combinations must be `noindex`

---

## M3 — Requirements & the lead loop

**Goal:** the core marketplace transaction works end to end. This is the milestone the product lives or dies on.

### ☐ `M3-01` Requirements schema
- ☐ `M3-01.1` `V6__requirements.sql` — `requirements`, `lead_unlocks`
- ☐ `M3-01.2` `lead_unlocks` carries `engagement_type` (SoT Invariant 2)
- ☐ `M3-01.3` **Unique constraint on `(requirement_id, tutor_id)`** — a tutor must never be charged twice for one lead
- ☐ `M3-01.4` Entities + repositories

### ☐ `M3-02` Lead pricing
- ☐ `M3-02.1` `LeadPricingService` implementing the SoT §3.1 budget bands
- ☐ `M3-02.2` Online-only ×0.8, rounded up
- ☐ `M3-02.3` **Price locked onto the requirement at creation** — repricing must never move a lead's cost under a tutor
- ☐ `M3-02.4` Table-driven tests across every band boundary

### ☐ `M3-03` Requirement endpoints
- ☐ `M3-03.1` Post a requirement (student only)
- ☐ `M3-03.2` List/edit/close own requirements
- ☐ `M3-03.3` Mark HIRED / CLOSED
- ☐ `M3-03.4` View tutors who unlocked, with contacts revealed
- ☐ `M3-03.5` Validation against catalog IDs

### ☐ `M3-04` Requirement lifecycle
- ☐ `M3-04.1` 30-day expiry scheduled job
- ☐ `M3-04.2` Status transitions: OPEN → CAPPED / HIRED / CLOSED / EXPIRED
- ☐ `M3-04.3` Guard illegal transitions

### ☐ `M3-05` Credit ledger & wallet *(moved from M4 — see corrections above)*
- ☐ `M3-05.1` `V7__billing.sql` — `credit_wallets`, `credit_transactions`
- ☐ `M3-05.2` **Append-only ledger** (SoT Invariant 1) — DB-level guard against UPDATE/DELETE
- ☐ `M3-05.3` Balance derivation from the ledger, honouring expiry
- ☐ `M3-05.4` `credit_wallets.balance` as a cache, written in the same transaction
- ☐ `M3-05.5` Reconciliation check: replayed ledger must equal cached balance
- ☐ `M3-05.6` Admin credit grant — lets M3 be tested before any payment code exists
- ☐ `M3-05.7` `GET /tutor/wallet` + transaction history

### ☐ `M3-06` Lead feed
- ☐ `M3-06.1` Match on tutor's subjects × serviceable locations
- ☐ `M3-06.2` Masked projection — no name, phone or exact address
- ☐ `M3-06.3` Exclude already-unlocked, capped, closed and expired requirements
- ☐ `M3-06.4` Show unlock cost and remaining slots
- ☐ `M3-06.5` Sorting and pagination

### ☐ `M3-07` Unlock endpoint — **the critical path**
- ☐ `M3-07.1` `POST /leads/{id}/unlock` with a required `Idempotency-Key`
- ☐ `M3-07.2` Single transaction: check cap → check balance → ledger debit → record unlock → reveal
- ☐ `M3-07.3` Insufficient balance → `INSUFFICIENT_CREDITS`, nothing written
- ☐ `M3-07.4` Cap reached → `LEAD_UNLOCK_CAP_REACHED`, **no credits debited**
- ☐ `M3-07.5` Optional intro message to the student
- ☐ `M3-07.6` Response reveals contact details
- ☐ `M3-07.7` Replaying an idempotency key returns the original result, never a second charge

### ☐ `M3-08` Cap enforcement & concurrency
- ☐ `M3-08.1` Enforce the cap of 5 (SoT §3.2)
- ☐ `M3-08.2` Transition to `CAPPED`, remove from all other feeds
- ☐ `M3-08.3` **Concurrency test: N tutors unlock the last slot in parallel — exactly one wins, and no loser is charged**
- ☐ `M3-08.4` Pessimistic lock or a unique-constraint strategy, chosen deliberately and documented

### ☐ `M3-09` Notifications
- ☐ `M3-09.1` `MailSender` interface + console dev stub
- ☐ `M3-09.2` `notifications` table + service
- ☐ `M3-09.3` Tutor: new matching lead
- ☐ `M3-09.4` Student: a tutor unlocked your requirement
- ☐ `M3-09.5` Tutor: low credit balance
- ☐ `M3-09.6` Send outside the unlock transaction — a mail failure must never roll back a paid unlock

### ☐ `M3-10` Frontend — student side
- ☐ `M3-10.1` Post-requirement form (mobile-first; this is the top-of-funnel conversion point)
- ☐ `M3-10.2` Requirement dashboard
- ☐ `M3-10.3` Responding-tutors list with revealed contacts
- ☐ `M3-10.4` Mark hired / close

### ☐ `M3-11` Frontend — tutor side
- ☐ `M3-11.1` Lead feed with masked previews
- ☐ `M3-11.2` Unlock confirmation showing cost and resulting balance
- ☐ `M3-11.3` Post-unlock contact reveal
- ☐ `M3-11.4` My-leads list
- ☐ `M3-11.5` Wallet balance visible throughout

---

## M4 — Credits & payments

**Goal:** money comes in, exactly once, and provably.

### ☐ `M4-01` Packages
- ☐ `M4-01.1` `V8__packages.sql` — `credit_packages`, `payments`
- ☐ `M4-01.2` Seed packages — **prices are an unvalidated hypothesis (PENDING.md)**
- ☐ `M4-01.3` Public package listing endpoint

### ☐ `M4-02` Razorpay checkout
- ☐ `M4-02.1` SDK integration, keys from env
- ☐ `M4-02.2` Order creation endpoint, `payments` row in `CREATED`
- ☐ `M4-02.3` Amounts in paise throughout, matched against the package server-side
- ☐ `M4-02.4` **Never trust a client-reported amount or success flag**

### ☐ `M4-03` Webhook
- ☐ `M4-03.1` Endpoint with **signature verification** — reject unsigned or mismatched
- ☐ `M4-03.2` **Idempotent credit grant: three deliveries of one event grant credits once**
- ☐ `M4-03.3` Persist raw payload for dispute forensics
- ☐ `M4-03.4` Handle failed/cancelled payments
- ☐ `M4-03.5` Reconciliation job for webhooks that never arrive
- ☐ `M4-03.6` Tests including replay and out-of-order delivery

### ☐ `M4-04` Signup bonus
- ☐ `M4-04.1` Grant 10 credits at `ID_VERIFIED` (SoT §3.3)
- ☐ `M4-04.2` **Unique partial index guaranteeing once-only** — not application logic alone
- ☐ `M4-04.3` 90-day expiry on bonus credits

### ☐ `M4-05` Credit expiry
- ☐ `M4-05.1` Scheduled expiry job writing `EXPIRY` ledger entries
- ☐ `M4-05.2` Purchased 365 days, bonus 90 days
- ☐ `M4-05.3` Expiry-warning notification

### ☐ `M4-06` Refunds & disputes
- ☐ `M4-06.1` `V9__refunds.sql` — `refund_requests`
- ☐ `M4-06.2` Tutor raises a dispute within 7 days, with a reason code
- ☐ `M4-06.3` Admin decision workflow
- ☐ `M4-06.4` Approved → `REFUND` ledger entry, unlock marked `REFUNDED`, **cap slot freed**
- ☐ `M4-06.5` Abuse signal: flag tutors whose dispute rate exceeds 30%

### ☐ `M4-07` Invoices
- ☐ `M4-07.1` Receipt generation and download
- ☐ `M4-07.2` GST fields — **needed from day one? open question (PENDING.md)**

### ☐ `M4-08` Frontend — wallet
- ☐ `M4-08.1` Package selection and checkout
- ☐ `M4-08.2` Razorpay checkout integration
- ☐ `M4-08.3` Success/failure/pending states — pending is the one that gets forgotten
- ☐ `M4-08.4` Transaction history with running balance
- ☐ `M4-08.5` Low-balance prompt at the point of unlock
- ☐ `M4-08.6` Dispute-raising UI

---

## M5 — Reviews, admin & trust

**Goal:** an admin can run the marketplace without touching the database.

### ☐ `M5-01` Reviews schema & eligibility
- ☐ `M5-01.1` `V10__reviews.sql` — `reviews`, unique on `(tutor_id, student_id)`
- ☐ `M5-01.2` Eligibility: only a student connected to that tutor via an unlock
- ☐ `M5-01.3` Submit endpoint with validation

### ☐ `M5-02` Moderation
- ☐ `M5-02.1` Everything starts `PENDING` — nothing user-written goes public unmoderated
- ☐ `M5-02.2` Admin approve/reject queue
- ☐ `M5-02.3` Notify the tutor on publication

### ☐ `M5-03` Tutor replies
- ☐ `M5-03.1` Exactly one reply per review
- ☐ `M5-03.2` Replies moderated too

### ☐ `M5-04` Rating aggregation
- ☐ `M5-04.1` Recompute `avg_rating` / `review_count` on approval
- ☐ `M5-04.2` Never accept an aggregate from the client
- ☐ `M5-04.3` Backfill/recompute command

### ☐ `M5-05` Admin backend
- ☐ `M5-05.1` Verification queue
- ☐ `M5-05.2` Review moderation
- ☐ `M5-05.3` User management, suspend/reinstate
- ☐ `M5-05.4` Credit adjustments and refund decisions
- ☐ `M5-05.5` Package and pricing management
- ☐ `M5-05.6` Requirement moderation (spam, fake leads)
- ☐ `M5-05.7` Funnel metrics: signups, requirements, unlocks, revenue, conversion

### ☐ `M5-06` Admin frontend
- ☐ `M5-06.1` Layout, navigation, admin-only route guard
- ☐ `M5-06.2` Screens for each M5-05 capability
- ☐ `M5-06.3` Document viewer for ID/education verification
- ☐ `M5-06.4` Metrics dashboard

### ☐ `M5-07` Rate limiting
- ☐ `M5-07.1` Auth endpoints (OTP already limited at M1-03)
- ☐ `M5-07.2` Unlock and search endpoints
- ☐ `M5-07.3` Per-IP and per-user buckets
- ☐ `M5-07.4` `429` with `Retry-After`

### ☐ `M5-08` Audit log
- ☐ `M5-08.1` `V11__audit.sql` — `audit_log`
- ☐ `M5-08.2` Every admin action recorded with before/after
- ☐ `M5-08.3` Every credit adjustment and refund recorded
- ☐ `M5-08.4` Admin-visible, immutable

### ☐ `M5-09` Abuse reporting
- ☐ `M5-09.1` Report a tutor, student, review or requirement
- ☐ `M5-09.2` Admin triage queue

### ☐ `M5-10` Data rights (DPDP)
- ☐ `M5-10.1` Data export
- ☐ `M5-10.2` Account deletion with a documented retention policy
- ☐ `M5-10.3` **Deletion must not corrupt the financial ledger** — anonymise, never delete, ledger rows

---

## M6 — Polish & launch

**Goal:** something a real parent in India can use on a mid-range Android phone.

### ☐ `M6-01` Responsive pass
- ☐ `M6-01.1` Every screen mobile-first — assume most traffic is a mid-range Android phone
- ☐ `M6-01.2` Touch targets, thumb reach, sane keyboard types on inputs
- ☐ `M6-01.3` Test on a real device, not only devtools

### ☐ `M6-02` States
- ☐ `M6-02.1` Empty states with a next action
- ☐ `M6-02.2` Loading skeletons
- ☐ `M6-02.3` Error states with recovery
- ☐ `M6-02.4` Offline / slow-network behaviour

### ☐ `M6-03` Accessibility
- ☐ `M6-03.1` Keyboard navigation
- ☐ `M6-03.2` Labels and ARIA where needed
- ☐ `M6-03.3` Contrast audit
- ☐ `M6-03.4` Visible focus states

### ☐ `M6-04` Seed & demo data
- ☐ `M6-04.1` Believable demo dataset — tutors, requirements, reviews
- ☐ `M6-04.2` One-command load

### ☐ `M6-05` End-to-end tests
- ☐ `M6-05.1` Playwright setup
- ☐ `M6-05.2` **The money path** (SoT verification §5), automated
- ☐ `M6-05.3` Search and SEO page rendering

### ☐ `M6-06` Performance
- ☐ `M6-06.1` Image optimisation
- ☐ `M6-06.2` Query budget per page; hunt N+1s
- ☐ `M6-06.3` Lighthouse pass on the SEO pages
- ☐ `M6-06.4` Bundle size review

### ☐ `M6-07` Deployment
- ☐ `M6-07.1` Choose host, provision
- ☐ `M6-07.2` Managed PostgreSQL with automated backups **and a tested restore**
- ☐ `M6-07.3` Production config, real secrets, `clean-disabled: true`
- ☐ `M6-07.4` CI: build, test, migrate, deploy
- ☐ `M6-07.5` Domain + TLS
- ☐ `M6-07.6` Staging environment

### ☐ `M6-08` Observability
- ☐ `M6-08.1` Error tracking
- ☐ `M6-08.2` Uptime monitoring on health endpoints
- ☐ `M6-08.3` Analytics with conversion funnels
- ☐ `M6-08.4` Alert on payment-webhook failures

### ☐ `M6-09` Legal
- ☐ `M6-09.1` Terms of service
- ☐ `M6-09.2` Privacy policy (DPDP-aware)
- ☐ `M6-09.3` **Refund policy — must match the SoT §3.5 behaviour exactly**
- ☐ `M6-09.4` Tutor and student conduct guidelines

### ☐ `M6-10` Production providers
- ☐ `M6-10.1` Real SMS provider, replacing the console stub
- ☐ `M6-10.2` Real email provider
- ☐ `M6-10.3` S3-compatible file storage
- ☐ `M6-10.4` Razorpay live keys
- ☐ `M6-10.5` **Verify every console stub is gone from the production profile**
