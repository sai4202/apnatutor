# ApnaTutor — Source of Truth

> **This file is canonical.** If code, comments, or a chat conversation contradict this document, this document wins — or this document gets updated in the same commit. Never let them silently diverge.

**Project:** ApnaTutor — *"Apna tutor, apne ghar ke paas."*
**Started:** 2026-08-31
**Model:** India-first tutor marketplace, lead-credit monetisation.

---

## 1. Domain glossary

Precise meanings. Use these words in code, tables, APIs and UI copy — nowhere else invent a synonym.

| Term | Definition |
|---|---|
| **Student** | The account that seeks tuition. In practice often a parent. Role name is `STUDENT`; UI says "Student / Parent". |
| **Tutor** | The account that supplies tuition. Role `TUTOR`. |
| **Requirement** | A student's posted tuition need (subject, grade, locality, budget…). Free to post. Owned by the student. |
| **Lead** | A Requirement *as seen from a tutor's side*. Not a separate table — same row, different projection. A lead is **masked** until unlocked. |
| **Masked** | Student's name, phone and exact address are hidden. Tutor sees subject, grade, board, locality, budget band, timing and notes. |
| **Unlock** | The act of a tutor spending credits to reveal a lead's contact details. Recorded in `lead_unlocks`. Irreversible except via refund. |
| **Credit** | Prepaid unit tutors spend to unlock. Internal accounting value **₹10 per credit**. Never a currency — always an integer count. |
| **Wallet** | A tutor's *derived* credit balance. Never authoritative on its own — see §4. |
| **Ledger** | `credit_transactions`, append-only. The single authority on how many credits anyone has. |
| **Unlock cap** | Max tutors allowed to unlock one requirement. Protects the parent from being spammed. |
| **Verification** | An admin- or system-confirmed claim about a user (phone, email, ID, education). Drives trust badges. |
| **Engagement** | Any recorded tutor↔student connection. Today the only type is `UNLOCK`; v2 adds `BOOKING`. See §7. |

**Banned words in code:** "booking" (reserved for v2), "order" (reserved for Razorpay payment orders), "match" (ambiguous — say "lead feed" or "search result").

---

## 2. Roles & permissions

| Role | Can |
|---|---|
| `STUDENT` | Post/edit/close own requirements, view tutors (contacts masked), see tutors who unlocked them, leave reviews for tutors they unlocked |
| `TUTOR` | Manage own profile, browse lead feed (masked), unlock leads, buy credits, reply to reviews, raise refund disputes |
| `ADMIN` | Everything above plus verification queue, review moderation, credit adjustments, refunds, package pricing, user suspension |

A user has exactly **one** role. A person wanting both creates two accounts (v1 simplification — revisit only if real users complain).

---

## 3. Business rules (authoritative numbers)

### 3.1 Lead pricing
Cost in credits is a function of the requirement's monthly budget:

| Monthly budget (₹) | Credits |
|---|---|
| < 2,000 | 3 |
| 2,000 – 4,999 | 5 |
| 5,000 – 9,999 | 8 |
| ≥ 10,000 | 12 |

- **Online-only requirements: ×0.8**, rounded up (less commitment, wider supply).
- Price is **locked onto the requirement at creation time** (`requirements.unlock_cost_credits`). Later pricing changes never alter existing leads — tutors must never see a price move under them.

### 3.2 Unlock cap
- **5 tutors maximum** per requirement.
- The 6th unlock attempt is rejected with `LEAD_UNLOCK_CAP_REACHED`; no credits are debited.
- Once capped, the requirement disappears from all other tutors' feeds.
- A refunded unlock **frees its slot** back up.

### 3.3 Free credits
- **10 credits**, granted once, when a tutor reaches verification level `ID_VERIFIED` (phone + email + ID all approved).
- Ledger reason `SIGNUP_BONUS`. Never granted twice — enforced by a unique partial index.

### 3.4 Expiry
| Thing | Lifetime |
|---|---|
| Requirement | 30 days from creation, or until student marks `HIRED` / `CLOSED` |
| Purchased credits | 365 days from purchase |
| Bonus credits | 90 days from grant |
| OTP | 10 minutes, max 5 attempts, max 5 sends per phone per hour |
| Refresh token | 30 days |
| Access token | 15 minutes |

### 3.5 Refunds
- Tutor may dispute an unlock within **7 days**.
- Valid grounds: phone unreachable/invalid, wrong subject or locality, student says they never posted it, duplicate of another requirement.
- Admin decides. Approved → credits returned to ledger with reason `REFUND`, unlock marked `REFUNDED`, cap slot freed.
- A tutor whose dispute-approval rate is healthy but whose *dispute volume* exceeds 30% of unlocks gets flagged for admin review (abuse signal in both directions).

### 3.6 Reviews
- Only a student who **unlocked or was unlocked by** that tutor may review them. One review per student-tutor pair.
- Every review is `PENDING` until an admin approves it. Nothing user-written goes public unmoderated.
- Rating is 1–5 integers. Tutor may post exactly one public reply per review.
- Aggregates (`avg_rating`, `review_count`) are recomputed on approval, never trusted from the client.

---

## 4. The two invariants that protect v2

These are not style preferences. Breaking either one forces a rewrite when we add booking and payments.

### Invariant 1 — Money is an append-only ledger
`credit_transactions` is **insert-only**. No `UPDATE`, no `DELETE`, ever.

```
balance(tutor) = SUM(amount) WHERE tutor_id = ? AND (expires_at IS NULL OR expires_at > now())
```

`credit_wallets.balance` is a **cache** for fast reads, updated in the same transaction as the ledger insert, and reconcilable at any time by replaying the ledger. If the cache and the ledger ever disagree, **the ledger is right**.

Every debit and credit carries a `reason` enum: `PURCHASE`, `SIGNUP_BONUS`, `UNLOCK`, `REFUND`, `ADMIN_ADJUSTMENT`, `EXPIRY`.

Why it matters: v2 commission, tutor payouts and escrow are just new `reason` values and a second ledger. With mutable balances they would be a migration nightmare.

### Invariant 2 — `lead_unlocks` is a generic engagement record
It carries `engagement_type` (`UNLOCK` today) rather than being unlock-specific. A v2 booking becomes `engagement_type = 'BOOKING'` on the same connection graph, so reviews, notifications, and "my students" / "my tutors" lists keep working untouched.

---

## 5. Data model

Tables, in dependency order. `id` is `BIGSERIAL` unless stated. Every table gets `created_at`, `updated_at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`).

**Identity**
- `users` — `phone` (unique, E.164, the login identity), `email` (nullable, unique), `password_hash` (nullable — OTP-only accounts exist), `role`, `status` (`ACTIVE`/`SUSPENDED`/`DELETED`), `phone_verified_at`, `email_verified_at`, `last_active_at`
- `student_profiles` — `user_id` FK unique, `name`, `location_id`
- `tutor_profiles` — `user_id` FK unique, `display_name`, `headline`, `bio`, `photo_url`, `gender`, `date_of_birth`, `experience_years`, `fee_min`, `fee_max`, `fee_unit` (`PER_HOUR`/`PER_MONTH`), `fee_negotiable`, `teaching_modes` (array of `STUDENT_HOME`/`TUTOR_PLACE`/`ONLINE`), `travel_radius_km`, `languages`, `offers_demo`, `availability_note`, `verification_level`, `avg_rating`, `review_count`, `response_rate`, `profile_completeness`, `is_published`

**Catalog** (mostly seed data)
- `subjects` — `name`, `slug` (unique), `parent_id` (self-FK, forms the tree), `is_leaf`, `display_order`
- `boards` — CBSE, ICSE, IB, IGCSE, State boards
- `grade_levels` — Nursery…Class 12, UG, PG, Competitive
- `locations` — `state`, `city`, `locality`, `slug` (unique), `latitude`, `longitude`, `is_city` — flat table, city rows have null locality
- `tutor_subjects` — tutor × subject, plus `fee`, `grade_level_ids`, `board_ids`
- `tutor_locations` — tutor × location (where they will travel)
- `tutor_qualifications` — `degree`, `institution`, `year`, `document_url`, `is_verified`

**Marketplace**
- `requirements` — `student_id`, `subject_id`, `grade_level_id`, `board_id`, `location_id`, `mode`, `budget_amount`, `budget_unit`, `frequency`, `preferred_timing`, `gender_preference`, `description`, `status` (`OPEN`/`CAPPED`/`HIRED`/`CLOSED`/`EXPIRED`), **`unlock_cost_credits`** (locked at creation), `unlock_count`, `expires_at`
- `lead_unlocks` — `requirement_id`, `tutor_id`, `engagement_type`, `credits_spent`, `intro_message`, `status` (`ACTIVE`/`REFUNDED`), `unlocked_at`. **Unique on (requirement_id, tutor_id)**
- `refund_requests` — `lead_unlock_id`, `reason_code`, `details`, `status`, `decided_by`, `decided_at`

**Billing**
- `credit_packages` — `name`, `credits`, `price_paise`, `validity_days`, `is_active`, `display_order`
- `credit_wallets` — `tutor_id` unique, `balance` (cache, see Invariant 1)
- `credit_transactions` — `tutor_id`, `amount` (signed int), `reason`, `reference_type`, `reference_id`, `expires_at`, `balance_after`. **Append-only**
- `payments` — `tutor_id`, `package_id`, `razorpay_order_id`, `razorpay_payment_id`, `amount_paise`, `status` (`CREATED`/`PAID`/`FAILED`), `raw_payload` (JSONB)

**Trust & platform**
- `reviews` — `tutor_id`, `student_id`, `rating`, `title`, `body`, `status`, `tutor_reply`, `moderated_by`. Unique on (tutor_id, student_id)
- `verifications` — `user_id`, `type` (`PHONE`/`EMAIL`/`ID`/`EDUCATION`), `status`, `document_url`, `reviewed_by`, `reviewed_at`, `rejection_reason`
- `otp_codes` — `phone`, `code_hash`, `purpose`, `attempts`, `expires_at`, `consumed_at`
- `refresh_tokens` — `user_id`, `token_hash`, `expires_at`, `revoked_at`
- `notifications` — `user_id`, `type`, `payload` (JSONB), `read_at`, `sent_channels`
- `audit_log` — `actor_user_id`, `action`, `entity_type`, `entity_id`, `before`/`after` (JSONB), `ip`

### Money & precision rules
- **All rupee amounts are stored in paise as `BIGINT`.** Never `FLOAT`, never `DOUBLE`. Column names end in `_paise`.
- Credits are `INTEGER` counts, never fractional.
- All timestamps are `TIMESTAMPTZ`, stored UTC, rendered in `Asia/Kolkata`.

---

## 6. API conventions

Base path `/api/v1`. JSON only. `camelCase` fields.

- Auth: access JWT in `Authorization: Bearer`, refresh token in an **HttpOnly, Secure, SameSite=Lax cookie**. The refresh token never touches JavaScript.
- Errors are uniform:
  ```json
  { "code": "LEAD_UNLOCK_CAP_REACHED", "message": "Human readable", "fieldErrors": { "budget": "must be positive" } }
  ```
  `code` is a stable machine enum — the frontend switches on `code`, never on `message`.
- Lists are paginated: `?page=0&size=20`, response `{ content, page, size, totalElements, totalPages }`.
- Mutating endpoints that spend money (`POST /leads/{id}/unlock`, `POST /payments`) require an **`Idempotency-Key` header**. Replaying a key returns the original result rather than double-charging.
- Public (unauthenticated) endpoints: tutor search, tutor profile (masked), catalog, SEO pages.

---

## 7. Conventions

- Java package root `com.apnatutor`, one package per bounded module (see repo README). **Cross-module calls go through a service interface only** — never reach into another module's repository or entity.
- Entities never leave the service layer. Controllers speak DTOs (Java records).
- Flyway migrations: `V<n>__snake_case_description.sql`, forward-only. **Never edit an applied migration** — write a new one. `ddl-auto` is `validate` everywhere, including local.
- Every `@Transactional` boundary sits on the service, never the controller.
- **`backend/` and `frontend/` are self-contained projects** (ADR #11). Neither may read a file outside its own directory — no shared parent config, no relative paths climbing out. They communicate over HTTP only. Each carries its own `.env`, `.gitignore`, README and `CLAUDE.md`.
- Secrets come from environment variables only. Nothing secret is ever committed; each project's `.env.example` documents its own shape and must be updated in the same commit as any new variable.
- Frontend: Next.js App Router, TypeScript strict, Tailwind. Server Components for public/SEO pages, Client Components only where interactivity demands it.

---

## 8. Environments

| | Local dev |
|---|---|
| DB | `apnatutor_dev` on local PostgreSQL 18, port 5432, role `apnatutor` |
| Test DB | `apnatutor_test`, wiped and re-migrated by the test suite |
| SMS | Console-logging stub — the OTP is printed to the backend log |
| Email | Console-logging stub |
| Payments | Razorpay **test** keys |
| Files | Local disk under `backend/uploads/` |

No Docker in this project — PostgreSQL runs as a native Windows service (`postgresql-x64-18`).

**Configuration is per-project** (ADR #11):

| Project | File | Loaded by |
|---|---|---|
| Backend | `backend/.env` | `spring.config.import` in `application.yml` |
| Frontend | `frontend/.env.local` | Next.js, automatically |

Database setup scripts belong to the backend: `backend/scripts/db-setup.sql` and `backend/scripts/db-reset.ps1`.

---

## 9. Architecture Decision Log

| # | Date | Decision | Why |
|---|---|---|---|
| 1 | 2026-08-31 | Name: **ApnaTutor** | "Apna" = one's own; warm and trust-first, proven pan-India naming pattern (cf. Apna.co). Tutor in the name aids comprehension and SEO. |
| 2 | 2026-08-31 | **Lead-credit** model, not booking-commission | Avoids escrow, refunds, scheduling and disputes in v1 while still earning revenue. Proven by UrbanPro in this exact market. |
| 3 | 2026-08-31 | **Next.js** over Vite SPA | Programmatic SEO pages are the primary acquisition channel; an SPA ships an empty shell and will not rank. |
| 4 | 2026-08-31 | **Java 26**, not an LTS | Spring Initializr lists Java 26 as supported for Boot 4.1.1, and JDK 26 was already installed. Fallback to Temurin 21 if a bytecode-manipulating library breaks. |
| 5 | 2026-08-31 | **Native PostgreSQL**, no Docker | User's explicit choice. Consequence: Testcontainers is unusable, so integration tests run against a real local `apnatutor_test` database. |
| 6 | 2026-08-31 | Money in **paise as BIGINT** | Floating-point currency is a correctness bug waiting to happen. |
| 7 | 2026-08-31 | **Append-only credit ledger** | Makes v2 commission, escrow and payouts additive rather than a migration. |
| 8 | 2026-08-31 | **Unlock cap of 5** per requirement | Lead quality is the product. Uncapped unlocks turn a parent's phone into a spam target and kill retention on both sides. |
| 9 | 2026-08-31 | **Phone + OTP** as primary identity | Indian consumer norm; email-first signup suppresses conversion badly in this market. |
| 10 | 2026-08-31 | One role per account | Simplifies authorization in v1. Revisit only on real user demand. |
| 11 | 2026-08-31 | **`backend/` and `frontend/` are self-contained projects in one repo** | Each builds, tests, runs and deploys from its own directory with its own config, and neither reads a file outside itself — so either can be extracted, containerised or deployed independently without untangling shared paths. They stay in one repo so an API change and its client update can land in a single commit. **Reverses the earlier shared repo-root `.env`**, which coupled the two at the filesystem level; config is now `backend/.env` and `frontend/.env.local`. Shared *product* docs stay in `docs/` because the business rules genuinely bind both sides, and splitting them would invite two diverging copies. |
