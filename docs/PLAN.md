# ApnaTutor — Roadmap

Living document. Task-level detail per milestone. For *decisions and rules*, see [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md). For *what is actually done*, see [PROGRESS.md](./PROGRESS.md).

**Goal of v1:** a parent posts a tuition requirement for free; matching tutors see it with contact details masked; a tutor spends credits to unlock it; ApnaTutor earns from credit-package sales. No lesson payments, no scheduling, no chat.

---

## M0 — Foundation

- [x] Install Node 24.19.0 LTS, Git 2.55.0
- [x] Install PostgreSQL 18.6 (native Windows service `postgresql-x64-18`), `psql` on PATH
- [x] Backend scaffold — Spring Boot 4.1.1, Java 26, Maven wrapper
- [x] Frontend scaffold — Next.js 16.3.3, React 19.2.8, TypeScript, Tailwind 4
- [x] `scripts/db-setup.sql` — role `apnatutor`, databases `apnatutor_dev` + `apnatutor_test`, `pg_trgm`
- [x] `scripts/db-reset.ps1` — drop, recreate, re-migrate
- [x] `application.yml` + test profile, single repo-root `.env` read by both apps
- [x] Flyway baseline migration `V1__baseline.sql` (`pg_trgm`, `set_updated_at()` trigger fn)
- [x] `SecurityConfig` — default-deny, public health/auth/docs routes, CORS, BCrypt
- [x] Health check reachable from the frontend (proves the whole chain)
- [x] `git init`, `.gitignore`, `.env.example`
- [x] `CLAUDE.md` + the three `docs/` files
- [ ] Global error handler, `ApiError` shape, pagination wrapper — *deferred to M1, where the first real endpoints need them*
- [ ] springdoc-openapi at `/swagger-ui` — *deferred to M1, nothing to document yet*

**Done when:** ~~`mvnw verify` is green, `npm run build` is clean, backend `/actuator/health` reports `db: UP`, and the frontend renders data fetched from the backend.~~ ✅ **All four verified 2026-08-31.**

---

## M1 — Accounts, profiles & trust

- [ ] `users`, `otp_codes`, `refresh_tokens` migrations
- [ ] OTP request/verify (rate-limited: 5 sends/hour/phone, 5 attempts/code, 10 min TTL)
- [ ] `SmsSender` interface + console-logging dev stub
- [ ] JWT access (15 min) + refresh token in HttpOnly cookie (30 days), rotation on use
- [ ] Spring Security config, role-based method authorization
- [ ] Student profile CRUD
- [ ] Tutor profile CRUD — subjects, fees, modes, locations, qualifications, languages
- [ ] `FileStorage` interface + local-disk impl; photo and document upload with type/size validation
- [ ] `verifications` table, badge levels, admin approve/reject queue
- [ ] Profile completeness calculation
- [ ] Frontend: signup/login (OTP), tutor onboarding wizard, profile editor

**Done when:** a tutor can register by phone, complete a full profile, upload an ID, and an admin can approve it — end to end in the browser.

---

## M2 — Catalog & discovery

- [ ] Catalog migrations: `subjects` (tree), `boards`, `grade_levels`, `locations`
- [ ] Seed data: subject taxonomy (Academics → Class N Tuition → Subject; Exam Prep → JEE/NEET/…), boards, grades, and top Indian cities + localities
- [ ] Tutor search: subject + location + filters (fee, mode, gender, experience, rating, verified-only, board, grade)
- [ ] Sorting: relevance, rating, fee, experience, recently active
- [ ] Postgres full-text + GIN/trigram indexes; **verify with `EXPLAIN ANALYZE`, no sequential scans on the hot path**
- [ ] Public tutor profile endpoint (contacts masked)
- [ ] SEO: `/tutors/[city]/[subject]` and `/tutors/[city]/[locality]/[subject]` server-rendered, unique titles/meta, JSON-LD, `sitemap.xml`, `robots.txt`
- [ ] Frontend: search page with filter sidebar, result cards, tutor profile page

**Done when:** search returns correct, fast results and a city×subject landing page renders complete HTML with no JavaScript enabled.

---

## M3 — Requirements & the lead loop

- [ ] `requirements` + `lead_unlocks` migrations
- [ ] Post requirement; `unlock_cost_credits` computed and **locked at creation** (SoT §3.1)
- [ ] Student requirement dashboard; mark HIRED/CLOSED; 30-day expiry job
- [ ] Tutor lead feed — matched on subjects × serviceable locations, masked projection
- [ ] **Unlock endpoint** — the critical path: idempotency key, ledger debit, cap check, contact reveal, intro message, notifications. All in one transaction.
- [ ] Unlock cap enforcement (5), `CAPPED` status transition, removal from other feeds
- [ ] Concurrency: two tutors unlocking the 5th slot simultaneously must not both succeed
- [ ] Notifications both sides
- [ ] Frontend: post-requirement form, student dashboard, tutor lead feed, unlock confirmation

**Done when:** the full loop works and the concurrency test proves the cap holds under parallel unlocks.

---

## M4 — Credits & payments

- [ ] `credit_packages`, `credit_wallets`, `credit_transactions`, `payments` migrations
- [ ] Ledger service — append-only, balance derivation, cache reconciliation, expiry
- [ ] Signup bonus (10 credits at ID_VERIFIED, once, enforced by unique index)
- [ ] Razorpay order creation + **signature-verified** webhook + idempotent credit grant
- [ ] Wallet UI, transaction history, low-balance warning
- [ ] `refund_requests` — tutor dispute, admin decision, credit return, cap slot freed
- [ ] Invoice/receipt generation

**Done when:** a real test-mode payment grants credits exactly once even if the webhook fires three times, and the ledger reconciles to the cached balance.

---

## M5 — Reviews, admin & platform trust

- [ ] `reviews` migration, eligibility rule, moderation workflow, tutor replies
- [ ] Rating aggregation on approval
- [ ] Admin console: verification queue, review moderation, users, credits, refunds, packages
- [ ] Funnel metrics: signups, requirements, unlocks, revenue, conversion
- [ ] Rate limiting on auth + unlock + search
- [ ] `audit_log` on every admin action
- [ ] Abuse reporting; DPDP-style data export + account deletion

**Done when:** an admin can run the marketplace end to end without touching the database.

---

## M6 — Polish & launch

- [ ] Mobile-first responsive pass (assume most traffic is a mid-range Android phone)
- [ ] Empty / loading / error states everywhere
- [ ] Accessibility pass (keyboard, contrast, labels, focus)
- [ ] Seed/demo dataset for a believable walkthrough
- [ ] Playwright E2E of the money path
- [ ] Performance: image optimisation, query budget, Lighthouse
- [ ] Staging deploy, domain, TLS, backups, error tracking, analytics
- [ ] Legal pages: terms, privacy, refund policy

---

## v2 backlog (deliberately deferred)

In-app chat · calendar & lesson booking · lesson payments with escrow + commission · tutor payouts · video classes · coaching-institute accounts · lesson packages · Q&A and articles content hub · mobile apps · Elasticsearch · ranking/recommendations · referral programme · multi-role accounts

---

## Open questions

| # | Question | Needed by |
|---|---|---|
| 1 | Which city do we launch in first? Seed locality data depth depends on it. | M2 |
| 2 | Is `apnatutor.in` actually available? Not yet checked. | M6 |
| 3 | Real credit package prices — the SoT numbers are a starting hypothesis, not researched. | M4 |
| 4 | MSG91 vs Twilio vs Gupshup for OTP (cost per SMS in India differs a lot). | M1 → prod |
| 5 | Do we need GST invoicing on credit purchases from day one? | M4 |
