# ApnaTutor — Pending

> **What this file is for.** Not a copy of the unticked boxes in TASKS.md — that would just be a second list to forget to update. This tracks the things a checklist cannot hold: decisions nobody has made, work that is blocked and on what, debt taken on deliberately, and risks that could cost real time.
>
> **TASKS.md owns task status. This file owns everything that is stuck, undecided, or deferred.**

**Last reviewed:** 2026-08-31 (after the backend/frontend split)

---

## 1. Decisions needed from you

Nothing here can be resolved by writing code. Each one blocks or reshapes real work.

| # | Decision | Blocks | Why it matters |
|---|---|---|---|
| D1 | **Which city do we launch in?** | `M1-06.4` locality seed | Locality data depth and the entire SEO page set depend on it. Seeding 200 Hyderabad localities is a different job from seeding 12 metro cities shallowly. Getting this wrong means reseeding and, worse, changing URLs that were already indexed. |
| D2 | **Is `apnatutor.in` available?** | `M6-07.5` domain | Not yet checked. The name is already in the package namespace (`com.apnatutor`) and repo name. Cheap to change now, painful after launch. Worth checking this week even though it is not needed until M6. |
| D3 | **Real credit package prices** | `M4-01.2` | The numbers in SoT §3.1 and the package seed are my hypothesis, not researched. They set the whole unit economics. Worth checking what tutors actually pay UrbanPro before committing. |
| D4 | **Is the ₹10/credit accounting value right?** | `M4-01.2` | Everything downstream — lead pricing bands, package value, margin — hangs off it. |
| D5 | **SMS provider: MSG91 vs Gupshup vs Twilio vs Firebase** | `M6-10.1` | Per-SMS cost in India varies severalfold, and OTP volume is the single largest per-user variable cost. **Not blocking anything** — dev mode's seeded test accounts cover development and demos entirely. Researched 2026-09-01: Firebase Phone Auth is free for only the first 10 SMS/day and then ~₹6 per verification in India, which is expensive at volume; MSG91 targets India directly and is the cheapest of the mainstream options; Twilio Verify is the easiest to integrate and the priciest. Firebase also shipped carrier-SIM-based verification in May 2026 with no per-message fee, worth evaluating if it covers Indian carriers. |
| D6 | **GST invoicing from day one?** | `M4-07.2` | If credit sales need GST-compliant invoices at launch, that shapes the `payments` schema and the invoice format. Retrofitting tax fields onto historical transactions is genuinely unpleasant. |
| D7 | **Do students ever need to see tutor contact details?** | `M2-03` masking rules | Currently one-directional: tutors unlock students. Whether a student can ever call a tutor directly changes the masking model and the whole lead economy. |

---

## 2. Blocked

Nothing is blocked.

**~~B1 — springdoc / `/swagger-ui`~~ — resolved same day, and it was never a real blocker.** I recorded it as blocked on the strength of Maven Central's `solrsearch` API reporting 2.8.6 as the latest springdoc. That field was stale. The repository's own `maven-metadata.xml` lists 3.0.0 through **3.1.0**, and the 3.x line is precisely the Spring Boot 4 line. Now on springdoc 3.1.0, serving OpenAPI 3.1.0 at `/v3/api-docs` and Swagger UI at `/swagger-ui.html`.

> **Lesson worth keeping:** `search.maven.org/solrsearch` returns a cached `latestVersion` that lags real releases. For "does version X exist", read `https://repo1.maven.org/maven2/<group path>/<artifact>/maven-metadata.xml` instead — it is generated from the repository itself. Do not declare a dependency unavailable on the strength of the search API alone.

*(When something lands here, record what it is waiting on — a blocker with no named dependency tends to sit forever.)*

---

## 3. Deliberate debt

Taken on knowingly, with the repayment point named. This is not a list of mistakes — it is a list of decisions with a due date.

| # | Debt | Taken at | Repay at | Notes |
|---|---|---|---|---|
| T1 | ~~No CSRF protection on the refresh endpoint~~ — **repaid** | M0 | Repaid 2026-08-31 (`M1-04.5`) | Two independent defences on the cookie-authenticated route: `SameSite=Strict`, and a required `X-Refresh-Request` header that HTML forms cannot set and cross-origin scripts cannot send without passing a preflight. Covered by test `refreshRequiresCsrfHeader`. |
| T2 | **Mockito self-attaches as a JVM agent** | M0 | When it breaks | Warns on every test run. Future JDKs will forbid it; fix is an explicit `-javaagent` in Surefire. Plausibly bites sooner on Java 26 than it would on an LTS (ADR #4). |
| T3 | ~~No global error handler~~ — **done** `M1-01` | M0 | Repaid 2026-08-31 | `ApiError`, `ErrorCode`, `GlobalExceptionHandler`, `PageResponse`, `CorrelationIdFilter` all landed. API docs remain blocked separately as B1. |
| T4 | **Java 26 rather than an LTS** | M0 | If a library breaks | ADR #4. Fallback to Temurin 21 is documented. The risk is a bytecode-manipulating library (Mockito, Hibernate's enhancer) lagging the JDK. |
| T5 | **No Testcontainers** | M0 | Only if Docker is ever adopted | ADR #5. Consequence: the test database must exist on any machine running the suite. `scripts/db-setup.sql` handles it, but CI setup in `M6-07.4` must create it explicitly. |
| T6 | **Postgres full-text instead of Elasticsearch** | M2 | Only if search quality suffers | Deliberate — Elasticsearch is a lot of operational weight for a single-city launch. `M2-02.3` is the checkpoint that tells us if it is holding up. |
| T7 | **One role per account** | M0 | On real user demand | ADR #10. Someone who is both a parent and a tutor needs two accounts. |
| T8 | **Availability as free text** | M1 | v2 scheduling | `M1-08.2` stores availability as a note, not structured slots. Fine while there is no booking; structured slots arrive with the v2 calendar. |
| T9 | **Access tokens cannot be revoked mid-life** | M1 | Only if abuse demands it | Stateless JWTs are verified by signature, not looked up, which is what makes them cheap. The cost is that suspending a user leaves their current access token working for up to 15 minutes. Refresh is re-checked against account status, so the blast radius is one token lifetime. A revocation list would undo the statelessness; not worth it unless a real incident says otherwise. |
| T10 | **OTP rate limiting is per phone only** | M1 | `M5-07` | Nothing yet caps requests per IP, so one attacker can walk many numbers. The per-phone cap already prevents running up a bill on any single victim. Proper per-IP buckets are `M5-07.3`. |
| T11 | **`lib/exampleTutors.ts` is hardcoded sample data** | 2026-09-01 | `M2-06.4` | Three fabricated tutor profiles power the hero marquee and `/tutors/[slug]`. Every surface showing them is labelled as an example, and the profile page carries a banner — but **this module must be deleted, not left behind**, when the real endpoints land. A forgotten sample profile that outlives launch is a fake listing on a live marketplace. Its shape deliberately matches what the search and profile endpoints must return, so the swap is a data-source change. |

---

## 4. Risks

Things that could cost significant time, with the cheapest early mitigation.

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Unmasked contact details leak into a public response** | Destroys the entire business model — the product *is* the paywall on contact details | `M2-03.3` tests this explicitly. Mask at the DTO boundary so an entity physically cannot leak. Treat any leak as a P0. |
| R2 | **Double-charging a tutor for one lead** | Direct loss of tutor trust; refund load | Unique constraint `M3-01.3`, idempotency `M3-07.7`, concurrency test `M3-08.3` |
| R3 | **Webhook grants credits more than once** | Direct revenue loss | `M4-03.2` idempotency + `M4-03.6` replay tests |
| R4 | **Cold-start: no tutors means no leads means no tutors** | The classic marketplace failure; no amount of code fixes it | Seed one city densely and manually recruit tutors before opening to parents. Product problem, not an engineering one — but it decides whether any of this matters. |
| R5 | **SEO pages rank slowly or not at all** | The primary acquisition channel underperforms | `M2-07.5` verifies real SSR; ship SEO pages early so indexing has time to mature |
| R6 | **Lead quality complaints from parents** | Churn on the demand side, which is the scarcer side | Unlock cap of 5 (SoT §3.2) is the main defence; watch complaint volume and tune |
| R7 | **Ledger and cached balance drift** | Financial correctness, hard to unpick after the fact | `M3-05.5` reconciliation; ledger is authoritative by design |

---

## 5. Open questions for later milestones

Not urgent, but recording them now so they are not rediscovered under pressure.

- Should tutors see *who* else unlocked a lead, or only the remaining slot count?
- Do we notify a student when their requirement caps out at 5 tutors?
- What happens to a tutor's unlocked leads if their account is later suspended?
- Should an expired requirement be re-postable in one click?
- Do we need Hindi (or a regional language) UI at launch, or is English-first acceptable for the initial city?
- How do we handle a tutor who serves multiple cities — does the travel radius model cover it?

---

## 6. Ready to start now

In order. Nothing below is blocked.

1. `M1-01` — shared web plumbing (error shape, handler, pagination, springdoc, idempotency)
2. `M1-02` — identity schema
3. `M1-03` — OTP flow
4. `M1-04` — JWT sessions, **including T1, the CSRF repayment**

---

## Review cadence

Re-read this file at the start of each milestone. Update the "Last reviewed" date when you do. Its value decays fast if it becomes a write-only file — a stale risk register is worse than none, because it looks like the risks were considered.
